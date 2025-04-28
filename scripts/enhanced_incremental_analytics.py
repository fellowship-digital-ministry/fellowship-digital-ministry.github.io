#!/usr/bin/env python3
"""
Enhanced Incremental Analytics Generator for Sermon Data

This script:
1. Fetches real sermon data from the API
2. Extracts and analyzes Bible references from sermon transcripts
3. Builds interactive analytics data
4. Generates JSON files that enable clickable visualizations
5. Creates reference pages that link directly to sermon timestamps

Usage:
  python enhanced_incremental_analytics.py

Environment Variables:
  API_URL - URL to the sermon search API (default: https://sermon-search-api-8fok.onrender.com)
  OUTPUT_DIR - Directory to write analytics data (default: _data/analytics)
  ASSETS_DIR - Directory for web-accessible assets (default: assets/data/analytics)
"""

import os
import json
import time
import re
import asyncio
import httpx
from datetime import datetime
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional, Tuple

# Configuration
API_URL = os.environ.get("API_URL", "https://sermon-search-api-8fok.onrender.com")
OUTPUT_DIR = Path("_data/analytics")
ASSETS_DIR = Path("assets/data/analytics")
REQUEST_TIMEOUT = 30  # seconds
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds
BATCH_SIZE = 5  # Number of sermons to process in parallel

# Bible book data
OLD_TESTAMENT = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', 
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
]

NEW_TESTAMENT = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 
    'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 
    'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude',
    'Revelation'
]

# Timeline tracking structure
TIMELINE_BINS = {
    "years": {},
    "months": {},
    "year_months": {}
}

# Regular expression for Bible references - improved with boundary check
# This pattern can detect references like "John 3:16" or "Romans 8:28-30"
BIBLE_REF_PATTERN = r'\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Song of Songs|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d+)(?::(\d+)(?:-(\d+))?)?'

def setup_directories() -> None:
    """Create the necessary directories if they don't exist."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "references").mkdir(exist_ok=True)
    (OUTPUT_DIR / "books").mkdir(exist_ok=True)
    (OUTPUT_DIR / "chapters").mkdir(exist_ok=True)
    
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    (ASSETS_DIR / "references").mkdir(exist_ok=True)
    (ASSETS_DIR / "books").mkdir(exist_ok=True)
    (ASSETS_DIR / "chapters").mkdir(exist_ok=True)

def standardize_book_name(book: str) -> str:
    """Standardize Bible book names for consistency."""
    book = book.strip()
    # Handle common variations
    if book.lower() == "psalm":
        return "Psalms"
    if book.lower() == "song of songs":
        return "Song of Solomon"
    # Title case for consistency
    return book.title()

async def fetch_with_retry(client: httpx.AsyncClient, url: str, method: str = "GET", data: Optional[dict] = None):
    """Fetch data from the API with retry logic."""
    full_url = url
    # Make sure URL has http/https
    if not url.startswith(('http://', 'https://')):
        full_url = f"{API_URL.rstrip('/')}/{url.lstrip('/')}"
    
    for attempt in range(MAX_RETRIES):
        try:
            if method == "GET":
                response = await client.get(full_url, timeout=REQUEST_TIMEOUT)
            else:
                response = await client.post(full_url, json=data, timeout=REQUEST_TIMEOUT)
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"HTTP error occurred: {e} - Attempt {attempt + 1} of {MAX_RETRIES}")
        except httpx.RequestError as e:
            print(f"Request error occurred: {e} - Attempt {attempt + 1} of {MAX_RETRIES}")
        
        if attempt < MAX_RETRIES - 1:
            print(f"Retrying in {RETRY_DELAY} seconds...")
            time.sleep(RETRY_DELAY)
    
    raise Exception(f"Failed to fetch {full_url} after {MAX_RETRIES} attempts")

def get_processed_sermon_ids() -> List[str]:
    """Get the list of sermon IDs that have already been processed."""
    processed_sermons_file = OUTPUT_DIR / "processed_sermons.json"
    
    if processed_sermons_file.exists():
        try:
            with open(processed_sermons_file, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Error reading processed sermons file. Starting fresh.")
            return []
    
    return []

def load_existing_analytics() -> Dict[str, Any]:
    """Load existing analytics data if available."""
    analytics = {
        "summary": {"total_sermons": 0, "total_chunks": 0, "total_references": 0},
        "book_counts": {},
        "chapter_counts": {},
        "verse_counts": {},
        "testament_counts": {"Old Testament": 0, "New Testament": 0},
        "sermons": {},
        "timeline": {"years": {}, "months": {}, "year_months": {}}
    }
    
    # Try to load existing data files
    file_mappings = {
        "summary": OUTPUT_DIR / "summary.json",
        "book_counts": OUTPUT_DIR / "books.json",
        "chapter_counts": OUTPUT_DIR / "chapters.json",
        "verse_counts": OUTPUT_DIR / "verses.json",
        "sermons": OUTPUT_DIR / "sermons.json",
        "timeline": OUTPUT_DIR / "timeline.json"
    }
    
    for key, file_path in file_mappings.items():
        if file_path.exists():
            try:
                with open(file_path, 'r') as f:
                    analytics[key] = json.load(f)
            except json.JSONDecodeError:
                print(f"Error reading {file_path}. Using empty data.")
    
    return analytics

async def fetch_sermon_list(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    """Fetch the list of available sermons from the API."""
    try:
        print(f"Fetching sermon list from API...")
        data = await fetch_with_retry(client, "/sermons")
        sermons = data.get("sermons", [])
        print(f"Found {len(sermons)} sermons in the API")
        return sermons
    except Exception as e:
        print(f"Error fetching sermon list: {e}")
        return []

async def fetch_sermon_chunks(client: httpx.AsyncClient, video_id: str) -> List[Dict[str, Any]]:
    """Fetch chunks for a single sermon."""
    try:
        print(f"Fetching chunks for sermon {video_id}")
        data = await fetch_with_retry(client, f"/sermons/{video_id}")
        chunks = data.get("chunks", [])
        print(f"Retrieved {len(chunks)} chunks for sermon {video_id}")
        return chunks
    except Exception as e:
        print(f"Error fetching chunks for sermon {video_id}: {e}")
        return []

def parse_sermon_date(date_str: str) -> Optional[datetime]:
    """Parse sermon date from various formats."""
    if not date_str:
        return None
    
    try:
        # Try ISO format (YYYY-MM-DD)
        if isinstance(date_str, str) and '-' in date_str:
            # Handle trailing Z or timezone
            clean_date = date_str.replace('Z', '+00:00') if date_str.endswith('Z') else date_str
            return datetime.fromisoformat(clean_date)
            
        # Try YYYYMMDD format as string
        if isinstance(date_str, str) and len(date_str) == 8 and date_str.isdigit():
            year = int(date_str[:4])
            month = int(date_str[4:6])
            day = int(date_str[6:8])
            return datetime(year, month, day)
            
        # Try timestamp (integer)
        if isinstance(date_str, (int, float)):
            return datetime.fromtimestamp(date_str)
            
        # Last resort: try generic parsing
        return datetime.fromisoformat(str(date_str))
    except (ValueError, TypeError) as e:
        print(f"Error parsing date '{date_str}': {e}")
        return None

def update_timeline_data(timeline: Dict[str, Dict[str, List[str]]], sermon_id: str, date: datetime) -> None:
    """Update timeline tracking with a sermon ID and its date."""
    if not date:
        return
    
    year = str(date.year)
    month = str(date.month)
    year_month = f"{year}-{month.zfill(2)}"
    
    # Update years
    if year not in timeline["years"]:
        timeline["years"][year] = []
    if sermon_id not in timeline["years"][year]:
        timeline["years"][year].append(sermon_id)
    
    # Update months
    if month not in timeline["months"]:
        timeline["months"][month] = []
    if sermon_id not in timeline["months"][month]:
        timeline["months"][month].append(sermon_id)
    
    # Update year_months
    if year_month not in timeline["year_months"]:
        timeline["year_months"][year_month] = []
    if sermon_id not in timeline["year_months"][year_month]:
        timeline["year_months"][year_month].append(sermon_id)

def extract_bible_references(text: str) -> List[Tuple[str, str, Optional[str], Optional[str]]]:
    """
    Extract Bible references from text.
    Returns a list of tuples: (book, chapter, verse_start, verse_end)
    """
    references = []
    
    if not text:
        return references
    
    # Find all Bible references in the text
    matches = re.finditer(BIBLE_REF_PATTERN, text, re.IGNORECASE)
    
    for match in matches:
        book = standardize_book_name(match.group(1))
        chapter = match.group(2)
        verse_start = match.group(3)
        verse_end = match.group(4)
        
        references.append((book, chapter, verse_start, verse_end))
    
    return references

def analyze_sermon_references(sermon_id: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyze Bible references in a sermon's chunks.
    Returns statistics and occurrence data.
    """
    # Initialize counters
    book_counts = Counter()
    chapter_counts = Counter()
    verse_counts = Counter()
    testament_counts = {"Old Testament": 0, "New Testament": 0}
    reference_occurrences = {}
    
    for chunk in chunks:
        # Skip if no text
        if not (text := chunk.get("text", "")):
            continue
        
        # Get chunk timestamp
        start_time = chunk.get("start_time", 0)
        
        # Extract references
        for book, chapter, verse_start, verse_end in extract_bible_references(text):
            # Update book count
            book_counts[book] += 1
            
            # Update testament count
            if book in OLD_TESTAMENT:
                testament_counts["Old Testament"] += 1
            elif book in NEW_TESTAMENT:
                testament_counts["New Testament"] += 1
                
            # Create reference keys at different levels
            book_key = book
            chapter_key = f"{book} {chapter}" if chapter else None
            verse_key = f"{book} {chapter}:{verse_start}" if chapter and verse_start else None
            
            # Build full reference for occurrence tracking
            if chapter and verse_start and verse_end:
                full_ref = f"{book} {chapter}:{verse_start}-{verse_end}"
            elif chapter and verse_start:
                full_ref = f"{book} {chapter}:{verse_start}"
            elif chapter:
                full_ref = f"{book} {chapter}"
            else:
                full_ref = book
                
            # Update chapter count if applicable
            if chapter_key:
                chapter_counts[chapter_key] += 1
                
            # Update verse count if applicable
            if verse_key:
                verse_counts[verse_key] += 1
                
            # Record occurrence details
            if full_ref not in reference_occurrences:
                reference_occurrences[full_ref] = []
                
            # Add this occurrence
            reference_occurrences[full_ref].append({
                "sermon_id": sermon_id,
                "timestamp": start_time,
                "text": text,
                "context": extract_context(text, full_ref)
            })
    
    return {
        "total_references": sum(book_counts.values()),
        "book_counts": dict(book_counts),
        "chapter_counts": dict(chapter_counts),
        "verse_counts": dict(verse_counts),
        "testament_counts": testament_counts,
        "reference_occurrences": reference_occurrences
    }

def extract_context(text: str, reference: str) -> str:
    """Extract relevant context around a Bible reference."""
    # Create a pattern that escapes special regex characters in the reference
    escaped_ref = re.escape(reference)
    pattern = rf"\b{escaped_ref}\b"
    
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return text  # If reference not found, return full text
    
    # Get position of reference
    start_pos = match.start()
    end_pos = match.end()
    
    # Extract context (100 characters before and after)
    context_start = max(0, start_pos - 100)
    context_end = min(len(text), end_pos + 100)
    
    # Get context with the reference highlighted
    context = text[context_start:context_end]
    
    # If we truncated the beginning, add ellipsis
    if context_start > 0:
        context = '...' + context
        
    # If we truncated the end, add ellipsis
    if context_end < len(text):
        context = context + '...'
        
    return context

async def process_sermon_batch(client: httpx.AsyncClient, sermon_batch: List[Dict[str, Any]], analytics_data: Dict[str, Any]) -> Dict[str, Any]:
    """Process a batch of sermons in parallel."""
    tasks = []
    
    # Create tasks for fetching chunks for each sermon
    for sermon in sermon_batch:
        video_id = sermon.get("video_id")
        if not video_id:
            continue
            
        tasks.append(fetch_sermon_chunks(client, video_id))
    
    # Wait for all chunk retrieval tasks to complete
    sermon_chunks_list = await asyncio.gather(*tasks)
    
    # Process each sermon's chunks
    for idx, sermon in enumerate(sermon_batch):
        video_id = sermon.get("video_id")
        if not video_id:
            continue
            
        chunks = sermon_chunks_list[idx]
        if not chunks:
            print(f"No chunks found for sermon {video_id}. Skipping.")
            continue
        
        # Add video_id to each chunk if missing
        for chunk in chunks:
            if "video_id" not in chunk:
                chunk["video_id"] = video_id
        
        # Update sermon metadata
        sermon_metadata = {
            "video_id": video_id,
            "title": sermon.get("title", f"Sermon {video_id}"),
            "publish_date": sermon.get("publish_date", ""),
            "channel": sermon.get("channel", "Fellowship Church"),
            "url": sermon.get("url", f"https://www.youtube.com/watch?v={video_id}"),
            "chunk_count": len(chunks)
        }
        
        # Store sermon metadata
        analytics_data["sermons"][video_id] = sermon_metadata
        
        # Update sermon count
        analytics_data["summary"]["total_sermons"] = len(analytics_data["sermons"])
        
        # Update chunk count
        analytics_data["summary"]["total_chunks"] += len(chunks)
        
        # Analyze references
        sermon_analytics = analyze_sermon_references(video_id, chunks)
        
        # Update total references count
        analytics_data["summary"]["total_references"] += sermon_analytics["total_references"]
        
        # Update book counts
        for book, count in sermon_analytics["book_counts"].items():
            analytics_data["book_counts"][book] = analytics_data["book_counts"].get(book, 0) + count
            
            # Generate book occurrence data
            await update_book_occurrences(book, video_id, sermon_metadata, sermon_analytics)
        
        # Update chapter counts
        for chapter, count in sermon_analytics["chapter_counts"].items():
            analytics_data["chapter_counts"][chapter] = analytics_data["chapter_counts"].get(chapter, 0) + count
            
            # Generate chapter occurrence data
            await update_chapter_occurrences(chapter, video_id, sermon_metadata, sermon_analytics)
        
        # Update verse counts
        for verse, count in sermon_analytics["verse_counts"].items():
            analytics_data["verse_counts"][verse] = analytics_data["verse_counts"].get(verse, 0) + count
        
        # Update testament counts
        for testament, count in sermon_analytics["testament_counts"].items():
            analytics_data["testament_counts"][testament] += count
        
        # Update timeline data
        date = parse_sermon_date(sermon_metadata["publish_date"])
        if date:
            update_timeline_data(analytics_data["timeline"], video_id, date)
        
        # Generate reference occurrence files
        await update_reference_occurrences(sermon_analytics["reference_occurrences"], sermon_metadata)
        
        print(f"Processed sermon {video_id}: Found {sermon_analytics['total_references']} Bible references")
    
    return analytics_data

