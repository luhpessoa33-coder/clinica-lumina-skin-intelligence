import { createHash } from "node:crypto";

const allowedTokens = ["{{PACIENTE_NOME}}", "{{PROCEDIMENTO_NOME}}", "{{DATA_REGISTRO}}", "{{HORA_REGISTRO}}", "{{PROFISSIONAL_NOME}}"] as const;

export function documentHash(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function validateConsentTemplate(template: string) {
  if (!template.trim() || template.length > 30_000) throw new Error("O termo deve ter entre 1 e 30.000 caracteres");
  const tokens = template.match(/{{[A-Z_]+}}/g) ?? [];
  if (tokens.some((token) => !allowedTokens.includes(token as typeof allowedTokens[number]))) {
    throw new Error("O termo contém marcador não permitido");
  }
}

export function renderConsentTemplate(template: string, values: { patientName: string; procedureName: string; recordedAt: Date; professionalName: string }) {
  validateConsentTemplate(template);
  const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", dateStyle: "short" }).format(values.recordedAt);
  const time = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", timeStyle: "short", hour12: false }).format(values.recordedAt);
  const tokens: Record<(typeof allowedTokens)[number], string> = {
    "{{PACIENTE_NOME}}": values.patientName,
    "{{PROCEDIMENTO_NOME}}": values.procedureName,
    "{{DATA_REGISTRO}}": date,
    "{{HORA_REGISTRO}}": time,
    "{{PROFISSIONAL_NOME}}": values.professionalName,
  };
  return template.replace(/{{[A-Z_]+}}/g, (token) => tokens[token as typeof allowedTokens[number]] ?? token);
}
