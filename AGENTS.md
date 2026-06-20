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

Flagly follows the **Spatial Interface Systems** design language:

- **Palette** — blue accent (`--primary` `#3b82f6`, accent/`--ring` `#2563eb`) on
  **white surfaces** (canvas, sidebar and cards are all white), with `#111827`/
  `#4b5563` text and `#e5e7eb` borders. The sidebar is white with a blue-50 active
  state.
- **Radii** — 11px cards (`rounded-[var(--radius-card)]`), 7px controls
  (`--radius` = `0.4375rem`), pill badges. Panels sit on the white canvas with a
  subtle border + the `.shadow-card` depth (hover → `.shadow-card-lift`).
- **Type** — Inter (display + body), JetBrains Mono for labels/data. Loaded via
  `<link>` in `src/app/layout.tsx`, wired to `--font-display` / `--font-sans` /
  `--font-mono`. Use `font-mono` for references, dates and the `.eyebrow` motif.
- Tokens live in `src/app/globals.css` (`@theme` neutrals/chrome + `:root`/`.dark`
  shadcn tokens, mapped through `@theme inline`). Flagly's `severity-*` / `status-*`
  colour layer is semantic — use those utilities, don't hardcode hex.
## shadcn/ui

This project uses **shadcn/ui** as its component library (config in
`components.json`, style `new-york`, base colour `neutral`, CSS variables on,
icon library `lucide`). The primitives in `src/components/ui/*` are the canonical
registry components and own their source — edit them in place.

- They import Radix from the **unified `radix-ui` package** (the current registry
  convention), not the individual `@radix-ui/react-*` packages.
- Add more with `npx shadcn@latest add <component>` — the `components.json`
  aliases (`@/components/ui`, `@/lib/utils`, …) make them drop straight in.
  - Note: in this sandbox the shadcn registry host (`ui.shadcn.com`) is
    IP-blocked, so the CLI's fetch fails here. When that happens, pull the same
    files from the registry source on GitHub raw
    (`shadcn-ui/ui` → `apps/v4/registry/new-york-v4/ui/<name>.tsx`) and rewrite the
    internal `@/registry/new-york-v4/{ui,lib,hooks}/…` imports to the project
    aliases.
- Theme = the design tokens in `globals.css`; components stay canonical, so only
  tokens change between design iterations. Flagly feature components live in
  `src/components/flagly/*` and compose the shadcn primitives.

## Before you commit

```bash
npm run typecheck   # must pass
npm run build       # must pass
```
