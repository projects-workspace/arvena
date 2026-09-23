# Arvena

Canonical implementation-state document and local development guide. Project
instructions and the fixed supplementary-context mapping are in `AGENTS.md`.
The current task defines development scope; conceptual documents are context,
not an automatic backlog. Verify relevant implementation facts in the repository.

## Current product

Arvena is an independent curated marketplace for high-quality products,
technologies, integrated solutions and related services that support healthier,
cleaner, more ecological, higher-quality and more thoughtfully organised living.

This repository contains the English public-platform foundation and a locally verified account, catalogue and editorial extension. It is designed
to explain Arvena's full marketplace scope, guide people from a need to an
appropriate type of solution, and provide reusable structures for real offers
as their approved publication packages become available.

Previously deployed public URL:
`https://arvena-natural-product-discovery.vercel.app`. A URL or earlier
deployment record is not evidence that the current branch has been deployed.

## Current implementation

### Implemented in the public foundation

- A broad marketplace identity covering products, technologies, services,
  building and home systems, and integrated implementations.
- Ten solution domains, with honest developing states where no content or
  inventory has been published.
- Need-first discovery and a reusable distinction between a need, a solution
  class, a specific offer, and the work required for implementation.
- The existing Clean Water educational guide and point-of-use filtration
  solution-class profile, including evidence, limitations and safety context.
- Public explanations for selection, independent editorial assessment,
  craft/local/conscious sourcing, Arvena's identity, participation, contact,
  and future development and accessibility directions.
- Dependency-free static HTML, CSS and JavaScript with hash routing and
  structured public content in `arvena-data.js`.
- Explore search, domain/type filters, result counts, empty states and clearing
  operate on two published records. Enter preserves the search without reloading.
- Light/dark theme persistence, responsive navigation, keyboard focus handling,
  guarded confirmation access, legacy route aliases and a not-found screen.

The five primary navigation groups are Explore, Solutions, How We Select, About
and Participate. The 18 original public-foundation hash routes cover Home; Explore; solution areas
and Clean Water; the point-of-use solution class; Offers and Providers;
Integrated Solutions; selection methodology; Craft/Local; About; Development;
participation, producers/specialists and work; Contact; and the protected request
and confirmation routes. The old product-type and methodology routes remain aliases.

### Intentionally empty or developing

- No specific product, service, system or integrated offer is currently
  published.
- No provider profile, partnership, price, availability claim or external
  purchase route is currently published.
- Marketplace filters expose only dimensions supported by real public records;
  developing domains are not presented as inventory.
- Offers and Providers retain honest empty states. When the extension is enabled,
  approved database records render at `#/offers/<slug>` and `#/providers/<slug>`
  and join the existing discovery search and inventory-backed filters.
- Integrated Solutions contains an illustrative Clean Water composition, not an
  available package. Participation pages are informational; no public contact
  channel or application intake is configured.

### Account, provider and editorial extension

Implemented against Supabase Auth and an additive PostgreSQL migration:

- Email/password registration, login, confirmation/reset support through the
  official pinned Supabase client, persistent sessions and logout.
- Private Cabinet saves and minimal domain/region preferences. Preference
  replacement is atomic; duplicate saves are idempotent.
- Trusted provider associations, own published-listing access, daily aggregate
  views/outbound clicks, and structured corrections for editorial review.
- Explicit offer/domain-scoped contribution permissions, specialist/provider
  content distinctions, review, publication, rejection, hiding and revocation.
- Private research packages and a small editorial desk for providers, permissions,
  contributions, corrections and measured analytics. Research and evaluation are
  performed by the team and relevant specialists, never automated here.
- Human-approved package publication into separate public offer records. Editing
  a draft invalidates its approval and leaves the existing public revision intact.
  Optimistic revision checks reject stale changes. Immutable editorial events
  retain decision attribution and snapshots of published copy.

The extension is **disabled in the committed public configuration** until its
migration is applied and verified in the assigned Arvena project. Local Auth,
Data API and browser tests use an isolated Supabase stack and explicit loopback
configuration, never a replacement cloud project. No real offers/providers or
editor accounts have been created remotely. Registration alone grants no provider,
posting or editorial permission.

Commerce, payments, orders, general seller tools, automated research and
AI-generated recommendations are outside this implementation.

### Future direction, not current capability

Arvena Verified, expanded research or laboratory capacity, coordinated turnkey
delivery, product-development programmes, and a development/accessibility fund
remain future directions. The public product must not imply that certification,
subsidies, guaranteed reduced prices, an operating fund, a staffed laboratory or
an investment programme already exists.

## Technical foundation

The English public foundation uses dependency-free static HTML/CSS/JavaScript;
the optional account extension adds a pinned official Auth client. Semantic
screens live in one HTML document; browser JavaScript switches hash routes and
renders a frozen local content object. Educational browsing has no account requirement or catalogue API dependency.
The public site needs no build step or application server. The optional extension
uses Supabase Auth and Data API with PostgreSQL row-level security. A pinned,
locally bundled official Auth client is the only shipped dependency; its build
inputs and license are retained under `scripts/`. Fonts load from Google
Fonts; editorial image assets are local.

