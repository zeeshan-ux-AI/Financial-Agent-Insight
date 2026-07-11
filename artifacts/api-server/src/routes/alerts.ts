import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable, auditLogsTable, transactionsTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

function mapAlert(a: typeof alertsTable.$inferSelect) {
  return {
    id: a.id,
    type: a.type,
    severity: a.severity,
    providerId: a.providerId,
    providerName: a.providerName,
    providerColor: a.providerColor,
    title: a.title,
    titleBn: a.titleBn,
    reason: a.reason,
    reasonBn: a.reasonBn,
    evidence: a.evidence,
    assignedTo: a.assignedTo,
    assignedRole: a.assignedRole,
    recommendedSteps: (a.recommendedSteps as string[]) ?? [],
    recommendedStepsBn: (a.recommendedStepsBn as string[]) ?? [],
    status: a.status,
    relatedTransactionIds: (a.relatedTransactionIds as string[]) ?? [],
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function mapAuditLog(l: typeof auditLogsTable.$inferSelect) {
  return {
    id: l.id,
    alertId: l.alertId,
    action: l.action,
    actor: l.actor,
    notes: l.notes,
    previousStatus: l.previousStatus ?? null,
    newStatus: l.newStatus ?? null,
    timestamp: l.timestamp.toISOString(),
  };
}

router.get("/alerts", async (req, res) => {
  try {
    const { status = "all", type = "all", providerId } = req.query as Record<string, string>;

    const conditions = [];
    if (status !== "all") conditions.push(eq(alertsTable.status, status));
    if (type !== "all") conditions.push(eq(alertsTable.type, type));
    if (providerId) conditions.push(eq(alertsTable.providerId, providerId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const alerts = await db
      .select()
      .from(alertsTable)
      .where(whereClause)
      .orderBy(desc(alertsTable.createdAt));

    res.json(alerts.map(mapAlert));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch alerts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/alerts/:id", async (req, res) => {
  try {
    const [alert] = await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.id, req.params.id));

    if (!alert) { res.status(404).json({ error: "Alert not found" }); return; }

    const auditLogs = await db
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.alertId, alert.id))
      .orderBy(desc(auditLogsTable.timestamp));

    const txIds = (alert.relatedTransactionIds as string[]) ?? [];
    const relatedTransactions =
      txIds.length > 0
        ? await db.select().from(transactionsTable).where(inArray(transactionsTable.id, txIds))
        : [];

    res.json({
      ...mapAlert(alert),
      auditLogs: auditLogs.map(mapAuditLog),
      relatedTransactions: relatedTransactions.map((t) => ({
        id: t.id,
        providerId: t.providerId,
        providerName: alert.providerName,
        type: t.type,
        amount: parseFloat(t.amount.toString()),
        agentId: t.agentId,
        agentName: t.agentName,
        customerId: t.customerId,
        status: t.status,
        flagged: t.flagged,
        flagReason: t.flagReason ?? null,
        timestamp: t.timestamp.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch alert");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/alerts/:id", async (req, res) => {
  try {
    const { status, actor, notes } = req.body as { status: string; actor: string; notes?: string };
    if (!status || !actor) {
      res.status(400).json({ error: "status and actor are required" }); return;
    }

    const [existing] = await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.id, req.params.id));
    if (!existing) { res.status(404).json({ error: "Alert not found" }); return; }

    const [updated] = await db
      .update(alertsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(alertsTable.id, req.params.id))
      .returning();

    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      alertId: req.params.id,
      action: "status_changed",
      actor,
      notes: notes ?? `Status changed to ${status}`,
      previousStatus: existing.status,
      newStatus: status,
      timestamp: new Date(),
    });

    res.json(mapAlert(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update alert status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/alerts/:id/comments", async (req, res) => {
  try {
    const { actor, notes } = req.body as { actor: string; notes: string };
    if (!actor || !notes) {
      res.status(400).json({ error: "actor and notes are required" }); return;
    }

    const [existing] = await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.id, req.params.id));
    if (!existing) { res.status(404).json({ error: "Alert not found" }); return; }

    const [log] = await db
      .insert(auditLogsTable)
      .values({
        id: randomUUID(),
        alertId: req.params.id,
        action: "comment_added",
        actor,
        notes,
        previousStatus: null,
        newStatus: null,
        timestamp: new Date(),
      })
      .returning();

    res.status(201).json(mapAuditLog(log));
  } catch (err) {
    req.log.error({ err }, "Failed to add comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
