/**
 * SermonSearch - Main application for searching and displaying sermon content
 * Fellowship Digital Ministry
 */

/**
 * API Connection Module
 * This handles all API connections with proper error handling
 */
const SermonAPI = {
  // Base URL from Jekyll config with fallback
  baseUrl: '{{ site.api_url }}' || 'https://sermon-search-api-8fok.onrender.com',
  
  /**
   * Verify API connection
   * @param {boolean} showFeedback - Whether to show feedback to the user
   * @returns {Promise<boolean>} - Whether the connection was successful
   */
  async verifyConnection(showFeedback = false) {
    console.log('Verifying API connection to:', this.baseUrl);
    
    // Show checking message if feedback is requested
    if (showFeedback) {
      const apiStatusBanner = document.getElementById('api-status-banner');
      const apiStatusMessage = document.getElementById('api-status-message');
      
      if (apiStatusBanner && apiStatusMessage) {
        apiStatusBanner.style.display = 'block';
        apiStatusBanner.style.backgroundColor = '#f0f9ff';
        apiStatusBanner.style.color = '#2ea3f2';
        apiStatusMessage.textContent = 'Checking connection...';
      }
    }
    
    try {
      // The original code was using a root endpoint without any path
      // Let's ensure we're accessing the correct endpoint
      const url = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`API connection failed with status: ${response.status}`);
      }
      
      console.log('API connection successful');
      
      // Show success message if feedback was requested
      if (showFeedback) {
        const apiStatusBanner = document.getElementById('api-status-banner');
        const apiStatusMessage = document.getElementById('api-status-message');
        
        if (apiStatusBanner && apiStatusMessage) {
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
      
      // Show error message if feedback was requested
      if (showFeedback) {
        const apiStatusBanner = document.getElementById('api-status-banner');
        const apiStatusMessage = document.getElementById('api-status-message');
        
        if (apiStatusBanner && apiStatusMessage) {
          apiStatusBanner.style.display = 'block';
          apiStatusBanner.style.backgroundColor = '#fef2f2';
          apiStatusBanner.style.color = '#b91c1c';
          apiStatusMessage.textContent = 'API connection issue detected. Check your internet connection or try again later.';
        }
      } else {
        // Display the error in the messages area if we're not already showing feedback
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
          const errorElement = document.createElement('div');
          errorElement.className = 'message bot error';
          errorElement.innerHTML = `
            <div class="connection-error">
              <p>Sorry, I can't reach the sermon database right now. Please check your internet connection.</p>
              <button class="retry-button">Try Again</button>
            </div>
          `;
          messagesContainer.appendChild(errorElement);
          
          // Add click handler for retry button
          const retryButton = errorElement.querySelector('.retry-button');
          if (retryButton) {
            retryButton.addEventListener('click', () => this.verifyConnection(true));
          }
        }
      }
      
      return false;
    }
  },
  
  /**
   * Send a query to the API
   * @param {Object} queryData - The data to send
   * @returns {Promise<Object>} - The API response
   */
  async sendQuery(queryData) {
    // First check connection
    const isConnected = await this.verifyConnection();
    if (!isConnected) {
      throw new Error('API connection failed');
    }
    
    try {
      // Create the URL without any trailing slashes
      const url = this.baseUrl.endsWith('/') 
        ? `${this.baseUrl.slice(0, -1)}/search` 
        : `${this.baseUrl}/search`;
      
      console.log('Sending query to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Accept-Language': queryData.language || 'en'
        },
        mode: 'cors',
        body: JSON.stringify(queryData)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  },
  
  /**
   * Fetch transcript for a video
   * @param {string} videoId - The video ID
   * @param {number} startTime - The start time
   * @param {string} language - The language
   * @returns {Promise<Object>} - The transcript data
   */
  async fetchTranscript(videoId, startTime = 0, language = 'en') {
    try {
      console.log(`Fetching transcript for video ${videoId} with language ${language}`);
      
      // Create the URL
      const url = this.baseUrl.endsWith('/')
        ? `${this.baseUrl.slice(0, -1)}/transcript/${videoId}?language=${language}`
        : `${this.baseUrl}/transcript/${videoId}?language=${language}`;
      
      const response = await fetch(url, {
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
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }
  }
};

// Create a namespace to avoid global pollution
const SermonSearch = (function() {
    // Configuration
    const config = {
      apiUrl: SermonAPI.baseUrl, // Use the API module's baseUrl
      maxMemoryLength: 10,
      defaultLanguage: 'en'
    };
  
    // State management
    let state = {
      conversationHistory: [],
      isFirstLoad: true,
      currentLanguage: config.defaultLanguage,
      isApiConnected: false
    };
  
    // DOM Elements - will be populated on init
    let elements = {};
  
    // Translations
    const translations = {
      en: {
        "welcome-title": "Welcome to the Sermon Search Tool! 👋",
        "welcome-intro": "Ask any question about the pastor's sermons, and I'll provide answers based on the sermon content with timestamped video links.",
        "suggestion-heading": "Try asking about:",
        "example-1": "How does a person get to heaven?",
        "example-2": "What is the Trinity?",
        "example-3": "How should Christians live?",
        "example-4": "Why read the King James Bible?",
        "example-5": "Who is Melchizedek?",
        "watch-video": "Watch Video",
        "hide-video": "Hide Video",
        "view-transcript": "View Transcript",
        "hide-transcript": "Hide Transcript",
        "open-youtube": "Open in YouTube",
        "loading-transcript": "Loading transcript...",
        "show-sources": "Show Sources",
        "hide-sources": "Hide Sources",
        "sources-found": "Sources Found",
        "view-all-sources": "View All Sources",
        "searching": "Searching sermon content...",
        "no-results": "No relevant sermon content found to answer this question.",
        "connection-error": "Sorry, I can't reach the sermon database right now. Please check your internet connection.",
        "try-again": "Try Again",
        "continue-conversation": "You can continue the conversation by asking follow-up questions.",
        "download-transcript": "Download Transcript",
        "search-in-transcript": "Search in transcript",
        "search": "Search",
        "what-does-pastor-teach": "What does the pastor teach about faith?"
        // Add remaining translations
      },
      es: {
        "welcome-title": "¡Bienvenido a la Herramienta de Búsqueda de Sermones! 👋",
        // Add Spanish translations
      },
      zh: {
        "welcome-title": "欢迎使用讲道搜索工具！👋",
        // Add Chinese translations
      }
    };
  
    // Bible website configurations for different languages
    const bibleWebsites = {
      en: { site: "https://www.biblegateway.com/passage/", version: "KJV" },
      es: { site: "https://www.biblegateway.com/passage/", version: "RVR1960" },
      zh: { site: "https://www.biblegateway.com/passage/", version: "CUVS" }
    };
  
    // Bible reference regex for different languages
    const bibleRefRegexByLanguage = {
      en: /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi,
      es: /\b(Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Salmo|Proverbios|Eclesiastés|Cantares|Cantar de los Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis)\s+\d+(?::\d+(?:-\d+)?)?/gi,
      zh: /\b(创世记|出埃及记|利未记|民数记|申命记|约书亚记|士师记|路得记|撒母耳记上|撒母耳记下|列王纪上|列王纪下|历代志上|历代志下|以斯拉记|尼希米记|以斯帖记|约伯记|诗篇|箴言|传道书|雅歌|以赛亚书|耶利米书|耶利米哀歌|以西结书|但以理书|何西阿书|约珥书|阿摩司书|俄巴底亚书|约拿书|弥迦书|那鸿书|哈巴谷书|西番雅书|哈该书|撒迦利亚书|玛拉基书|马太福音|马可福音|路加福音|约翰福音|使徒行传|罗马书|哥林多前书|哥林多后书|加拉太书|以弗所书|腓立比书|歌罗西书|帖撒罗尼迦前书|帖撒罗尼迦后书|提摩太前书|提摩太后书|提多书|腓利门书|希伯来书|雅各书|彼得前书|彼得后书|约翰一书|约翰二书|约翰三书|犹大书|启示录)\s*\d+(?::\d+(?:-\d+)?)?/gi
    };
  
    // Sample queries for suggestions
    const sampleQueries = [
      "example-1", "example-2", "example-3", "example-4", "example-5"
    ];
  
    // ======= UTILITY FUNCTIONS =======
  
    /**
     * Safely get a DOM element with error handling
     */
    function getElement(id) {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`Element with ID '${id}' not found`);
      }
      return element;
    }
  
    /**
     * Translate a key to the current language
     */
    function translate(key) {
      if (!translations[state.currentLanguage]) {
        return key;
      }
      return translations[state.currentLanguage][key] || key;
    }
  
    /**
     * Get Bible reference regex for current language
     */
    function getBibleReferenceRegex() {
      return bibleRefRegexByLanguage[state.currentLanguage] || bibleRefRegexByLanguage.en;
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
          
          return new Intl.DateTimeFormat(state.currentLanguage, {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }).format(date);
        }
        
        // Handle ISO date strings (YYYY-MM-DD)
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return 'Date unknown';
          
          return new Intl.DateTimeFormat(state.currentLanguage, {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }).format(date);
        }
        
        // Handle timestamp
        if (typeof dateStr === 'number') {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return 'Date unknown';
          
          return new Intl.DateTimeFormat(state.currentLanguage, {
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
  
    /**
     * Clean and format sermon title
     */
    function formatSermonTitle(title) {
      if (!title) return 'Unknown Sermon';
      return title.replace(/^["']|["']$/g, '');
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
     * Format text for display with Bible references highlighted
     */
    function formatText(text) {
      if (!text) return '';
      // First escape HTML
      text = escapeHTML(text);
      // Then highlight Bible references
      return text.replace(getBibleReferenceRegex(), '<span class="bible-reference">$&</span>');
    }
  
    /**
     * Format response text with Markdown-like syntax
     */
    function formatResponse(text) {
      if (!text) return '';
      
      // Convert line breaks to HTML breaks
      text = text.replace(/\n/g, '<br>');
      
      // Replace section headers (text between ** **)
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Format numbered lists
      text = text.replace(/(\d+\.\s+)([^\n<]+)(<br>|$)/g, '<div class="list-item"><span class="list-number">$1</span>$2</div>$3');
      
      // Highlight Bible references
      text = text.replace(getBibleReferenceRegex(), '<span class="bible-reference">$&</span>');
      
      // Wrap paragraphs in <p> tags, but not if they're already in a div or other block element
      text = text.replace(/(^|<\/div>)([^<]+)(<br>|$)/g, '$1<p>$2</p>$3');
      
      // Clean up any extra <br> tags after </p> tags
      text = text.replace(/<\/p><br>/g, '</p>');
      
      return text;
    }
  
    /**
     * Smooth scroll to the bottom of a container
     */
    function smoothScrollToBottom(container) {
      if (!container) return;
      
      const scrollHeight = container.scrollHeight;
      const currentScroll = container.scrollTop + container.clientHeight;
      const targetScroll = scrollHeight;
      
      // Check if we're already near the bottom (within 100px)
      if (scrollHeight - currentScroll < 100) {
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      } else {
        // If far from bottom, jump there directly to avoid long scroll
        container.scrollTop = targetScroll;
      }
    }
  
    // ======= UI FUNCTIONS =======
  
    /**
     * Add a message to the chat
     */
    function addMessage(text, sender, isError = false) {
      if (!elements.messagesContainer) return null;
      
      const messageElement = document.createElement('div');
      messageElement.className = `claude-message claude-message-${sender}`;
      messageElement.id = 'msg-' + Date.now();
      
      if (sender === 'bot') {
        messageElement.setAttribute('role', 'region');
        messageElement.setAttribute('aria-live', 'polite');
        messageElement.setAttribute('aria-atomic', 'true');
      }
      
      const messageContent = document.createElement('div');
      messageContent.className = 'claude-message-content';
      
      if (isError) {
        messageContent.classList.add('error');
        messageElement.setAttribute('role', 'alert');
      }
      
      // For bot messages, apply formatting
      if (sender === 'bot') {
        if (text.startsWith('<div class="welcome-message">')) {
          // Convert welcome message to enhanced Claude-style
          const welcomeContent = createWelcomeMessage();
          messageContent.appendChild(welcomeContent);
        } 
        else if (text.startsWith('<div class="error-container">') || 
                 text.startsWith('<div class="connection-error">')) {
          // For pre-formatted HTML error content
          messageContent.innerHTML = text;
        } 
        else {
          // Regular text responses
          messageContent.innerHTML = formatResponse(text);
          
          // Look for sources in the response and create a toggle button
          const hasSources = text.includes('sermon') && !text.includes('No relevant sermon content found');
          if (hasSources) {
            const sourcesToggle = document.createElement('button');
            sourcesToggle.className = 'claude-sources-toggle';
            sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
            sourcesToggle.setAttribute('data-active', 'false');
            sourcesToggle.setAttribute('aria-expanded', 'false');
            sourcesToggle.setAttribute('aria-controls', 'sourcesPanel');
            
            sourcesToggle.addEventListener('click', function() {
              const isActive = this.getAttribute('data-active') === 'true';
              toggleSourcesPanel(!isActive);
              
              this.setAttribute('data-active', !isActive);
              this.setAttribute('aria-expanded', !isActive);
              this.innerHTML = !isActive ? 
                '<span class="claude-sources-toggle-icon">⬇</span> ' + translate('hide-sources') :
                '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
            });
            
            messageContent.appendChild(sourcesToggle);
          }
        }
        
        // Make Bible references clickable
        setupBibleReferenceClicks(messageContent);
      } else {
        // For user messages, use text content for security
        messageContent.textContent = text;
      }
      
      messageElement.appendChild(messageContent);
      elements.messagesContainer.appendChild(messageElement);
      
      // Smooth scroll to the bottom
      smoothScrollToBottom(elements.messagesContainer);
      
      return messageElement;
    }
  
    /**
     * Add a typing indicator
     */
    function addTypingIndicator() {
      if (!elements.messagesContainer) return null;
      
      const typingElement = document.createElement('div');
      typingElement.className = 'claude-typing';
      typingElement.id = 'typing-' + Date.now();
      
      // ARIA for screen readers
      typingElement.setAttribute('aria-live', 'polite');
      typingElement.setAttribute('aria-label', translate('searching') || 'Searching sermon content...');
      
      // Create typing bubbles
      for (let i = 0; i < 3; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'claude-typing-bubble';
        typingElement.appendChild(bubble);
      }
      
      elements.messagesContainer.appendChild(typingElement);
      
      // Smooth scroll to bottom
      smoothScrollToBottom(elements.messagesContainer);
      
      return typingElement.id;
    }
  
    /**
     * Remove a message by ID
     */
    function removeMessage(id) {
      const message = document.getElementById(id);
      if (!message) return;
      
      message.style.opacity = '0';
      message.style.transform = 'translateY(-10px)';
      message.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        if (message.parentNode) {
          message.parentNode.removeChild(message);
        }
      }, 300);
    }
  
    /**
     * Create welcome message with suggestions
     */
    function createWelcomeMessage() {
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
        
        // Add click handler
        chip.addEventListener('click', function(e) {
          // Add visual feedback
          addRippleEffect(this, e);
          
          // Submit the query
          setTimeout(() => {
            elements.queryInput.value = query;
            elements.chatForm.dispatchEvent(new Event('submit'));
          }, 300);
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
     * Add ripple effect to element on click
     */
    function addRippleEffect(element, event) {
      if (!element) return;
      
      // Create ripple element
      const ripple = document.createElement('span');
      ripple.className = 'claude-ripple';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
      ripple.style.width = '100px';
      ripple.style.height = '100px';
      ripple.style.pointerEvents = 'none';
      ripple.style.left = (event.clientX - element.getBoundingClientRect().left - 50) + 'px';
      ripple.style.top = (event.clientY - element.getBoundingClientRect().top - 50) + 'px';
      ripple.style.transform = 'scale(0)';
      ripple.style.transition = 'transform 0.6s ease-out';
      
      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);
      
      setTimeout(() => {
        ripple.style.transform = 'scale(2)';
      }, 1);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
  
    /**
     * Add ripple effect to a newly added message
     */
    function addMessageRippleEffect(element) {
      if (!element) return;
      
      // Create ripple element
      const ripple = document.createElement('div');
      ripple.className = 'claude-ripple-container';
      ripple.style.position = 'absolute';
      ripple.style.top = '0';
      ripple.style.left = '0';
      ripple.style.right = '0';
      ripple.style.bottom = '0';
      ripple.style.overflow = 'hidden';
      ripple.style.pointerEvents = 'none';
      ripple.style.borderRadius = 'inherit';
      
      // Add to element
      element.style.position = 'relative';
      element.appendChild(ripple);
      
      // Create the actual ripple
      const rippleInner = document.createElement('div');
      rippleInner.className = 'claude-ripple';
      rippleInner.style.position = 'absolute';
      rippleInner.style.borderRadius = '50%';
      rippleInner.style.backgroundColor = 'rgba(46, 163, 242, 0.15)';
      rippleInner.style.transformOrigin = 'center';
      rippleInner.style.transform = 'scale(0)';
      rippleInner.style.width = '100%';
      rippleInner.style.height = '100%';
      rippleInner.style.opacity = '1';
      rippleInner.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
      
      ripple.appendChild(rippleInner);
      
      // Trigger animation
      setTimeout(() => {
        rippleInner.style.transform = 'scale(2.5)';
        rippleInner.style.opacity = '0';
      }, 10);
      
      // Clean up
      setTimeout(() => {
        if (ripple.parentNode === element) {
          element.removeChild(ripple);
        }
      }, 1000);
    }
  
    /**
     * Setup Bible reference clicks for a DOM element
     */
    function setupBibleReferenceClicks(element) {
      if (!element) return;
      
      const bibleRefs = element.querySelectorAll('.bible-reference');
      
      bibleRefs.forEach(ref => {
        // Ensure it's accessible
        ref.setAttribute('role', 'button');
        ref.setAttribute('tabindex', '0');
        ref.setAttribute('aria-label', `Open Bible reference: ${ref.textContent.trim()}`);
        
        // Add click handler
        ref.addEventListener('click', function() {
          const reference = this.textContent.trim();
          const bibleConfig = bibleWebsites[state.currentLanguage] || bibleWebsites.en;
          
          window.open(`${bibleConfig.site}?search=${encodeURIComponent(reference)}&version=${bibleConfig.version}`, '_blank');
        });
        
        // Add keyboard handler
        ref.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
          }
        });
      });
    }
  
    /**
     * Update Bible references when language changes
     */
    function updateBibleReferencesForLanguage() {
      // Get all bot messages
      const botMessages = document.querySelectorAll('.claude-message-bot:not(.claude-typing)');
      
      botMessages.forEach(message => {
        // Find all Bible references in this message
        const bibleRefs = message.querySelectorAll('.bible-reference');
        
        bibleRefs.forEach(ref => {
          // Update the click handler to use the current language
          ref.addEventListener('click', function() {
            const reference = this.textContent.trim();
            const bibleConfig = bibleWebsites[state.currentLanguage] || bibleWebsites.en;
            
            window.open(`${bibleConfig.site}?search=${encodeURIComponent(reference)}&version=${bibleConfig.version}`, '_blank');
          });
        });
      });
    }
  
    /**
     * Display welcome message
     */
    function displayWelcomeMessage() {
      // Add welcome message with instructions
      const welcomeMsg = `<div class="welcome-message"></div>`;
      addMessage(welcomeMsg, 'bot');
      
      state.isFirstLoad = false;
    }
  
    /**
     * Get translated sample queries
     */
    function getTranslatedQueries() {
      return sampleQueries.map(key => translate(key));
    }
  
    /**
     * Adjust textarea height based on content
     */
    function adjustTextareaHeight(textarea) {
      if (!textarea) return;
      
      // Reset height to default to correctly calculate scroll height
      textarea.style.height = 'auto';
      
      // Set new height based on content, with max height
      const maxHeight = window.innerHeight * 0.3; // 30% of viewport height
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
  
    /**
     * Toggle sources panel visibility
     */
    function toggleSourcesPanel(show) {
      if (!elements.sourcesPanel) return;
      
      if (show === undefined) {
        // Toggle based on current state
        show = !elements.sourcesPanel.classList.contains('active');
      }
      
      if (show) {
        // Show panel
        elements.sourcesPanel.classList.add('active');
        
        // Update backdrop
        if (elements.sourcesBackdrop) {
          elements.sourcesBackdrop.style.display = 'block';
          // Trigger reflow to enable transition
          elements.sourcesBackdrop.offsetHeight;
          elements.sourcesBackdrop.style.opacity = '1';
        }
      } else {
        // Hide panel
        elements.sourcesPanel.classList.remove('active');
        
        // Update backdrop
        if (elements.sourcesBackdrop) {
          elements.sourcesBackdrop.style.opacity = '0';
          setTimeout(() => {
            elements.sourcesBackdrop.style.display = 'none';
          }, 300);
        }
        
        // Update any active source toggle buttons
        document.querySelectorAll('.claude-sources-toggle[data-active="true"]').forEach(toggle => {
          toggle.setAttribute('data-active', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
        });
      }
    }
  
    /**
     * Create a source element
     */
    function createSourceElement(source, index) {
      const sourceElement = document.createElement('div');
      sourceElement.className = 'claude-source-item';
      sourceElement.setAttribute('data-video-id', source.video_id);
      
      // Add ARIA attributes for accessibility
      sourceElement.setAttribute('role', 'region');
      sourceElement.setAttribute('aria-label', 'Sermon source ' + (index + 1));
      
      const similarity = Math.round(source.similarity * 100);
      
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
      
      // Create collapsible text container
      const textPreview = document.createElement('div');
      textPreview.className = 'claude-source-text-preview';
      
      // Get a short preview of the text (first 100 characters + ellipsis)
      const previewText = source.text.length > 100 ? 
        source.text.substring(0, 100) + '...' : 
        source.text;
      
      textPreview.innerHTML = `"${formatText(previewText)}"`;
      
      // Create "View full text" button that opens modal
      const viewFullButton = document.createElement('button');
      viewFullButton.className = 'claude-source-text-view-button';
      viewFullButton.textContent = translate('view-full-text') || 'View full text';
      viewFullButton.setAttribute('aria-haspopup', 'dialog');
      
      // Add click handler for the view full text button
      viewFullButton.addEventListener('click', function() {
        openSourceTextOverlay(source.text, formattedTitle);
      });
      
      const meta = document.createElement('div');
      meta.className = 'claude-source-meta';
      
      const timestamp = document.createElement('div');
      timestamp.className = 'claude-source-timestamp';
      timestamp.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 5px">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
        <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg> ${formatTimestamp(source.start_time)}`;
      
      const match = document.createElement('div');
      match.className = 'claude-source-match';
      match.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 5px">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg> ${similarity}% ${translate('match') || 'match'}`;
      
      meta.appendChild(timestamp);
      meta.appendChild(match);
      
      // Create actions with improved accessibility and modal support
      const actions = document.createElement('div');
      actions.className = 'claude-source-actions';
      
      // Watch video button - opens modal overlay
      const watchButton = document.createElement('button');
      watchButton.className = 'claude-source-button claude-source-button-primary';
      watchButton.textContent = translate('watch-video') || 'Watch Video';
      watchButton.setAttribute('aria-haspopup', 'dialog');
      
      watchButton.onclick = function() {
        openVideoOverlay(source.video_id, Math.floor(source.start_time), formattedTitle);
      };
      
      // Transcript button - opens modal overlay
      const transcriptButton = document.createElement('button');
      transcriptButton.className = 'claude-source-button';
      transcriptButton.textContent = translate('view-transcript') || 'View Transcript';
      transcriptButton.setAttribute('aria-haspopup', 'dialog');
      
      transcriptButton.onclick = function() {
        openTranscriptOverlay(source.video_id, source.start_time, formattedTitle);
      };
      
      // YouTube button - opens in new tab
      const youtubeButton = document.createElement('button');
      youtubeButton.className = 'claude-source-button';
      youtubeButton.textContent = translate('open-youtube') || 'Open YouTube';
      youtubeButton.setAttribute('aria-label', 'Open video in YouTube at ' + formatTimestamp(source.start_time));
      
      youtubeButton.onclick = function() {
        window.open(`https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}`, '_blank');
      };
      
      // Add buttons to actions
      actions.appendChild(watchButton);
      actions.appendChild(transcriptButton);
      actions.appendChild(youtubeButton);
      
      // Assemble all components
      content.appendChild(textPreview);
      content.appendChild(viewFullButton);
      content.appendChild(meta);
      content.appendChild(actions);
      
      sourceElement.appendChild(header);
      sourceElement.appendChild(content);
      
      return sourceElement;
    }
  
    // ======= OVERLAY/MODAL FUNCTIONS =======
  
    /**
     * Create and manage the overlay container
     */
    function ensureOverlayContainer() {
      if (!document.getElementById('claude-overlay-container')) {
        const overlayContainer = document.createElement('div');
        overlayContainer.id = 'claude-overlay-container';
        document.body.appendChild(overlayContainer);
        return overlayContainer;
      }
      return document.getElementById('claude-overlay-container');
    }
  
    /**
     * Close an overlay
     */
    function closeOverlay(overlay) {
      if (!overlay) return;
      
      // Animate closing
      overlay.classList.remove('active');
      
      // Remove after animation
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        
        // Restore body scrolling
        document.body.style.overflow = '';
      }, 300);
    }
  
    /**
     * Add keyboard handling for overlays
     */
    function addOverlayKeyboardHandling(overlay) {
      if (!overlay) return;
      
      // Handle ESC key to close
      overlay.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeOverlay(overlay);
        }
      });
      
      // Close when clicking outside content
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          closeOverlay(overlay);
        }
      });
      
      // Focus trap within overlay for accessibility
      const focusableElements = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElements.length > 0) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus first element
        setTimeout(() => {
          firstElement.focus();
        }, 100);
        
        // Trap focus
        overlay.addEventListener('keydown', function(e) {
          if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        });
      }
    }
  
    /**
     * Open source text overlay
     */
    function openSourceTextOverlay(text, title) {
      const overlayContainer = ensureOverlayContainer();
      
      // Create overlay structure
      const overlay = document.createElement('div');
      overlay.className = 'claude-overlay claude-text-overlay';
      overlay.id = 'text-overlay-' + Date.now();
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'overlay-title-text-' + Date.now());
      
      const overlayContent = document.createElement('div');
      overlayContent.className = 'claude-overlay-content';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'claude-overlay-header';
      
      const overlayTitle = document.createElement('h2');
      overlayTitle.className = 'claude-overlay-title';
      overlayTitle.id = 'overlay-title-text-' + Date.now();
      overlayTitle.textContent = (title || 'Sermon Text');
      
      const closeButton = document.createElement('button');
      closeButton.className = 'claude-overlay-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close overlay');
      closeButton.onclick = function() {
        closeOverlay(overlay);
      };
      
      header.appendChild(overlayTitle);
      header.appendChild(closeButton);
      
      // Create body with text
      const body = document.createElement('div');
      body.className = 'claude-overlay-body';
      
      const textContainer = document.createElement('div');
      textContainer.className = 'claude-source-text claude-text-overlay-content';
      textContainer.innerHTML = `"${formatText(text)}"`;
      
      body.appendChild(textContainer);
      
      // Assemble overlay
      overlayContent.appendChild(header);
      overlayContent.appendChild(body);
      overlay.appendChild(overlayContent);
      
      // Add to container
      overlayContainer.innerHTML = ''; // Clear any existing overlays
      overlayContainer.appendChild(overlay);
      
      // Add keyboard handling
      addOverlayKeyboardHandling(overlay);
      
      // Activate with animation
      setTimeout(() => {
        overlay.classList.add('active');
      }, 10);
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    }
  
    /**
     * Open video overlay
     */
    function openVideoOverlay(videoId, startTime, title) {
      const overlayContainer = ensureOverlayContainer();
      
      // Create overlay structure
      const overlay = document.createElement('div');
      overlay.className = 'claude-overlay claude-video-overlay';
      overlay.id = 'video-overlay-' + videoId;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'overlay-title-' + videoId);
      
      const overlayContent = document.createElement('div');
      overlayContent.className = 'claude-overlay-content';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'claude-overlay-header';
      
      const overlayTitle = document.createElement('h2');
      overlayTitle.className = 'claude-overlay-title';
      overlayTitle.id = 'overlay-title-' + videoId;
      overlayTitle.textContent = title || 'Sermon Video';
      
      const closeButton = document.createElement('button');
      closeButton.className = 'claude-overlay-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close overlay');
      closeButton.onclick = function() {
        closeOverlay(overlay);
      };
      
      header.appendChild(overlayTitle);
      header.appendChild(closeButton);
      
      // Create body with video
      const body = document.createElement('div');
      body.className = 'claude-overlay-body';
      
      const videoContainer = document.createElement('div');
      videoContainer.className = 'claude-video-container';
      videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen 
                                title="Sermon video at ${formatTimestamp(startTime)}"></iframe>`;
      
      body.appendChild(videoContainer);
      
      // Assemble overlay
      overlayContent.appendChild(header);
      overlayContent.appendChild(body);
      overlay.appendChild(overlayContent);
      
      // Add to container
      overlayContainer.innerHTML = ''; // Clear any existing overlays
      overlayContainer.appendChild(overlay);
      
      // Add keyboard handling
      addOverlayKeyboardHandling(overlay);
      
      // Activate with animation
      setTimeout(() => {
        overlay.classList.add('active');
      }, 10);
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    }
  
    /**
     * Open transcript overlay
     */
    function openTranscriptOverlay(videoId, startTime, title) {
      const overlayContainer = ensureOverlayContainer();
      
      // Create overlay structure
      const overlay = document.createElement('div');
      overlay.className = 'claude-overlay claude-transcript-overlay';
      overlay.id = 'transcript-overlay-' + videoId;
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-labelledby', 'overlay-title-transcript-' + videoId);
      
      const overlayContent = document.createElement('div');
      overlayContent.className = 'claude-overlay-content';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'claude-overlay-header';
      
      const overlayTitle = document.createElement('h2');
      overlayTitle.className = 'claude-overlay-title';
      overlayTitle.id = 'overlay-title-transcript-' + videoId;
      overlayTitle.textContent = (title ? title + ' - ' : '') + 'Transcript';
      
      const closeButton = document.createElement('button');
      closeButton.className = 'claude-overlay-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close overlay');
      closeButton.onclick = function() {
        closeOverlay(overlay);
      };
      
      header.appendChild(overlayTitle);
      header.appendChild(closeButton);
      
      // Create body with loading indicator
      const body = document.createElement('div');
      body.className = 'claude-overlay-body';
      body.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript') || 'Loading transcript...'}</div>`;
      
      // Assemble overlay
      overlayContent.appendChild(header);
      overlayContent.appendChild(body);
      overlay.appendChild(overlayContent);
      
      // Add to container and show
      overlayContainer.innerHTML = ''; // Clear any existing overlays
      overlayContainer.appendChild(overlay);
      
      // Add keyboard handling
      addOverlayKeyboardHandling(overlay);
      
      // Activate with animation
      setTimeout(() => {
        overlay.classList.add('active');
      }, 10);
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      
      // Fetch transcript data
      fetchTranscript(videoId, startTime).then(transcriptData => {
        // Create transcript display
        updateTranscriptOverlay(body, transcriptData, startTime);
      }).catch(error => {
        body.innerHTML = `<div class="claude-transcript-error">Error loading transcript: ${error.message}</div>`;
      });
    }
  
    /**
     * Update transcript overlay with data
     */
    function updateTranscriptOverlay(container, data, startTime) {
      if (!container || !data) return;
      
      container.innerHTML = '';
      
      // Check if transcript data is valid
      if (!data.segments && !data.transcript) {
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
      
      // Create overall container with flex layout
      const transcriptContainer = document.createElement('div');
      transcriptContainer.className = 'claude-transcript-container';
      
      // Add transcript search - STICKY POSITION
      const searchContainer = document.createElement('div');
      searchContainer.className = 'claude-transcript-search-sticky';
      searchContainer.innerHTML = `
        <div class="claude-transcript-search">
          <input type="text" class="claude-transcript-search-input" placeholder="${translate('search-in-transcript') || 'Search in transcript'}..." aria-label="${translate('search-in-transcript') || 'Search in transcript'}">
          <button class="claude-transcript-search-button" aria-label="${translate('search') || 'Search'}">${translate('search') || 'Search'}</button>
        </div>
      `;
      
      // Create transcript content area
      const transcriptElement = document.createElement('div');
      transcriptElement.className = 'claude-transcript';
      
      const transcriptContent = document.createElement('div');
      transcriptContent.className = 'claude-transcript-content';
      
      const videoId = container.closest('.claude-overlay')?.id?.replace('transcript-overlay-', '') || '';
      
      // Process segmented transcript with timestamps
      if (data.segments && Array.isArray(data.segments)) {
        let highlightedSegmentId = null;
        
        data.segments.forEach((segment, index) => {
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
          segmentElement.id = `overlay-transcript-segment-${index}`;
          segmentElement.setAttribute('data-time', segment.start_time);
          
          // Highlight segments close to the start time
          if (Math.abs(segment.start_time - startTime) < 10) {
            segmentElement.classList.add('claude-transcript-highlight');
            highlightedSegmentId = segmentElement.id;
          }
          
          // Make timestamps clickable and linked to video
          const timestampElement = document.createElement('div');
          timestampElement.className = 'claude-transcript-timestamp';
          timestampElement.textContent = formatTimestamp(segment.start_time);
          timestampElement.setAttribute('role', 'button');
          timestampElement.setAttribute('tabindex', '0');
          timestampElement.setAttribute('aria-label', `Jump to ${formatTimestamp(segment.start_time)}`);
          timestampElement.setAttribute('data-time', segment.start_time);
          timestampElement.setAttribute('data-video-id', videoId);
          
          // Add click handler for timestamp - opens or updates video at timestamp
          timestampElement.addEventListener('click', function() {
            const time = this.getAttribute('data-time');
            const videoId = this.getAttribute('data-video-id');
            if (videoId && time) {
              // Check if video overlay already exists
              const existingVideoOverlay = document.querySelector('.claude-video-overlay.active');
              if (existingVideoOverlay) {
                // Update existing video iframe with new timestamp
                const iframe = existingVideoOverlay.querySelector('iframe');
                if (iframe) {
                  iframe.src = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(time)}&autoplay=1`;
                }
              } else {
                // Open new video overlay
                openVideoOverlay(videoId, Math.floor(time), '');
              }
            }
          });
          
          // Add keyboard handler
          timestampElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.click();
            }
          });
          
          const textElement = document.createElement('div');
          textElement.className = 'claude-transcript-text';
          textElement.textContent = segment.text;
          
          segmentElement.appendChild(timestampElement);
          segmentElement.appendChild(textElement);
          transcriptContent.appendChild(segmentElement);
        });
        
        // Add content to transcript element
        transcriptElement.appendChild(transcriptContent);
        
        // Add search and transcript to container
        transcriptContainer.appendChild(searchContainer);
        transcriptContainer.appendChild(transcriptElement);
        container.appendChild(transcriptContainer);
        
        // Set up search functionality
        const searchInput = searchContainer.querySelector('.claude-transcript-search-input');
        const searchButton = searchContainer.querySelector('.claude-transcript-search-button');
        
        // Add event listeners for search
        if (searchInput && searchButton) {
          searchButton.addEventListener('click', function() {
            searchInTranscript(searchInput.value, transcriptContent);
          });
          
          searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              searchInTranscript(searchInput.value, transcriptContent);
            }
          });
        }
        
        // Scroll to highlighted segment
        if (highlightedSegmentId) {
          setTimeout(() => {
            const highlightedElement = document.getElementById(highlightedSegmentId);
            if (highlightedElement) {
              highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      } 
      else if (data.transcript) {
        // Handle plain text transcript
        const textContainer = document.createElement('div');
        textContainer.className = 'claude-transcript-content claude-transcript-plain-text';
        textContainer.innerHTML = data.transcript
          .split('\n\n')
          .map(para => `<p>${para}</p>`)
          .join('');
        
        transcriptElement.appendChild(textContainer);
        transcriptContainer.appendChild(searchContainer);
        transcriptContainer.appendChild(transcriptElement);
        container.appendChild(transcriptContainer);
        
        // Set up search functionality
        const searchInput = searchContainer.querySelector('.claude-transcript-search-input');
        const searchButton = searchContainer.querySelector('.claude-transcript-search-button');
        
        // Add event listeners for search
        if (searchInput && searchButton) {
          searchButton.addEventListener('click', function() {
            searchInTranscript(searchInput.value, textContainer);
          });
          
          searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
              searchInTranscript(searchInput.value, textContainer);
            }
          });
        }
      } 
      else {
        container.innerHTML = '<div class="claude-transcript-error">Transcript format unknown</div>';
      }
      
      // Add download transcript button
      const downloadButton = document.createElement('button');
      downloadButton.className = 'claude-transcript-download';
      downloadButton.textContent = translate('download-transcript') || 'Download Transcript';
      downloadButton.setAttribute('aria-label', translate('download-transcript') || 'Download Transcript');
      
      downloadButton.addEventListener('click', function() {
        downloadTranscript(data, videoId);
      });
      
      container.appendChild(downloadButton);
    }
  
    /**
     * Search within transcript
     */
    function searchInTranscript(query, container) {
      if (!query || !container) return;
      
      // Remove existing highlights and match counts
      const existingHighlights = container.querySelectorAll('.search-highlight');
      existingHighlights.forEach(highlight => {
        const textNode = document.createTextNode(highlight.textContent);
        highlight.parentNode.replaceChild(textNode, highlight);
      });
      
      const existingCount = container.querySelector('.claude-transcript-match-count');
      if (existingCount) {
        existingCount.remove();
      }
      
      if (!query.trim()) return;
      
      // Create a case-insensitive regex
      try {
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const segments = container.querySelectorAll('.claude-transcript-segment');
        let matchCount = 0;
        let firstMatchElement = null;
        
        segments.forEach(segment => {
          const textElement = segment.querySelector('.claude-transcript-text');
          if (!textElement) return;
          
          const originalText = textElement.textContent;
          let match;
          let lastIndex = 0;
          let hasMatches = false;
          let newHtml = '';
          
          while ((match = regex.exec(originalText)) !== null) {
            hasMatches = true;
            matchCount++;
            
            if (!firstMatchElement) {
              firstMatchElement = segment;
            }
            
            // Add text before match
            newHtml += originalText.substring(lastIndex, match.index);
            
            // Add highlighted match
            newHtml += `<span class="search-highlight" style="background-color: #ffeb3b; font-weight: bold;">${match[0]}</span>`;
            
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
        matchCountElement.className = 'claude-transcript-match-count';
        matchCountElement.style.padding = '8px 16px';
        matchCountElement.style.backgroundColor = '#f0f0f0';
        matchCountElement.style.borderRadius = '4px';
        matchCountElement.style.margin = '0 0 16px 0';
        matchCountElement.style.fontWeight = '500';
        
        matchCountElement.textContent = matchCount > 0 
          ? `${matchCount} ${translate('matches-found') || 'matches found'}`
          : `${translate('no-matches-found') || 'No matches found'}`;
        
        // Insert count at top
        container.insertBefore(matchCountElement, container.firstChild);
        
        // Scroll to first match
        if (firstMatchElement) {
          firstMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.error('Error in search:', error);
      }
    }
  
    /**
     * Download transcript as text file
     */
    function downloadTranscript(data, videoId) {
      if (!data) return;
      
      let content = '';
      let filename = 'sermon-transcript.txt';
      
      // Try to get sermon title from the page
      const sourceItem = document.querySelector(`.claude-source-item[data-video-id="${videoId}"]`);
      if (sourceItem) {
        const titleElement = sourceItem.querySelector('.claude-source-title');
        if (titleElement && titleElement.textContent) {
          filename = titleElement.textContent.trim().replace(/[^\w\s-]/g, '') + '-transcript.txt';
        }
        
        if (videoId) {
          content += `Sermon ID: ${videoId}\n\n`;
        }
      }
      
      // Add date if available
      const dateElement = document.querySelector('.claude-source-date');
      if (dateElement && dateElement.textContent) {
        content += `Date: ${dateElement.textContent.trim()}\n\n`;
      }
      
      // Format transcript content
      if (data.segments && Array.isArray(data.segments)) {
        content += 'TRANSCRIPT:\n\n';
        
        data.segments.forEach(segment => {
          if (segment.is_gap) {
            content += '[...]\n\n';
          } else {
            content += `[${formatTimestamp(segment.start_time)}] ${segment.text}\n\n`;
          }
        });
      } else if (data.transcript) {
        content += data.transcript;
      } else {
        content += 'No transcript data available.';
      }
      
      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  
    // ======= API FUNCTIONS =======
  
    /**
     * Verify API connection
     */
    async function verifyApiConnection(showFeedback = false) {
      // Use the SermonAPI module's verifyConnection method
      const isConnected = await SermonAPI.verifyConnection(showFeedback);
      state.isApiConnected = isConnected;
      return isConnected;
    }
  
    /**
     * Fetch transcript
     */
    async function fetchTranscript(videoId, startTime = 0) {
      // Use the SermonAPI module's fetchTranscript method
      return await SermonAPI.fetchTranscript(videoId, startTime, state.currentLanguage);
    }
  
    // ======= EVENT HANDLERS =======
  
    /**
     * Handle form submission
     */
    async function handleSubmit(event) {
      if (event) event.preventDefault();
      console.log('Form submitted');
      
      const query = elements.queryInput.value.trim();
      if (!query) {
        console.log('Empty query, ignoring');
        return;
      }
      
      // Add user message to the chat
      addMessage(query, 'user');
      
      // Add to conversation history
      state.conversationHistory.push({ role: 'user', content: query });
      
      // Limit history length
      if (state.conversationHistory.length > config.maxMemoryLength * 2) {
        state.conversationHistory = state.conversationHistory.slice(-config.maxMemoryLength * 2);
      }
      
      // Clear input field
      elements.queryInput.value = '';
      
      // Add typing indicator
      const typingId = addTypingIndicator();
      
      // Verify API connection before sending request
      if (!state.isApiConnected) {
        const isConnected = await verifyApiConnection(false);
        if (!isConnected) {
          // Remove typing indicator
          removeMessage(typingId);
          
          // Show connection error
          const errorMsg = `
            <div class="connection-error">
              <p>${translate('connection-error')}</p>
              <button class="retry-button">${translate('try-again')}</button>
            </div>
          `;
          const errorElement = addMessage(errorMsg, 'bot', true);
          
          // Add retry button functionality
          const retryButton = errorElement.querySelector('.retry-button');
          if (retryButton) {
            retryButton.addEventListener('click', function() {
              // Remove error message
              removeMessage(errorElement.id);
              
              // Try again with the same query
              elements.queryInput.value = query;
              elements.chatForm.dispatchEvent(new Event('submit'));
            });
          }
          
          return;
        }
      }
      
      try {
        // Prepare request data
        const requestData = {
          query: query,
          conversation_history: state.conversationHistory.slice(-config.maxMemoryLength * 2),
          language: state.currentLanguage
        };
        
        // Use SermonAPI to send the query
        const data = await SermonAPI.sendQuery(requestData);
        
        // Remove typing indicator
        removeMessage(typingId);
        
        console.log('Received API response:', data);
        
        // Display the answer
        displayAnswer(data);
        
      } catch (error) {
        console.error('Error in API request:', error);
        
        // Remove typing indicator
        removeMessage(typingId);
        
        // Show error message
        const errorMsg = `
          <div class="error-container">
            <p>Sorry, an error occurred: ${error.message}</p>
            <button class="retry-button">${translate('try-again')}</button>
          </div>
        `;
        const errorElement = addMessage(errorMsg, 'bot', true);
        
        // Add retry button functionality
        const retryButton = errorElement.querySelector('.retry-button');
        if (retryButton) {
          retryButton.addEventListener('click', function() {
            // Remove error message
            removeMessage(errorElement.id);
            
            // Try again with the same query
            elements.queryInput.value = query;
            elements.chatForm.dispatchEvent(new Event('submit'));
          });
        }
      }
    }
    
    // Define SERMON_TOPICS globally so it can be used across functions
    const SERMON_TOPICS = [
      "prayer", "faith", "forgiveness", "salvation", "holy spirit",
      "discipleship", "worship", "evangelism", "relationships", "suffering",
      "biblical interpretation", "theology", "christian living", "spiritual growth"
    ];
  
  /**
   * Display answer from API
   */
  function displayAnswer(data) {
    if (!data || !data.answer) {
      console.error('Invalid data received from API');
      addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
      return;
    }
    
    // Check if there are any sermon sources
    const hasSermonContent = data.sources && data.sources.length > 0;
    
    // If no sermon content but we have conversation history, use the fallback logic
    if (!hasSermonContent && data.answer.includes(translate('no-results')) && state.conversationHistory.length > 0) {
      // Generate a conversational response instead
      const conversationalResponse = handleConversationFallback(
        data.query, 
        state.conversationHistory
      );
      
      // Display the conversational response
      const messageElement = addMessage(conversationalResponse, 'bot');
      messageElement.classList.add('conversation-mode');
      
      // Add to conversation history
      state.conversationHistory.push({ 
        role: 'assistant', 
        content: conversationalResponse 
      });
      
      return;
    }
    
    // Regular processing for when sermon content is found
    const messageElement = addMessage(data.answer, 'bot');
    
    // Display sources in the side panel if available
    if (hasSermonContent) {
      try {
        // Clear previous sources
        elements.sourcesPanelContent.innerHTML = '';
        
        // Add title with source count
        const sourcesTitle = document.createElement('h3');
        sourcesTitle.textContent = translate('sources-found') + ' (' + data.sources.length + ')';
        elements.sourcesPanelContent.appendChild(sourcesTitle);
        
        // Sort sources by similarity score
        const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
        
        // Add sources to panel
        sortedSources.forEach((source, index) => {
          const sourceElement = createSourceElement(source, index);
          elements.sourcesPanelContent.appendChild(sourceElement);
        });
        
        // Auto-open sources panel for first answer
        if (state.conversationHistory.length <= 2) {
          setTimeout(() => {
            toggleSourcesPanel(true);
            const sourcesToggle = messageElement.querySelector('.claude-sources-toggle');
            if (sourcesToggle) {
              sourcesToggle.setAttribute('data-active', 'true');
              sourcesToggle.setAttribute('aria-expanded', 'true');
              sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> ' + translate('hide-sources');
            }
          }, 500);
        }
        
        // Add to conversation history
        state.conversationHistory.push({ role: 'assistant', content: data.answer });
        
      } catch (error) {
        console.error('Error displaying sources:', error);
        
        // Still add to conversation history
        state.conversationHistory.push({ role: 'assistant', content: data.answer });
      }
    } else {
      // Add to conversation history
      state.conversationHistory.push({ role: 'assistant', content: data.answer });
    }
    
    // Add ripple effect to new message for attention
    addMessageRippleEffect(messageElement);
  }

  /**
   * Change the interface language
   */
  function changeLanguage(language) {
    if (!translations[language]) {
      console.error(`Translations for language "${language}" not found`);
      return;
    }
    
    state.currentLanguage = language;
    console.log(`Language changed to ${language}`);
    
    // Update direction for RTL languages (if needed in the future)
    document.documentElement.classList.remove('rtl');
    if (language === 'ar' || language === 'he') {
      document.documentElement.classList.add('rtl');
    }
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (translations[language][key]) {
        element.textContent = translations[language][key];
      }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      if (translations[language][key]) {
        element.placeholder = translations[language][key];
      }
    });
    
    // Set static placeholder for query input
    if (elements.queryInput) {
      elements.queryInput.placeholder = translate('what-does-pastor-teach');
    }
    
    // Update welcome message if it exists
    if (state.isFirstLoad) {
      displayWelcomeMessage();
    } else {
      // Try to update existing welcome content without clearing conversation
      const welcomeTitle = document.querySelector('.welcome-message h4');
      const welcomeIntro = document.querySelector('.welcome-message p:first-of-type');
      const suggestionHeading = document.querySelector('.suggestion-heading');
      
      if (welcomeTitle) welcomeTitle.textContent = translate('welcome-title');
      if (welcomeIntro) welcomeIntro.textContent = translate('welcome-intro');
      if (suggestionHeading) suggestionHeading.textContent = translate('suggestion-heading');
      
      // Update suggestion chips text
      document.querySelectorAll('.suggestion-chip').forEach((chip, index) => {
        if (index < sampleQueries.length) {
          const translatedQuery = translate(sampleQueries[index]);
          chip.textContent = translatedQuery;
          chip.setAttribute('data-query', translatedQuery);
        }
      });
    }
    
    // Update any Bible references in existing messages
    updateBibleReferencesForLanguage();
  }

  /**
   * Clear the conversation history
   */
  function clearConversation() {
    // Clear the conversation history array
    state.conversationHistory = [];
    
    // Clear the messages container
    elements.messagesContainer.innerHTML = '';
    
    // Display welcome message again
    displayWelcomeMessage();
    
    // Focus the input field
    if (elements.queryInput) {
      elements.queryInput.focus();
    }
  }

  // ======= CONVERSATION FALLBACK FUNCTIONS =======

  /**
   * Main handler for conversation mode
   * Call this when the API returns no sermon content
   */
  function handleConversationFallback(query, conversationHistory) {
    // Extract topics from the current query
    const queryTopics = extractTopics(query, SERMON_TOPICS);
    
    // Extract topics from previous responses that had sermon content
    const previousSermonTopics = extractPreviousSermonTopics(conversationHistory);
    
    // Analyze conversation to determine the best fallback strategy
    const fallbackStrategy = determineFallbackStrategy(query, conversationHistory, queryTopics, previousSermonTopics);
    
    // Generate the appropriate fallback response
    return generateFallbackResponse(query, conversationHistory, fallbackStrategy, queryTopics, previousSermonTopics);
  }

  /**
   * Extract topics from the query text
   */
  function extractTopics(text, topicList) {
    const foundTopics = [];
    const lowerText = text.toLowerCase();
    
    // Check for explicit topic mentions
    topicList.forEach(topic => {
      if (lowerText.includes(topic.toLowerCase())) {
        foundTopics.push(topic);
      }
    });
    
    // Check for related words/synonyms
    const topicSynonyms = {
      "prayer": ["praying", "pray", "intercession", "supplication"],
      "faith": ["belief", "trust", "believing", "faithful"],
      "forgiveness": ["forgiving", "forgive", "pardon", "mercy"],
      "relationships": ["marriage", "family", "parenting", "friendship"]
      // Add more synonyms as needed
    };
    
    // Check for synonyms
    Object.entries(topicSynonyms).forEach(([topic, synonyms]) => {
      if (!foundTopics.includes(topic)) {
        for (const synonym of synonyms) {
          if (lowerText.includes(synonym.toLowerCase())) {
            foundTopics.push(topic);
            break;
          }
        }
      }
    });
    
    return foundTopics;
  }

  /**
   * Extract topics from previous sermon content
   */
  function extractPreviousSermonTopics(conversationHistory) {
    const topics = [];
    
    // Look through past assistant responses for sermon content
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const message = conversationHistory[i];
      
      // Only process assistant messages
      if (message.role === 'assistant') {
        // Skip messages that indicate no sermon content was found
        if (message.content.includes("No relevant sermon content found")) {
          continue;
        }
        
        // Extract topics from the message content
        SERMON_TOPICS.forEach(topic => {
          if (message.content.toLowerCase().includes(topic.toLowerCase()) && !topics.includes(topic)) {
            topics.push(topic);
          }
        });
      }
    }
    
    return topics;
  }

  /**
   * Determine the appropriate fallback strategy
   */
  function determineFallbackStrategy(query, conversationHistory, queryTopics, previousSermonTopics) {
    // Default strategy
    let strategy = "suggest_related";
    
    // Check if this is a clarification question about previous content
    if (isClarificationQuestion(query, conversationHistory)) {
      strategy = "clarify_previous";
    }
    // Check if this is a follow-up question to previous content
    else if (isFollowUpQuestion(query, conversationHistory)) {
      strategy = "follow_up";
    }
    // Check if we should suggest related topics
    else if (queryTopics.length > 0) {
      strategy = "suggest_related";
    }
    // If completely new topic with no relation to previous, suggest search refinement
    else {
      strategy = "refine_search";
    }
    
    return strategy;
  }

  /**
   * Check if the query is asking for clarification about previous content
   */
  function isClarificationQuestion(query, conversationHistory) {
    const clarificationPatterns = {
      en: [
        "what do you mean", "can you explain", "what does that mean",
        "could you clarify", "i don't understand", "please explain"
      ],
      es: [
        "qué quieres decir", "puedes explicar", "qué significa eso",
        "podrías aclarar", "no entiendo", "por favor explica"
      ],
      zh: [
        "你是什么意思", "你能解释", "这是什么意思",
        "能否澄清", "我不明白", "请解释"
      ]
    };
    
    const referencePatterns = {
      en: ["you said", "you mentioned", "that sermon", "the pastor said"],
      es: ["dijiste", "mencionaste", "ese sermón", "el pastor dijo"],
      zh: ["你说", "你提到", "那个讲道", "牧师说"]
    };
    
    const patterns = clarificationPatterns[state.currentLanguage] || clarificationPatterns.en;
    const refPatterns = referencePatterns[state.currentLanguage] || referencePatterns.en;
    
    const lowerQuery = query.toLowerCase();
    
    // Check for clarification phrases
    for (const pattern of patterns) {
      if (lowerQuery.includes(pattern)) {
        return true;
      }
    }
    
    // Check if question refers to previous content
    for (const pattern of refPatterns) {
      if (lowerQuery.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if the query is a follow-up to previous content
   */
  function isFollowUpQuestion(query, conversationHistory) {
    if (conversationHistory.length < 2) return false;
    
    const followUpPatterns = {
      en: [
        "more about", "tell me more", "elaborate", "and what about",
        "what else", "in addition", "furthermore", "also"
      ],
      es: [
        "más sobre", "dime más", "elabora", "y qué hay de",
        "qué más", "además", "también", "asimismo"
      ],
      zh: [
        "更多关于", "告诉我更多", "详细说明", "那么关于",
        "还有什么", "此外", "而且", "也"
      ]
    };
    
    const patterns = followUpPatterns[state.currentLanguage] || followUpPatterns.en;
    const lowerQuery = query.toLowerCase();
    
    // Check for follow-up indicators
    for (const pattern of patterns) {
      if (lowerQuery.includes(pattern)) {
        return true;
      }
    }
    
    // Check if it's related to the last topic discussed
    const lastResponse = findLastSermonResponse(conversationHistory);
    if (lastResponse) {
      const SERMON_TOPICS = [
        "prayer", "faith", "forgiveness", "salvation", "holy spirit",
        "discipleship", "worship", "evangelism", "relationships", "suffering",
        "biblical interpretation", "theology", "christian living", "spiritual growth"
      ];
      const lastResponseTopics = extractTopics(lastResponse, SERMON_TOPICS);
      const queryTopics = extractTopics(query, SERMON_TOPICS);
      
      // If there's topic overlap, it's likely a follow-up
      for (const topic of queryTopics) {
        if (lastResponseTopics.includes(topic)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Find the last response that contained sermon content
   */
  function findLastSermonResponse(conversationHistory) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const message = conversationHistory[i];
      if (message.role === 'assistant' && !message.content.includes("No relevant sermon content found")) {
        return message.content;
      }
    }
    return null;
  }

  /**
   * Generate a conversational fallback response based on the determined strategy
   */
  function generateFallbackResponse(query, conversationHistory, fallbackStrategy, queryTopics, previousSermonTopics) {
    // First check if we have a language-specific message
    // For Spanish
    if (state.currentLanguage === 'es') {
      const spanishFallbacks = {
        clarify_previous: `No tengo contenido específico de sermones que responda a tu pregunta sobre ese tema. 

A partir del contenido del sermón que discutimos anteriormente, el pastor se centró más en la aplicación práctica que en explicaciones detalladas. ¿Te gustaría que sugiriera un aspecto diferente de este tema que podría estar cubierto en los sermones? ¿O quizás podrías reformular tu pregunta para centrarte en un pasaje bíblico específico o una aplicación práctica?`,

        follow_up: `No pude encontrar contenido de sermones que aborde específicamente ese aspecto en relación con tu pregunta de seguimiento. 

El pastor puede haber cubierto esto en otros sermones que no están en nuestra base de datos actual. ¿Te gustaría que te ayudara a explorar un tema relacionado que sí está cubierto en los sermones? Por ejemplo, podría buscar contenido de sermones sobre los fundamentos bíblicos o aplicaciones prácticas relacionadas con este tema.`,

        suggest_related: `No pude encontrar contenido de sermones que responda directamente a tu pregunta. 

Es posible que el pastor haya discutido esto en otros sermones o desde una perspectiva diferente a como formulaste tu pregunta. Podrías intentar buscar:
- Términos bíblicos más específicos
- Mencionar un pasaje de la Biblia que te interese
- Preguntar sobre la aplicación práctica de un principio espiritual

¿Te gustaría que te ayudara a reformular tu pregunta?`,

        refine_search: `No pude encontrar contenido de sermones que responda directamente a tu pregunta. El pastor puede haber abordado este tema usando una terminología diferente o desde un ángulo distinto.

Para ayudarme a encontrar contenido de sermones relevante, podrías:
- Intentar usar términos bíblicos más específicos
- Mencionar un pasaje de la Biblia que te interese
- Preguntar sobre la aplicación práctica de un principio espiritual
- Enfocarte en un aspecto específico de la vida cristiana

¿Te gustaría que te ayudara a reformular tu pregunta?`,

        generic: `No tengo contenido de sermones que responda directamente a tu pregunta. Sin embargo, estaría encantado de ayudarte a explorar otros temas de las enseñanzas del pastor.

Aquí hay algunos temas que están bien cubiertos en la base de datos de sermones:
- Oración y comunicación con Dios
- Fe y confianza en tiempos difíciles
- Interpretación bíblica y comprensión
- Vida cristiana práctica

¿Te gustaría que buscara contenido de sermones sobre alguno de estos temas en su lugar?`
      };

      switch (fallbackStrategy) {
        case "clarify_previous": return spanishFallbacks.clarify_previous;
        case "follow_up": return spanishFallbacks.follow_up;
        case "suggest_related": return spanishFallbacks.suggest_related;
        case "refine_search": return spanishFallbacks.refine_search;
        default: return spanishFallbacks.generic;
      }
    }
    
    // For Chinese
    if (state.currentLanguage === 'zh') {
      const chineseFallbacks = {
        clarify_previous: `我没有找到特定的讲道内容来回答你关于这个主题的问题。

从我们之前讨论的讲道内容来看，牧师更多地关注实际应用而不是详细解释。你想让我建议这个主题的其他方面，这些方面可能在讲道中有所涉及吗？或者，你可以重新表述你的问题，专注于特定的圣经段落或实际应用。`,

        follow_up: `我找不到特别针对你的后续问题的讲道内容。

牧师可能在我们当前数据库中没有的其他讲道中讲过这个内容。你想让我帮你探索讲道中涵盖的相关主题吗？例如，我可以搜索与此主题相关的圣经基础或实际应用的讲道内容。`,

        suggest_related: `我找不到直接回答你问题的讲道内容。

牧师可能在其他讲道中讨论过这个问题，或者从与你提问方式不同的角度讨论过。你可以尝试搜索：
- 更具体的圣经术语
- 提及你感兴趣的圣经段落
- 询问属灵原则的实际应用

你想让我帮你重新表述你的问题吗？`,

        refine_search: `我找不到直接回答你问题的讲道内容。牧师可能使用不同的术语或从不同的角度讨论过这个主题。

为了帮我找到相关的讲道内容，你可以：
- 尝试使用更具体的圣经术语
- 提及你感兴趣的圣经段落
- 询问属灵原则的实际应用
- 专注于基督徒生活的特定方面

你想让我帮你重新表述你的问题吗？`,

        generic: `我没有直接回答你问题的讲道内容。但是，我很乐意帮助你探索牧师教导中的其他主题。

以下是在讲道数据库中有详细介绍的一些主题：
- 祷告和与上帝沟通
- 在困难时期的信心和信任
- 圣经解释和理解
- 实际的基督徒生活

你想让我搜索关于这些主题的讲道内容吗？`
      };

      switch (fallbackStrategy) {
        case "clarify_previous": return chineseFallbacks.clarify_previous;
        case "follow_up": return chineseFallbacks.follow_up;
        case "suggest_related": return chineseFallbacks.suggest_related;
        case "refine_search": return chineseFallbacks.refine_search;
        default: return chineseFallbacks.generic;
      }
    }
    
    // For English, use more dynamic implementation
    let response = "";
    
    switch (fallbackStrategy) {
      case "clarify_previous":
        // Generate a response to clarify previous content
        const topicsPhrase = queryTopics.length > 0 ? 
          `about ${queryTopics.join(" and ")}` : 
          "on that topic";
        
        response = `I don't have specific sermon content that addresses your question ${topicsPhrase}. 

From the previous sermon content we discussed, the pastor focused more on the practical application rather than detailed explanations. Would you like me to suggest a different aspect of this topic that might be covered in the sermons? Or perhaps you could rephrase your question to focus on a specific biblical passage or practical application?`;
        break;
        
      case "follow_up":
        // Generate a response that follows up on previous content
        const topicPhrase = queryTopics.length > 0 ? 
          queryTopics.join(" and ") : 
          "that specific aspect";
        
        response = `I couldn't find sermon content that specifically addresses ${topicPhrase} in relation to your follow-up question. 

The pastor may have covered this in other sermons not in our current database. Would you like me to help you explore a related topic that is covered in the sermons? For example, I could search for sermon content about the biblical foundations or practical applications related to this topic.`;
        break;
        
      case "suggest_related":
        // Generate related topics based on current topics
        const allTopics = [...new Set([...queryTopics, ...previousSermonTopics])];
        const relatedTopics = generateRelatedTopics(allTopics);
        
        // Create a list of suggested search terms
        const suggestedSearches = relatedTopics.map(topic => {
          if (queryTopics.length > 0) {
            return `"${queryTopics[0]} and ${topic}"`;
          } else {
            return `"${topic}"`;
          }
        });
        
        // Format the suggested searches
        const suggestionsText = suggestedSearches.length > 0 ? 
          `You might want to try searching for:\n- ${suggestedSearches.join("\n- ")}` : 
          "You might want to try rephrasing your question to focus on specific biblical teachings or practical applications.";
        
        response = `I couldn't find sermon content that directly addresses your question about ${queryTopics.join(" and ")}. 

The pastor may have discussed this in other sermons or from a different perspective than how you phrased your question. ${suggestionsText}

Would you like me to search for any of these related topics?`;
        break;
        
      case "refine_search":
        response = `I couldn't find sermon content that directly answers your question. The pastor may have addressed this topic using different terminology or approached it from a different angle.

To help me find relevant sermon content, you could:
- Try using more specific biblical terms
- Mention a Bible passage you're interested in
- Ask about practical application of a spiritual principle
- Focus on a specific aspect of Christian living

Would you like me to help you rephrase your question?`;
        break;
        
      default:
        response = `I don't have sermon content that directly addresses your question. However, I'd be happy to help you explore other topics from the pastor's teachings.

Here are some topics that are well-covered in the sermon database:
- Prayer and communication with God
- Faith and trust in difficult times
- Biblical interpretation and understanding
- Practical Christian living

Would you like me to search for sermon content on any of these topics instead?`;
    }
    
    return response;
  }

  /**
   * Generate related topics based on given topics
   */
  function generateRelatedTopics(topics) {
    // Topic relationships - what topics are commonly related to others
    const topicRelationships = {
      "prayer": ["faith", "spiritual disciplines", "hearing from God"],
      "faith": ["trust", "doubt", "spiritual growth"],
      "forgiveness": ["reconciliation", "healing", "relationships"],
      "relationships": ["family", "marriage", "community"],
      "biblical interpretation": ["theology", "hermeneutics", "Bible study"],
      "spiritual growth": ["discipleship", "maturity", "sanctification"]
    };
    
    const relatedTopics = [];
    
    // Find related topics based on the topic relationships
    topics.forEach(topic => {
      if (topicRelationships[topic]) {
        topicRelationships[topic].forEach(relatedTopic => {
          if (!topics.includes(relatedTopic) && !relatedTopics.includes(relatedTopic)) {
            relatedTopics.push(relatedTopic);
          }
        });
      }
    });
    
    // If we still don't have enough related topics, add some general ones
    if (relatedTopics.length < 3) {
      const generalTopics = ["prayer", "faith", "biblical teaching", "spiritual growth"];
      generalTopics.forEach(topic => {
        if (!topics.includes(topic) && !relatedTopics.includes(topic)) {
          relatedTopics.push(topic);
        }
      });
    }
    
    // Return at most 3 related topics
    return relatedTopics.slice(0, 3);
  }

  // ======= INITIALIZATION =======

  /**
   * Initialize the application
   */
  function init() {
    // Get DOM elements
    elements = {
      chatForm: getElement('chatForm'),
      queryInput: getElement('queryInput'),
      messagesContainer: getElement('messages'),
      sourcesPanel: getElement('sourcesPanel'),
      sourcesPanelContent: getElement('sourcesPanelContent'),
      closeSourcesButton: getElement('closeSourcesPanel'),
      apiStatusBanner: getElement('api-status-banner'),
      apiStatusMessage: getElement('api-status-message'),
      retryConnectionButton: getElement('retry-connection'),
      languageSelect: getElement('languageSelect'),
      clearConversationBtn: getElement('clearConversation'),
      infoToggle: getElement('infoToggle'),
      infoSection: getElement('infoSection')
    };
    
    // Create backdrop for mobile sources panel
    if (elements.sourcesPanel) {
      const backdrop = document.createElement('div');
      backdrop.className = 'claude-sources-backdrop';
      backdrop.style.display = 'none';
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.right = '0';
      backdrop.style.bottom = '0';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      backdrop.style.zIndex = '50';
      backdrop.style.opacity = '0';
      backdrop.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(backdrop);
      
      elements.sourcesBackdrop = backdrop;
      
      // Close panel when backdrop is clicked
      backdrop.addEventListener('click', function() {
        toggleSourcesPanel(false);
      });
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Make sure overlay container exists
    ensureOverlayContainer();
    
    // Verify API connection
    verifyApiConnection(false);
    
    // Display welcome message for first-time users
    if (state.isFirstLoad) {
      displayWelcomeMessage();
    }
    
    // Set initial language
    if (elements.languageSelect) {
      changeLanguage(elements.languageSelect.value);
    }
    
    console.log('Sermon Search application initialized');
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Form submission
    if (elements.chatForm) {
      elements.chatForm.addEventListener('submit', function(event) {
        try {
          handleSubmit(event);
        } catch (error) {
          console.error('Error in form submission handler:', error);
          // Show error to user
          const errorMsg = `
            <div class="error-container">
              <p>Sorry, an error occurred: ${error.message}</p>
            </div>
          `;
          addMessage(errorMsg, 'bot', true);
        }
      });
    }
    
    // Input field enhancements
    if (elements.queryInput) {
      // Auto-resize textarea
      adjustTextareaHeight(elements.queryInput);
      
      elements.queryInput.addEventListener('input', function() {
        adjustTextareaHeight(this);
      });
      
      // Better keyboard handling
      elements.queryInput.addEventListener('keydown', function(e) {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (elements.chatForm) elements.chatForm.dispatchEvent(new Event('submit'));
        }
        
        // Handle Escape key to blur the textarea
        if (e.key === 'Escape') {
          this.blur();
        }
      });
      
      // Visual feedback
      elements.queryInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });
      
      elements.queryInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
      });
      
      // Focus on load
      setTimeout(() => elements.queryInput.focus(), 500);
    }
    
    // Sources panel close button
    if (elements.closeSourcesButton) {
      elements.closeSourcesButton.addEventListener('click', function() {
        toggleSourcesPanel(false);
      });
    }
    
    // Language selector
    if (elements.languageSelect) {
      elements.languageSelect.addEventListener('change', function() {
        changeLanguage(this.value);
      });
    }
    
    // Clear conversation button
    if (elements.clearConversationBtn) {
      elements.clearConversationBtn.addEventListener('click', clearConversation);
    }
    
    // Retry connection button
    if (elements.retryConnectionButton) {
      elements.retryConnectionButton.addEventListener('click', function() {
        verifyApiConnection(true);
      });
    }
    
    // Info toggle button (mobile)
    if (elements.infoToggle && elements.infoSection) {
      elements.infoToggle.addEventListener('click', function() {
        elements.infoSection.classList.toggle('active');
        this.classList.toggle('active');
      });
    }
    
    // Make example questions clickable
    setupExampleQuestionClicks();
    
    // Global event listener for overlay close via escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const activeOverlay = document.querySelector('.claude-overlay.active');
        if (activeOverlay) {
          closeOverlay(activeOverlay);
        }
      }
    });
    
    // Add touch swipe down to close sources panel on mobile
    if (elements.sourcesPanel) {
      let touchStartY = 0;
      let touchMoveY = 0;
      
      elements.sourcesPanel.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
      }, {passive: true});
      
      elements.sourcesPanel.addEventListener('touchmove', function(e) {
        touchMoveY = e.touches[0].clientY;
        const deltaY = touchMoveY - touchStartY;
        
        // Only allow swiping down to close
        if (deltaY > 0 && window.innerWidth <= 768) {
          e.preventDefault();
          
          // Apply a transform to follow finger but with resistance
          const translateY = Math.min(deltaY * 0.5, 100);
          elements.sourcesPanel.style.transform = `translateY(${translateY}px)`;
        }
      }, {passive: false});
      
      elements.sourcesPanel.addEventListener('touchend', function() {
        const deltaY = touchMoveY - touchStartY;
        
        if (deltaY > 80 && window.innerWidth <= 768) {
          // Close the panel if swiped down enough
          toggleSourcesPanel(false);
        }
        
        // Reset transform
        elements.sourcesPanel.style.transform = '';
        touchStartY = 0;
        touchMoveY = 0;
      }, {passive: true});
    }
    
    // Handle window resize for mobile transitions
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        // If transitioning from mobile to desktop, reset transitions
        if (elements.sourcesPanel && elements.sourcesPanel.classList.contains('active')) {
          elements.sourcesPanel.style.transform = '';
        }
      }
    });
    
    // Observe theme changes for consistent dark mode
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleThemeChange = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      
      // Set initial value
      handleThemeChange(darkModeMediaQuery);
      
      // Listen for changes
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', handleThemeChange);
      } else if (darkModeMediaQuery.addListener) {
        // Fallback for older browsers
        darkModeMediaQuery.addListener(handleThemeChange);
      }
    }
  }

  /**
   * Setup click handlers for example questions
   */
  function setupExampleQuestionClicks() {
    const exampleQuestions = document.querySelectorAll('.example-questions li');
    
    exampleQuestions.forEach(item => {
      item.style.cursor = 'pointer';
      
      item.addEventListener('click', function() {
        const query = this.textContent.trim();
        
        if (elements.queryInput) {
          elements.queryInput.value = query;
          
          // Smoothly scroll to chat section
          const chatSection = document.querySelector('.chat-section-wrapper');
          if (chatSection) {
            chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          
          // Short delay before submitting to let scroll complete
          setTimeout(() => {
            elements.chatForm.dispatchEvent(new Event('submit'));
          }, 500);
        }
      });
    });
  }

  // ======= PUBLIC API =======
  
  // Return the public API
  return {
    init: init,
    changeLanguage: changeLanguage,
    clearConversation: clearConversation,
    toggleSourcesPanel: toggleSourcesPanel,
    handleSubmit: handleSubmit
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  SermonSearch.init();
});
