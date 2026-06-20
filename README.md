# Flagly — Incident Reporting

Flagly is an incident-reporting application for leisure-centre operators, built in
the style of the **Centrely** suite. Managers report, investigate and close out
workplace incidents across their sites and track the full lifecycle:

> initial report → severity triage → witness statements → injured-party records →
> follow-up actions → investigation → closure

The primary user is a duty manager filling in a report at the scene on a phone, so
the **Report New Incident** form is the heart of the product and is built to work
comfortably one-handed at 375px.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4** · Radix UI primitives (shadcn-style) · **lucide-react**
- **Prisma 6** + **PostgreSQL**
- **Zod 4** validation · **next-auth v5** (credentials) · **@tanstack/react-table v8**
- **recharts 3** (trend chart) · **sonner** (toasts) · **date-fns 4**
- **jsPDF** (single-incident PDF) · **SheetJS / xlsx** (incident-log export)
- Fonts: Inter (body + headings) · Archivo expanded (signage page titles) · JetBrains Mono (labels / data)
- **"Duty board"** visual identity — a teal "on watch" accent and expanded-signage
  page titles, light-first with full dark-mode support, all driven by CSS
  custom-property tokens (re-skin by swapping token values only).

## Getting started

```bash
# 1. Install
npm install

# 2. Configure the database (copy and edit)
cp .env.example .env          # set DATABASE_URL, DATABASE_URL_UNPOOLED, AUTH_SECRET

# 3. Create the schema + generate the client
npm run db:migrate

# 4. (Optional) seed realistic demo data
npm run db:seed

# 5. Run
npm run dev                   # http://localhost:3000
```

### First login

On a fresh database (no users), the sign-in page shows a one-time **"Create the
first administrator"** form. Enter your name, email and password to create the
initial Admin account — a starter centre is created automatically so you can
report incidents straight away. After that it's a normal sign-in page.

### Demo login (after `npm run db:seed`)

```
Operations Manager (admin):  fernandoserina@leisureworldcork.com
Staff:                       manager@leisureworld.ie
Password (all accounts):     password123
```

The seed creates two centres (LeisureWorld Cork `LW`, LeisureWorld Dublin `LD`),
each with their own areas/sub-areas, four users (an Operations Manager + three
staff, all password `password123`), and eight incidents across the last six months —
including a REPORTABLE staff injury with an overdue follow-up action, so the
dashboard is populated from first load.

Deploying to Vercel + Neon? See **[DEPLOY.md](./DEPLOY.md)**.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright smoke + axe a11y gate (needs a built app, seeded DB, `npx playwright install chromium`) |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset the database and re-seed |

## Routes

| Route | Page |
|---|---|
| `/flagly` | Dashboard (KPI cards, activity trend, top areas, type breakdown, leaderboards) |
| `/flagly/incidents` | All incidents — filterable table, Excel/PDF export |
| `/flagly/incidents/new` | Report a new incident (the core form) |
| `/flagly/incidents/[id]` | Incident detail — Overview / Witnesses / Injured / Actions tabs |
| `/flagly/incidents/[id]/edit` | Edit core incident fields |
| `/flagly/actions` | Cross-incident follow-up actions |
| `/flagly/centres` | Manage centres — add / edit / site code (Operations Manager only) |
| `/flagly/areas` | Manage per-centre areas & sub-areas (Operations Manager only) |
| `/flagly/users` | Manage users — name / email / role / centres / password (Operations Manager only) |

## Architecture

- **Reads** are async Server Components calling `src/lib/flagly/data/*`.
- **Mutations** are Zod-validated Server Actions in `src/lib/flagly/actions/*`,
  returning a discriminated `ActionResult`.
- `"use client"` is used only for forms, interactivity and table filtering.
- Incident references (`INC-XX-NNNN`) are generated server-side inside a
  transaction (`src/lib/flagly/reference.ts`).
- Locations are a per-centre **Area → SubArea** taxonomy; an incident stores the
  `areaId`/`subAreaId` plus denormalised name copies (`location`/`locationDetail`).
- `ActionStatus.OVERDUE` is stored (for efficient queries) and refreshed on read
  via a lightweight sweep function.

See `AGENTS.md` for contributor conventions.
