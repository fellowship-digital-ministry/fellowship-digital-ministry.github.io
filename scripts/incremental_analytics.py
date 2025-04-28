#!/usr/bin/env python3
"""
Incremental sermon analytics generation.

This script:
1. Checks for new sermons in the vector database
2. Only processes new sermons that haven't been analyzed before
3. Updates the combined analytics data with the new information
4. Generates all necessary JSON files for the website
"""

import os
import json
import time
import re
import glob
import httpx
import asyncio
from datetime import datetime
from pathlib import Path
from collections import defaultdict, Counter

# Configuration
API_URL = os.environ.get("API_URL", "https://sermon-search-api-8fok.onrender.com")
OUTPUT_DIR = Path("_data/analytics")
METADATA_DIR = os.environ.get("METADATA_DIR", "../sermon-library/transcription/metadata")
REQUEST_TIMEOUT = 30  # seconds
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

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

# Regular expression for Bible references
BIBLE_REF_PATTERN = r'\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d+)(?::(\d+)(?:-(\d+))?)?'

def setup_directory():
    """Create the necessary directories if they don't exist."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories
    (OUTPUT_DIR / "references").mkdir(exist_ok=True)
    (OUTPUT_DIR / "sermons").mkdir(exist_ok=True)

async def fetch_with_retry(client, url, method="GET", data=None):
    """Fetch data from the API with retry logic."""
    # Make sure URL has http/https
    if not (url.startswith('http://') or url.startswith('https://')):
        url = 'https://' + url.lstrip('/')
    
    for attempt in range(MAX_RETRIES):
        try:
            if method == "GET":
                response = await client.get(url, timeout=REQUEST_TIMEOUT)
            else:
                response = await client.post(url, json=data, timeout=REQUEST_TIMEOUT)
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"HTTP error occurred: {e} - Attempt {attempt + 1} of {MAX_RETRIES}")
        except httpx.RequestError as e:
            print(f"Request error occurred: {e} - Attempt {attempt + 1} of {MAX_RETRIES}")
        
        if attempt < MAX_RETRIES - 1:
            print(f"Retrying in {RETRY_DELAY} seconds...")
            time.sleep(RETRY_DELAY)
    
    raise Exception(f"Failed to fetch {url} after {MAX_RETRIES} attempts")

def get_processed_sermon_ids():
    """Get the list of sermon IDs that have already been processed."""
    # Check for sermons we've already analyzed
    processed_sermons_file = OUTPUT_DIR / "processed_sermons.json"
    
    if processed_sermons_file.exists():
        try:
            with open(processed_sermons_file, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Error reading processed sermons file. Starting fresh.")
            return []
    
    return []

def load_existing_analytics():
    """Load existing analytics data if available."""
    analytics = {
        "summary": {"total_sermons": 0, "total_chunks": 0, "total_references": 0},
        "book_counts": {},
        "chapter_counts": {},
        "verse_counts": {},
        "testament_counts": {"Old Testament": 0, "New Testament": 0},
        "sermons": {},
        "time_grouping": {"by_year": {}, "by_month": {}, "by_year_month": {}}
    }
    
    # Try to load existing data files
    for key in analytics.keys():
        if key == "summary":
            file_path = OUTPUT_DIR / "summary.json"
        elif key == "book_counts":
            file_path = OUTPUT_DIR / "books.json"
        elif key == "chapter_counts":
            file_path = OUTPUT_DIR / "chapters.json"
        elif key == "verse_counts":
            file_path = OUTPUT_DIR / "verses.json"
        elif key == "sermons":
            file_path = OUTPUT_DIR / "sermons.json"
        elif key == "time_grouping":
            file_path = OUTPUT_DIR / "time_grouping.json"
        else:
            continue
            
        if file_path.exists():
            try:
                with open(file_path, 'r') as f:
                    if key in ["book_counts", "chapter_counts", "verse_counts"]:
                        analytics[key] = json.load(f)
                    elif key == "sermons":
                        analytics[key] = json.load(f)
                    elif key == "time_grouping":
                        analytics[key] = json.load(f)
                    elif key == "summary":
                        summary = json.load(f)
                        analytics[key] = summary
            except json.JSONDecodeError:
                print(f"Error reading {file_path}. Using empty data.")
    
    return analytics

def load_sermon_metadata_from_files():
    """Load sermon metadata from the metadata directory."""
    sermon_metadata = {}
    
    # Try to use METADATA_DIR environment variable
    metadata_dir = METADATA_DIR
    
    if not os.path.exists(metadata_dir):
        print(f"Metadata directory {metadata_dir} not found. Using empty metadata.")
        return {}
    
    # Find all JSON files in the metadata directory
    metadata_files = glob.glob(os.path.join(metadata_dir, "*.json"))
    print(f"Found {len(metadata_files)} metadata files in {metadata_dir}")
    
    for file_path in metadata_files:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                
            # Extract video_id from the file name if not in data
            if "video_id" not in data:
                file_name = os.path.basename(file_path)
                video_id = os.path.splitext(file_name)[0]  # Remove extension
                data["video_id"] = video_id
                
            # Store metadata by video ID
            sermon_metadata[data["video_id"]] = {
                "video_id": data["video_id"],
                "title": data.get("title", f"Sermon {data['video_id']}"),
                "publish_date": data.get("publish_date", ""),
                "channel": "Fellowship Church",
                "duration": data.get("duration", 0),
                "url": f"https://www.youtube.com/watch?v={data['video_id']}"
            }
            
        except Exception as e:
            print(f"Error reading metadata file {file_path}: {e}")
    
    return sermon_metadata

async def fetch_sermon_list():
    """Fetch the list of available sermons from the API."""
    # Make sure API_URL has http/https
    api_url = API_URL
    if api_url and not (api_url.startswith('http://') or api_url.startswith('https://')):
        api_url = 'https://' + api_url.lstrip('/')
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"Fetching sermon list from {api_url}/sermons")
            data = await fetch_with_retry(client, f"{api_url}/sermons")
            return data.get("sermons", [])
        except Exception as e:
            print(f"Error fetching sermon list: {e}")
            return []

async def fetch_sermon_chunks(client, video_id):
    """Fetch chunks for a single sermon."""
    # Make sure API_URL has http/https
    api_url = API_URL
    if api_url and not (api_url.startswith('http://') or api_url.startswith('https://')):
        api_url = 'https://' + api_url.lstrip('/')
        
    try:
        print(f"Fetching chunks for sermon {video_id}")
        data = await fetch_with_retry(client, f"{api_url}/sermons/{video_id}")
        return data.get("chunks", [])
    except Exception as e:
        print(f"Error fetching chunks for sermon {video_id}: {e}")
        return []

def analyze_bible_references(chunks, video_id):
    """
    Extract and analyze Bible references from sermon chunks.
    Returns per-sermon analytics and sermon reference occurrences.
    """
    # Initialize counters for this sermon
    book_counts = Counter()
    chapter_counts = Counter()
    verse_counts = Counter()
    testament_counts = {"Old Testament": 0, "New Testament": 0}
    reference_occurrences = {}
    
    # Analyze each chunk
    total_references = 0
    
    for chunk in chunks:
        text = chunk.get("text", "")
        if not text:
            continue
            
        # Add video_id to chunk if not present
        if "video_id" not in chunk:
            chunk["video_id"] = video_id
            
        # Find all Bible references in the text
        matches = re.finditer(BIBLE_REF_PATTERN, text, re.IGNORECASE)
        
        for match in matches:
            total_references += 1
            
            # Standardize book name
            book = match.group(1).title()
            if book == "Psalm":
                book = "Psalms"
            
            # Count the book reference
            book_counts[book] += 1
            
            # Count testament
            if book in OLD_TESTAMENT:
                testament_counts["Old Testament"] += 1
            elif book in NEW_TESTAMENT:
                testament_counts["New Testament"] += 1
            
            # Build reference
            reference = book
            
            if match.group(2):  # Chapter
                chapter = match.group(2)
                reference += f" {chapter}"
                chapter_key = f"{book} {chapter}"
                chapter_counts[chapter_key] += 1
                
                if match.group(3):  # Verse
                    verse = match.group(3)
                    reference += f":{verse}"
                    verse_key = f"{book} {chapter}:{verse}"
                    verse_counts[verse_key] += 1
            
            # Store reference occurrence
            if reference not in reference_occurrences:
                reference_occurrences[reference] = []
                
            # Use start_time from chunk
            start_time = chunk.get("start_time", 0)
                
            reference_occurrences[reference].append({
                "sermon_id": video_id,
                "timestamp": start_time,
                "text": text
            })
    
    return {
        "total_references": total_references,
        "book_counts": dict(book_counts),
        "chapter_counts": dict(chapter_counts),
        "verse_counts": dict(verse_counts),
        "testament_counts": testament_counts,
        "reference_occurrences": reference_occurrences
    }

async def process_new_sermons(sermon_ids, processed_sermon_ids, analytics_data, sermon_metadata):
    """Process only sermons that haven't been analyzed before."""
    new_sermon_ids = [sid for sid in sermon_ids if sid not in processed_sermon_ids]
    
    if not new_sermon_ids:
        print("No new sermons to process!")
        return analytics_data, processed_sermon_ids
    
    print(f"Processing {len(new_sermon_ids)} new sermons...")
    
    # Process new sermons
    async with httpx.AsyncClient() as client:
        for video_id in new_sermon_ids:
            # Get sermon chunks
            chunks = await fetch_sermon_chunks(client, video_id)
            
            if not chunks:
                print(f"No chunks found for sermon {video_id}. Skipping.")
                continue
                
            # Get sermon metadata
            if video_id in sermon_metadata:
                sermon_data = sermon_metadata[video_id]
            else:
                print(f"No metadata found for sermon {video_id}. Using defaults.")
                sermon_data = {
                    "video_id": video_id,
                    "title": f"Sermon {video_id}",
                    "publish_date": "",
                    "channel": "Fellowship Church",
                    "url": f"https://www.youtube.com/watch?v={video_id}"
                }
            
            # Update sermons data
            sermon_data["chunk_count"] = len(chunks)
            analytics_data["sermons"][video_id] = sermon_data
            
            # Analyze Bible references in this sermon
            sermon_analytics = analyze_bible_references(chunks, video_id)
            
            # Update global analytics data
            analytics_data["summary"]["total_chunks"] += len(chunks)
            analytics_data["summary"]["total_references"] += sermon_analytics["total_references"]
            
            # Update book counts
            for book, count in sermon_analytics["book_counts"].items():
                if book in analytics_data["book_counts"]:
                    analytics_data["book_counts"][book] += count
                else:
                    analytics_data["book_counts"][book] = count
            
            # Update chapter counts
            for chapter, count in sermon_analytics["chapter_counts"].items():
                if chapter in analytics_data["chapter_counts"]:
                    analytics_data["chapter_counts"][chapter] += count
                else:
                    analytics_data["chapter_counts"][chapter] = count
            
            # Update verse counts
            for verse, count in sermon_analytics["verse_counts"].items():
                if verse in analytics_data["verse_counts"]:
                    analytics_data["verse_counts"][verse] += count
                else:
                    analytics_data["verse_counts"][verse] = count
            
            # Update testament counts
            analytics_data["testament_counts"]["Old Testament"] += sermon_analytics["testament_counts"]["Old Testament"]
            analytics_data["testament_counts"]["New Testament"] += sermon_analytics["testament_counts"]["New Testament"]
            
            # Generate or update reference occurrence files
            await generate_reference_files(sermon_analytics["reference_occurrences"], sermon_data)
            
            # Add to time grouping
            update_time_grouping(analytics_data["time_grouping"], video_id, sermon_data)
            
            # Add to processed list
            processed_sermon_ids.append(video_id)
            
            print(f"Processed sermon {video_id}: {sermon_data['title']}")
            
    # Update summary total sermons
    analytics_data["summary"]["total_sermons"] = len(analytics_data["sermons"])
    
    return analytics_data, processed_sermon_ids

