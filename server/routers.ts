import { COOKIE_NAME } from "@shared/const";
import { revokeRequestSession, sessionCookie } from "./_core/auth";
import { publicProcedure, router } from "./_core/trpc";
import { clinicalRouter } from "./routers/clinical";
import { administrationRouter } from "./routers/admin";

export const appRouter = router({
  system: router({ health: publicProcedure.query(() => ({ ok: true, service: "lumina-clinica-independente" })) }),
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? { id: ctx.user.id, email: ctx.user.email, name: ctx.user.name, role: ctx.user.role } : null),
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
