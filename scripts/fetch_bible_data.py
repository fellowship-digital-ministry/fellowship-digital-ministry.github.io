#!/usr/bin/env python3
"""
Bible Reference Data Fetcher

Fetches Bible reference data from the sermon API and saves it as static JSON
files that the Bible References page reads:

1. bible_stats.json  - overall statistics about Bible references
2. bible_books.json  - list of all Bible books with reference counts
3. books/{book}.json - detailed references for each book
4. manifest.json     - when the snapshot last changed, and what it contains

The snapshot is all-or-nothing. Every request is retried with bounded
concurrency; if any request still fails, or the fetched data is internally
inconsistent, NOTHING is written and the script exits non-zero, so callers
never commit a half-updated mix of old and new files.

Exit status:
  0  complete snapshot validated and written (or already up to date)
  1  refresh incomplete or invalid; existing files left untouched

Environment:
  API_URL              sermon API base URL
  OUTPUT_DIR           output directory (default assets/data/bible)
  FETCH_CONCURRENCY    parallel book requests (default 5)
  FETCH_MAX_RETRIES    attempts per request (default 4)
  FETCH_RETRY_BACKOFF  seconds, multiplied by the attempt number (default 3)
  FETCH_ALLOW_SHRINK   set to 1/true to accept a snapshot with fewer books or
                       >10% fewer references than the one on disk
"""

import asyncio
import hashlib
import json
import os
import shutil
import sys
import tempfile
from datetime import datetime, timezone

import httpx

# Configuration
API_BASE_URL = os.environ.get("API_URL", "https://sermon-search-api-8fok.onrender.com")
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "assets/data/bible")
REQUEST_TIMEOUT = 60.0  # Seconds
# The API runs on a free tier that cold-starts and rejects request bursts.
# Firing all ~67 book requests at once made most of them fail, so the saved
# data silently went stale/partial. Bound concurrency and retry transient
# failures so a refresh reliably fetches every book.
CONCURRENCY = int(os.environ.get("FETCH_CONCURRENCY", "5"))
MAX_RETRIES = int(os.environ.get("FETCH_MAX_RETRIES", "4"))
RETRY_BACKOFF = float(os.environ.get("FETCH_RETRY_BACKOFF", "3.0"))
# A refresh that loses books or more than this share of references is more
# likely an API problem than real data, so it is refused unless allowed.
SHRINK_TOLERANCE = 0.10
MANIFEST_NAME = "manifest.json"
MANIFEST_SCHEMA = 1


class SnapshotError(Exception):
    """The API could not supply a complete snapshot."""


def env_flag(name):
    return os.environ.get(name, "").strip().lower() in ("1", "true", "yes")