The preserved, disabled request path uses a direct Supabase REST insert with
public browser configuration. Its migration exists in source; that does not prove
the current remote schema or service health. New account, provider and discussion tables are separate from the request table;
local verification does not establish remote application or service configuration. Vercel headers and upload exclusions are configured,
but deployment status must be checked separately.

## Useful code map

- `index.html`: public screens, navigation, semantic structure and disabled form.
- `script.js`: route registry, discovery rendering/filtering, theme/menu behavior
  and guarded request submission.
- `arvena-data.js`: ten domains, two discovery records, empty offer/provider arrays
  and preserved request identifiers.
- `platform.js`, `editorial.js`, `platform-config.js`: account/catalogue interfaces,
  protected editorial operations and the independent activation switch.
- `supabase-client.js`: pinned browser bundle of `@supabase/supabase-js` 2.117.0.
- `scripts/test_platform.cjs` and `scripts/test_platform_browser.cjs`: isolated
  Auth/Data API security and browser integration tests with synthetic fixtures.
- `style.css` and `assets/`: visual system, responsive layouts and editorial imagery.
- `supabase-config.js` and `supabase/migrations/`: protected request switch,
  browser configuration and preserved schema contract. `supabase/README.md`
  contains historical backend notes, not current operational verification.
- `scripts/check_integrity.py`: source, route, content and protected-contract checks.
- `scripts/serve_preview.py` and `scripts/test_preview_server.py`: allowlisted local
  preview and HTTP allow/deny tests.
- `vercel.json` and `.vercelignore`: deployment headers and upload exclusions.

## Safe local preview

Use the allowlisted preview server. It binds only to `127.0.0.1`, serves the
runtime HTML, CSS, JavaScript, favicon and approved image assets, and provides no
directory listing or general access to the repository.

```sh
python3 scripts/serve_preview.py
```

Open `http://127.0.0.1:8000`. Choose another non-privileged loopback port when
needed:

```sh
python3 scripts/serve_preview.py --port 8080
```

Do not serve the repository root with `python3 -m http.server`. That generic
server can expose ignored local files such as environment configuration, Git
metadata, database sources and internal documents.

## Current boundaries and limitations

The published catalogue has no specific offers or providers. Do not infer prices,
availability, partnerships, certification or operational capacity from domain
coverage or concept imagery. Legacy multilingual wellness material is retained
locally but is not part of the English public runtime or deployment upload.

### Clean Water request boundary

The protected Clean Water request migration, table and fixed browser payload
remain in the repository. They are not part of marketplace catalogue
development and must not be reused for accounts, participation or another
solution area.

Batch B3 remains inactive. Preserve `public.arvena_mvp_requests`, its migration
and payload contract; do not inspect historical personal requests. Commonry is
outside this project's scope and must remain untouched.

The public configuration keeps `requestsEnabled: false`. The form controls are
disabled before JavaScript starts, submission returns before configuration or
network access, stale confirmation state is cleared, and direct confirmation
navigation redirects to the unavailable request page.

This switch disables the official browser flow; it does not alter remote
database privileges. Do not describe current remote database health or request
availability without a fresh, explicitly authorised verification of the
assigned Arvena project. Never place a secret or service-role key in public
JavaScript or expose submitted contact information to browser clients.

## Verification checkpoint

- **23 September 2026 local implementation verification:** the additive migration
  executes on isolated PostgreSQL/Supabase. Auth and Data API tests cover two normal
  users plus provider, contributor, specialist and editor contexts; direct negative
  cases cover ownership, posting scope, revocation, moderation, publication and
  analytics. Synthetic fixtures are local only and clearly labelled.
- Source integrity preserves 23 fixed routes, two aliases, dynamic public profiles,
  the existing two educational records, zero committed offers/providers and the
  disabled sourcing contract. Preview allow/deny checks and syntax checks pass.
- **60 local Auth/Data API assertions passed.** Browser flows passed for desktop,
  390px and 320px: public routes/aliases/not-found, discovery, login persistence,
  saves, preferences, corrections, contribution review/publication, themes and
  navigation. No console/runtime errors were recorded. Inline editorial error
  feedback preserves inputs. Independent frontend finish review passed at this
  local synthetic scope. The default disabled configuration makes no Supabase
  requests and preserves the two public educational records.
- The browser client can be rebuilt with `sh scripts/build_client.sh`; this is
  dependency maintenance, not a required site build step.
- **Remote boundary:** repository configuration points to Arvena project
  `qkwffuwvioiikumddoie`. The current connector denies access and the authenticated
  CLI account does not include this project. The new migration has not been applied
  remotely, and remote Auth/email/redirect settings have not been verified. No
  production deployment or domain change is part of this work.

### Repeatable local checks

