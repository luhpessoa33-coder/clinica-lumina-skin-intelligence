import {
  bigint,
  date,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Schema para TiDB Cloud (MySQL). Não contém dados reais.
 * CPF é persistido somente de forma cifrada e pesquisado por impressão criptográfica.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: text("password_hash"),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 32 }).notNull().default("professional"),
  isActive: int("is_active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  lastSignedIn: timestamp("last_signed_in"),
}, (table) => ({
  emailUnique: uniqueIndex("users_email_unique").on(table.email),
}));

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  revokedAt: datetime("revoked_at", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userExpiryIndex: index("sessions_user_expiry_idx").on(table.userId, table.expiresAt),
}));

export const magicAuthLinks = mysqlTable("magic_auth_links", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 320 }).notNull(),
  tokenFingerprint: varchar("token_fingerprint", { length: 64 }).notNull(),
  purpose: varchar("purpose", { length: 48 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  usedAt: datetime("used_at", { mode: "date" }),
  createdById: int("created_by_id").references(() => users.id, { onDelete: "set null" }),
  requestIpFingerprint: varchar("request_ip_fingerprint", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tokenUnique: uniqueIndex("magic_link_fingerprint_unique").on(table.tokenFingerprint),
  userExpiryIndex: index("magic_link_user_expiry_idx").on(table.userId, table.expiresAt),
  ipCreatedIndex: index("magic_link_ip_created_idx").on(table.requestIpFingerprint, table.createdAt),
}));

export const employeeProfiles = mysqlTable("employee_profiles", {
  userId: int("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  jobTitle: varchar("job_title", { length: 160 }),
  employmentStatus: varchar("employment_status", { length: 48 }).notNull().default("active"),
  startDate: date("start_date"),
  monthlyCompensationCents: bigint("monthly_compensation_cents", { mode: "number", unsigned: true }),
  remunerationNotes: text("remuneration_notes"),
  profileNotes: text("profile_notes"),
  updatedById: int("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const applicationSettings = mysqlTable("application_settings", {
  settingKey: varchar("setting_key", { length: 120 }).primaryKey(),
  value: json("value").notNull(),
  updatedById: int("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const patients = mysqlTable("patients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  cpfCiphertext: text("cpf_ciphertext").notNull(),
  cpfFingerprint: varchar("cpf_fingerprint", { length: 64 }).notNull(),
  birthDate: date("birth_date"),
  contactCiphertext: text("contact_ciphertext"),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  createdById: int("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  archivedAt: datetime("archived_at", { mode: "date" }),
}, (table) => ({
  cpfFingerprintUnique: uniqueIndex("patients_cpf_fingerprint_unique").on(table.cpfFingerprint),
  nameIndex: index("patients_name_idx").on(table.fullName),
}));

export const patientAssignments = mysqlTable("patient_assignments", {
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedById: int("assigned_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  assignmentUnique: uniqueIndex("patient_assignment_unique").on(table.patientId, table.userId),
  userPatientIndex: index("patient_assignment_user_patient_idx").on(table.userId, table.patientId),
}));

export const patientConsents = mysqlTable("patient_consents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  consentType: varchar("consent_type", { length: 80 }).notNull(),
  documentId: varchar("document_id", { length: 36 }),
  procedureId: varchar("procedure_id", { length: 36 }),
  documentTitleSnapshot: varchar("document_title_snapshot", { length: 255 }),
  documentVersion: varchar("document_version", { length: 80 }).notNull(),
  documentHash: varchar("document_hash", { length: 64 }),
  renderedSnapshot: text("rendered_snapshot"),
  acceptedAt: datetime("accepted_at", { mode: "date" }).notNull(),
  acceptedByName: varchar("accepted_by_name", { length: 255 }).notNull(),
  signatureMethod: varchar("signature_method", { length: 64 }).notNull().default("declaracao_registrada"),
  evidenceHash: varchar("evidence_hash", { length: 64 }),
  collectedById: int("collected_by_id").notNull().references(() => users.id),
  revokedAt: datetime("revoked_at", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  patientConsentIndex: index("consents_patient_type_idx").on(table.patientId, table.consentType),
}));

export const assessments = mysqlTable("assessments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  authorId: int("author_id").notNull().references(() => users.id),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  version: int("version").notNull().default(1),
  assessmentData: json("assessment_data").notNull(),
  summaryText: text("summary_text"),
  redFlags: json("red_flags").notNull(),
  completedAt: datetime("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  patientCreatedIndex: index("assessments_patient_created_idx").on(table.patientId, table.createdAt),
  authorIndex: index("assessments_author_idx").on(table.authorId),
}));

export const evolutions = mysqlTable("evolutions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  assessmentId: varchar("assessment_id", { length: 36 }).references(() => assessments.id, { onDelete: "set null" }),
  authorId: int("author_id").notNull().references(() => users.id),
  occurredAt: datetime("occurred_at", { mode: "date" }).notNull(),
  evolutionType: varchar("evolution_type", { length: 80 }).notNull(),
  privateNote: text("private_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  patientTimelineIndex: index("evolutions_patient_occurred_idx").on(table.patientId, table.occurredAt),
}));

export const photoUploadIntents = mysqlTable("photo_upload_intents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  consentId: varchar("consent_id", { length: 36 }).notNull().references(() => patientConsents.id, { onDelete: "restrict" }),
  objectKey: varchar("object_key", { length: 512 }).notNull(),
  contentType: varchar("content_type", { length: 120 }).notNull(),
  byteSize: int("byte_size").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  createdById: int("created_by_id").notNull().references(() => users.id),
  state: varchar("state", { length: 24 }).notNull().default("authorized"),
  reservationToken: varchar("reservation_token", { length: 36 }),
  reservedById: int("reserved_by_id").references(() => users.id),
  reservedAt: datetime("reserved_at", { mode: "date" }),
  consumedAt: datetime("consumed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  objectKeyUnique: uniqueIndex("upload_intent_key_unique").on(table.objectKey),
  patientExpiryIndex: index("upload_intent_patient_expiry_idx").on(table.patientId, table.expiresAt),
}));

