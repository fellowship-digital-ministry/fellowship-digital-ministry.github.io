---
---
/**
 * Reference Viewer - Shows sermon videos where specific Bible references appear
 */

// Constants
const API_URL = '{{ site.api_url }}';

// DOM Elements
const referenceDetails = document.getElementById('reference-details');
const referenceTitle = document.getElementById('reference-title');
const referenceCount = document.getElementById('reference-count');
const occurrencesList = document.getElementById('occurrences-list');
const loadingIndicator = document.getElementById('loading-indicator');
const errorMessage = document.getElementById('error-message');
const backButton = document.getElementById('back-button');

// Get reference from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const referenceParam = urlParams.get('reference');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Show loading state
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';
  if (referenceDetails) referenceDetails.style.display = 'none';
  
  // Initialize with reference from URL if available
  if (referenceParam) {
    fetchReferenceOccurrences(referenceParam);
  } else {
    showError('No Bible reference specified.');
  }
  
  // Set up back button
  if (backButton) {
    backButton.addEventListener('click', function() {
      window.history.back();
    });
  }
});

/**
 * Fetch occurrences of a specific Bible reference
 */
async function fetchReferenceOccurrences(reference) {
  try {
    console.log(`Fetching occurrences for ${reference}...`);
    
    // Get pre-computed data for this reference
    const response = await fetch(`/assets/data/analytics/references/${reference.replace(/[:\s]/g, '_')}.json`);
    
    // If pre-computed data doesn't exist, we'll need to search the API directly
    if (!response.ok) {
      await searchReferenceInAPI(reference);
      return;
    }
    
    const data = await response.json();
    displayReferenceOccurrences(reference, data);
    
  } catch (error) {
    console.error('Error fetching reference occurrences:', error);
    showError(`Error fetching occurrences for ${reference}. ${error.message}`);
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
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`API returned error ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter results to find only those that contain the reference
    const referenceRegex = new RegExp(reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const matchingResults = data.results.filter(result => referenceRegex.test(result.text));
    
    if (matchingResults.length === 0) {
      showError(`No occurrences found for ${reference}.`);
      return;
    }
    
    // Format the results
    const occurrences = matchingResults.map(result => ({
      sermon_id: result.video_id,
      sermon_title: result.title,
      timestamp: result.start_time,
      url: result.url,
      text: result.text
    }));
    
    displayReferenceOccurrences(reference, { occurrences });
    
  } catch (error) {
    console.error('Error searching API for reference:', error);
    showError(`Error searching for ${reference}. ${error.message}`);
  }
}

/**
 * Display occurrences of a Bible reference
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
          occurrences: []
        };
      }
      sermonGroups[occurrence.sermon_id].occurrences.push(occurrence);
    });
    
    // Create HTML for each sermon group
    Object.entries(sermonGroups).forEach(([sermonId, sermon]) => {
      const sermonElement = document.createElement('div');
      sermonElement.className = 'sermon-group';
      
      sermonElement.innerHTML = `
        <h3 class="sermon-title">${sermon.title}</h3>
        <div class="occurrence-items">
          ${sermon.occurrences.map(occurrence => `
            <div class="occurrence-item">
              <div class="occurrence-text">${highlightReference(occurrence.text, reference)}</div>
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
 * Highlight the reference in the text
 */
function highlightReference(text, reference) {
  const referenceRegex = new RegExp(reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return text.replace(referenceRegex, match => `<span class="highlight">${match}</span>`);
}

/**
 * Format timestamp to MM:SS
 */
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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