/**
 * Enhanced Sermon Chat Interface
 * - Converts sources panel to a modal
 * - Adds help modal
 * - Improves mobile experience
 * - Makes video and transcript viewing better
 */

document.addEventListener('DOMContentLoaded', function() {
    initEnhancedSermonChat();
  });
  
  function initEnhancedSermonChat() {
    console.log('Initializing enhanced sermon chat interface...');
    
    // Create modals container if it doesn't exist
    if (!document.getElementById('modals-container')) {
      const modalsContainer = document.createElement('div');
      modalsContainer.id = 'modals-container';
      document.body.appendChild(modalsContainer);
    }
    
    // Create help button and modal
    createHelpButton();
    createHelpModal();
    
    // Convert sources panel to modal
    convertSourcesPanel();
    
    // Override the functions we need to modify
    overrideDisplayAnswer();
    overrideToggleVideo();
    overrideToggleTranscript();
    
    // Add any needed event listeners
    setupEventListeners();
    
    console.log('Enhanced sermon chat interface initialized');
  }
  
  /**
   * Create floating help button
   */
  function createHelpButton() {
    const helpButton = document.createElement('button');
    helpButton.className = 'help-button';
    helpButton.innerHTML = '?';
    helpButton.setAttribute('aria-label', 'Help');
    helpButton.setAttribute('title', 'About This Tool');
    
    helpButton.addEventListener('click', function() {
      const helpModal = document.getElementById('help-modal');
      if (helpModal) {
        openModal(helpModal);
      }
    });
    
    document.body.appendChild(helpButton);
  }
  
  /**
   * Create help modal with the "About This Tool" content
   */
  function createHelpModal() {
    // Create help modal structure
    const helpModal = document.createElement('div');
    helpModal.id = 'help-modal';
    helpModal.className = 'help-modal';
    
    // Get translations for the content
    const title = getTranslation('about-tool', 'About This Tool');
    const explanation = getTranslation('search-explanation', 'This search tool uses artificial intelligence to analyze sermon transcripts and provide relevant information.');
    const aiFeatures = getTranslation('ai-features', 'When you ask a question, the AI will:');
    const feature1 = getTranslation('feature-1', 'Search through the entire sermon library');
    const feature2 = getTranslation('feature-2', 'Find the most relevant content to your question');
    const feature3 = getTranslation('feature-3', 'Provide direct links to video timestamps');
    const feature4 = getTranslation('feature-4', 'Show you the exact context where information was found');
    const answersSource = getTranslation('answers-source', 'All answers are based solely on the pastor\'s actual sermon content.');
    
    // Create the modal content
    helpModal.innerHTML = `
      <div class="help-modal-content">
        <div class="help-modal-header">
          <h2 class="help-modal-title">${title}</h2>
          <button class="help-modal-close" aria-label="Close help">&times;</button>
        </div>
        <div class="help-modal-body">
          <p>${explanation}</p>
          <p>${aiFeatures}</p>
          <ul>
            <li>${feature1}</li>
            <li>${feature2}</li>
            <li>${feature3}</li>
            <li>${feature4}</li>
          </ul>
          <p>${answersSource}</p>
        </div>
      </div>
    `;
    
    // Add click event to close button
    helpModal.querySelector('.help-modal-close').addEventListener('click', function() {
      closeModal(helpModal);
    });
    
    // Add click event to close when clicking outside modal
    helpModal.addEventListener('click', function(e) {
      if (e.target === helpModal) {
        closeModal(helpModal);
      }
    });
    
    // Add to modals container
    document.getElementById('modals-container').appendChild(helpModal);
  }
  
  /**
   * Convert the existing sources panel to a modal
   */
  function convertSourcesPanel() {
    // Get the original sources panel
    const originalSourcesPanel = document.getElementById('sourcesPanel');
    const originalSourcesContent = document.getElementById('sourcesPanelContent');
    
    if (!originalSourcesPanel || !originalSourcesContent) {
      console.error('Sources panel elements not found');
      return;
    }
    
    // Create new sources modal
    const sourcesModal = document.createElement('div');
    sourcesModal.id = 'sources-modal';
    sourcesModal.className = 'sources-modal';
    
    // Create structure
    sourcesModal.innerHTML = `
      <div class="sources-modal-content">
        <div class="sources-modal-header">
          <h2 class="sources-modal-title">${getTranslation('sources-found', 'Sources Found')} <span class="sources-count">0</span></h2>
          <button class="sources-modal-close" aria-label="Close sources">&times;</button>
        </div>
        <div class="sources-modal-body" id="sources-modal-body"></div>
      </div>
    `;
    
    // Add close button event
    sourcesModal.querySelector('.sources-modal-close').addEventListener('click', function() {
      closeModal(sourcesModal);
      
      // Also update any active source toggle buttons
      const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
      activeToggles.forEach(toggle => {
        toggle.setAttribute('data-active', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + getTranslation('show-sources', 'Show Sources');
      });
    });
    
    // Add click event to close when clicking outside modal
    sourcesModal.addEventListener('click', function(e) {
      if (e.target === sourcesModal) {
        closeModal(sourcesModal);
        
        // Also update any active source toggle buttons
        const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
        activeToggles.forEach(toggle => {
          toggle.setAttribute('data-active', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + getTranslation('show-sources', 'Show Sources');
        });
      }
    });
    
    // Add to modals container
    document.getElementById('modals-container').appendChild(sourcesModal);
    
    // Hide the original panel (but keep it in DOM for compatibility)
    originalSourcesPanel.style.display = 'none';
  }
  
  /**
   * Override the displayAnswer function to use our modal instead of the panel
   */
  function overrideDisplayAnswer() {
    // Store the original function
    const originalDisplayAnswer = window.displayAnswer;
    
    // Replace with our enhanced version
    window.displayAnswer = function(data) {
      if (!data || !data.answer) {
        console.error('Invalid data received from API');
        addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
        return;
      }
      
      // Check if there are any sermon sources
      const hasSermonContent = data.sources && data.sources.length > 0;
      
      // If no sermon content but we have conversation history, use the fallback logic
      if (!hasSermonContent && data.answer.includes(getTranslation('no-results', 'No relevant sermon content found')) && conversationHistory && conversationHistory.length > 0) {
        if (originalDisplayAnswer) {
          return originalDisplayAnswer(data);
        }
        return;
      }
      
      // Add the answer message
      const messageElement = addMessage(data.answer, 'bot');
      
      // Display sources in the modal if available
      if (hasSermonContent) {
        try {
          // Get our sources modal
          const sourcesModal = document.getElementById('sources-modal');
          const sourcesModalBody = document.getElementById('sources-modal-body');
          const sourcesCountElement = sourcesModal.querySelector('.sources-count');
          
          // Clear previous sources
          sourcesModalBody.innerHTML = '';
          
          // Update source count
          sourcesCountElement.textContent = data.sources.length;
          
          // Sort sources by similarity score
          const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
          
          // Add sources to modal
          sortedSources.forEach((source, index) => {
            const sourceElement = createEnhancedSourceElement(source, index);
            sourcesModalBody.appendChild(sourceElement);
          });
          
          // Add sources toggle button to the bot message
          const sourcesToggle = document.createElement('button');
          sourcesToggle.className = 'claude-sources-toggle';
          sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + getTranslation('show-sources', 'Show Sources');
          sourcesToggle.setAttribute('data-active', 'false');
          sourcesToggle.setAttribute('aria-expanded', 'false');
          sourcesToggle.setAttribute('aria-controls', 'sources-modal');
          
          sourcesToggle.addEventListener('click', function() {
            const isActive = this.getAttribute('data-active') === 'true';
            
            if (isActive) {
              closeModal(sourcesModal);
              this.setAttribute('data-active', 'false');
              this.setAttribute('aria-expanded', 'false');
              this.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + getTranslation('show-sources', 'Show Sources');
            } else {
              openModal(sourcesModal);
              this.setAttribute('data-active', 'true');
              this.setAttribute('aria-expanded', 'true');
              this.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> ' + getTranslation('hide-sources', 'Hide Sources');
            }
          });
          
          // Add the toggle button to the message
          if (messageElement && messageElement.querySelector) {
            const messageContent = messageElement.querySelector('.claude-message-content');
            if (messageContent) {
              messageContent.appendChild(sourcesToggle);
            } else {
              messageElement.appendChild(sourcesToggle);
            }
          }
          
          // Auto-open sources modal for first answer with animation delay
          if (conversationHistory && conversationHistory.length <= 2) {
            setTimeout(() => {
              openModal(sourcesModal);
              sourcesToggle.setAttribute('data-active', 'true');
              sourcesToggle.setAttribute('aria-expanded', 'true');
              sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> ' + getTranslation('hide-sources', 'Hide Sources');
            }, 1000);
          }
          
          // Add to conversation history
          if (window.conversationHistory) {
            window.conversationHistory.push({ role: 'assistant', content: data.answer });
          }
          
        } catch (error) {
          console.error('Error displaying sources:', error);
          // Continue without displaying sources
          
          // Still add to conversation history
          if (window.conversationHistory) {
            window.conversationHistory.push({ role: 'assistant', content: data.answer });
          }
        }
      } else {
        // Add to conversation history
        if (window.conversationHistory) {
          window.conversationHistory.push({ role: 'assistant', content: data.answer });
        }
      }
    };
  }
  
  /**
   * Create an enhanced source element for the modal
   */
  function createEnhancedSourceElement(source, index) {
    const sourceElement = document.createElement('div');
    sourceElement.className = 'source-item';
    sourceElement.setAttribute('data-video-id', source.video_id);
    
    // Add ARIA attributes for accessibility
    sourceElement.setAttribute('role', 'region');
    sourceElement.setAttribute('aria-label', 'Sermon source ' + (index + 1));
    
    const similarity = Math.round(source.similarity * 100);
    
    // Format title and date for display
    const formattedTitle = formatSermonTitle ? formatSermonTitle(source.title) : (source.title || 'Unknown Sermon');
    let formattedDate = 'Date unknown';
    if (source.publish_date) {
      formattedDate = formatSermonDate ? formatSermonDate(source.publish_date) : source.publish_date;
    }
    
    // Create source HTML
    sourceElement.innerHTML = `
      <div class="source-item-header">
        <h3 class="source-item-title">${formattedTitle}</h3>
        <div class="source-item-date">${formattedDate}</div>
      </div>
      <div class="source-item-content">
        <div class="source-item-text" id="source-text-${index}">
          "${escapeHTML(source.text)}"
        </div>
        <button class="source-item-expand" data-target="source-text-${index}">
          ${getTranslation('read-more', 'Read More')}
        </button>
        <div class="source-item-meta">
          <div class="source-item-timestamp">${formatTimestamp ? formatTimestamp(source.start_time) : source.start_time}</div>
          <div class="source-item-match">${similarity}% ${getTranslation('match', 'match')}</div>
        </div>
        <div class="source-actions">
          <button class="btn-primary btn-watch" onclick="openVideoModal('${source.video_id}', ${Math.floor(source.start_time)}, '${escapeHTML(formattedTitle)}')">
            ${getTranslation('watch-video', 'Watch Video')}
          </button>
          <button class="btn-secondary btn-transcript" onclick="openTranscriptModal('${source.video_id}', ${source.start_time}, '${escapeHTML(formattedTitle)}')">
            ${getTranslation('view-transcript', 'View Transcript')}
          </button>
          <button class="btn-secondary btn-youtube" onclick="window.open('https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}', '_blank')">
            ${getTranslation('open-youtube', 'Open YouTube')}
          </button>
        </div>
      </div>
    `;
    
    // Add expand/collapse functionality for source text
    const expandButton = sourceElement.querySelector('.source-item-expand');
    expandButton.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const textElement = document.getElementById(targetId);
      
      if (textElement.classList.contains('expanded')) {
        textElement.classList.remove('expanded');
        this.textContent = getTranslation('read-more', 'Read More');
      } else {
        textElement.classList.add('expanded');
        this.textContent = getTranslation('read-less', 'Read Less');
      }
    });
    
    return sourceElement;
  }
  
  /**
   * Override the original toggleVideo function to use modals
   */
  function overrideToggleVideo() {
    // Make sure we create the video modal first
    createVideoModal();
    
    // Override the original function
    window.toggleVideo = function(button) {
      try {
        if (!button || !button.parentElement) {
          console.error('Invalid button element for toggleVideo');
          return;
        }
        
        const sourceContainer = button.closest('.source-container, .source-item');
        if (!sourceContainer) {
          console.error('Could not find source container');
          return;
        }
        
        const videoId = sourceContainer.getAttribute('data-video-id');
        if (!videoId) {
          console.error('No video ID found');
          return;
        }
        
        // Get the start time and title
        let startTime = 0;
        const timeElement = sourceContainer.querySelector('.source-timestamp, .source-item-timestamp');
        if (timeElement) {
          const timeText = timeElement.textContent.trim();
          const timeParts = timeText.split(':');
          if (timeParts.length === 2) {
            startTime = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
          }
        }
        
        let title = '';
        const titleElement = sourceContainer.querySelector('.source-title, .source-item-title');
        if (titleElement) {
          title = titleElement.textContent.trim();
        }
        
        // Open video modal
        openVideoModal(videoId, startTime, title);
      } catch (error) {
        console.error('Error in toggleVideo:', error);
      }
    };
  }
  
  /**
   * Create a video modal
   */
  function createVideoModal() {
    // Check if it already exists
    if (document.getElementById('video-modal')) {
      return;
    }
    
    // Create modal structure
    const videoModal = document.createElement('div');
    videoModal.id = 'video-modal';
    videoModal.className = 'video-modal';
    
    videoModal.innerHTML = `
      <div class="video-modal-content">
        <div class="video-modal-header">
          <h2 class="video-modal-title"></h2>
          <button class="video-modal-close" aria-label="Close video">&times;</button>
        </div>
        <div class="video-container" id="video-container"></div>
      </div>
    `;
    
    // Add close button event
    videoModal.querySelector('.video-modal-close').addEventListener('click', function() {
      closeModal(videoModal);
    });
    
    // Add click event to close when clicking outside content
    videoModal.addEventListener('click', function(e) {
      if (e.target === videoModal) {
        closeModal(videoModal);
      }
    });
    
    // Add to modals container
    document.getElementById('modals-container').appendChild(videoModal);
  }
  
  /**
   * Open video modal with specific video
   */
  function openVideoModal(videoId, startTime, title) {
    const videoModal = document.getElementById('video-modal');
    if (!videoModal) {
      console.error('Video modal not found');
      return;
    }
    
    // Update title
    const titleElement = videoModal.querySelector('.video-modal-title');
    if (titleElement) {
      titleElement.textContent = title || 'Sermon Video';
    }
    
    // Update video container
    const videoContainer = document.getElementById('video-container');
    if (videoContainer) {
      videoContainer.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen 
          title="${title ? 'Video: ' + title : 'Sermon video'}"
        ></iframe>
      `;
    }
    
    // Open modal
    openModal(videoModal);
    
    // Make the iframe accessible
    setTimeout(() => {
      const iframe = videoContainer.querySelector('iframe');
      if (iframe) {
        iframe.focus();
      }
    }, 300);
    
    // Define this function globally
    window.openVideoModal = openVideoModal;
  }
  
  /**
   * Override the original toggleTranscript function to use modals
   */
  function overrideToggleTranscript() {
    // Make sure we create the transcript modal first
    createTranscriptModal();
    
    // Override the original function
    window.toggleTranscript = function(videoId, startTime = 0) {
      try {
        if (!videoId) {
          console.error('Invalid videoId for toggleTranscript');
          return;
        }
        
        // Get the title if possible
        let title = '';
        const sourceContainer = document.querySelector(`.source-container[data-video-id="${videoId}"], .source-item[data-video-id="${videoId}"]`);
        if (sourceContainer) {
          const titleElement = sourceContainer.querySelector('.source-title, .source-item-title');
          if (titleElement) {
            title = titleElement.textContent.trim();
          }
        }
        
        // Open transcript modal
        openTranscriptModal(videoId, startTime, title);
      } catch (error) {
        console.error('Error in toggleTranscript:', error);
      }
    };
  }
  
  /**
   * Create a transcript modal
   */
  function createTranscriptModal() {
    // Check if it already exists
    if (document.getElementById('transcript-modal')) {
      return;
    }
    
    // Create modal structure
    const transcriptModal = document.createElement('div');
    transcriptModal.id = 'transcript-modal';
    transcriptModal.className = 'transcript-modal';
    
    transcriptModal.innerHTML = `
      <div class="transcript-modal-content">
        <div class="transcript-modal-header">
          <h2 class="transcript-modal-title"></h2>
          <button class="transcript-modal-close" aria-label="Close transcript">&times;</button>
        </div>
        <div class="transcript-modal-body">
          <div class="transcript-search">
            <input type="text" class="transcript-search-input" placeholder="${getTranslation('search-in-transcript', 'Search in transcript')}..." aria-label="${getTranslation('search-in-transcript', 'Search in transcript')}">
            <button class="transcript-search-button">${getTranslation('search', 'Search')}</button>
          </div>
          <div class="transcript-container" id="transcript-container">
            <div class="transcript-loading">${getTranslation('loading-transcript', 'Loading transcript...')}</div>
          </div>
        </div>
      </div>
    `;
    
    // Add close button event
    transcriptModal.querySelector('.transcript-modal-close').addEventListener('click', function() {
      closeModal(transcriptModal);
    });
    
    // Add click event to close when clicking outside content
    transcriptModal.addEventListener('click', function(e) {
      if (e.target === transcriptModal) {
        closeModal(transcriptModal);
      }
    });
    
    // Add to modals container
    document.getElementById('modals-container').appendChild(transcriptModal);
  }
  
  /**
   * Open transcript modal and load transcript
   */
  function openTranscriptModal(videoId, startTime, title) {
    const transcriptModal = document.getElementById('transcript-modal');
    if (!transcriptModal) {
      console.error('Transcript modal not found');
      return;
    }
    
    // Update title
    const titleElement = transcriptModal.querySelector('.transcript-modal-title');
    if (titleElement) {
      titleElement.textContent = title ? title + ' - Transcript' : 'Sermon Transcript';
    }
    
    // Clear and show loading in container
    const transcriptContainer = document.getElementById('transcript-container');
    if (transcriptContainer) {
      transcriptContainer.innerHTML = `<div class="transcript-loading">${getTranslation('loading-transcript', 'Loading transcript...')}</div>`;
    }
    
    // Open modal
    openModal(transcriptModal);
    
    // Set up search functionality
    const searchInput = transcriptModal.querySelector('.transcript-search-input');
    const searchButton = transcriptModal.querySelector('.transcript-search-button');
    
    if (searchInput && searchButton) {
      // Clear previous event listeners
      searchButton.replaceWith(searchButton.cloneNode(true));
      searchInput.replaceWith(searchInput.cloneNode(true));
      
      // Get fresh references
      const newSearchInput = transcriptModal.querySelector('.transcript-search-input');
      const newSearchButton = transcriptModal.querySelector('.transcript-search-button');
      
      // Add event listeners
      newSearchButton.addEventListener('click', function() {
        searchInTranscript(newSearchInput.value, transcriptContainer);
      });
      
      newSearchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          searchInTranscript(newSearchInput.value, transcriptContainer);
        }
      });
      
      // Focus on search input
      setTimeout(() => {
        newSearchInput.focus();
      }, 300);
    }
    
    // Fetch transcript from API
    fetchTranscript(videoId, startTime).then(data => {
      displayTranscript(data, startTime, transcriptContainer);
    }).catch(error => {
      transcriptContainer.innerHTML = `
        <div class="transcript-error">
          Error loading transcript: ${error.message}
        </div>
      `;
    });
    
    // Define this function globally
    window.openTranscriptModal = openTranscriptModal;
  }
  
  /**
   * Fetch transcript from API
   */
  async function fetchTranscript(videoId, startTime = 0) {
    try {
      console.log(`Fetching transcript for video ${videoId}`);
      
      // Use the original API URL if available
      const apiUrl = window.API_URL || 'https://sermon-search-api-8fok.onrender.com';
      const language = window.currentLanguage || 'en';
      
      const response = await fetch(`${apiUrl}/transcript/${videoId}?language=${language}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Accept-Language': language
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received transcript data');
      
      return data;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }
  }
  
  /**
   * Display transcript in the container
   */
  function displayTranscript(data, startTime, container) {
    if (!container || !data) {
      console.error('Missing container or data for transcript display');
      return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Check if transcript data is valid
    if (!data.segments && !data.transcript) {
      container.innerHTML = '<div class="transcript-error">Transcript data not available</div>';
      return;
    }
    
    // If there's a note (like language unavailability), display it
    if (data.note) {
      const noteElement = document.createElement('div');
      noteElement.className = 'transcript-note';
      noteElement.innerHTML = `<p><em>${data.note}</em></p>`;
      container.appendChild(noteElement);
    }
    
    // Process segmented transcript with timestamps
    if (data.segments && Array.isArray(data.segments)) {
      let highlightedSegment = null;
      
      data.segments.forEach((segment, index) => {
        // Skip gap segments
        if (segment.is_gap) {
          const gapElement = document.createElement('div');
          gapElement.className = 'transcript-gap';
          gapElement.innerHTML = '[...]';
          container.appendChild(gapElement);
          return;
        }
        
        const segmentElement = document.createElement('div');
        segmentElement.className = 'transcript-segment';
        segmentElement.id = `transcript-segment-${index}`;
        segmentElement.setAttribute('data-time', segment.start_time);
        
        // Highlight segments close to the start time
        if (Math.abs(segment.start_time - startTime) < 10) {
          segmentElement.classList.add('transcript-highlight');
          highlightedSegment = segmentElement;
        }
        
        const timestampElement = document.createElement('div');
        timestampElement.className = 'transcript-timestamp';
        timestampElement.textContent = formatTimestamp ? formatTimestamp(segment.start_time) : segment.start_time;
        timestampElement.setAttribute('role', 'button');
        timestampElement.setAttribute('tabindex', '0');
        timestampElement.setAttribute('aria-label', `Jump to ${formatTimestamp ? formatTimestamp(segment.start_time) : segment.start_time}`);
        
        // Make timestamp clickable - opens video at timestamp
        timestampElement.addEventListener('click', function() {
          const videoId = document.querySelector('.source-item[data-video-id]')?.getAttribute('data-video-id');
          if (videoId) {
            openVideoModal(videoId, Math.floor(segment.start_time), '');
          }
        });
        
        const textElement = document.createElement('div');
        textElement.className = 'transcript-text';
        textElement.textContent = segment.text;
        
        segmentElement.appendChild(timestampElement);
        segmentElement.appendChild(textElement);
        container.appendChild(segmentElement);
      });
      
      // Scroll to highlighted segment
      if (highlightedSegment) {
        setTimeout(() => {
          highlightedSegment.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
    else if (data.transcript) {
      // Handle plain text transcript
      const textContainer = document.createElement('div');
      textContainer.className = 'transcript-plain-text';
      textContainer.innerHTML = data.transcript
        .split('\n\n')
        .map(para => `<p>${para}</p>`)
        .join('');
      
      container.appendChild(textContainer);
    } 
    else {
      container.innerHTML = '<div class="transcript-error">Transcript format unknown</div>';
    }
  }
  
  /**
   * Search within a transcript
   */
  function searchInTranscript(query, container) {
    if (!query || !container) return;
    
    // Remove existing highlights
    const existingHighlights = container.querySelectorAll('.transcript-highlight');
    existingHighlights.forEach(el => {
      el.classList.remove('transcript-highlight');
    });
    
    // Remove existing search highlights
    container.querySelectorAll('span.search-highlight').forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
    
    // Remove existing match count
    const existingCount = container.querySelector('.transcript-match-count');
    if (existingCount) {
      existingCount.remove();
    }
    
    if (!query.trim()) return;
    
    try {
      // Create a case-insensitive regex
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\function searchInTranscript(query, container) {
    if (!query || !container) return;
    
    // Remove existing highlights
    const existingHighlights = container.querySelectorAll('.transcript-highlight');
    existingHighlights.forEach(el => {
      el.classList.remove('transcript-highlight');
    });
    
    // Remove existing search highlights
    container.querySelectorAll('span.search-highlight').forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    });
    
    // Remove existing match count
    const existingCount = container.querySelector('.transcript-match-count');
    if (existingCount) {
      existingCount.remove();
    }
    
    if (!query.trim()) return;
    
    try {
      // Create a case-insensitive regex
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const textElements = container.querySelectorAll('.transcript-text');
      let matchCount = 0;
      let firstMatchElement = null;
      
      textElements.forEach(textElement => {
        const originalText = textElement.textContent;
        let match;
        let lastIndex = 0;
        let hasMatches = false;
        let newHtml = '';
        
        while ((match = regex.exec(originalText)) !== null) {
          hasMatches = true;
          matchCount++;
          
          if (!firstMatchElement) {
            firstMatchElement = textElement.parentNode;
          }
          
          // Add text before match
          newHtml += originalText.substring(lastIndex, match.index);
          
          // Add highlighted match
          newHtml += `<span class="search-highlight">${match[0]}</span>`;
          
          // Update lastIndex
          lastIndex = regex.lastIndex;
        }
        
        // Add remaining text
        if (lastIndex < originalText.length) {
          newHtml += originalText.substring(lastIndex);
        }
        
        // Update text'), 'gi');
      const textElements = container.querySelectorAll('.transcript-text');
      let matchCount = 0;
      let firstMatchElement = null;
      
      textElements.forEach(textElement => {
        const originalText = textElement.textContent;
        let match;
        let lastIndex = 0;
        let hasMatches = false;
        let newHtml = '';
        
        while ((match = regex.exec(originalText)) !== null) {
          hasMatches = true;
          matchCount++;
          
          if (!firstMatchElement) {
            firstMatchElement = textElement.parentNode;
          }
          
          // Add text before match
          newHtml += originalText.substring(lastIndex, match.index);
          
          // Add highlighted match
          newHtml += `<span class="search-highlight">${match[0]}</span>`;
          
          // Update lastIndex
          lastIndex = regex.lastIndex;
        }
        
        // Add remaining text
        if (lastIndex < originalText.length) {
          newHtml += originalText.substring(lastIndex);
        }
        
        // Update text element if matches found
        if (hasMatches) {
          textElement.innerHTML = newHtml;
        }
      });
      
      // Add match count
      const matchCountElement = document.createElement('div');
      matchCountElement.className = 'transcript-match-count';
      matchCountElement.textContent = matchCount > 0 
        ? `${matchCount} ${getTranslation('matches-found', 'matches found')}` 
        : `${getTranslation('no-matches-found', 'No matches found')}`;
      
      // Insert match count at the top
      container.insertBefore(matchCountElement, container.firstChild);
      
      // Scroll to first match
      if (firstMatchElement) {
        firstMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Error in transcript search:', error);
      
      const errorElement = document.createElement('div');
      errorElement.className = 'transcript-error';
      errorElement.textContent = `Search error: ${error.message}`;
      container.insertBefore(errorElement, container.firstChild);
    }
  }
  
  /**
   * Utility function to get translation for a key
   */
  function getTranslation(key, defaultText) {
    // Try to use existing translation function if available
    if (window.translate && typeof window.translate === 'function') {
      return window.translate(key);
    }
    
    // Try to get translations from existing translations object
    if (window.translations && window.currentLanguage && window.translations[window.currentLanguage]) {
      return window.translations[window.currentLanguage][key] || defaultText;
    }
    
    return defaultText;
  }
  
  /**
   * Utility function to escape HTML for safety
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
   * Open a modal with animation
   */
  function openModal(modal) {
    if (!modal) return;
    
    // Make chat interface full width
    document.querySelector('.claude-interface')?.classList.add('chat-full-width');
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Trigger animation
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // Add keyboard handling
    document.addEventListener('keydown', handleModalKeyDown);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Set focus to first focusable element
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
      setTimeout(() => {
        focusableElements[0].focus();
      }, 100);
    }
  }
  
  /**
   * Close a modal with animation
   */
  function closeModal(modal) {
    if (!modal) return;
    
    // Trigger animation
    modal.classList.remove('active');
    
    // Remove after animation
    setTimeout(() => {
      modal.style.display = 'none';
      
      // Return chat interface to normal width
      document.querySelector('.claude-interface')?.classList.remove('chat-full-width');
      
      // Only restore body scrolling if no other modals are active
      const activeModals = document.querySelectorAll('.sources-modal.active, .help-modal.active, .video-modal.active, .transcript-modal.active');
      if (activeModals.length === 0) {
        document.body.style.overflow = '';
      }
    }, 300);
    
    // Remove keyboard handler if no other modals are active
    const activeModals = document.querySelectorAll('.sources-modal.active, .help-modal.active, .video-modal.active, .transcript-modal.active');
    if (activeModals.length <= 1) {
      document.removeEventListener('keydown', handleModalKeyDown);
    }
  }
  
  /**
   * Handle keyboard interactions for modals
   */
  function handleModalKeyDown(e) {
    if (e.key === 'Escape') {
      // Find the active modal
      const activeModal = document.querySelector('.sources-modal.active, .help-modal.active, .video-modal.active, .transcript-modal.active');
      if (activeModal) {
        closeModal(activeModal);
      }
    }
  }
  
  /**
   * Setup all necessary event listeners
   */
  function setupEventListeners() {
    // Global ESC key handling
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.sources-modal.active, .help-modal.active, .video-modal.active, .transcript-modal.active');
        if (activeModal) {
          closeModal(activeModal);
        }
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
      // Adjust modal positions or sizes if needed
      const activeModals = document.querySelectorAll('.sources-modal.active, .help-modal.active, .video-modal.active, .transcript-modal.active');
      activeModals.forEach(modal => {
        const content = modal.querySelector('.sources-modal-content, .help-modal-content, .video-modal-content, .transcript-modal-content');
        if (content) {
          // Ensure content is centered if needed
          content.style.maxHeight = (window.innerHeight * 0.9) + 'px';
        }
      });
    });
  }
  
  // Make important functions globally available
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.openVideoModal = openVideoModal;
  window.openTranscriptModal = openTranscriptModal;