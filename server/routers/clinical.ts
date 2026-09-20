import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  addConsent,
  assignPatientToProfessional,
  audit,
  canAccessPatient,
  commitPhotoUploadIntent,
  createAssessment,
  createEvolution,
  createPatient,
  createPhotoUploadIntent,
  createQuote,
  createConsentDocument,
  findPatientByCpfFingerprint,
  getActiveImageConsent,
  getPatientConsent,
  getSignedConsentDocument,
  getActivePhotoByKey,
  getActiveProceduresByIds,
  getEvolutionForPatient,
  getQuoteForClientDocument,
  getQuoteById,
  getConsentDocument,
  getProcedureById,
  getPatient,
  issueQuote,
  listConsentDocuments,
  listProceduresWithProducts,
  listProducts,
  listPatientTimeline,
  releasePhotoUploadIntent,
  reservePhotoUploadIntent,
  saveProcedure,
  saveSignedConsentDocument,
  saveProduct,
  searchPatients,
  approveConsentDocument,
} from "../db";
import { documentHash, renderConsentTemplate, validateConsentTemplate } from "../consents";
import { clinicalProcedure, router, superAdminProcedure } from "../_core/trpc";
import { encryptSensitive, fingerprintCpf, fingerprintIp, isValidCpf, normalizeCpf } from "../security";
import { createPrivatePhotoUpload, createPrivateSignedDocumentUpload, getPrivatePhotoUrl, headPrivateDocument, headPrivatePhoto } from "../storage";

const patientId = z.string().uuid();
const sha256 = z.string().regex(/^[a-f0-9]{64}$/i, "Checksum SHA-256 inválido");

function requestFingerprint(headers: Record<string, string | string[] | undefined>) {
  const forwarded = headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return fingerprintIp(ip);
}

async function requirePatient(patientIdValue: string, user: { id: number; role: string }) {
  const patient = await getPatient(patientIdValue);
  if (!patient || patient.archivedAt) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
  if (!await canAccessPatient(user.id, user.role, patientIdValue)) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso ao prontuário não autorizado" });
  return patient;
}

