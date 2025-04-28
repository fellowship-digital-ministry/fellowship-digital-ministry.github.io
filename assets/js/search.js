---
---
/**
 * Enhanced Search functionality for the sermon chat interface
 * With improved user experience, typing indicators, and source integration
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
const bibleRefRegex = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi;

// Example queries for the user
const sampleQueries = [
  "What does the pastor teach about prayer?",
  "How does the pastor interpret John 3:16?",
  "What are the pastor's views on forgiveness?",
  "What sermons discuss spiritual growth?",
  "How should Christians respond to trials?"
];

// Keep track of whether this is first load
let isFirstLoad = true;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Check if the form exists on this page before attaching events
  if (chatForm) {
    console.log('Chat form initialized with enhanced experience');
    
    chatForm.addEventListener('submit', handleSubmit);
    
    if (queryInput) {
      // Add placeholder text cycling
      setupPlaceholderCycling(queryInput, sampleQueries);
      
      queryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          chatForm.dispatchEvent(new Event('submit'));
        }
      });
      
      // Focus the input field on page load
      setTimeout(() => queryInput.focus(), 500);
    }
    
    // Add retry connection button handler
    if (retryConnectionButton) {
      retryConnectionButton.addEventListener('click', function() {
        verifyApiConnection(true);
      });
    }
    
    // Verify API connection on page load
    verifyApiConnection(false);
    
    // Add suggested queries for first-time users
    if (isFirstLoad) {
      displayWelcomeMessage();
    }
    
    // Add click handlers for any example questions
    setupExampleQuestionClicks();
  } else {
    console.log('Chat form not found on this page');
  }
});

/**
 * Display welcome message with instructions
 */
function displayWelcomeMessage() {
  // Add welcome message with instructions
  addMessage(`
    <div class="welcome-message">
      <h4>Welcome to the Sermon Search Tool! 👋</h4>
      <p>Ask any question about the pastor's sermons, and I'll provide answers based on the sermon content with timestamped video links.</p>
      <p class="suggestion-heading">Try asking about:</p>
      <div class="suggestion-chips">
        ${sampleQueries.map(query => 
          `<button class="suggestion-chip" data-query="${query}">${query}</button>`
        ).join('')}
      </div>
    </div>
  `, 'bot');
  
  // Add click handlers for suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      const query = this.getAttribute('data-query');
      queryInput.value = query;
      chatForm.dispatchEvent(new Event('submit'));
    });
  });
  
  isFirstLoad = false;
}

/**
 * Setup placeholder text cycling for input field
 */
function setupPlaceholderCycling(inputElement, suggestions) {
  let currentIndex = 0;
  
  // Set initial placeholder
  inputElement.placeholder = suggestions[0];
  
  // Change placeholder text every 3 seconds
  setInterval(() => {
    currentIndex = (currentIndex + 1) % suggestions.length;
    
    // Animate the placeholder change
    inputElement.style.opacity = 0;
    
    setTimeout(() => {
      inputElement.placeholder = suggestions[currentIndex];
      inputElement.style.opacity = 1;
    }, 200);
  }, 3000);
  
  // Reset opacity on focus
  inputElement.addEventListener('focus', () => {
    inputElement.style.opacity = 1;
  });
}

/**
 * Setup click handlers for example questions in the info section
 */
function setupExampleQuestionClicks() {
  document.querySelectorAll('.example-questions li').forEach(item => {
    item.style.cursor = 'pointer';
    
    item.addEventListener('click', function() {
      const query = this.textContent.trim();
      queryInput.value = query;
      
      // Smoothly scroll to chat section
      const chatContainer = document.querySelector('.chat-container');
      chatContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Short delay before submitting to let scroll complete
      setTimeout(() => {
        chatForm.dispatchEvent(new Event('submit'));
      }, 500);
    });
  });
}

/**
 * Verify API connection
 */
