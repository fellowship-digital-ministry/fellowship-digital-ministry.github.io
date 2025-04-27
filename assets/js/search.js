---
---
/**
 * Search functionality for the sermon chat interface
 */

// Constants
const API_URL = '{{ site.api_url }}';

// DOM Elements
const chatForm = document.getElementById('chatForm');
const queryInput = document.getElementById('queryInput');
const messagesContainer = document.getElementById('messages');
const apiStatusBanner = document.getElementById('api-status-banner');
const apiStatusMessage = document.getElementById('api-status-message');
const retryConnectionButton = document.getElementById('retry-connection');

// Bible reference regex for highlighting in responses
const bibleRefRegex = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+:\d+(-\d+)?/g;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  chatForm.addEventListener('submit', handleSubmit);
  queryInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });
  
  // Add retry connection button handler
  if (retryConnectionButton) {
    retryConnectionButton.addEventListener('click', verifyApiConnection);
  }
  
  // Verify API connection on page load
  verifyApiConnection();
});

/**
 * Verify API connection
 */
async function verifyApiConnection() {
  console.log('Verifying API connection to:', API_URL);
  
  if (apiStatusBanner) {
    apiStatusBanner.style.display = 'none';
  }
  
  try {
    // Try the root endpoint first instead of /health
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
    return true;
    
  } catch (error) {
    console.error('API connection verification failed:', error);
    
    if (apiStatusBanner && apiStatusMessage) {
      apiStatusBanner.style.display = 'block';
      apiStatusMessage.textContent = `API connection issue: ${error.message}. Check console for details.`;
    }
    
    return false;
  }
}

/**
 * Handle form submission
 */
async function handleSubmit(event) {
  event.preventDefault();
  
  const query = queryInput.value.trim();
  if (!query) return;
  
  // Add user message to the chat
  addMessage(query, 'user');
  
  // Clear input field
  queryInput.value = '';
  
  // Add loading message
  const loadingMessageId = addLoadingMessage();
  
  try {
    // Send request to API - ensure API URL is correctly formatted
    const url = `${API_URL}/answer`;
    console.log('Sending request to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors', // Enable CORS
      body: JSON.stringify({
        query: query,
        top_k: 5,
        include_sources: true
      })
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Remove loading message
    removeMessage(loadingMessageId);
    
    // Display AI response
    displayAnswer(data);
    
  } catch (error) {
    console.error('Error:', error);
    
    // Remove loading message
    removeMessage(loadingMessageId);
    
    // Show error message with more details
    addMessage(`Sorry, there was an error processing your question (${error.message}). This may be a CORS issue or API endpoint problem. Please check the console for details and ensure the API is running properly.`, 'bot', true);
  }
}

/**
 * Add a message to the chat
 */
function addMessage(text, sender, isError = false) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  
  if (isError) {
    messageElement.classList.add('error');
  }
  
  // For bot messages, highlight Bible references
  if (sender === 'bot') {
    text = highlightBibleReferences(text);
  }
  
  messageElement.innerHTML = text;
  messageElement.id = 'msg-' + Date.now();
  messagesContainer.appendChild(messageElement);
  
  // Scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageElement.id;
}

/**
 * Add a loading message
 */
function addLoadingMessage() {
  const loadingElement = document.createElement('div');
  loadingElement.className = 'message bot loading';
  loadingElement.innerHTML = '<div class="loading-spinner"></div> Searching sermon content...';
  loadingElement.id = 'loading-' + Date.now();
  messagesContainer.appendChild(loadingElement);
  
  // Scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return loadingElement.id;
}

/**
 * Remove a message by ID
 */
function removeMessage(id) {
  const message = document.getElementById(id);
  if (message) {
    message.remove();
  }
}

/**
 * Display the answer and sources from the API
 */
function displayAnswer(data) {
  // Format the answer
  let formattedAnswer = data.answer;
  
  // Add the answer to the chat
  addMessage(formattedAnswer, 'bot');
  
  // Display sources if available
  if (data.sources && data.sources.length > 0) {
    // Sort sources by similarity score
    const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
    
    // Display top sources
    const sourceLimit = 3; // Limit to top 3 sources
    const topSources = sortedSources.slice(0, sourceLimit);
    
    topSources.forEach((source, index) => {
      displaySource(source, index);
    });
  }
}

/**
 * Display a source with video embed
 */
function displaySource(source, index) {
  const sourceElement = document.createElement('div');
  sourceElement.className = 'source-container';
  
  const similarity = Math.round(source.similarity * 100);
  const videoUrl = `https://www.youtube.com/embed/${source.video_id}?start=${Math.floor(source.start_time)}`;
  
  sourceElement.innerHTML = `
    <div class="source-title">${source.title}</div>
    <div class="source-text">"${formatText(source.text.substring(0, 150))}${source.text.length > 150 ? '...' : ''}"</div>
    <div class="source-meta">
      <span class="source-time">Timestamp: ${formatTimestamp(source.start_time)}</span>
      <span class="source-match">${similarity}% match</span>
    </div>
    <iframe class="video-embed" src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen height="215"></iframe>
  `;
  
  messagesContainer.appendChild(sourceElement);
  
  // Scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Format text (e.g., highlight Bible references)
 */
function formatText(text) {
  if (!text) return '';
  return highlightBibleReferences(text);
}

/**
 * Highlight Bible references in text
 */
function highlightBibleReferences(text) {
  return text.replace(bibleRefRegex, '<span class="bible-reference">$&</span>');
}

/**
 * Format timestamp to MM:SS
 */
function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}