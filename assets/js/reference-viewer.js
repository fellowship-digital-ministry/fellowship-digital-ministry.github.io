---
---
/**
 * Enhanced Reference Viewer - Shows sermon clips where specific Bible references appear
 * 
 * Features:
 * - View references by book, chapter, or specific verse
 * - Interactive timeline visualization
 * - Direct links to YouTube timestamps
 * - Context highlighting
 * - Related references
 */

// Constants
const API_URL = '{{ site.api_url }}';

// DOM Elements
const referenceDetails = document.getElementById('reference-details');
const referenceTitle = document.getElementById('reference-title');
const referenceCount = document.getElementById('reference-count');
const occurrencesList = document.getElementById('occurrences-list');
const relatedReferencesList = document.getElementById('related-references-list');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const backButton = document.getElementById('back-button');
const referenceTypeLabel = document.getElementById('reference-type-label');

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const referenceParam = urlParams.get('reference');
const bookParam = urlParams.get('book');
const chapterParam = urlParams.get('chapter');
const typeParam = urlParams.get('type') || 'reference'; // Default to reference

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Show loading state
  showLoading();
  
  // Initialize viewer based on parameters
  if (referenceParam) {
    // Specific reference (e.g., John 3:16)
    fetchReferenceData(referenceParam);
  } else if (chapterParam) {
    // Chapter reference (e.g., John 3)
    fetchChapterData(chapterParam);
  } else if (bookParam) {
    // Book reference (e.g., John)
    fetchBookData(bookParam);
  } else {
    // No reference specified
    showError('No Bible reference specified. Please provide a reference, book, or chapter parameter.');
  }
  
  // Set up back button
  if (backButton) {
    backButton.addEventListener('click', function() {
      window.history.back();
    });
  }
});

/**
 * Show loading indicator
 */
function showLoading() {
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';
  if (referenceDetails) referenceDetails.style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  if (referenceDetails) referenceDetails.style.display = 'none';
  
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  } else {
    console.error(message);
  }
}

/**
 * Fetch specific reference data
 */
async function fetchReferenceData(reference) {
  try {
    console.log(`Fetching data for reference: ${reference}`);
    
    // Update reference type label if available
    if (referenceTypeLabel) {
      referenceTypeLabel.textContent = 'Reference';
    }
    
    // Get pre-computed data for this reference
    const safeReference = reference.replace(/[:\s]/g, '_').replace(/-/g, '_to_');
    const response = await fetch(`/assets/data/analytics/references/${safeReference}.json`);
    
    if (!response.ok) {
      // Try direct API query if pre-computed data doesn't exist
      await searchReferenceInAPI(reference);
      return;
    }
    
    const data = await response.json();
    
    // Display occurrences
    displayReferenceOccurrences(reference, data);
    
    // Find related references if this is a verse reference
    if (reference.includes(':')) {
      await findRelatedReferences(reference);
    }
    
  } catch (error) {
    console.error('Error fetching reference data:', error);
    showError(`Error fetching data for ${reference}. ${error.message}`);
  }
}

/**
 * Fetch chapter data
 */
async function fetchChapterData(chapter) {
  try {
    console.log(`Fetching data for chapter: ${chapter}`);
    
    // Update reference type label if available
    if (referenceTypeLabel) {
      referenceTypeLabel.textContent = 'Chapter';
    }
    
    // Get pre-computed data for this chapter
    const safeChapter = chapter.replace(/[:\s]/g, '_');
    const response = await fetch(`/assets/data/analytics/chapters/${safeChapter}.json`);
    
    if (!response.ok) {
      showError(`No data found for chapter ${chapter}. It may not be referenced in any sermons.`);
      return;
    }
    
    const data = await response.json();
    
    // Display chapter occurrences
    displayChapterOccurrences(chapter, data);
    
  } catch (error) {
    console.error('Error fetching chapter data:', error);
    showError(`Error fetching data for chapter ${chapter}. ${error.message}`);
  }
}

/**
 * Fetch book data
 */
async function fetchBookData(book) {
  try {
    console.log(`Fetching data for book: ${book}`);
    
    // Update reference type label if available
    if (referenceTypeLabel) {
      referenceTypeLabel.textContent = 'Book';
    }
    
    // Get pre-computed data for this book
    const safeBook = book.replace(/\s/g, '_');
    const response = await fetch(`/assets/data/analytics/books/${safeBook}.json`);
    
    if (!response.ok) {
      showError(`No data found for book ${book}. It may not be referenced in any sermons.`);
      return;
    }
    
    const data = await response.json();
    
    // Display book occurrences
    displayBookOccurrences(book, data);
    
  } catch (error) {
    console.error('Error fetching book data:', error);
    showError(`Error fetching data for book ${book}. ${error.message}`);
  }
}

