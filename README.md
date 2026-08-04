# Hab Perbendaharaan Digital (HiPER) v2

A clean Next.js and Supabase rebuild of the JPP IPGKKB treasury portal.

## Foundation scope

This first v2 package establishes:

- a modular App Router structure;
- cookie-based Supabase Auth for Next.js SSR;
- Google OAuth entrance for HiPER Studio;
- server-side admin authorization;
- PostgreSQL schema and Row Level Security;
- Supabase Storage policies for announcement posters;
- BM/English and light/dark public shell;
- permanently dark HiPER Studio shell;
- typed data access for settings, announcements, Tabung Jumaat and organisation;
- test scaffolding with Vitest and Playwright;
- no demo or stale-data fallback in production.

The operational modules are intentionally delivered in phases. This foundation does not pretend that unfinished iAset, iKES or Studio forms are production-ready.

## 1. Create the Supabase project

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/migrations/0001_foundation.sql`.
4. In **Authentication → Providers**, enable Google.
5. Add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - your Vercel preview and production callback URLs.
6. Copy `.env.example` to `.env.local` and enter the project URL and publishable key.

## 2. Create the first administrator

Sign in once through `/studio/login`, then run this in Supabase SQL Editor using the correct email:

```sql
update public.profiles
set role = 'ADMIN'
where email = 'your-official-email@example.com';
```

Sign out and sign in again. The user can now access `/studio`.

## 3. Local verification

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm run dev
```

## 4. Import to GitHub

Create a new empty repository named `hiper-jppipgkkb-v2`, extract this package, then run:

```bash
git init
git add .
git commit -m "chore: establish HiPER v2 Supabase foundation"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/hiper-jppipgkkb-v2.git
git push -u origin main
```

## 5. Vercel

Import the new repository into Vercel and configure the variables from `.env.example`. Keep the v1 production domain unchanged until v2 passes end-to-end testing.

## Development order

1. Site Settings and footer
2. Pengumuman end-to-end
3. Tabung Jumaat end-to-end
4. Organisasi end-to-end
5. iAset and Permohonan Saya
6. iKES
7. data migration
8. production cutover

See `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and `docs/SUPABASE_SETUP.md`.
