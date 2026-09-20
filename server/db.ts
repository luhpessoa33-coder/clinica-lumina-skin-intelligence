import { and, desc, eq, gt, gte, inArray, isNull, like, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { randomUUID } from "node:crypto";
import {
  applicationSettings,
  appointments,
  assessments,
  auditLogs,
  consentDocuments,
  employeeProfiles,
  evolutions,
  magicAuthLinks,
  patientConsents,
  patientDocuments,
  patientPhotos,
  patientAssignments,
  patients,
  photoUploadIntents,
  procedures,
  procedureProducts,
  productCatalog,
  quoteItems,
  quotes,
  sessions,
  users,
  type User,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let pool: mysql.Pool | null = null;
let database: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!database && ENV.databaseUrl) {
    pool = mysql.createPool({
      uri: ENV.databaseUrl,
      connectionLimit: 6,
      enableKeepAlive: true,
      ssl: ENV.databaseSsl ? { rejectUnauthorized: ENV.databaseSslRejectUnauthorized } : undefined,
    });
    database = drizzle(pool) as unknown as ReturnType<typeof drizzle>;
  }
  return database;
}

export async function probeDatabase() {
  const db = getDb();
  if (!db) return false;
  await db.execute(sql`SELECT 1`);
  return true;
}

function requiredDb() {
  const db = getDb();
  if (!db) throw new Error("Banco de dados indisponível: DATABASE_URL não configurada");
  return db;
}

export async function getUserByEmail(email: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1))[0];
}

export async function getUserById(id: number) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(and(eq(users.id, id), eq(users.isActive, 1))).limit(1))[0];
}

export async function countUsers() {
  const db = getDb();
  if (!db) return 0;
  const row = (await db.select({ count: sql<number>`count(*)` }).from(users))[0];
  return Number(row?.count ?? 0);
}

export async function createOwnerUser(email: string, name: string) {
  const db = requiredDb();
  await db.insert(users).values({ email: email.trim().toLowerCase(), name, role: "super_admin", isActive: 1 });
  return getUserByEmail(email);
}

export async function createInvitedUser(input: { email: string; name: string; role: "admin" | "professional"; createdById: number }) {
  const db = requiredDb();
  await db.insert(users).values({ email: input.email.trim().toLowerCase(), name: input.name, role: input.role, isActive: 1 });
  const created = await getUserByEmail(input.email);
  if (!created) throw new Error("Não foi possível criar a conta convidada");
  await db.insert(employeeProfiles).values({ userId: created.id, employmentStatus: "invited", updatedById: input.createdById });
  return created;
}

export async function createMagicAuthLink(input: { userId: number; email: string; tokenFingerprint: string; purpose: string; expiresAt: Date; createdById?: number | null; requestIpFingerprint?: string }) {
  const db = requiredDb();
  const id = randomUUID();
  await db.insert(magicAuthLinks).values({ id, userId: input.userId, email: input.email, tokenFingerprint: input.tokenFingerprint, purpose: input.purpose, expiresAt: input.expiresAt, createdById: input.createdById ?? null, requestIpFingerprint: input.requestIpFingerprint ?? null });
  return id;
}

export async function countRecentMagicAuthLinks(email: string, since: Date) {
  const db = getDb();
  if (!db) return 0;
  const row = (await db.select({ count: sql<number>`count(*)` }).from(magicAuthLinks).where(and(eq(magicAuthLinks.email, email.trim().toLowerCase()), gte(magicAuthLinks.createdAt, since))))[0];
  return Number(row?.count ?? 0);
}

