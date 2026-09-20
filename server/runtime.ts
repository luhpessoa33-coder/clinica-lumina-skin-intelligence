import { ENV } from "./_core/env";

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

export function runtimeConfigurationIssues() {
  const issues: string[] = [];
  for (const name of required) if (!process.env[name]?.trim()) issues.push(name);
  if (ENV.jwtSecret.length < 32) issues.push("JWT_SECRET_FORMAT");
  if (Buffer.from(ENV.dataEncryptionKey, "base64").length !== 32) issues.push("DATA_ENCRYPTION_KEY_FORMAT");
  if (ENV.databaseSsl === false) issues.push("DATABASE_SSL_REQUIRED");
  if (!Number.isInteger(ENV.uploadMaxBytes) || ENV.uploadMaxBytes < 1 || ENV.uploadMaxBytes > 20_000_000) issues.push("UPLOAD_MAX_BYTES_RANGE");
  try {
    const endpoint = new URL(ENV.s3Endpoint);
    if (endpoint.protocol !== "https:") issues.push("S3_ENDPOINT_HTTPS_REQUIRED");
  } catch { issues.push("S3_ENDPOINT_FORMAT"); }
  return [...new Set(issues)];
}
