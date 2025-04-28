#!/bin/bash
# Local script to generate sermon analytics data
# 
# Usage:
#   ./generate_analytics.sh [--force]
#
# Options:
#   --force  Force refresh all analytics data

# Configuration
API_URL=${API_URL:-"https://sermon-search-api-8fok.onrender.com"}
FORCE_REFRESH=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --force)
      FORCE_REFRESH=true
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

# Make sure Python is installed
if ! command -v python3 &> /dev/null; then
  echo "Error: Python 3 is required but not installed."
  exit 1
fi

# Make sure httpx and asyncio are installed
python3 -c "import httpx, asyncio" &> /dev/null
if [ $? -ne 0 ]; then
  echo "Installing required Python packages..."
  python3 -m pip install httpx asyncio
fi

# Create output directories
mkdir -p _data/analytics
mkdir -p assets/data/analytics

# If force refresh is enabled, delete existing analytics data
if [ "$FORCE_REFRESH" = true ]; then
  echo "Forcing full refresh of analytics data"
  rm -rf _data/analytics/*
  rm -rf assets/data/analytics/*
fi

# Run the analytics generator
echo "Generating sermon analytics data..."
echo "API URL: $API_URL"
echo "Force refresh: $FORCE_REFRESH"

# Export API_URL as environment variable
export API_URL

# Run the Python script
python3 scripts/enhanced_incremental_analytics.py

# Copy data from _data to assets for web access
echo "Copying data to assets directory..."
cp -r _data/analytics/* assets/data/analytics/

echo "Analytics generation complete!"
echo "Data is available in _data/analytics and assets/data/analytics"