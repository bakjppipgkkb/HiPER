# HiPER v2 Coding Agent Contract

## Product
Hab Perbendaharaan Digital (HiPER) is the official digital treasury hub for JPP IPGKKB. Maintain a formal, trustworthy maroon-and-gold institutional identity.

## Non-negotiable architecture
- Next.js App Router with TypeScript.
- Supabase PostgreSQL is the only production database.
- Supabase Auth is the only production identity source.
- Supabase Storage is the only production media source.
- Public portal and HiPER Studio must share the same typed server data layer.
- Never add Google Apps Script, Google Sheets, browser localStorage, mock data, or static JSON as a production fallback.
- A production data failure must render a clear error state, not stale or fake content.

## Security
- Enforce authorization with PostgreSQL Row Level Security and server-side role checks.
- Never trust role, email, student ID, owner ID, amount, status, or visibility values supplied by the browser.
- Never expose the Supabase service-role key to client code.
- Validate all mutations with Zod and database constraints.
- Record privileged mutations in `audit_log`.

## Data contracts
- Money is stored as integer sen.
- Currency is displayed as `RMX.XX`, with no space after `RM`.
- Announcement poster field is `poster_path`; no duplicate attachment/poster fields.
- Public pages read only published or explicitly public records.
- Student pages read only rows owned by the authenticated student.

## Code quality
Before completion run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Do not claim runtime completion based only on static checks. Verify Studio save → database → public/student display for the affected feature.
