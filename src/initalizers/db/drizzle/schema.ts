import {
  pgTable,
  text,
  timestamp,
  foreignKey,
  unique,
  uuid,
  numeric,
  date,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text().primaryKey().notNull(),
  email: text(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const plaidConnections = pgTable(
  "plaid_connections",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    plaidItemId: text("plaid_item_id").notNull(),
    accessToken: text("access_token").notNull(),
    institutionId: text("institution_id"),
    institutionName: text("institution_name"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "plaid_connections_user_id_fkey",
    }).onDelete("cascade"),
    unique("plaid_connections_plaid_item_id_key").on(table.plaidItemId),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    plaidConnectionId: uuid("plaid_connection_id").notNull(),
    plaidTransactionId: text("plaid_transaction_id").notNull(),
    accountId: text("account_id").notNull(),
    accountName: text("account_name"),
    amount: numeric({ precision: 14, scale: 2 }).notNull(),
    isoCurrencyCode: text("iso_currency_code"),
    unofficialCurrencyCode: text("unofficial_currency_code"),
    date: date().notNull(),
    authorizedDate: date("authorized_date"),
    name: text().notNull(),
    merchantName: text("merchant_name"),
    pending: boolean().notNull(),
    category: text().array(),
    paymentChannel: text("payment_channel"),
    rawJson: jsonb("raw_json"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.plaidConnectionId],
      foreignColumns: [plaidConnections.id],
      name: "transactions_plaid_connection_id_fkey",
    }).onDelete("cascade"),
    unique("transactions_plaid_transaction_id_key").on(
      table.plaidTransactionId
    ),
  ]
);
