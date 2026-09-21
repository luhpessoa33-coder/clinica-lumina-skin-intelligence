import { randomUUID } from "node:crypto";
import { ENV } from "./_core/env";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] ?? character));
}

export function isEmailDeliveryConfigured() {
  return Boolean(ENV.resendApiKey && ENV.authEmailFrom && ENV.appBaseUrl);
}

export async function sendMagicLinkEmail(input: { to: string; recipientName: string; url: string; expiresMinutes: number }) {
  if (!isEmailDeliveryConfigured()) throw new Error("Entrega de e-mail ainda não está configurada no ambiente privado");
  const subject = "Seu acesso seguro à LUmina Skin Intelligence";
  const link = escapeHtml(input.url);
  const name = escapeHtml(input.recipientName);
  const text = `Olá, ${input.recipientName}. Use este link único para acessar a LUmina Skin Intelligence: ${input.url}. Ele expira em ${input.expiresMinutes} minutos. Se você não solicitou este acesso, ignore esta mensagem.`;
  const html = `<main style="font-family:Arial,sans-serif;line-height:1.55;color:#183d37;max-width:560px;margin:auto"><p>Olá, ${name}.</p><p>Use o link único abaixo para acessar a <strong>LUmina Skin Intelligence</strong>. Ele expira em ${input.expiresMinutes} minutos e só pode ser usado uma vez.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#183d37;color:#fff;text-decoration:none">Acessar ambiente protegido</a></p><p style="font-size:12px;color:#657c74">Se você não solicitou este acesso, ignore esta mensagem. Não encaminhe este link.</p></main>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `lumina-auth-${randomUUID()}`,
      "User-Agent": "lumina-clinica/1.0",
    },
    body: JSON.stringify({ from: ENV.authEmailFrom, to: [input.to], subject, html, text }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: unknown; name?: unknown } | null;
    const message = typeof body?.message === "string" ? body.message.toLowerCase() : "";
    if (response.status === 403 && /domain|sender|from/.test(message)) {
      throw new Error("O remetente de e-mail precisa usar exatamente o domínio verificado no Resend");
    }
    if (response.status === 403 && /permission|authorized|api key/.test(message)) {
      throw new Error("A chave de e-mail não está autorizada para enviar mensagens");
    }
    throw new Error(`O provedor de e-mail recusou o envio (${response.status})`);
  }
  const result = await response.json() as { id?: string };
  return { providerMessageId: result.id ?? null };
}
