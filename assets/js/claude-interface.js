/**
 * Unified Sermon Search Interface
 * Combines Claude-style interface with enhanced sources panel and fixed positioning
 */

document.addEventListener('DOMContentLoaded', function() {
    initSermonSearchInterface();
  });
  
  function initSermonSearchInterface() {
    console.log('Initializing unified sermon search interface');
    
    // Create or update app structure for fixed positioning
    restructureDOM();
    
    // Initialize the interface components
    initInterface();
    
    // Setup menu navigation for mobile
    setupNavigation();
  }
  
  /**
   * Restructure the DOM to create a fixed position app-like layout
   */
  function restructureDOM() {
    // Get the page's main elements
    const contentContainer = document.querySelector('.container');
    if (!contentContainer) return;
    
    // Get existing Claude interface or create one if not exists
    let claudeInterface = document.querySelector('.claude-interface');
    
    // Create app container if it doesn't exist
    let appContainer = document.querySelector('.app-container');
    if (!appContainer) {
      appContainer = document.createElement('div');
      appContainer.className = 'app-container';
      
      // Create app header
      const appHeader = document.createElement('div');
      appHeader.className = 'app-header';
      appHeader.innerHTML = `
        <button class="app-menu-button" aria-label="Open navigation menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1 class="app-title">Sermon Search</h1>
        <div style="width: 24px;"></div> <!-- Spacer for alignment -->
      `;
      
      // Create navigation menu
      const navMenu = document.createElement('div');
      navMenu.className = 'app-nav-menu';
      navMenu.innerHTML = `
        <div class="app-nav-content">
          <div class="app-nav-header">
            <h2 class="app-nav-title">Sermon Search</h2>
            <p class="app-nav-subtitle">Explore Biblical Teachings</p>
          </div>
          <ul class="app-nav-links">
            <li class="app-nav-item">
              <a href="index.html" class="app-nav-link">
                <svg class="app-nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Home
              </a>
            </li>
            <li class="app-nav-item">
              <a href="search.html" class="app-nav-link">
                <svg class="app-nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Chat Search
              </a>
            </li>
            <li class="app-nav-item">
              <a href="#" class="app-nav-link">
                <svg class="app-nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                Sermon Library
              </a>
            </li>
            <li class="app-nav-item">
              <a href="#" class="app-nav-link">
                <svg class="app-nav-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                About
              </a>
            </li>
          </ul>
        </div>
      `;
      
      // Create menu backdrop
      const menuBackdrop = document.createElement('div');
      menuBackdrop.className = 'app-menu-backdrop';
      
      // Create sources backdrop
      const sourcesBackdrop = document.createElement('div');
      sourcesBackdrop.className = 'claude-sources-backdrop';
      
      // Move the Claude interface into the app container
      if (claudeInterface) {
        // If it already exists, just move it
        appContainer.appendChild(appHeader);
        appContainer.appendChild(claudeInterface);
      } else {
        // If it doesn't exist, create a basic structure
        claudeInterface = document.createElement('div');
        claudeInterface.className = 'claude-interface';
        
        const chatPanel = document.createElement('div');
        chatPanel.className = 'claude-chat-panel';
        
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'claude-messages';
        messagesContainer.id = 'messages';
        
        const inputArea = document.createElement('div');
        inputArea.className = 'claude-input-area';
        inputArea.innerHTML = `
          <form id="chatForm">
            <div class="claude-input-container">
              <textarea id="queryInput" class="claude-input" placeholder="Ask a question about the sermons..." rows="1"></textarea>
              <button type="submit" class="claude-submit-button" aria-label="Send message">
                <svg class="claude-submit-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                </svg>
              </button>
            </div>
          </form>
          <div class="conversation-controls">
            <button id="clearConversation" class="control-button">Clear Conversation</button>
          </div>
        `;
        
        const sourcesPanel = document.createElement('div');
        sourcesPanel.className = 'claude-sources-panel';
        sourcesPanel.id = 'sourcesPanel';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'claude-sources-close';
        closeButton.id = 'closeSourcesPanel';
        closeButton.innerHTML = '×';
        closeButton.setAttribute('aria-label', 'Close sources panel');
        
        const sourcesPanelContent = document.createElement('div');
        sourcesPanelContent.className = 'claude-sources-panel-content';
        sourcesPanelContent.id = 'sourcesPanelContent';
        
        sourcesPanel.appendChild(closeButton);
        sourcesPanel.appendChild(sourcesPanelContent);
        
        chatPanel.appendChild(messagesContainer);
        chatPanel.appendChild(inputArea);
        
        claudeInterface.appendChild(chatPanel);
        claudeInterface.appendChild(sourcesPanel);
        
        appContainer.appendChild(appHeader);
        appContainer.appendChild(claudeInterface);
      }
      
      // Add API status banner if it doesn't exist
      if (!document.getElementById('api-status-banner')) {
        const apiStatusBanner = document.createElement('div');
        apiStatusBanner.id = 'api-status-banner';
        apiStatusBanner.className = 'claude-api-status';
        apiStatusBanner.style.display = 'none';
        document.body.appendChild(apiStatusBanner);
      }
      
      // Append to document
      document.body.appendChild(menuBackdrop);
      document.body.appendChild(sourcesBackdrop);
      document.body.appendChild(navMenu);
      document.body.appendChild(appContainer);
      
      // Move the language selector to the header
      const languageSelector = document.querySelector('.language-selector');
      if (languageSelector) {
        const spacer = appHeader.querySelector('div');
        appHeader.replaceChild(languageSelector, spacer);
        languageSelector.style.position = 'static';
      }
      
      // Preserve existing content by hiding it
      contentContainer.style.display = 'none';
    }
    
    // Make sure the interface takes up more screen space
    if (claudeInterface) {
      claudeInterface.style.maxWidth = '100%';
      claudeInterface.style.height = '90vh';
      claudeInterface.style.margin = '1rem auto';
    }
  }
  
  /**
   * Initialize the main interface components
   */
  function initInterface() {
    console.log('Initializing enhanced interface components');
    
    // Elements
    const queryInput = document.getElementById('queryInput');
    const messagesContainer = document.getElementById('messages');
    const sourcesPanel = document.getElementById('sourcesPanel');
    const sourcesPanelContent = document.getElementById('sourcesPanelContent');
    const closeSourcesButton = document.getElementById('closeSourcesPanel');
    const apiStatusBanner = document.getElementById('api-status-banner');
    const chatForm = document.getElementById('chatForm');
    const sourcesBackdrop = document.querySelector('.claude-sources-backdrop');
    
    // Add a close button to the API status banner
    if (apiStatusBanner) {
      const closeButton = document.createElement('button');
      closeButton.className = 'claude-api-status-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close notification');
      closeButton.addEventListener('click', function() {
        apiStatusBanner.style.display = 'none';
      });
      apiStatusBanner.appendChild(closeButton);
      
      // Add swipe to dismiss API status banner
      let touchStartX = 0;
      
      apiStatusBanner.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
      }, {passive: true});
      
      apiStatusBanner.addEventListener('touchmove', function(e) {
        const touchX = e.touches[0].clientX;
        const deltaX = touchX - touchStartX;
        
        if (Math.abs(deltaX) > 30) {
          this.style.transform = `translateX(${deltaX}px)`;
          this.style.opacity = 1 - Math.abs(deltaX) / 300;
        }
      }, {passive: true});
      
      apiStatusBanner.addEventListener('touchend', function(e) {
        const touchX = e.changedTouches[0].clientX;
        const deltaX = touchX - touchStartX;
        
        if (Math.abs(deltaX) > 100) {
          // Swipe to dismiss
          this.style.transform = `translateX(${deltaX > 0 ? 300 : -300}px)`;
          this.style.opacity = '0';
          
          setTimeout(() => {
            this.style.display = 'none';
            this.style.transform = '';
            this.style.opacity = '';
          }, 300);
        } else {
          // Reset position
          this.style.transform = '';
          this.style.opacity = '';
        }
      }, {passive: true});
    }
    
    // Auto-resize textarea with improved behavior
    if (queryInput) {
      // Initial height adjustment
      adjustTextareaHeight(queryInput);
      
      queryInput.addEventListener('input', function() {
        adjustTextareaHeight(this);
      });
      
      // Better keyboard handling for form submission
      queryInput.addEventListener('keydown', function(e) {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (chatForm) chatForm.dispatchEvent(new Event('submit'));
        }
        
        // Handle Escape key to blur the textarea
        if (e.key === 'Escape') {
          this.blur();
        }
      });
      
      // Add focus and blur handlers for visual feedback
      queryInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });
      
      queryInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
      });
    }
    
    // Enhance close sources panel button
    if (closeSourcesButton && sourcesPanel) {
      closeSourcesButton.addEventListener('click', function() {
        sourcesPanel.classList.remove('active');
        
        if (sourcesBackdrop) {
          sourcesBackdrop.style.opacity = '0';
          setTimeout(() => {
            sourcesBackdrop.style.display = 'none';
          }, 300);
        }
        
        // Also update any active source toggle buttons
        const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
        activeToggles.forEach(toggle => {
          toggle.setAttribute('data-active', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
        });
      });
    }
    
    // Close panel when backdrop is clicked
    if (sourcesBackdrop) {
      sourcesBackdrop.addEventListener('click', function() {
        if (closeSourcesButton) closeSourcesButton.click();
      });
    }
    
    // Add swipe handling for mobile sources panel
    if (sourcesPanel) {
      let touchStartY = 0;
      let touchMoveY = 0;
      
      sourcesPanel.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
      }, {passive: true});
      
      sourcesPanel.addEventListener('touchmove', function(e) {
        touchMoveY = e.touches[0].clientY;
        const deltaY = touchMoveY - touchStartY;
        
        // Only allow swiping down to close
        if (deltaY > 0 && window.innerWidth <= 768) {
          e.preventDefault();
          
          // Apply a transform to follow finger but with resistance
          const translateY = Math.min(deltaY * 0.5, 100);
          sourcesPanel.style.transform = `translateY(${translateY}px)`;
        }
      }, {passive: false});
      
      sourcesPanel.addEventListener('touchend', function() {
        const deltaY = touchMoveY - touchStartY;
        
        if (deltaY > 80 && window.innerWidth <= 768) {
          // Close the panel if swiped down enough
          closeSourcesButton.click();
        }
        
        // Reset transform
        sourcesPanel.style.transform = '';
        touchStartY = 0;
        touchMoveY = 0;
      }, {passive: true});
    }
    
    // Override the original addMessage function with improved version
    window.originalAddMessage = window.addMessage;
    window.addMessage = function(text, sender, isError = false) {
      if (!messagesContainer) return null;
      
      const messageElement = document.createElement('div');
      messageElement.className = `claude-message claude-message-${sender}`;
      messageElement.id = 'msg-' + Date.now();
      
      // For screen readers, add role and aria attributes
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
            const sourcesToggle = document.createElement('button'); // Changed to button for better accessibility
            sourcesToggle.className = 'claude-sources-toggle';
            sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
            sourcesToggle.setAttribute('data-active', 'false');
            sourcesToggle.setAttribute('aria-expanded', 'false');
            sourcesToggle.setAttribute('aria-controls', 'sourcesPanel');
            
            sourcesToggle.addEventListener('click', function() {
              const isActive = this.getAttribute('data-active') === 'true';
              
              if (isActive) {
                sourcesPanel.classList.remove('active');
                this.setAttribute('data-active', 'false');
                this.setAttribute('aria-expanded', 'false');
                this.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
                
                if (sourcesBackdrop) {
                  sourcesBackdrop.style.opacity = '0';
                  setTimeout(() => {
                    sourcesBackdrop.style.display = 'none';
                  }, 300);
                }
              } else {
                sourcesPanel.classList.add('active');
                this.setAttribute('data-active', 'true');
                this.setAttribute('aria-expanded', 'true');
                this.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> ' + translate('hide-sources');
                
                if (sourcesBackdrop) {
                  sourcesBackdrop.style.display = 'block';
                  setTimeout(() => {
                    sourcesBackdrop.style.opacity = '1';
                  }, 10);
                }
              }
            });
            
            messageContent.appendChild(sourcesToggle);
          }
        }
        
        // Make Bible references clickable with improved behavior
        setupBibleReferenceClicks(messageContent);
        
      } else {
        // For user messages, use text content for security
        messageContent.textContent = text;
      }
      
      messageElement.appendChild(messageContent);
      messagesContainer.appendChild(messageElement);
      
      // Smooth scroll to the bottom with improved behavior
      smoothScrollToBottom(messagesContainer);
      
      return messageElement;
    };
    
    // Override the typing indicator with improved animation
    window.addTypingIndicator = function() {
      if (!messagesContainer) return null;
      
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
      
      messagesContainer.appendChild(typingElement);
      
      // Smooth scroll to bottom
      smoothScrollToBottom(messagesContainer);
      
      return typingElement.id;
    };
    
    // Improved smooth scrolling function
    window.smoothScrollToBottom = function(container) {
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
    };
    
    // Properly remove an element with animation
    window.removeMessage = function(id) {
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
    };
    
    // Override displayAnswer to enhance sources presentation
    window.originalDisplayAnswer = window.displayAnswer;
    window.displayAnswer = function(data) {
      if (!data || !data.answer) {
        console.error('Invalid data received from API');
        addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
        return;
      }
      
      // Check if there are any sermon sources
      const hasSermonContent = data.sources && data.sources.length > 0;
      
      // If no sermon content but we have conversation history, use the fallback logic
      if (!hasSermonContent && data.answer.includes(translate('no-results')) && window.conversationHistory && window.conversationHistory.length > 0) {
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
          sourcesPanelContent.innerHTML = '';
          
          // Add title with source count and organization header
          const sourcesTitle = document.createElement('h3');
          sourcesTitle.innerHTML = translate('sources-found') + ' <span class="sources-count">' + data.sources.length + '</span>';
          sourcesPanelContent.appendChild(sourcesTitle);
          
          // Add source organization info
          const sourcesInfo = document.createElement('div');
          sourcesInfo.className = 'claude-sources-info';
          sourcesInfo.innerHTML = `<p>Sources are organized by relevance. Click on timestamps to jump to video sections.</p>`;
          sourcesPanelContent.appendChild(sourcesInfo);
          
          // Sort sources by similarity score
          const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
          
          // Group sources by sermon if possible
          const sermonGroups = groupSourcesBySermon(sortedSources);
          
          // Add sources to panel
          if (Object.keys(sermonGroups).length > 1) {
            // If we have multiple sermons, group them
            Object.entries(sermonGroups).forEach(([sermonTitle, sources], index) => {
              // Add sermon group header
              const groupHeader = document.createElement('div');
              groupHeader.className = 'claude-source-group-header';
              groupHeader.innerHTML = `<h4>${sermonTitle} <span class="sources-count">${sources.length}</span></h4>`;
              sourcesPanelContent.appendChild(groupHeader);
              
              // Add sources in this group
              sources.forEach((source, sourceIndex) => {
                const sourceElement = createEnhancedSourceElement(source, sourceIndex);
                sourcesPanelContent.appendChild(sourceElement);
              });
            });
          } else {
            // Just add sources normally if no useful grouping
            sortedSources.forEach((source, index) => {
              const sourceElement = createEnhancedSourceElement(source, index);
              sourcesPanelContent.appendChild(sourceElement);
            });
          }
          
          // Auto-open sources panel for first answer
          if (window.conversationHistory && window.conversationHistory.length <= 2) {
            setTimeout(() => {
              sourcesPanel.classList.add('active');
              
              if (sourcesBackdrop) {
                sourcesBackdrop.style.display = 'block';
                setTimeout(() => { sourcesBackdrop.style.opacity = '1'; }, 10);
              }
              
              const sourcesToggle = messageElement.querySelector('.claude-sources-toggle');
              if (sourcesToggle) {
                sourcesToggle.setAttribute('data-active', 'true');
                sourcesToggle.setAttribute('aria-expanded', 'true');
                sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> ' + translate('hide-sources');
              }
            }, 500);
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
      
      // Add ripple effect to new message for attention
      addRippleEffect(messageElement);
    };
    
    // Group sources by sermon title for better organization
    function groupSourcesBySermon(sources) {
      const groups = {};
      
      sources.forEach(source => {
        const title = formatSermonTitle ? formatSermonTitle(source.title) : source.title;
        if (!groups[title]) {
          groups[title] = [];
        }
        groups[title].push(source);
      });
      
      return groups;
    }
    
    // Create enhanced Claude-style welcome message
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
      
      // Add suggestion chips with improved interaction
      const sampleQueries = window.getTranslatedQueries ? window.getTranslatedQueries() : [
        'How does a person get to heaven?',
        'What is the Trinity?',
        'How should Christians live?',
        'Why read the King James Bible?',
        'Who is Melchizedek?'
      ];
      
      sampleQueries.forEach(query => {
        const chip = document.createElement('button');
        chip.className = 'claude-suggestion';
        chip.textContent = query;
        chip.setAttribute('role', 'listitem');
        chip.setAttribute('type', 'button');
        
        // Add ripple effect on click
        chip.addEventListener('click', function(e) {
          // Add visual feedback
          const ripple = document.createElement('span');
          ripple.className = 'claude-ripple';
          ripple.style.position = 'absolute';
          ripple.style.borderRadius = '50%';
          ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
          ripple.style.width = '100px';
          ripple.style.height = '100px';
          ripple.style.pointerEvents = 'none';
          ripple.style.left = (e.clientX - this.getBoundingClientRect().left - 50) + 'px';
          ripple.style.top = (e.clientY - this.getBoundingClientRect().top - 50) + 'px';
          ripple.style.transform = 'scale(0)';
          ripple.style.transition = 'transform 0.6s ease-out';
          
          this.style.position = 'relative';
          this.style.overflow = 'hidden';
          this.appendChild(ripple);
          
          setTimeout(() => {
            ripple.style.transform = 'scale(2)';
          }, 1);
          
          setTimeout(() => {
            ripple.remove();
            document.getElementById('queryInput').value = query;
            document.getElementById('chatForm').dispatchEvent(new Event('submit'));
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
    
    // Create an enhanced source element with Kindle-like reading experience
    function createEnhancedSourceElement(source, index) {
      const sourceElement = document.createElement('div');
      sourceElement.className = 'claude-source-item';
      sourceElement.setAttribute('data-video-id', source.video_id);
      sourceElement.setAttribute('data-index', index);
      
      // Add ARIA attributes for accessibility
      sourceElement.setAttribute('role', 'region');
      sourceElement.setAttribute('aria-label', 'Sermon source ' + (index + 1));
      
      const similarity = Math.round(source.similarity * 100);
      const videoUrl = `https://www.youtube.com/embed/${source.video_id}?start=${Math.floor(source.start_time)}`;
      
      // Format title and date for display
      const formattedTitle = formatSermonTitle ? formatSermonTitle(source.title) : source.title;
      let formattedDate = 'Date unknown';
      if (source.publish_date) {
        formattedDate = formatSermonDate ? formatSermonDate(source.publish_date) : source.publish_date;
      }
      
      // Create source header with improved formatting
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
      
      // Create source content with better formatting
      const content = document.createElement('div');
      content.className = 'claude-source-content';
      
      // Create quote text with kindle-like reading experience
      const textContainer = document.createElement('div');
      textContainer.className = 'claude-source-text-container';
      
      const text = document.createElement('div');
      text.className = 'claude-source-text';
      text.innerHTML = `"${formatText ? formatText(source.text) : source.text}"`;
      
      // Add font size controls for reading experience
      const readingControls = document.createElement('div');
      readingControls.className = 'claude-reading-controls';
      readingControls.innerHTML = `
        <button class="claude-font-decrease" aria-label="Decrease font size">A-</button>
        <button class="claude-font-increase" aria-label="Increase font size">A+</button>
      `;
      
      // Add font size control functionality
      const fontDecreaseBtn = readingControls.querySelector('.claude-font-decrease');
      const fontIncreaseBtn = readingControls.querySelector('.claude-font-increase');
      
      fontDecreaseBtn.addEventListener('click', function() {
        const currentSize = parseFloat(window.getComputedStyle(text).fontSize);
        text.style.fontSize = Math.max(currentSize - 1, 12) + 'px';
      });
      
      fontIncreaseBtn.addEventListener('click', function() {
        const currentSize = parseFloat(window.getComputedStyle(text).fontSize);
        text.style.fontSize = Math.min(currentSize + 1, 20) + 'px';
      });
      
      textContainer.appendChild(text);
      textContainer.appendChild(readingControls);
      
      // Check if the text is scrollable and add indicator class
      setTimeout(() => {
        if (text.scrollHeight > text.clientHeight) {
          text.classList.add('scrollable');
        }
      }, 100);
      
      const meta = document.createElement('div');
      meta.className = 'claude-source-meta';
      
      const timestamp = document.createElement('div');
      timestamp.className = 'claude-source-timestamp';
      timestamp.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 5px">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
        <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg> ${formatTimestamp ? formatTimestamp(source.start_time) : source.start_time}`;
      
      const match = document.createElement('div');
      match.className = 'claude-source-match';
      match.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 5px">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg> ${similarity}% ${translate('match') || 'match'}`;
      
      meta.appendChild(timestamp);
      meta.appendChild(match);
      
      // Create actions with improved accessibility
      const actions = document.createElement('div');
      actions.className = 'claude-source-actions';
      
      // Watch video button
      const watchButton = document.createElement('button');
      watchButton.className = 'claude-source-button claude-source-button-primary';
      watchButton.textContent = translate('watch-video') || 'Watch Video';
      watchButton.setAttribute('aria-expanded', 'false');
      watchButton.onclick = function() {
        const videoContainer = this.parentElement.parentElement.querySelector('.claude-video-container');
        if (!videoContainer) {
          // Create video container if it doesn't exist
          const container = document.createElement('div');
          container.className = 'claude-video-container';
          container.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Sermon video at ${formatTimestamp ? formatTimestamp(source.start_time) : source.start_time}"></iframe>`;
          content.insertBefore(container, content.firstChild);
          this.textContent = translate('hide-video') || 'Hide Video';
          this.setAttribute('aria-expanded', 'true');
        } else {
          // Toggle visibility
          if (videoContainer.style.display === 'none') {
            videoContainer.style.display = 'block';
            this.textContent = translate('hide-video') || 'Hide Video';
            this.setAttribute('aria-expanded', 'true');
          } else {
            videoContainer.style.display = 'none';
            this.textContent = translate('watch-video') || 'Watch Video';
            this.setAttribute('aria-expanded', 'false');
          }
        }
      };
      
      // Transcript button
      const transcriptButton = document.createElement('button');
      transcriptButton.className = 'claude-source-button';
      transcriptButton.textContent = translate('view-transcript') || 'View Transcript';
      transcriptButton.setAttribute('aria-expanded', 'false');
      transcriptButton.onclick = function() {
        // Get video ID from parent element
        const videoId = this.closest('.claude-source-item').getAttribute('data-video-id');
        const startTime = source.start_time;
        
        // Look for existing transcript
        const transcriptContainer = this.parentElement.parentElement.querySelector('.claude-transcript');
        if (!transcriptContainer) {
          // Create transcript container if it doesn't exist
          const container = document.createElement('div');
          container.className = 'claude-transcript';
          container.setAttribute('role', 'region');
          container.setAttribute('aria-label', 'Sermon transcript');
          container.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript') || 'Loading transcript...'}</div>`;
          content.appendChild(container);
          
          // Fetch transcript with improved error handling
          fetchTranscript(videoId, startTime).then(transcriptData => {
            // Update container with transcript content
            updateTranscriptReaderExperience(container, transcriptData, startTime);
          }).catch(error => {
            container.innerHTML = `<div class="claude-transcript-error">Error loading transcript: ${error.message}</div>`;
          });
          
          this.textContent = translate('hide-transcript') || 'Hide Transcript';
          this.setAttribute('aria-expanded', 'true');
        } else {
          // Toggle visibility
          if (transcriptContainer.style.display === 'none') {
            transcriptContainer.style.display = 'block';
            this.textContent = translate('hide-transcript') || 'Hide Transcript';
            this.setAttribute('aria-expanded', 'true');
          } else {
            transcriptContainer.style.display = 'none';
            this.textContent = translate('view-transcript') || 'View Transcript';
            this.setAttribute('aria-expanded', 'false');
          }
        }
      };
      
      // YouTube button
      const youtubeButton = document.createElement('button');
      youtubeButton.className = 'claude-source-button';
      youtubeButton.textContent = translate('open-youtube') || 'Open in YouTube';
      youtubeButton.setAttribute('aria-label', 'Open video in YouTube at ' + (formatTimestamp ? formatTimestamp(source.start_time) : source.start_time));
      youtubeButton.onclick = function() {
        window.open(`https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}`, '_blank');
      };
      
      // Add buttons to actions
      actions.appendChild(watchButton);
      actions.appendChild(transcriptButton);
      actions.appendChild(youtubeButton);
      
      // Assemble all components
      content.appendChild(textContainer);
      content.appendChild(meta);
      content.appendChild(actions);
      
      sourceElement.appendChild(header);
      sourceElement.appendChild(content);
      
      return sourceElement;
    }
    
    // Update transcript container with Kindle-like reading experience
    function updateTranscriptReaderExperience(container, data, startTime) {
      container.innerHTML = '';
      
      // Check if transcript data is valid
      if (!data || (!data.segments && !data.transcript)) {
        container.innerHTML = '<div class="claude-transcript-error">Transcript data not available</div>';
        return;
      }
      
      // Create reader controls - font size, theme, etc.
      const readerControls = document.createElement('div');
      readerControls.className = 'claude-transcript-reader-controls';
      readerControls.innerHTML = `
        <div class="claude-transcript-font-controls">
          <button class="claude-font-decrease" aria-label="Decrease font size">A-</button>
          <button class="claude-font-reset" aria-label="Reset font size">A</button>
          <button class="claude-font-increase" aria-label="Increase font size">A+</button>
        </div>
        <div class="claude-transcript-theme-controls">
          <button class="claude-theme-light active" aria-label="Light theme">Light</button>
          <button class="claude-theme-sepia" aria-label="Sepia theme">Sepia</button>
          <button class="claude-theme-dark" aria-label="Dark theme">Dark</button>
        </div>
      `;
      
      container.appendChild(readerControls);
      
      // If there's a note (like language unavailability), display it
      if (data.note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'claude-transcript-note';
        noteElement.innerHTML = `<p><em>${data.note}</em></p>`;
        container.appendChild(noteElement);
      }
      
      // Create progress bar for transcript navigation
      const progressContainer = document.createElement('div');
      progressContainer.className = 'claude-transcript-progress';
      progressContainer.innerHTML = `<div class="claude-transcript-progress-bar"></div>`;
      container.appendChild(progressContainer);
      
      // Add transcript search capability
      const searchContainer = document.createElement('div');
      searchContainer.className = 'claude-transcript-search';
      searchContainer.innerHTML = `
        <input type="text" class="claude-transcript-search-input" placeholder="${translate('search-in-transcript') || 'Search in transcript'}..." aria-label="${translate('search-in-transcript') || 'Search in transcript'}">
        <button class="claude-transcript-search-button" aria-label="${translate('search') || 'Search'}">${translate('search') || 'Search'}</button>
      `;
      
      const searchInput = searchContainer.querySelector('.claude-transcript-search-input');
      const searchButton = searchContainer.querySelector('.claude-transcript-search-button');
      
      // Add event listeners for search
      if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
          searchInTranscript(searchInput.value, container);
        });
        
        searchInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            searchInTranscript(searchInput.value, container);
          }
        });
      }
      
      container.appendChild(searchContainer);
      
      // Process segmented transcript with timestamps
      if (data.segments && Array.isArray(data.segments)) {
        // Create reader container
        const readerContainer = document.createElement('div');
        readerContainer.className = 'claude-transcript-reader';
        
        const transcriptContent = document.createElement('div');
        transcriptContent.className = 'claude-transcript-content';
        
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
          segmentElement.id = `transcript-segment-${index}`;
          segmentElement.setAttribute('data-time', segment.start_time);
          
          // Highlight segments close to the start time
          if (Math.abs(segment.start_time - startTime) < 10) {
            segmentElement.classList.add('claude-transcript-highlight');
            highlightedSegmentId = segmentElement.id;
          }
          
          const timestampElement = document.createElement('div');
          timestampElement.className = 'claude-transcript-timestamp';
          timestampElement.textContent = formatTimestamp ? formatTimestamp(segment.start_time) : segment.start_time;
          timestampElement.setAttribute('role', 'button');
          timestampElement.setAttribute('tabindex', '0');
          timestampElement.setAttribute('aria-label', `Jump to ${formatTimestamp ? formatTimestamp(segment.start_time) : segment.start_time}`);
          
          // Add click and keyboard handling for timestamps
          timestampElement.addEventListener('click', function() {
            jumpToTimestamp(segment.start_time, container);
          });
          
          timestampElement.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              jumpToTimestamp(segment.start_time, container);
            }
          });
          
          const textElement = document.createElement('div');
          textElement.className = 'claude-transcript-text';
          textElement.textContent = segment.text;
          
          segmentElement.appendChild(timestampElement);
          segmentElement.appendChild(textElement);
          transcriptContent.appendChild(segmentElement);
        });
        
        readerContainer.appendChild(transcriptContent);
        container.appendChild(readerContainer);
        
        // Scroll to highlighted segment with delay for rendering
        if (highlightedSegmentId) {
          setTimeout(() => {
            const highlightedElement = document.getElementById(highlightedSegmentId);
            if (highlightedElement) {
              highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
        
        // Set up reading progress tracking
        setupTranscriptProgressTracking(readerContainer, progressContainer);
        
        // Setup font size controls
        const fontDecreaseBtn = readerControls.querySelector('.claude-font-decrease');
        const fontResetBtn = readerControls.querySelector('.claude-font-reset');
        const fontIncreaseBtn = readerControls.querySelector('.claude-font-increase');
        
        // Default font size
        const defaultFontSize = 16;
        let currentFontSize = defaultFontSize;
        
        fontDecreaseBtn.addEventListener('click', function() {
          currentFontSize = Math.max(currentFontSize - 1, 12);
          transcriptContent.style.fontSize = currentFontSize + 'px';
        });
        
        fontResetBtn.addEventListener('click', function() {
          currentFontSize = defaultFontSize;
          transcriptContent.style.fontSize = currentFontSize + 'px';
        });
        
        fontIncreaseBtn.addEventListener('click', function() {
          currentFontSize = Math.min(currentFontSize + 1, 24);
          transcriptContent.style.fontSize = currentFontSize + 'px';
        });
        
        // Setup theme controls
        const themeButtons = readerControls.querySelectorAll('.claude-transcript-theme-controls button');
        
        themeButtons.forEach(button => {
          button.addEventListener('click', function() {
            // Remove active class from all theme buttons
            themeButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get theme from class name
            const theme = this.className.split(' ')[0].replace('claude-theme-', '');
            
            // Update class on reader container
            readerContainer.className = 'claude-transcript-reader';
            readerContainer.classList.add('claude-theme-' + theme);
          });
        });
      } 
      else if (data.transcript) {
        // Handle plain text transcript
        const textContainer = document.createElement('div');
        textContainer.className = 'claude-transcript-plain-text';
        textContainer.innerHTML = data.transcript
          .split('\n\n')
          .map(para => `<p>${para}</p>`)
          .join('');
        
        container.appendChild(textContainer);
      } 
      else {
        container.innerHTML = '<div class="claude-transcript-error">Transcript format unknown</div>';
      }
      
      // Add download transcript option
      const downloadButton = document.createElement('button');
      downloadButton.className = 'claude-transcript-download';
      downloadButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        ${translate('download-transcript') || 'Download Transcript'}
      `;
      
      downloadButton.addEventListener('click', function() {
        downloadTranscript(data, container);
      });
      
      container.appendChild(downloadButton);
    }
    
    // Function to search within transcript
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
        matchCountElement.className = 'claude-transcript-match-count';
        matchCountElement.textContent = matchCount > 0 
          ? `${matchCount} ${translate('matches-found') || 'matches found'}`
          : `${translate('no-matches-found') || 'No matches found'}`;
        
        // Insert count at top
        container.insertBefore(matchCountElement, container.firstChild.nextSibling);
        
        // Scroll to first match
        if (firstMatchElement) {
          firstMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.error('Error in search:', error);
      }
    }
    
    // Set up transcript progress tracking
    function setupTranscriptProgressTracking(readerContainer, progressContainer) {
      const progressBar = progressContainer.querySelector('.claude-transcript-progress-bar');
      
      // Update progress based on scroll position
      readerContainer.addEventListener('scroll', function() {
        const scrollPosition = readerContainer.scrollTop;
        const totalHeight = readerContainer.scrollHeight - readerContainer.clientHeight;
        const progress = (scrollPosition / totalHeight) * 100;
        
        progressBar.style.width = `${progress}%`;
      });
      
      // Make progress bar clickable for navigation
      progressContainer.addEventListener('click', function(e) {
        const containerWidth = progressContainer.clientWidth;
        const clickX = e.clientX - progressContainer.getBoundingClientRect().left;
        const percentage = clickX / containerWidth;
        
        const totalHeight = readerContainer.scrollHeight - readerContainer.clientHeight;
        const targetScrollPosition = percentage * totalHeight;
        
        readerContainer.scrollTo({
          top: targetScrollPosition,
          behavior: 'smooth'
        });
      });
    }
    
    // Function to jump to timestamp in video
    function jumpToTimestamp(timestamp, container) {
      const sourceItem = container.closest('.claude-source-item');
      if (!sourceItem) return;
      
      const videoId = sourceItem.getAttribute('data-video-id');
      if (!videoId) return;
      
      // Find or create video container
      let videoContainer = sourceItem.querySelector('.claude-video-container');
      const watchButton = sourceItem.querySelector('.claude-source-button-primary');
      
      if (!videoContainer) {
        // Create video if it doesn't exist
        videoContainer = document.createElement('div');
        videoContainer.className = 'claude-video-container';
        videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?start=${Math.floor(timestamp)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Sermon video at ${formatTimestamp ? formatTimestamp(timestamp) : timestamp}"></iframe>`;
        
        const content = sourceItem.querySelector('.claude-source-content');
        if (content) {
          content.insertBefore(videoContainer, content.firstChild);
        }
        
        // Update watch button state
        if (watchButton) {
          watchButton.textContent = translate('hide-video') || 'Hide Video';
          watchButton.setAttribute('aria-expanded', 'true');
        }
      } else {
        // Update existing video with new timestamp
        const iframe = videoContainer.querySelector('iframe');
        if (iframe) {
          iframe.src = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(timestamp)}`;
        }
        
        // Make sure video is visible
        videoContainer.style.display = 'block';
        
        // Update watch button state
        if (watchButton) {
          watchButton.textContent = translate('hide-video') || 'Hide Video';
          watchButton.setAttribute('aria-expanded', 'true');
        }
      }
      
      // Scroll video into view
      videoContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Function to download transcript
    function downloadTranscript(data, container) {
      if (!data) return;
      
      let content = '';
      let filename = 'sermon-transcript.txt';
      
      // Try to get sermon title from the page
      const sourceItem = container.closest('.claude-source-item');
      if (sourceItem) {
        const titleElement = sourceItem.querySelector('.claude-source-title');
        if (titleElement && titleElement.textContent) {
          filename = titleElement.textContent.trim().replace(/[^\w\s-]/g, '') + '-transcript.txt';
        }
        
        const videoId = sourceItem.getAttribute('data-video-id');
        if (videoId) {
          content += `Sermon ID: ${videoId}\n\n`;
        }
      }
      
      // Add date if available
      const dateElement = sourceItem ? sourceItem.querySelector('.claude-source-date') : null;
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
            content += `[${formatTimestamp ? formatTimestamp(segment.start_time) : segment.start_time}] ${segment.text}\n\n`;
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
    
    // Add a ripple effect to a newly added message
    function addRippleEffect(element) {
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
    
    // Function to adjust textarea height based on content
    function adjustTextareaHeight(textarea) {
      if (!textarea) return;
      
      // Reset height to default to correctly calculate scroll height
      textarea.style.height = 'auto';
      
      // Set new height based on content, with max height
      const maxHeight = window.innerHeight * 0.3; // 30% of viewport height
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    }
    
    // Enhanced Bible reference click setup
    function setupBibleReferenceClicks(element) {
      if (!element) return;
      
      // Find all Bible references in an element
      const bibleRefs = element.querySelectorAll('.bible-reference');
      
      bibleRefs.forEach(ref => {
        // Ensure it's accessible
        ref.setAttribute('role', 'button');
        ref.setAttribute('tabindex', '0');
        ref.setAttribute('aria-label', `Open Bible reference: ${ref.textContent.trim()}`);
        
        // Add click handler
        ref.addEventListener('click', function() {
          // Open Bible reference in a Bible website with current language
          const reference = this.textContent.trim();
          const bibleConfig = window.bibleWebsites && window.bibleWebsites[window.currentLanguage || 'en'] 
            ? window.bibleWebsites[window.currentLanguage || 'en'] 
            : { site: 'https://www.biblegateway.com/passage/', version: 'NIV' };
          
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
    
    // Display welcome message in Claude style
    function displayClaudeWelcome() {
      const messagesContainer = document.getElementById('messages');
      if (!messagesContainer) return;
      
      // Create welcome message element
      const welcomeMessage = document.createElement('div');
      welcomeMessage.className = 'claude-message claude-message-bot';
      
      const welcomeContent = document.createElement('div');
      welcomeContent.className = 'claude-message-content';
      welcomeContent.appendChild(createClaudeWelcomeMessage());
      
      welcomeMessage.appendChild(welcomeContent);
      messagesContainer.appendChild(welcomeMessage);
    }
    
    // Enhanced verifyApiConnection function
    window.originalVerifyApiConnection = window.verifyApiConnection;
    window.verifyApiConnection = function(showFeedback = false) {
      console.log('Verifying API connection with enhanced feedback');
      
      const apiStatusBanner = document.getElementById('api-status-banner');
      
      if (apiStatusBanner) {
        if (showFeedback) {
          // Show checking message with loading spinner
          apiStatusBanner.innerHTML = `
            <div class="claude-api-status-spinner"></div>
            <span id="api-status-message">${translate('checking-connection') || 'Checking connection...'}</span>
            <button id="retry-connection" class="claude-retry-button" style="display: none;">${translate('retry') || 'Retry'}</button>
            <button class="claude-api-status-close" aria-label="Close notification">&times;</button>
          `;
          apiStatusBanner.className = 'claude-api-status'; // Reset any success/error classes
          apiStatusBanner.style.display = 'flex';
          
          // Add close button handler
          const closeButton = apiStatusBanner.querySelector('.claude-api-status-close');
          if (closeButton) {
            closeButton.addEventListener('click', function() {
              apiStatusBanner.style.display = 'none';
            });
          }
        } else {
          // Hide banner initially
          apiStatusBanner.style.display = 'none';
        }
      }
      
      // Call original function if it exists
      if (window.originalVerifyApiConnection) {
        return window.originalVerifyApiConnection(showFeedback);
      }
      
      // Fallback implementation
      return fetch(`${API_URL}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API connection failed with status: ${response.status}`);
        }
        
        console.log('API connection successful');
        
        // Show success message if feedback was requested
        if (showFeedback && apiStatusBanner) {
          apiStatusBanner.innerHTML = `
            <span id="api-status-message">${translate('connected-successfully') || 'Connected successfully!'}</span>
            <button class="claude-api-status-close" aria-label="Close notification">&times;</button>
          `;
          apiStatusBanner.className = 'claude-api-status success';
          
          // Add close button handler
          const closeButton = apiStatusBanner.querySelector('.claude-api-status-close');
          if (closeButton) {
            closeButton.addEventListener('click', function() {
              apiStatusBanner.style.display = 'none';
            });
          }
          
          // Hide after 3 seconds
          setTimeout(() => {
            apiStatusBanner.style.display = 'none';
          }, 3000);
        }
        
        return true;
      })
      .catch(error => {
        console.error('API connection verification failed:', error);
        
        if (apiStatusBanner) {
          apiStatusBanner.innerHTML = `
            <span id="api-status-message">${translate('api-connection-issue') || 'API connection issue detected. Check your internet connection or try again later.'}</span>
            <button id="retry-connection" class="claude-retry-button">${translate('retry') || 'Retry'}</button>
            <button class="claude-api-status-close" aria-label="Close notification">&times;</button>
          `;
          apiStatusBanner.className = 'claude-api-status error';
          apiStatusBanner.style.display = 'flex';
          
          // Add retry handler
          const retryButton = apiStatusBanner.querySelector('#retry-connection');
          if (retryButton) {
            retryButton.addEventListener('click', function() {
              window.verifyApiConnection(true);
            });
          }
          
          // Add close button handler
          const closeButton = apiStatusBanner.querySelector('.claude-api-status-close');
          if (closeButton) {
            closeButton.addEventListener('click', function() {
              apiStatusBanner.style.display = 'none';
            });
          }
        }
        
        return false;
      });
    };
    
    // Enhanced clear conversation handling
    window.originalClearConversation = window.clearConversation;
    window.clearConversation = function() {
      console.log('Clearing conversation with enhanced animation');
      
      const messagesContainer = document.getElementById('messages');
      
      // Clear the conversation history array
      if (window.conversationHistory) {
        window.conversationHistory = [];
      }
      
      // Animate clearing messages
      if (messagesContainer) {
        const messages = messagesContainer.querySelectorAll('.claude-message');
        
        if (messages.length === 0) {
          // If no messages, just display welcome
          displayClaudeWelcome();
          return;
        }
        
        // Create a fade-out animation for all messages
        messages.forEach((message, index) => {
          setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateY(-20px)';
            message.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          }, index * 50); // Stagger the animations
        });
        
        // Clear container and show welcome after animations
        setTimeout(() => {
          messagesContainer.innerHTML = '';
          displayClaudeWelcome();
        }, messages.length * 50 + 300);
      } else {
        // Fallback to original function if it exists
        if (window.originalClearConversation) {
          window.originalClearConversation();
        }
      }
      
      // Close sources panel if open
      const sourcesPanel = document.getElementById('sourcesPanel');
      if (sourcesPanel && sourcesPanel.classList.contains('active')) {
        sourcesPanel.classList.remove('active');
        
        const sourcesBackdrop = document.querySelector('.claude-sources-backdrop');
        if (sourcesBackdrop) {
          sourcesBackdrop.style.opacity = '0';
          setTimeout(() => {
            sourcesBackdrop.style.display = 'none';
          }, 300);
        }
      }
      
      // Focus the input field
      const queryInput = document.getElementById('queryInput');
      if (queryInput) {
        queryInput.focus();
      }
    };
    
    // Add clear conversation button handler
    const clearConversationBtn = document.getElementById('clearConversation');
    if (clearConversationBtn) {
      clearConversationBtn.addEventListener('click', function() {
        if (window.conversationHistory && window.conversationHistory.length > 0) {
          // Ask for confirmation
          if (confirm(translate('confirm-clear') || 'Are you sure you want to clear the conversation?')) {
            window.clearConversation();
          }
        } else {
          window.clearConversation();
        }
      });
    }
    
    // Initialize the interface with welcome message if needed
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
    
    console.log('Enhanced interface components initialized');
  }
  
  /**
   * Setup navigation menu functionality
   */
  function setupNavigation() {
    const menuButton = document.querySelector('.app-menu-button');
    const navMenu = document.querySelector('.app-nav-menu');
    const menuBackdrop = document.querySelector('.app-menu-backdrop');
    
    if (!menuButton || !navMenu || !menuBackdrop) return;
    
    // Toggle menu when button is clicked
    menuButton.addEventListener('click', function() {
      navMenu.classList.add('active');
      menuBackdrop.style.display = 'block';
      setTimeout(() => {
        menuBackdrop.style.opacity = '1';
      }, 10);
    });
    
    // Close menu when backdrop is clicked
    menuBackdrop.addEventListener('click', function() {
      navMenu.classList.remove('active');
      menuBackdrop.style.opacity = '0';
      setTimeout(() => {
        menuBackdrop.style.display = 'none';
      }, 300);
    });
    
    // Handle back gesture (touch swipe from left edge)
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
      touchEndX = e.touches[0].clientX;
    }, { passive: true });
    
    document.addEventListener('touchend', function() {
      // If swipe is from left edge to right, open menu
      if (touchStartX < 30 && touchEndX - touchStartX > 100) {
        menuButton.click();
      }
      
      // If swipe is from right to left while menu is open, close menu
      if (navMenu.classList.contains('active') && touchStartX - touchEndX > 100) {
        menuBackdrop.click();
      }
      
      // Reset values
      touchStartX = 0;
      touchEndX = 0;
    }, { passive: true });
    
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
    
    console.log('Navigation setup complete');
  }
  
  /**
   * Helper function to fetch transcripts with improved error handling
   */
  async function fetchTranscript(videoId, startTime = 0) {
    try {
      console.log(`Fetching transcript for video ${videoId}`);
      
      // Show loading indicator in all transcript containers for this video
      const transcriptContainers = document.querySelectorAll(`.claude-source-item[data-video-id="${videoId}"] .claude-transcript`);
      transcriptContainers.forEach(container => {
        container.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript') || 'Loading transcript...'}</div>`;
      });
      
      // Use global API_URL if available, otherwise assume a default
      const apiUrl = window.API_URL || '/api';
      const currentLanguage = window.currentLanguage || 'en';
      
      const response = await fetch(`${apiUrl}/transcript/${videoId}?language=${currentLanguage}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Accept-Language': currentLanguage
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received transcript data:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }
  }
  
  /**
   * Helper function to translate UI strings
   */
  function translate(key) {
    // Use global translations if available
    if (window.translations && window.translations[key]) {
      return window.translations[key];
    }
    
    // Fallback translations
    const translations = {
      'welcome-title': 'Welcome to the Sermon Search Tool! 👋',
      'welcome-intro': 'Ask any question about the pastor\'s sermons, and I\'ll provide answers based on the sermon content with timestamped video links.',
      'suggestion-heading': 'Try asking about:',
      'sources-found': 'Sources',
      'show-sources': 'View Sources',
      'hide-sources': 'Hide Sources',
      'watch-video': 'Watch Video',
      'hide-video': 'Hide Video',
      'view-transcript': 'View Transcript',
      'hide-transcript': 'Hide Transcript',
      'open-youtube': 'Open in YouTube',
      'loading-transcript': 'Loading transcript...',
      'download-transcript': 'Download Transcript',
      'search-in-transcript': 'Search in transcript',
      'search': 'Search',
      'matches-found': 'matches found',
      'no-matches-found': 'No matches found',
      'no-results': 'No relevant sermon content found',
      'checking-connection': 'Checking connection...',
      'connected-successfully': 'Connected successfully!',
      'api-connection-issue': 'API connection issue detected. Check your internet connection or try again later.',
      'retry': 'Retry',
      'confirm-clear': 'Are you sure you want to clear the conversation?',
      'match': 'match'
    };
    
    return translations[key] || key;
  }
  
  /**
   * Helper function to format text for display
   */
  function formatText(text) {
    if (!text) return '';
    
    // Escape HTML
    text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Convert URLs to links
    text = text.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return text;
  }
  
  /**
   * Helper function to format sermon titles
   */
  function formatSermonTitle(title) {
    if (!title) return 'Untitled Sermon';
    
    // Remove any file extensions
    title = title.replace(/\.(mp4|mov|avi|wmv)$/i, '');
    
    // Remove date patterns if they appear at the beginning
    title = title.replace(/^\d{1,2}[-\.]\d{1,2}[-\.]\d{2,4}\s+/, '');
    title = title.replace(/^\d{2,4}[-\.]\d{1,2}[-\.]\d{1,2}\s+/, '');
    
    // Convert to Title Case
    title = title.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    
    return title;
  }
  
  /**
   * Helper function to format sermon dates
   */
  function formatSermonDate(dateStr) {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      
      // Check if valid date
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      // Format as "Month Day, Year"
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(window.currentLanguage || 'en-US', options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateStr;
    }
  }
  
  /**
   * Helper function to format timestamps
   */
  function formatTimestamp(seconds) {
    if (typeof seconds !== 'number') return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }