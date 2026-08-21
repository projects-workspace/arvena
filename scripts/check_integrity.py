#!/usr/bin/env python3
"""Dependency-free integrity checks for the public Arvena Clean Water MVP."""

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

PUBLIC_JS = ("supabase-config.js", "arvena-data.js", "script.js")
REQUIRED_ROUTES = (
    "/home",
    "/explore",
    "/solutions/clean-water",
    "/products/certified-point-of-use-filter",
    "/request",
    "/result",
    "/methodology",
)
REQUIRED_FORM_FIELDS = {
    "email",
    "country",
    "concern",
    "notes",
    "website",
    "consent",
}
LEGACY_PUBLIC_MARKERS = (
    "data-i18n",
    "language-selector",
    "PFDmeto/",
    "PDFbiom/",
    "PDFlife/",
    "Santiago Protocol",
    "Tyubazh",
    "Tubazh",
)


def read(relative_path):
    with open(os.path.join(ROOT, relative_path), encoding="utf-8") as handle:
        return handle.read()


def exists(relative_path):
    return os.path.isfile(os.path.join(ROOT, relative_path))


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


if UNKNOWN_ARGS:
    report(f"arguments: unsupported option(s): {', '.join(UNKNOWN_ARGS)}")

html = read("index.html")
css = read("style.css")
script = read("script.js")
data = read("arvena-data.js")
config = read("supabase-config.js")
migration = read("supabase/migrations/20260821000000_arvena_mvp_requests.sql")
vercel_ignore = read(".vercelignore")

parser = SiteParser()
parser.feed(html)

if parser.html_lang != "en":
    report(f"html: expected lang='en', found {parser.html_lang!r}")

for element_id in sorted(set(parser.ids)):
    if parser.ids.count(element_id) > 1:
        report(f"html: duplicate id '{element_id}'")

for attribute, reference in parser.references:
    if reference.startswith(("http://", "https://", "#", "mailto:", "data:")):
        continue
    path = urlsplit(reference).path
    if path and not exists(path):
        report(f"html: {attribute} points to missing file: {reference}")

for reference in re.findall(r"url\(['\"]?([^'\"()]+)['\"]?\)", css):
    if reference.startswith(("http://", "https://", "data:")):
        continue
    path = urlsplit(reference).path
    if path and not exists(path):
        report(f"css: url() points to missing file: {reference}")

for route in REQUIRED_ROUTES:
    if f"'{route}'" not in script:
        report(f"routing: required route {route!r} missing from script.js")
    if route != "/result" and f"#{route}" not in html:
        report(f"routing: no public link to required route '#{route}'")

expected_screens = {"home", "explore", "clean-water", "product", "request", "result", "methodology", "not-found"}
missing_screens = expected_screens - parser.screens
if missing_screens:
    report(f"html: missing screen(s): {', '.join(sorted(missing_screens))}")

missing_fields = REQUIRED_FORM_FIELDS - parser.form_names
if missing_fields:
    report(f"form: missing field(s): {', '.join(sorted(missing_fields))}")

for marker in LEGACY_PUBLIC_MARKERS:
    if marker.casefold() in html.casefold() or marker.casefold() in script.casefold():
        report(f"public safety: legacy marker is exposed: {marker!r}")

for required_text in (
    "clean-water-at-home",
    "certified-point-of-use-filter",
    "evidence:",
    "limitations:",
    "reviewedAt:",
    "availability:",
):
    if required_text not in data:
        report(f"data: required structured value missing: {required_text!r}")

for source_url in re.findall(r"sourceUrl:\s*'([^']+)'", data):
    if not source_url.startswith(("https://", "#/")):
        report(f"data: evidence URL must use HTTPS or an internal route: {source_url}")

for bind_name in re.findall(r"data-bind=\"([^\"]+)\"", html):
    if f"setText('{bind_name}'" not in script:
        report(f"data binding: {bind_name!r} is not populated by script.js")

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
if "arvena_mvp_requests" not in config or "arvena_mvp_requests" not in script:
    report("configuration: frontend table name is inconsistent")
if "route.screen === 'result'" not in script or "history.replaceState" not in script:
    report("routing: confirmation screen is not guarded against direct access")

normalised_migration = re.sub(r"\s+", " ", migration.casefold())
required_sql = (
    "create table if not exists public.arvena_mvp_requests",
    "alter table public.arvena_mvp_requests enable row level security",
    "alter table public.arvena_mvp_requests force row level security",
    "revoke all on table public.arvena_mvp_requests from anon, authenticated",
    "for insert to anon with check",
)
for statement in required_sql:
    if statement not in normalised_migration:
        report(f"database: required migration protection missing: {statement!r}")

if not re.search(r"grant\s+insert\s*\([^;]+\)\s+on\s+table\s+public[.]arvena_mvp_requests\s+to\s+anon", migration, re.I | re.S):
    report("database: anonymous column-level INSERT grant is missing")
if re.search(r"grant\s+(select|update|delete|all)[^;]*\s+to\s+anon", migration, re.I | re.S):
    report("database: anonymous users must not receive SELECT, UPDATE, DELETE, or ALL")
if re.search(r"for\s+(select|update|delete)\s+to\s+anon", migration, re.I):
    report("database: public read/update/delete RLS policy found")

for excluded in ("PFDmeto", "PDFbiom", "PDFlife", "*.pdf", "supabase"):
    if excluded not in vercel_ignore:
        report(f"deployment: legacy/internal path is not excluded: {excluded}")

node = shutil.which("node")
if node:
    for relative_path in PUBLIC_JS:
        result = subprocess.run(
            [node, "--check", os.path.join(ROOT, relative_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode:
            detail = (result.stderr or result.stdout).strip().splitlines()
            report(f"js: node --check failed for {relative_path}: {detail[-1] if detail else 'unknown error'}")

if PROBLEMS:
    print(f"FAIL: {len(PROBLEMS)} problem(s) found")
    for problem in PROBLEMS:
        print(f"  - {problem}")
    sys.exit(1)

if not QUIET:
    print("OK: Arvena Clean Water MVP integrity checks passed")
    print(f"    {len(REQUIRED_ROUTES)} public routes, {len(parser.ids)} unique element ids, insert-only RLS migration")
sys.exit(0)
