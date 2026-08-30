import type { Request, Response } from "express";
import { isOverdue } from "@shared/planner";
import { ENV } from "../_core/env";
import { notifyOwner } from "../_core/notification";
import { getUserByEmail, listPlannerItems, savePlannerItem } from "../db";

export async function plannerAlertsHandler(req: Request, res: Response) {
  try {
    const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, "") || String(req.headers["x-cron-secret"] ?? "");
    if (!ENV.cronSecret || supplied !== ENV.cronSecret) return res.status(403).json({ error: "cron-only" });

    const owner = await getUserByEmail(ENV.adminEmail);
    if (!owner) return res.json({ ok: true, skipped: "owner-not-initialized" });

    const items = await listPlannerItems(owner.id);
    const day = new Date().toISOString().slice(0, 10);
    if (items.some(item => item.referenceId === `daily-alert-${day}`)) {
      return res.json({ ok: true, skipped: "already-notified" });
    }

    const overdue = items.filter(item => isOverdue(item.status, item.dueAt));
    const critical = items.filter(item => item.priority === "critica" && item.status !== "concluido");
    const licenses = items.filter(item => item.module === "license" && ["pendente", "revisao_local"].includes(item.status));
    const purchases = items.filter(item => item.module === "purchase" && item.priority === "critica" && item.status !== "concluido");
    if (!(overdue.length || licenses.length || purchases.length)) {
      return res.json({ ok: true, skipped: "no-alerts" });
    }

    const sent = await notifyOwner({
      title: "Clínica Lumina — pendências de implantação",
      content: `${overdue.length} tarefa(s) vencida(s), ${licenses.length} licença(s) em revisão e ${purchases.length} compra(s) crítica(s) pendente(s). Abra o painel para atualizar responsáveis, prazos e evidências.`,
    });
    await savePlannerItem(owner.id, {
      module: "notification_run",
      referenceId: `daily-alert-${day}`,
      title: `Checagem diária ${day}`,
      category: "Automação",
      status: sent ? "concluido" : "pendente",
      priority: critical.length ? "alta" : "media",
      details: JSON.stringify({ overdue: overdue.length, licenses: licenses.length, purchases: purchases.length, sent }),
    });
    return res.json({ ok: true, sent, overdue: overdue.length, licenses: licenses.length, purchases: purchases.length });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}
