import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSession, sessionCookie, verifyPassword } from "./_core/auth";
import { ENV } from "./_core/env";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { plannerRouter } from "./routers/planner";
import { upsertAdmin } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(12).max(200) })).mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      const allowed = ENV.adminAllowlist.includes(email) && email === ENV.adminEmail;
      if (!allowed || !ENV.adminPasswordHash || !verifyPassword(input.password, ENV.adminPasswordHash)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      }
      const user = await upsertAdmin({ email, passwordHash: ENV.adminPasswordHash, name: "Administradora Lumina", role: "admin" });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível iniciar a sessão" });
      const token = await createSession(user);
      const secure = ctx.req.secure || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.cookie(COOKIE_NAME, token, sessionCookie(secure));
      return { id: user.id, email: user.email, name: user.name, role: user.role };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const secure = ctx.req.secure || ctx.req.headers["x-forwarded-proto"] === "https";
      ctx.res.clearCookie(COOKIE_NAME, { ...sessionCookie(secure), maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  planner: plannerRouter,

});

export type AppRouter = typeof appRouter;