async function verifyApiConnection(showFeedback = false) {
  console.log('Verifying API connection to:', API_URL);
  
  if (showFeedback) {
    // Show checking message
    if (apiStatusBanner) {
      apiStatusBanner.style.display = 'block';
      apiStatusBanner.style.backgroundColor = '#f0f9ff';
      apiStatusBanner.style.color = '#2ea3f2';
      apiStatusMessage.textContent = 'Checking connection...';
    }
  } else {
    // Hide banner initially
    if (apiStatusBanner) {
      apiStatusBanner.style.display = 'none';
    }
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
    
    // Show success message if feedback was requested
    if (showFeedback) {
      if (apiStatusBanner) {
        apiStatusBanner.style.backgroundColor = '#f0fff4';
        apiStatusBanner.style.color = '#2ecc71';
        apiStatusMessage.textContent = 'Connected successfully!';
        
        // Hide after 3 seconds
        setTimeout(() => {
          apiStatusBanner.style.display = 'none';
        }, 3000);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('API connection verification failed:', error);
    
    if (apiStatusBanner && apiStatusMessage) {
      apiStatusBanner.style.display = 'block';
      apiStatusBanner.style.backgroundColor = '#fef2f2';
      apiStatusBanner.style.color = '#b91c1c';
      apiStatusMessage.textContent = `API connection issue: ${error.message}. Check your internet connection or try again later.`;
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
  
  // Add typing indicator
  const typingId = addTypingIndicator();
  
  try {
    // Check API connection first
    const isConnected = await verifyApiConnection(false);
    
    if (!isConnected) {
      removeMessage(typingId);
      addMessage(`
        <div class="connection-error">
          <p>Sorry, I can't reach the sermon database right now. Please check your internet connection.</p>
          <button class="retry-button">Retry Connection</button>
        </div>
      `, 'bot', true);
      
      // Add click handler for retry button
      document.querySelector('.retry-button').addEventListener('click', function() {
        verifyApiConnection(true);
      });
      
      return;
    }
    
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
      mode: 'cors', 
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
    
    // Remove typing indicator
    removeMessage(typingId);
    
    // Display AI response
    displayAnswer(data);
    
  } catch (error) {
    console.error('Error:', error);
    
    // Remove typing indicator
    removeMessage(typingId);
    
    // Show error message with retry option
    addMessage(`
      <div class="error-container">
        <p>Sorry, there was an error processing your question (${error.message}).</p>
        <button class="retry-button">Try Again</button>
      </div>
    `, 'bot', true);
    
    // Add click handler for retry button
    document.querySelector('.retry-button').addEventListener('click', function() {
      // Put the query back in the input
      queryInput.value = query;
      // Focus the input
      queryInput.focus();
    });
  }
}

/**
 * Add a message to the chat
 */
function addMessage(text, sender, isError = false) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  messageElement.id = 'msg-' + Date.now();
  
  if (isError) {
    messageElement.classList.add('error');
  }
  
  // Add animation classes
  messageElement.classList.add('message-appear');
  
  // For bot messages, process and render HTML properly
  if (sender === 'bot') {
    // First highlight Bible references
    text = highlightBibleReferences(text);
    
    // Set the HTML content directly to properly render HTML tags
    messageElement.innerHTML = text;
    
    // Make all links open in new tab
    const links = messageElement.querySelectorAll('a');
    links.forEach(link => {
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
      }
    });
  } else {
    // For user messages, escape HTML
    messageElement.textContent = text;
  }
  
  messagesContainer.appendChild(messageElement);
  
  // Scroll to the bottom
  smoothScrollToBottom(messagesContainer);
  
  return messageElement.id;
}

/**
 * Add a typing indicator
 */
function addTypingIndicator() {
  const typingElement = document.createElement('div');
  typingElement.className = 'message bot typing-indicator message-appear';
  typingElement.id = 'typing-' + Date.now();
  
  typingElement.innerHTML = `
    <div class="typing-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  
  messagesContainer.appendChild(typingElement);
  
  // Scroll to the bottom
  smoothScrollToBottom(messagesContainer);
  
  return typingElement.id;
}

/**
 * Smooth scroll to the bottom of a container
 */
function smoothScrollToBottom(container) {
  const scrollHeight = container.scrollHeight;
  const currentScroll = container.scrollTop + container.clientHeight;
  const targetScroll = scrollHeight;
  
  // Only smooth scroll if we're reasonably close to the bottom already
  // This avoids jarring scrolling when lots of content is added
  if (targetScroll - currentScroll < 500) {
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  } else {
    container.scrollTop = targetScroll;
  }
}

/**
 * Remove a message by ID
 */
function removeMessage(id) {
  const message = document.getElementById(id);
  if (message) {
    // Add fade-out animation
    message.classList.add('message-disappear');
    
    // Remove after animation completes
    setTimeout(() => {
      message.remove();
    }, 300);
  }
}

/**
 * Format a date string from various possible formats
 */
function formatSermonDate(dateStr) {
  if (!dateStr) return 'Date unknown';
  
  try {
    // Handle YYYYMMDD format (common in the metadata)
    if (typeof dateStr === 'number' || (typeof dateStr === 'string' && /^\d{8}$/.test(dateStr))) {
      const yearStr = String(dateStr).substring(0, 4);
      const monthStr = String(dateStr).substring(4, 6);
      const dayStr = String(dateStr).substring(6, 8);
      
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
      const day = parseInt(dayStr);
      
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    }
    
    // Handle ISO date strings
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    }
    
    // Handle timestamp
    if (typeof dateStr === 'number') {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    }
    
    // Return as is if we can't parse it
    return dateStr;
  } catch (e) {
    console.error(`Error parsing date: ${dateStr}`, e);
    return 'Date unknown';
  }
}

/**
 * Clean and format sermon title
 */
function formatSermonTitle(title) {
  if (!title) return 'Unknown Sermon';
  
  // Remove quotes that might be in the title
  return title.replace(/^["']|["']$/g, '');
}

/**
 * Display the answer and sources from the API
 */
function displayAnswer(data) {
  // Add the answer to the chat - allow HTML rendering
  const answerId = addMessage(data.answer, 'bot');
  
  // Display sources if available
  if (data.sources && data.sources.length > 0) {
    // Sort sources by similarity score
    const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
    
    // Create a sources container
    const sourcesContainer = document.createElement('div');
    sourcesContainer.className = 'sources-container';
    sourcesContainer.innerHTML = `
      <div class="sources-header">
        <h4>Sources Found (${sortedSources.length})</h4>
        <div class="sources-toggle">Show Sources</div>
      </div>
      <div class="sources-content" style="display: none;"></div>
    `;
    
    // Add sources container after the answer
    const answerElement = document.getElementById(answerId);
    answerElement.after(sourcesContainer);
    
    // Get the sources content container
    const sourcesContent = sourcesContainer.querySelector('.sources-content');
    
    // Add toggle functionality
    const sourcesToggle = sourcesContainer.querySelector('.sources-toggle');
    sourcesToggle.addEventListener('click', function() {
      const isHidden = sourcesContent.style.display === 'none';
      
      // Toggle the content display
      sourcesContent.style.display = isHidden ? 'block' : 'none';
      
      // Update the toggle text
      this.textContent = isHidden ? 'Hide Sources' : 'Show Sources';
      
      // Scroll into view if showing
      if (isHidden) {
        setTimeout(() => {
          sourcesContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
    
    // Display top sources
    const sourceLimit = Math.min(sortedSources.length, 3); // Limit to top 3 sources
    const topSources = sortedSources.slice(0, sourceLimit);
    
    // Add sources to the content container
    topSources.forEach((source, index) => {
      const sourceElement = createSourceElement(source, index);
      sourcesContent.appendChild(sourceElement);
    });
    
    // If there are more sources, add a "View all sources" button
    if (sortedSources.length > sourceLimit) {
      const viewAllButton = document.createElement('button');
      viewAllButton.className = 'view-all-sources';
      viewAllButton.textContent = `View All ${sortedSources.length} Sources`;
      viewAllButton.addEventListener('click', function() {
        // Clear existing sources
        sourcesContent.innerHTML = '';
        
        // Add all sources
        sortedSources.forEach((source, index) => {
          const sourceElement = createSourceElement(source, index);
          sourcesContent.appendChild(sourceElement);
        });
        
        // Remove self
        this.remove();
      });
      
      sourcesContent.appendChild(viewAllButton);
    }
  }
}

/**
 * Create a source element
 */
function createSourceElement(source, index) {
  const sourceElement = document.createElement('div');
  sourceElement.className = 'source-container';
  
  const similarity = Math.round(source.similarity * 100);
  const videoUrl = `https://www.youtube.com/embed/${source.video_id}?start=${Math.floor(source.start_time)}`;
  
  // Format title and date for display
  const formattedTitle = formatSermonTitle(source.title);
  const formattedDate = formatSermonDate(source.publish_date);
  
  // Create collapsed view first (default)
  sourceElement.innerHTML = `
    <div class="source-header">
      <div class="source-title">${escapeHTML(formattedTitle)}</div>
      <div class="source-date">${formattedDate}</div>
    </div>
    <div class="source-text">"${formatText(source.text.substring(0, 150))}${source.text.length > 150 ? '...' : ''}"</div>
    <div class="source-meta">
      <span class="source-time">Timestamp: ${formatTimestamp(source.start_time)}</span>
      <span class="source-match">${similarity}% match</span>
    </div>
    <div class="source-actions">
      <button class="watch-video-btn">Watch Video Clip</button>
      <a href="https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}" target="_blank" class="open-youtube-btn">
        Open in YouTube
      </a>
    </div>
    <div class="video-embed" style="display: none;">
      <iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen height="215"></iframe>
    </div>
  `;
  
  // Add interaction for watching the video
  const watchBtn = sourceElement.querySelector('.watch-video-btn');
  const videoEmbed = sourceElement.querySelector('.video-embed');
  
  watchBtn.addEventListener('click', function() {
    const isHidden = videoEmbed.style.display === 'none';
    
    // Toggle the video display
    videoEmbed.style.display = isHidden ? 'block' : 'none';
    
    // Update the button text
    this.textContent = isHidden ? 'Hide Video' : 'Watch Video Clip';
    
    // Scroll into view if showing
    if (isHidden) {
      setTimeout(() => {
        videoEmbed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  });
  
  return sourceElement;
}

/**
 * Escape HTML for safety
 */
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format text (e.g., highlight Bible references)
 */
function formatText(text) {
  if (!text) return '';
  // First escape HTML
  text = escapeHTML(text);
  // Then highlight Bible references
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