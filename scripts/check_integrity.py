#!/usr/bin/env python3
"""Dependency-free integrity checks for the public Arvena platform foundation."""

from hashlib import sha256
from html.parser import HTMLParser
import os
import re
import shutil
import subprocess
import sys
from urllib.parse import urlsplit


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUIET = "--quiet" in sys.argv[1:]
UNKNOWN_ARGS = [arg for arg in sys.argv[1:] if arg != "--quiet"]
PROBLEMS = []

PUBLIC_JS = ("supabase-config.js", "arvena-data.js", "script.js", "platform.js", "platform-config.js", "editorial.js", "supabase-client.js")
ACTIVE_PUBLIC_FILES = ("index.html", "style.css", *PUBLIC_JS, "vercel.json")
REQUIRED_ROUTES = (
    "/cabinet",
    "/cabinet/account",
    "/cabinet/interests",
    "/provider-space",
    "/editorial",
    "/home",
    "/explore",
    "/solutions",
    "/solutions/clean-water",
    "/solution-classes/point-of-use-filtration",
    "/offers",
    "/providers",
    "/integrated-solutions",
    "/how-we-select",
    "/craft-local",
    "/about",
    "/development",
    "/participate",
    "/participate/producers",
    "/participate/work",
    "/contact",
    "/request",
    "/result",
)
REQUIRED_ALIASES = (
    "/products/certified-point-of-use-filter",
    "/methodology",
)
EXPECTED_SCREENS = {
    "home",
    "explore",
    "solutions",
    "clean-water",
    "solution-class",
    "offers",
    "providers",
    "integrated",
    "methodology",
    "craft",
    "about",
    "development",
    "participate",
    "producers",
    "work",
    "contact",
    "request",
    "result",
    "not-found",
}
REQUIRED_FORM_FIELDS = {"email", "country", "concern", "notes", "website", "consent"}
REQUIRED_DATA_HOOKS = {
    "home-domain-preview",
    "solutions-domain-grid",
    "developing-domain-list",
    "explore-search",
    "explore-domain-filter",
    "explore-type-filter",
    "explore-results",
    "explore-result-count",
    "explore-empty",
    "explore-clear",
    "solution-title",
    "solution-problem",
    "solution-updated",
    "solution-steps",
    "technology-grid",
    "class-title",
    "class-description",
    "class-problem",
    "class-why-included",
    "class-materials",
    "class-publication",
    "class-access",
    "class-price",
    "class-availability",
    "class-evidence",
    "class-limitations",
    "class-updated",
    "class-disclosure",
    "offer-count",
    "provider-count",
}
EXPECTED_MIGRATION_SHA256 = "8839a517ff5247c5929edf7a8514b11f95bf844a1632e2de8d1d1a93676ff491"


def path(relative_path):
    return os.path.join(ROOT, relative_path)


def read(relative_path):
    with open(path(relative_path), encoding="utf-8") as handle:
        return handle.read()


def read_bytes(relative_path):
    with open(path(relative_path), "rb") as handle:
        return handle.read()


def exists(relative_path):
    return os.path.isfile(path(relative_path))


def report(message):
    PROBLEMS.append(message)


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.references = []
        self.form_names = set()
        self.html_lang = ""
        self.screens = set()
        self.nav_route_links = 0
        self.nav_route_values = []
        self.hash_routes = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "html":
            self.html_lang = attributes.get("lang", "")
        if "id" in attributes:
            self.ids.append(attributes["id"])
        for name in ("href", "src"):
            if attributes.get(name):
                self.references.append((name, attributes[name]))
        if tag in ("input", "select", "textarea") and attributes.get("name"):
            self.form_names.add(attributes["name"])
        if attributes.get("data-screen"):
            self.screens.add(attributes["data-screen"])
        if tag == "a" and "data-route-link" in attributes:
            self.nav_route_links += 1
            self.nav_route_values.append(attributes.get("data-route-link"))
        if tag == "a" and str(attributes.get("href", "")).startswith("#/"):
            self.hash_routes.append(attributes["href"][1:])


if UNKNOWN_ARGS:
    report(f"arguments: unsupported option(s): {', '.join(UNKNOWN_ARGS)}")

required_files = (
    "index.html",
    "style.css",
    *PUBLIC_JS,
    "favicon.svg",
    "assets/arvena-botanical-background.jpg",
    "assets/arvena-material-study.jpg",
    "assets/arvena-craft-process.jpg",
    "scripts/serve_preview.py",
    "supabase/migrations/20260821000000_arvena_mvp_requests.sql",
    ".vercelignore",
    "vercel.json",
)
for required_file in required_files:
    if not exists(required_file):
        report(f"files: required file is missing: {required_file}")

if PROBLEMS and any(not exists(item) for item in ("index.html", "style.css", *PUBLIC_JS)):
    print(f"FAIL: {len(PROBLEMS)} problem(s) found")
    for problem in PROBLEMS:
        print(f"  - {problem}")
    sys.exit(1)

html = read("index.html")
css = read("style.css")
script = read("script.js")
data = read("arvena-data.js")
config = read("supabase-config.js")
migration_bytes = read_bytes("supabase/migrations/20260821000000_arvena_mvp_requests.sql")
vercel_ignore = read(".vercelignore")
vercel_config = read("vercel.json")
active_public_text = "\n".join(read(item) for item in ACTIVE_PUBLIC_FILES)
active_public_casefold = active_public_text.casefold()

parser = SiteParser()
parser.feed(html)

if parser.html_lang != "en":
    report(f"html: expected lang='en', found {parser.html_lang!r}")

for element_id in sorted(set(parser.ids)):
    if parser.ids.count(element_id) > 1:
        report(f"html: duplicate id {element_id!r}")

for required_id in sorted(REQUIRED_DATA_HOOKS):
    if required_id not in parser.ids:
        report(f"html: required data hook is missing: {required_id!r}")

missing_screens = EXPECTED_SCREENS - parser.screens
if missing_screens:
    report(f"html: missing screen(s): {', '.join(sorted(missing_screens))}")

if parser.nav_route_links != 5:
    report(f"navigation: expected exactly 5 top-level route links, found {parser.nav_route_links}")
expected_nav_values = {"explore", "solutions", "how-we-select", "about", "participate"}
if set(parser.nav_route_values) != expected_nav_values:
    report(f"navigation: top-level route keys must be {', '.join(sorted(expected_nav_values))}")

for attribute, reference in parser.references:
    if reference.startswith(("http://", "https://", "#", "mailto:", "data:")):
        continue
    relative = urlsplit(reference).path.lstrip("./")
    if relative and not exists(relative):
        report(f"html: {attribute} points to missing file: {reference}")

for reference in re.findall(r"url\(['\"]?([^'\"()]+)['\"]?\)", css):
    if reference.startswith(("http://", "https://", "data:")):
        continue
    relative = urlsplit(reference).path.lstrip("./")
    if relative and not exists(relative):
        report(f"css: url() points to missing file: {reference}")

for route in (*REQUIRED_ROUTES, *REQUIRED_ALIASES):
    if route not in script:
        report(f"routing: required route or alias {route!r} missing from script.js")

known_routes = {*REQUIRED_ROUTES, *REQUIRED_ALIASES}
for linked_route in sorted(set(parser.hash_routes)):
    if linked_route not in known_routes:
        report(f"routing: HTML links to an unknown route: {linked_route!r}")

for route in REQUIRED_ROUTES:
    if route == "/result":
        continue
    if f"#{route}" not in html:
        report(f"routing: no public link to required route '#{route}'")

missing_fields = REQUIRED_FORM_FIELDS - parser.form_names
if missing_fields:
    report(f"form: missing field(s): {', '.join(sorted(missing_fields))}")

for marker in (
    "data-i18n",
    "language-selector",
    "PFDmeto/",
    "PDFbiom/",
    "PDFlife/",
    "Santiago Protocol",
    "Tyubazh",
    "Tubazh",
    "Lumeya",
    "Commonry",
):
    if marker.casefold() in active_public_casefold:
        report(f"public safety: legacy or out-of-scope marker is exposed: {marker!r}")

for required_text in (
    "independent curated marketplace",
    "solution classes",
    "specific offers",
    "integrated solutions",
    "scope is not inventory",
    "no specific offer",
    "future direction",
    "not an existing certification",
):
    if required_text not in active_public_casefold:
        report(f"positioning: required public message is missing: {required_text!r}")

for misleading_phrase in (
    "arvena verified product",
    "certified by arvena",
    "our laboratory",
    "our investment programme",
    "successful application",
    "connection is being restored",
    "hostname is unavailable",
):
    if misleading_phrase in active_public_casefold:
        report(f"trust language: misleading or stale phrase is exposed: {misleading_phrase!r}")

if "\u2013" in active_public_text or "\u2014" in active_public_text:
    report("content style: active public files contain a visible en dash or em dash")

for marker in (
    "domains:",
    "discoveryRecords:",
    "offers: []",
    "providers: []",
    "protectedLegacyRequestContract:",
    "clean-water-at-home",
    "point-of-use-filtration",
    "certified-point-of-use-filter",
    "priceState:",
    "availabilityState:",
    "evidence:",
    "limitations:",
    "commercialDisclosure:",
):
    if marker not in data:
        report(f"data: required structured value missing: {marker!r}")

if len(re.findall(r"status: 'published'", data)) != 1:
    report("data: exactly one solution domain must currently be published")
if len(re.findall(r"status: 'developing'", data)) != 9:
    report("data: exactly nine solution domains must currently be developing")
if len(re.findall(r"recordType: '(?:guide|solution-class)'", data)) != 2:
    report("data: exactly two genuine discovery records are expected in this foundation")

for source_url in re.findall(r"sourceUrl:\s*'([^']+)'", data):
    if not source_url.startswith(("https://", "#/")):
        report(f"data: evidence URL must use HTTPS or an internal route: {source_url}")

