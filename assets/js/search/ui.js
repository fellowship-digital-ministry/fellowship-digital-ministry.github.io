/**
 * ui.js
 * Handles UI manipulation and rendering functions
 */

// DOM Elements - Using safe getter
const messagesContainer = Utils.safeGetElement('messages');
const chatForm = Utils.safeGetElement('chatForm');
const queryInput = Utils.safeGetElement('queryInput');
const apiStatusBanner = Utils.safeGetElement('api-status-banner');
const infoToggle = Utils.safeGetElement('infoToggle');
const infoSection = Utils.safeGetElement('infoSection');

// Keep track of whether this is first load
let isFirstLoad = true;

/**
 * Initialize UI components and event listeners
 */
function initUI() {
  // Add info toggle functionality
  if (infoToggle && infoSection) {
    infoToggle.addEventListener('click', function() {
      infoSection.classList.toggle('active');
    });
  }
  
  // Setup source panel toggle
  setupSourcesPanel();
  
  // Setup example question clicks
  setupExampleQuestionClicks();
  
  // Welcome message on first load
  if (isFirstLoad) {
    displayWelcomeMessage();
    isFirstLoad = false;
  }
  
  // Auto-resize input field as user types
  if (queryInput) {
    queryInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });
  }
}

/**
 * Format the text with markdown-like syntax
 * @param {string} text - The text to format
 * @returns {string} - Formatted HTML
 */
function formatResponse(text) {
  if (!text) return '';
  
  // Convert line breaks to HTML breaks for proper rendering
  text = text.replace(/\n/g, '<br>');
  
  // Replace section headers (text between ** **)
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Format numbered lists (more robust pattern)
  text = text.replace(/(\d+\.\s+)([^\n<]+)(<br>|$)/g, '<div class="list-item"><span class="list-number">$1</span>$2</div>$3');
  
  // Highlight Bible references with the appropriate language regex
  text = text.replace(I18n.getBibleReferenceRegexForLanguage(), '<span class="bible-reference">$&</span>');
  
  // Wrap paragraphs in <p> tags, but not if they're already in a div or other block element
  text = text.replace(/(^|<\/div>)([^<]+)(<br>|$)/g, '$1<p>$2</p>$3');
  
  // Clean up any extra <br> tags after </p> tags
  text = text.replace(/<\/p><br>/g, '</p>');
  
  return text;
}

/**
 * Add a message to the chat
 * @param {string} text - Message text or HTML
 * @param {string} sender - 'user' or 'bot'
 * @param {boolean} isError - Whether this is an error message
 * @returns {HTMLElement} - The created message element
 */
function addMessage(text, sender, isError = false) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  messageElement.id = 'msg-' + Date.now(); // Add an ID to each message for reference
  
  if (isError) {
    messageElement.classList.add('error');
  }
  
  // For bot messages, apply formatting
  if (sender === 'bot') {
    if (text.startsWith('<div class="welcome-message">') || 
        text.startsWith('<div class="error-container">') ||
        text.startsWith('<div class="connection-error">')) {
      // For pre-formatted HTML content, use it directly
      messageElement.innerHTML = text;
    } else {
      // For regular text responses, apply the formatting
      const formattedText = formatResponse(text);
      messageElement.innerHTML = formattedText;
    }
    
    // Make all links open in new tab
    const links = messageElement.querySelectorAll('a');
    links.forEach(link => {
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
      }
    });
    
    // Make Bible references clickable
    setupBibleReferenceClicks(messageElement);
    
  } else {
    // For user messages, use text content for safety
    messageElement.textContent = text;
  }
  
  messagesContainer.appendChild(messageElement);
  
  // Scroll to the bottom
  Utils.smoothScrollToBottom(messagesContainer);
  
  return messageElement;
}

/**
 * Setup Bible reference clicks for a DOM element
 * @param {HTMLElement} element - Element containing Bible references
 */
