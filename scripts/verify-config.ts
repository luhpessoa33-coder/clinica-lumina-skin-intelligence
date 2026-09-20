import "dotenv/config";

const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "DATA_ENCRYPTION_KEY",
  "BOOTSTRAP_ADMIN_EMAIL",
  "BOOTSTRAP_ADMIN_PASSWORD_HASH",
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
if (!/^scrypt\$[a-f0-9]+\$[a-f0-9]+$/i.test(process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH ?? "")) problems.push("BOOTSTRAP_ADMIN_PASSWORD_HASH deve estar no formato scrypt.");
if (process.env.NODE_ENV === "production" && process.env.DATABASE_SSL === "false") problems.push("DATABASE_SSL não pode ser false em produção.");

if (missing.length || problems.length) {
  console.error("Configuração incompleta ou insegura.");
  if (missing.length) console.error(`Variáveis ausentes: ${missing.join(", ")}`);
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

console.log(`Configuração validada: ${required.length} variáveis obrigatórias presentes; valores não exibidos.`);
