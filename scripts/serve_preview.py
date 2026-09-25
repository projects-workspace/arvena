#!/usr/bin/env python3
"""Serve only Arvena's public runtime files on the local loopback interface."""

from __future__ import annotations

import argparse
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path, PurePosixPath
from typing import Optional
from urllib.parse import unquote, urlsplit


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ASSETS_ROOT = PROJECT_ROOT / "assets"
LOOPBACK_HOST = "127.0.0.1"

PUBLIC_ROOT_FILES = frozenset(
    {
        "index.html",
        "style.css",
        "supabase-config.js",
        "arvena-data.js",
        "knowledge-data.js",
        "knowledge.js",
        "script.js",
        "platform.js",
        "platform-config.js",
        "editorial.js",
        "supabase-client.js",
        "favicon.svg",
    }
)
PUBLIC_ASSET_FILES = frozenset(
    {
        "assets/arvena-botanical-background.jpg",
        "assets/arvena-craft-process.jpg",
        "assets/arvena-material-study.jpg",
    }
)
PUBLIC_ALIASES = {"favicon.ico": "favicon.svg"}


def resolve_public_file(request_target: str) -> Optional[Path]:
    """Resolve an allowlisted request target without exposing the repository."""

    try:
        parsed_target = urlsplit(request_target)
        if parsed_target.scheme or parsed_target.netloc:
            return None
        decoded_path = unquote(parsed_target.path, errors="strict")
    except (UnicodeDecodeError, ValueError):
        return None

    if "\x00" in decoded_path or "\\" in decoded_path:
        return None

    if decoded_path in {"", "/"}:
        relative_path = PurePosixPath("index.html")
    else:
        relative_path = PurePosixPath(decoded_path.lstrip("/"))

    if len(relative_path.parts) == 1 and relative_path.name in PUBLIC_ALIASES:
        relative_path = PurePosixPath(PUBLIC_ALIASES[relative_path.name])

    parts = relative_path.parts
    if not parts or any(part in {"", ".", ".."} or part.startswith(".") for part in parts):
        return None

    if len(parts) == 1:
        if parts[0] not in PUBLIC_ROOT_FILES:
            return None
        allowed_root = PROJECT_ROOT
    elif parts[0] == "assets":
        if relative_path.as_posix() not in PUBLIC_ASSET_FILES:
            return None
        allowed_root = ASSETS_ROOT
    else:
        return None

    project_root = PROJECT_ROOT.resolve()
    allowed_root = allowed_root.resolve()
    lexical_candidate = PROJECT_ROOT.joinpath(*parts)
    if lexical_candidate.is_symlink():
        return None

    try:
        allowed_root.relative_to(project_root)
    except ValueError:
        return None

    candidate = lexical_candidate.resolve()
    try:
        candidate.relative_to(allowed_root)
    except ValueError:
        return None

    return candidate if candidate.is_file() else None


class PreviewHTTPServer(ThreadingHTTPServer):
    """Threaded local server whose request threads cannot delay shutdown."""

    daemon_threads = True


class PreviewRequestHandler(BaseHTTPRequestHandler):
    """HTTP handler with no filesystem fallback or directory-listing behavior."""

    server_version = "ArvenaPreview/1.0"
    sys_version = ""

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        self._serve_public_file(include_body=True)

    def do_HEAD(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        self._serve_public_file(include_body=False)

    def _serve_public_file(self, *, include_body: bool) -> None:
        public_file = resolve_public_file(self.path)
        if public_file is None:
            self._send_not_found(include_body=include_body)
            return

        try:
            body = public_file.read_bytes()
        except OSError:
            self._send_not_found(include_body=include_body)
            return

        if public_file.name == "supabase-config.js" and getattr(self.server, "platform_config", None):
            body = ("window.ARVENA_SUPABASE_CONFIG = Object.freeze(" + json.dumps(self.server.platform_config) + ");").encode()

        if public_file.name == "platform-config.js" and getattr(self.server, "platform_config", None):
            body = b"window.ARVENA_PLATFORM_ENABLED = true; window.ARVENA_EMAIL_DELIVERY_ENABLED = true;"

        content_type = mimetypes.guess_type(public_file.name)[0] or "application/octet-stream"
        if (
            content_type.startswith("text/")
            or content_type in {"application/javascript", "application/json", "image/svg+xml"}
        ):
            content_type = f"{content_type}; charset=utf-8"

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        if include_body:
            self.wfile.write(body)

    def _send_not_found(self, *, include_body: bool) -> None:
        body = b"Not found\n"
        self.send_response(HTTPStatus.NOT_FOUND)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        if include_body:
            self.wfile.write(body)


def valid_port(raw_value: str) -> int:
    """Parse a normal non-privileged TCP port for the command-line interface."""

    try:
        port = int(raw_value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("port must be an integer") from error
    if not 1024 <= port <= 65535:
        raise argparse.ArgumentTypeError("port must be between 1024 and 65535")
    return port


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=valid_port, default=8000, help="loopback port (default: 8000)")
    parser.add_argument("--local-platform-config", type=Path, help="Private local-test config; only loopback API URLs are accepted")
    args = parser.parse_args()

    server = PreviewHTTPServer((LOOPBACK_HOST, args.port), PreviewRequestHandler)
    if args.local_platform_config:
        config = json.loads(args.local_platform_config.read_text())
        parsed = urlsplit(config.get("url", ""))
        if parsed.scheme != "http" or parsed.hostname != "127.0.0.1":
            parser.error("Local test config must use http://127.0.0.1")
        if set(config) != {"url", "publishableKey", "requestsEnabled", "table"} or config["requestsEnabled"] is not False:
            parser.error("Local test config must preserve disabled sourcing and contain public configuration only")
        server.platform_config = config
    print(f"Arvena preview: http://{LOOPBACK_HOST}:{args.port}/")
    print("Only allowlisted public runtime files are available. Press Ctrl-C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
