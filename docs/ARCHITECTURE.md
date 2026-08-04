# HiPER v2 Architecture

## Runtime path

```text
Browser
  → Next.js Server Component / Server Action
  → Supabase Auth + PostgreSQL + Storage
```

There is no Apps Script action router and no Google Sheet acting as a transaction database.

## Single source of truth

| Feature | Canonical source |
|---|---|
| User identity and role | `auth.users` + `profiles` |
| Portal settings | `site_settings` |
| Announcement text and poster reference | `announcements.poster_path` |
| Tabung records | `tabung_records` |
| Organisation structure | units + officers + assignments |
| Media | named Supabase Storage buckets |

## Rendering

Public data is loaded in Server Components with dynamic rendering for operational records. Errors produce explicit states. The system must never replace a failed request with mock or stale content.

## Authorization

RLS is the primary database boundary. Server-side role checks provide user-friendly routing but do not replace RLS.
