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
- **Per-request caching (perf):** reads that several components hit in one render
  are wrapped in React `cache()` so they run once per request — `getCurrentUser`,
  `listCenters`, `getActiveCenter`, `getFlaglyContext` and `getIncidentDetail`
  (the detail page + its `generateMetadata` share one fetch). Wrap new shared
  reads the same way; each DB round-trip is expensive on Neon. Routes under
  `/flagly` show `loading.tsx` instantly on navigation.
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
- **Locations are a per-centre `Area → SubArea` taxonomy** (2 levels). An incident
  references `areaId` (required) and `subAreaId` (optional). The chosen names are
  **denormalised** onto `Incident.location` / `locationDetail` server-side (in
  `actions/incidents.ts` via `resolveLocation`) so lists, the dashboard ("Top
  areas") and exports never join. Area FKs are `onDelete: SetNull`; the admin
  delete actions still block removing an area/sub-area that any incident uses.
  Areas are managed under **Admin → Areas** (`/flagly/areas`,
  `data/areas.ts` + `actions/areas.ts`); the incident form gets all centres'
  areas via `getAreaOptions()` and filters client-side.
- Drafts (`status = DRAFT`) do **not** require a full narrative and do not appear
  on the dashboard active list. `OPEN` and above do.
- `ActionStatus.OVERDUE` is stored in the DB and refreshed on read by
  `sweepOverdueActions` in `data/incidents.ts`.
- **Follow-up actions are added during the investigation**, not on the report
  form — the report form (`IncidentForm`, mobile-first) captures only the
  incident + people involved; actions are managed from the incident detail's
  Follow-up actions tab (`FollowUpActionForm`).
- **Roles & admin:** roles live in `src/lib/centrely/roles.ts` (`USER_ROLES`:
  Operations Manager, CEO, Duty Manager, Shift Supervisor, Department Supervisor).
  The **Operations Manager** is the admin-equivalent. Never compare
  `role === "Admin"` — always use the `isAdmin(role)` helper, which is the single
  source of truth (enforced in every admin server action + page guard, and the
  sidebar's admin group).
- **Reporter attribution:** an incident is attributed to the signed-in user
  (`reportedBy` name + `reportedById` link). Only admins (`isAdmin`) may attribute
  a report to a different user — enforced server-side in `actions/incidents.ts`
  (`resolveReporter`), not just in the form. `reportedById` is a loose link (no
  FK), so deleting a user keeps the recorded `reportedBy` name.
- **Users** are managed under **Admin → Users** (`/flagly/users`,
  `data/users.ts` + `actions/users.ts`); passwords are bcrypt-hashed via
  `lib/password.ts`. Guards stop an admin deleting their own account or
  removing/demoting the last remaining Operations Manager.
- **User ↔ centre is many-to-many** (`User.centers`). It is **recorded, not
  access-restricting**: the centre switcher still lists every centre; membership
  only sets a user's default landing centre (`getActiveCenter`). There is no
  `User.centerId` and no `centerId` on the session — resolve membership from the
  DB when needed.

## Design system

Flagly shares the **Centrely** design system with its sibling app **Riskly** —
Flagly must read as an extension of Riskly. Match it exactly; when in doubt, copy
Riskly's token or pattern rather than inventing one.

- **Palette** — **indigo** accent (`--primary` `#4f46e5` indigo-600, `--ring`
  `#6366f1`, `--accent` `#eef2ff` indigo-50 / `--accent-foreground` `#3730a3`) on a
  **cool-slate canvas** (`#f3f6f8`) with **white cards** and a **white sidebar**.
  Text is `#0f1c2e` ink / `#64748b` muted; borders `#e3e8ee`. Active nav uses the
  indigo-50 accent. Severity (green→amber→orange→red) is the byte-for-byte
  **risk palette from Riskly** and is semantic — never decoration.
- **Radii** — 12px cards (`rounded-[var(--radius-card)]` = `0.75rem`), 10px controls
  (`--radius` = `0.625rem`), pill badges. Cards are `border border-line bg-surface`
  with the subtle `.shadow-card` depth (≈ Tailwind `shadow-xs`; hover →
  `.shadow-card-lift`) and a `border-b` header divider.
- **Type** — **Space Grotesk** (display/headings) · **IBM Plex Sans** (body) ·
  **IBM Plex Mono** (labels/data), loaded via **`next/font/google`** in
  `src/app/layout.tsx` and wired to `--font-display` / `--font-sans` / `--font-mono`
  — same families and mechanism as Riskly. Use `font-mono` for references, dates and
  the `.eyebrow` motif (mono, uppercase, `0.14em` tracking).
- Tokens live in `src/app/globals.css` (`@theme` neutrals/chrome + severity/status
  palette + `:root`/`.dark` shadcn tokens, mapped through `@theme inline`). Flagly's
  `severity-*` / `status-*` colour layer is semantic — use those utilities, don't
  hardcode hex.
- The app is an **analytics-dashboard** layout: a cool-slate canvas (`bg-canvas`, set
  on `SidebarInset`) with white cards floating on it.
- **Libraries match Riskly:** Radix is loaded via the individual
  `@radix-ui/react-*` packages (not the unified `radix-ui` meta-package), and
  `@vercel/analytics` + `@vercel/speed-insights` are wired in `layout.tsx` — same
  as Riskly. The rest of the shared design layer (Tailwind v4 tokens, shadcn
  new-york/slate, recharts, motion, sonner, lucide) is identical too.

### House style — build every screen this way

- **Surfaces:** use `Panel` (`@/components/flagly/shared/Panel`) for every card —
  it is the canonical white surface (radius-card + `.shadow-card`, optional
  `title`/`description`/`action` header). For a flush table inside, pass
  `contentClassName="p-0"`. Don't hand-roll the `rounded-[var(--radius-card)] border
  bg-card shadow-card` div anymore.
- **KPIs:** `MetricCard` (`shared/MetricCard`) — small muted label, big tabular
  value, optional `sub`, `tone` (`default|danger|warning|success`), `href`, and a
  `spark` number[] that renders an inline `Sparkline`.
- **Distributions / leaderboards:** `DistributionPanel` (gradient bars: `warm` /
  `cool` / `green` / `amber` via the `.bar-*` utilities) and `LeaderboardPanel`
  (rank + ▲▼ trend) under `components/flagly/dashboard/`.
- **Pages:** `PageHeader` at top, then a `space-y-5/6` column. Filter rows are a
  `flex flex-wrap items-center gap-2` of pill `Select`s with a muted `Label:`
  prefix inside the trigger (see `DashboardFilters` / the list tables).
- **Panel/section titles:** `text-sm font-semibold`. Tiny field labels: the
  `.eyebrow` motif or `text-xs uppercase tracking-wide text-muted-foreground`.
- Clickable cards get the hover lift (`hover:-translate-y-0.5
  hover:shadow-card-lift`); page transitions fade in via the shell's motion wrapper.
- **Dashboards lead with action:** an `AttentionPanel` (overdue actions + open
  reportable incidents) sits above the KPI row; `MetricCard` takes a `delta`
  (`{ value, goodWhen }`) for vs-previous-period comparison; the header shows an
  "Updated …" freshness time. Charts must ship an accessible alternative — see
  `ActivityChart`'s `sr-only` data table with the SVG `aria-hidden`.
- **Tables (list pages):** TanStack Table with `getSortedRowModel` (sortable
  headers + chevron affordance; rank-based `sortingFn` for severity/status) and
  `getPaginationRowModel` (page footer). Below `md`, render a stacked **card**
  layout instead of horizontal scroll (see `IncidentTable`). No-results is an
  actionable `EmptyState` (Clear/Reset filters), never a bare "no rows" cell.
- **Forms:** validate inline — set per-field messages via `Field`'s `error` slot
  with `aria-invalid` on the control, plus an error-summary banner that focuses
  the field; map server `fieldErrors` into the same display. Toasts are for
  submit-level success/failure only (see `IncidentForm`).

## shadcn/ui

This project uses **shadcn/ui** as its component library (config in
`components.json`, style `new-york`, base colour `slate`, CSS variables on,
icon library `lucide`). The primitives in `src/components/ui/*` are the canonical
registry components and own their source — edit them in place.

- They import Radix from the **individual `@radix-ui/react-*` packages**
  (`import * as XPrimitive from "@radix-ui/react-x"`, using the namespaced `.Root`
  members), to match Riskly — not the unified `radix-ui` meta-package. If you add a
  registry component that imports from `"radix-ui"`, rewrite it to the matching
  individual package and add that dep.
- The **full new-york-v4 registry is vendored** in `src/components/ui/*` (plus the
  `use-mobile` hook in `src/hooks/`), so components are available offline — most
  are unused until imported. The app shell uses the **official shadcn `Sidebar`**
  (`SidebarProvider` / `Sidebar` / `SidebarMenu…` in `FlaglyShell` +
  `FlaglySidebar`). (`combobox` is omitted — it depends on Base UI, a separate
  primitive lib.)
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
npm run test:e2e    # Playwright smoke + axe a11y gate (CI/local; needs a built
                    # app, a seeded DB, and `npx playwright install chromium`)
```
