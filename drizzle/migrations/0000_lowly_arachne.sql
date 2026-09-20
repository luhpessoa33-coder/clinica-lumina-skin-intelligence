CREATE TABLE `application_settings` (
	`setting_key` varchar(120) NOT NULL,
	`value` json NOT NULL,
	`updated_by_id` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `application_settings_setting_key` PRIMARY KEY(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`assigned_to_id` int NOT NULL,
	`scheduled_start` datetime NOT NULL,
	`scheduled_end` datetime NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'scheduled',
	`service_label` varchar(255) NOT NULL,
	`private_note` text,
	`created_by_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`author_id` int NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'draft',
	`version` int NOT NULL DEFAULT 1,
	`assessment_data` json NOT NULL,
	`summary_text` text,
	`red_flags` json NOT NULL,
	`completed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`actor_id` int,
	`patient_id` varchar(36),
	`action` varchar(120) NOT NULL,
	`entity_type` varchar(80) NOT NULL,
	`entity_id` varchar(64),
	`metadata` json,
	`ip_fingerprint` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consent_documents` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`consent_type` varchar(80) NOT NULL,
	`procedure_id` varchar(36),
	`version` varchar(80) NOT NULL,
	`template_markdown` text NOT NULL,
	`content_hash` varchar(64) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'draft',
	`approved_at` datetime,
	`approved_by_id` int,
	`created_by_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consent_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_profiles` (
	`user_id` int NOT NULL,
	`job_title` varchar(160),
	`employment_status` varchar(48) NOT NULL DEFAULT 'active',
	`start_date` date,
	`monthly_compensation_cents` bigint unsigned,
	`remuneration_notes` text,
	`profile_notes` text,
	`updated_by_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_profiles_user_id` PRIMARY KEY(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `evolutions` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`assessment_id` varchar(36),
	`author_id` int NOT NULL,
	`occurred_at` datetime NOT NULL,
	`evolution_type` varchar(80) NOT NULL,
	`private_note` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `magic_auth_links` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`token_fingerprint` varchar(64) NOT NULL,
	`purpose` varchar(48) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_by_id` int,
	`request_ip_fingerprint` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `magic_auth_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `magic_link_fingerprint_unique` UNIQUE(`token_fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `patient_assignments` (
	`patient_id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`assigned_by_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_assignment_unique` UNIQUE(`patient_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `patient_consents` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`consent_type` varchar(80) NOT NULL,
	`document_id` varchar(36),
	`procedure_id` varchar(36),
	`document_title_snapshot` varchar(255),
	`document_version` varchar(80) NOT NULL,
	`document_hash` varchar(64),
	`rendered_snapshot` text,
	`accepted_at` datetime NOT NULL,
	`accepted_by_name` varchar(255) NOT NULL,
	`signature_method` varchar(64) NOT NULL DEFAULT 'declaracao_registrada',
	`evidence_hash` varchar(64),
	`collected_by_id` int NOT NULL,
	`revoked_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patient_consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patient_documents` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`consent_id` varchar(36) NOT NULL,
	`document_type` varchar(64) NOT NULL,
	`object_key` varchar(512) NOT NULL,
	`content_type` varchar(120) NOT NULL,
	`byte_size` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`uploaded_by_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` datetime,
	CONSTRAINT `patient_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_object_key_unique` UNIQUE(`object_key`)
);
--> statement-breakpoint
CREATE TABLE `patient_photos` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`evolution_id` varchar(36),
	`consent_id` varchar(36),
	`object_key` varchar(512) NOT NULL,
	`original_filename` varchar(255) NOT NULL,
	`content_type` varchar(120) NOT NULL,
	`byte_size` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`captured_at` datetime,
	`uploaded_by_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` datetime,
	CONSTRAINT `patient_photos_id` PRIMARY KEY(`id`),
	CONSTRAINT `photos_object_key_unique` UNIQUE(`object_key`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` varchar(36) NOT NULL,
	`full_name` varchar(255) NOT NULL,
	`cpf_ciphertext` text NOT NULL,
	`cpf_fingerprint` varchar(64) NOT NULL,
	`birth_date` date,
	`contact_ciphertext` text,
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`created_by_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`archived_at` datetime,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `patients_cpf_fingerprint_unique` UNIQUE(`cpf_fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `photo_upload_intents` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`consent_id` varchar(36) NOT NULL,
	`object_key` varchar(512) NOT NULL,
	`content_type` varchar(120) NOT NULL,
	`byte_size` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`created_by_id` int NOT NULL,
	`state` varchar(24) NOT NULL DEFAULT 'authorized',
	`reservation_token` varchar(36),
	`reserved_by_id` int,
	`reserved_at` datetime,
	`consumed_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photo_upload_intents_id` PRIMARY KEY(`id`),
	CONSTRAINT `upload_intent_key_unique` UNIQUE(`object_key`)
);
--> statement-breakpoint
CREATE TABLE `procedure_products` (
	`procedure_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `procedure_product_unique` UNIQUE(`procedure_id`,`product_id`)
);
--> statement-breakpoint
CREATE TABLE `procedures` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`internal_note` text,
	`active` int NOT NULL DEFAULT 1,
	`default_cents` bigint unsigned NOT NULL DEFAULT 0,
	`created_by_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procedures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_catalog` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(120),
	`description` text,
	`active` int NOT NULL DEFAULT 1,
	`default_cents` bigint unsigned NOT NULL DEFAULT 0,
	`created_by_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_catalog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` varchar(36) NOT NULL,
	`quote_id` varchar(36) NOT NULL,
	`source_type` varchar(32) NOT NULL,
	`source_id` varchar(36),
	`description` varchar(255) NOT NULL,
	`unit_cents` bigint unsigned NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`discount_percent` int NOT NULL DEFAULT 0,
	`subtotal_cents` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` varchar(36) NOT NULL,
	`patient_id` varchar(36) NOT NULL,
	`created_by_id` int NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'draft',
	`client_name_snapshot` varchar(255) NOT NULL,
	`valid_until` date,
	`commercial_message` text,
	`total_cents` bigint unsigned NOT NULL DEFAULT 0,
	`issued_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` datetime NOT NULL,
	`revoked_at` datetime,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password_hash` text,
	`name` varchar(255) NOT NULL,
	`role` varchar(32) NOT NULL DEFAULT 'professional',
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_signed_in` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `application_settings` ADD CONSTRAINT `application_settings_updated_by_id_users_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_assigned_to_id_users_id_fk` FOREIGN KEY (`assigned_to_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessments` ADD CONSTRAINT `assessments_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consent_documents` ADD CONSTRAINT `consent_documents_procedure_id_procedures_id_fk` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consent_documents` ADD CONSTRAINT `consent_documents_approved_by_id_users_id_fk` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consent_documents` ADD CONSTRAINT `consent_documents_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_profiles` ADD CONSTRAINT `employee_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `employee_profiles` ADD CONSTRAINT `employee_profiles_updated_by_id_users_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolutions` ADD CONSTRAINT `evolutions_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolutions` ADD CONSTRAINT `evolutions_assessment_id_assessments_id_fk` FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evolutions` ADD CONSTRAINT `evolutions_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `magic_auth_links` ADD CONSTRAINT `magic_auth_links_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `magic_auth_links` ADD CONSTRAINT `magic_auth_links_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_assignments` ADD CONSTRAINT `patient_assignments_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_assignments` ADD CONSTRAINT `patient_assignments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_assignments` ADD CONSTRAINT `patient_assignments_assigned_by_id_users_id_fk` FOREIGN KEY (`assigned_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_consents` ADD CONSTRAINT `patient_consents_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_consents` ADD CONSTRAINT `patient_consents_collected_by_id_users_id_fk` FOREIGN KEY (`collected_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_documents` ADD CONSTRAINT `patient_documents_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_documents` ADD CONSTRAINT `patient_documents_consent_id_patient_consents_id_fk` FOREIGN KEY (`consent_id`) REFERENCES `patient_consents`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_documents` ADD CONSTRAINT `patient_documents_uploaded_by_id_users_id_fk` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_photos` ADD CONSTRAINT `patient_photos_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_photos` ADD CONSTRAINT `patient_photos_evolution_id_evolutions_id_fk` FOREIGN KEY (`evolution_id`) REFERENCES `evolutions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_photos` ADD CONSTRAINT `patient_photos_consent_id_patient_consents_id_fk` FOREIGN KEY (`consent_id`) REFERENCES `patient_consents`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patient_photos` ADD CONSTRAINT `patient_photos_uploaded_by_id_users_id_fk` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `patients` ADD CONSTRAINT `patients_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_upload_intents` ADD CONSTRAINT `photo_upload_intents_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_upload_intents` ADD CONSTRAINT `photo_upload_intents_consent_id_patient_consents_id_fk` FOREIGN KEY (`consent_id`) REFERENCES `patient_consents`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_upload_intents` ADD CONSTRAINT `photo_upload_intents_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo_upload_intents` ADD CONSTRAINT `photo_upload_intents_reserved_by_id_users_id_fk` FOREIGN KEY (`reserved_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procedure_products` ADD CONSTRAINT `procedure_products_procedure_id_procedures_id_fk` FOREIGN KEY (`procedure_id`) REFERENCES `procedures`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procedure_products` ADD CONSTRAINT `procedure_products_product_id_product_catalog_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product_catalog`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `procedures` ADD CONSTRAINT `procedures_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_catalog` ADD CONSTRAINT `product_catalog_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quote_items` ADD CONSTRAINT `quote_items_quote_id_quotes_id_fk` FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_patient_id_patients_id_fk` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `appointments_professional_date_idx` ON `appointments` (`assigned_to_id`,`scheduled_start`);--> statement-breakpoint
CREATE INDEX `appointments_patient_date_idx` ON `appointments` (`patient_id`,`scheduled_start`);--> statement-breakpoint
CREATE INDEX `assessments_patient_created_idx` ON `assessments` (`patient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `assessments_author_idx` ON `assessments` (`author_id`);--> statement-breakpoint
CREATE INDEX `audit_patient_created_idx` ON `audit_logs` (`patient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_actor_created_idx` ON `audit_logs` (`actor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `consent_document_procedure_status_idx` ON `consent_documents` (`procedure_id`,`status`);--> statement-breakpoint
CREATE INDEX `evolutions_patient_occurred_idx` ON `evolutions` (`patient_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `magic_link_user_expiry_idx` ON `magic_auth_links` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `magic_link_ip_created_idx` ON `magic_auth_links` (`request_ip_fingerprint`,`created_at`);--> statement-breakpoint
CREATE INDEX `patient_assignment_user_patient_idx` ON `patient_assignments` (`user_id`,`patient_id`);--> statement-breakpoint
CREATE INDEX `consents_patient_type_idx` ON `patient_consents` (`patient_id`,`consent_type`);--> statement-breakpoint
CREATE INDEX `documents_consent_type_idx` ON `patient_documents` (`consent_id`,`document_type`);--> statement-breakpoint
CREATE INDEX `photos_patient_created_idx` ON `patient_photos` (`patient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `patients_name_idx` ON `patients` (`full_name`);--> statement-breakpoint
CREATE INDEX `upload_intent_patient_expiry_idx` ON `photo_upload_intents` (`patient_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `catalog_name_idx` ON `product_catalog` (`name`);--> statement-breakpoint
CREATE INDEX `quote_items_quote_idx` ON `quote_items` (`quote_id`);--> statement-breakpoint
CREATE INDEX `quotes_patient_created_idx` ON `quotes` (`patient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `sessions_user_expiry_idx` ON `sessions` (`user_id`,`expires_at`);