import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSession, revokeRequestSession, sessionCookie, verifyPassword } from "./_core/auth";
import { ENV } from "./_core/env";
import { publicProcedure, router } from "./_core/trpc";
import { audit, getUserByEmail, upsertBootstrapAdmin } from "./db";
import { clinicalRouter } from "./routers/clinical";
import { administrationRouter } from "./routers/admin";
import { fingerprintIp } from "./security";

function requestFingerprint(headers: Record<string, string | string[] | undefined>) {
  const forwarded = headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return fingerprintIp(ip);
}

export const appRouter = router({
  system: router({ health: publicProcedure.query(() => ({ ok: true, service: "lumina-clinica-independente" })) }),
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? { id: ctx.user.id, email: ctx.user.email, name: ctx.user.name, role: ctx.user.role } : null),
    login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(12).max(200) })).mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      let user = await getUserByEmail(email);
      if (!user && email === ENV.bootstrapAdminEmail && ENV.bootstrapAdminPasswordHash && verifyPassword(input.password, ENV.bootstrapAdminPasswordHash)) {
        user = await upsertBootstrapAdmin({ email, name: ENV.bootstrapAdminName, passwordHash: ENV.bootstrapAdminPasswordHash });
      }
      if (!user || !user.isActive || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      }
      const token = await createSession(user);
      const secure = ctx.req.secure || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.cookie(COOKIE_NAME, token, sessionCookie(secure));
      await audit({ actorId: user.id, action: "auth.login", entityType: "user", entityId: String(user.id), ipFingerprint: requestFingerprint(ctx.req.headers) });
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      await revokeRequestSession(ctx.req);
      const secure = ctx.req.secure || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.clearCookie(COOKIE_NAME, { ...sessionCookie(secure), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  clinical: clinicalRouter,
  administration: administrationRouter,
});

export type AppRouter = typeof appRouter;