export const patientPhotos = mysqlTable("patient_photos", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  evolutionId: varchar("evolution_id", { length: 36 }).references(() => evolutions.id, { onDelete: "set null" }),
  consentId: varchar("consent_id", { length: 36 }).references(() => patientConsents.id, { onDelete: "set null" }),
  objectKey: varchar("object_key", { length: 512 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 120 }).notNull(),
  byteSize: int("byte_size").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  capturedAt: datetime("captured_at", { mode: "date" }),
  uploadedById: int("uploaded_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: datetime("deleted_at", { mode: "date" }),
}, (table) => ({
  patientPhotoIndex: index("photos_patient_created_idx").on(table.patientId, table.createdAt),
  objectKeyUnique: uniqueIndex("photos_object_key_unique").on(table.objectKey),
}));

export const patientDocuments = mysqlTable("patient_documents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "cascade" }),
  consentId: varchar("consent_id", { length: 36 }).notNull().references(() => patientConsents.id, { onDelete: "restrict" }),
  documentType: varchar("document_type", { length: 64 }).notNull(),
  objectKey: varchar("object_key", { length: 512 }).notNull(),
  contentType: varchar("content_type", { length: 120 }).notNull(),
  byteSize: int("byte_size").notNull(),
  sha256: varchar("sha256", { length: 64 }).notNull(),
  uploadedById: int("uploaded_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: datetime("deleted_at", { mode: "date" }),
}, (table) => ({
  consentTypeIndex: index("documents_consent_type_idx").on(table.consentId, table.documentType),
  objectKeyUnique: uniqueIndex("documents_object_key_unique").on(table.objectKey),
}));

