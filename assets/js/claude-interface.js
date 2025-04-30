/**
 * Enhanced Claude-Style Interface for Sermon Search
 * This script adds Claude-like UI behavior with improved mobile responsiveness
 * and accessibility
 */

document.addEventListener('DOMContentLoaded', function() {
  initClaudeInterface();
});

/**
 * Initialize the Claude-style interface
 */
function initClaudeInterface() {
  console.log('Initializing enhanced Claude-style interface');
  
  // Safely get DOM elements
  const queryInput = safeGetElement('queryInput');
  const sourcesPanel = safeGetElement('sourcesPanel');
  const sourcesPanelContent = safeGetElement('sourcesPanelContent');
  const closeSourcesButton = safeGetElement('closeSourcesPanel');
  const messagesContainer = safeGetElement('messages');
  
  // Helper function to safely get elements
  function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
    }
    return element;
  }
  
  // Detect mobile/touch device for touch-optimized interactions
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) {
    document.body.classList.add('touch-device');
  }
  
  // Auto-resize textarea with throttling for better performance
  let resizeTimeout;
  if (queryInput) {
    queryInput.addEventListener('input', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, isTouchDevice ? 150 : 200) + 'px';
      }, 50);
    });
    
    // Enter to submit, Shift+Enter for new line
    queryInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('chatForm')?.dispatchEvent(new Event('submit'));
      }
    });
  }
  
  // Improve sources panel behavior for mobile
  if (closeSourcesButton && sourcesPanel) {
    closeSourcesButton.addEventListener('click', function() {
      hideSourcesPanel();
    });
    
    // Close sources panel when clicking/tapping outside on mobile
    if (isTouchDevice) {
      document.addEventListener('click', function(e) {
        if (sourcesPanel.classList.contains('active') && 
            !sourcesPanel.contains(e.target) && 
            !e.target.closest('.claude-sources-toggle')) {
          hideSourcesPanel();
        }
      });
    }
  }
  
  /**
   * Hide the sources panel with animation
   */
  function hideSourcesPanel() {
    if (!sourcesPanel) return;
    
    sourcesPanel.classList.remove('active');
    
    // Update any active toggle buttons
    document.querySelectorAll('.claude-sources-toggle[data-active="true"]').forEach(toggle => {
      toggle.setAttribute('data-active', 'false');
      toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> View Sources';
    });
  }
  
  // Override the original addMessage function to use Claude-style layout
  window.originalAddMessage = window.addMessage;
  window.addMessage = function(text, sender, isError = false) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `claude-message claude-message-${sender}`;
    messageElement.id = 'msg-' + Date.now();
    
    // Add ARIA roles for accessibility
    messageElement.setAttribute('role', sender === 'user' ? 'status' : 'article');
    messageElement.setAttribute('aria-live', 'polite');
    
    const messageContent = document.createElement('div');
    messageContent.className = 'claude-message-content';
    
    if (isError) {
      messageContent.classList.add('error');
      messageElement.setAttribute('aria-label', 'Error message');
    }
    
    // For bot messages, apply formatting
    if (sender === 'bot') {
      if (text.startsWith('<div class="welcome-message">')) {
        // Convert old welcome message format to new Claude-style
        const welcomeContent = createClaudeWelcomeMessage();
        messageContent.appendChild(welcomeContent);
      } 
      else if (text.startsWith('<div class="error-container">') || 
               text.startsWith('<div class="connection-error">')) {
        // For pre-formatted HTML error content
        messageContent.innerHTML = text;
      } 
      else {
        // Regular text responses
        const formattedText = formatResponse ? formatResponse(text) : text;
        messageContent.innerHTML = formattedText;
        
        // Look for sources in the response and create a toggle button
        const hasSources = text.includes('sermon') && !text.includes('No relevant sermon content found');
        if (hasSources) {
          const sourcesToggle = document.createElement('button');
          sourcesToggle.className = 'claude-sources-toggle';
          sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> View Sources';
          sourcesToggle.setAttribute('data-active', 'false');
          sourcesToggle.setAttribute('aria-expanded', 'false');
          sourcesToggle.setAttribute('aria-controls', 'sourcesPanel');
          
          sourcesToggle.addEventListener('click', function() {
            const isActive = this.getAttribute('data-active') === 'true';
            
            if (isActive) {
              hideSourcesPanel();
              this.setAttribute('aria-expanded', 'false');
            } else {
              sourcesPanel.classList.add('active');
              this.setAttribute('data-active', 'true');
              this.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> Hide Sources';
              this.setAttribute('aria-expanded', 'true');
              
              // Scroll sources panel to top for better UX
              if (sourcesPanelContent) {
                sourcesPanelContent.scrollTop = 0;
              }
            }
          });
          
          messageContent.appendChild(sourcesToggle);
        }
      }
      
      // Make Bible references clickable
      setupBibleReferenceClicks(messageContent);
      
    } else {
      // For user messages, use text content for safety
      messageContent.textContent = text;
    }
    
    messageElement.appendChild(messageContent);
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the bottom with smooth animation on desktop, instant on mobile
    if (window.innerWidth < 768) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
      smoothScrollToBottom(messagesContainer);
    }
    
    return messageElement;
  };
  
  /**
   * Smooth scroll to bottom with better performance
   */
  function smoothScrollToBottom(container) {
    const scrollHeight = container.scrollHeight;
    const currentScroll = container.scrollTop + container.clientHeight;
    const targetScroll = scrollHeight;
    
    // Only smooth scroll if we're reasonably close to the bottom already
    if (targetScroll - currentScroll < 500) {
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    } else {
      container.scrollTop = targetScroll;
    }
  }
  
  // Override the typing indicator for better animation
  window.addTypingIndicator = function() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'claude-typing';
    typingElement.id = 'typing-' + Date.now();
    typingElement.setAttribute('role', 'status');
    typingElement.setAttribute('aria-label', 'Claude is typing');
    
    typingElement.innerHTML = `
      <div class="claude-typing-bubble"></div>
      <div class="claude-typing-bubble"></div>
      <div class="claude-typing-bubble"></div>
    `;
    
    messagesContainer.appendChild(typingElement);
    
    // Scroll to the bottom
    smoothScrollToBottom(messagesContainer);
    
    return typingElement.id;
  };
  
  // Override displayAnswer to put sources in the side panel
  window.originalDisplayAnswer = window.displayAnswer;
  window.displayAnswer = function(data) {
    if (!data || !data.answer) {
      console.error('Invalid data received from API');
      addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
      return;
    }
    
    // Check if there are any sermon sources
    const hasSermonContent = data.sources && data.sources.length > 0;
    
    // If no sermon content but we have conversation history, use the original logic
    if (!hasSermonContent && data.answer.includes(translate('no-results')) && conversationHistory.length > 0) {
      if (window.originalDisplayAnswer) {
        return window.originalDisplayAnswer(data);
      }
      return;
    }
    
    // Add the answer message
    const messageElement = addMessage(data.answer, 'bot');
    
    // Display sources in the side panel if available
    if (hasSermonContent) {
      try {
        // Clear previous sources
        if (sourcesPanelContent) {
          sourcesPanelContent.innerHTML = '';
          
          // Add title with count
          const sourcesTitle = document.createElement('h3');
          sourcesTitle.textContent = `Sources (${data.sources.length})`;
          sourcesPanelContent.appendChild(sourcesTitle);
          
          // Sort sources by similarity score
          const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
          
          // Add sources to panel
          sortedSources.forEach((source, index) => {
            const sourceElement = createClaudeSourceElement(source, index);
            sourcesPanelContent.appendChild(sourceElement);
          });
          
          // Auto-open sources panel for first message on desktop only
          if (conversationHistory.length <= 2 && window.innerWidth >= 992) {
            setTimeout(() => {
              if (sourcesPanel) {
                sourcesPanel.classList.add('active');
              }
              const sourcesToggle = messageElement.querySelector('.claude-sources-toggle');
              if (sourcesToggle) {
                sourcesToggle.setAttribute('data-active', 'true');
                sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> Hide Sources';
                sourcesToggle.setAttribute('aria-expanded', 'true');
              }
            }, 500);
          }
        }
        
        // Add to conversation history
        if (typeof conversationHistory !== 'undefined') {
          conversationHistory.push({ role: 'assistant', content: data.answer });
        }
        
      } catch (error) {
        console.error('Error displaying sources:', error);
        // Continue without displaying sources
        
        // Still add to conversation history
        if (typeof conversationHistory !== 'undefined') {
          conversationHistory.push({ role: 'assistant', content: data.answer });
        }
      }
    } else {
      // Add to conversation history
      if (typeof conversationHistory !== 'undefined') {
        conversationHistory.push({ role: 'assistant', content: data.answer });
      }
    }
  };
  
  /**
   * Create Claude-style welcome message
   */
  function createClaudeWelcomeMessage() {
    const welcomeContainer = document.createElement('div');
    welcomeContainer.className = 'claude-welcome';
    welcomeContainer.setAttribute('role', 'region');
    welcomeContainer.setAttribute('aria-label', 'Welcome message');
    
    const title = document.createElement('h4');
    title.textContent = translate('welcome-title');
    
    const description = document.createElement('p');
    description.textContent = translate('welcome-intro');
    
    const suggestionLabel = document.createElement('p');
    suggestionLabel.className = 'claude-suggestion-label';
    suggestionLabel.textContent = translate('suggestion-heading');
    
    const suggestions = document.createElement('div');
    suggestions.className = 'claude-suggestions';
    suggestions.setAttribute('role', 'list');
    
    // Add suggestion chips
    getTranslatedQueries().forEach(query => {
      const chip = document.createElement('button');
      chip.className = 'claude-suggestion';
      chip.textContent = query;
      chip.setAttribute('role', 'listitem');
      chip.setAttribute('type', 'button');
      
      chip.addEventListener('click', function() {
        const queryInput = document.getElementById('queryInput');
        if (queryInput) {
          queryInput.value = query;
          document.getElementById('chatForm')?.dispatchEvent(new Event('submit'));
        }
      });
      
      suggestions.appendChild(chip);
    });
    
    welcomeContainer.appendChild(title);
    welcomeContainer.appendChild(description);
    welcomeContainer.appendChild(suggestionLabel);
    welcomeContainer.appendChild(suggestions);
    
    return welcomeContainer;
  }
  
  /**
   * Create a Claude-style source element with improved accessibility and UX
   */
  function createClaudeSourceElement(source, index) {
    const sourceElement = document.createElement('div');
    sourceElement.className = 'claude-source-item';
    sourceElement.setAttribute('data-video-id', source.video_id);
    sourceElement.setAttribute('role', 'article');
    
    const similarity = Math.round(source.similarity * 100);
    const videoUrl = `https://www.youtube.com/embed/${source.video_id}?start=${Math.floor(source.start_time)}`;
    
    // Format title and date for display
    const formattedTitle = formatSermonTitle(source.title);
    let formattedDate = 'Date unknown';
    if (source.publish_date) {
      formattedDate = formatSermonDate(source.publish_date);
    }
    
    // Create source header
    const header = document.createElement('div');
    header.className = 'claude-source-header';
    
    const title = document.createElement('div');
    title.className = 'claude-source-title';
    title.textContent = formattedTitle;
    
    const date = document.createElement('div');
    date.className = 'claude-source-date';
    date.textContent = formattedDate;
    
    header.appendChild(title);
    header.appendChild(date);
    
    // Create source content
    const content = document.createElement('div');
    content.className = 'claude-source-content';
    
    const text = document.createElement('div');
    text.className = 'claude-source-text';
    text.innerHTML = `"${formatText(source.text)}"`;
    
    const meta = document.createElement('div');
    meta.className = 'claude-source-meta';
    
    const timestamp = document.createElement('div');
    timestamp.className = 'claude-source-timestamp';
    timestamp.textContent = `Timestamp: ${formatTimestamp(source.start_time)}`;
    
    const match = document.createElement('div');
    match.className = 'claude-source-match';
    match.textContent = `${similarity}% match`;
    
    meta.appendChild(timestamp);
    meta.appendChild(match);
    
    // Create actions with improved mobile layout
    const actions = document.createElement('div');
    actions.className = 'claude-source-actions';
    
    const watchButtonId = `watch-btn-${source.video_id}`;
    const watchButton = document.createElement('button');
    watchButton.className = 'claude-source-button claude-source-button-primary';
    watchButton.textContent = translate('watch-video');
    watchButton.setAttribute('aria-controls', `video-${source.video_id}`);
    watchButton.setAttribute('aria-expanded', 'false');
    watchButton.id = watchButtonId;
    
    watchButton.onclick = function() {
      const videoContainer = document.getElementById(`video-${source.video_id}`);
      
      if (!videoContainer) {
        // Create video container if it doesn't exist
        const container = document.createElement('div');
        container.className = 'claude-video-container';
        container.id = `video-${source.video_id}`;
        
        // Use loading="lazy" for better performance
        container.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="Sermon video at ${formatTimestamp(source.start_time)}"></iframe>`;
        
        content.appendChild(container);
        this.textContent = translate('hide-video');
        this.setAttribute('aria-expanded', 'true');
      } else {
        // Toggle visibility
        if (videoContainer.style.display === 'none') {
          videoContainer.style.display = 'block';
          this.textContent = translate('hide-video');
          this.setAttribute('aria-expanded', 'true');
        } else {
          videoContainer.style.display = 'none';
          this.textContent = translate('watch-video');
          this.setAttribute('aria-expanded', 'false');
        }
      }
    };
    
    const transcriptButtonId = `transcript-btn-${source.video_id}`;
    const transcriptButton = document.createElement('button');
    transcriptButton.className = 'claude-source-button';
    transcriptButton.textContent = translate('view-transcript');
    transcriptButton.id = transcriptButtonId;
    transcriptButton.setAttribute('aria-controls', `transcript-${source.video_id}`);
    transcriptButton.setAttribute('aria-expanded', 'false');
    
    transcriptButton.onclick = function() {
      // Get video ID from parent element
      const videoId = this.closest('.claude-source-item').getAttribute('data-video-id');
      const startTime = source.start_time;
      
      // Look for existing transcript
      const transcriptContainer = document.getElementById(`transcript-${videoId}`);
      if (!transcriptContainer) {
        // Create transcript container if it doesn't exist
        const container = document.createElement('div');
        container.className = 'claude-transcript';
        container.id = `transcript-${videoId}`;
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Sermon transcript');
        container.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript')}</div>`;
        content.appendChild(container);
        
        // Fetch transcript
        fetchTranscript(videoId, startTime, container);
        
        this.textContent = translate('hide-transcript');
        this.setAttribute('aria-expanded', 'true');
      } else {
        // Toggle visibility
        if (transcriptContainer.style.display === 'none') {
          transcriptContainer.style.display = 'block';
          this.textContent = translate('hide-transcript');
          this.setAttribute('aria-expanded', 'true');
        } else {
          transcriptContainer.style.display = 'none';
          this.textContent = translate('view-transcript');
          this.setAttribute('aria-expanded', 'false');
        }
      }
    };
    
    const youtubeButton = document.createElement('a');
    youtubeButton.className = 'claude-source-button';
    youtubeButton.textContent = translate('open-youtube');
    youtubeButton.href = `https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}`;
    youtubeButton.target = '_blank';
    youtubeButton.rel = 'noopener noreferrer';
    youtubeButton.setAttribute('aria-label', `Open sermon on YouTube at ${formatTimestamp(source.start_time)}`);
    
    actions.appendChild(watchButton);
    actions.appendChild(transcriptButton);
    actions.appendChild(youtubeButton);
    
    // Assemble all components
    content.appendChild(text);
    content.appendChild(meta);
    content.appendChild(actions);
    
    // Create hidden video container with an ID for ARIA controls
    const videoContainer = document.createElement('div');
    videoContainer.className = 'claude-video-container';
    videoContainer.id = `video-${source.video_id}`;
    videoContainer.style.display = 'none';
    content.appendChild(videoContainer);
    
    sourceElement.appendChild(header);
    sourceElement.appendChild(content);
    
    return sourceElement;
  }
  
  /**
   * Enhanced transcript loading and display with improved UX
   */
  function fetchTranscript(videoId, startTime = 0, container) {
    if (!videoId || !container) return;
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'claude-transcript-loading';
    loadingElement.setAttribute('role', 'status');
    loadingElement.setAttribute('aria-live', 'polite');
    loadingElement.textContent = translate('loading-transcript');
    
    // Clear container and show loading indicator
    container.innerHTML = '';
    container.appendChild(loadingElement);
    
    // Use API URL from main script if available
    const apiUrl = window.API_URL || 'https://sermon-search-api-8fok.onrender.com';
    
    // Get current language from main script if available
    const language = window.currentLanguage || 'en';
    
    // Use fetch with timeout for better user experience
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 10000)
    );
    
    Promise.race([
      fetch(`${apiUrl}/transcript/${videoId}?language=${language}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Accept-Language': language
        },
        mode: 'cors'
      }),
      timeoutPromise
    ])
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Update container with transcript content
      updateClaudeTranscript(container, data, startTime);
    })
    .catch(error => {
      console.error('Error fetching transcript:', error);
      
      // Show error with retry option
      container.innerHTML = `
        <div class="transcript-error">
          <p>${error.message || 'Failed to load transcript'}</p>
          <button class="retry-button">Retry</button>
        </div>
      `;
      
      // Add retry functionality
      const retryButton = container.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          fetchTranscript(videoId, startTime, container);
        });
      }
    });
  }
  
  /**
   * Update transcript container with improved UI and accessibility
   */
  function updateClaudeTranscript(container, data, startTime) {
    if (!container) return;
    
    container.innerHTML = '';
    
    // Check if transcript data is valid
    if (!data || (!data.segments && !data.transcript)) {
      container.innerHTML = '<div class="claude-transcript-error">Transcript data not available</div>';
      return;
    }
    
    // If there's a note (like language unavailability), display it
    if (data.note) {
      const noteElement = document.createElement('div');
      noteElement.className = 'claude-transcript-note';
      noteElement.innerHTML = `<p><em>${data.note}</em></p>`;
      container.appendChild(noteElement);
    }
    
    // Add search functionality
    const searchContainer = document.createElement('div');
    searchContainer.className = 'claude-transcript-search';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'claude-transcript-search-input';
    searchInput.placeholder = 'Search in transcript...';
    
    const searchButton = document.createElement('button');
    searchButton.className = 'claude-transcript-search-button';
    searchButton.textContent = 'Search';
    searchButton.type = 'button';
    
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchButton);
    container.appendChild(searchContainer);
    
    const transcriptContent = document.createElement('div');
    transcriptContent.className = 'claude-transcript-content';
    transcriptContent.setAttribute('role', 'region');
    
    // Process segmented transcript with timestamps
    if (data.segments && Array.isArray(data.segments)) {
      // Add transcript info
      const infoElement = document.createElement('div');
      infoElement.className = 'claude-transcript-info';
      infoElement.textContent = `Full transcript (${data.segments.length} segments)`;
      container.appendChild(infoElement);
      
      // Add ability to download transcript
      const downloadButton = document.createElement('button');
      downloadButton.className = 'claude-transcript-download';
      downloadButton.textContent = 'Download';
      downloadButton.setAttribute('aria-label', 'Download transcript as text file');
      downloadButton.addEventListener('click', () => {
        downloadTranscript(data.segments, container.closest('.claude-source-item'));
      });
      
      searchContainer.appendChild(downloadButton);
      
      data.segments.forEach(segment => {
        // Skip gap segments
        if (segment.is_gap) {
          const gapElement = document.createElement('div');
          gapElement.className = 'claude-transcript-gap';
          gapElement.innerHTML = '[...]';
          transcriptContent.appendChild(gapElement);
          return;
        }
        
        const segmentElement = document.createElement('div');
        segmentElement.className = 'claude-transcript-segment';
        segmentElement.setAttribute('data-time', segment.start_time);
        
        // Highlight segments close to the start time
        if (Math.abs(segment.start_time - startTime) < 10) {
          segmentElement.classList.add('claude-transcript-highlight');
        }
        
        const timestampElement = document.createElement('div');
        timestampElement.className = 'claude-transcript-timestamp';
        timestampElement.textContent = formatTimestamp(segment.start_time);
        timestampElement.title = 'Click to jump to this timestamp';
        
        const textElement = document.createElement('div');
        textElement.className = 'claude-transcript-text';
        textElement.textContent = segment.text;
        
        segmentElement.appendChild(timestampElement);
        segmentElement.appendChild(textElement);
        transcriptContent.appendChild(segmentElement);
      });
      
      container.appendChild(transcriptContent);
      
      // Setup search functionality
      searchButton.addEventListener('click', () => {
        searchInTranscript(searchInput.value, transcriptContent);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          searchInTranscript(searchInput.value, transcriptContent);
        }
      });
      
      // Add timestamp click functionality
      setupTimestampClicks(container);
      
      // Scroll to highlighted segment
      setTimeout(() => {
        const highlight = container.querySelector('.claude-transcript-highlight');
        if (highlight) {
          highlight.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }, 100);
    } 
    else if (data.transcript) {
      // Handle plain text transcript
      transcriptContent.innerHTML = data.transcript
        .split('\n\n')
        .map(para => `<p>${para}</p>`)
        .join('');
      
      container.appendChild(transcriptContent);
    } 
    else {
      container.innerHTML = '<div class="claude-transcript-error">Transcript format unknown</div>';
    }
  }
  
  /**
   * Search within transcript content
   */
  function searchInTranscript(query, transcriptContent) {
    if (!query || !transcriptContent) return;
    
    // Clear previous highlights
    document.querySelectorAll('.transcript-highlight-text').forEach(el => {
      const textNode = document.createTextNode(el.textContent);
      el.parentNode.replaceChild(textNode, el);
    });
    
    if (!query.trim()) return;
    
    const segments = transcriptContent.querySelectorAll('.claude-transcript-segment');
    let matchCount = 0;
    
    segments.forEach(segment => {
      const textElement = segment.querySelector('.claude-transcript-text');
      if (!textElement) return;
      
      const text = textElement.textContent;
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      
      if (lowerText.includes(lowerQuery)) {
        matchCount++;
        
        // Highlight match
        const index = lowerText.indexOf(lowerQuery);
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        
        textElement.innerHTML = `${before}<span class="transcript-highlight-text">${match}</span>${after}`;
        
        // Add highlight class to segment for visibility
        segment.classList.add('search-result');
      }
    });
    
    // Display match count
    const countElement = document.createElement('div');
    countElement.className = 'claude-transcript-match-count';
    countElement.textContent = matchCount > 0 ? 
      `Found ${matchCount} match${matchCount > 1 ? 'es' : ''}` : 
      'No matches found';
    
    // Replace existing count or add new
    const existingCount = transcriptContent.parentElement.querySelector('.claude-transcript-match-count');
    if (existingCount) {
      existingCount.replaceWith(countElement);
    } else {
      transcriptContent.parentElement.insertBefore(countElement, transcriptContent);
    }
    
    // Scroll to first result
    if (matchCount > 0) {
      const firstResult = transcriptContent.querySelector('.search-result');
      if (firstResult) {
        firstResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  
  /**
   * Setup timestamp click handlers
   */
  function setupTimestampClicks(container) {
    const timestamps = container.querySelectorAll('.claude-transcript-timestamp');
    
    timestamps.forEach(timestamp => {
      timestamp.addEventListener('click', function() {
        const segment = this.closest('.claude-transcript-segment');
        if (segment) {
          const time = segment.getAttribute('data-time');
          if (time) {
            // Find the source item
            const sourceItem = container.closest('.claude-source-item');
            if (sourceItem) {
              const videoId = sourceItem.getAttribute('data-video-id');
              
              // Find or create video container
              let videoContainer = document.getElementById(`video-${videoId}`);
              if (!videoContainer || videoContainer.style.display === 'none') {
                // Click the watch button to show video
                const watchButton = sourceItem.querySelector('.claude-source-button-primary');
                if (watchButton) {
                  watchButton.click();
                  videoContainer = document.getElementById(`video-${videoId}`);
                }
              }
              
              // Update iframe src to the timestamp
              if (videoContainer) {
                const iframe = videoContainer.querySelector('iframe');
                if (iframe) {
                  const baseUrl = iframe.src.split('?')[0];
                  iframe.src = `${baseUrl}?start=${Math.floor(time)}&autoplay=1`;
                  
                  // Scroll to make video visible
                  videoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }
          }
        }
      });
    });
  }
  
  /**
   * Download transcript as a text file
   */
  function downloadTranscript(segments, sourceItem) {
    if (!segments || !segments.length) return;
    
    // Try to find sermon title
    let sermonTitle = "Unknown Sermon";
    let videoId = "unknown";
    
    if (sourceItem) {
      const titleElement = sourceItem.querySelector('.claude-source-title');
      if (titleElement) {
        sermonTitle = titleElement.textContent.trim();
      }
      
      videoId = sourceItem.getAttribute('data-video-id') || "unknown";
    }
    
    // Create text content
    let textContent = `${sermonTitle} (ID: ${videoId})\n\n`;
    textContent += `Downloaded: ${new Date().toLocaleString()}\n\n`;
    
    segments.forEach(segment => {
      if (segment.is_gap) {
        textContent += '[...]\n\n';
      } else {
        textContent += `[${formatTimestamp(segment.start_time)}] ${segment.text}\n\n`;
      }
    });
    
    // Create a blob with the text content
    const blob = new Blob([textContent], { type: 'text/plain' });
    
    // Create a safe filename
    const safeFileName = sermonTitle
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    // Create download link
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${safeFileName}-transcript.txt`;
    a.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    }, 100);
  }
  
  /**
   * Display welcome message with instructions
   */
  function displayClaudeWelcome() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    // Create welcome message element
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'claude-message claude-message-bot';
    welcomeMessage.setAttribute('role', 'article');
    
    const welcomeContent = document.createElement('div');
    welcomeContent.className = 'claude-message-content';
    welcomeContent.appendChild(createClaudeWelcomeMessage());
    
    welcomeMessage.appendChild(welcomeContent);
    messagesContainer.appendChild(welcomeMessage);
  }
  
  /**
   * Format Bible references in text
   */
