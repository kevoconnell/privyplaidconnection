-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plaid_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plaid_item_id" text NOT NULL,
	"access_token" text NOT NULL,
	"institution_id" text,
	"institution_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plaid_connections_plaid_item_id_key" UNIQUE("plaid_item_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plaid_connection_id" uuid NOT NULL,
	"plaid_transaction_id" text NOT NULL,
	"account_id" text NOT NULL,
	"account_name" text,
	"amount" numeric(14, 2) NOT NULL,
	"iso_currency_code" text,
	"unofficial_currency_code" text,
	"date" date NOT NULL,
	"authorized_date" date,
	"name" text NOT NULL,
	"merchant_name" text,
	"pending" boolean NOT NULL,
	"category" text[],
	"payment_channel" text,
	"raw_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_plaid_transaction_id_key" UNIQUE("plaid_transaction_id")
);
--> statement-breakpoint
ALTER TABLE "plaid_connections" ADD CONSTRAINT "plaid_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_plaid_connection_id_fkey" FOREIGN KEY ("plaid_connection_id") REFERENCES "public"."plaid_connections"("id") ON DELETE cascade ON UPDATE no action;
*/