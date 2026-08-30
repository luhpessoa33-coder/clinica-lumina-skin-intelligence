import { z } from "zod";
import catalog from "../../shared/data/catalogo.json";
import budget from "../../shared/data/orcamento.json";
import procedureInputs from "../../shared/data/insumos.json";
import coldChain from "../../shared/data/cadeia_fria.json";
import { addAttachment, ensurePlannerSeed, listAttachments, listPlannerItems, removePlannerItem, savePlannerItem } from "../db";
import { storageGetSignedUrl, storagePut } from "../storage";
import { adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { regulatedItemBlockReason } from "@shared/planner";

const itemInput = z.object({
  id: z.number().optional(), module: z.string().min(1).max(40), referenceId: z.string().min(1).max(80),
  title: z.string().min(1).max(255), category: z.string().max(120).nullable().optional(), status: z.string().max(40),
  priority: z.string().max(24), quantity: z.string().max(32).nullable().optional(), unit: z.string().max(32).nullable().optional(),
  plannedCents: z.number().int().min(0).default(0), quotedCents: z.number().int().min(0).default(0),
  contractedCents: z.number().int().min(0).default(0), paidCents: z.number().int().min(0).default(0),
  dueAt: z.date().nullable().optional(), responsible: z.string().max(120).nullable().optional(),
  brandModel: z.string().max(255).nullable().optional(), supplier: z.string().max(255).nullable().optional(),
  validationStatus: z.string().max(80).nullable().optional(), details: z.string().max(8000).nullable().optional(),
});

export const plannerRouter = router({
  list: adminProcedure.query(({ ctx }) => ensurePlannerSeed(ctx.user.id)),
  seed: adminProcedure.mutation(({ ctx }) => ensurePlannerSeed(ctx.user.id)),
  save: adminProcedure.input(itemInput).mutation(({ ctx, input }) => {
    const blockReason = regulatedItemBlockReason(input.title, input.status, input.validationStatus);
    if (blockReason) throw new TRPCError({ code: "PRECONDITION_FAILED", message: blockReason });
    const { id: _id, ...item } = input;
    return savePlannerItem(ctx.user.id, item);
  }),
  remove: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await removePlannerItem(ctx.user.id, input.id); return { success: true } as const;
  }),
  referenceData: adminProcedure.query(() => ({ catalog, budget, procedureInputs, coldChain })),
  attachments: adminProcedure.query(async ({ ctx }) => Promise.all((await listAttachments(ctx.user.id)).map(async file => ({ ...file, url: await storageGetSignedUrl(file.fileKey) })))),
  upload: adminProcedure.input(z.object({
    itemId: z.number().nullable().optional(), fileName: z.string().min(1).max(255), mimeType: z.string().min(1).max(120),
    sizeBytes: z.number().int().positive().max(10_000_000), base64: z.string().min(1).max(14_000_000),
  })).mutation(async ({ ctx, input }) => {
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uploaded = await storagePut(`lumina/${ctx.user.id}/${Date.now()}-${safeName}`, Buffer.from(input.base64, "base64"), input.mimeType);
    await addAttachment({ userId: ctx.user.id, itemId: input.itemId ?? null, fileKey: uploaded.key, url: uploaded.url, fileName: input.fileName, mimeType: input.mimeType, sizeBytes: input.sizeBytes });
    return uploaded;
  }),
});
