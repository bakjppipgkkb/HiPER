# Supabase Setup

1. Create a new Supabase project owned by the appropriate institutional account.
2. Apply `supabase/migrations/0001_foundation.sql` in SQL Editor.
3. Enable Google OAuth in Authentication Providers.
4. Configure Google OAuth consent and callback values shown by Supabase.
5. Add your local, Preview and Production redirect URLs.
6. Copy the Project URL and publishable key to `.env.local`.
7. Sign in once at `/studio/login`.
8. Promote the approved official account in the `profiles` table to `ADMIN`.
9. Test an unauthorized account to confirm it cannot access Studio or write data.

Do not place the service-role key in Vercel unless a later server-only migration feature specifically requires it. Normal application operations use the user session and RLS.