function setupBibleReferenceClicks(element) {
  if (!element) return;
  
  const bibleRefs = element.querySelectorAll('.bible-reference');
  
  bibleRefs.forEach(ref => {
    ref.addEventListener('click', function() {
      const reference = this.textContent.trim();
      const bibleConfig = I18n.bibleWebsites[I18n.currentLanguage] || I18n.bibleWebsites.en;
      
      window.open(`${bibleConfig.site}?search=${encodeURIComponent(reference)}&version=${bibleConfig.version}`, '_blank');
    });
  });
}

/**
 * Update Bible references when language changes
 */
function updateBibleReferencesForLanguage() {
  // Get all bot messages
  const botMessages = document.querySelectorAll('.message.bot:not(.typing-indicator)');
  
  botMessages.forEach(message => {
    // Find all Bible references in this message
    const bibleRefs = message.querySelectorAll('.bible-reference');
    
    bibleRefs.forEach(ref => {
      // Update the click handler to use the current language
      ref.addEventListener('click', function() {
        // Open Bible reference in a Bible website with current language
        const bibleConfig = I18n.bibleWebsites[I18n.currentLanguage] || I18n.bibleWebsites.en;
        window.open(`${bibleConfig.site}?search=${encodeURIComponent(this.textContent.trim())}&version=${bibleConfig.version}`, '_blank');
      });
    });
  });
}

/**
 * Add a typing indicator
 * @returns {string} - ID of the typing indicator element
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
  Utils.smoothScrollToBottom(messagesContainer);
  
  return typingElement.id;
}

/**
 * Remove a message by ID
 * @param {string} id - Element ID
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
 * Display welcome message with instructions
 */
function displayWelcomeMessage() {
  // Add welcome message with instructions
  const welcomeMsg = `
    <div class="welcome-message">
      <h4>${I18n.translate('welcome-title')}</h4>
      <p>${I18n.translate('welcome-intro')}</p>
      <p class="suggestion-heading">${I18n.translate('suggestion-heading')}</p>
      <div class="suggestion-chips">
        ${getTranslatedQueries().map(query => 
          `<button class="suggestion-chip" data-query="${query}">${query}</button>`
        ).join('')}
      </div>
    </div>
  `;
  
  addMessage(welcomeMsg, 'bot');
  
  // Add click handlers for suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      const query = this.getAttribute('data-query');
      queryInput.value = query;
      chatForm.dispatchEvent(new Event('submit'));
    });
  });
}

/**
 * Get translated sample queries
 * @returns {Array} - Array of translated queries
 */
function getTranslatedQueries() {
  const sampleQueries = [
    "example-1",
    "example-2", 
    "example-3",
    "example-4", 
    "example-5"
  ];
  
  return sampleQueries.map(key => I18n.translate(key));
}

/**
 * Setup click handlers for example questions in the info section
 */
function setupExampleQuestionClicks() {
  const exampleQuestions = document.querySelectorAll('.example-questions li');
  console.log('Setting up', exampleQuestions.length, 'example questions');
  
  exampleQuestions.forEach(item => {
    item.style.cursor = 'pointer';
    
    item.addEventListener('click', function() {
      const query = this.textContent.trim();
      console.log('Example question clicked:', query);
      
      if (queryInput) {
        queryInput.value = query;
        
        // Smoothly scroll to chat section
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
          chatContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Short delay before submitting to let scroll complete
        setTimeout(() => {
          chatForm.dispatchEvent(new Event('submit'));
        }, 500);
      }
    });
  });
}

/**
 * Create a source element with translated UI
 * @param {Object} source - Source data
 * @param {number} index - Source index
 * @returns {HTMLElement} - Source element
 */