export async function consumeMagicAuthLink(tokenFingerprint: string) {
  const db = requiredDb();
  const now = new Date();
  const result = await db.update(magicAuthLinks).set({ usedAt: now }).where(and(eq(magicAuthLinks.tokenFingerprint, tokenFingerprint), isNull(magicAuthLinks.usedAt), gt(magicAuthLinks.expiresAt, now)));
  const affected = Number((result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0);
  if (affected !== 1) return undefined;
  return (await db.select().from(magicAuthLinks).where(eq(magicAuthLinks.tokenFingerprint, tokenFingerprint)).limit(1))[0];
}

export async function listTeamMembers() {
  const db = getDb();
  if (!db) return [];
  return db.select({ id: users.id, email: users.email, name: users.name, role: users.role, isActive: users.isActive, jobTitle: employeeProfiles.jobTitle, employmentStatus: employeeProfiles.employmentStatus, startDate: employeeProfiles.startDate, monthlyCompensationCents: employeeProfiles.monthlyCompensationCents, remunerationNotes: employeeProfiles.remunerationNotes, profileNotes: employeeProfiles.profileNotes }).from(users).leftJoin(employeeProfiles, eq(employeeProfiles.userId, users.id)).orderBy(users.name);
}

export async function saveEmployeeProfile(input: { userId: number; jobTitle?: string | null; employmentStatus: string; startDate?: string | null; monthlyCompensationCents?: number | null; remunerationNotes?: string | null; profileNotes?: string | null; updatedById: number }) {
  const db = requiredDb();
  const startDate = input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null;
  await db.insert(employeeProfiles).values({ userId: input.userId, jobTitle: input.jobTitle ?? null, employmentStatus: input.employmentStatus, startDate, monthlyCompensationCents: input.monthlyCompensationCents ?? null, remunerationNotes: input.remunerationNotes ?? null, profileNotes: input.profileNotes ?? null, updatedById: input.updatedById }).onDuplicateKeyUpdate({ set: { jobTitle: input.jobTitle ?? null, employmentStatus: input.employmentStatus, startDate, monthlyCompensationCents: input.monthlyCompensationCents ?? null, remunerationNotes: input.remunerationNotes ?? null, profileNotes: input.profileNotes ?? null, updatedById: input.updatedById } });
}

export async function listAvailableProfessionals() {
  const db = getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, role: users.role }).from(users).where(and(eq(users.isActive, 1), inArray(users.role, ["super_admin", "admin", "professional"])));
}

export async function getApplicationSetting<T>(settingKey: string): Promise<T | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const item = (await db.select().from(applicationSettings).where(eq(applicationSettings.settingKey, settingKey)).limit(1))[0];
  return item?.value as T | undefined;
}

export async function setApplicationSetting(settingKey: string, value: unknown, updatedById: number) {
  const db = requiredDb();
  await db.insert(applicationSettings).values({ settingKey, value, updatedById }).onDuplicateKeyUpdate({ set: { value, updatedById } });
}

export async function upsertBootstrapAdmin(data: Pick<User, "email" | "name" | "passwordHash">) {
  const db = requiredDb();
  const now = new Date();
  await db.insert(users).values({
    email: data.email.trim().toLowerCase(), name: data.name, passwordHash: data.passwordHash,
    role: "super_admin", isActive: 1, lastSignedIn: now,
  }).onDuplicateKeyUpdate({
    set: { name: data.name, passwordHash: data.passwordHash, role: "super_admin", isActive: 1, lastSignedIn: now },
  });
  return getUserByEmail(data.email);
}

export async function createSessionRecord(userId: number, expiresAt: Date) {
  const db = requiredDb();
  const id = randomUUID().replace(/-/g, "");
  await db.insert(sessions).values({ id, userId, expiresAt });
  return id;
}

export async function getActiveSession(sessionId: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(sessions).where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt))).limit(1))[0];
}

export async function revokeSession(sessionId: string) {
  const db = requiredDb();
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
}

export async function audit(input: { actorId?: number | null; patientId?: string | null; action: string; entityType: string; entityId?: string | null; metadata?: Record<string, unknown>; ipFingerprint?: string }) {
  const db = requiredDb();
  await db.insert(auditLogs).values({ actorId: input.actorId ?? null, patientId: input.patientId ?? null, action: input.action, entityType: input.entityType, entityId: input.entityId ?? null, metadata: input.metadata ?? null, ipFingerprint: input.ipFingerprint ?? null });
}

export async function findPatientByCpfFingerprint(cpfFingerprint: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(patients).where(eq(patients.cpfFingerprint, cpfFingerprint)).limit(1))[0];
}

