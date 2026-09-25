# Arvena — Current Implementation State

This is Arvena's technical snapshot, used as Stage 4 when shared with ChatGPT. It is written to stand alone. Source code describes the implementation at the checkpoint below; it does not prove current live database, service or deployment state.

## 1. Current product

Arvena is an independent curated marketplace for high-quality products, technologies, integrated solutions and related services that support healthier, cleaner and more thoughtfully organised living. This repository holds its English public platform and Supabase-backed account, catalogue and editorial extension.

## 2. Major capabilities

- **Public methodology and knowledge — implemented in the working branch.** Ten direction maps and eight context entry points preserve all domain slugs. Home and Kitchen reuse domain pages; Craft reuses its existing page. Five standalone contexts cover clothing, rest, fields/measurement, traditional knowledge/new developments and changes without buying. How We Select explains the adopted method, claim-level support, independence, human decisions and corrections. Topic maps are not completed research. There are 18 local knowledge records, including the two existing detailed Clean Water records, and 38 canonical routes plus two aliases and dynamic platform routes.
- **Knowledge/catalogue connections — implemented.** Search distinguishes knowledge and offers. Domain/class filters and explicit contextual offer links use the existing published catalogue. Loading, empty, unavailable/retry and populated states are distinct. Refresh/navigation updates publication visibility; no real-time subscription is claimed. No static offers or providers were added.
- **Catalogue — connected in this development branch.** Published offers and provider profiles load from Supabase. The repository contains no specific offers/providers; the last remote check on 23 September 2026 found none after synthetic-data cleanup. Remote data was not rechecked today.
- **Accounts and Cabinet — integration implemented, email onboarding gated.** Supabase Auth/Data API supports persistent sessions, private saves and minimal domain/region preferences. The last remote verification found confirmed-account sign-in and persistence working on 23 September; this review did not recheck the service. Registration and password-reset controls remain hidden while `ARVENA_EMAIL_DELIVERY_ENABLED` is false. The last recorded Auth check found email confirmation required.
- **Provider and editorial workflows — implemented behind explicit permissions.** Provider representatives can view their own listings and aggregate activity and submit corrections. Scoped contributors/specialists submit content for review; editors manage providers, private research packages, permissions, human review and publication. PostgreSQL enforces permissions and private/public projections. These workflows require valid service configuration and assigned roles; source presence does not prove live availability.
- **Clean Water sourcing request — preserved and disabled.** `requestsEnabled` is false; request controls and direct confirmation access are unavailable. The existing request migration and payload remain separate from the marketplace extension.

## 3. Technical foundation

The public site is a static HTML/CSS/JavaScript application; `script.js` routes and renders local content from `arvena-data.js`. The platform extension uses a locally bundled, pinned Supabase client, Auth, Data API and PostgreSQL row-level security. Marketplace and request schemas are separate migrations. Public browser configuration uses a publishable key; secrets stay server-side. `platform-config.js` enables the extension in this branch while email delivery stays gated. `vercel.json` and `.vercelignore` configure headers and upload exclusions, not proof of deployment.

## 4. Useful code map

- `index.html`, `style.css`, `script.js` — public screens, visual system, navigation, discovery and disabled request flow.
- `arvena-data.js` — stable domain identities and the two detailed Clean Water records.
- `knowledge-data.js`, `knowledge.js` — selected public direction/context maps, stable links, reading layouts and filtered catalogue connections. These contain no internal dossiers.
- `docs/RESEARCH_PUBLICATION_HANDOFF.md` — internal team package guide, actual IDs/routes, database field mapping and blank approval template; `docs/METHODOLOGY_SCOPE.md` records the implemented/deferred scope. Docs are excluded from local serving and deployment uploads.
- `platform.js`, `editorial.js`, `platform-config.js` — account/catalogue behavior, editorial workflows and feature gates.
- `supabase-config.js`, `supabase/migrations/20260821000000_arvena_mvp_requests.sql`, `supabase/migrations/20260923073824_marketplace_platform.sql` — protected request config and separate database contracts.
- `scripts/check_integrity.py` — route, content and protected-contract checks; `scripts/serve_preview.py` — allowlisted loopback preview.
- `scripts/test_platform.cjs`, `scripts/test_platform_browser.cjs` — isolated Auth/Data API and browser integration checks using synthetic fixtures. `scripts/test_knowledge_browser.cjs` covers direction/context routes, published/draft/withdrawn links, filters, unavailable/retry states and privacy using intercepted local fixtures.
- `README.md` — local preview and check commands. `supabase/README.md` — database-specific operating notes and dated verification.

## 5. Current limitations and decisions

No specific offer, provider, price, availability, partnership or purchase route is published. Participation/contact are informational, without a general public intake channel. Legacy multilingual wellness PDFs remain outside the English runtime and deployment upload. Checkout, payments, orders, broad seller tools, automated research and AI recommendations are outside scope. Research packages and public contributions require human review; future certification, a staffed laboratory or public fund must not be presented as operating.

Keep the Clean Water request table, migration and fixed payload contract intact; do not reuse that path for accounts, participation or another domain. Batch B3 remains inactive. The extension migration's application and remote checks are recorded on 23 September 2026. The CLI was recorded as linked to a different account and the remote migration-history table was absent then; do not replay the migration solely to repair CLI history. Reconcile schema state before any separately authorized remote operation. The branch is not evidence that these changes reached production.

## 6. Verification checkpoint

**Review date:** 25 September 2026. **Branch:** `feat/arvena-stage1-alignment`. **Starting implementation commit:** `73959c3edcf7d807abc0609ea9f37415ea5512fe`; no later implementation commits were present at task start. The methodology/knowledge implementation commit is `0d72750`; final report commit `f8684fb94fa8c67d0cac3bbe23991c194682ee6d` was pushed normally to the same feature branch. This is a source/local checkpoint, not a production release claim.

Source integrity and syntax checks passed: 38 canonical routes, 140 static unique IDs, 18 local knowledge records, no static offers/providers, requests disabled and protected migration preserved. The four preview-server tests passed, including knowledge assets and internal document/source denial. The knowledge browser suite passed 358 assertions across 35 routes at 1440, 390 and 320 px, covering publication visibility, shared links, withdrawal, filters/refresh/search, API failure/retry, anonymous gates, themes, keyboard focus and private-file denial. Targeted final checks covered subtopic search, heading references and dark link contrast. Desktop/mobile screenshots were inspected.

The existing isolated local Supabase setup was reused with the unchanged marketplace migration. Its 60 Auth/Data API assertions passed, and the existing account/editorial browser suite passed sign-in/session persistence, saves, preferences, provider corrections, contribution moderation, themes and navigation with zero console/runtime errors. Synthetic data stayed local; this is not a new remote RLS audit. The test-only preview enables email controls only against its loopback test configuration; repository email and sourcing gates remain disabled.

Both configuration files, both migration sources, `editorial.js` and the protected sourcing submission handler remained byte-identical to the starting commit. No new migration, remote write, Auth/RLS change, spending or production deployment occurred. Normal public catalogue reads were exercised by the local runtime; private remote data was not inspected. A read-only authenticated Vercel dashboard check matched the configured project/team IDs and showed `main` as the production branch. Connector/CLI access was unavailable; browser access was not treated as API access.

At task start, `AGENTS.md`, `README.md`, `supabase/README.md` and this untracked snapshot already had changes. The first three remain outside the application implementation and snapshot commits. This canonical snapshot is committed separately after the implementation so those pre-existing edits stay untouched. The 23 September remote verification record remains historical, as described in `supabase/README.md`.