function createSourceElement(source, index) {
  const sourceElement = document.createElement('div');
  sourceElement.className = 'source-container';
  sourceElement.setAttribute('data-video-id', source.video_id);
  
  const similarity = Math.round(source.similarity * 100);
  const videoUrl = `https://www.youtube.com/embed/${source.video_id}?start=${Math.floor(source.start_time)}`;
  
  // Format title and date for display
  const formattedTitle = Utils.formatSermonTitle(source.title);
  
  // Handle date formatting properly
  let formattedDate = 'Date unknown';
  if (source.publish_date) {
    formattedDate = Utils.formatSermonDate(source.publish_date, I18n.currentLanguage);
  }
  
  // Create collapsed view first (default)
  sourceElement.innerHTML = `
    <div class="source-header">
      <div class="source-title">${Utils.escapeHTML(formattedTitle)}</div>
      <div class="source-date">${formattedDate}</div>
    </div>
    <div class="source-text">"${I18n.formatText(source.text.substring(0, 150))}${source.text.length > 150 ? '...' : ''}"</div>
    <div class="source-meta">
      <span class="source-time">Timestamp: ${Utils.formatTimestamp(source.start_time)}</span>
      <span class="source-match">${similarity}% match</span>
    </div>
    <div class="source-actions">
      <button class="watch-video-btn" onclick="toggleVideo(this)">${I18n.translate('watch-video')}</button>
      <button class="view-transcript-btn" onclick="toggleTranscript('${source.video_id}', ${source.start_time})">${I18n.translate('view-transcript')}</button>
      <a href="https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}" target="_blank" class="open-youtube-btn">
        ${I18n.translate('open-youtube')}
      </a>
    </div>
    <div class="video-embed" style="display: none;">
      <iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen height="215"></iframe>
    </div>
  `;
  
  return sourceElement;
}

/**
 * Toggle video display
 * @param {HTMLElement} button - Button element
 */
