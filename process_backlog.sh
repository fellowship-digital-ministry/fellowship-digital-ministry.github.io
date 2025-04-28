#!/bin/bash
# This script processes the backlog of sermon data to generate complete analytics
# 
# Usage:
#   ./process_backlog.sh [--full]
#
# Options:
#   --full    Process with full detail (slower but more complete)

# Configuration
API_URL=${API_URL:-"https://sermon-search-api-8fok.onrender.com"}
FULL_MODE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --full)
      FULL_MODE=true
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

# Install required packages
echo "Installing required Python packages..."
python3 -m pip install httpx asyncio

# Create output directories
mkdir -p _data/analytics
mkdir -p assets/data/analytics
mkdir -p scripts

# Copy the backlog processor script to scripts directory
if [ ! -f "scripts/process_analytics_backlog.py" ]; then
  echo "Copying backlog processor script to scripts directory..."
  cat > scripts/process_analytics_backlog.py << 'EOF'
# Paste the content of analytics-backlog-handler here
EOF
fi

# Determine mode and run the script
if [ "$FULL_MODE" = true ]; then
  echo "Processing backlog in FULL mode..."
  python3 scripts/process_analytics_backlog.py
else
  echo "Processing backlog in FAST mode (use --full for complete processing)..."
  python3 scripts/process_analytics_backlog.py --fast
fi

echo "Backlog processing complete!"
echo "Analytics data is now available in _data/analytics and assets/data/analytics"