export const productCatalog = mysqlTable("product_catalog", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 120 }),
  description: text("description"),
  active: int("active").notNull().default(1),
  defaultCents: bigint("default_cents", { mode: "number", unsigned: true }).notNull().default(0),
  createdById: int("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  catalogNameIndex: index("catalog_name_idx").on(table.name),
}));

export const procedures = mysqlTable("procedures", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  internalNote: text("internal_note"),
  active: int("active").notNull().default(1),
  defaultCents: bigint("default_cents", { mode: "number", unsigned: true }).notNull().default(0),
  createdById: int("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const consentDocuments = mysqlTable("consent_documents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  consentType: varchar("consent_type", { length: 80 }).notNull(),
  procedureId: varchar("procedure_id", { length: 36 }).references(() => procedures.id, { onDelete: "set null" }),
  version: varchar("version", { length: 80 }).notNull(),
  templateMarkdown: text("template_markdown").notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  approvedAt: datetime("approved_at", { mode: "date" }),
  approvedById: int("approved_by_id").references(() => users.id),
  createdById: int("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  procedureStatusIndex: index("consent_document_procedure_status_idx").on(table.procedureId, table.status),
}));

export const procedureProducts = mysqlTable("procedure_products", {
  procedureId: varchar("procedure_id", { length: 36 }).notNull().references(() => procedures.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => productCatalog.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pairUnique: uniqueIndex("procedure_product_unique").on(table.procedureId, table.productId),
}));

export const appointments = mysqlTable("appointments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "restrict" }),
  assignedToId: int("assigned_to_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  scheduledStart: datetime("scheduled_start", { mode: "date" }).notNull(),
  scheduledEnd: datetime("scheduled_end", { mode: "date" }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("scheduled"),
  serviceLabel: varchar("service_label", { length: 255 }).notNull(),
  privateNote: text("private_note"),
  createdById: int("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  professionalDateIndex: index("appointments_professional_date_idx").on(table.assignedToId, table.scheduledStart),
  patientDateIndex: index("appointments_patient_date_idx").on(table.patientId, table.scheduledStart),
}));

export const quotes = mysqlTable("quotes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull().references(() => patients.id, { onDelete: "restrict" }),
  createdById: int("created_by_id").notNull().references(() => users.id),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  clientNameSnapshot: varchar("client_name_snapshot", { length: 255 }).notNull(),
  validUntil: date("valid_until"),
  commercialMessage: text("commercial_message"),
  totalCents: bigint("total_cents", { mode: "number", unsigned: true }).notNull().default(0),
  issuedAt: datetime("issued_at", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  patientQuoteIndex: index("quotes_patient_created_idx").on(table.patientId, table.createdAt),
}));

export const quoteItems = mysqlTable("quote_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  quoteId: varchar("quote_id", { length: 36 }).notNull().references(() => quotes.id, { onDelete: "cascade" }),
  sourceType: varchar("source_type", { length: 32 }).notNull(),
  sourceId: varchar("source_id", { length: 36 }),
  description: varchar("description", { length: 255 }).notNull(),
  unitCents: bigint("unit_cents", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").notNull().default(1),
  discountPercent: int("discount_percent").notNull().default(0),
  subtotalCents: bigint("subtotal_cents", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  quoteItemIndex: index("quote_items_quote_idx").on(table.quoteId),
}));

export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  actorId: int("actor_id").references(() => users.id, { onDelete: "set null" }),
  patientId: varchar("patient_id", { length: 36 }).references(() => patients.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 64 }),
  metadata: json("metadata"),
  ipFingerprint: varchar("ip_fingerprint", { length: 64 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  patientAuditIndex: index("audit_patient_created_idx").on(table.patientId, table.createdAt),
  actorAuditIndex: index("audit_actor_created_idx").on(table.actorId, table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Evolution = typeof evolutions.$inferSelect;
export type PatientPhoto = typeof patientPhotos.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