async def update_reference_occurrences(occurrences: Dict[str, List[Dict[str, Any]]], sermon_metadata: Dict[str, Any]) -> None:
    """Update reference occurrence files with new data."""
    for reference, reference_occurrences in occurrences.items():
        # Create a safe filename
        safe_reference = reference.replace(":", "_").replace(" ", "_").replace("-", "_to_")
        file_path = OUTPUT_DIR / "references" / f"{safe_reference}.json"
        assets_path = ASSETS_DIR / "references" / f"{safe_reference}.json"
        
        # Check if file already exists
        existing_data = {"reference": reference, "occurrences": []}
        if file_path.exists():
            try:
                with open(file_path, 'r') as f:
                    existing_data = json.load(f)
            except json.JSONDecodeError:
                print(f"Error reading reference file {file_path}. Starting fresh.")
        
        # Add new occurrences, enriched with sermon metadata
        for occurrence in reference_occurrences:
            enriched_occurrence = {
                **occurrence,
                "sermon_title": sermon_metadata.get("title", "Unknown Sermon"),
                "url": f"https://www.youtube.com/watch?v={occurrence['sermon_id']}&t={int(occurrence['timestamp'])}",
                "channel": sermon_metadata.get("channel", "Unknown Channel"),
                "publish_date": sermon_metadata.get("publish_date", "")
            }
            
            # Add to existing occurrences (avoid duplicates by checking sermon_id and timestamp)
            is_duplicate = False
            for existing_occurrence in existing_data["occurrences"]:
                if (existing_occurrence.get("sermon_id") == enriched_occurrence["sermon_id"] and 
                    abs(existing_occurrence.get("timestamp", 0) - enriched_occurrence["timestamp"]) < 5):
                    is_duplicate = True
                    break
                    
            if not is_duplicate:
                existing_data["occurrences"].append(enriched_occurrence)
        
        # Write updated file
        with open(file_path, 'w') as f:
            json.dump(existing_data, f, indent=2)
            
        # Also write to assets directory for web access
        with open(assets_path, 'w') as f:
            json.dump(existing_data, f, indent=2)

