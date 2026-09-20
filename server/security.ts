import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";
import { ENV } from "./_core/env";

function encryptionKey() {
  const key = Buffer.from(ENV.dataEncryptionKey, "base64");
  if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY deve ter 32 bytes em base64");
  return key;
}

function derivedKey(purpose: string) {
  return Buffer.from(hkdfSync("sha256", encryptionKey(), Buffer.from("lumina-clinical-v1"), Buffer.from(purpose), 32));
}

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calculate = (length: number) => {
    const sum = cpf.slice(0, length).split("").reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return calculate(9) === Number(cpf[9]) && calculate(10) === Number(cpf[10]);
}

export function fingerprintCpf(value: string) {
  const cpf = normalizeCpf(value);
  return createHmac("sha256", derivedKey("cpf-fingerprint")).update(`v1:cpf:${cpf}`).digest("hex");
}

export function encryptSensitive(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptSensitive(payload: string) {
  const [version, ivValue, tagValue, ciphertextValue] = payload.split(":");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) throw new Error("Campo cifrado inválido");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}

export function fingerprintIp(value: string | undefined) {
  if (!value) return undefined;
  return createHmac("sha256", derivedKey("ip-fingerprint")).update(`v1:ip:${value}`).digest("hex");
}

export function fingerprintOneTimeToken(value: string) {
  return createHmac("sha256", derivedKey("magic-link-fingerprint")).update(`v1:magic:${value}`).digest("hex");
}
