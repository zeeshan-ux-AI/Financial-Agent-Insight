import { pgTable, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providersTable = pgTable("providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  colorCode: text("color_code").notNull(),
  eMoneyBalance: numeric("e_money_balance", { precision: 18, scale: 2 }).notNull().default("0"),
  physicalCashBalance: numeric("physical_cash_balance", { precision: 18, scale: 2 }).notNull().default("0"),
  totalAgents: integer("total_agents").notNull().default(0),
  status: text("status").notNull().default("healthy"), // healthy | warning | critical
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProviderSchema = createInsertSchema(providersTable);
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