async def update_book_occurrences(book: str, sermon_id: str, sermon_metadata: Dict[str, Any], sermon_analytics: Dict[str, Any]) -> None:
    """Update book occurrence files with references to this book."""
    # Create a safe filename
    safe_book = book.replace(" ", "_")
    file_path = OUTPUT_DIR / "books" / f"{safe_book}.json"
    assets_path = ASSETS_DIR / "books" / f"{safe_book}.json"
    
    # Check if file already exists
    existing_data = {"book": book, "sermons": []}
    if file_path.exists():
        try:
            with open(file_path, 'r') as f:
                existing_data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error reading book file {file_path}. Starting fresh.")
    
    # Find all references to this book
    book_occurrences = []
    for ref, occurrences in sermon_analytics["reference_occurrences"].items():
        if ref.startswith(book + " ") or ref == book:
            for occurrence in occurrences:
                book_occurrences.append({
                    "reference": ref,
                    "sermon_id": sermon_id,
                    "timestamp": occurrence["timestamp"],
                    "context": occurrence.get("context", occurrence["text"])
                })
    
    # If we found occurrences, add sermon to the book's sermon list
    if book_occurrences:
        # Check if sermon is already in the list
        sermon_exists = False
        for sermon in existing_data["sermons"]:
            if sermon["sermon_id"] == sermon_id:
                sermon_exists = True
                # Update occurrences
                sermon["occurrences"] = book_occurrences
                break
                
        if not sermon_exists:
            # Add new sermon entry
            existing_data["sermons"].append({
                "sermon_id": sermon_id,
                "sermon_title": sermon_metadata.get("title", "Unknown Sermon"),
                "url": sermon_metadata.get("url", f"https://www.youtube.com/watch?v={sermon_id}"),
                "publish_date": sermon_metadata.get("publish_date", ""),
                "occurrences": book_occurrences
            })
    
    # Write updated file
    with open(file_path, 'w') as f:
        json.dump(existing_data, f, indent=2)
        
    # Also write to assets directory for web access
    with open(assets_path, 'w') as f:
        json.dump(existing_data, f, indent=2)

async def update_chapter_occurrences(chapter: str, sermon_id: str, sermon_metadata: Dict[str, Any], sermon_analytics: Dict[str, Any]) -> None:
    """Update chapter occurrence files with references to this chapter."""
    # Create a safe filename
    safe_chapter = chapter.replace(" ", "_").replace(":", "_")
    file_path = OUTPUT_DIR / "chapters" / f"{safe_chapter}.json"
    assets_path = ASSETS_DIR / "chapters" / f"{safe_chapter}.json"
    
    # Check if file already exists
    existing_data = {"chapter": chapter, "sermons": []}
    if file_path.exists():
        try:
            with open(file_path, 'r') as f:
                existing_data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error reading chapter file {file_path}. Starting fresh.")
    
    # Find all references to this chapter
    chapter_occurrences = []
    for ref, occurrences in sermon_analytics["reference_occurrences"].items():
        # Match exact chapter or verses in this chapter
        if ref == chapter or ref.startswith(chapter + ":"):
            for occurrence in occurrences:
                chapter_occurrences.append({
                    "reference": ref,
                    "sermon_id": sermon_id,
                    "timestamp": occurrence["timestamp"],
                    "context": occurrence.get("context", occurrence["text"])
                })
    
    # If we found occurrences, add sermon to the chapter's sermon list
    if chapter_occurrences:
        # Check if sermon is already in the list
        sermon_exists = False
        for sermon in existing_data["sermons"]:
            if sermon["sermon_id"] == sermon_id:
                sermon_exists = True
                # Update occurrences
                sermon["occurrences"] = chapter_occurrences
                break
                
        if not sermon_exists:
            # Add new sermon entry
            existing_data["sermons"].append({
                "sermon_id": sermon_id,
                "sermon_title": sermon_metadata.get("title", "Unknown Sermon"),
                "url": sermon_metadata.get("url", f"https://www.youtube.com/watch?v={sermon_id}"),
                "publish_date": sermon_metadata.get("publish_date", ""),
                "occurrences": chapter_occurrences
            })
    
    # Write updated file
    with open(file_path, 'w') as f:
        json.dump(existing_data, f, indent=2)
        
    # Also write to assets directory for web access
    with open(assets_path, 'w') as f:
        json.dump(existing_data, f, indent=2)

