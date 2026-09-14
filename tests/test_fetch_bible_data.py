"""Tests for scripts/fetch_bible_data.py: completeness, failure exit codes,
validation and atomic writes. Uses httpx.MockTransport, so no network.

    python -m unittest discover -s tests
"""

import asyncio
import json
import os
import socket
import subprocess
import sys
import tempfile
import unittest

import httpx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

import fetch_bible_data as fbd  # noqa: E402

fbd.RETRY_BACKOFF = 0.0  # keep retries instant under test


def book_payload(name, count):
    return {
        "book": name,
        "total_references": count,
        "chapters": {},
        "references": [{"id": f"{name}-{i}"} for i in range(count)],
    }


def make_api(books=None, fail=None, flaky=None, overrides=None):
    """Build a fake API. `fail` = endpoints that always 503; `flaky` =
    {endpoint: n} fails the first n calls; `overrides` = {endpoint: json}."""
    books = books if books is not None else {"Genesis": 3, "Jude": 2}
    total = sum(books.values())
    routes = {
        "bible/stats": {"total_references": total, "books_count": dict(books)},
        "bible/books": {
            "books": [{"book": b, "count": c} for b, c in books.items()],
            "total_books": len(books),
            "total_references": total,
        },
    }
    for name, count in books.items():
        routes[f"bible/books/{name}"] = book_payload(name, count)
    routes.update(overrides or {})
    fail = set(fail or ())
    flaky = dict(flaky or {})
    calls = {}

    def handler(request):
        endpoint = request.url.path.lstrip("/")
        calls[endpoint] = calls.get(endpoint, 0) + 1
        if endpoint in fail or calls[endpoint] <= flaky.get(endpoint, 0):
            return httpx.Response(503)
        if endpoint not in routes:
            return httpx.Response(404)
        return httpx.Response(200, json=routes[endpoint])

    return httpx.MockTransport(handler), calls


def run(output_dir, transport, allow_shrink=False):
    return asyncio.run(fbd.run(output_dir=output_dir, transport=transport, allow_shrink=allow_shrink))


def read_tree(directory):
    tree = {}
    for base, _, names in os.walk(directory):
        for name in names:
            path = os.path.join(base, name)
            with open(path, "rb") as f:
                tree[os.path.relpath(path, directory)] = f.read()
    return tree


class FetchBibleDataTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.parent = self._tmp.name
        self.out = os.path.join(self.parent, "bible")

    def tearDown(self):
        self._tmp.cleanup()

    def seed_previous_snapshot(self):
        transport, _ = make_api(books={"Genesis": 1, "Jude": 1})
        self.assertEqual(run(self.out, transport), 0)
        return read_tree(self.out)

    def assert_no_staging_left(self):
        leftovers = [n for n in os.listdir(self.parent) if n.startswith(".bible-staging-")]
        self.assertEqual(leftovers, [])

    def test_complete_snapshot_is_written(self):
        transport, _ = make_api()
        self.assertEqual(run(self.out, transport), 0)
        tree = read_tree(self.out)
        self.assertEqual(
            sorted(tree),
            ["bible_books.json", "bible_stats.json", "books/Genesis.json", "books/Jude.json", "manifest.json"],
        )
        manifest = json.loads(tree["manifest.json"])
        self.assertTrue(manifest["complete"])
        self.assertEqual(manifest["books"], 2)
        self.assertEqual(manifest["total_references"], 5)
        self.assert_no_staging_left()

    def test_transient_failures_are_retried(self):
        transport, calls = make_api(flaky={"bible/books/Jude": 2, "bible/stats": 1})
        self.assertEqual(run(self.out, transport), 0)
        self.assertEqual(calls["bible/books/Jude"], 3)

    def test_exhausted_book_failure_exits_nonzero_and_writes_nothing(self):
        before = self.seed_previous_snapshot()
        transport, calls = make_api(fail={"bible/books/Jude"})
        self.assertEqual(run(self.out, transport), 1)
        self.assertEqual(calls["bible/books/Jude"], fbd.MAX_RETRIES)
        # Genesis was fetched successfully but must not be written on its own.
        self.assertEqual(read_tree(self.out), before)
        self.assert_no_staging_left()

    def test_exhausted_stats_failure_exits_nonzero(self):
        transport, _ = make_api(fail={"bible/stats"})
        self.assertEqual(run(self.out, transport), 1)
        self.assertFalse(os.path.exists(self.out))

    def test_book_list_failure_exits_nonzero(self):
        transport, _ = make_api(fail={"bible/books"})
        self.assertEqual(run(self.out, transport), 1)

    def test_inconsistent_book_counts_are_rejected(self):
        transport, _ = make_api(overrides={"bible/books/Jude": book_payload("Jude", 1)})
        self.assertEqual(run(self.out, transport), 1)
        self.assertFalse(os.path.exists(self.out))

    def test_stats_total_mismatch_is_rejected(self):
        transport, _ = make_api(overrides={"bible/stats": {"total_references": 999}})
        self.assertEqual(run(self.out, transport), 1)

    def test_unsafe_book_name_is_rejected_before_fetching(self):
        transport, calls = make_api(books={"../escape": 1})
        self.assertEqual(run(self.out, transport), 1)
        self.assertEqual(os.listdir(self.parent), [])
        self.assertEqual(sorted(calls), ["bible/books", "bible/stats"])
        self.assertTrue(fbd.validate_snapshot({}, {"books": [{"book": "a/b", "count": 0}]}, {}))

    def test_tie_order_changes_do_not_bump_manifest(self):
        transport, _ = make_api(books={"Genesis": 2, "Jude": 2})
        self.assertEqual(run(self.out, transport), 0)
        first = read_tree(self.out)["manifest.json"]
        reordered, _ = make_api(books={"Jude": 2, "Genesis": 2})
        self.assertEqual(run(self.out, reordered), 0)
        self.assertEqual(read_tree(self.out)["manifest.json"], first)

    def test_shrinking_snapshot_is_refused_unless_allowed(self):
        transport, _ = make_api(books={"Genesis": 50, "Jude": 50})
        self.assertEqual(run(self.out, transport), 0)
        before = read_tree(self.out)

        smaller, _ = make_api(books={"Genesis": 50})
        self.assertEqual(run(self.out, smaller), 1)
        self.assertEqual(read_tree(self.out), before)

        self.assertEqual(run(self.out, smaller, allow_shrink=True), 0)
        self.assertEqual(sorted(os.listdir(os.path.join(self.out, "books"))), ["Genesis.json"])

    def test_unchanged_data_keeps_manifest(self):
        transport, _ = make_api()
        self.assertEqual(run(self.out, transport), 0)
        first = read_tree(self.out)
        self.assertEqual(run(self.out, transport), 0)
        self.assertEqual(read_tree(self.out), first)

    def test_changed_data_updates_manifest(self):
        self.seed_previous_snapshot()
        old = json.loads(read_tree(self.out)["manifest.json"])
        transport, _ = make_api(books={"Genesis": 1, "Jude": 2})
        self.assertEqual(run(self.out, transport), 0)
        new = json.loads(read_tree(self.out)["manifest.json"])
        self.assertNotEqual(old["content_sha256"], new["content_sha256"])
        self.assertEqual(new["total_references"], 3)

    def test_cli_exits_nonzero_when_api_unreachable(self):
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
        env = dict(os.environ, API_URL=f"http://127.0.0.1:{port}", OUTPUT_DIR=self.out,
                   FETCH_MAX_RETRIES="1", FETCH_RETRY_BACKOFF="0")
        result = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "fetch_bible_data.py")],
                                env=env, capture_output=True, text=True, timeout=60)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("refresh incomplete", result.stdout)
        self.assertFalse(os.path.exists(self.out))


if __name__ == "__main__":
    unittest.main()