if "sb_secret_" not in script or "service_role" not in script:
    report("configuration: browser key safety checks are missing")
expected_supabase_url = "https://qkwffuwvioiikumddoie.supabase.co"
configured_url = re.search(r"url:\s*'([^']*)'", config)
configured_key = re.search(r"publishableKey:\s*'([^']*)'", config)
if not configured_url or configured_url.group(1) != expected_supabase_url:
    report("configuration: expected the dedicated Arvena Supabase project URL")
if not configured_key or not re.fullmatch(r"sb_publishable_[A-Za-z0-9_-]+", configured_key.group(1)):
    report("configuration: expected a browser-safe Supabase publishable key")
if configured_key and configured_key.group(1).startswith("sb_secret_"):
    report("configuration: a secret Supabase key must never be committed")
if not re.search(r"requestsEnabled:\s*false\b", config):
    report("configuration: Clean Water requests must remain explicitly disabled")
if "config.requestsEnabled === true" not in script:
    report("configuration: fail-closed request availability helper is missing")

for fragment in (
    "client_request_id: requestId",
    "request_type: 'water_filter_match'",
    "email: form.elements.email.value.trim()",
    "country: form.elements.country.value.trim()",
    "concern: form.elements.concern.value",
    "notes: form.elements.notes.value.trim() || null",
    "consent: form.elements.consent.checked",
    "solution_slug: 'clean-water-at-home'",
    "product_slug: 'certified-point-of-use-filter'",
    "source_path: '#/request'",
    "Prefer: 'return=minimal'",
    "body: JSON.stringify(payload)",
):
    if fragment not in script:
        report(f"request safety: protected payload or request fragment changed: {fragment!r}")

submit_start = script.find("async function submitRequest")
submit_config_lookup = script.find("getSupabaseConfig()", submit_start)
submit_fetch = script.find("fetch(", submit_start)
submit_guard = script.find("if (!requestsAreEnabled())", submit_start)
if min(submit_start, submit_config_lookup, submit_fetch, submit_guard) < 0 or not (
    submit_start < submit_guard < submit_config_lookup < submit_fetch
):
    report("request safety: disabled guard must run before configuration lookup and network access")

for marker in (
    'id="request-fields" disabled',
    "requestFields.disabled = !enabled",
    "requestAvailabilityNotice.hidden = enabled",
    "sessionStorage.removeItem(CONFIRMATION_KEY)",
    "(!requestsAreEnabled() || !sessionStorage.getItem(CONFIRMATION_KEY))",
):
    if marker not in html and marker not in script:
        report(f"request safety: required fail-closed marker is missing: {marker!r}")

migration_digest = sha256(migration_bytes).hexdigest()
if migration_digest != EXPECTED_MIGRATION_SHA256:
    report(f"database: protected request migration changed ({migration_digest})")

for marker in (
    'href="#main-content" data-skip-link',
    "function skipToMainContent",
    "event.preventDefault()",
    "mainContent.focus()",
    "function syncNavigationAccessibility",
    "primaryNav.toggleAttribute('inert', isClosedOnMobile)",
    "primaryNav.setAttribute('aria-hidden', 'true')",
):
    if marker not in html and marker not in script:
        report(f"accessibility: required marker is missing: {marker!r}")

for excluded in (
    ".env",
    ".env.*",
    ".git",
    "PFDmeto",
    "PDFbiom",
    "PDFlife",
    "*.pdf",
    "supabase",
    "scripts",
    "beautiful-plants-natural-environment.jpg",
):
    if excluded not in vercel_ignore:
        report(f"deployment: internal or obsolete path is not excluded: {excluded}")

if "https://*.supabase.co" in vercel_config:
    report("deployment: CSP must not allow every Supabase project")
if expected_supabase_url not in vercel_config:
    report("deployment: CSP must allow only the assigned public Arvena Supabase host")

node = shutil.which("node")
if node:
    for relative_path in PUBLIC_JS:
        result = subprocess.run(
            [node, "--check", path(relative_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode:
            detail = (result.stderr or result.stdout).strip().splitlines()
            report(f"js: node --check failed for {relative_path}: {detail[-1] if detail else 'unknown error'}")

if exists("scripts/serve_preview.py"):
    try:
        compile(read("scripts/serve_preview.py"), path("scripts/serve_preview.py"), "exec")
    except SyntaxError as error:
        report(f"preview server: syntax check failed: {error.msg} at line {error.lineno}")

if PROBLEMS:
    print(f"FAIL: {len(PROBLEMS)} problem(s) found")
    for problem in PROBLEMS:
        print(f"  - {problem}")
    sys.exit(1)

if not QUIET:
    print("OK: Arvena public platform integrity checks passed")
    print(
        f"    {len(REQUIRED_ROUTES)} public routes, {len(parser.ids)} unique element ids, "
        "2 genuine discovery records, 0 offers, 0 providers"
    )
    print("    requests disabled, protected request migration preserved")
sys.exit(0)
