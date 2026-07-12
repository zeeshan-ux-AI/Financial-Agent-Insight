import { Router } from "express";
import { db } from "@workspace/db";
import { providersTable, alertsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/providers", async (req, res) => {
  try {
    const providers = await db.select().from(providersTable);
    const result = await Promise.all(
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
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch providers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/providers/:id", async (req, res) => {
  try {
    const [p] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, req.params.id));
    if (!p) { res.status(404).json({ error: "Provider not found" }); return; }

    const [alertCount] = await db
      .select({ count: count() })
      .from(alertsTable)
      .where(eq(alertsTable.providerId, p.id));
    const eMoney = parseFloat(p.eMoneyBalance.toString());
    const physCash = parseFloat(p.physicalCashBalance.toString());
    const liquidityRatio = physCash > 0 ? eMoney / physCash : 0;

    res.json({
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
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch provider");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