export async function createPatient(input: { fullName: string; cpfCiphertext: string; cpfFingerprint: string; birthDate?: string | null; contactCiphertext?: string | null; actorId: number }) {
  const db = requiredDb();
  const id = randomUUID();
  const birthDate = input.birthDate ? new Date(`${input.birthDate}T00:00:00.000Z`) : null;
  await db.transaction(async (tx) => {
    await tx.insert(patients).values({ id, fullName: input.fullName, cpfCiphertext: input.cpfCiphertext, cpfFingerprint: input.cpfFingerprint, birthDate, contactCiphertext: input.contactCiphertext ?? null, createdById: input.actorId });
    await tx.insert(patientAssignments).values({ patientId: id, userId: input.actorId, assignedById: input.actorId });
  });
  return (await db.select().from(patients).where(eq(patients.id, id)).limit(1))[0];
}

export async function canAccessPatient(userId: number, role: string, patientId: string) {
  if (role === "super_admin" || role === "admin") return true;
  const db = getDb();
  if (!db) return false;
  return Boolean((await db.select({ patientId: patientAssignments.patientId }).from(patientAssignments).where(and(eq(patientAssignments.patientId, patientId), eq(patientAssignments.userId, userId))).limit(1))[0]);
}

export async function searchPatients(term: string, userId: number, role: string) {
  const db = getDb();
  if (!db) return [];
  const normalized = term.trim().replace(/[%_]/g, "");
  if (role === "professional") {
    return db.select({ id: patients.id, fullName: patients.fullName, status: patients.status, updatedAt: patients.updatedAt }).from(patients).innerJoin(patientAssignments, eq(patientAssignments.patientId, patients.id)).where(and(isNull(patients.archivedAt), eq(patientAssignments.userId, userId), like(patients.fullName, `%${normalized}%`))).orderBy(desc(patients.updatedAt)).limit(50);
  }
  return db.select({ id: patients.id, fullName: patients.fullName, status: patients.status, updatedAt: patients.updatedAt }).from(patients).where(and(isNull(patients.archivedAt), like(patients.fullName, `%${normalized}%`))).orderBy(desc(patients.updatedAt)).limit(50);
}

export async function assignPatientToProfessional(patientId: string, userId: number, assignedById: number) {
  const db = requiredDb();
  await db.insert(patientAssignments).values({ patientId, userId, assignedById }).onDuplicateKeyUpdate({ set: { assignedById } });
}

export async function getPatient(patientId: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(patients).where(eq(patients.id, patientId)).limit(1))[0];
}

export async function createAppointment(input: { patientId: string; assignedToId: number; scheduledStart: Date; scheduledEnd: Date; serviceLabel: string; privateNote?: string | null; createdById: number }) {
  const db = requiredDb();
  const conflict = (await db.select({ id: appointments.id }).from(appointments).where(and(eq(appointments.assignedToId, input.assignedToId), lt(appointments.scheduledStart, input.scheduledEnd), gt(appointments.scheduledEnd, input.scheduledStart), eq(appointments.status, "scheduled"))).limit(1))[0];
  if (conflict) throw new Error("Já existe um atendimento neste intervalo para a profissional selecionada");
  const id = randomUUID();
  await db.insert(appointments).values({ id, patientId: input.patientId, assignedToId: input.assignedToId, scheduledStart: input.scheduledStart, scheduledEnd: input.scheduledEnd, serviceLabel: input.serviceLabel, privateNote: input.privateNote ?? null, createdById: input.createdById });
  return (await db.select().from(appointments).where(eq(appointments.id, id)).limit(1))[0];
}

export async function listAppointments(actorId: number, role: string, from: Date, until: Date) {
  const db = getDb();
  if (!db) return [];
  const scope = role === "professional" ? eq(appointments.assignedToId, actorId) : undefined;
  return db.select({ id: appointments.id, patientId: appointments.patientId, patientName: patients.fullName, assignedToId: appointments.assignedToId, professionalName: users.name, scheduledStart: appointments.scheduledStart, scheduledEnd: appointments.scheduledEnd, status: appointments.status, serviceLabel: appointments.serviceLabel, privateNote: appointments.privateNote }).from(appointments).innerJoin(patients, eq(patients.id, appointments.patientId)).innerJoin(users, eq(users.id, appointments.assignedToId)).where(and(gte(appointments.scheduledStart, from), lt(appointments.scheduledStart, until), scope)).orderBy(appointments.scheduledStart);
}