Run the dependency-free source-integrity checks:

```sh
python3 scripts/check_integrity.py
```

Run the preview-server allow/deny tests. They start a temporary loopback server
and verify public runtime files, HEAD behavior, environment and dotfile denial,
path-traversal denial, internal-source denial, and arbitrary-path denial.

```sh
python3 scripts/test_preview_server.py
```

Before a release, also run the application through this preview server and
inspect all major routes on desktop and mobile. Check keyboard navigation,
responsive overflow, links and actions, console/runtime errors, honest empty
and future states, and the disabled request path.

## Deployment boundary

`vercel.json` provides the public security headers and limits browser Supabase
connections to the assigned, already-public Arvena project host.
`.vercelignore` excludes environment files, repository metadata, internal
documentation and scripts, database sources, legacy PDFs and the retired large
botanical source image. The optimized assets under `assets/` remain public.

No deployment, production promotion, remote migration or sourcing activation is
performed by the local public-foundation work alone.

## Operating the extension

The platform switch is separate from `requestsEnabled`, which stays false.
Before setting `ARVENA_PLATFORM_ENABLED` true, establish authenticated access to
Arvena `qkwffuwvioiikumddoie`, inspect schema/migration metadata without reading
historical requests, review the additive migration and apply it transactionally.
Do not incidentally repair the protected request migration history. Verify grants,
RLS, Auth email confirmation/reset delivery and allowed redirect origins before
activation. Production deployment requires separate authorization.

The migration is additive and seeds only the ten existing domain identities and
one educational solution-class relationship. It contains no real offers, providers,
user permissions or synthetic fixtures. To recover from application problems,
disable the platform switch first; retain new data and apply a forward corrective
migration. Do not drop tables containing editorial or account records. The SQL
transaction rolls back a failed initial application.

A trusted database operator assigns the first editor by inserting the verified
Auth user identifier into `arvena_editors`. No browser operation can self-assign
editorial access. Editors use `#/editorial` to create factual provider records,
prepare private dossiers and public fields, move a saved revision to review,
record human approval and publish that revision. Required publication fields
must be filled with approved facts or explicit unknowns. Claims preserve source,
type, conditions, checked date, limits and editorial conclusion. Only named public
fields are copied; private dossiers never enter public projections.

The editorial Access page assigns provider membership and scoped contribution
permission using a verified account identifier. Revocation takes effect at the
database on the next operation. Provider membership permits questions/statements
about associated offers and corrections; it grants no public editing or moderation.
Editorial access does not expose users' saved lists or preferences through RLS.

`#/provider-space` shows own listings and daily measured counts. Each browser
session contributes at most one event of each type per offer in a 30-minute window;
known signed-in representatives/editors are excluded. Temporary daily hashed
session identifiers are inaccessible to clients and purged during measurement
after 24 hours. No IP, visitor account identifier or user preference is included
in analytics. This reduces accidental repeats, not deliberate bot manipulation;
views are not unique people and outbound clicks are not purchases. No historical
counts or sales estimates are inferred.

Public participation remains informational: no verified general contact channel
is configured. Provider corrections use the authenticated internal route. External
Auth email configuration, a verified general contact channel and approved human
research packages remain external dependencies.

## Isolated integration verification

Use a separate temporary Supabase working directory named
`/private/tmp/arvena-platform-test`, with local ports 56321 (API), 56322 (database)
and 56324 (mail). Initialize it with `supabase init --workdir ...`, set local ports
in its generated configuration and start Auth, PostgREST, Kong, mail and PostgreSQL.
Do not copy or run the protected sourcing migration into this fixture stack.
Apply only the marketplace migration using the local database connection.

Install the pinned client build dependencies in a temporary directory using
`scripts/client-package.json` and `scripts/client-package-lock.json` as its
`package.json` and `package-lock.json`, then `npm ci`. Set `ARVENA_TEST_MODULES`
to that temporary `node_modules` directory. Supply
`/private/tmp/arvena-local-config.json` with only the loopback API URL, local
publishable key, protected table name and `requestsEnabled: false`. Never place
secret/service-role keys in that configuration. Run `node scripts/test_platform.cjs`.
The script refuses non-loopback targets and uses only the explicitly named local
Docker container. It creates synthetic accounts and test fixtures; repeat from a
fresh isolated schema. Credentials for browser tests are written with mode 0600
outside the repository and must not be committed or deployed.

Start the allowlisted preview with
`python3 scripts/serve_preview.py --port 8001 --local-platform-config /private/tmp/arvena-local-config.json`.
This explicit local mode substitutes public loopback configuration in responses
without changing the protected configuration file or committed activation switch.
Install Playwright 1.58.2 in a temporary directory, set `ARVENA_BROWSER_MODULES` to
its `node_modules`, and run `node scripts/test_platform_browser.cjs`. The browser
suite uses installed Chrome and local synthetic accounts. Stop the isolated stack
without retaining test data after verification. The normal preview command never
enables the extension automatically.
