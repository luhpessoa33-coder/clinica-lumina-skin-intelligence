import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "../_core/env";
import { clinicalProcedure, publicProcedure, router, superAdminProcedure } from "../_core/trpc";
import { createSession, sessionCookie } from "../_core/auth";
import {
  audit,
  canAccessPatient,
  consumeMagicAuthLink,
  countRecentMagicAuthLinks,
  createAppointment,
  createInvitedUser,
  createMagicAuthLink,
  createOwnerUser,
  getApplicationSetting,
  getUserByEmail,
  getUserById,
  listAppointments,
  listAvailableProfessionals,
  listTeamMembers,
  saveEmployeeProfile,
  setApplicationSetting,
} from "../db";
import { isEmailDeliveryConfigured, sendMagicLinkEmail } from "../email";
import { fingerprintIp, fingerprintOneTimeToken } from "../security";
import { geminiRuntimeStatus, testGeminiConnection } from "../ai";
import { PUBLIC_SITE_SETTING_KEY, publicSiteContentOrDefault, publicSiteContentSchema } from "../publicSite";

const emailSchema = z.string().trim().email().max(320).transform((value) => value.toLowerCase());
const roleSchema = z.enum(["admin", "professional"]);

function requestFingerprint(headers: Record<string, string | string[] | undefined>) {
  const forwarded = headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return fingerprintIp(ip);
}

async function issueEmailLink(input: { userId: number; email: string; recipientName: string; purpose: string; actorId?: number | null; ipFingerprint?: string }) {
  if (!isEmailDeliveryConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "O envio de e-mail ainda não foi configurado no cofre privado" });
  const recent = await countRecentMagicAuthLinks(input.email, new Date(Date.now() - 60 * 60 * 1000));
  if (recent >= 5) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Aguarde antes de solicitar outro link" });
  const token = randomBytes(32).toString("base64url");
  const expiresMinutes = 20;
  await createMagicAuthLink({ userId: input.userId, email: input.email, tokenFingerprint: fingerprintOneTimeToken(token), purpose: input.purpose, expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000), createdById: input.actorId ?? null, requestIpFingerprint: input.ipFingerprint });
  const url = `${ENV.appBaseUrl}/acesso?token=${encodeURIComponent(token)}`;
  await sendMagicLinkEmail({ to: input.email, recipientName: input.recipientName, url, expiresMinutes });
}

