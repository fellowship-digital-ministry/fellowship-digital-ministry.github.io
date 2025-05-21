/**
 * Bible Reference Viewer
 * This script powers the Bible reference viewer interface for Jekyll
 */

// Global configuration
const API_BASE_URL = window.location.hostname === 'fellowship-digital-ministry.github.io' 
  ? 'https://sermon-search-api-8fok.onrender.com' // Production API domain
  : 'http://localhost:8000';

/**
 * Initialize the reference viewer
 */
document.addEventListener('DOMContentLoaded', function() {
  initializeReferenceViewer();
});

/**
 * Main initialization function
 */
async function initializeReferenceViewer() {
  try {
    // Show loading state
    document.getElementById('loading-indicator').style.display = 'block';
    document.getElementById('reference-details').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    
    // Get reference ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const referenceId = urlParams.get('ref');
    
    if (!referenceId) {
      // Instead of throwing an error, show a helpful guide
      showReferenceGuide();
      return;
    }
    
    // Fetch reference data
    const referenceData = await fetchReferenceData(referenceId);
    
    // Display the reference details
    displayReferenceDetails(referenceData);
    
    // Initialize back button
    initializeBackButton();
    
    // Add accessibility enhancements
    enhanceAccessibility();
    
    // Hide loading state, show content
    document.getElementById('loading-indicator').style.display = 'none';
    document.getElementById('reference-details').style.display = 'block';
    
    // Dispatch event that reference is loaded (for HCI enhancements)
    document.dispatchEvent(new Event('referenceLoaded'));
  } catch (error) {
    console.error('Error initializing reference viewer:', error);
    document.getElementById('loading-indicator').style.display = 'none';
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').style.display = 'block';
  }
}

/**
 * Show a helpful guide when no reference is specified
 */
