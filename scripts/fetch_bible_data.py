#!/usr/bin/env python3
"""
Bible Reference Data Fetcher

This script fetches Bible reference data from the sermon API and saves it as static JSON files.
It creates:
1. bible_stats.json - Overall statistics about Bible references
2. bible_books.json - List of all Bible books with reference counts
3. books/{book}.json - Detailed references for each book
"""

import os
import json
import asyncio
import httpx
from pathlib import Path

# Configuration
API_BASE_URL = os.environ.get("API_URL", "https://sermon-search-api-8fok.onrender.com")
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "assets/data/bible")
BOOKS_DIR = os.path.join(OUTPUT_DIR, "books")
REQUEST_TIMEOUT = 60.0  # Seconds
# The API runs on a free tier that cold-starts and rejects request bursts.
# Firing all ~67 book requests at once made most of them fail, so the saved
# data silently went stale/partial. Bound concurrency and retry transient
# failures so a refresh reliably fetches every book.
CONCURRENCY = int(os.environ.get("FETCH_CONCURRENCY", "5"))
MAX_RETRIES = int(os.environ.get("FETCH_MAX_RETRIES", "4"))
RETRY_BACKOFF = 3.0  # Seconds, multiplied by the attempt number (linear backoff)

# Ensure output directories exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(BOOKS_DIR, exist_ok=True)

async def fetch_data(client, endpoint):
    """Fetch data from the API endpoint, retrying transient failures."""
    url = f"{API_BASE_URL}/{endpoint}"
    print(f"Fetching data from {url}")
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = await client.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response.json()
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            detail = getattr(getattr(e, "response", None), "status_code", None) or str(e)
            if attempt < MAX_RETRIES:
                wait = RETRY_BACKOFF * attempt
                print(f"Attempt {attempt}/{MAX_RETRIES} failed for {url} ({detail}); retrying in {wait:.0f}s")
                await asyncio.sleep(wait)
            else:
                print(f"Giving up on {url} after {MAX_RETRIES} attempts ({detail})")
                return None

async def fetch_and_save_bible_stats():
    """Fetch overall Bible reference statistics"""
    async with httpx.AsyncClient() as client:
        data = await fetch_data(client, "bible/stats")
        if data:
            output_path = os.path.join(OUTPUT_DIR, "bible_stats.json")
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Saved Bible stats to {output_path}")
            return True
        return False

async def fetch_and_save_bible_books():
    """Fetch list of all Bible books with reference counts"""
    async with httpx.AsyncClient() as client:
        data = await fetch_data(client, "bible/books")
        if data:
            output_path = os.path.join(OUTPUT_DIR, "bible_books.json")
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Saved Bible books to {output_path}")
            return data.get("books", [])
        return []

async def fetch_and_save_book_references(client, book):
    """Fetch and save references for a specific book using a shared client."""
    book_name = book["book"]
    data = await fetch_data(client, f"bible/books/{book_name}")
    if data:
        output_path = os.path.join(BOOKS_DIR, f"{book_name}.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Saved {book_name} references to {output_path}")
        return True
    return False

async def fetch_all_book_references(books):
    """Fetch references for all books with bounded concurrency."""
    semaphore = asyncio.Semaphore(CONCURRENCY)

    async with httpx.AsyncClient() as client:
        async def worker(book):
            async with semaphore:
                return await fetch_and_save_book_references(client, book)

        results = await asyncio.gather(*(worker(b) for b in books))

    success_count = sum(1 for r in results if r)
    print(f"Successfully fetched references for {success_count} out of {len(books)} books")
    if success_count < len(books):
        print(f"WARNING: {len(books) - success_count} book(s) failed to fetch; "
              f"their saved data was left unchanged.")
    return success_count

async def main():
    """Main function to coordinate fetching all Bible reference data"""
    print("Starting Bible reference data fetching")
    
    # Fetch Bible stats
    stats_success = await fetch_and_save_bible_stats()
    if not stats_success:
        print("Failed to fetch Bible stats, but continuing with other data")
    
    # Fetch Bible books
    books = await fetch_and_save_bible_books()
    if not books:
        print("Failed to fetch Bible books list, cannot continue")
        return
    
    # Fetch references for each book
    await fetch_all_book_references(books)
    
    print("Bible reference data fetching completed")

if __name__ == "__main__":
    asyncio.run(main())