async def fetch_data(client, endpoint):
    """Fetch JSON from the API endpoint, retrying transient failures.

    Returns None once every attempt has failed; the caller decides what an
    exhausted request means for the snapshot.
    """
    print(f"Fetching {endpoint}")
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = await client.get(endpoint, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response.json()
        except (httpx.RequestError, httpx.HTTPStatusError, ValueError) as e:
            detail = getattr(getattr(e, "response", None), "status_code", None) or str(e)
            if attempt < MAX_RETRIES:
                wait = RETRY_BACKOFF * attempt
                print(f"Attempt {attempt}/{MAX_RETRIES} failed for {endpoint} ({detail}); retrying in {wait:.0f}s")
                await asyncio.sleep(wait)
            else:
                print(f"Giving up on {endpoint} after {MAX_RETRIES} attempts ({detail})")
                return None


async def fetch_snapshot(client):
    """Fetch stats, the book index and every book. Raises SnapshotError if
    any request is exhausted; returns (stats, books_index, {book: data})."""
    stats = await fetch_data(client, "bible/stats")
    books_index = await fetch_data(client, "bible/books")
    if books_index is None or not isinstance(books_index, dict):
        raise SnapshotError("could not fetch the book list (bible/books)")

    books = books_index.get("books") or []
    unsafe = [b for b in books if not isinstance(b, dict) or not _safe_name(b.get("book"))]
    if unsafe:
        raise SnapshotError(f"book list contains unsafe or missing names: {unsafe[:3]!r}")
    semaphore = asyncio.Semaphore(CONCURRENCY)

    async def worker(book):
        async with semaphore:
            return await fetch_data(client, f"bible/books/{book.get('book')}")

    results = await asyncio.gather(*(worker(b) for b in books))

    failed = [] if stats is not None else ["bible/stats"]
    book_data = {}
    for book, data in zip(books, results):
        if data is None:
            failed.append(f"bible/books/{book.get('book')}")
        else:
            book_data[book.get("book")] = data
    print(f"Fetched {len(book_data)} of {len(books)} books")
    if failed:
        raise SnapshotError(
            f"{len(failed)} request(s) failed after {MAX_RETRIES} attempts: " + ", ".join(failed)
        )
    return stats, books_index, book_data


def _safe_name(name):
    # Book names become file names: accept only a plain, non-hidden name.
    return isinstance(name, str) and bool(name) and name == os.path.basename(name) and not name.startswith(".")


def _count(data):
    if isinstance(data.get("total_references"), int):
        return data["total_references"]
    return len(data.get("references") or [])


def validate_snapshot(stats, books_index, book_data):
    """Return a list of problems; an empty list means the snapshot is coherent."""
    problems = []
    books = books_index.get("books")
    if not isinstance(books, list) or not books:
        return ["book list is empty"]

    names = [b.get("book") if isinstance(b, dict) else None for b in books]
    for name in names:
        if not _safe_name(name):
            problems.append(f"unsafe or missing book name: {name!r}")
    if len(set(names)) != len(names):
        problems.append("duplicate book names in book list")
    if problems:
        return problems

    total = books_index.get("total_references")
    listed_sum = sum(b.get("count", 0) for b in books)
    if total != listed_sum:
        problems.append(f"bible_books total_references {total} != sum of book counts {listed_sum}")
    if isinstance(books_index.get("total_books"), int) and books_index["total_books"] != len(books):
        problems.append(f"bible_books total_books {books_index['total_books']} != {len(books)} listed")
    if not isinstance(stats, dict) or stats.get("total_references") != total:
        got = stats.get("total_references") if isinstance(stats, dict) else None
        problems.append(f"bible_stats total_references {got} != bible_books total {total}")

    for book in books:
        data = book_data.get(book["book"])
        if not isinstance(data, dict):
            problems.append(f"{book['book']}: missing or malformed book data")
        elif _count(data) != book.get("count"):
            problems.append(f"{book['book']}: {_count(data)} references fetched, book list says {book.get('count')}")
    return problems


def check_shrink(output_dir, books_index, allow):
    """Refuse a snapshot that is much smaller than the one already on disk."""
    try:
        with open(os.path.join(output_dir, "bible_books.json"), encoding="utf-8") as f:
            previous = json.load(f)
    except (OSError, ValueError):
        return []
    prev_books = len(previous.get("books") or [])
    prev_total = previous.get("total_references") or 0
    new_books = len(books_index.get("books") or [])
    new_total = books_index.get("total_references") or 0
    if new_books >= prev_books and new_total >= prev_total * (1 - SHRINK_TOLERANCE):
        return []
    message = (f"snapshot shrank from {prev_books} books / {prev_total} references "
               f"to {new_books} books / {new_total} references")
    if allow:
        print(f"WARNING: {message} (accepted because FETCH_ALLOW_SHRINK is set)")
        return []
    return [message + " (set FETCH_ALLOW_SHRINK=1 if this is expected)"]


def _dump(data):
    # Matches the formatting of the files already in the repository.
    return json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")


def render_files(stats, books_index, book_data):
    """Map relative path -> bytes for every data file in the snapshot."""
    files = {
        "bible_stats.json": _dump(stats),
        "bible_books.json": _dump(books_index),
    }
    for name, data in book_data.items():
        files[f"books/{name}.json"] = _dump(data)
    return files


def data_hash(stats, books_index, book_data):
    """Hash the reference data itself, not its presentation.

    The API breaks ties between equal counts in no fixed order, so the
    order of bible_books.json entries, the stats dictionaries and the
    derived top_books/top_chapters lists can change between identical
    fetches. Those are left out or canonicalised here so updated_at only
    moves when the references actually change.
    """
    canonical = {
        "stats": {k: v for k, v in stats.items() if k not in ("top_books", "top_chapters")},
        "books": sorted(books_index.get("books") or [], key=lambda b: b["book"]),
        "total_references": books_index.get("total_references"),
        "book_data": book_data,
    }
    payload = json.dumps(canonical, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def build_manifest(output_dir, digest, books_index, now=None):
    """Keep the existing manifest when the data is unchanged so it records
    when the references last changed; otherwise stamp a new updated_at."""
    try:
        with open(os.path.join(output_dir, MANIFEST_NAME), encoding="utf-8") as f:
            existing = json.load(f)
        if existing.get("content_sha256") == digest:
            return existing
    except (OSError, ValueError):
        pass
    now = now or datetime.now(timezone.utc)
    return {
        "schema": MANIFEST_SCHEMA,
        "complete": True,
        "updated_at": now.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "source": API_BASE_URL,
        "books": len(books_index.get("books") or []),
        "total_references": books_index.get("total_references"),
        "content_sha256": digest,
    }


def write_snapshot(output_dir, files, manifest):
    """Write every file to a staging directory first, then move them into
    place and drop book files that are no longer in the book list."""
    output_dir = os.path.abspath(output_dir)
    parent = os.path.dirname(output_dir)
    os.makedirs(parent, exist_ok=True)
    staging = tempfile.mkdtemp(prefix=".bible-staging-", dir=parent)
    try:
        all_files = dict(files)
        all_files[MANIFEST_NAME] = _dump(manifest)
        for rel, payload in all_files.items():
            path = os.path.join(staging, rel)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(payload)

        os.makedirs(os.path.join(output_dir, "books"), exist_ok=True)
        for rel in all_files:
            os.replace(os.path.join(staging, rel), os.path.join(output_dir, rel))

        keep = {rel.split("/", 1)[1] for rel in files if rel.startswith("books/")}
        books_dir = os.path.join(output_dir, "books")
        for name in os.listdir(books_dir):
            if name.endswith(".json") and name not in keep:
                os.remove(os.path.join(books_dir, name))
                print(f"Removed stale book file books/{name}")
    finally:
        shutil.rmtree(staging, ignore_errors=True)


async def run(output_dir=OUTPUT_DIR, transport=None, allow_shrink=None):
    """Fetch, validate and write a snapshot. Returns the process exit code."""
    if allow_shrink is None:
        allow_shrink = env_flag("FETCH_ALLOW_SHRINK")
    print(f"Starting Bible reference data fetch from {API_BASE_URL}")
    try:
        async with httpx.AsyncClient(base_url=API_BASE_URL.rstrip("/") + "/", transport=transport) as client:
            stats, books_index, book_data = await fetch_snapshot(client)
    except SnapshotError as e:
        print(f"ERROR: refresh incomplete: {e}")
        print("No files were written; the previous snapshot is unchanged.")
        return 1

    problems = validate_snapshot(stats, books_index, book_data)
    problems += check_shrink(output_dir, books_index, allow_shrink)
    if problems:
        print("ERROR: fetched data failed validation:")
        for problem in problems:
            print(f"  - {problem}")
        print("No files were written; the previous snapshot is unchanged.")
        return 1

    files = render_files(stats, books_index, book_data)
    manifest = build_manifest(output_dir, data_hash(stats, books_index, book_data), books_index)
    write_snapshot(output_dir, files, manifest)
    print(f"Wrote complete snapshot: {manifest['books']} books, "
          f"{manifest['total_references']} references, last changed {manifest['updated_at']}")
    return 0


def main():
    return asyncio.run(run())


if __name__ == "__main__":
    sys.exit(main())
