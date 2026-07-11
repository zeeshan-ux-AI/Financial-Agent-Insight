import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/audit-logs", async (req, res) => {
  try {
    const { alertId, limit = "100" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 100, 500);

    const rows = alertId
      ? await db
          .select()
          .from(auditLogsTable)
          .where(eq(auditLogsTable.alertId, alertId))
          .orderBy(desc(auditLogsTable.timestamp))
          .limit(lim)
      : await db
          .select()
          .from(auditLogsTable)
          .orderBy(desc(auditLogsTable.timestamp))
          .limit(lim);

    res.json(
      rows.map((l) => ({
        id: l.id,
        alertId: l.alertId,
        action: l.action,
        actor: l.actor,
        notes: l.notes,
        previousStatus: l.previousStatus ?? null,
        newStatus: l.newStatus ?? null,
        timestamp: l.timestamp.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch audit logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
