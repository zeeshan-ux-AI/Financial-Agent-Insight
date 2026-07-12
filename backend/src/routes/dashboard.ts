import { Router } from "express";
import { db } from "@workspace/db";
import { providersTable, alertsTable, transactionsTable } from "@workspace/db";
import { eq, and, gte, count, sum, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard", async (req, res) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [providers, alerts, txStats, flaggedStats, recentAlerts, liquidityTrend] =
      await Promise.all([
        db.select().from(providersTable),
        db.select().from(alertsTable),
        db
          .select({
            volume: count(),
            totalAmount: sum(transactionsTable.amount),
          })
          .from(transactionsTable)
          .where(gte(transactionsTable.timestamp, since24h)),
        db
          .select({ count: count() })
          .from(transactionsTable)
          .where(and(eq(transactionsTable.flagged, true), gte(transactionsTable.timestamp, since24h))),
        db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt)).limit(5),
        db
          .select({
            period: sql<string>`date_trunc('hour', "transactions"."timestamp")::text`,
            providerId: transactionsTable.providerId,
            cashIn: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'cash_in' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
            cashOut: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'cash_out' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
            volume: count(),
          })
          .from(transactionsTable)
          .where(gte(transactionsTable.timestamp, since24h))
          .groupBy(sql`date_trunc('hour', "transactions"."timestamp")`, transactionsTable.providerId)
          .orderBy(sql`date_trunc('hour', "transactions"."timestamp")`),
      ]);

    const providerMap = Object.fromEntries(providers.map((p) => [p.id, p]));

    const alertCounts = {
      open: alerts.filter((a) => a.status === "open").length,
      escalated: alerts.filter((a) => a.status === "escalated").length,
      resolved: alerts.filter((a) => a.status === "resolved").length,
      total: alerts.length,
    };

    const enrichedProviders = await Promise.all(
      providers.map(async (p) => {
        const [alertCount] = await db
          .select({ count: count() })
          .from(alertsTable)
          .where(eq(alertsTable.providerId, p.id));
        const eMoney = parseFloat(p.eMoneyBalance.toString());
        const physCash = parseFloat(p.physicalCashBalance.toString());
        const liquidityRatio = physCash > 0 ? eMoney / physCash : 0;
        return {
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          colorCode: p.colorCode,
          eMoneyBalance: eMoney,
          physicalCashBalance: physCash,
          totalAgents: p.totalAgents,
          activeAlerts: alertCount?.count ?? 0,
          liquidityRatio: parseFloat(liquidityRatio.toFixed(2)),
          status: p.status,
          lastUpdated: p.lastUpdated.toISOString(),
        };
      })
    );

    res.json({
      totalPhysicalCash: enrichedProviders.reduce((s, p) => s + p.physicalCashBalance, 0),
      providers: enrichedProviders,
      alertCounts,
      recentAlerts: recentAlerts.map((a) => ({
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
      })),
      transactionVolume24h: parseFloat(String(txStats[0]?.totalAmount ?? "0")),
      transactionCount24h: Number(txStats[0]?.volume ?? 0),
      flaggedCount24h: Number(flaggedStats[0]?.count ?? 0),
      liquidityTrend: liquidityTrend.map((r) => ({
        period: r.period,
        providerId: r.providerId,
        providerName: providerMap[r.providerId]?.name ?? r.providerId,
        cashIn: parseFloat(String(r.cashIn)),
        cashOut: parseFloat(String(r.cashOut)),
        volume: Number(r.volume),
        netFlow: parseFloat((parseFloat(String(r.cashIn)) - parseFloat(String(r.cashOut))).toFixed(2)),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dashboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
