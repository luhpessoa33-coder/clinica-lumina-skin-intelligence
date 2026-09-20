import "dotenv/config";

const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "DATA_ENCRYPTION_KEY",
  "OWNER_EMAIL",
  "BOOTSTRAP_ADMIN_NAME",
  "APP_BASE_URL",
  "RESEND_API_KEY",
  "AUTH_EMAIL_FROM",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

const missing = required.filter((name) => !process.env[name]?.trim());
const problems: string[] = [];

if ((process.env.JWT_SECRET?.length ?? 0) < 32) problems.push("JWT_SECRET deve ter ao menos 32 caracteres.");
const encryptionKey = Buffer.from(process.env.DATA_ENCRYPTION_KEY ?? "", "base64");
if (encryptionKey.length !== 32) problems.push("DATA_ENCRYPTION_KEY deve decodificar para 32 bytes.");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.OWNER_EMAIL ?? "")) problems.push("OWNER_EMAIL deve conter e-mail válido.");
try {
  const appUrl = new URL(process.env.APP_BASE_URL ?? "");
  if (appUrl.protocol !== "https:") problems.push("APP_BASE_URL deve usar HTTPS.");
} catch { problems.push("APP_BASE_URL deve conter URL HTTPS válida."); }
if (process.env.NODE_ENV === "production" && process.env.DATABASE_SSL === "false") problems.push("DATABASE_SSL não pode ser false em produção.");

if (missing.length || problems.length) {
  console.error("Configuração incompleta ou insegura.");
  if (missing.length) console.error(`Variáveis ausentes: ${missing.join(", ")}`);
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

console.log(`Configuração validada: ${required.length} variáveis obrigatórias presentes; valores não exibidos.`);
