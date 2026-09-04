# Arvena

Production: https://arvena-natural-product-discovery.vercel.app

Arvena is an independent curated marketplace for quality products,
technologies and technical devices, systems, related professional services,
integrated solutions, and larger turnkey implementations. Its purpose is to
make better solutions for living easier to understand, evaluate, access, and
implement.

The current English-only public release contains one published collection:

`Home → Marketplace → Clean Water guide → editorial product-type profile → sourcing status`

The broader offer range describes Arvena's marketplace scope, not inventory
that is already available. The release does not invent products, providers,
prices, partners, services, or market availability. Clean Water is the only
currently published collection.

The Clean Water request implementation and guarded confirmation route remain
in source for restoration, but requests are currently disabled because the
configured request-system hostname is unavailable. The public interface does
not attempt a network request while this disabled state is active.

## Architecture

The frontend is dependency-free static HTML, CSS, and JavaScript with hash
routing. `arvena-data.js` is the structured editorial source for the solution,
product-type profile, evidence, limitations, publication status, access status,
and commercial disclosure.

The only write path is a direct anonymous insert into the dedicated Arvena
Supabase Data API. `supabase-config.js` accepts only a public project URL and a
publishable/legacy anonymous key; it rejects service-role and secret keys. The
database migration grants anonymous users INSERT access to the allowed columns
only, with RLS validation and no public read/update/delete policy.

`supabase-config.js` contains an explicit `requestsEnabled` flag. It is
fail-closed: only the exact boolean value `true` can enable form controls and
submission. The current value is `false`.

Legacy multilingual wellness material and PDFs remain in repository history for
later editorial review, but they are neither linked from the MVP nor included in
the Vercel upload.

## Local development

```sh
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000`. All informational routes work without external
configuration. The request route displays a clear unavailable state and keeps
all submission controls disabled.

## Preserved Supabase request boundary

The migration in `supabase/migrations/20260821000000_arvena_mvp_requests.sql`
was applied to the dedicated Arvena project on 22 August 2026. That historical
verification is recorded in `supabase/README.md`. As of 4 September 2026, the
configured project hostname does not resolve, so it is not evidence of current
request availability.

The public journey does not create an Auth user. It uses the Data API `anon`
role, which can insert only the ten form-controlled columns. RLS is enabled and
forced; public and authenticated clients have no read, update, or delete access
to submitted records. Full live verification is recorded in
`supabase/README.md`.

Never put a secret or service-role key in `supabase-config.js`. The browser must
not be given public SELECT access to submitted email addresses.

Do not set `requestsEnabled` to `true` until the assigned Arvena project is
confirmed and the complete browser-to-database journey is reverified.

## Verification

```sh
python3 scripts/check_integrity.py
python3 scripts/check_integrity.py --quiet
```

The dependency-free checker verifies marketplace-first positioning, the Clean
Water publication boundary, unavailable request state, accessibility markers,
public routes, local assets, data bindings, form/schema alignment, the preserved
insert-only RLS migration, deployment exclusions, duplicate HTML IDs, and
JavaScript syntax when Node is available.

Browser acceptance includes desktop and 390 × 844 mobile viewports, all seven
routes, responsive and keyboard navigation, the disabled request path, the
guarded confirmation route, and absence of console errors or request traffic.

## Deployment boundary

`vercel.json` supplies security headers. `.vercelignore` prevents legacy PDFs,
internal documentation, tooling, and repository metadata from entering the
public deployment. This Stage 1 alignment batch does not deploy, commit, modify
the request schema, or contact Supabase.
