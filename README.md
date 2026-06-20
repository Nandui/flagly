# Flagly — Incident Reporting

Flagly is an incident-reporting application for leisure-centre operators, built in
the style of the **Centrely** suite. Managers report, investigate and close out
workplace incidents across their sites and track the full lifecycle:

> initial report → severity triage → witness statements → injured-party records →
> follow-up actions → authority notification (HSA / RIDDOR) → closure

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
- Fonts: Inter (display + body) · JetBrains Mono (labels / data)
- Light-first design with full dark-mode support, driven by CSS custom-property tokens.

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
Email:    manager@leisureworld.ie
Password: password123
```

The seed creates two centres (LeisureWorld Cork `LW`, LeisureWorld Dublin `LD`),
one Admin user, and eight incidents across the last six months — including a
REPORTABLE staff injury with a pending HSA flag approaching its deadline, so the
dashboard is populated from first load.

Deploying to Vercel + Neon? See **[DEPLOY.md](./DEPLOY.md)**.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Run the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset the database and re-seed |

## Routes

| Route | Page |
|---|---|
| `/flagly` | Dashboard (stats, RIDDOR alert banner, active incidents, overdue actions, 6-month trend) |
| `/flagly/incidents` | All incidents — filterable table, Excel/PDF export |
| `/flagly/incidents/new` | Report a new incident (the core form) |
| `/flagly/incidents/[id]` | Incident detail — Overview / Witnesses / Injured / Actions / RIDDOR tabs |
| `/flagly/incidents/[id]/edit` | Edit core incident fields |
| `/flagly/riddor` | RIDDOR / HSA tracker with deadline countdowns |
| `/flagly/actions` | Cross-incident follow-up actions |
| `/flagly/centres` | Manage centres — add / edit / site code (Admin only) |

## Architecture

- **Reads** are async Server Components calling `src/lib/flagly/data/*`.
- **Mutations** are Zod-validated Server Actions in `src/lib/flagly/actions/*`,
  returning a discriminated `ActionResult`.
- `"use client"` is used only for forms, interactivity and table filtering.
- Incident references (`INC-XX-NNNN`) are generated server-side inside a
  transaction (`src/lib/flagly/reference.ts`).
- RIDDOR/HSA reporting deadlines are computed from the real HSA Ireland and
  RIDDOR (NI/UK) rules in `src/lib/flagly/deadline.ts`.
- `ActionStatus.OVERDUE` and `RiddorStatus.OVERDUE` are stored (for efficient
  queries) and refreshed on read via lightweight sweep functions.

See `AGENTS.md` for contributor conventions.