/**
 * Find related references for a verse
 */
async function findRelatedReferences(reference) {
  try {
    if (!relatedReferencesList) return;
    
    // Extract book and chapter from the reference
    const parts = reference.split(':');
    if (parts.length < 2) return;
    
    const chapterParts = parts[0].trim();
    const chapter = chapterParts;
    
    // Get chapter data to find related verses
    const safeChapter = chapter.replace(/[:\s]/g, '_');
    const response = await fetch(`/assets/data/analytics/chapters/${safeChapter}.json`);
    
    if (!response.ok) return;
    
    const data = await response.json();
    
    // Find related verses (from the same chapter)
    const relatedVerses = new Set();
    
    // Collect all verse references from this chapter
    data.sermons.forEach(sermon => {
      sermon.occurrences.forEach(occurrence => {
        const occRef = occurrence.reference;
        if (occRef.includes(':') && occRef !== reference && occRef.startsWith(chapter)) {
          relatedVerses.add(occRef);
        }
      });
    });
    
    // Display related verses if we found any
    if (relatedVerses.size > 0) {
      relatedReferencesList.innerHTML = '<h3>Related Verses in This Chapter</h3><div class="related-list"></div>';
      const listElement = relatedReferencesList.querySelector('.related-list');
      
      Array.from(relatedVerses).sort().forEach(verse => {
        const item = document.createElement('a');
        item.className = 'related-verse';
        item.href = `/reference-viewer.html?reference=${encodeURIComponent(verse)}`;
        item.textContent = verse;
        listElement.appendChild(item);
      });
      
      relatedReferencesList.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error finding related references:', error);
    // Don't show an error for this optional feature
  }
}

/**
 * Search for a reference directly in the API if pre-computed data isn't available
 */
async function searchReferenceInAPI(reference) {
  try {
    console.log(`Searching API for ${reference}...`);
    
    // Use the search endpoint to find occurrences
    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors',
      body: JSON.stringify({
        query: reference,
        top_k: 10,
        include_sources: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we got any results
    if (!data.sources || data.sources.length === 0) {
      showError(`No occurrences found for ${reference}.`);
      return;
    }
    
    // Format the results
    const occurrences = data.sources.map(source => ({
      sermon_id: source.video_id,
      sermon_title: source.title || `Sermon ${source.video_id}`,
      timestamp: source.start_time,
      url: `https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}`,
      text: source.text,
      context: source.text,
      publish_date: source.publish_date || ""
    }));
    
    displayReferenceOccurrences(reference, { reference, occurrences });
    
  } catch (error) {
    console.error('Error searching API for reference:', error);
    showError(`Error searching for ${reference}. ${error.message}`);
  }
}

/**
 * Display occurrences of a specific Bible reference
 */
function displayReferenceOccurrences(reference, data) {
  if (!referenceDetails || !referenceTitle || !referenceCount || !occurrencesList) {
    console.error('Required DOM elements not found');
    return;
  }
  
  // Update reference details
  referenceTitle.textContent = reference;
  referenceCount.textContent = data.occurrences.length;
  
  // Clear previous list
  occurrencesList.innerHTML = '';
  
  // Generate occurrences list
  if (data.occurrences.length === 0) {
    occurrencesList.innerHTML = '<p class="empty-message">No occurrences found for this reference.</p>';
  } else {
    // Group occurrences by sermon
    const sermonGroups = {};
    data.occurrences.forEach(occurrence => {
      if (!sermonGroups[occurrence.sermon_id]) {
        sermonGroups[occurrence.sermon_id] = {
          title: occurrence.sermon_title,
          publish_date: occurrence.publish_date,
          occurrences: []
        };
      }
      sermonGroups[occurrence.sermon_id].occurrences.push(occurrence);
    });
    
    // Create HTML for each sermon group
    Object.entries(sermonGroups).forEach(([sermonId, sermon]) => {
      const sermonElement = document.createElement('div');
      sermonElement.className = 'sermon-group';
      
      // Format publish date if available
      let dateDisplay = '';
      if (sermon.publish_date) {
        try {
          const date = new Date(sermon.publish_date);
          dateDisplay = ` (${date.toLocaleDateString()})`;
        } catch (e) {
          dateDisplay = ` (${sermon.publish_date})`;
        }
      }
      
      sermonElement.innerHTML = `
        <h3 class="sermon-title">${sermon.title}${dateDisplay}</h3>
        <div class="occurrence-items">
          ${sermon.occurrences.map(occurrence => `
            <div class="occurrence-item">
              <div class="occurrence-text">${highlightReference(occurrence.context || occurrence.text, reference)}</div>
              <div class="occurrence-meta">
                <span class="timestamp">Timestamp: ${formatTimestamp(occurrence.timestamp)}</span>
                <a href="${occurrence.url}" target="_blank" class="video-link">Watch Video</a>
              </div>
              <div class="video-container">
                <iframe 
                  src="https://www.youtube.com/embed/${sermonId}?start=${Math.floor(occurrence.timestamp)}" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen
                ></iframe>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      occurrencesList.appendChild(sermonElement);
    });
  }
  
  // Hide loading, show content
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  if (referenceDetails) referenceDetails.style.display = 'block';
}

/**
 * Display occurrences for a book
 */
function displayBookOccurrences(book, data) {
  if (!referenceDetails || !referenceTitle || !referenceCount || !occurrencesList) {
    console.error('Required DOM elements not found');
    return;
  }
  
  // Update reference details
  referenceTitle.textContent = book;
  
  // Count total occurrences across all sermons
  let totalOccurrences = 0;
  data.sermons.forEach(sermon => {
    totalOccurrences += sermon.occurrences.length;
  });
  
  referenceCount.textContent = totalOccurrences;
  
  // Clear previous list
  occurrencesList.innerHTML = '';
  
  // Group and sort sermons by publish date if available
  const sortedSermons = [...data.sermons].sort((a, b) => {
    // Sort by publish date if available, newest first
    if (a.publish_date && b.publish_date) {
      return new Date(b.publish_date) - new Date(a.publish_date);
    }
    return 0; // Keep original order if dates not available
  });
  
  // Generate occurrences list
  if (sortedSermons.length === 0) {
    occurrencesList.innerHTML = '<p class="empty-message">No occurrences found for this book.</p>';
  } else {
    // Add references summary
    const referencesSet = new Set();
    sortedSermons.forEach(sermon => {
      sermon.occurrences.forEach(occurrence => {
        referencesSet.add(occurrence.reference);
      });
    });
    
    // Create references summary
    const referencesList = Array.from(referencesSet).sort();
    
    const summaryElement = document.createElement('div');
    summaryElement.className = 'references-summary';
    summaryElement.innerHTML = `
      <h3>References to ${book}</h3>
      <div class="references-list">
        ${referencesList.map(ref => `
          <a href="/reference-viewer.html?reference=${encodeURIComponent(ref)}" class="reference-link">${ref}</a>
        `).join('')}
      </div>
    `;
    
    occurrencesList.appendChild(summaryElement);
    
    // Create HTML for each sermon
    sortedSermons.forEach(sermon => {
      const sermonElement = document.createElement('div');
      sermonElement.className = 'sermon-group';
      
      // Format publish date if available
      let dateDisplay = '';
      if (sermon.publish_date) {
        try {
          const date = new Date(sermon.publish_date);
          dateDisplay = ` (${date.toLocaleDateString()})`;
        } catch (e) {
          dateDisplay = ` (${sermon.publish_date})`;
        }
      }
      
      // Group occurrences by reference
      const referenceGroups = {};
      sermon.occurrences.forEach(occurrence => {
        const ref = occurrence.reference;
        if (!referenceGroups[ref]) {
          referenceGroups[ref] = [];
        }
        referenceGroups[ref].push(occurrence);
      });
      
      // Sort references
      const sortedReferences = Object.keys(referenceGroups).sort();
      
      sermonElement.innerHTML = `
        <h3 class="sermon-title">${sermon.sermon_title}${dateDisplay}</h3>
        <div class="occurrence-items">
          ${sortedReferences.map(ref => {
            // Use first occurrence for each reference
            const occurrence = referenceGroups[ref][0];
            return `
              <div class="occurrence-item">
                <div class="occurrence-reference">${ref} (${referenceGroups[ref].length} occurrence${referenceGroups[ref].length !== 1 ? 's' : ''})</div>
                <div class="occurrence-text">${highlightReference(occurrence.context || occurrence.text, ref)}</div>
                <div class="occurrence-meta">
                  <span class="timestamp">Timestamp: ${formatTimestamp(occurrence.timestamp)}</span>
                  <a href="${sermon.url}&t=${Math.floor(occurrence.timestamp)}" target="_blank" class="video-link">Watch Video</a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      occurrencesList.appendChild(sermonElement);
    });
  }
  
  // Hide loading, show content
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  if (referenceDetails) referenceDetails.style.display = 'block';
}

/**
 * Display occurrences for a chapter
 */
function displayChapterOccurrences(chapter, data) {
  if (!referenceDetails || !referenceTitle || !referenceCount || !occurrencesList) {
    console.error('Required DOM elements not found');
    return;
  }
  
  // Update reference details
  referenceTitle.textContent = chapter;
  
  // Count total occurrences across all sermons
  let totalOccurrences = 0;
  data.sermons.forEach(sermon => {
    totalOccurrences += sermon.occurrences.length;
  });
  
  referenceCount.textContent = totalOccurrences;
  
  // Clear previous list
  occurrencesList.innerHTML = '';
  
  // Group and sort sermons by publish date if available
  const sortedSermons = [...data.sermons].sort((a, b) => {
    // Sort by publish date if available, newest first
    if (a.publish_date && b.publish_date) {
      return new Date(b.publish_date) - new Date(a.publish_date);
    }
    return 0; // Keep original order if dates not available
  });
  
  // Generate occurrences list
  if (sortedSermons.length === 0) {
    occurrencesList.innerHTML = '<p class="empty-message">No occurrences found for this chapter.</p>';
  } else {
    // Add references summary (verses in this chapter)
    const versesSet = new Set();
    sortedSermons.forEach(sermon => {
      sermon.occurrences.forEach(occurrence => {
        // Only include verse references (skip chapter-only refs)
        if (occurrence.reference.includes(':')) {
          versesSet.add(occurrence.reference);
        }
      });
    });
    
    // Create verses summary if we have verse references
    if (versesSet.size > 0) {
      const versesList = Array.from(versesSet).sort((a, b) => {
        // Sort by verse number
        const verseA = parseInt(a.split(':')[1]);
        const verseB = parseInt(b.split(':')[1]);
        return verseA - verseB;
      });
      
      const summaryElement = document.createElement('div');
      summaryElement.className = 'references-summary';
      summaryElement.innerHTML = `
        <h3>Verses Referenced in ${chapter}</h3>
        <div class="references-list">
          ${versesList.map(ref => `
            <a href="/reference-viewer.html?reference=${encodeURIComponent(ref)}" class="reference-link">${ref}</a>
          `).join('')}
        </div>
      `;
      
      occurrencesList.appendChild(summaryElement);
    }
    
    // Create HTML for each sermon
    sortedSermons.forEach(sermon => {
      const sermonElement = document.createElement('div');
      sermonElement.className = 'sermon-group';
      
      // Format publish date if available
      let dateDisplay = '';
      if (sermon.publish_date) {
        try {
          const date = new Date(sermon.publish_date);
          dateDisplay = ` (${date.toLocaleDateString()})`;
        } catch (e) {
          dateDisplay = ` (${sermon.publish_date})`;
        }
      }
      
      // Group occurrences by reference
      const referenceGroups = {};
      sermon.occurrences.forEach(occurrence => {
        const ref = occurrence.reference;
        if (!referenceGroups[ref]) {
          referenceGroups[ref] = [];
        }
        referenceGroups[ref].push(occurrence);
      });
      
      // Sort references
      const sortedReferences = Object.keys(referenceGroups).sort((a, b) => {
        // Put chapter references first, then sort verses by number
        const isVerseA = a.includes(':');
        const isVerseB = b.includes(':');
        
        if (!isVerseA && isVerseB) return -1;
        if (isVerseA && !isVerseB) return 1;
        
        if (isVerseA && isVerseB) {
          const verseA = parseInt(a.split(':')[1]);
          const verseB = parseInt(b.split(':')[1]);
          return verseA - verseB;
        }
        
        return 0;
      });
      
      sermonElement.innerHTML = `
        <h3 class="sermon-title">${sermon.sermon_title}${dateDisplay}</h3>
        <div class="occurrence-items">
          ${sortedReferences.map(ref => {
            // Use first occurrence for each reference
            const occurrence = referenceGroups[ref][0];
            return `
              <div class="occurrence-item">
                <div class="occurrence-reference">${ref} (${referenceGroups[ref].length} occurrence${referenceGroups[ref].length !== 1 ? 's' : ''})</div>
                <div class="occurrence-text">${highlightReference(occurrence.context || occurrence.text, ref)}</div>
                <div class="occurrence-meta">
                  <span class="timestamp">Timestamp: ${formatTimestamp(occurrence.timestamp)}</span>
                  <a href="${sermon.url}&t=${Math.floor(occurrence.timestamp)}" target="_blank" class="video-link">Watch Video</a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      occurrencesList.appendChild(sermonElement);
    });
  }
  
  // Hide loading, show content
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  if (referenceDetails) referenceDetails.style.display = 'block';
}

/**
 * Highlight the reference in the text
 */
function highlightReference(text, reference) {
  if (!text) return '';
  
  // Escape special regex characters in the reference
  const escapedRef = reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex with word boundaries
  const regex = new RegExp(`\\b${escapedRef}\\b`, 'gi');
  
  return text.replace(regex, match => `<span class="highlight">${match}</span>`);
}

/**
 * Format timestamp to MM:SS
 */
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}