/**
 * Safely escape HTML, then wrap any recognised Bible references
 * with <span class="claude-bible-reference">…</span>.
 *
 * @param {string} text – raw text from the transcript
 * @returns {string} – HTML-safe string with highlighted references
 */
function formatText(text) {
    if (!text) return '';
  
    // 1 · Escape dangerous markup
    const escaped = text
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  
    // 2 · Highlight Bible references
    const bibleReferenceRegex = getBibleReferenceRegex();
    return escaped.replace(
      bibleReferenceRegex,
      '<span class="claude-bible-reference">$&</span>'
    );
  }
  
  /**
   * Download an array of transcript segments as a plain-text file.
   *
   * @param {Array<Object>} segments – items with {start_time, text, is_gap}
   * @param {HTMLElement}   sourceItem – DOM element that holds meta-data
   */
  function downloadTranscript(segments, sourceItem) {
    if (!segments || !segments.length) return;
  
    // ── extract title & video-ID (fallbacks provided) ────────────────────
    let sermonTitle = 'Unknown Sermon';
    let videoId     = 'unknown';
  
    if (sourceItem) {
      const titleEl = sourceItem.querySelector('.claude-source-title');
      if (titleEl) sermonTitle = titleEl.textContent.trim();
      videoId = sourceItem.getAttribute('data-video-id') || videoId;
    }
  
    // ── build file contents ──────────────────────────────────────────────
    let textContent  = `${sermonTitle} (ID: ${videoId})\n\n`;
    textContent     += `Downloaded: ${new Date().toLocaleString()}\n\n`;
  
    segments.forEach(seg => {
      textContent += seg.is_gap
        ? '[...]\n\n'
        : `[${formatTimestamp(seg.start_time)}] ${seg.text}\n\n`;
    });
  
    // ── create & trigger download ────────────────────────────────────────
    const blob = new Blob([textContent], { type: 'text/plain' });
  
    const safeFileName = sermonTitle
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
  
    const a = document.createElement('a');
    a.href        = URL.createObjectURL(blob);
    a.download    = `${safeFileName}-transcript.txt`;
    a.style.display = 'none';
  
    document.body.appendChild(a);
    a.click();
  
    // ── tidy up ──────────────────────────────────────────────────────────
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    }, 100);
  }
  
  
  /**
   * Get Bible reference regex for the current language
   */
  function getBibleReferenceRegex() {
    // These regexes should match those in the main script
    const regexes = {
      en: /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi,
      
      es: /\b(Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Salmo|Proverbios|Eclesiastés|Cantares|Cantar de los Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis)\s+\d+(?::\d+(?:-\d+)?)?/gi,
      
      zh: /\b(创世记|出埃及记|利未记|民数记|申命记|约书亚记|士师记|路得记|撒母耳记上|撒母耳记下|列王纪上|列王纪下|历代志上|历代志下|以斯拉记|尼希米记|以斯帖记|约伯记|诗篇|箴言|传道书|雅歌|以赛亚书|耶利米书|耶利米哀歌|以西结书|但以理书|何西阿书|约珥书|阿摩司书|俄巴底亚书|约拿书|弥迦书|那鸿书|哈巴谷书|西番雅书|哈该书|撒迦利亚书|玛拉基书|马太福音|马可福音|路加福音|约翰福音|使徒行传|罗马书|哥林多前书|哥林多后书|加拉太书|以弗所书|腓立比书|歌罗西书|帖撒罗尼迦前书|帖撒罗尼迦后书|提摩太前书|提摩太后书|提多书|腓利门书|希伯来书|雅各书|彼得前书|彼得后书|约翰一书|约翰二书|约翰三书|犹大书|启示录)\s*\d+(?::\d+(?:-\d+)?)?/gi
    };
    
    // Get current language from main script, or fallback to English
    const language = window.currentLanguage || 'en';
    return regexes[language] || regexes.en;
  }
  
  /**
   * Make Bible references clickable
   */
  function setupBibleReferenceClicks(element) {
    if (!element) return;
    
    const bibleRefs = element.querySelectorAll('.claude-bible-reference');
    
    bibleRefs.forEach(ref => {
      ref.setAttribute('role', 'link');
      ref.setAttribute('tabindex', '0');
      
      // Handle both click and keyboard access
      ref.addEventListener('click', function() {
        openBibleReference(this.textContent.trim());
      });
      
      ref.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openBibleReference(this.textContent.trim());
        }
      });
    });
  }
  
  /**
   * Open Bible reference in appropriate Bible website
   */
  function openBibleReference(reference) {
    if (!reference) return;
    
    // Bible website configurations for different languages
    const bibleWebsites = {
      en: {
        site: "https://www.biblegateway.com/passage/",
        version: "KJV"
      },
      es: {
        site: "https://www.biblegateway.com/passage/",
        version: "RVR1960"
      },
      zh: {
        site: "https://www.biblegateway.com/passage/",
        version: "CUVS"
      }
    };
    
    // Get current language from main script
    const language = window.currentLanguage || 'en';
    const bibleConfig = bibleWebsites[language] || bibleWebsites.en;
    
    // Open in new tab
    window.open(`${bibleConfig.site}?search=${encodeURIComponent(reference)}&version=${bibleConfig.version}`, '_blank');
  }
  
  /**
   * Format sermon title for display
   */
  function formatSermonTitle(title) {
    if (!title) return 'Unknown Sermon';
    
    // Remove quotes and limit length for display
    return title
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Format date string from various formats
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
        if (isNaN(date.getTime())) {
          return 'Date unknown';
        }
        
        // Use locale-aware date formatting
        return new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      // Handle other formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      return String(dateStr);
    } catch (e) {
      console.error(`Error parsing date: ${dateStr}`, e);
      return 'Date unknown';
    }
  }
  
  /**
   * Format timestamp as MM:SS
   */
  function formatTimestamp(seconds) {
    if (!seconds && seconds !== 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Translate a key based on the available translations
   * Falls back to the key itself if translation not found
   */
  function translate(key) {
    // Use translation function from main script if available
    if (window.translate && typeof window.translate === 'function') {
      return window.translate(key);
    }
    
    // Hard-coded fallback translations for core UI elements
    const fallbackTranslations = {
      'welcome-title': 'Welcome to the Sermon Search Tool! 👋',
      'welcome-intro': 'Ask any question about the sermons, and I\'ll provide answers based on sermon content with timestamped video links.',
      'suggestion-heading': 'Try asking about:',
      'watch-video': 'Watch Video',
      'hide-video': 'Hide Video',
      'view-transcript': 'View Transcript',
      'hide-transcript': 'Hide Transcript',
      'loading-transcript': 'Loading transcript...',
      'open-youtube': 'Open in YouTube'
    };
    
    return fallbackTranslations[key] || key;
  }
  
  /**
   * Get translated sample queries
   */
  function getTranslatedQueries() {
    // Use function from main script if available
    if (window.getTranslatedQueries && typeof window.getTranslatedQueries === 'function') {
      return window.getTranslatedQueries();
    }
    
    // Fallback sample queries
    return [
      "How does a person get to heaven?",
      "What is the Trinity?",
      "How should Christians live?",
      "What does the Bible say about faith?",
      "How do I understand God's will?"
    ];
  }
  
  // Auto-resize input on first load
  if (queryInput) {
    setTimeout(() => {
      queryInput.style.height = 'auto';
      queryInput.style.height = Math.min(queryInput.scrollHeight, 200) + 'px';
      queryInput.focus();
    }, 500);
  }
  
  // If isFirstLoad is true, show welcome message in Claude style
  if (window.isFirstLoad) {
    // Clear existing welcome message if any
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    
    // Display Claude-style welcome
    displayClaudeWelcome();
    window.isFirstLoad = false;
  }
  
  // Set up accessibility keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Escape key to close sources panel
    if (e.key === 'Escape' && sourcesPanel && sourcesPanel.classList.contains('active')) {
      hideSourcesPanel();
    }
    
    // Ctrl+/ or Cmd+/ to focus search input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      if (queryInput) {
        queryInput.focus();
      }
    }
  });
  
  // Make video and transcript buttons available globally
  window.toggleVideo = function(button) {
    if (!button) return;
    
    const videoId = button.closest('.claude-source-item')?.getAttribute('data-video-id');
    if (!videoId) return;
    
    const videoContainer = document.getElementById(`video-${videoId}`);
    if (!videoContainer) return;
    
    const isHidden = videoContainer.style.display === 'none';
    videoContainer.style.display = isHidden ? 'block' : 'none';
    
    button.textContent = isHidden ? translate('hide-video') : translate('watch-video');
    button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    
    if (isHidden) {
      setTimeout(() => {
        videoContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };
  
  window.toggleTranscript = function(videoId, startTime) {
    if (!videoId) return;
    
    const transcriptContainer = document.getElementById(`transcript-${videoId}`);
    const button = document.querySelector(`.claude-source-button[onclick*="toggleTranscript('${videoId}')"]`);
    
    if (!transcriptContainer) {
      // Find the source item
      const sourceItem = document.querySelector(`.claude-source-item[data-video-id="${videoId}"]`);
      if (!sourceItem) return;
      
      // Create new container
      const container = document.createElement('div');
      container.className = 'claude-transcript';
      container.id = `transcript-${videoId}`;
      container.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript')}</div>`;
      
      // Append to source content
      const content = sourceItem.querySelector('.claude-source-content');
      if (content) {
        content.appendChild(container);
      } else {
        sourceItem.appendChild(container);
      }
      
      // Fetch transcript
      fetchTranscript(videoId, startTime, container);
      
      // Update button
      if (button) {
        button.textContent = translate('hide-transcript');
        button.setAttribute('aria-expanded', 'true');
      }
    } else {
      // Toggle visibility
      const isHidden = transcriptContainer.style.display === 'none';
      transcriptContainer.style.display = isHidden ? 'block' : 'none';
      
      // Update button
      if (button) {
        button.textContent = isHidden ? translate('hide-transcript') : translate('view-transcript');
        button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      }
      
      // Scroll if showing
      if (isHidden) {
        setTimeout(() => {
          transcriptContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };
  
  console.log('Enhanced Claude-style interface initialized');
}