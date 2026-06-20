# Deploying Flagly (Vercel + Neon)

Flagly deploys like the rest of the Centrely suite: Vercel for hosting, Neon for
Postgres, and a **one-time first-run setup** that creates the first Admin account
from the sign-in page — no manual seeding required in production.

## 1. Import the repo to Vercel

Create a new project at [vercel.com/new](https://vercel.com/new) from this repo.
The first build may fail because there's no database yet — that's expected.

## 2. Add a Neon Postgres database

In the Vercel project: **Storage → Create Database → Neon (Postgres)** and attach
it. The integration injects both connection strings automatically:

- `DATABASE_URL` — pooled (used by the running app)
- `DATABASE_URL_UNPOOLED` — direct (used by `prisma migrate deploy`)

The Prisma datasource already reads both:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}
```

## 3. Set the auth secret

Add one more environment variable in **Settings → Environment Variables** (all
environments):

```
AUTH_SECRET = <run `npx auth secret`, or any 32-byte base64 string>
```

(`AUTH_TRUST_HOST=true` is optional — `trustHost: true` is already set in
`src/auth.ts`.)

## 4. Redeploy

Trigger a new deployment. Vercel runs the `vercel-build` script:

```jsonc
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

`prisma migrate deploy` applies the committed migrations and creates the tables on
Neon, then the app builds.

## 5. Create the first Admin

Open the deployed URL. Because no users exist yet, the sign-in page shows a
one-time **"Create the first administrator"** form. Enter your name, email and
password — this creates the initial **Admin** account (and a starter centre,
*LeisureWorld Cork / LW*, so you can report incidents immediately). The setup form
disappears once any user exists; after that it's the normal sign-in page.

Additional users are created from the database (or a future Users admin screen);
v1 ships with the first-run Admin bootstrap.

> Tip: if Vercel's Deployment Protection is on, turn it off (Project Settings) so
> visitors reach the app's own sign-in page.

## Optional: demo data

For a populated demo (8 incidents across two centres with areas/sub-areas, plus
overdue actions), run the seed against the database instead of using first-run
setup:

```bash
DATABASE_URL="<neon-pooled-url>" DATABASE_URL_UNPOOLED="<neon-direct-url>" npm run db:seed
```

The seed login is `manager@leisureworld.ie` / `password123`.
