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
      throw new Error('No reference specified. Use ?ref=book_chapter_verse format.');
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
  } catch (error) {
    console.error('Error initializing reference viewer:', error);
    document.getElementById('loading-indicator').style.display = 'none';
    document.getElementById('error-message').textContent = error.message;
    document.getElementById('error-message').style.display = 'block';
  }
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
    const sermonDate = occurrences[0].sermon_date 
      ? new Date(occurrences[0].sermon_date * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        })
      : 'Date unknown';
    
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
      // Default to analytics page if no referrer
      window.location.href = 'analytics.html';
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
