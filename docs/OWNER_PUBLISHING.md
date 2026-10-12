# Simple owner publishing

M1 adds a normal listing workflow alongside the preserved legacy editorial tools.
Implementation and verification status belong in [PROJECT_STATE.md](../PROJECT_STATE.md).

## Owner workflow

With owner publishing enabled, Editorial → Offers / Providers uses:

1. Create or select a draft.
2. Enter identity, description and relevant practical information.
3. Add images and optional source links.
4. Save and preview the saved copy.
5. Confirm that this copy may be public, then publish.

An offer needs a name, stable URL slug, published provider, offer type, category,
description and commercial disclosure. A provider needs a name, slug, description
and relationship disclosure. Prices, research explanations, source links, detailed
claims and dossiers are not mandatory for ordinary listings. Do not invent absent
information to complete a form.

Editing preserves the previous public copy until a later explicit publication.
Changing the form closes its approval preview. Stale saves/publications are rejected.
Public slugs remain stable after the first publication. Unpublishing keeps the draft
and history; a provider cannot be unpublished while it has published offers.

Existing offer dossiers and historical claim records are retained. An owner can omit legacy images or claim records from the next public copy without erasing previous publication snapshots. The simplified form
does not edit the private dossier or automatically record a scientific review.
Publication records the actual authenticated owner's action and saved public copy.
Only explicitly assigned existing editors may use these operations.

## Public images

Only upload rights-cleared public images. The **arvena-public-media** Storage bucket
is public, so an uploaded image is accessible before the listing is published.
Never upload private documents, correspondence or research dossiers here.

JPEG, PNG and WebP are accepted, at most 5 MB each and six images per listing.
Each image requires descriptive alternative text and its rights/permission basis.
Only editors can upload. Paths are immutable; browser clients cannot overwrite or
delete files. Removing an image from a draft unlinks it from the next publication
and preserves files used by earlier revisions. Unpublishing a listing does not
erase an already-public image.

## Activation boundary

**ARVENA_OWNER_PUBLISHING_ENABLED** defaults to false in the shared configuration.
Before enabling it in a real environment:

- Verify the exact Arvena project and reconcile its existing marketplace schema.
- Apply only the additive **20261012095731_simple_owner_publishing.sql** migration
  through an authorised operation. Do not replay or edit the historical migrations.
- Verify the new owner RPC, provider drafts, Storage bucket/policies, permissions
  and actual image delivery. Confirm the intended trusted editor assignment.
- Enable the owner flag and release the compatible frontend only when authorised.

Email onboarding and sourcing gates are independent and remain unchanged.
The feature branch has a Vercel Git deployment guard; pushing this branch is not
an instruction to deploy or activate the new database contract.

## Local checks

Use only an isolated local stack. The protected sourcing migration is never part
of its setup. Apply the original marketplace migration followed by M1.
Use free local ports; the current test configuration uses API 58321 and DB 58322.
Keep local public configuration and synthetic account fixtures in private temporary
files, never in the repository. Test clients reject non-loopback targets.

- scripts/test_platform.cjs: existing local Auth/Data API regression and fixtures.
- scripts/test_owner_publishing.cjs: owner publication, provider drafts, revision,
  image permissions, legacy dossier preservation and revocation.
- scripts/test_platform_browser.cjs: existing flows, using the normal isolated
  preview at port 8001.
- scripts/test_owner_publishing_browser.cjs: owner UI and public pages, using
  port 8003. Start scripts/serve_preview.py with --port 8003,
  --local-platform-config /private/tmp/arvena-local-config.json and --owner-publishing.

Set ARVENA_TEST_MODULES to the pinned test dependencies and
ARVENA_BROWSER_MODULES to the existing Playwright installation.
Run service checks before browser checks. The existing browser suite selects its
named legacy package explicitly so new M1 drafts do not change its target.
After verification, stop only the isolated Arvena stack and its preview servers.

### Browser evidence modes

The owner browser suite normally obtains sessions from local Auth and exercises
the actual local API and Storage. ARVENA_FIXTURE_SESSIONS=1 instead uses signed
synthetic local sessions and verifies their editor/buyer permissions through the
real API; it is not a login test and requires a private temporary local JWT-secret
file. Never use that mode against a remote target.

ARVENA_HTTP_FIXTURES=1 intercepts all calls to the configured loopback API, uses
in-memory synthetic records, and serves selected repository image fixtures. This
mode verifies browser behaviour and request contracts only, not database, RLS, Auth
or Storage. It does not require a responsive Docker stack. Keep it separate from
the service-suite result in every report. Both modes still use the allowlisted
local preview and private loopback configuration described above.
