CREATE TYPE "public"."dose_unit" AS ENUM('comprimido', 'capsula', 'mg', 'ml', 'gota', 'unidade');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('daily', 'weekly', 'interval');--> statement-breakpoint
CREATE TABLE "dose_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tracker_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"dose_index" smallint NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dose_logs_tracker_date_dose_uq" UNIQUE("tracker_id","date","dose_index")
);
--> statement-breakpoint
ALTER TABLE "dose_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trackers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"doses_per_day" smallint DEFAULT 1 NOT NULL,
	"dose_times" text[] NOT NULL,
	"frequency" "frequency" DEFAULT 'daily' NOT NULL,
	"weekdays" smallint[] DEFAULT '{}' NOT NULL,
	"interval_days" integer DEFAULT 1 NOT NULL,
	"dose_amount" double precision NOT NULL,
	"dose_unit" "dose_unit" NOT NULL,
	"reminders_enabled" boolean DEFAULT false NOT NULL,
	"start_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trackers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dose_logs" ADD CONSTRAINT "dose_logs_tracker_id_trackers_id_fk" FOREIGN KEY ("tracker_id") REFERENCES "public"."trackers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dose_logs" ADD CONSTRAINT "dose_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trackers" ADD CONSTRAINT "trackers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dose_logs_user_date_idx" ON "dose_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "trackers_user_id_idx" ON "trackers" USING btree ("user_id");