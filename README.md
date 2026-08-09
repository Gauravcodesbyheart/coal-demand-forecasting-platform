<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle" alt="Drizzle" />
</p>

# CoalSense AI — Intelligent Coal Demand Forecasting Platform

> An AI-powered decision-support platform for **Central Coalfields Limited (CCL)**
> that forecasts coal demand, optimises production planning, and identifies
> supply gaps — turning operational data into actionable intelligence.

CoalSense AI is a full-stack Next.js web application that combines time-series
forecasting models with role-based access, bulk CSV data ingestion, audit
logging, and scenario ("what-if") planning. It was built as an internship
project for CCL and targets planners, analysts, managers, and mine operators
working across the coal value chain (production → inventory → dispatch →
sectoral demand).

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Forecasting Engine](#forecasting-engine)
- [Role-Based Access Control](#role-based-access-control)
- [Demo Accounts](#demo-accounts)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Data Ingestion (CSV Upload)](#data-ingestion-csv-upload)
- [Audit & Security](#audit--security)
- [Scripts](#scripts)
- [Future Roadmap](#future-roadmap)
- [License](#license)

---

## Key Features

- 🔐 **Authentication & RBAC** — JWT cookie-based auth with four roles (`admin`,
  `analyst`, `manager`, `operator`) and granular permissions.
- 📊 **Executive Dashboard** — KPIs, monthly trends (demand vs production vs
  dispatch), sector/grade-wise demand breakdowns, mine-performance bars, and a
  live forecast area chart (Recharts).
- 📈 **Multi-Model Demand Forecasting** — Four statistical models implemented in
  pure TypeScript plus a weighted ensemble; outputs predictions with 95%
  confidence intervals and model-accuracy metrics (MAE / RMSE / MAPE).
- 🧪 **What-If Scenario Analysis** — Adjust demand growth, production capacity,
  safety stock etc. to instantly see supply gap / surplus and automated
  recommendations.
- ⛏️ **Mine Management** — Register mines, track location and monthly capacity.
- 🏭 **Production / Dispatch / Inventory Logs** — Form-based daily/shift
  entries with coal-grade, sector, destination and cost tracking.
- 📥 **Bulk CSV Upload** — PapaParse-powered import with validation, row-level
  error reporting, and chunked inserts for production, dispatch and demand
  data.
- 🔔 **Notification Centre** — In-app alerts for demand surges, low inventory,
  forecast completion, and system events; unread badge in the sidebar.
- 📝 **Audit Logs** — Immutable record of who did what, when, and from which
  IP, for compliance and traceability.
- 👥 **User Management** — Admin-only console for creating users and assigning
  roles.
- 🎨 **Modern Dark UI** — Tailwind CSS v4 design system with a custom coal-blue
  palette, responsive layout, and a collapsible mobile sidebar.

---

## Tech Stack

| Layer            | Technology                                                      |
| ---------------- | --------------------------------------------------------------- |
| Framework        | [Next.js 16](https://nextjs.org/) (App Router, Server Actions)  |
| UI               | [React 19](https://react.dev/), TypeScript 5                    |
| Styling          | [Tailwind CSS 4](https://tailwindcss.com/) (PostCSS plugin)     |
| Icons            | [lucide-react](https://lucide.dev/)                             |
| Charts           | [Recharts](https://recharts.org/)                               |
| Database         | PostgreSQL (any standard connection, e.g. Supabase / Neon / local) |
| ORM              | [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit`        |
| Auth             | JWT ([`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken)) + bcryptjs password hashing, stored in `httpOnly` cookies |
| CSV Parsing      | [PapaParse](https://www.papaparse.com/)                         |
| Validation       | [Zod](https://zod.dev/) (available for future use)              |
| Linting          | ESLint 9 + `eslint-config-next`                                 |

No Python/ML microservice is required — all forecasting runs in-process as
TypeScript code.

---

## Project Structure

```
coal-demand-forecasting-platform/
├── src/
│   ├── app/
│   │   ├── api/                       # Next.js route handlers (REST endpoints)
│   │   │   ├── auth/                  # login / logout / me
│   │   │   ├── audit-logs/
│   │   │   ├── dashboard/
│   │   │   ├── dispatch/
│   │   │   ├── forecast/
│   │   │   │   ├── history/
│   │   │   │   └── run/
│   │   │   ├── health/
│   │   │   ├── inventory/
│   │   │   ├── mines/
│   │   │   ├── notifications/
│   │   │   ├── production/
│   │   │   ├── seed/
│   │   │   ├── upload/
│   │   │   ├── users/
│   │   │   └── what-if/
│   │   ├── dashboard/                 # Protected UI pages (one per module)
│   │   │   ├── audit-logs/
│   │   │   ├── dispatch/
│   │   │   ├── forecast/
│   │   │   ├── inventory/
│   │   │   ├── mines/
│   │   │   ├── notifications/
│   │   │   ├── production/
│   │   │   ├── upload/
│   │   │   ├── users/
│   │   │   ├── what-if/
│   │   │   ├── layout.tsx             # Sidebar + RBAC-aware navigation
│   │   │   └── page.tsx               # Overview dashboard
│   │   ├── globals.css                # Tailwind + custom "coal" palette
│   │   ├── layout.tsx                 # Root layout (metadata + body)
│   │   └── page.tsx                   # Public login / landing page
│   ├── db/
│   │   ├── index.ts                   # Drizzle + pg Pool (global singleton)
│   │   └── schema.ts                  # All tables and enums
│   └── lib/
│       ├── audit.ts                   # logAudit() helper
│       ├── auth.ts                    # hashing, JWT, RBAC helpers
│       ├── forecasting.ts             # 4 models + ensemble + what-if
│       ├── reset-db.ts                # (placeholder) DB reset utility
│       └── seed.ts                    # Demo-data seeder
├── drizzle.config.ts
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
├── package.json
└── package-lock.json
```

---

## Architecture Overview

```
          ┌──────────────────────────┐
          │  Browser (React 19, RSC) │
          │  Tailwind UI + Recharts  │
          └────────────┬─────────────┘
                       │ HTTPS / Cookie (auth_token, httpOnly)
          ┌────────────▼─────────────┐
          │     Next.js 16 Server    │
          │  ─────────────────────── │
          │ • App Router pages       │
          │ • Route handlers (REST)  │
          │ • Auth (JWT + bcrypt)    │
          │ • Forecasting engine     │
          │ • Audit logger           │
          └────────────┬─────────────┘
                       │ pg driver over TCP, Drizzle ORM
          ┌────────────▼─────────────┐
          │       PostgreSQL         │
          │  users, mines, records,  │
          │  forecasts, audit_logs…  │
          └──────────────────────────┘
```

- **Client** — every `/dashboard/*` page is a client component that fetches
  JSON from `/api/*`. The login page is public and auto-seeds the database on
  first load via `POST /api/seed`.
- **Server** — route handlers verify JWTs (read from the `auth_token` cookie),
  enforce role permissions, query Postgres via Drizzle, and return JSON.
- **Database** — a single PostgreSQL instance. Drizzle-kit manages migrations
  via `src/db/schema.ts`.

---

## Database Schema

All tables are defined in [`src/db/schema.ts`](src/db/schema.ts) using
Drizzle's `pgTable` builder. The schema uses enums for categorical fields to
keep the data clean.

| Table                  | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `users`                | Login accounts with email, bcrypt hash, name, role, active flag        |
| `mines`                | Master list of mines (name, location, monthly capacity in MT)          |
| `production_records`   | Shift-wise production entries (mine, date, grade, tonnage, cost)      |
| `dispatch_records`     | Dispatches (mine, date, grade, sector, destination, tonnage)          |
| `inventory_records`    | Opening/closing stock per mine/grade/date                              |
| `demand_records`       | Sector- and grade-wise demand observations (used by forecaster)        |
| `forecast_runs`        | Metadata for each forecast execution (status, model, metrics, who/when)|
| `forecasts`            | Individual predictions with confidence intervals per run                |
| `recommendations`      | Auto-generated gap/surge/decline alerts tied to a forecast run         |
| `notifications`        | Per-user in-app notifications (read/unread)                            |
| `audit_logs`           | Immutable audit trail of create/update actions with old/new snapshots  |

Enums include `user_role`, `coal_grade` (G1–G17), `shift_type` (A/B/C/General),
`sector_type` (Power/Steel/Cement/Railways/Others), `notif_type` and
`forecast_status`.

---

## Forecasting Engine

The engine lives in [`src/lib/forecasting.ts`](src/lib/forecasting.ts) and is
implemented entirely in TypeScript — no external ML dependency.

Implemented models:

1. **Linear Regression** — ordinary least-squares baseline.
2. **Moving Average** — configurable window (default = 3 months).
3. **Exponential Smoothing** — configurable α (default = 0.3).
4. **Holt's Linear Trend** — double exponential smoothing capturing level and trend.
5. **Weighted Ensemble** — combines all four models using weights inversely
   proportional to each model's in-sample RMSE; produces the final prediction
   that gets persisted.

For each run the engine returns:

- Per-model predictions for the requested horizon (months) with 95% confidence
  intervals (±1.96 × residual std).
- Accuracy metrics **MAE**, **RMSE**, **MAPE**.
- The "best" individual model (lowest MAPE, falling back to RMSE).
- Auto-generated recommendations (demand surge / decline / planning guidance).

A separate **What-If** routine (`runWhatIfAnalysis`) computes expected demand
under a growth assumption, compares it to available supply (inventory +
production capacity) vs. required supply (demand + safety stock) and returns a
`surplus` / `balanced` / `deficit` status with a human-readable recommendation.

---

## Role-Based Access Control

The sidebar, pages and API routes are filtered by permissions defined in
[`src/lib/auth.ts`](src/lib/auth.ts):

| Capability                    | admin | analyst | manager | operator |
| ----------------------------- | :---: | :-----: | :-----: | :------: |
| View dashboard                | ✅    | ✅      | ✅      | ✅       |
| Run / view forecasts          | ✅    | ✅      | ✅      | ❌       |
| What-if analysis              | ✅    | ✅      | ✅      | ❌       |
| View recommendations/reports  | ✅    | ✅      | ✅      | ❌       |
| Upload data (CSV)             | ✅    | ✅      | ❌      | ❌       |
| Enter production              | ✅    | ❌      | ❌      | ✅       |
| Enter dispatch                | ✅    | ❌      | ❌      | ✅       |
| Update inventory              | ✅    | ❌      | ❌      | ✅       |
| Manage mines                  | ✅    | ❌      | ❌      | ❌       |
| Manage users & roles          | ✅    | ❌      | ❌      | ❌       |
| View audit logs               | ✅    | ❌      | ❌      | ❌       |
| View notifications            | ✅    | ✅      | ✅      | ✅       |

Navigation items are dynamically shown/hidden on the client and **every** write
endpoint re-checks permissions on the server, returning `403` on violations.

---

## Demo Accounts

On first visit the app auto-seeds the database (see [`src/lib/seed.ts`](src/lib/seed.ts))
with four accounts and 24 months of realistic CCL-flavoured historical data
across six mines (Piparwar, Ashoka, Magadh, Amrapali, Rajrappa, NK Area) and
six coal grades (G5–G10), with winter peaks, monsoon dips and a gentle upward
trend.

| Role     | Email                    | Password     |
| -------- | ------------------------ | ------------ |
| Admin    | `admin@coalsense.ai`     | `admin123`   |
| Analyst  | `analyst@coalsense.ai`   | `analyst123` |
| Manager  | `manager@coalsense.ai`   | `manager123` |
| Operator | `operator@coalsense.ai`  | `operator123`|

These are also clickable quick-fill buttons on the login page to make demos easy.
**Change the passwords and `JWT_SECRET` before any real deployment.**

---

## Getting Started

### Prerequisites

- **Node.js ≥ 20** (Next.js 16 requirement)
- **npm** (v10+ recommended) or compatible package manager
- **PostgreSQL ≥ 14** (local, Docker, Supabase, Neon, Railway, AWS RDS, etc.)

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required – PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/coalsense?sslmode=require"

# Optional – overrides the hardcoded dev secret. Set this in production!
JWT_SECRET="replace-with-a-long-random-string"

# Optional – Node env (Next.js sets this automatically)
NODE_ENV="development"
```

> The default `JWT_SECRET` (`coalsense-ai-secret-key-change-in-production`) is
> committed in source for demo convenience. Generate a real secret
> (e.g. `openssl rand -hex 32`) for any non-demo environment.

### Installation

```bash
git clone https://github.com/&lt;your-org&gt;/coal-demand-forecasting-platform.git
cd coal-demand-forecasting-platform
npm install
```

### Database Setup

1. Create an empty PostgreSQL database and put its URL in `DATABASE_URL`.
2. Generate + run migrations with Drizzle Kit:

   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

   (You can alternatively use `npx drizzle-kit push` during early development
   to push the schema directly without migrations.)

3. The app will **automatically seed** demo users and historical data the first
   time anyone loads the login page (via `POST /api/seed`). You can also call
   it manually:

   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

   Seeding is idempotent — once users exist it returns immediately.

### Running the App

```bash
npm run dev         # start Next.js dev server on http://localhost:3000
npm run build       # production build
npm start           # serve the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

Open [http://localhost:3000](http://localhost:3000) and log in with one of the
[demo accounts](#demo-accounts).

---

## API Reference

All endpoints (except `/api/auth/login`, `/api/health` and `/api/seed`) require
a valid `auth_token` cookie and return `401`/`403` on auth/permission errors.

| Method | Endpoint                       | Description                                              |
| ------ | ------------------------------ | -------------------------------------------------------- |
| GET    | `/api/health`                  | Liveness probe (runs `SELECT 1`)                         |
| POST   | `/api/auth/login`              | Login with email+password → sets httpOnly JWT cookie     |
| POST   | `/api/auth/logout`             | Clears the auth cookie                                   |
| GET    | `/api/auth/me`                 | Returns the currently authenticated user                 |
| GET    | `/api/dashboard`               | KPIs, monthly trends, grade/sector/mine breakdowns       |
| POST   | `/api/forecast/run`            | Run all models for `horizonMonths` → persist results     |
| GET    | `/api/forecast/history`        | Past forecast runs with predictions &amp; recommendations|
| GET/POST | `/api/mines`                 | List / create mines (admin only for create)              |
| GET/POST | `/api/production`            | List / create production records                         |
| GET/POST | `/api/dispatch`              | List / create dispatch records                           |
| GET/POST | `/api/inventory`             | List / create inventory records                          |
| POST   | `/api/upload`                  | Bulk CSV ingestion (`type`: production/dispatch/demand)  |
| POST   | `/api/what-if`                 | Run what-if scenario analysis                            |
| GET/PATCH | `/api/notifications`        | List notifications / mark all as read                    |
| GET/POST | `/api/users`                 | List users (admin) / create user (admin)                 |
| GET    | `/api/audit-logs`              | Recent audit trail (admin only)                          |
| POST   | `/api/seed`                    | Seed demo data (idempotent)                              |

### Example: Run a forecast

```bash
curl -X POST http://localhost:3000/api/forecast/run \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=&lt;JWT&gt;" \
  -d '{"horizonMonths": 6}'
```

Response includes `modelComparison[]`, `bestModel`, `ensemble` (with 95% CI
forecasts) and auto-generated `recommendations[]`.

---

## Data Ingestion (CSV Upload)

The **Data Upload** page (`/dashboard/upload`) accepts CSV files and parses
them client-side with PapaParse before POSTing the rows to `/api/upload`.
Supported datasets and their required columns:

| Type         | Required columns                                | Optional                 |
| ------------ | ----------------------------------------------- | ------------------------ |
| `production` | `date`, `mineId`, `coalGrade`, `quantity`       | `shift`, `productionCost`|
| `dispatch`   | `date`, `mineId`, `coalGrade`, `quantity`       | `sector`, `destination`  |
| `demand`     | `date`, `coalGrade`, `quantity`                 | `sector`                 |

Validation rules:

- `coalGrade` must be one of `G1`–`G17`.
- `sector` must be `Power | Steel | Cement | Railways | Others`.
- `shift` must be `A | B | C | General`.
- Rows that fail validation are reported back with row number + message; valid
  rows are inserted in chunks of 500 for performance.

---

## Audit &amp; Security

- **Passwords** are hashed with bcrypt (cost factor 12).
- **JWTs** are signed with `JWT_SECRET` (HS256, 24-hour expiry) and sent as
  `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookies — never stored
  in `localStorage`.
- **Authorization** is enforced on every server route via `getCurrentUser()`
  and `hasPermission()`.
- **Audit log** writes happen on: login, forecast run, CSV upload, mine/user
  creation, production/dispatch/inventory record creation. Logs include user
  ID, action, entity, entity ID, old/new JSON snapshots, IP address and
  timestamp, and are viewable by admins at `/dashboard/audit-logs`.
- **No CSRF bypass** is attempted for mutating requests — all state changes go
  through POST/PATCH with cookie-based auth, which benefits from
  `SameSite=Lax`. For stricter deployments add a CSRF token.

---

## Scripts

Defined in [`package.json`](package.json):

| Script            | Command            | Description                                  |
| ----------------- | ------------------ | -------------------------------------------- |
| `npm run dev`     | `next dev`         | Start the development server                 |
| `npm run build`   | `next build`       | Production build                             |
| `npm start`       | `next start`       | Start the production server                  |
| `npm run lint`    | `eslint .`         | Lint the codebase (ESLint 9 flat config)     |
| `npm run typecheck` | `tsc --noEmit`  | Run the TypeScript compiler in check mode    |

---

## Future Roadmap

Potential next steps (not implemented yet):

- Export forecasts / reports to PDF or Excel.
- Full CRUD (edit/deactivate) for users, mines and records (currently create/list only).
- Scheduled (cron) forecast runs and email notifications.
- Integration with CCL's live SCADA/ERP data sources.
- Additional forecasting models (ARIMA/SARIMA, Prophet, LSTM) in a pluggable
  registry so the best model can be selected per grade/sector.
- Per-mine and per-grade forecasts (current engine aggregates demand globally).
- User-configurable password policies, MFA, and refresh tokens.
- E2E test suite (Playwright) and unit tests for the forecasting math.

---

## License

This project was developed as an internship project for **Central Coalfields
Limited (CCL)**. No explicit license is attached — treat it as proprietary /
internal-use code unless the repository owners add a `LICENSE` file.

---

<div align="center">
  <sub>Built with ⚡ at CCL — CoalSense AI © 2024</sub>
</div>
