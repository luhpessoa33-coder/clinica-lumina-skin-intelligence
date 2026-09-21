import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { migrateClinicalSchema, probeDatabase } from "../db";
import { runtimeConfigurationIssues } from "../runtime";
import { createContext } from "./context";
import { ENV } from "./env";
import { serveStatic } from "./static";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function loginRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const previous = loginAttempts.get(key);
  const entry = !previous || previous.resetAt <= now ? { count: 0, resetAt: now + 15 * 60_000 } : previous;
  entry.count += 1;
  loginAttempts.set(key, entry);
  if (entry.count > 8) return res.status(429).json({ error: "Muitas tentativas. Aguarde 15 minutos." });
  next();
}

function findAvailablePort(startPort: number) {
  return new Promise<number>((resolve, reject) => {
    const tryPort = (port: number) => {
      if (port >= startPort + 20) return reject(new Error(`Nenhuma porta disponível após ${startPort}`));
      const probe = net.createServer();
      probe.once("error", () => tryPort(port + 1));
      probe.listen(port, () => probe.close(() => resolve(port)));
    };
    tryPort(startPort);
  });
}

function migrationErrorCodes(error: unknown, visited = new Set<unknown>()): string[] {
  if (!error || typeof error !== "object" || visited.has(error)) return [];
  visited.add(error);
  const record = error as { code?: unknown; cause?: unknown };
  const code = record.code ? [String(record.code)] : [];
  return [...code, ...migrationErrorCodes(record.cause, visited)];
}

function classifyMigrationError(error: unknown) {
  const codes = migrationErrorCodes(error);
  if (codes.some((code) => ["ER_ACCESS_DENIED_ERROR", "ER_DBACCESS_DENIED_ERROR"].includes(code))) return "database_authentication";
  if (codes.some((code) => ["ER_BAD_DB_ERROR", "ER_NO_DB_ERROR"].includes(code))) return "database_target";
  if (codes.some((code) => ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ECONNRESET"].includes(code))) return "database_connectivity";
  if (codes.some((code) => code.startsWith("ER_") || code.startsWith("HY"))) return "migration_schema";
  return "migration_unknown";
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const startupIssues = runtimeConfigurationIssues();
  let migrationState: "pending" | "ready" | "failed" | "skipped" = startupIssues.length ? "skipped" : "pending";
  let migrationFailureReason = "migration_unknown";
  if (startupIssues.length) console.error(`Configuração não está pronta: ${startupIssues.join(", ")}`);
  let storageOrigin = "";
  try { storageOrigin = new URL(ENV.s3Endpoint).origin; } catch { /* readiness handles invalid configuration */ }
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cache-Control", req.path.startsWith("/api/") ? "no-store" : "private, max-age=0");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      const storageSource = storageOrigin ? ` ${storageOrigin}` : "";
      res.setHeader("Content-Security-Policy", `default-src 'self'; connect-src 'self'${storageSource}; img-src 'self' blob: data:${storageSource}; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`);
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: false }));
  app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
  app.get("/readyz", async (_req, res) => {
    if (runtimeConfigurationIssues().length) return res.status(503).json({ ok: false, reason: "configuration" });
    if (migrationState === "pending") return res.status(503).json({ ok: false, reason: "migration_pending" });
    if (migrationState === "failed") return res.status(503).json({ ok: false, reason: migrationFailureReason });
    try {
      await probeDatabase();
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(503).json({ ok: false, reason: "database" });
    }
  });
  app.use("/api/trpc/administration.access.requestLink", loginRateLimit);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  if (process.env.NODE_ENV === "development") {
    // Keep the development server outside of the production bundle.
    const viteModulePath = "./vite";
    const { setupVite } = await import(viteModulePath);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferred = Number.parseInt(process.env.PORT || "3000", 10);
  const port = process.env.NODE_ENV === "production" ? preferred : await findAvailablePort(preferred);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Servidor LUmina disponível na porta ${port}`);
    if (!startupIssues.length) {
      void migrateClinicalSchema()
        .then(() => {
          migrationState = "ready";
          console.log("Migrações clínicas verificadas com sucesso");
        })
        .catch((error) => {
          migrationState = "failed";
          migrationFailureReason = classifyMigrationError(error);
          console.error("Não foi possível aplicar as migrações clínicas", { reason: migrationFailureReason });
        });
    }
  });
}

startServer().catch((error) => { console.error(error); process.exit(1); });