export const administrationRouter = router({
  access: router({
    requestLink: publicProcedure.input(z.object({ email: emailSchema })).mutation(async ({ input, ctx }) => {
      let user = await getUserByEmail(input.email);
      if (!user && input.email === ENV.ownerEmail) user = await createOwnerUser(ENV.ownerEmail, ENV.bootstrapAdminName);
      if (user?.isActive) {
        try {
          await issueEmailLink({ userId: user.id, email: user.email, recipientName: user.name, purpose: "sign_in", ipFingerprint: requestFingerprint(ctx.req.headers) });
          await audit({ actorId: user.id, action: "auth.magic_link.request", entityType: "user", entityId: String(user.id), ipFingerprint: requestFingerprint(ctx.req.headers) });
        } catch (error) {
          if (input.email === ENV.ownerEmail) throw error;
        }
      }
      return { accepted: true };
    }),
    consumeLink: publicProcedure.input(z.object({ token: z.string().min(32).max(256) })).mutation(async ({ input, ctx }) => {
      const link = await consumeMagicAuthLink(fingerprintOneTimeToken(input.token));
      if (!link) throw new TRPCError({ code: "UNAUTHORIZED", message: "Link inválido, expirado ou já utilizado" });
      const user = await getUserById(link.userId);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Conta indisponível" });
      const token = await createSession(user);
      const secure = ctx.req.secure || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.cookie("lumina_session", token, sessionCookie(secure));
      await audit({ actorId: user.id, action: "auth.magic_link.consume", entityType: "magic_link", entityId: link.id, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    }),
  }),
  team: router({
    list: superAdminProcedure.query(() => listTeamMembers()),
    invite: superAdminProcedure.input(z.object({ email: emailSchema, name: z.string().trim().min(3).max(255), role: roleSchema })).mutation(async ({ input, ctx }) => {
      if (await getUserByEmail(input.email)) throw new TRPCError({ code: "CONFLICT", message: "Já existe uma conta com este e-mail" });
      if (!isEmailDeliveryConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure primeiro o envio de e-mail no cofre privado" });
      const user = await createInvitedUser({ ...input, createdById: ctx.user.id });
      await issueEmailLink({ userId: user.id, email: user.email, recipientName: user.name, purpose: "invite", actorId: ctx.user.id, ipFingerprint: requestFingerprint(ctx.req.headers) });
      await audit({ actorId: ctx.user.id, action: "team.invite", entityType: "user", entityId: String(user.id), metadata: { role: user.role }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id: user.id };
    }),
    saveProfile: superAdminProcedure.input(z.object({ userId: z.number().int().positive(), jobTitle: z.string().trim().max(160).nullable().optional(), employmentStatus: z.enum(["invited", "active", "inactive", "leave", "ended"]), startDate: z.string().date().nullable().optional(), monthlyCompensationCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(), remunerationNotes: z.string().max(10_000).nullable().optional(), profileNotes: z.string().max(10_000).nullable().optional() })).mutation(async ({ input, ctx }) => {
      if (!await getUserById(input.userId)) throw new TRPCError({ code: "NOT_FOUND", message: "Funcionária não encontrada" });
      await saveEmployeeProfile({ ...input, jobTitle: input.jobTitle ?? null, startDate: input.startDate ?? null, monthlyCompensationCents: input.monthlyCompensationCents ?? null, remunerationNotes: input.remunerationNotes ?? null, profileNotes: input.profileNotes ?? null, updatedById: ctx.user.id });
      await audit({ actorId: ctx.user.id, action: "team.profile.save", entityType: "employee_profile", entityId: String(input.userId), metadata: { employmentStatus: input.employmentStatus }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { success: true };
    }),
  }),
  agenda: router({
    list: clinicalProcedure.input(z.object({ from: z.coerce.date(), until: z.coerce.date() })).query(({ input, ctx }) => listAppointments(ctx.user.id, ctx.user.role, input.from, input.until)),
    professionals: clinicalProcedure.query(() => listAvailableProfessionals()),
    create: clinicalProcedure.input(z.object({ patientId: z.string().uuid(), assignedToId: z.number().int().positive(), scheduledStart: z.coerce.date(), scheduledEnd: z.coerce.date(), serviceLabel: z.string().trim().min(1).max(255), privateNote: z.string().max(10_000).nullable().optional() })).mutation(async ({ input, ctx }) => {
      if (input.scheduledEnd <= input.scheduledStart) throw new TRPCError({ code: "BAD_REQUEST", message: "O fim deve ser posterior ao início" });
      if (!await canAccessPatient(ctx.user.id, ctx.user.role, input.patientId)) throw new TRPCError({ code: "FORBIDDEN", message: "Paciente não autorizado" });
      if (ctx.user.role === "professional" && input.assignedToId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Profissional só pode marcar a própria agenda" });
      try {
        const appointment = await createAppointment({ ...input, privateNote: input.privateNote ?? null, createdById: ctx.user.id });
        await audit({ actorId: ctx.user.id, patientId: input.patientId, action: "agenda.create", entityType: "appointment", entityId: appointment.id, metadata: { assignedToId: input.assignedToId, scheduledStart: input.scheduledStart.toISOString() }, ipFingerprint: requestFingerprint(ctx.req.headers) });
        return appointment;
      } catch (error) { throw new TRPCError({ code: "CONFLICT", message: error instanceof Error ? error.message : "Não foi possível marcar" }); }
    }),
  }),
  settings: router({
    secretStatus: superAdminProcedure.query(async () => ({ emailDeliveryConfigured: isEmailDeliveryConfigured(), appBaseUrlConfigured: Boolean(ENV.appBaseUrl), gemini: geminiRuntimeStatus() })),
    publicSite: superAdminProcedure.query(async () => publicSiteContentOrDefault(await getApplicationSetting(PUBLIC_SITE_SETTING_KEY))),
    savePublicSite: superAdminProcedure.input(publicSiteContentSchema).mutation(async ({ input, ctx }) => {
      await setApplicationSetting(PUBLIC_SITE_SETTING_KEY, input, ctx.user.id);
      await audit({ actorId: ctx.user.id, action: "public_site.content.save", entityType: "application_setting", entityId: PUBLIC_SITE_SETTING_KEY, metadata: { services: input.services.length, products: input.products.length }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return publicSiteContentOrDefault(input);
    }),
    aiStatus: superAdminProcedure.query(async () => ({ ...geminiRuntimeStatus(), enabled: Boolean((await getApplicationSetting<{ enabled?: boolean }>("gemini"))?.enabled) })),
    setAiEnabled: superAdminProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ input, ctx }) => {
      if (input.enabled && !ENV.geminiApiKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure GEMINI_API_KEY no cofre privado antes de ativar" });
      await setApplicationSetting("gemini", { enabled: input.enabled }, ctx.user.id);
      await audit({ actorId: ctx.user.id, action: "settings.gemini.toggle", entityType: "application_setting", entityId: "gemini", metadata: { enabled: input.enabled }, ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { enabled: input.enabled };
    }),
    testGemini: superAdminProcedure.mutation(async ({ ctx }) => {
      try {
        const result = await testGeminiConnection();
        await audit({ actorId: ctx.user.id, action: "settings.gemini.test", entityType: "application_setting", entityId: "gemini", metadata: { ok: true }, ipFingerprint: requestFingerprint(ctx.req.headers) });
        return result;
      } catch (error) { throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Teste indisponível" }); }
    }),
  }),
});
