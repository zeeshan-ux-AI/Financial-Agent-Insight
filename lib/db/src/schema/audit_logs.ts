import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  alertId: text("alert_id").notNull(),
  action: text("action").notNull(), // created | status_changed | comment_added | assigned | escalated | resolved
  actor: text("actor").notNull(),
  notes: text("notes").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_audit_logs_alert_id").on(table.alertId),
]);

export const insertAuditLogSchema = createInsertSchema(auditLogsTable);
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
