#!/usr/bin/env python3
"""
Process existing metadata from the API sermons endpoint.
This script extracts and formats metadata that already exists in the Pinecone database.
"""

import os
import json
import httpx
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

# Configuration
API_URL = os.environ.get("API_URL", "https://sermon-search-api-8fok.onrender.com")
OUTPUT_DIR = Path("_data/analytics")
SERMONS_FILE = OUTPUT_DIR / "sermons.json"

async def fetch_sermon_metadata_from_api():
    """
    Fetch sermon metadata from the existing API.
    """
    try:
        print(f"Fetching sermon metadata from {API_URL}/sermons")
        
        async with httpx.AsyncClient() as client:
            # Fetch the list of all sermons
            response = await client.get(f"{API_URL}/sermons", timeout=30)
            response.raise_for_status()
            sermons_data = response.json()
            
            if not sermons_data.get("sermons"):
                print("No sermons found in API response")
                return {}
                
            sermon_list = sermons_data.get("sermons", [])
            print(f"Found {len(sermon_list)} sermons in API response")
            
            # Process each sermon to get full metadata
            sermon_details = {}
            
            for sermon in sermon_list:
                video_id = sermon.get("video_id")
                if not video_id:
                    continue
                    
                # Extract existing metadata
                sermon_details[video_id] = {
                    "video_id": video_id,
                    "title": sermon.get("title", f"Sermon {video_id}"),
                    "publish_date": sermon.get("publish_date", ""),
                    "channel": sermon.get("channel", "Fellowship Church"),
                    "url": sermon.get("url", f"https://www.youtube.com/watch?v={video_id}")
                }
                
                # You could fetch more details if needed
                # For example, if the API has an endpoint for individual sermon details
                # This depends on what data is already in your Pinecone database
                
            return sermon_details
            
    except Exception as e:
        print(f"Error fetching sermon metadata from API: {e}")
        return {}

async def process_sermon_metadata():
    """
    Process sermon metadata from the API and save it for analytics.
    """
    try:
        # Ensure output directory exists
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        # Fetch metadata from API
        sermon_details = await fetch_sermon_metadata_from_api()
        
        if not sermon_details:
            print("No sermon metadata found. Using empty dictionary.")
            sermon_details = {}
        
        # Save sermon metadata
        with open(SERMONS_FILE, 'w') as f:
            json.dump(sermon_details, f, indent=2)
            
        print(f"Saved metadata for {len(sermon_details)} sermons to {SERMONS_FILE}")
        
    except Exception as e:
        print(f"Error processing sermon metadata: {e}")

if __name__ == "__main__":
    asyncio.run(process_sermon_metadata())