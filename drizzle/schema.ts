import { integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 24 }).default("admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export const plannerItems = pgTable("planner_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  module: varchar("module", { length: 40 }).notNull(), referenceId: varchar("reference_id", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(), category: varchar("category", { length: 120 }),
  status: varchar("status", { length: 40 }).default("planejado").notNull(), priority: varchar("priority", { length: 24 }).default("media").notNull(),
  quantity: varchar("quantity", { length: 32 }), unit: varchar("unit", { length: 32 }),
  plannedCents: integer("planned_cents").default(0).notNull(), quotedCents: integer("quoted_cents").default(0).notNull(),
  contractedCents: integer("contracted_cents").default(0).notNull(), paidCents: integer("paid_cents").default(0).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }), responsible: varchar("responsible", { length: 120 }),
  brandModel: varchar("brand_model", { length: 255 }), supplier: varchar("supplier", { length: 255 }),
  validationStatus: varchar("validation_status", { length: 80 }), details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, table => ({ userReference: uniqueIndex("planner_user_reference_idx").on(table.userId, table.referenceId) }));

export const plannerAttachments = pgTable("planner_attachments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => plannerItems.id, { onDelete: "set null" }),
  fileKey: varchar("file_key", { length: 512 }).notNull(), url: varchar("url", { length: 700 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(), mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PlannerItem = typeof plannerItems.$inferSelect;
export type InsertPlannerItem = typeof plannerItems.$inferInsert;
export type PlannerAttachment = typeof plannerAttachments.$inferSelect;
