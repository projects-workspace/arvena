# Arvena Supabase MVP record

This directory contains the database change and verification record for the
first public MVP. It was applied only to the dedicated Arvena Supabase project.

## Applied change

- Date: 22 August 2026
- Project: Arvena (`qkwffuwvioiikumddoie`)
- Migration: `migrations/20260821000000_arvena_mvp_requests.sql`
- Table: `public.arvena_mvp_requests`
- Public configuration: project URL plus publishable key only
- Auth: no account or anonymous Auth sign-in is used by this journey

The change creates a private request table with database validation, generated
IDs and timestamps, forced RLS, an anonymous insert-only policy, and explicit
column-level insert grants. The `anon` role cannot supply the generated ID,
status, or creation timestamp.

## Live verification

- The complete browser journey created one request and displayed reference
  `ARV-666E67A1`.
- Exactly one private row matched that reference; status, test contact marker,
  country, concern, solution, product, and source path all matched the submitted
  payload.
- Anonymous `select`, `update`, and `delete` requests were denied with Postgres
  code `42501`.
- Invalid concern, missing consent, overlong notes, and altered product requests
  were denied; none created a row.
- RLS is enabled and forced. The insert policy is present. Anonymous insert
  privileges exist only for the ten expected input columns.
- Auth settings were inspected: email Auth is enabled with confirmation,
  anonymous Auth sign-ins are disabled, and this public journey does not use
  Auth accounts.
- The Supabase Security Advisor reported zero errors and zero warnings after the
  migration.
- Desktop and 390 × 844 mobile browser checks passed with no console errors.

The browser requests `Prefer: return=minimal`, so it never receives the private
row back. Operational access should stay in the Supabase dashboard or a later
authenticated internal tool using a server-side credential. Never put a secret
or service-role key in a browser file.

Deployment remains a separate evidence layer. After a host publishes this
revision, rerun the public journey and security-header checks against the final
production URL.
