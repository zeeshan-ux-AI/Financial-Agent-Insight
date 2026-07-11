import { Router } from "express";
import { db } from "@workspace/db";
import {
  providersTable,
  transactionsTable,
  alertsTable,
  auditLogsTable,
} from "@workspace/db";
import { randomUUID } from "crypto";

const router = Router();

const PROVIDERS = [
  {
    id: "bkash",
    name: "bKash",
    displayName: "bKash",
    colorCode: "#E2136E",
    eMoneyBalance: "45000000",
    physicalCashBalance: "32000000",
    totalAgents: 580,
    status: "healthy",
  },
  {
    id: "nagad",
    name: "Nagad",
    displayName: "Nagad",
    colorCode: "#F7941D",
    eMoneyBalance: "28500000",
    physicalCashBalance: "31000000",
    totalAgents: 420,
    status: "warning",
  },
  {
    id: "rocket",
    name: "Rocket",
    displayName: "Rocket (DBBL)",
    colorCode: "#8B3FC8",
    eMoneyBalance: "18200000",
    physicalCashBalance: "22000000",
    totalAgents: 310,
    status: "healthy",
  },
];

const TX_TYPES = [
  "cash_in",
  "cash_out",
  "p2p_transfer",
  "bill_payment",
  "salary_disbursement",
] as const;

