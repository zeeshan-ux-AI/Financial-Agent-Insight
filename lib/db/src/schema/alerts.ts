import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // liquidity | anomaly
  severity: text("severity").notNull(), // low | medium | high | critical
  providerId: text("provider_id").notNull(),
  providerName: text("provider_name").notNull(),
  providerColor: text("provider_color").notNull(),
  title: text("title").notNull(),
  titleBn: text("title_bn").notNull(),
  reason: text("reason").notNull(),
  reasonBn: text("reason_bn").notNull(),
  evidence: text("evidence").notNull(),
  assignedTo: text("assigned_to").notNull(),
  assignedRole: text("assigned_role").notNull(),
  recommendedSteps: jsonb("recommended_steps").$type<string[]>().notNull().default([]),
  recommendedStepsBn: jsonb("recommended_steps_bn").$type<string[]>().notNull().default([]),
  status: text("status").notNull().default("open"), // open | escalated | resolved
  relatedTransactionIds: jsonb("related_transaction_ids").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable);
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