function toggleVideo(button) {
  try {
    if (!button || !button.parentElement) {
      console.error('Invalid button element for toggleVideo');
      return;
    }
    
    const videoEmbed = button.parentElement.nextElementSibling;
    if (!videoEmbed || !videoEmbed.classList.contains('video-embed')) {
      console.error('Could not find video embed element');
      return;
    }
    
    const isHidden = videoEmbed.style.display === 'none';
    
    // Toggle the video display
    videoEmbed.style.display = isHidden ? 'block' : 'none';
    
    // Update the button text safely
    button.textContent = isHidden 
      ? I18n.translate('hide-video') 
      : I18n.translate('watch-video');
    
    // Scroll to make video visible if showing
    if (isHidden) {
      setTimeout(() => {
        videoEmbed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  } catch (error) {
    console.error('Error in toggleVideo:', error);
  }
}

/**
 * Setup sources panel behavior
 */
function setupSourcesPanel() {
  const sourcesPanel = document.querySelector('.claude-sources-panel');
  const closeSourcesPanel = document.querySelector('.claude-sources-close');
  
  if (closeSourcesPanel && sourcesPanel) {
    closeSourcesPanel.addEventListener('click', function() {
      sourcesPanel.classList.remove('active');
    });
  }
  
  // Global function for toggling sources panel
  window.toggleSourcesPanel = function(show) {
    if (!sourcesPanel) return;
    
    if (show === undefined) {
      // Toggle based on current state
      show = !sourcesPanel.classList.contains('active');
    }
    
    if (show) {
      // Show panel
      sourcesPanel.classList.add('active');
    } else {
      // Hide panel
      sourcesPanel.classList.remove('active');
    }
  };
  
  // Expose toggleVideo globally
  window.toggleVideo = toggleVideo;
}

/**
 * Display the answer and sources from the API
 * @param {Object} data - API response data
 */
function displayAnswer(data) {
  if (!data || !data.answer) {
    console.error('Invalid data received from API');
    addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
    return;
  }
  
  // Check if there are any sermon sources
  const hasSermonContent = data.sources && data.sources.length > 0;
  
  // If no sermon content was found but we have conversation history
  if (!hasSermonContent && data.answer.includes(I18n.translate('no-results')) && API.getConversationHistory().length > 0) {
    // Generate a conversational response instead
    const conversationalResponse = Search.handleConversationFallback(
      data.query, 
      API.getConversationHistory()
    );
    
    // Display the conversational response
    const messageElement = addMessage(conversationalResponse, 'bot');
    messageElement.classList.add('conversation-mode'); // Add this class to style conversation mode differently if desired
    
    // Add to conversation history
    API.addToConversationHistory('assistant', conversationalResponse);
    
    return;
  }
  
  // Regular processing for when sermon content is found
  const messageElement = addMessage(data.answer, 'bot');
  
  // Display sources if available
  if (hasSermonContent) {
    try {
      // Sort sources by similarity score
      const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
      
      // Create a sources container
      const sourcesContainer = document.createElement('div');
      sourcesContainer.className = 'sources-container';
      
      // Create tabbed interface structure
      sourcesContainer.innerHTML = `
        <div class="sources-tabs">
          <div class="source-tab active">Overview <span class="sources-count">${sortedSources.length}</span></div>
          <div class="source-tab">Details</div>
          <div class="source-tab">Transcript</div>
        </div>
        <div class="tab-content sources-overview active">
          <!-- Source cards go here -->
        </div>
        <div class="tab-content source-detail">
          <!-- Detailed source view -->
        </div>
        <div class="tab-content transcript-content">
          <!-- Transcript view -->
        </div>
      `;
      
      // Add sources container after the answer
      if (messageElement && messageElement.parentNode) {
        messageElement.parentNode.insertBefore(sourcesContainer, messageElement.nextSibling);
      } else {
        console.warn('Could not find messageElement parent for sources, adding to messages container');
        messagesContainer.appendChild(sourcesContainer);
      }
      
      // Get the sources overview tab content
      const sourcesOverview = sourcesContainer.querySelector('.sources-overview');
      
      // Add tab switching functionality
      const tabs = sourcesContainer.querySelectorAll('.source-tab');
      const tabContents = sourcesContainer.querySelectorAll('.tab-content');
      
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', function() {
          // Remove active class from all tabs and contents
          tabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          
          // Add active class to clicked tab and corresponding content
          this.classList.add('active');
          tabContents[index].classList.add('active');
        });
      });
      
      // Display top sources in the overview tab
      const sourceLimit = Math.min(sortedSources.length, 3); // Limit to top 3 sources
      const topSources = sortedSources.slice(0, sourceLimit);
      
      // Add sources to the overview tab
      topSources.forEach((source, index) => {
        const sourceElement = createSourceElement(source, index);
        sourcesOverview.appendChild(sourceElement);
      });
      
      // If there are more sources, add a "View all sources" button
      if (sortedSources.length > sourceLimit) {
        const viewAllButton = document.createElement('button');
        viewAllButton.className = 'view-all-sources';
        viewAllButton.textContent = `${I18n.translate('view-all-sources')} (${sortedSources.length})`;
        viewAllButton.addEventListener('click', function() {
          // Clear existing sources
          sourcesOverview.innerHTML = '';
          
          // Add all sources
          sortedSources.forEach((source, index) => {
            const sourceElement = createSourceElement(source, index);
            sourcesOverview.appendChild(sourceElement);
          });
          
          // Remove self
          this.remove();
        });
        
        sourcesOverview.appendChild(viewAllButton);
      }
      
      // Add a "continue conversation" hint if this is the first answer
      if (API.getConversationHistory().length <= 2) {
        const continueHint = document.createElement('div');
        continueHint.className = 'continue-hint';
        continueHint.innerHTML = `<p><em>${I18n.translate('continue-conversation')}</em></p>`;
        messagesContainer.appendChild(continueHint);
      }
    } catch (error) {
      console.error('Error displaying sources:', error);
      // Continue without displaying sources
    }
  }
  
  // Add to conversation history
  API.addToConversationHistory('assistant', data.answer);
}

// Listen for language changes
document.addEventListener('languageChanged', function(e) {
  // Update Bible references
  updateBibleReferencesForLanguage();
});

// Export UI module
const UI = {
  initUI,
  addMessage,
  removeMessage,
  addTypingIndicator,
  displayAnswer,
  setupBibleReferenceClicks,
  toggleVideo,
  createSourceElement
};