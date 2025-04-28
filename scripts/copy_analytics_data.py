#!/usr/bin/env python3
"""
Copy pre-computed analytics data to the assets directory for GitHub Pages access.

This script copies JSON files from _data/analytics to assets/data/analytics,
making them accessible via Jekyll's static site serving.
"""

import os
import shutil
import json
from pathlib import Path

# Source and destination directories
SOURCE_DIR = Path("_data/analytics")
DEST_DIR = Path("assets/data/analytics")

def setup_directories():
    """Create destination directory if it doesn't exist."""
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create references subdirectory
    (DEST_DIR / "references").mkdir(exist_ok=True)

def copy_json_files():
    """Copy all JSON files from source to destination."""
    # Copy main analytics files
    for json_file in SOURCE_DIR.glob("*.json"):
        if json_file.name != "processed_sermons.json":  # Skip internal tracking file
            dest_file = DEST_DIR / json_file.name
            print(f"Copying {json_file} to {dest_file}")
            shutil.copy2(json_file, dest_file)
    
    # Copy reference files
    ref_source_dir = SOURCE_DIR / "references"
    ref_dest_dir = DEST_DIR / "references"
    
    if ref_source_dir.exists():
        for json_file in ref_source_dir.glob("*.json"):
            dest_file = ref_dest_dir / json_file.name
            print(f"Copying {json_file} to {dest_file}")
            shutil.copy2(json_file, dest_file)

def create_sample_data():
    """Create sample data if no real data exists yet."""
    if not SOURCE_DIR.exists() or not any(SOURCE_DIR.glob("*.json")):
        print("No analytics data found. Creating sample data.")
        
        # Create source directory
        SOURCE_DIR.mkdir(parents=True, exist_ok=True)
        (SOURCE_DIR / "references").mkdir(exist_ok=True)
        
        # Create sample summary file
        summary = {
            "total_sermons": 5,
            "total_chunks": 500,
            "total_references": 150,
            "top_books": {
                "John": 40,
                "Romans": 35,
                "Matthew": 25,
                "Psalms": 20,
                "1 Corinthians": 15
            },
            "testament_distribution": {
                "Old Testament": 60,
                "New Testament": 90
            }
        }
        
        with open(SOURCE_DIR / "summary.json", "w") as f:
            json.dump(summary, f, indent=2)
            
        # Create sample books data
        books = {
            "John": 40,
            "Romans": 35,
            "Matthew": 25,
            "Psalms": 20,
            "1 Corinthians": 15,
            "Genesis": 10,
            "Revelation": 5
        }
        
        with open(SOURCE_DIR / "books.json", "w") as f:
            json.dump(books, f, indent=2)
            
        # Create sample chapters data
        chapters = {
            "John 3": 15,
            "Romans 8": 12,
            "John 1": 10,
            "Matthew 5": 8,
            "Psalms 23": 7
        }
        
        with open(SOURCE_DIR / "chapters.json", "w") as f:
            json.dump(chapters, f, indent=2)
            
        # Create sample verses data
        verses = {
            "John 3:16": 8,
            "Romans 8:28": 6,
            "Psalms 23:1": 4,
            "Matthew 5:16": 3,
            "John 1:1": 2
        }
        
        with open(SOURCE_DIR / "verses.json", "w") as f:
            json.dump(verses, f, indent=2)
            
        # Create sample sermons data
        sermons = {
            "ABC123": {
                "video_id": "ABC123",
                "title": "Sample Sermon 1",
                "publish_date": "2024-04-01",
                "channel": "Fellowship Church",
                "url": "https://www.youtube.com/watch?v=ABC123"
            },
            "DEF456": {
                "video_id": "DEF456",
                "title": "Sample Sermon 2",
                "publish_date": "2024-03-25",
                "channel": "Fellowship Church",
                "url": "https://www.youtube.com/watch?v=DEF456"
            }
        }
        
        with open(SOURCE_DIR / "sermons.json", "w") as f:
            json.dump(sermons, f, indent=2)
            
        # Create sample time grouping data
        time_grouping = {
            "by_year": {
                "2024": ["ABC123", "DEF456"]
            },
            "by_month": {
                "3": ["DEF456"],
                "4": ["ABC123"]
            },
            "by_year_month": {
                "2024-03": ["DEF456"],
                "2024-04": ["ABC123"]
            }
        }
        
        with open(SOURCE_DIR / "time_grouping.json", "w") as f:
            json.dump(time_grouping, f, indent=2)
            
        # Create sample reference file
        john_3_16 = {
            "reference": "John 3:16",
            "occurrences": [
                {
                    "sermon_id": "ABC123",
                    "sermon_title": "Sample Sermon 1",
                    "timestamp": 1200,
                    "url": "https://www.youtube.com/watch?v=ABC123&t=1200",
                    "text": "As we see in John 3:16, 'For God so loved the world...'",
                    "channel": "Fellowship Church",
                    "publishedAt": "2024-04-01"
                }
            ]
        }
        
        with open(SOURCE_DIR / "references" / "John_3_16.json", "w") as f:
            json.dump(john_3_16, f, indent=2)

def main():
    """Main function to copy analytics data."""
    print("Starting analytics data copy process...")
    
    # Create sample data if needed
    create_sample_data()
    
    # Ensure directories exist
    setup_directories()
    
    # Copy all JSON files
    copy_json_files()
    
    print("Analytics data copy completed successfully.")

if __name__ == "__main__":
    main()