import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable, providersTable } from "@workspace/db";
import { eq, and, desc, count, sql } from "drizzle-orm";

const router = Router();

router.get("/transactions", async (req, res) => {
  try {
    const { providerId, type, flagged, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const lim = Math.min(parseInt(limit) || 50, 200);
    const off = parseInt(offset) || 0;

    const conditions = [];
    if (providerId) conditions.push(eq(transactionsTable.providerId, providerId));
    if (type) conditions.push(eq(transactionsTable.type, type));
    if (flagged !== undefined) conditions.push(eq(transactionsTable.flagged, flagged === "true"));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [txRows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(transactionsTable)
        .where(whereClause)
        .orderBy(desc(transactionsTable.timestamp))
        .limit(lim)
        .offset(off),
      db.select({ total: count() }).from(transactionsTable).where(whereClause),
    ]);

    // Fetch provider names
    const providers = await db.select().from(providersTable);
    const providerMap = Object.fromEntries(providers.map((p) => [p.id, p.name]));

    const data = txRows.map((t) => ({
      id: t.id,
      providerId: t.providerId,
      providerName: providerMap[t.providerId] ?? t.providerId,
      type: t.type,
      amount: parseFloat(t.amount.toString()),
      agentId: t.agentId,
      agentName: t.agentName,
      customerId: t.customerId,
      status: t.status,
      flagged: t.flagged,
      flagReason: t.flagReason ?? null,
      timestamp: t.timestamp.toISOString(),
    }));

    res.json({ data, total: Number(total), limit: lim, offset: off });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch transactions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transactions/stats", async (req, res) => {
  try {
    const { providerId, period = "hourly" } = req.query as Record<string, string>;

    const providers = providerId
      ? await db.select().from(providersTable).where(eq(providersTable.id, providerId))
      : await db.select().from(providersTable);

    const truncUnit = period === "daily" ? "day" : "hour";
    const stats: Array<{
      period: string;
      providerId: string;
      providerName: string;
      cashIn: number;
      cashOut: number;
      volume: number;
      netFlow: number;
    }> = [];

    for (const p of providers) {
      const truncExpr = sql.raw(`date_trunc('${truncUnit}', "transactions"."timestamp")`);
      const rows = await db
        .select({
          period: sql<string>`${truncExpr}::text`,
          cashIn: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'cash_in' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
          cashOut: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'cash_out' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
          volume: count(),
        })
        .from(transactionsTable)
        .where(eq(transactionsTable.providerId, p.id))
        .groupBy(truncExpr)
        .orderBy(truncExpr);

      for (const r of rows) {
        const ci = parseFloat(String(r.cashIn));
        const co = parseFloat(String(r.cashOut));
        stats.push({
          period: r.period,
          providerId: p.id,
          providerName: p.name,
          cashIn: ci,
          cashOut: co,
          volume: Number(r.volume),
          netFlow: parseFloat((ci - co).toFixed(2)),
        });
      }
    }

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch transaction stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
