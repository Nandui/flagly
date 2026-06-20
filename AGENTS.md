# AGENTS.md — Flagly conventions

Read this before changing code.

## Stack & runtime

- **Next.js 16** App Router with React 19 and Turbopack. This is a major version
  with breaking changes from earlier Next:
  - `params` and `searchParams` in pages are **Promises** — always `await` them.
  - Route handlers default to the Node runtime; auth lives in the Node runtime
    (Prisma + bcrypt), so there is intentionally **no edge middleware** — auth is
    enforced in the `(app)` layout server component via `requireUser()`.
- Prisma is pinned to **v6** (not v7). The client is generated to
  `node_modules/@prisma/client`. A singleton lives in `src/lib/prisma.ts`.

## Data flow

- **Reads:** async Server Components → `src/lib/flagly/data/*`. These return plain,
  serializable shapes from `src/lib/flagly/types.ts` (Dates pass through the RSC
  boundary fine). Don't fetch on the client for initial load.
- **Mutations:** Server Actions in `src/lib/flagly/actions/*`, each marked
  `"use server"`. Every action:
  1. checks the session (`getCurrentUser`),
  2. validates input with a Zod schema from `src/lib/flagly/validation.ts`,
  3. returns an `ActionResult<T>` (`{ ok: true, data } | { ok: false, error }`)
     built with the helpers in `actions/result.ts`,
  4. calls `revalidatePath("/flagly", "layout")`.
- Client forms call actions inside `useTransition`, then `toast` + `router.refresh()`.
- `"use client"` only for forms, interactivity and table filtering.

## Domain rules (don't break these)

- The site model is **`Center`** (American spelling) — every relation uses
  `centerId` / `Center`. Never introduce a `Centre` model.
- Incident references are **`INC-XX-NNNN`** (`XX` = `Center.siteCode`), generated
  server-side inside a transaction with retry on unique collision
  (`src/lib/flagly/reference.ts` + `actions/incidents.ts`).
- RIDDOR/HSA deadlines are **legally significant**. The day counts live in
  `src/lib/flagly/deadline.ts` (HSA Ireland: 7 / 30-working-day rules; RIDDOR
  NI/UK: 10 / 15-day rules). Deadlines are recomputed server-side on flag create.
- Drafts (`status = DRAFT`) do **not** trigger the RIDDOR banner, do not require a
  full narrative, and do not appear on the dashboard active list. `OPEN` and above
  do.
- `ActionStatus.OVERDUE` / `RiddorStatus.OVERDUE` are stored in the DB and refreshed
  on read by the sweep functions in `data/incidents.ts`.

## Design system

Flagly follows the **Ecosystem Visualization** design language:

- **Palette** — warm terracotta/orange accent (`--primary` `#e48b59`, `--ring`/accent
  `#ed7b46`) on a **white canvas**, with a **slate chrome** (`#53617a`) used for the
  sidebar, `#111827`/`#4b5563` text and `#d8dadf` borders.
- **Radii** — 16px cards (`rounded-[var(--radius-card)]`), 8px controls
  (`--radius` = `0.5rem`), pill badges. Cards sit on the white canvas with a subtle
  border + the `.shadow-card` depth (hover → `.shadow-card-lift`).
- **Type** — Inter (display + body), JetBrains Mono for labels/data. Loaded via
  `<link>` in `src/app/layout.tsx`, wired to `--font-display` / `--font-sans` /
  `--font-mono`. Use `font-mono` for references, dates and the `.eyebrow` motif.
- Tokens live in `src/app/globals.css` (`@theme` neutrals/chrome + `:root`/`.dark`
  shadcn tokens, mapped through `@theme inline`). Flagly's `severity-*` / `status-*`
  colour layer is semantic — use those utilities, don't hardcode hex.
- UI primitives live in `src/components/ui/*` (shadcn-style on Radix). Flagly
  feature components live in `src/components/flagly/*`.

## Before you commit

```bash
npm run typecheck   # must pass
npm run build       # must pass
```
