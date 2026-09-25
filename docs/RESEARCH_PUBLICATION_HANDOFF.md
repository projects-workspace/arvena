# How to hand over research for publication

Team handoff · 25 September 2026 · v1.0

This is the internal guide requested as “Как передать исследование для публикации”. It is not a public submission form, import file or research dossier. Keep approved public text separate from private working material. Never send private contacts, correspondence or restricted knowledge as website content.

## One route from research to publication

Research team → actual human approval → versioned public package → Arvena project task → implementation and verification → separately authorized release.

For **offers**, reuse the existing protected Editorial desk (`#/editorial/packages`). An assigned editor saves a private dossier and separate `public_copy`; draft → under review → approved with a recorded human rationale → publish the approved saved revision. A changed draft clears approval; publication checks the revision. The database stores editorial history. A private dossier is never copied into the public offer row. Do not click Publish against the shared remote service without authorization for that specific operation. This implementation task authorizes no remote publication.

For **providers**, use `#/editorial/providers` with an existing editor permission. Provider publication is a separate explicit decision; it is not automatically partnership. Provider representatives cannot publish themselves or change public offers directly.

For **directions, contexts, solution-class explanations, comparisons and research notes**, the current public system is source-controlled content. There is no generic knowledge-page importer in the Editorial desk: its package publisher produces offers. Supply the approved text and links to the Arvena implementation task. Extend the existing public registry/rendering and checks only as needed. Do not disguise an educational article as an offer or upload an entire internal document to the static site.

## Identities and routes

Domain database identifiers are slugs, not D01–D10. D labels in the research documents are reference labels only. Public direction IDs use `domain:` followed by that same slug.

| Reference | Exact domain slug | Public route |
|---|---|---|
| D01 | `water` | `#/solutions/water` |
| D02 | `air-and-indoor-environment` | `#/solutions/air-and-indoor-environment` |
| D03 | `food-kitchen-and-preservation` | `#/solutions/food-kitchen-and-preservation` |
| D04 | `household-materials` | `#/solutions/household-materials` |
| D05 | `cleaning-and-household-products` | `#/solutions/cleaning-and-household-products` |
| D06 | `personal-everyday-products` | `#/solutions/personal-everyday-products` |
| D07 | `energy-and-resource-efficiency` | `#/solutions/energy-and-resource-efficiency` |
| D08 | `environmental-monitoring` | `#/solutions/environmental-monitoring` |
| D09 | `gardens-soil-and-growing` | `#/solutions/gardens-soil-and-growing` |
| D10 | `homes-buildings-and-land-systems` | `#/solutions/homes-buildings-and-land-systems` |

| Context ID | Route | Related domains (reference labels above) |
|---|---|---|
| `home-as-a-system` | `#/solutions/homes-buildings-and-land-systems` | D01–D10; reuses the Home domain |
| `clothing-footwear-textiles` | `#/contexts/clothing-footwear-textiles` | D06, D04, D05 |
| `kitchen-and-storage` | `#/solutions/food-kitchen-and-preservation` | D03, D01, D04, D05, D07; reuses Kitchen |
| `sleep-and-rest` | `#/contexts/sleep-and-rest` | D02, D04, D06, D08, D07 |
| `electronics-fields-measurement` | `#/contexts/electronics-fields-measurement` | D08, D07 |
| `craft-local` | `#/craft-local` | D04, D06, D03, D09; existing Craft page |
| `traditional-knowledge-new-developments` | `#/contexts/traditional-knowledge-new-developments` | D01, D03, D04, D06, D09 |
| `start-without-buying` | `#/contexts/start-without-buying` | All ten domains |

Existing educational identities remain `clean-water-at-home` (guide at `#/solutions/clean-water`) and `point-of-use-filtration` (solution class at `#/solution-classes/point-of-use-filtration`). Keep aliases `#/methodology` and `#/products/certified-point-of-use-filter`; they do not create new records. Methodology's canonical route is `#/how-we-select`.

Public knowledge data is in `knowledge-data.js`; `knowledge.js` renders it using the existing router and design. Detailed Clean Water content stays in `arvena-data.js`. `index.html` contains methodology, Craft and participation text. `script.js` indexes the selected public records. No private source folder is indexed.

## Minimum package by material type

| Type | What the team must supply | Actual publication path |
|---|---|---|
| Direction/context overview | Existing ID, scope, approved explanatory text, questions versus findings, first steps, sources, related IDs and knowledge status | Source-controlled public page/registry |
| Solution class/comparison | Stable ID; exact approach and conditions; comparable alternatives; supported outcomes and limitations; linked guide/domain | Public educational record; existing class link only if it exists in the database |
| Research note | Question, attributed origin of claim, data and criticism, unknowns and what cannot be concluded; clearly non-recommendation status | Bounded source-controlled knowledge addition; no generic note CMS exists |
| Provider | Real identity, role, provenance, relevant ownership/interests, relationship to Arvena and approved public summary | Existing protected provider editor |
| Offer | Exact model/version/service scope, primary domain, allowed offer type, real published provider, approved claim-level data, practical limits/access and disclosure | Existing private package → human review → approved revision publication |
| Substantial correction | Existing ID/URL/version, exact old statement, proposed replacement, reasons and sources, affected links, review decision and change-log entry | Editor review; revised offer package or source-controlled knowledge update; retain traceable history |

