# Multi-Provider Financial Agent Decision-Support System

A production-level, hackathon-ready prototype that helps a "super agent" and operations teams understand liquidity pressure, cross-provider imbalances, and unusual transaction behaviors — **without performing any real financial actions**.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Replit Proxy (Port 80)                       │
│  Path: /         → React Dashboard (Vite, port assigned)           │
│  Path: /api      → Express API Server (port assigned)              │
└────────────┬──────────────────────────┬────────────────────────────┘
             │                          │
    ┌────────▼────────┐        ┌────────▼────────────────┐
    │  React Frontend  │        │   Node.js/Express API   │
    │  (Vite + React)  │◄──────►│   (artifacts/api-server)│
    │  Wouter Router   │  REST  │   Drizzle ORM           │
    │  Recharts Charts │        │   Zod Validation        │
    └─────────────────┘        └────────────┬────────────┘
                                            │
                               ┌────────────▼────────────┐
                               │  PostgreSQL Database     │
                               │  (Replit-provisioned)   │
                               │                         │
                               │  Tables:                │
                               │  • providers            │
                               │  • transactions         │
                               │  • alerts               │
                               │  • audit_logs           │
                               └─────────────────────────┘
```

### Database Schema

| Table | Description |
|-------|-------------|
| `providers` | bKash, Nagad, Rocket — e-money & physical cash balances, agent counts |
| `transactions` | Synthetic MFS transactions: cash_in/out, P2P, bill_payment, salary |
| `alerts` | Liquidity + anomaly alerts with bilingual text, assignee, status |
| `audit_logs` | Immutable log of every action taken on any alert |

---

## Features

### Core Modules

1. **Multi-Provider View** — Distinct color-coded provider cards (bKash=pink, Nagad=orange, Rocket=purple) showing e-money and physical cash balances separately
2. **Liquidity Monitoring** — Liquidity ratio progress bars (green >95%, amber 75–95%, red <75%), 24h trend chart
3. **Anomaly Detection** — Transaction spike detection (3×+ volume vs 7-day avg), off-hours pattern flagging — labeled "Requires Review", never "Fraud"
4. **Alert & Coordination Flow** — Full alert detail with evidence, bilingual reason, assigned role, recommended steps, status tracking (Open → Escalated → Resolved), comment system
5. **Synthetic Data Engine** — `/api/seed` endpoint generates 200+ realistic anonymized transactions; `/api/simulate/anomaly` triggers live demo anomalies
6. **Bilingual UI** — Full English/Bengali locale toggle, persisted to localStorage

### Safety Guarantees
- No system action ever triggers a financial transfer
- All anomalies are "Requires Review", never "Fraud"
- Every alert shows the reasoning and evidence behind it
- Persistent audit trail for all human actions

---

## Local Setup (Replit)

The project runs inside Replit's monorepo. Everything is pre-configured.

### Prerequisites
- Replit account with the project open
- Database is auto-provisioned (PostgreSQL)

### Running

Workflows start automatically. If needed, start them manually:
- **API Server**: `pnpm --filter @workspace/api-server run dev`
- **Dashboard**: `pnpm --filter @workspace/dashboard run dev`

### Seed the Database

From the dashboard UI, click **"Seed Data"** on the main dashboard. This populates:
- 3 providers (bKash, Nagad, Rocket)
- 200 synthetic transactions
- 3 pre-configured alerts

Or via API:
```bash
curl -X POST http://localhost:80/api/seed \
  -H "Content-Type: application/json" \
  -d '{"reset": true, "transactionCount": 200}'
```

### Simulate an Anomaly

```bash
curl -X POST http://localhost:80/api/simulate/anomaly \
  -H "Content-Type: application/json" \
  -d '{"providerId": "bkash", "anomalyType": "spike"}'
```

Or use the "Simulate Anomaly" button on the dashboard.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/providers` | All providers with live balances |
| `GET` | `/api/providers/:id` | Single provider detail |
| `GET` | `/api/transactions` | Transactions (filter: providerId, type, flagged) |
| `GET` | `/api/transactions/stats` | Hourly/daily volume stats for charts |
| `GET` | `/api/alerts` | Alerts (filter: status, type, providerId) |
| `GET` | `/api/alerts/:id` | Alert detail with audit log + related txs |
| `PATCH` | `/api/alerts/:id` | Update alert status |
| `POST` | `/api/alerts/:id/comments` | Add comment to alert |
| `GET` | `/api/audit-logs` | Global audit log |
| `GET` | `/api/dashboard` | Dashboard summary stats |
| `POST` | `/api/seed` | Seed synthetic data |
| `POST` | `/api/simulate/anomaly` | Trigger demo anomaly |

