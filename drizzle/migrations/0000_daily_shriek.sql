CREATE TABLE "planner_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" integer,
	"file_key" varchar(512) NOT NULL,
	"url" varchar(700) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module" varchar(40) NOT NULL,
	"reference_id" varchar(80) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(120),
	"status" varchar(40) DEFAULT 'planejado' NOT NULL,
	"priority" varchar(24) DEFAULT 'media' NOT NULL,
	"quantity" varchar(32),
	"unit" varchar(32),
	"planned_cents" integer DEFAULT 0 NOT NULL,
	"quoted_cents" integer DEFAULT 0 NOT NULL,
	"contracted_cents" integer DEFAULT 0 NOT NULL,
	"paid_cents" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone,
	"responsible" varchar(120),
	"brand_model" varchar(255),
	"supplier" varchar(255),
	"validation_status" varchar(80),
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" varchar(24) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "planner_attachments" ADD CONSTRAINT "planner_attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_attachments" ADD CONSTRAINT "planner_attachments_item_id_planner_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."planner_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner_items" ADD CONSTRAINT "planner_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "planner_user_reference_idx" ON "planner_items" USING btree ("user_id","reference_id");