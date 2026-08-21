# Arvena Supabase handoff

This directory contains the complete database change for the first public MVP.
It must be applied only to the Supabase project assigned to Arvena. The current
connector session exposes different ecosystem projects, so this migration has
intentionally not been run against them.

## Apply in the Arvena project

1. Connect the Supabase tooling to the account and project assigned to Arvena.
2. Apply `migrations/20260821000000_arvena_mvp_requests.sql` as a migration.
3. Copy that project's public URL and publishable key into
   `supabase-config.js`. Never put a secret or service-role key in a browser file.
4. Confirm public email sign-up is not required for this journey. The page uses
   the anonymous Data API role; it does not create user accounts.
5. Deploy, submit one test request, and verify the row in the Arvena dashboard.

## Required live checks

- An anonymous insert with the allowed columns succeeds and returns HTTP 201.
- An anonymous `select` from `arvena_mvp_requests` is denied.
- An anonymous `update` and `delete` are denied.
- Invalid concern values, missing consent, overlong notes, and altered solution
  or product slugs are rejected.
- A successful browser submission creates exactly one row whose
  `client_request_id` matches the `ARV-…` confirmation prefix.
- The project URL in the deployed app resolves to the dedicated Arvena project,
  not another ecosystem project.

The browser requests `Prefer: return=minimal`, so it never receives the private
row back. Operational access should stay in the Supabase dashboard or a later
authenticated internal tool using a server-side credential.
