/**
 * api.js
 * Handles communication with the backend API
 */

// API Configuration
const API_URL = '{{ site.api_url }}' || 'https://sermon-search-api-8fok.onrender.com';

// Conversation memory
let conversationHistory = [];
const MAX_MEMORY_LENGTH = 10; // Maximum number of exchanges to remember

/**
 * Verify API connection
 * @param {boolean} showFeedback - Whether to show feedback in the UI
 * @returns {Promise<boolean>} - True if API is connected, false otherwise
 */
async function verifyApiConnection(showFeedback = false) {
  console.log('Verifying API connection to:', API_URL);
  
  const apiStatusBanner = Utils.safeGetElement('api-status-banner');
  const apiStatusMessage = Utils.safeGetElement('api-status-message');
  
  if (showFeedback && apiStatusBanner && apiStatusMessage) {
    // Show checking message
    apiStatusBanner.style.display = 'block';
    apiStatusBanner.style.backgroundColor = '#f0f9ff';
    apiStatusBanner.style.color = '#2ea3f2';
    apiStatusMessage.textContent = 'Checking connection...';
  } else if (apiStatusBanner) {
    // Hide banner initially
    apiStatusBanner.style.display = 'none';
  }
  
  try {
    // Try the root endpoint first
    const rootResponse = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors'
    });
    
    if (!rootResponse.ok) {
      throw new Error(`API connection failed with status: ${rootResponse.status}`);
    }
    
    console.log('API connection successful');
    
    // Show success message if feedback was requested
    if (showFeedback && apiStatusBanner && apiStatusMessage) {
      apiStatusBanner.style.backgroundColor = '#f0fff4';
      apiStatusBanner.style.color = '#2ecc71';
      apiStatusMessage.textContent = 'Connected successfully!';
      
      // Hide after 3 seconds
      setTimeout(() => {
        apiStatusBanner.style.display = 'none';
      }, 3000);
    }
    
    return true;
    
  } catch (error) {
    console.error('API connection verification failed:', error);
    
    if (apiStatusBanner && apiStatusMessage) {
      apiStatusBanner.style.display = 'block';
      apiStatusBanner.style.backgroundColor = '#fef2f2';
      apiStatusBanner.style.color = '#b91c1c';
      apiStatusMessage.textContent = I18n.translate('api-connection-issue');
    }
    
    return false;
  }
}

/**
 * Send a query to the API
 * @param {string} query - The user query
 * @returns {Promise<Object>} - The API response
 */
async function sendQuery(query) {
  // Create API request payload with language
  const payload = {
    query: query,
    top_k: 5,
    include_sources: true,
    language: I18n.currentLanguage
  };
  
  // Add conversation history if available
  if (conversationHistory.length > 1) {
    payload.conversation_history = conversationHistory.slice(0, -1); // Exclude current query
  }
  
  // Send language in both header and payload
  const response = await fetch(`${API_URL}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': window.location.origin,
      'Accept-Language': I18n.currentLanguage // Language header
    },
    mode: 'cors',
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Received response:', data);
  
  return data;
}

/**
 * Fetch a sermon transcript from the API
 * @param {string} videoId - YouTube video ID
 * @param {number} startTime - Start time in seconds
 * @returns {Promise<Object>} - Transcript data
 */
async function fetchTranscript(videoId, startTime = 0) {
  const response = await fetch(`${API_URL}/transcript/${videoId}?language=${I18n.currentLanguage}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Origin': window.location.origin,
      'Accept-Language': I18n.currentLanguage
    },
    mode: 'cors'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Received transcript data:', data);
  
  return data;
}

/**
 * Add to conversation history
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message content
 */
function addToConversationHistory(role, content) {
  conversationHistory.push({ role, content });
  
  // Limit history length
  if (conversationHistory.length > MAX_MEMORY_LENGTH * 2) {
    conversationHistory = conversationHistory.slice(-MAX_MEMORY_LENGTH * 2);
  }
}

/**
 * Clear conversation history
 */
function clearConversationHistory() {
  conversationHistory = [];
}

/**
 * Get conversation history
 * @returns {Array} - Conversation history
 */
function getConversationHistory() {
  return conversationHistory;
}

// Export API module
const API = {
  verifyApiConnection,
  sendQuery,
  fetchTranscript,
  addToConversationHistory,
  clearConversationHistory,
  getConversationHistory
};