export async function createAssessment(input: { patientId: string; authorId: number; assessmentData: Record<string, unknown>; summaryText?: string | null; redFlags: string[]; status: "draft" | "completed" }) {
  const db = requiredDb();
  const id = randomUUID();
  await db.insert(assessments).values({ id, patientId: input.patientId, authorId: input.authorId, assessmentData: input.assessmentData, summaryText: input.summaryText ?? null, redFlags: input.redFlags, status: input.status, completedAt: input.status === "completed" ? new Date() : null });
  return id;
}

export async function createEvolution(input: { patientId: string; authorId: number; assessmentId?: string | null; occurredAt: Date; evolutionType: string; privateNote?: string | null }) {
  const db = requiredDb();
  const id = randomUUID();
  await db.insert(evolutions).values({ ...input, id });
  return id;
}

export async function listPatientTimeline(patientId: string) {
  const db = getDb();
  if (!db) return { assessments: [], evolutions: [], photos: [], documents: [] };
  const [assessmentRows, evolutionRows, photoRows, documentRows] = await Promise.all([
    db.select().from(assessments).where(eq(assessments.patientId, patientId)).orderBy(desc(assessments.createdAt)),
    db.select().from(evolutions).where(eq(evolutions.patientId, patientId)).orderBy(desc(evolutions.occurredAt)),
    db.select().from(patientPhotos).where(and(eq(patientPhotos.patientId, patientId), isNull(patientPhotos.deletedAt))).orderBy(desc(patientPhotos.createdAt)),
    db.select().from(patientDocuments).where(and(eq(patientDocuments.patientId, patientId), isNull(patientDocuments.deletedAt))).orderBy(desc(patientDocuments.createdAt)),
  ]);
  return { assessments: assessmentRows, evolutions: evolutionRows, photos: photoRows, documents: documentRows };
}

export async function savePhotoMetadata(input: typeof patientPhotos.$inferInsert) {
  const db = requiredDb();
  await db.insert(patientPhotos).values(input);
}

export async function getActivePhotoByKey(patientId: string, objectKey: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(patientPhotos).where(and(eq(patientPhotos.patientId, patientId), eq(patientPhotos.objectKey, objectKey), isNull(patientPhotos.deletedAt))).limit(1))[0];
}

export async function createPhotoUploadIntent(input: typeof photoUploadIntents.$inferInsert) {
  const db = requiredDb();
  await db.insert(photoUploadIntents).values(input);
}

export async function getActiveImageConsent(patientId: string, consentId: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(patientConsents).where(and(eq(patientConsents.id, consentId), eq(patientConsents.patientId, patientId), eq(patientConsents.consentType, "image_clinical"), isNull(patientConsents.revokedAt))).limit(1))[0];
}

export async function reservePhotoUploadIntent(intentId: string, userId: number) {
  const db = requiredDb();
  const token = randomUUID();
  const now = new Date();
  await db.update(photoUploadIntents).set({ state: "reserving", reservationToken: token, reservedById: userId, reservedAt: now }).where(and(eq(photoUploadIntents.id, intentId), eq(photoUploadIntents.state, "authorized"), gt(photoUploadIntents.expiresAt, now)));
  return (await db.select().from(photoUploadIntents).where(and(eq(photoUploadIntents.id, intentId), eq(photoUploadIntents.reservationToken, token), eq(photoUploadIntents.state, "reserving"))).limit(1))[0];
}

export async function releasePhotoUploadIntent(intentId: string, reservationToken: string) {
  const db = requiredDb();
  await db.update(photoUploadIntents).set({ state: "authorized", reservationToken: null, reservedById: null, reservedAt: null }).where(and(eq(photoUploadIntents.id, intentId), eq(photoUploadIntents.reservationToken, reservationToken), eq(photoUploadIntents.state, "reserving")));
}