---

## Deployment

### Environment Variables

| Variable | Description | Replit | Vercel | Render |
|----------|-------------|--------|--------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-provisioned | N/A | Set from Render DB |
| `PORT` | Server port | Auto-assigned | N/A | Auto-assigned |
| `BASE_PATH` | Frontend base path | Auto-assigned | `/` | N/A |
| `NODE_ENV` | Environment | `development` | `production` | `production` |

### Deploy Frontend to Vercel

1. Fork the repo and connect to Vercel
2. Set **Root Directory** to `artifacts/dashboard`
3. Build command: `pnpm run build`
4. Output directory: `dist/public`
5. Set env var: `VITE_API_BASE_URL=https://your-render-backend.com/api`
6. Update `lib/api-client-react/src/custom-fetch.ts` to use `VITE_API_BASE_URL`

### Deploy Backend to Render

1. Connect repo to Render as a **Web Service**
2. Set **Root Directory** to `artifacts/api-server`
3. Build command: `pnpm install && pnpm run build`
4. Start command: `node --enable-source-maps ./dist/index.mjs`
5. Add a **PostgreSQL** database on Render, set `DATABASE_URL`
6. Run schema push: add a pre-deploy hook `pnpm --filter @workspace/db run push`

### MongoDB Migration (for Render with MongoDB Atlas)

The schema maps 1:1 to MongoDB collections. Swap `lib/db` for Mongoose:

```javascript
// providers.model.js
const ProviderSchema = new mongoose.Schema({
  _id: String,
  name: String,
  displayName: String,
  colorCode: String,
  eMoneyBalance: Number,
  physicalCashBalance: Number,
  totalAgents: Number,
  status: { type: String, enum: ['healthy', 'warning', 'critical'] },
  lastUpdated: Date,
});

// transactions.model.js
const TransactionSchema = new mongoose.Schema({
  providerId: String,
  type: { type: String, enum: ['cash_in','cash_out','p2p_transfer','bill_payment','salary_disbursement'] },
  amount: Number,
  agentId: String, agentName: String, customerId: String,
  status: { type: String, enum: ['completed','pending','failed'] },
  flagged: Boolean, flagReason: String,
  timestamp: Date,
});

// alerts.model.js
const AlertSchema = new mongoose.Schema({
  type: { type: String, enum: ['liquidity','anomaly'] },
  severity: { type: String, enum: ['low','medium','high','critical'] },
  providerId: String, providerName: String, providerColor: String,
  title: String, titleBn: String,
  reason: String, reasonBn: String,
  evidence: String,
  assignedTo: String, assignedRole: String,
  recommendedSteps: [String], recommendedStepsBn: [String],
  status: { type: String, enum: ['open','escalated','resolved'], default: 'open' },
  relatedTransactionIds: [String],
}, { timestamps: true });

// audit_logs.model.js
const AuditLogSchema = new mongoose.Schema({
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
  action: { type: String, enum: ['created','status_changed','comment_added','assigned','escalated','resolved'] },
  actor: String, notes: String,
  previousStatus: String, newStatus: String,
  timestamp: Date,
});
```

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Express backend
│   │   └── src/
│   │       └── routes/      # providers, transactions, alerts, audit, dashboard, seed
│   └── dashboard/           # React frontend
│       └── src/
│           └── pages/       # Dashboard, Transactions, Alerts, AlertDetail, AuditLog, Settings
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema + connection
└── README.md
```

---

## Safety & Compliance Notes

- **No real financial data is used.** All transactions are synthetically generated.
- **No automated actions.** The system is display and decision-support only.
- **"Requires Review" not "Fraud".** All anomaly labels use non-accusatory language.
- **Auditability.** Every status change and comment is logged with actor + timestamp.
- **Explainability.** Every alert includes structured evidence and recommended steps.
