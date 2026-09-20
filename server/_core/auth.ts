import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { createSessionRecord, getActiveSession, revokeSession } from "../db";
import { ENV } from "./env";

const SESSION_MS = 12 * 60 * 60 * 1000;

function key() {
  if (!ENV.jwtSecret || ENV.jwtSecret.length < 32) throw new Error("JWT_SECRET deve conter ao menos 32 caracteres");
  return new TextEncoder().encode(ENV.jwtSecret);
}

function cookieToken(req: Request) {
  const cookie = req.headers.cookie?.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  try { return decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)); }
  catch { return null; }
}

export async function createSession(user: User) {
  const expiresAt = new Date(Date.now() + SESSION_MS);
  const sessionId = await createSessionRecord(user.id, expiresAt);
  return new SignJWT({ email: user.email, role: user.role, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id)).setIssuedAt().setExpirationTime(Math.floor(expiresAt.getTime() / 1000)).sign(key());
}

export async function readSession(req: Request) {
  const token = cookieToken(req);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    const sessionId = String(payload.sid ?? "");
    const userId = Number(payload.sub);
    if (!sessionId || !Number.isInteger(userId)) return null;
    const stored = await getActiveSession(sessionId);
    if (!stored || stored.userId !== userId || stored.expiresAt <= new Date()) return null;
    return { id: userId, email: String(payload.email), role: String(payload.role), sessionId };
  } catch { return null; }
}

export async function revokeRequestSession(req: Request) {
  const session = await readSession(req);
  if (session) await revokeSession(session.sessionId);
}

export function sessionCookie(secure: boolean) {
  return { httpOnly: true, secure, sameSite: "strict" as const, path: "/", maxAge: SESSION_MS };
}
