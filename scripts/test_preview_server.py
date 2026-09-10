#!/usr/bin/env python3
"""Black-box checks for the allowlisted Arvena preview server."""

from __future__ import annotations

import http.client
import threading
import unittest

from serve_preview import PreviewHTTPServer, PreviewRequestHandler


class QuietPreviewRequestHandler(PreviewRequestHandler):
    def log_message(self, _format: str, *_args: object) -> None:
        return


class PreviewServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = PreviewHTTPServer(("127.0.0.1", 0), QuietPreviewRequestHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.host, cls.port = cls.server.server_address

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def request(self, target: str, method: str = "GET") -> tuple[int, bytes, dict[str, str]]:
        connection = http.client.HTTPConnection(self.host, self.port, timeout=2)
        try:
            connection.request(method, target)
            response = connection.getresponse()
            return response.status, response.read(), dict(response.getheaders())
        finally:
            connection.close()

    def test_allowlisted_runtime_files_are_served(self) -> None:
        targets = (
            "/",
            "/index.html",
            "/style.css?v=preview",
            "/supabase-config.js",
            "/arvena-data.js",
            "/script.js",
            "/favicon.svg",
            "/assets/arvena-botanical-background.jpg",
            "/assets/arvena-craft-process.jpg",
            "/assets/arvena-material-study.jpg",
        )
        for target in targets:
            with self.subTest(target=target):
                status, body, headers = self.request(target)
                self.assertEqual(status, 200)
                self.assertTrue(body)
                self.assertEqual(headers.get("X-Content-Type-Options"), "nosniff")

    def test_head_returns_headers_without_a_body(self) -> None:
        status, body, headers = self.request("/style.css", method="HEAD")
        self.assertEqual(status, 200)
        self.assertEqual(body, b"")
        self.assertGreater(int(headers["Content-Length"]), 0)

    def test_default_favicon_alias_serves_the_svg(self) -> None:
        alias_status, alias_body, alias_headers = self.request("/favicon.ico")
        source_status, source_body, _source_headers = self.request("/favicon.svg")
        self.assertEqual(alias_status, 200)
        self.assertEqual(source_status, 200)
        self.assertEqual(alias_body, source_body)
        self.assertEqual(alias_headers.get("Content-Type"), "image/svg+xml; charset=utf-8")

    def test_private_source_and_arbitrary_paths_return_404(self) -> None:
        targets = (
            "/.env",
            "/.env.local",
            "/%2eenv",
            "/.git/config",
            "/supabase/README.md",
            "/scripts/serve_preview.py",
            "/README.md",
            "/Biological_Foundation%202.pdf",
            "/beautiful-plants-natural-environment.jpg",
            "/assets/",
            "/assets/.private.jpg",
            "/assets/unlisted.jpg",
            "/assets/not-public.md",
            "/assets/%2e%2e/.env",
            "/not-a-route",
            "//example.com/",
            "http://example.com/index.html",
        )
        for target in targets:
            with self.subTest(target=target):
                status, _body, headers = self.request(target)
                self.assertEqual(status, 404)
                self.assertEqual(headers.get("X-Content-Type-Options"), "nosniff")


if __name__ == "__main__":
    unittest.main()
