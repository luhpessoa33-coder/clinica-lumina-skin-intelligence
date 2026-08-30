import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { readSession } from "./auth";

export type TrpcContext = { req: CreateExpressContextOptions["req"]; res: CreateExpressContextOptions["res"]; user: User | null };

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const session = await readSession(opts.req);
  const user = session ? (await getUserById(session.id)) ?? null : null;
  return { req: opts.req, res: opts.res, user };
}
