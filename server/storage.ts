import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { ENV } from "./_core/env";

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function client() {
  if (!ENV.s3Endpoint || !ENV.s3Bucket || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new Error("Armazenamento R2 não configurado");
  }
  return new S3Client({
    region: ENV.s3Region,
    endpoint: ENV.s3Endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: ENV.s3AccessKeyId, secretAccessKey: ENV.s3SecretAccessKey },
  });
}

export function assertPhotoUpload(contentType: string, byteSize: number) {
  if (!allowedImageTypes.has(contentType)) throw new Error("Formato de foto não permitido");
  if (!Number.isInteger(byteSize) || byteSize <= 0 || byteSize > ENV.uploadMaxBytes) throw new Error("Tamanho de foto inválido");
}

export function assertSignedDocumentUpload(contentType: string, byteSize: number) {
  if (contentType !== "application/pdf") throw new Error("O termo digitalizado deve ser enviado em PDF");
  const maxBytes = Math.min(ENV.uploadMaxBytes, 15_000_000);
  if (!Number.isInteger(byteSize) || byteSize <= 0 || byteSize > maxBytes) throw new Error("Tamanho de PDF inválido");
}

function checksumBase64(sha256: string) {
  if (!/^[a-f0-9]{64}$/i.test(sha256)) throw new Error("Checksum SHA-256 inválido");
  return Buffer.from(sha256, "hex").toString("base64");
}

export async function createPrivatePhotoUpload(patientId: string, contentType: string, byteSize: number, sha256: string) {
  assertPhotoUpload(contentType, byteSize);
  const extension = allowedImageTypes.get(contentType)!;
  const objectKey = `patients/${patientId}/${randomUUID()}.${extension}`;
  const checksumSha256 = checksumBase64(sha256);
  const uploadUrl = await getSignedUrl(client(), new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: objectKey,
    ContentType: contentType,
    ChecksumSHA256: checksumSha256,
  }), { expiresIn: 300 });
  return { objectKey, uploadUrl, checksumSha256, expiresInSeconds: 300 };
}

export async function createPrivateSignedDocumentUpload(patientId: string, contentType: string, byteSize: number, sha256: string) {
  assertSignedDocumentUpload(contentType, byteSize);
  const objectKey = `patients/${patientId}/documents/${randomUUID()}.pdf`;
  const checksumSha256 = checksumBase64(sha256);
  const uploadUrl = await getSignedUrl(client(), new PutObjectCommand({ Bucket: ENV.s3Bucket, Key: objectKey, ContentType: contentType, ChecksumSHA256: checksumSha256 }), { expiresIn: 300 });
  return { objectKey, uploadUrl, checksumSha256, expiresInSeconds: 300 };
}

export async function getPrivatePhotoUrl(objectKey: string) {
  if (!objectKey.startsWith("patients/")) throw new Error("Chave de foto inválida");
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: objectKey }), { expiresIn: 300 });
}

export async function headPrivatePhoto(objectKey: string) {
  if (!objectKey.startsWith("patients/")) throw new Error("Chave de foto inválida");
  const response = await client().send(new HeadObjectCommand({ Bucket: ENV.s3Bucket, Key: objectKey }));
  return { contentType: response.ContentType ?? "", byteSize: response.ContentLength ?? 0, checksumSha256: response.ChecksumSHA256 ?? "" };
}

export async function headPrivateDocument(objectKey: string) {
  if (!objectKey.startsWith("patients/") || !objectKey.includes("/documents/")) throw new Error("Chave de documento inválida");
  const response = await client().send(new HeadObjectCommand({ Bucket: ENV.s3Bucket, Key: objectKey }));
  return { contentType: response.ContentType ?? "", byteSize: response.ContentLength ?? 0, checksumSha256: response.ChecksumSHA256 ?? "" };
}
