import { Router } from "express";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { alertsTable, transactionsTable, providersTable } from "@workspace/db/schema";
import { eq, desc, gte } from "drizzle-orm";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ─── POST /ai/analyze-alert/:id ─────────────────────────────────────────────
// GPT-powered deep analysis of a specific alert
router.post("/ai/analyze-alert/:id", async (req, res) => {
  try {
    const [alert] = await db
      .select()
      .from(alertsTable)
      .where(eq(alertsTable.id, req.params.id));

    if (!alert) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    // Fetch related transactions if any
    let relatedTxSummary = "No related transactions available.";
    if (alert.relatedTransactionIds && alert.relatedTransactionIds.length > 0) {
      const txs = await db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.providerId, alert.providerId))
        .orderBy(desc(transactionsTable.timestamp))
        .limit(10);

      if (txs.length > 0) {
        relatedTxSummary = txs
          .map(
            (t) =>
              `- ${t.type} | BDT ${Number(t.amount).toLocaleString()} | Agent: ${t.agentName} | ${new Date(t.timestamp).toISOString()} | Flagged: ${t.flagged}`
          )
          .join("\n");
      }
    }

    const systemPrompt = `You are an expert financial operations analyst for a Mobile Financial Services (MFS) company in Bangladesh. 
You analyze transaction anomalies and liquidity alerts for providers like bKash, Nagad, and Rocket (DBBL).
Your role is DECISION SUPPORT ONLY. You help operations teams understand risks and take informed actions.
You NEVER accuse anyone of fraud — use careful, professional language like "warrants review", "unusual pattern", "requires verification".
Always structure your response clearly. Be concise but thorough.`;

    const userPrompt = `Analyze this alert and provide a professional assessment:

ALERT TYPE: ${alert.type.toUpperCase()}
SEVERITY: ${alert.severity.toUpperCase()}
PROVIDER: ${alert.providerName}
TITLE: ${alert.title}
REASON: ${alert.reason}
EVIDENCE: ${alert.evidence}
CURRENT STATUS: ${alert.status}
ASSIGNED TO: ${alert.assignedTo} (${alert.assignedRole})

RELATED TRANSACTIONS (recent):
${relatedTxSummary}

Please provide:
1. **Risk Assessment** — How serious is this? Rate 1-10 and explain why.
2. **Pattern Analysis** — What does the data pattern suggest? Any contextual factors to consider?
3. **Immediate Actions** — What should the ops team do in the next 30 minutes?
4. **Escalation Criteria** — Under what conditions should this be escalated?
5. **Resolution Checklist** — What evidence is needed to safely mark this as resolved?

Keep your response focused and actionable. Use professional MFS operations language.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const analysis = completion.choices[0]?.message?.content ?? "Analysis unavailable.";

    res.json({
      alertId: alert.id,
      analysis,
      model: completion.model,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "AI alert analysis failed");
    res.status(500).json({ error: "AI analysis failed", details: String(err) });
  }
});

// ─── POST /ai/chat ────────────────────────────────────────────────────────────
// Conversational AI assistant with live dashboard context
router.post("/ai/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // Fetch live context
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [providers, openAlerts, recentTxs] = await Promise.all([
      db.select().from(providersTable),
      db
        .select()
        .from(alertsTable)
        .where(eq(alertsTable.status, "open"))
        .orderBy(desc(alertsTable.createdAt))
        .limit(5),
      db
        .select()
        .from(transactionsTable)
        .where(gte(transactionsTable.timestamp, since24h))
        .orderBy(desc(transactionsTable.timestamp))
        .limit(20),
    ]);

    const providerContext = providers
      .map(
        (p) =>
          `${p.name}: e-money BDT ${Number(p.eMoneyBalance).toLocaleString()}, physical cash BDT ${Number(p.physicalCashBalance).toLocaleString()}, liquidity ${(Number(p.eMoneyBalance) / (Number(p.eMoneyBalance) + Number(p.physicalCashBalance)) * 100).toFixed(1)}%, status: ${p.status}, agents: ${p.totalAgents}`
      )
      .join("\n");

    const alertContext =
      openAlerts.length > 0
        ? openAlerts
            .map((a) => `[${a.severity.toUpperCase()}] ${a.title} — ${a.providerName} (${a.type})`)
            .join("\n")
        : "No open alerts.";

    const txSummary = `${recentTxs.length} transactions in last 24h. Flagged: ${recentTxs.filter((t) => t.flagged).length}. Total volume: BDT ${recentTxs.reduce((s, t) => s + Number(t.amount), 0).toLocaleString()}`;

    const systemPrompt = `You are FinOps AI, an expert assistant for a Multi-Provider Mobile Financial Services (MFS) operations center in Bangladesh. You help operations analysts make informed decisions about liquidity management and transaction monitoring.

You have access to LIVE system data (updated as of this conversation):

PROVIDER STATUS:
${providerContext}

OPEN ALERTS (${openAlerts.length} active):
${alertContext}

TRANSACTION SUMMARY (last 24h):
${txSummary}

Guidelines:
- Be concise and direct — ops teams need fast answers
- Use professional MFS terminology
- Never make definitive fraud accusations — say "warrants review" or "unusual pattern"
- When discussing amounts, use BDT currency
- Respond in the same language the user writes in (English or Bengali)
- If asked about something outside your data, say so clearly`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10), // keep last 10 turns for context
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages,
      temperature: 0.4,
    });

    const reply = completion.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";

    res.json({ reply, generatedAt: new Date().toISOString() });
  } catch (err) {
    req.log.error({ err }, "AI chat failed");
    res.status(500).json({ error: "AI chat failed", details: String(err) });
  }
});

// ─── POST /ai/detect-anomalies ────────────────────────────────────────────────
// GPT scans recent transactions and identifies suspicious patterns
router.post("/ai/detect-anomalies", async (req, res) => {
  try {
    const { providerId } = req.body as { providerId?: string };

    // Pull last 50 transactions
    const query = db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.timestamp))
      .limit(50);

    const txs = await query;

    if (txs.length === 0) {
      res.json({ findings: [], message: "No transactions available to analyze. Please seed data first." });
      return;
    }

    const filtered = providerId ? txs.filter((t) => t.providerId === providerId) : txs;

    const txData = filtered
      .map(
        (t) =>
          `${t.id.split("-")[0]} | ${t.providerId} | ${t.type} | BDT ${Number(t.amount).toFixed(0)} | agent:${t.agentName} | ${new Date(t.timestamp).toISOString()}`
      )
      .join("\n");

    const prompt = `You are an MFS fraud & anomaly detection analyst. Analyze these recent transactions and identify ANY unusual patterns that warrant human review.

TRANSACTIONS (most recent first):
${txData}

Identify up to 3 notable patterns. For each finding, respond in this exact JSON format:
{
  "findings": [
    {
      "pattern": "short pattern name",
      "severity": "low|medium|high",
      "description": "2-3 sentence description of what you observed",
      "affectedAgent": "agent name if applicable or null",
      "transactionIds": ["id1", "id2"],
      "recommendation": "one sentence action"
    }
  ],
  "overallRisk": "low|medium|high",
  "summary": "one sentence overall assessment"
}

Be conservative — only flag genuine anomalies, not normal transaction patterns. If no anomalies, return empty findings array.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { findings: unknown[]; overallRisk: string; summary: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { findings: [], overallRisk: "unknown", summary: "Could not parse AI response." };
    }

    res.json({
      ...parsed,
      transactionsAnalyzed: filtered.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "AI anomaly detection failed");
    res.status(500).json({ error: "AI detection failed", details: String(err) });
  }
});

export default router;