const AGENT_NAMES = [
  "Rahman Stores",
  "Karim Enterprise",
  "Hasan Trading",
  "Begum Corner Shop",
  "Islam Mobile Point",
  "Chowdhury Variety",
  "Molla E-Services",
  "Sikder Shop",
  "Haque Agency",
  "Uddin Mobile Hub",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTransactions(count: number, spikeProviderId?: string) {
  const now = new Date();
  const txs = [];

  for (let i = 0; i < count; i++) {
    const hoursAgo = randInt(0, 47);
    const timestamp = new Date(now.getTime() - hoursAgo * 3600 * 1000);
    const provider = randItem(PROVIDERS);
    const type = randItem([...TX_TYPES]);
    const agentIdx = randInt(0, AGENT_NAMES.length - 1);
    const amount = type === "salary_disbursement"
      ? randFloat(10000, 80000)
      : type === "cash_in" || type === "cash_out"
      ? randFloat(200, 25000)
      : randFloat(50, 5000);

    // Spike: last 2 hours, 3x volume for spike provider
    const isSpike =
      spikeProviderId === provider.id && hoursAgo <= 2 && Math.random() < 0.7;

    const flagged =
      (type === "cash_out" && amount > 20000 && Math.random() < 0.12) ||
      (isSpike && Math.random() < 0.4);

    txs.push({
      id: randomUUID(),
      providerId: provider.id,
      type,
      amount: isSpike ? String(amount * 3) : String(amount),
      agentId: `AGT-${String(agentIdx + 1).padStart(4, "0")}`,
      agentName: AGENT_NAMES[agentIdx],
      customerId: `CUST-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: Math.random() < 0.04 ? "failed" : Math.random() < 0.06 ? "pending" : "completed",
      flagged,
      flagReason: flagged
        ? type === "cash_out" && amount > 20000
          ? "High-value cash-out exceeds threshold"
          : isSpike
          ? "Unusual transaction spike — Requires Review"
          : null
        : null,
      timestamp,
    });
  }
  return txs;
}

function generateAlerts(txIds: Record<string, string[]>) {
  const alerts = [];
  const now = new Date();

  alerts.push({
    id: randomUUID(),
    type: "liquidity",
    severity: "high",
    providerId: "nagad",
    providerName: "Nagad",
    providerColor: "#F7941D",
    title: "Nagad e-Money Balance Below Safety Threshold",
    titleBn: "নগদ ই-মানি ব্যালেন্স নিরাপত্তা সীমার নিচে",
    reason:
      "Nagad's e-money balance has dropped to 91.9% of physical cash reserves. The safety ratio threshold is 95%. Continued high cash-out volume may cause liquidity pressure within 6-8 hours.",
    reasonBn:
      "নগদের ই-মানি ব্যালেন্স শারীরিক নগদ রিজার্ভের ৯১.৯%-এ নেমে এসেছে। নিরাপত্তা অনুপাত সীমা ৯৫%। উচ্চ ক্যাশ-আউট ভলিউম অব্যাহত থাকলে ৬-৮ ঘণ্টার মধ্যে তারল্য চাপ সৃষ্টি হতে পারে।",
    evidence:
      "e-Money: BDT 28,500,000 | Physical Cash Pool: BDT 31,000,000 | Ratio: 91.9% | 24h Cash-Out Volume: BDT 4,200,000 | Trend: Declining (-3.2% vs prior 24h)",
    assignedTo: "Kamal Hossain",
    assignedRole: "Field Officer",
    recommendedSteps: [
      "Verify Nagad agent cash float levels in Dhaka North zone",
      "Coordinate with Nagad ops team to schedule e-money top-up",
      "Monitor cash-out velocity for the next 2 hours",
      "Do NOT initiate transfers — escalate to Ops Manager if ratio drops below 85%",
    ],
    recommendedStepsBn: [
      "ঢাকা উত্তর জোনে নগদ এজেন্টের ক্যাশ ফ্লোট স্তর যাচাই করুন",
      "ই-মানি টপ-আপ নির্ধারণের জন্য নগদ অপারেশন দলের সাথে সমন্বয় করুন",
      "পরবর্তী ২ ঘণ্টার জন্য ক্যাশ-আউট গতি পর্যবেক্ষণ করুন",
      "ট্রান্সফার শুরু করবেন না — অনুপাত ৮৫%-এর নিচে নামলে অপারেশন ম্যানেজারকে এস্কেলেট করুন",
    ],
    status: "open",
    relatedTransactionIds: txIds["nagad"]?.slice(0, 5) ?? [],
    createdAt: new Date(now.getTime() - 90 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 90 * 60 * 1000),
  });

  alerts.push({
    id: randomUUID(),
    type: "anomaly",
    severity: "medium",
    providerId: "bkash",
    providerName: "bKash",
    providerColor: "#E2136E",
    title: "Unusual Transaction Spike — Requires Review",
    titleBn: "অস্বাভাবিক লেনদেন বৃদ্ধি — পর্যালোচনা প্রয়োজন",
    reason:
      "bKash Agent AGT-0003 (Hasan Trading) has processed 47 cash-out transactions in the last 2 hours — 3.8× their 7-day average of 12.4 transactions/2h. This is flagged for review, not as fraud.",
    reasonBn:
      "bKash এজেন্ট AGT-0003 (হাসান ট্রেডিং) গত ২ ঘণ্টায় ৪৭টি ক্যাশ-আউট লেনদেন প্রক্রিয়া করেছে — তাদের ৭-দিনের গড় ১২.৪ লেনদেন/২ঘণ্টার ৩.৮ গুণ। এটি পর্যালোচনার জন্য চিহ্নিত, প্রতারণা হিসাবে নয়।",
    evidence:
      "Agent: AGT-0003 (Hasan Trading) | Transactions (last 2h): 47 | 7-day avg (2h window): 12.4 | Spike factor: 3.8× | Total spike value: BDT 382,000 | Largest single tx: BDT 24,500",
    assignedTo: "Fatema Akter",
    assignedRole: "Operations Analyst",
    recommendedSteps: [
      "Call agent AGT-0003 to understand the reason for the volume increase",
      "Check if there is a local event (salary day, festival) driving demand",
      "Review the 5 largest transactions for any inconsistency",
      "If no legitimate explanation found, escalate to Compliance Team",
    ],
    recommendedStepsBn: [
      "ভলিউম বৃদ্ধির কারণ বুঝতে এজেন্ট AGT-0003-কে কল করুন",
      "চাহিদা বৃদ্ধির জন্য কোনো স্থানীয় ইভেন্ট (বেতন দিবস, উৎসব) আছে কিনা পরীক্ষা করুন",
      "যেকোনো অসঙ্গতির জন্য ৫টি বৃহত্তম লেনদেন পর্যালোচনা করুন",
      "কোনো বৈধ ব্যাখ্যা না পেলে, কমপ্লায়েন্স টিমকে এস্কেলেট করুন",
    ],
    status: "open",
    relatedTransactionIds: txIds["bkash"]?.slice(0, 8) ?? [],
    createdAt: new Date(now.getTime() - 45 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 45 * 60 * 1000),
  });

  alerts.push({
    id: randomUUID(),
    type: "anomaly",
    severity: "low",
    providerId: "rocket",
    providerName: "Rocket (DBBL)",
    providerColor: "#8B3FC8",
    title: "Off-Hours Salary Disbursement Pattern",
    titleBn: "অফ-আওয়ার বেতন বিতরণ প্যাটার্ন",
    reason:
      "Rocket processed 3 salary disbursements between 02:00–03:30 AM local time, totaling BDT 145,000. While not inherently suspicious, off-hours bulk disbursements are flagged for routine review per policy.",
    reasonBn:
      "রকেট স্থানীয় সময় রাত ২:০০-৩:৩০ এর মধ্যে ৩টি বেতন বিতরণ প্রক্রিয়া করেছে, মোট BDT ১,৪৫,০০০। স্বভাবতই সন্দেহজনক না হলেও, অফ-আওয়ার বাল্ক ডিসবার্সমেন্ট নীতি অনুযায়ী রুটিন পর্যালোচনার জন্য চিহ্নিত।",
    evidence:
      "Time: 02:00–03:30 AM | Transactions: 3 salary disbursements | Total: BDT 145,000 | Recipients: 3 different customer IDs | Off-hours threshold: Any disbursement > BDT 10,000 after midnight",
    assignedTo: "Rahul Dev",
    assignedRole: "Night Shift Monitor",
    recommendedSteps: [
      "Confirm with Rocket ops that disbursements match scheduled payroll",
      "Verify recipient customer IDs are registered and active",
      "Log verification outcome in the audit trail",
    ],
    recommendedStepsBn: [
      "রকেট অপারেশনের সাথে নিশ্চিত করুন যে বিতরণ নির্ধারিত পেরোলের সাথে মেলে",
      "যাচাই করুন প্রাপক গ্রাহক আইডি নিবন্ধিত এবং সক্রিয়",
      "অডিট ট্রেইলে যাচাই ফলাফল লগ করুন",
    ],
    status: "resolved",
    relatedTransactionIds: txIds["rocket"]?.slice(0, 3) ?? [],
    createdAt: new Date(now.getTime() - 5 * 3600 * 1000),
    updatedAt: new Date(now.getTime() - 3 * 3600 * 1000),
  });

  return alerts;
}

router.post("/seed", async (req, res) => {
  try {
    const { reset = false, transactionCount = 200 } = req.body ?? {};

    if (reset) {
      await db.delete(auditLogsTable);
      await db.delete(alertsTable);
      await db.delete(transactionsTable);
      await db.delete(providersTable);
    }

    // Upsert providers
    for (const p of PROVIDERS) {
      await db
        .insert(providersTable)
        .values({ ...p, lastUpdated: new Date() })
        .onConflictDoUpdate({
          target: providersTable.id,
          set: {
            eMoneyBalance: p.eMoneyBalance,
            physicalCashBalance: p.physicalCashBalance,
            totalAgents: p.totalAgents,
            status: p.status as "healthy" | "warning" | "critical",
            lastUpdated: new Date(),
          },
        });
    }

    // Generate & insert transactions in batches
    const count = Math.min(transactionCount, 500);
    const txs = generateTransactions(count, "bkash");
    const batchSize = 50;
    const txIdsByProvider: Record<string, string[]> = {};
    for (const tx of txs) {
      if (!txIdsByProvider[tx.providerId]) txIdsByProvider[tx.providerId] = [];
      txIdsByProvider[tx.providerId].push(tx.id);
    }

    for (let i = 0; i < txs.length; i += batchSize) {
      await db.insert(transactionsTable).values(txs.slice(i, i + batchSize));
    }

    // Generate & insert alerts
    const alertRows = generateAlerts(txIdsByProvider);
    for (const a of alertRows) {
      await db
        .insert(alertsTable)
        .values({
          ...a,
          relatedTransactionIds: a.relatedTransactionIds,
        })
        .onConflictDoNothing();
    }

    // Seed audit logs for alerts
    type AuditEntry = {
      id: string; alertId: string; action: string; actor: string;
      notes: string; previousStatus: string | null; newStatus: string | null;
      timestamp: Date;
    };
    const auditEntries: AuditEntry[] = alertRows.flatMap((a) => {
      const logs: AuditEntry[] = [
        {
          id: randomUUID(),
          alertId: a.id,
          action: "created",
          actor: "System (Auto-Detection)",
          notes: `Alert auto-generated: ${a.title}`,
          previousStatus: null,
          newStatus: "open",
          timestamp: new Date(a.createdAt.getTime() + 1000),
        },
      ];
      if (a.status === "resolved") {
        logs.push({
          id: randomUUID(),
          alertId: a.id,
          action: "status_changed",
          actor: a.assignedTo,
          notes: "Verified with ops team. Disbursements confirmed as legitimate scheduled payroll.",
          previousStatus: "open",
          newStatus: "resolved",
          timestamp: new Date(a.updatedAt),
        });
      }
      return logs;
    });

    for (const log of auditEntries) {
      await db.insert(auditLogsTable).values(log).onConflictDoNothing();
    }

    res.json({
      success: true,
      providersCreated: PROVIDERS.length,
      transactionsCreated: count,
      alertsCreated: alertRows.length,
      message: `Seeded ${PROVIDERS.length} providers, ${count} synthetic transactions, and ${alertRows.length} alerts.`,
    });
  } catch (err) {
    req.log.error({ err }, "Seed failed");
    res.status(500).json({ error: "Seed failed", details: String(err) });
  }
});

router.post("/simulate/anomaly", async (req, res) => {
  try {
    const { providerId = "bkash", anomalyType = "spike" } = req.body ?? {};

    const providers = await db.select().from(providersTable);
    const prov = providers.find((p) => p.id === providerId) ?? providers[0];
    if (!prov) { res.status(400).json({ error: "Provider not found" }); return; }

    const now = new Date();
    const spikeCount = 15;
    const agentId = "AGT-0007";
    const agentName = "Uddin Mobile Hub";

    const simTxs = Array.from({ length: spikeCount }, (_, i) => ({
      id: randomUUID(),
      providerId: prov.id,
      type: "cash_out" as const,
      amount: String(randFloat(8000, 30000)),
      agentId,
      agentName,
      customerId: `CUST-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "completed" as const,
      flagged: true,
      flagReason: `Simulated ${anomalyType} — Requires Review`,
      timestamp: new Date(now.getTime() - i * 4 * 60 * 1000),
    }));

    for (let i = 0; i < simTxs.length; i += 10) {
      await db.insert(transactionsTable).values(simTxs.slice(i, i + 10));
    }

    const totalValue = simTxs.reduce((s, t) => s + parseFloat(t.amount), 0);

    const alertTitles: Record<string, { en: string; bn: string }> = {
      spike: {
        en: `Unusual Transaction Spike Detected — ${prov.name} — Requires Review`,
        bn: `অস্বাভাবিক লেনদেন বৃদ্ধি সনাক্ত — ${prov.name} — পর্যালোচনা প্রয়োজন`,
      },
      liquidity_drop: {
        en: `Simulated Liquidity Pressure — ${prov.name}`,
        bn: `সিমুলেটেড তারল্য চাপ — ${prov.name}`,
      },
      unusual_pattern: {
        en: `Unusual Agent Behavior Pattern — ${prov.name}`,
        bn: `অস্বাভাবিক এজেন্ট আচরণ প্যাটার্ন — ${prov.name}`,
      },
    };

    const titles = alertTitles[anomalyType] ?? alertTitles["spike"];

    const alertId = randomUUID();
    const [newAlert] = await db
      .insert(alertsTable)
      .values({
        id: alertId,
        type: "anomaly",
        severity: "high",
        providerId: prov.id,
        providerName: prov.name,
        providerColor: prov.colorCode,
        title: titles.en,
        titleBn: titles.bn,
        reason: `Simulated anomaly (${anomalyType}): Agent ${agentName} processed ${spikeCount} cash-out transactions in the last 60 minutes, totaling BDT ${totalValue.toFixed(0)}. This is a demo simulation.`,
        reasonBn: `সিমুলেটেড অসঙ্গতি (${anomalyType}): এজেন্ট ${agentName} গত ৬০ মিনিটে ${spikeCount}টি ক্যাশ-আউট লেনদেন প্রক্রিয়া করেছে, মোট BDT ${totalValue.toFixed(0)}। এটি একটি ডেমো সিমুলেশন।`,
        evidence: `Agent: ${agentId} (${agentName}) | Transactions: ${spikeCount} | Total: BDT ${totalValue.toFixed(0)} | Period: last 60 min | Type: Simulated ${anomalyType}`,
        assignedTo: "Operations Team",
        assignedRole: "Operations Analyst",
        recommendedSteps: [
          "This is a simulated alert for demonstration purposes",
          "Review the spike transactions listed below",
          "Contact the agent to verify the activity",
          "Mark as resolved once verified",
        ],
        recommendedStepsBn: [
          "এটি প্রদর্শনীর উদ্দেশ্যে একটি সিমুলেটেড সতর্কতা",
          "নিচে তালিকাভুক্ত স্পাইক লেনদেনগুলি পর্যালোচনা করুন",
          "কার্যকলাপ যাচাই করতে এজেন্টের সাথে যোগাযোগ করুন",
          "যাচাই হলে সমাধান হিসেবে চিহ্নিত করুন",
        ],
        status: "open",
        relatedTransactionIds: simTxs.map((t) => t.id),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await db.insert(auditLogsTable).values({
      id: randomUUID(),
      alertId,
      action: "created",
      actor: "System (Simulation Engine)",
      notes: `Simulated anomaly alert created: ${anomalyType}`,
      previousStatus: null,
      newStatus: "open",
      timestamp: new Date(now.getTime() + 1000),
    });

    res.json({
      success: true,
      alertCreated: {
        ...newAlert,
        recommendedSteps: newAlert.recommendedSteps as string[],
        recommendedStepsBn: newAlert.recommendedStepsBn as string[],
        relatedTransactionIds: newAlert.relatedTransactionIds as string[],
        createdAt: newAlert.createdAt.toISOString(),
        updatedAt: newAlert.updatedAt.toISOString(),
      },
      transactionsCreated: spikeCount,
      message: `Simulated ${anomalyType} anomaly for ${prov.name}. ${spikeCount} transactions and 1 alert created.`,
    });
  } catch (err) {
    req.log.error({ err }, "Simulation failed");
    res.status(500).json({ error: "Simulation failed", details: String(err) });
  }
});

export default router;