async def generate_analytics_files(analytics_data: Dict[str, Any]) -> None:
    """Generate all the JSON files needed for the analytics dashboard."""
    print("Generating analytics JSON files...")
    
    # 1. Update summary with current timestamp
    analytics_data["summary"]["generated_at"] = datetime.now().isoformat()
    
    # 2. Top-level files to generate
    file_mappings = {
        "summary": (OUTPUT_DIR / "summary.json", ASSETS_DIR / "summary.json"),
        "book_counts": (OUTPUT_DIR / "books.json", ASSETS_DIR / "books.json"),
        "chapter_counts": (OUTPUT_DIR / "chapters.json", ASSETS_DIR / "chapters.json"),
        "verse_counts": (OUTPUT_DIR / "verses.json", ASSETS_DIR / "verses.json"),
        "testament_counts": (OUTPUT_DIR / "testament_counts.json", ASSETS_DIR / "testament_counts.json"),
        "sermons": (OUTPUT_DIR / "sermons.json", ASSETS_DIR / "sermons.json"),
        "timeline": (OUTPUT_DIR / "timeline.json", ASSETS_DIR / "timeline.json")
    }
    
    # Write files
    for key, (output_path, assets_path) in file_mappings.items():
        data = analytics_data.get(key, {})
        
        # Special case for top items
        if key in ["chapter_counts", "verse_counts"]:
            # Get top 100 items
            data = dict(Counter(data).most_common(100))
        
        # Write to output directory
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
            
        # Write to assets directory for web access
        with open(assets_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    # 3. Generate references index file
    reference_counts = {}
    
    # Count occurrences for each reference by checking files
    reference_files = list(Path(OUTPUT_DIR / "references").glob("*.json"))
    for file_path in reference_files:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                reference = data.get("reference", "")
                occurrences = data.get("occurrences", [])
                if reference:
                    reference_counts[reference] = len(occurrences)
        except json.JSONDecodeError:
            print(f"Error reading reference file {file_path}. Skipping.")
    
    # Write references index
    references_index_path = OUTPUT_DIR / "references_index.json"
    references_index_assets_path = ASSETS_DIR / "references_index.json"
    
    with open(references_index_path, 'w') as f:
        json.dump(reference_counts, f, indent=2)
        
    with open(references_index_assets_path, 'w') as f:
        json.dump(reference_counts, f, indent=2)
    
    print("Analytics files generated successfully.")

def update_processed_sermons(processed_sermon_ids: List[str]) -> None:
    """Write the list of processed sermon IDs to a file."""
    processed_sermons_file = OUTPUT_DIR / "processed_sermons.json"
    
    with open(processed_sermons_file, 'w') as f:
        json.dump(processed_sermon_ids, f, indent=2)

async def process_sermons(sermons: List[Dict[str, Any]], processed_ids: List[str], analytics_data: Dict[str, Any]) -> Tuple[List[str], Dict[str, Any]]:
    """Process all new sermons in batches."""
    # Filter to only new sermons
    new_sermons = [sermon for sermon in sermons if sermon.get("video_id") not in processed_ids]
    
    if not new_sermons:
        print("No new sermons to process.")
        return processed_ids, analytics_data
    
    print(f"Processing {len(new_sermons)} new sermons in batches of {BATCH_SIZE}...")
    
    # Process in batches
    async with httpx.AsyncClient() as client:
        for i in range(0, len(new_sermons), BATCH_SIZE):
            batch = new_sermons[i:i + BATCH_SIZE]
            print(f"Processing batch {i//BATCH_SIZE + 1} of {(len(new_sermons) + BATCH_SIZE - 1)//BATCH_SIZE}")
            
            # Process batch
            analytics_data = await process_sermon_batch(client, batch, analytics_data)
            
            # Update processed IDs
            for sermon in batch:
                if video_id := sermon.get("video_id"):
                    if video_id not in processed_ids:
                        processed_ids.append(video_id)
            
            # Save progress after each batch
            update_processed_sermons(processed_ids)
            
            # Small delay to avoid API rate limits
            time.sleep(1)
    
    return processed_ids, analytics_data

async def main() -> None:
    """Main function to incrementally generate sermon analytics."""
    print(f"Starting enhanced sermon analytics generation at {datetime.now().isoformat()}")
    
    # Setup directories
    setup_directories()
    
    # Load existing data
    processed_sermon_ids = get_processed_sermon_ids()
    print(f"Found {len(processed_sermon_ids)} previously processed sermons")
    
    analytics_data = load_existing_analytics()
    print("Loaded existing analytics data")
    
    # Fetch and process sermons
    async with httpx.AsyncClient() as client:
        # Get sermon list
        sermons = await fetch_sermon_list(client)
        
        if not sermons:
            print("No sermons found in API. Exiting.")
            return
            
        # Process sermons
        processed_sermon_ids, analytics_data = await process_sermons(
            sermons, processed_sermon_ids, analytics_data
        )
        
        # Generate analytics files
        await generate_analytics_files(analytics_data)
    
    print(f"Enhanced sermon analytics generation completed at {datetime.now().isoformat()}")

if __name__ == "__main__":
    asyncio.run(main())