export async function commitPhotoUploadIntent(intentId: string, reservationToken: string, photo: typeof patientPhotos.$inferInsert, auditEntry: { actorId: number; ipFingerprint?: string }) {
  const db = requiredDb();
  await db.transaction(async (tx) => {
    await tx.update(photoUploadIntents).set({ state: "consumed", consumedAt: new Date() }).where(and(eq(photoUploadIntents.id, intentId), eq(photoUploadIntents.reservationToken, reservationToken), eq(photoUploadIntents.state, "reserving")));
    const intent = (await tx.select().from(photoUploadIntents).where(and(eq(photoUploadIntents.id, intentId), eq(photoUploadIntents.reservationToken, reservationToken), eq(photoUploadIntents.state, "consumed"))).limit(1))[0];
    if (!intent) throw new Error("Upload não pode ser confirmado");
    await tx.insert(patientPhotos).values(photo);
    await tx.insert(auditLogs).values({ actorId: auditEntry.actorId, patientId: photo.patientId, action: "photo.upload.confirm", entityType: "photo", entityId: photo.id, metadata: { contentType: photo.contentType, byteSize: photo.byteSize }, ipFingerprint: auditEntry.ipFingerprint ?? null });
  });
}

export async function getEvolutionForPatient(evolutionId: string, patientId: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(evolutions).where(and(eq(evolutions.id, evolutionId), eq(evolutions.patientId, patientId))).limit(1))[0];
}

export async function addConsent(input: typeof patientConsents.$inferInsert) {
  const db = requiredDb();
  await db.insert(patientConsents).values(input);
}

export async function getPatientConsent(patientId: string, consentId: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(patientConsents).where(and(eq(patientConsents.id, consentId), eq(patientConsents.patientId, patientId), isNull(patientConsents.revokedAt))).limit(1))[0];
}

export async function saveSignedConsentDocument(input: typeof patientDocuments.$inferInsert) {
  const db = requiredDb();
  await db.insert(patientDocuments).values(input);
}

export async function getSignedConsentDocument(patientId: string, consentId: string, objectKey: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(patientDocuments).where(and(eq(patientDocuments.patientId, patientId), eq(patientDocuments.consentId, consentId), eq(patientDocuments.objectKey, objectKey), isNull(patientDocuments.deletedAt))).limit(1))[0];
}

export async function createConsentDocument(input: { title: string; consentType: string; procedureId?: string | null; version: string; templateMarkdown: string; contentHash: string; createdById: number }) {
  const db = requiredDb();
  const id = randomUUID();
  await db.insert(consentDocuments).values({ id, title: input.title, consentType: input.consentType, procedureId: input.procedureId ?? null, version: input.version, templateMarkdown: input.templateMarkdown, contentHash: input.contentHash, createdById: input.createdById });
  return id;
}

export async function approveConsentDocument(id: string, approvedById: number) {
  const db = requiredDb();
  await db.update(consentDocuments).set({ status: "approved", approvedAt: new Date(), approvedById }).where(and(eq(consentDocuments.id, id), eq(consentDocuments.status, "draft")));
  return (await db.select().from(consentDocuments).where(and(eq(consentDocuments.id, id), eq(consentDocuments.status, "approved"))).limit(1))[0];
}

export async function getConsentDocument(id: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(consentDocuments).where(eq(consentDocuments.id, id)).limit(1))[0];
}

export async function listConsentDocuments(procedureId?: string) {
  const db = getDb();
  if (!db) return [];
  return procedureId ? db.select().from(consentDocuments).where(eq(consentDocuments.procedureId, procedureId)).orderBy(desc(consentDocuments.updatedAt)) : db.select().from(consentDocuments).orderBy(desc(consentDocuments.updatedAt));
}

export async function getProcedureById(id: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(procedures).where(eq(procedures.id, id)).limit(1))[0];
}

export async function listProducts() {
  const db = getDb();
  if (!db) return [];
  return db.select().from(productCatalog).orderBy(desc(productCatalog.updatedAt));
}

