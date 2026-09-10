# Arvena

Arvena is an independent curated marketplace for high-quality products,
technologies, integrated solutions and related services that support healthier,
cleaner, more ecological, higher-quality and more thoughtfully organised living.

This repository contains the English public-platform foundation. It is designed
to explain Arvena's full marketplace scope, guide people from a need to an
appropriate type of solution, and provide reusable structures for real offers
as their approved publication packages become available.

Previously deployed public URL:
`https://arvena-natural-product-discovery.vercel.app`. A URL or earlier
deployment record is not evidence that the current branch has been deployed.

## Current product state

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

### Intentionally empty or developing

- No specific product, service, system or integrated offer is currently
  published.
- No provider profile, partnership, price, availability claim or external
  purchase route is currently published.
- Marketplace filters expose only dimensions supported by real public records;
  developing domains are not presented as inventory.

### Not implemented in this repository

- User authentication, Cabinet, preferences and saved offers.
- Approved-provider associations, partner analytics and correction accounts.
- Permission-gated questions, comments and moderation.
- Commerce, payments, order management or a general seller portal.

### Future direction, not current capability

Arvena Verified, expanded research or laboratory capacity, coordinated turnkey
delivery, product-development programmes, and a development/accessibility fund
remain future directions. The public product must not imply that certification,
subsidies, guaranteed reduced prices, an operating fund, a staffed laboratory or
an investment programme already exists.

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

## Clean Water request boundary

The protected Clean Water request migration, table and fixed browser payload
remain in the repository. They are not part of marketplace catalogue
development and must not be reused for accounts, participation or another
solution area.

The public configuration keeps `requestsEnabled: false`. The form controls are
disabled before JavaScript starts, submission returns before configuration or
network access, stale confirmation state is cleared, and direct confirmation
navigation redirects to the unavailable request page.

This switch disables the official browser flow; it does not alter remote
database privileges. Do not describe current remote database health or request
availability without a fresh, explicitly authorised verification of the
assigned Arvena project. Never place a secret or service-role key in public
JavaScript or expose submitted contact information to browser clients.

## Verification

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