def update_time_grouping(time_grouping, video_id, sermon_data):
    """Update time-based groupings for a sermon."""
    publish_date = sermon_data.get("publish_date", "")
    
    try:
        # Handle different possible date formats
        if isinstance(publish_date, str):
            if publish_date.isdigit() and len(publish_date) == 8:
                # Format: YYYYMMDD
                year = int(publish_date[:4])
                month = int(publish_date[4:6])
            else:
                # Try ISO format
                date = datetime.fromisoformat(publish_date.replace('Z', '+00:00'))
                year = date.year
                month = date.month
        elif isinstance(publish_date, int):
            if publish_date > 19000000 and publish_date < 21000000:
                # Format: YYYYMMDD as integer
                year = publish_date // 10000
                month = (publish_date // 100) % 100
            else:
                # Unix timestamp
                date = datetime.fromtimestamp(publish_date)
                year = date.year
                month = date.month
        else:
            # Default to current date if format is unknown
            print(f"Unknown date format for sermon {video_id}: {publish_date}")
            return
        
        # Update year grouping
        if str(year) not in time_grouping["by_year"]:
            time_grouping["by_year"][str(year)] = []
        if video_id not in time_grouping["by_year"][str(year)]:
            time_grouping["by_year"][str(year)].append(video_id)
        
        # Update month grouping
        if str(month) not in time_grouping["by_month"]:
            time_grouping["by_month"][str(month)] = []
        if video_id not in time_grouping["by_month"][str(month)]:
            time_grouping["by_month"][str(month)].append(video_id)
        
        # Update year-month grouping
        year_month = f"{year}-{month:02d}"
        if year_month not in time_grouping["by_year_month"]:
            time_grouping["by_year_month"][year_month] = []
        if video_id not in time_grouping["by_year_month"][year_month]:
            time_grouping["by_year_month"][year_month].append(video_id)
            
    except Exception as e:
        print(f"Error processing date {publish_date} for sermon {video_id}: {e}")

async def generate_reference_files(reference_occurrences, sermon_data):
    """
    Generate or update individual reference files.
    Only updates references affected by this sermon.
    """
    # For each reference in this sermon
    for reference, occurrences in reference_occurrences.items():
        # Create a safe filename
        safe_reference = reference.replace(":", "_").replace(" ", "_")
        file_path = OUTPUT_DIR / "references" / f"{safe_reference}.json"
        
        # Check if file already exists
        existing_data = {"reference": reference, "occurrences": []}
        if file_path.exists():
            try:
                with open(file_path, 'r') as f:
                    existing_data = json.load(f)
            except json.JSONDecodeError:
                print(f"Error reading reference file {file_path}. Starting fresh.")
        
        # Add new occurrences
        for occurrence in occurrences:
            # Enhance with sermon metadata
            enriched_occurrence = {
                **occurrence,
                "sermon_title": sermon_data.get("title", "Unknown Sermon"),
                "url": f"https://www.youtube.com/watch?v={occurrence['sermon_id']}&t={int(occurrence['timestamp'])}",
                "channel": sermon_data.get("channel", "Unknown Channel"),
                "publishedAt": sermon_data.get("publish_date", "")
            }
            
            # Add to existing occurrences
            existing_data["occurrences"].append(enriched_occurrence)
        
        # Write updated file
        with open(file_path, 'w') as f:
            json.dump(existing_data, f, indent=2)

def generate_analytics_files(analytics_data, processed_sermon_ids=None):
    """
    Generate all the JSON files needed for the analytics dashboard.
    """
    print("Generating analytics JSON files...")
    
    # 1. Update summary with current timestamp
    analytics_data["summary"]["generated_at"] = datetime.now().isoformat()
    
    # 2. Write summary
    with open(OUTPUT_DIR / "summary.json", "w") as f:
        json.dump(analytics_data["summary"], f, indent=2)
    
    # 3. Write book references
    with open(OUTPUT_DIR / "books.json", "w") as f:
        json.dump(analytics_data["book_counts"], f, indent=2)
    
    # 4. Write chapter references (top 100)
    top_chapters = dict(Counter(analytics_data["chapter_counts"]).most_common(100))
    with open(OUTPUT_DIR / "chapters.json", "w") as f:
        json.dump(top_chapters, f, indent=2)
    
    # 5. Write verse references (top 100)
    top_verses = dict(Counter(analytics_data["verse_counts"]).most_common(100))
    with open(OUTPUT_DIR / "verses.json", "w") as f:
        json.dump(top_verses, f, indent=2)
    
    # 6. Write sermon details
    with open(OUTPUT_DIR / "sermons.json", "w") as f:
        json.dump(analytics_data["sermons"], f, indent=2)
    
    # 7. Write time grouping
    with open(OUTPUT_DIR / "time_grouping.json", "w") as f:
        json.dump(analytics_data["time_grouping"], f, indent=2)
    
    # 8. Write reference index (mapping of references to occurrence counts)
    reference_counts = {}
    
    # Count occurrences for each reference by checking files
    reference_files = Path(OUTPUT_DIR / "references").glob("*.json")
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
    
    with open(OUTPUT_DIR / "references_index.json", "w") as f:
        json.dump(reference_counts, f, indent=2)
    
    # 9. Update processed sermons list
    if processed_sermon_ids is not None:
        with open(OUTPUT_DIR / "processed_sermons.json", "w") as f:
            json.dump(processed_sermon_ids, f, indent=2)
    
    print("Analytics files generated successfully.")

async def main():
    """Main function to incrementally generate analytics data."""
    print(f"Starting incremental sermon analytics generation at {datetime.now().isoformat()}")
    
    # Create output directories
    setup_directory()
    
    # Load list of sermons we've already processed
    processed_sermon_ids = get_processed_sermon_ids()
    print(f"Found {len(processed_sermon_ids)} previously processed sermons")
    
    # Load existing analytics data
    analytics_data = load_existing_analytics()
    print("Loaded existing analytics data")
    
    # Load sermon metadata from files
    sermon_metadata = load_sermon_metadata_from_files()
    print(f"Loaded metadata for {len(sermon_metadata)} sermons from files")
    
    # If we already have sermon data loaded, use it to supplement metadata
    for video_id, sermon in analytics_data["sermons"].items():
        if video_id not in sermon_metadata:
            sermon_metadata[video_id] = sermon
    
    # Fetch list of all available sermons
    sermon_list = await fetch_sermon_list()
    all_sermon_ids = [sermon.get("video_id") for sermon in sermon_list if sermon.get("video_id")]
    print(f"Found {len(all_sermon_ids)} sermons in the API")
    
    # Process only new sermons
    analytics_data, processed_sermon_ids = await process_new_sermons(
        all_sermon_ids, processed_sermon_ids, analytics_data, sermon_metadata
    )
    
    # Generate all analytics files
    generate_analytics_files(analytics_data, processed_sermon_ids)
    
    print(f"Incremental sermon analytics generation completed at {datetime.now().isoformat()}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())