export async function saveProduct(input: { id?: string; name: string; category?: string | null; description?: string | null; defaultCents: number; active: boolean; actorId: number }) {
  const db = requiredDb();
  const id = input.id ?? randomUUID();
  await db.insert(productCatalog).values({ id, name: input.name, category: input.category ?? null, description: input.description ?? null, defaultCents: input.defaultCents, active: input.active ? 1 : 0, createdById: input.actorId }).onDuplicateKeyUpdate({ set: { name: input.name, category: input.category ?? null, description: input.description ?? null, defaultCents: input.defaultCents, active: input.active ? 1 : 0 } });
  return id;
}

export async function listProceduresWithProducts() {
  const db = getDb();
  if (!db) return [];
  const [procedureRows, relations] = await Promise.all([db.select().from(procedures).orderBy(desc(procedures.updatedAt)), db.select().from(procedureProducts)]);
  return procedureRows.map((procedure) => ({ ...procedure, productIds: relations.filter((relation) => relation.procedureId === procedure.id).map((relation) => relation.productId) }));
}

export async function getActiveProceduresByIds(ids: string[]) {
  const db = getDb();
  if (!db || !ids.length) return [];
  return db.select().from(procedures).where(and(inArray(procedures.id, ids), eq(procedures.active, 1)));
}

export async function saveProcedure(input: { id?: string; name: string; internalNote?: string | null; defaultCents: number; active: boolean; productIds: string[]; actorId: number }) {
  const db = requiredDb();
  const id = input.id ?? randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(procedures).values({ id, name: input.name, internalNote: input.internalNote ?? null, defaultCents: input.defaultCents, active: input.active ? 1 : 0, createdById: input.actorId }).onDuplicateKeyUpdate({ set: { name: input.name, internalNote: input.internalNote ?? null, defaultCents: input.defaultCents, active: input.active ? 1 : 0 } });
    await tx.delete(procedureProducts).where(eq(procedureProducts.procedureId, id));
    if (input.productIds.length) await tx.insert(procedureProducts).values(input.productIds.map((productId) => ({ procedureId: id, productId })));
  });
  return id;
}

export async function createQuote(input: { patientId: string; createdById: number; validUntil?: string | null; commercialMessage?: string | null; items: Array<{ sourceType: string; sourceId?: string | null; description: string; unitCents: number; quantity: number; discountPercent: number }> }) {
  const db = requiredDb();
  const patient = await getPatient(input.patientId);
  if (!patient) throw new Error("Paciente não encontrado");
  const id = randomUUID();
  const validUntil = input.validUntil ? new Date(`${input.validUntil}T00:00:00.000Z`) : null;
  const items = input.items.map((item) => ({ ...item, id: randomUUID(), subtotalCents: Math.round(item.unitCents * item.quantity * (100 - item.discountPercent) / 100) }));
  const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
  await db.transaction(async (tx) => {
    await tx.insert(quotes).values({ id, patientId: input.patientId, createdById: input.createdById, clientNameSnapshot: patient.fullName, validUntil, commercialMessage: input.commercialMessage ?? null, totalCents });
    if (items.length) await tx.insert(quoteItems).values(items.map((item) => ({ id: item.id, quoteId: id, sourceType: item.sourceType, sourceId: item.sourceId ?? null, description: item.description, unitCents: item.unitCents, quantity: item.quantity, discountPercent: item.discountPercent, subtotalCents: item.subtotalCents })));
  });
  return { id, totalCents, clientNameSnapshot: patient.fullName };
}

export async function getQuoteForClientDocument(quoteId: string) {
  const db = getDb();
  if (!db) return undefined;
  const quote = (await db.select().from(quotes).where(and(eq(quotes.id, quoteId), eq(quotes.status, "issued"))).limit(1))[0];
  if (!quote) return undefined;
  const items = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  return { quote, items };
}

export async function getQuoteById(quoteId: string) {
  const db = getDb();
  if (!db) return undefined;
  return (await db.select().from(quotes).where(eq(quotes.id, quoteId)).limit(1))[0];
}

export async function issueQuote(quoteId: string) {
  const db = requiredDb();
  await db.update(quotes).set({ status: "issued", issuedAt: new Date() }).where(and(eq(quotes.id, quoteId), eq(quotes.status, "draft")));
  return (await db.select().from(quotes).where(and(eq(quotes.id, quoteId), eq(quotes.status, "issued"))).limit(1))[0];
}
