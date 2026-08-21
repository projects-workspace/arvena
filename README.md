# Arvena

Arvena is a curated healthy-living discovery platform. This first MVP is an
English-only, public Clean Water journey:

`Home → Explore → Clean Water guide → evaluated product type → sourcing request → confirmation`

The release deliberately contains one complete path instead of an unfinished
catalogue. It explains the basis and limitations of household water-treatment
choices, then records a real request for a location-appropriate, verified
option. It does not sell products, diagnose conditions, or recommend an
unreviewed health protocol.

## Architecture

The frontend is dependency-free static HTML, CSS, and JavaScript with hash
routing. `arvena-data.js` is the structured editorial source for the solution,
product profile, evidence, limitations, review status, and availability.

The only write path is a direct anonymous insert into the dedicated Arvena
Supabase Data API. `supabase-config.js` accepts only a public project URL and a
publishable/legacy anonymous key; it rejects service-role and secret keys. The
database migration grants anonymous users INSERT access to the allowed columns
only, with RLS validation and no public read/update/delete policy.

Legacy multilingual wellness material and PDFs remain in repository history for
later editorial review, but they are neither linked from the MVP nor included in
the Vercel upload.

## Local development

```sh
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000`. All read-only routes work without external
configuration. The request form is connected to the dedicated Arvena Supabase
project and creates a real private sourcing request when submitted.

## Live Supabase backend

The migration in `supabase/migrations/20260821000000_arvena_mvp_requests.sql`
was applied to the dedicated Arvena project on 22 August 2026. The committed
browser configuration contains only that project's public URL and publishable
key.

The public journey does not create an Auth user. It uses the Data API `anon`
role, which can insert only the ten form-controlled columns. RLS is enabled and
forced; public and authenticated clients have no read, update, or delete access
to submitted records. Full live verification is recorded in
`supabase/README.md`.

Never put a secret or service-role key in `supabase-config.js`. The browser must
not be given public SELECT access to submitted email addresses.

## Verification

```sh
python3 scripts/check_integrity.py
python3 scripts/check_integrity.py --quiet
```

The dependency-free checker verifies public routes, English-only and safety
boundaries, local assets, data bindings, form/schema alignment, the insert-only
RLS migration, deployment exclusions, duplicate HTML IDs, and JavaScript syntax
when Node is available.

Browser acceptance was completed on desktop and at a 390 × 844 mobile viewport.
The full route journey, responsive navigation, form, live confirmation, matching
private database row, and absence of console errors were verified.

## Deployment boundary

`vercel.json` supplies security headers. `.vercelignore` prevents legacy PDFs,
internal documentation, tooling, and repository metadata from entering the
public deployment. The repository and backend are demo-ready; a production URL
still needs its own post-deployment smoke test before being called production
verified.