export const clinicalRouter = router({
  patients: router({
    search: clinicalProcedure.input(z.object({ term: z.string().trim().min(1).max(120) })).query(async ({ input, ctx }) => {
      const result = await searchPatients(input.term, ctx.user.id, ctx.user.role);
      await audit({ actorId: ctx.user.id, action: "patient.search", entityType: "patient", metadata: { resultCount: result.length }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return result;
    }),
    create: clinicalProcedure.input(z.object({
      fullName: z.string().trim().min(3).max(255),
      cpf: z.string().min(11).max(32),
      birthDate: z.string().date().nullable().optional(),
      contact: z.string().trim().max(255).nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (!isValidCpf(input.cpf)) throw new TRPCError({ code: "BAD_REQUEST", message: "CPF inválido" });
      const cpfFingerprint = fingerprintCpf(input.cpf);
      if (await findPatientByCpfFingerprint(cpfFingerprint)) {
        throw new TRPCError({ code: "CONFLICT", message: "Já existe um registro para este CPF" });
      }
      const patient = await createPatient({
        fullName: input.fullName,
        cpfCiphertext: encryptSensitive(normalizeCpf(input.cpf)),
        cpfFingerprint,
        birthDate: input.birthDate ?? null,
        contactCiphertext: input.contact?.trim() ? encryptSensitive(input.contact.trim()) : null,
        actorId: ctx.user.id,
      });
      await audit({ actorId: ctx.user.id, patientId: patient.id, action: "patient.create", entityType: "patient", entityId: patient.id, metadata: { hasBirthDate: Boolean(input.birthDate), hasContact: Boolean(input.contact) }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id: patient.id, fullName: patient.fullName, createdAt: patient.createdAt };
    }),
    timeline: clinicalProcedure.input(z.object({ patientId })).query(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      const timeline = await listPatientTimeline(input.patientId);
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "patient.timeline.view", entityType: "patient", entityId: input.patientId, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return timeline;
    }),
    assignProfessional: superAdminProcedure.input(z.object({ patientId, userId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const patient = await getPatient(input.patientId);
      if (!patient || patient.archivedAt) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
      await assignPatientToProfessional(input.patientId, input.userId, ctx.user.id);
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "patient.assign_professional", entityType: "patient_assignment", entityId: `${input.patientId}:${input.userId}`, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { success: true };
    }),
  }),
  consents: router({
    templates: router({
      list: clinicalProcedure.input(z.object({ procedureId: z.string().uuid().optional() })).query(async ({ input, ctx }) => {
        const documents = await listConsentDocuments(input.procedureId);
        return ctx.user.role === "super_admin" ? documents : documents.filter((document) => document.status === "approved");
      }),
      createDraft: superAdminProcedure.input(z.object({ title: z.string().trim().min(3).max(255), consentType: z.string().trim().min(3).max(80), procedureId: z.string().uuid(), version: z.string().trim().min(1).max(80), templateMarkdown: z.string().min(1).max(30_000) })).mutation(async ({ input, ctx }) => {
        const procedure = await getProcedureById(input.procedureId);
        if (!procedure) throw new TRPCError({ code: "NOT_FOUND", message: "Procedimento não encontrado" });
        try { validateConsentTemplate(input.templateMarkdown); }
        catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Modelo inválido" }); }
        const id = await createConsentDocument({ ...input, contentHash: documentHash(input.templateMarkdown), createdById: ctx.user.id });
        await audit({ actorId: ctx.user.id, action: "consent.template.create_draft", entityType: "consent_document", entityId: id, metadata: { procedureId: input.procedureId, version: input.version }, ipFingerprint: requestFingerprint(ctx.req.headers) });
        return { id };
      }),
      approve: superAdminProcedure.input(z.object({ documentId: z.string().uuid() })).mutation(async ({ input, ctx }) => {
        const document = await approveConsentDocument(input.documentId, ctx.user.id);
        if (!document) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Somente um rascunho pode ser aprovado" });
        await audit({ actorId: ctx.user.id, action: "consent.template.approve", entityType: "consent_document", entityId: input.documentId, metadata: { version: document.version }, ipFingerprint: requestFingerprint(ctx.req.headers) });
        return { id: document.id, status: document.status, approvedAt: document.approvedAt };
      }),
    }),
    recordImageClinical: clinicalProcedure.input(z.object({
      patientId,
      documentVersion: z.string().trim().min(1).max(80),
      acceptedAt: z.coerce.date(),
      acceptedByName: z.string().trim().min(3).max(255),
      evidenceHash: sha256.optional(),
    })).mutation(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      const id = randomUUID();
      await addConsent({ id, patientId: input.patientId, consentType: "image_clinical", documentVersion: input.documentVersion, acceptedAt: input.acceptedAt, acceptedByName: input.acceptedByName, evidenceHash: input.evidenceHash ?? null, collectedById: ctx.user.id });
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "consent.image.record", entityType: "consent", entityId: id, metadata: { documentVersion: input.documentVersion }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id };
    }),
    previewProcedure: clinicalProcedure.input(z.object({ patientId, documentId: z.string().uuid() })).query(async ({ input, ctx }) => {
      const patient = await requirePatient(input.patientId, ctx.user);
      const document = await getConsentDocument(input.documentId);
      if (!document || document.status !== "approved" || !document.procedureId) throw new TRPCError({ code: "NOT_FOUND", message: "Termo aprovado não encontrado" });
      const procedure = await getProcedureById(document.procedureId);
      if (!procedure) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Procedimento associado não encontrado" });
      const rendered = renderConsentTemplate(document.templateMarkdown, { patientName: patient.fullName, procedureName: procedure.name, recordedAt: new Date(), professionalName: ctx.user.name });
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "consent.preview", entityType: "consent_document", entityId: document.id, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { title: document.title, procedureName: procedure.name, version: document.version, rendered };
    }),
    recordProcedure: clinicalProcedure.input(z.object({ patientId, documentId: z.string().uuid(), acceptedByName: z.string().trim().min(3).max(255), signatureMethod: z.enum(["declaracao_registrada", "assinatura_digital", "assinatura_manual_digitalizada"]) })).mutation(async ({ input, ctx }) => {
      const patient = await requirePatient(input.patientId, ctx.user);
      const document = await getConsentDocument(input.documentId);
      if (!document || document.status !== "approved" || !document.procedureId) throw new TRPCError({ code: "NOT_FOUND", message: "Termo aprovado não encontrado" });
      const procedure = await getProcedureById(document.procedureId);
      if (!procedure) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Procedimento associado não encontrado" });
      const acceptedAt = new Date();
      const rendered = renderConsentTemplate(document.templateMarkdown, { patientName: patient.fullName, procedureName: procedure.name, recordedAt: acceptedAt, professionalName: ctx.user.name });
      const id = randomUUID();
      await addConsent({ id, patientId: input.patientId, consentType: document.consentType, documentId: document.id, procedureId: procedure.id, documentTitleSnapshot: document.title, documentVersion: document.version, documentHash: document.contentHash, renderedSnapshot: rendered, acceptedAt, acceptedByName: input.acceptedByName, signatureMethod: input.signatureMethod, evidenceHash: documentHash(`${document.contentHash}:${acceptedAt.toISOString()}:${input.acceptedByName}`), collectedById: ctx.user.id });
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "consent.procedure.record", entityType: "consent", entityId: id, metadata: { documentId: document.id, procedureId: procedure.id, version: document.version, signatureMethod: input.signatureMethod }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id, acceptedAt, rendered };
    }),
  }),
  assessments: router({
    save: clinicalProcedure.input(z.object({
      patientId,
      assessmentData: z.record(z.string(), z.unknown()),
      summaryText: z.string().max(20_000).nullable().optional(),
      redFlags: z.array(z.string().max(500)).max(30),
      status: z.enum(["draft", "completed"]),
    })).mutation(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      const id = await createAssessment({ ...input, authorId: ctx.user.id, summaryText: input.summaryText ?? null });
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: `assessment.${input.status}`, entityType: "assessment", entityId: id, metadata: { redFlagCount: input.redFlags.length }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id };
    }),
  }),
  evolutions: router({
    create: clinicalProcedure.input(z.object({
      patientId,
      assessmentId: z.string().uuid().nullable().optional(),
      occurredAt: z.coerce.date(),
      evolutionType: z.string().trim().min(1).max(80),
      privateNote: z.string().max(20_000).nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      const id = await createEvolution({ ...input, assessmentId: input.assessmentId ?? null, privateNote: input.privateNote ?? null, authorId: ctx.user.id });
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "evolution.create", entityType: "evolution", entityId: id, metadata: { type: input.evolutionType }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id };
    }),
  }),
  photos: router({
    createUpload: clinicalProcedure.input(z.object({
      patientId,
      consentId: z.string().uuid(),
      contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
      byteSize: z.number().int().positive(),
      sha256,
    })).mutation(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      const consent = await getActiveImageConsent(input.patientId, input.consentId);
      if (!consent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Consentimento clínico de imagem ativo é obrigatório" });
      const upload = await createPrivatePhotoUpload(input.patientId, input.contentType, input.byteSize, input.sha256);
      const id = randomUUID();
      await createPhotoUploadIntent({ id, patientId: input.patientId, consentId: input.consentId, objectKey: upload.objectKey, contentType: input.contentType, byteSize: input.byteSize, sha256: input.sha256.toLowerCase(), expiresAt: new Date(Date.now() + upload.expiresInSeconds * 1000), createdById: ctx.user.id });
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "photo.upload.authorize", entityType: "photo_upload", entityId: id, metadata: { contentType: input.contentType, byteSize: input.byteSize }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { uploadIntentId: id, uploadUrl: upload.uploadUrl, expiresInSeconds: upload.expiresInSeconds, requiredHeaders: { "content-type": input.contentType, "x-amz-checksum-sha256": upload.checksumSha256 } };
    }),
    confirmUpload: clinicalProcedure.input(z.object({
      uploadIntentId: z.string().uuid(),
      evolutionId: z.string().uuid().nullable().optional(),
      capturedAt: z.coerce.date().nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const intent = await reservePhotoUploadIntent(input.uploadIntentId, ctx.user.id);
      if (!intent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Upload expirado, já confirmado ou inexistente" });
      try {
        await requirePatient(intent.patientId, ctx.user);
        const [consent, evolution] = await Promise.all([
          getActiveImageConsent(intent.patientId, intent.consentId),
          input.evolutionId ? getEvolutionForPatient(input.evolutionId, intent.patientId) : Promise.resolve(undefined),
        ]);
        if (!consent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Consentimento de imagem não está mais ativo" });
        if (input.evolutionId && !evolution) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Evolução não pertence ao paciente" });
        const head = await headPrivatePhoto(intent.objectKey);
        const expectedChecksum = Buffer.from(intent.sha256, "hex").toString("base64");
        if (head.contentType !== intent.contentType || head.byteSize !== intent.byteSize || head.checksumSha256 !== expectedChecksum) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Integridade do arquivo não confirmada" });
        }
        const photoId = randomUUID();
        const extension = intent.contentType === "image/png" ? "png" : intent.contentType === "image/webp" ? "webp" : "jpg";
        await commitPhotoUploadIntent(input.uploadIntentId, intent.reservationToken!, { id: photoId, patientId: intent.patientId, evolutionId: input.evolutionId ?? null, consentId: intent.consentId, objectKey: intent.objectKey, originalFilename: `imagem-clinica.${extension}`, contentType: intent.contentType, byteSize: intent.byteSize, sha256: intent.sha256, capturedAt: input.capturedAt ?? null, uploadedById: ctx.user.id }, { actorId: ctx.user.id, ipFingerprint: requestFingerprint(ctx.req.headers) });
        return { id: photoId };
      } catch (error) {
        await releasePhotoUploadIntent(input.uploadIntentId, intent.reservationToken!);
        throw error;
      }
    }),
    viewUrl: clinicalProcedure.input(z.object({ patientId, objectKey: z.string().min(10).max(512) })).query(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      if (!input.objectKey.startsWith(`patients/${input.patientId}/`) || !await getActivePhotoByKey(input.patientId, input.objectKey)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Foto não pertence ao paciente informado" });
      }
      const url = await getPrivatePhotoUrl(input.objectKey);
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "photo.view.authorize", entityType: "photo", entityId: input.objectKey, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { url, expiresInSeconds: 300 };
    }),
  }),
  documents: router({
    createSignedConsentUpload: clinicalProcedure.input(z.object({ patientId, consentId: z.string().uuid(), contentType: z.literal("application/pdf"), byteSize: z.number().int().positive(), sha256 })).mutation(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      const consent = await getPatientConsent(input.patientId, input.consentId);
      if (!consent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Termo registrado e ativo é obrigatório" });
      try {
        const upload = await createPrivateSignedDocumentUpload(input.patientId, input.contentType, input.byteSize, input.sha256);
        await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "signed_consent.upload.authorize", entityType: "patient_document", entityId: upload.objectKey, metadata: { consentId: input.consentId, byteSize: input.byteSize }, ipFingerprint: requestFingerprint(ctx.req.headers) });
        return { ...upload, requiredHeaders: { "content-type": input.contentType, "x-amz-checksum-sha256": upload.checksumSha256 } };
      } catch (error) { throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Não foi possível preparar o arquivo" }); }
    }),
    confirmSignedConsentUpload: clinicalProcedure.input(z.object({ patientId, consentId: z.string().uuid(), objectKey: z.string().min(20).max(512), byteSize: z.number().int().positive(), sha256 })).mutation(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      if (!input.objectKey.startsWith(`patients/${input.patientId}/documents/`)) throw new TRPCError({ code: "FORBIDDEN", message: "Documento não pertence ao paciente informado" });
      if (!await getPatientConsent(input.patientId, input.consentId)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Termo registrado e ativo é obrigatório" });
      const head = await headPrivateDocument(input.objectKey);
      const expectedChecksum = Buffer.from(input.sha256, "hex").toString("base64");
      if (head.contentType !== "application/pdf" || head.byteSize !== input.byteSize || head.checksumSha256 !== expectedChecksum) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Integridade do PDF não confirmada" });
      const id = randomUUID();
      await saveSignedConsentDocument({ id, patientId: input.patientId, consentId: input.consentId, documentType: "signed_consent_pdf", objectKey: input.objectKey, contentType: "application/pdf", byteSize: input.byteSize, sha256: input.sha256.toLowerCase(), uploadedById: ctx.user.id });
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "signed_consent.upload.confirm", entityType: "patient_document", entityId: id, metadata: { consentId: input.consentId, byteSize: input.byteSize }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id };
    }),
    viewSignedConsent: clinicalProcedure.input(z.object({ patientId, consentId: z.string().uuid(), objectKey: z.string().min(20).max(512) })).query(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      if (!await getSignedConsentDocument(input.patientId, input.consentId, input.objectKey)) throw new TRPCError({ code: "FORBIDDEN", message: "Documento não pertence ao termo informado" });
      const url = await getPrivatePhotoUrl(input.objectKey);
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "signed_consent.view.authorize", entityType: "patient_document", entityId: input.objectKey, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { url, expiresInSeconds: 300 };
    }),
  }),
  catalog: router({
    list: clinicalProcedure.query(async () => ({ products: await listProducts(), procedures: await listProceduresWithProducts() })),
    saveProduct: superAdminProcedure.input(z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(255), category: z.string().trim().max(120).nullable().optional(), description: z.string().max(10_000).nullable().optional(), defaultCents: z.number().int().min(0).max(100_000_000), active: z.boolean() })).mutation(async ({ input, ctx }) => {
      const id = await saveProduct({ ...input, category: input.category ?? null, description: input.description ?? null, actorId: ctx.user.id });
      await audit({ actorId: ctx.user.id, action: "catalog.product.save", entityType: "product", entityId: id, metadata: { active: input.active }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id };
    }),
    saveProcedure: superAdminProcedure.input(z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(255), internalNote: z.string().max(10_000).nullable().optional(), defaultCents: z.number().int().min(0).max(100_000_000), active: z.boolean(), productIds: z.array(z.string().uuid()).max(100) })).mutation(async ({ input, ctx }) => {
      const id = await saveProcedure({ ...input, internalNote: input.internalNote ?? null, productIds: [...new Set(input.productIds)], actorId: ctx.user.id });
      await audit({ actorId: ctx.user.id, action: "catalog.procedure.save", entityType: "procedure", entityId: id, metadata: { productCount: input.productIds.length, active: input.active }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id };
    }),
  }),
  quotes: router({
    create: clinicalProcedure.input(z.object({ patientId, validUntil: z.string().date().nullable().optional(), commercialMessage: z.string().max(5_000).nullable().optional(), items: z.array(z.discriminatedUnion("sourceType", [
      z.object({ sourceType: z.literal("procedure"), sourceId: z.string().uuid(), description: z.string().trim().max(255).optional(), unitCents: z.number().int().min(0).max(100_000_000).optional(), quantity: z.number().int().min(1).max(100), discountPercent: z.number().int().min(0).max(100) }),
      z.object({ sourceType: z.literal("manual"), sourceId: z.string().uuid().nullable().optional(), description: z.string().trim().min(1).max(255), unitCents: z.number().int().min(0).max(100_000_000), quantity: z.number().int().min(1).max(100), discountPercent: z.number().int().min(0).max(100) }),
    ])).min(1).max(50) })).mutation(async ({ input, ctx }) => {
      await requirePatient(input.patientId, ctx.user);
      const procedureIds = input.items.filter((item) => item.sourceType === "procedure").map((item) => item.sourceId);
      const activeProcedures = await getActiveProceduresByIds(procedureIds);
      const procedureById = new Map(activeProcedures.map((procedure) => [procedure.id, procedure]));
      const canonicalItems = input.items.map((item) => {
        if (item.sourceType === "manual") return item;
        const procedure = procedureById.get(item.sourceId);
        if (!procedure) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Procedimento não está ativo no catálogo" });
        return { sourceType: "procedure" as const, sourceId: procedure.id, description: procedure.name, unitCents: procedure.defaultCents, quantity: item.quantity, discountPercent: item.discountPercent };
      });
      const quote = await createQuote({ patientId: input.patientId, validUntil: input.validUntil ?? null, commercialMessage: input.commercialMessage ?? null, createdById: ctx.user.id, items: canonicalItems });
      await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "quote.create", entityType: "quote", entityId: quote.id, metadata: { itemCount: input.items.length, totalCents: quote.totalCents }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return quote;
    }),
    issue: clinicalProcedure.input(z.object({ quoteId: z.string().uuid() })).mutation(async ({ input, ctx }) => {
      const existing = await getQuoteById(input.quoteId);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      await requirePatient(existing.patientId, ctx.user);
      const quote = await issueQuote(input.quoteId);
      if (!quote) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Orçamento não está disponível para emissão" });
      await audit({ actorId: ctx.user.id, action: "quote.issue", entityType: "quote", entityId: input.quoteId, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { success: true };
    }),
    clientDocument: clinicalProcedure.input(z.object({ quoteId: z.string().uuid() })).query(async ({ input, ctx }) => {
      const data = await getQuoteForClientDocument(input.quoteId);
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado" });
      await requirePatient(data.quote.patientId, ctx.user);
      await audit({ actorId: ctx.user.id, patientId: data.quote.patientId, action: "quote.client_document.view", entityType: "quote", entityId: input.quoteId, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return data;
    }),
  }),
});