function showReferenceGuide() {
  // Hide loading indicator
  document.getElementById('loading-indicator').style.display = 'none';
  
  // Create guide content
  const guideHTML = `
    <div class="reference-guide">
      <h2>Bible Reference Viewer</h2>
      <p class="guide-intro">This tool allows you to explore Bible references mentioned in sermons.</p>
      
      <div class="guide-section">
        <h3>How to Use This Page</h3>
        <p>Add a <code>?ref=</code> parameter to the URL in one of these formats:</p>
        <ul>
          <li><strong>Book only:</strong> <code>?ref=John</code> - Shows all references to the book of John</li>
          <li><strong>Book and chapter:</strong> <code>?ref=John_3</code> - Shows all references to John chapter 3</li>
          <li><strong>Specific verse:</strong> <code>?ref=John_3_16</code> - Shows all references to John 3:16</li>
        </ul>
        <p>Note: Use underscores (_) to separate book, chapter, and verse.</p>
      </div>
      
      <div class="guide-section">
        <h3>Example References</h3>
        <div class="example-links">
          <a href="?ref=John_3_16" class="example-link">John 3:16</a>
          <a href="?ref=Romans_8" class="example-link">Romans 8</a>
          <a href="?ref=Psalms_23" class="example-link">Psalms 23</a>
          <a href="?ref=Genesis_1_1" class="example-link">Genesis 1:1</a>
          <a href="?ref=Matthew_5" class="example-link">Matthew 5</a>
        </div>
      </div>
      
      <div class="guide-section">
        <h3>Popular Books</h3>
        <div class="example-links">
          <a href="?ref=Genesis" class="example-link">Genesis</a>
          <a href="?ref=Exodus" class="example-link">Exodus</a>
          <a href="?ref=Psalms" class="example-link">Psalms</a>
          <a href="?ref=Proverbs" class="example-link">Proverbs</a>
          <a href="?ref=Isaiah" class="example-link">Isaiah</a>
          <a href="?ref=Matthew" class="example-link">Matthew</a>
          <a href="?ref=John" class="example-link">John</a>
          <a href="?ref=Romans" class="example-link">Romans</a>
          <a href="?ref=Revelation" class="example-link">Revelation</a>
        </div>
      </div>
      
      <div class="guide-footer">
        <a href="index.html" class="back-to-analytics">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
          Back to Analytics
        </a>
      </div>
    </div>
  `;
  
  // Display the guide
  const errorMessage = document.getElementById('error-message');
  errorMessage.innerHTML = guideHTML;
  errorMessage.style.display = 'block';
  
  // Add styles for the guide
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .reference-guide {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .guide-intro {
      font-size: 1.1rem;
      color: #555;
      margin-bottom: 1.5rem;
    }
    
    .guide-section {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #eee;
    }
    
    .guide-section:last-child {
      border-bottom: none;
    }
    
    .guide-section h3 {
      color: var(--color-primary);
      margin-bottom: 1rem;
    }
    
    .guide-section code {
      background-color: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: monospace;
    }
    
    .example-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    
    .example-link {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: #f0f7ff;
      border: 1px solid #d0e3ff;
      border-radius: 4px;
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .example-link:hover {
      background-color: #e0f0ff;
      transform: translateY(-2px);
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .guide-footer {
      margin-top: 2rem;
      text-align: center;
    }
    
    .back-to-analytics {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background-color: #f5f5f5;
      border-radius: 4px;
      color: #333;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .back-to-analytics:hover {
      background-color: #e5e5e5;
    }
  `;
  document.head.appendChild(styleElement);
}

/**
 * Fetch reference data from the API
 */
async function fetchReferenceData(referenceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/bible/references/${referenceId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching reference data:', error);
    throw new Error(`Failed to fetch reference data: ${error.message}`);
  }
}

/**
 * Display reference details in the UI
 */
function displayReferenceDetails(data) {
  // Set reference title and metadata
  document.getElementById('reference-title').textContent = data.display_text;
  document.getElementById('reference-count').textContent = data.total_occurrences;
  
  // Determine reference type label (Book, Chapter, or Verse)
  let referenceType = 'Book';
  if (data.verse !== null) {
    referenceType = 'Verse';
  } else if (data.chapter !== null) {
    referenceType = 'Chapter';
  }
  document.getElementById('reference-type-label').textContent = referenceType;
  
  // Display occurrences
  displayOccurrences(data);
  
  // Display related references if available
  if (data.related_references && data.related_references.length > 0) {
    displayRelatedReferences(data.related_references);
  }
  
  // Set page title
  document.title = `${data.display_text} - Bible Reference Viewer`;
}

/**
 * Display occurrences grouped by sermon
 */
function displayOccurrences(data) {
  const container = document.getElementById('occurrences-list');
  container.innerHTML = ''; // Clear existing content
  
  // Check if we have occurrences to display
  if (Object.keys(data.occurrences_by_sermon).length === 0) {
    container.innerHTML = `
      <div class="empty-message">
        No occurrences found for this reference.
      </div>
    `;
    return;
  }
  
  // Sort sermons by date if available
  const sermonEntries = Object.entries(data.occurrences_by_sermon).map(([videoId, occurrences]) => {
    // Find the sermon date from the first occurrence
    const sermonDate = occurrences[0].sermon_date;
    return {
      videoId,
      occurrences,
      date: sermonDate ? new Date(sermonDate * 1000) : new Date(0) // Default to epoch if no date
    };
  });
  
  // Sort by date, most recent first
  sermonEntries.sort((a, b) => b.date - a.date);
  
  // Create a group for each sermon
  sermonEntries.forEach(entry => {
    const { videoId, occurrences } = entry;
    
    // Get sermon title from the first occurrence
    const sermonTitle = occurrences[0].sermon_title || `Sermon (${videoId})`;
    const sermonDate = formatSermonDate(occurrences[0].publish_date || occurrences[0].sermon_date);
    
    // Create sermon group container
    const sermonGroup = document.createElement('div');
    sermonGroup.className = 'sermon-group';
    
    // Create sermon title header
    const titleElement = document.createElement('h3');
    titleElement.className = 'sermon-title';
    titleElement.innerHTML = `${sermonTitle} <small>(${sermonDate})</small>`;
    sermonGroup.appendChild(titleElement);
    
    // Create container for occurrence items
    const occurrenceItems = document.createElement('div');
    occurrenceItems.className = 'occurrence-items';
    
    // Add each occurrence
    occurrences.forEach(occurrence => {
      // Format the timestamp for display
      const minutes = Math.floor(occurrence.start_time / 60);
      const seconds = Math.floor(occurrence.start_time % 60);
      const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Create occurrence item
      const occurrenceItem = document.createElement('div');
      occurrenceItem.className = 'occurrence-item';
      
      // Format the reference text
      const referenceText = occurrence.reference_text;
      
      // Highlight the reference in the context
      const context = highlightReference(occurrence.context, referenceText);
      
      // Build the occurrence item content
      occurrenceItem.innerHTML = `
        <div class="occurrence-reference">${referenceText}</div>
        <div class="occurrence-text">${context}</div>
        <div class="occurrence-meta">
          <span class="timestamp">Timestamp: ${formattedTime}</span>
          <a href="${occurrence.url}" target="_blank" class="video-link" aria-label="Watch video segment at ${formattedTime}">
            Watch Video Segment
          </a>
        </div>
      `;
      
      occurrenceItems.appendChild(occurrenceItem);
    });
    
    sermonGroup.appendChild(occurrenceItems);
    container.appendChild(sermonGroup);
  });
}

/**
 * Display related references section
 */
function displayRelatedReferences(relatedReferences) {
  const container = document.getElementById('related-references-list');
  container.style.display = 'block';
  container.innerHTML = ''; // Clear existing content
  
  // Create heading
  const heading = document.createElement('h3');
  heading.textContent = 'Related Verses';
  container.appendChild(heading);
  
  // Create description
  const description = document.createElement('p');
  description.textContent = 'Other verses from the same chapter that are referenced in sermons:';
  container.appendChild(description);
  
  // Create related list
  const relatedList = document.createElement('div');
  relatedList.className = 'related-list';
  
  // Add each related reference
  relatedReferences.forEach(related => {
    const relatedItem = document.createElement('a');
    relatedItem.className = 'related-verse';
    relatedItem.href = `reference-viewer.html?ref=${related.book}_${related.chapter}_${related.verse}`;
    relatedItem.textContent = `${related.reference_text} (${related.count})`;
    relatedItem.setAttribute('aria-label', `View ${related.count} occurrences of ${related.reference_text}`);
    
    relatedList.appendChild(relatedItem);
  });
  
  container.appendChild(relatedList);
}

/**
 * Highlight reference text within context
 */
function highlightReference(context, reference) {
  if (!context) return '';
  
  // Clean the reference text to create a safe regex pattern
  // Convert potential book_chapter:verse format to readable form
  const cleanRef = reference.replace(/_/g, ' ').replace(/(\d+):(\d+)/, '$1:$2');
  
  // Try to find exact reference in context
  let highlightedText = context;
  
  try {
    // Create a pattern that handles variations in reference citation
    // This handles 1 John 3:16, I John 3:16, First John 3:16, etc.
    const refParts = cleanRef.split(' ');
    let patternParts = [];
    
    // Handle book name variations
    if (refParts[0].match(/^[123]$/)) {
      // For books like 1 John, 2 Peter, 3 John
      patternParts.push(`(${refParts[0]}|I|II|III|First|Second|Third)`);
      patternParts.push(refParts[1]);
      
      // Add chapter and verse if present
      if (refParts.length > 2) {
        patternParts = patternParts.concat(refParts.slice(2));
      }
    } else {
      // Regular book names
      patternParts = refParts;
    }
    
    // Create the final pattern
    const pattern = patternParts.join('\\s+');
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    // Apply highlighting
    highlightedText = context.replace(regex, '<span class="highlight">$1</span>');
    
    // If no highlight was applied, try a more generic approach for implicit references
    if (highlightedText === context) {
      // Try chapter:verse format
      const chapterVerseMatch = cleanRef.match(/(\d+):(\d+)/);
      if (chapterVerseMatch) {
        const chapterVerse = chapterVerseMatch[0];
        highlightedText = context.replace(
          new RegExp(`(${chapterVerse})`, 'g'), 
          '<span class="highlight">$1</span>'
        );
      }
      
      // If still no highlight and we have a book and chapter
      if (highlightedText === context && refParts.length >= 2) {
        // Try just highlighting the chapter number
        const chapterPattern = `\\b${refParts[refParts.length - 1]}\\b`;
        highlightedText = context.replace(
          new RegExp(chapterPattern, 'g'),
          '<span class="highlight">$&</span>'
        );
      }
    }
  } catch (e) {
    console.error('Error applying highlight:', e);
    // Return unhighlighted text if regex fails
    return context;
  }
  
  return highlightedText;
}

/**
 * Initialize back button behavior
 */
function initializeBackButton() {
  const backButton = document.getElementById('back-button');
  
  backButton.addEventListener('click', function(event) {
    event.preventDefault();
    
    // Check if we have a referrer from the same site
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
      window.history.back();
    } else {
      // Default to home page if no referrer
      window.location.href = 'index.html';
    }
  });
}

/**
 * Enhance accessibility features
 */
function enhanceAccessibility() {
  // Add keyboard navigation for occurrence items
  const occurrenceItems = document.querySelectorAll('.occurrence-item');
  occurrenceItems.forEach(item => {
    // Make items focusable
    item.setAttribute('tabindex', '0');
    
    // Add keyboard event listener
    item.addEventListener('keydown', function(e) {
      // If Enter or Space is pressed, trigger the video link
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const videoLink = this.querySelector('.video-link');
        if (videoLink) {
          videoLink.click();
        }
      }
    });
  });
  
  // Add ARIA roles for better screen reader support
  document.getElementById('occurrences-list').setAttribute('role', 'region');
  document.getElementById('occurrences-list').setAttribute('aria-label', 'Scripture references in sermons');
  
  if (document.getElementById('related-references-list').style.display !== 'none') {
    document.getElementById('related-references-list').setAttribute('role', 'navigation');
    document.getElementById('related-references-list').setAttribute('aria-label', 'Related Bible references');
  }
}

/**
 * Format a book name for display (convert underscores to spaces)
 */
function formatBookName(bookName) {
  return bookName.replace(/_/g, ' ');
}

/**
 * Format sermon date from various formats
 */
function formatSermonDate(dateStr) {
  if (!dateStr) return 'Date unknown';
  
  try {
    // Handle YYYYMMDD format
    if (typeof dateStr === 'number' || (typeof dateStr === 'string' && /^\d{8}$/.test(dateStr))) {
      const yearStr = String(dateStr).substring(0, 4);
      const monthStr = String(dateStr).substring(4, 6);
      const dayStr = String(dateStr).substring(6, 8);
      
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1;
      const day = parseInt(dayStr);
      
      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) return 'Date unknown';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // Handle ISO date strings (YYYY-MM-DD)
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Date unknown';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // Handle timestamp (seconds since epoch)
    if (typeof dateStr === 'number') {
      const date = new Date(dateStr * 1000);
      if (isNaN(date.getTime())) return 'Date unknown';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    return typeof dateStr === 'string' ? dateStr : 'Date unknown';
  } catch (e) {
    console.error(`Error parsing date: ${dateStr}`, e);
    return 'Date unknown';
  }
}
