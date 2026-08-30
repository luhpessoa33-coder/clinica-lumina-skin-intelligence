import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";

const key = () => {
  if (!ENV.jwtSecret || ENV.jwtSecret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(ENV.jwtSecret);
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, expectedHex] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSession(user: User) {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" }).setSubject(String(user.id)).setIssuedAt().setExpirationTime("30d").sign(key());
}

export async function readSession(req: Request) {
  const cookie = req.headers.cookie?.split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;
  try {
    const token = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
    const { payload } = await jwtVerify(token, key());
    return { id: Number(payload.sub), email: String(payload.email), role: String(payload.role) };
  } catch { return null; }
}

export function sessionCookie(secure: boolean) {
  return { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: ONE_YEAR_MS };
}

export function fingerprint(value: string) { return createHash("sha256").update(value).digest("hex").slice(0, 12); }
