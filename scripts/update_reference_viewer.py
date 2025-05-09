#!/usr/bin/env python3
"""
Update Reference Viewer Script

This script updates reference-viewer.html to use the new external bible-explorer.js
file instead of the inline JavaScript.
"""

import re
import sys
import os
from pathlib import Path

def update_reference_viewer(file_path):
    """Update the reference-viewer.html file to use external JavaScript"""
    try:
        # Read the existing file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the inline script
        script_pattern = re.compile(
            r'<script>\s*\/\*\*\s*\*\s*Bible\s*Reference\s*Explorer.*?<\/script>',
            re.DOTALL
        )
        
        # Replace it with the external script reference
        new_script = """<script src="{{ '/assets/js/bible-explorer.js' | relative_url }}"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    BibleExplorer.init();
  });
</script>"""
        
        # Check if we can find the inline script
        match = script_pattern.search(content)
        if not match:
            print("Warning: Could not find the inline Bible Explorer script.")
            print("You may need to manually update reference-viewer.html to use:")
            print(new_script)
            return False
        
        # Replace the script
        updated_content = script_pattern.sub(new_script, content)
        
        # Write the updated file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(updated_content)
        
        print(f"Successfully updated {file_path}")
        return True
    
    except Exception as e:
        print(f"Error updating reference-viewer.html: {str(e)}")
        return False

def main():
    """Main function"""
    # Determine the reference-viewer.html path
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        # Try to find the file in the current directory and its parents
        current_dir = Path.cwd()
        file_path = None
        
        for path in [current_dir] + list(current_dir.parents):
            test_path = path / 'reference-viewer.html'
            if test_path.exists():
                file_path = str(test_path)
                break
        
        if not file_path:
            print("Error: Could not find reference-viewer.html")
            print("Please provide the path as an argument: python update_reference_viewer.py path/to/reference-viewer.html")
            return 1
    
    # Make sure the file exists
    if not os.path.isfile(file_path):
        print(f"Error: File not found: {file_path}")
        return 1
    
    # Update the file
    success = update_reference_viewer(file_path)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())