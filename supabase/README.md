# Arvena Supabase MVP record

This directory contains the database change and historical verification record
for the first public MVP. It was applied only to the dedicated Arvena Supabase
project.

## Current frontend availability

As of 4 September 2026, the configured project hostname does not resolve. The
public application therefore sets `requestsEnabled: false`, disables every
request control, blocks submission before `fetch`, and prevents access to the
confirmation route. The migration and request payload remain unchanged.

The verification below records what passed on 22 August 2026. It must not be
treated as proof that the request system is currently available. Requests may
be re-enabled only after the authoritative Arvena project is confirmed and the
complete browser-to-database path passes fresh verification.

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

## Historical live verification — 22 August 2026

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

## Production verification

At the time of verification, the production deployment at
`https://arvena-natural-product-discovery.vercel.app` returned HTTP 200 with
the expected security headers. Home, Explore, Clean Water, product, and request
views loaded in the deployed browser without console errors. The deployed
public configuration then resolved to this project's URL and
`public.arvena_mvp_requests`. The production form was not resubmitted, so the
single verified database record above remains the only test record.