Every package includes: type/object → identity/ID → related domains/pages → approved text → sources and limits → access information when relevant → commercial disclosure → media and rights basis → version/date → actual human approval. State explicit unknowns instead of guessing. An editorial edit date and evidence-check date are different.

These handoff fields are editorial information, not new mandatory database columns or an automatic JSON import contract. Names of responsible people and approvals must be real and supplied; technical publication does not create them.

## Existing database offer contract

`public_copy` currently requires nonempty `slug`, `title`, `provider_id`, `offer_type`, `domain_slug`, `need`, `selection_rationale`, `editorial_conclusion`, `unknowns`, `limitations`, `safety`, `price`, `commercial_disclosure`, `last_review_date`, plus a `claims` array. Use an empty array only when no source-linked claims are being made, not to bypass support for claims in the text. The provider must be published. Dates cannot be in the future.

Allowed offer types: `product`, `handmade`, `technology`, `service`, `installed-product`, `building`, `integrated-system`, `turnkey`. A material or component uses the appropriate existing type; no new enum is introduced.

Each claim needs `claim`, `source` (HTTPS), `source_type`, `conditions`, `checked_on`, `limitations`, `editorial_conclusion`. Preserve attribution, version and applicability in the approved text. The database accepts only named public fields. Keep private notes in the dossier.

Optional fields already supported: `solution_class_slug`, `suitability`, `mechanism`, `specifications`, `manufacturer_claims`, `strengths`, `materials`, `environment`, `lifetime`, `maintenance`, `alternatives`, `geography`, `access_url`, `implementation`, `media`, `media_rights`. A class must exist and match the primary domain. `access_url` must be HTTPS. Media must be an approved `/assets/` path with rights information; adding an asset also requires the local public allowlist to be updated intentionally.

Source of truth: `editorial.js` and the `publish_package` validation in the existing marketplace migration. Do not alter an applied migration to fit a package. The current task adds no fields or permissions.

## Links without duplicate offers

An offer retains one identity, publication copy and review date. Domain pages filter the existing public catalogue by `domain_slug`; the filtration class filters by `solution_class_slug`.

Narrow contextual associations are explicit public links in `knowledge-data.js` → `offerLinks`: context ID → array of approved existing offer slugs. The registry contains no products or dossier data. It currently contains no offer associations because none have been supplied for this task. A link is resolved only against the currently loaded **published** catalogue; it cannot reveal a draft or hidden row. Do not infer clothing or shielding relevance from a broad domain alone.

The same approved offer slug may appear under several contexts. Supply the association and its editorial rationale with the package, then implement the public links. Home/Kitchen entry points reuse domain pages and their primary-domain filters; connected domains remain separate navigable pages. This is not a database many-to-many relationship feature.

Catalogue links use `#/offers?topic=<encoded topic ID>`, for example `#/offers?topic=domain%3Awater`, or existing-domain/class filters `?domain=water` / `?class=point-of-use-filtration`. Counts describe offers only. API unavailability is not zero inventory. Reloading/navigation refreshes the catalogue; no real-time subscription is claimed.

## Internal blank template (not ready to publish)

```text
Material type:
Existing object ID, or proposed stable ID:
Current URL and version, if changing:
Primary domain slug:
Related context/material IDs:
Approved public title and text:
Exact claims and attributable original sources:
Version/model and conditions covered:
Evidence checked by / date:
Limitations, contrary data and unknowns:
Practical access, price, region and implementation (if applicable):
Commercial interests/disclosure:
Media path and rights/consent basis:
Authorship, cultural context and permitted use (where relevant):
Private dossier location (internal pointer only, never public text):
Proposed public knowledge status:
Existing published offer slugs and approved contextual associations:
Revision/date and substantive change summary:
Human approver, actual decision, date and rationale:
Authorized publication environment and operation:
```

An empty approval field means no approval has been supplied. Never invent an investigator, reviewer, product, test result or approval to complete this template.

## Verification and remaining boundaries

Check IDs/links, English public copy, supported claims, rights, empty/unavailable states and desktop/mobile display. Run `python3 scripts/check_integrity.py`, `python3 scripts/test_preview_server.py`, and the relevant browser checks. For the local fixture suite: start `python3 scripts/serve_preview.py --port 8002`, then run `ARVENA_BROWSER_MODULES=/path/to/node_modules node scripts/test_knowledge_browser.cjs` with an existing Playwright installation. Fixtures intercept service traffic and never write remotely; they do not prove RLS.

No general public contact, signup/reset email onboarding, sourcing/B3, new research intake or public editing is enabled. Existing provider corrections remain restricted to assigned representatives and their listings. New knowledge CMS/import features, new classes in the remote database, research-task records or permissions require separate bounded decisions. Remote publication and production deployment require separate authorization. `docs/` is excluded from deployment and local preview; a repository reader can still read these team documents.
