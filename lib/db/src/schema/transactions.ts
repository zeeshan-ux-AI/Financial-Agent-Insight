import { pgTable, text, numeric, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  type: text("type").notNull(), // cash_in | cash_out | p2p_transfer | bill_payment | salary_disbursement
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  customerId: text("customer_id").notNull(),
  status: text("status").notNull().default("completed"), // completed | pending | failed
  flagged: boolean("flagged").notNull().default(false),
  flagReason: text("flag_reason"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_transactions_provider").on(table.providerId),
  index("idx_transactions_timestamp").on(table.timestamp),
  index("idx_transactions_flagged").on(table.flagged),
]);

export const insertTransactionSchema = createInsertSchema(transactionsTable);
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
