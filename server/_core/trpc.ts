import { UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });
export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  if (!ctx.user.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "Conta inativa" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requireClinicalAccess = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  if (!["super_admin", "admin", "professional"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso clínico não autorizado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const requireSuperAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  if (ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso reservado à super administração" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const clinicalProcedure = t.procedure.use(requireClinicalAccess);
export const superAdminProcedure = t.procedure.use(requireSuperAdmin);
export const adminProcedure = superAdminProcedure;
