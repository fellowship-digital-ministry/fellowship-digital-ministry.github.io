/**
 * Sermon Chat Enhancements
 * Add this script tag before your closing </body> tag
 */

// Add CSS improvements
(function() {
    // Create and add style element
    const style = document.createElement('style');
    style.textContent = `
      /* WIDER INTERFACE */
      /* Make chat area wider */
      .chat-container, .claude-interface {
        max-width: 1200px !important;
        width: 95% !important;
      }
      
      .claude-chat-panel {
        max-width: 1200px !important;
        width: 100% !important;
      }
      
      .claude-messages {
        max-width: 100% !important;
      }
      
      .message, .claude-message-content {
        max-width: 90% !important;
      }
      
      .container {
        width: 95% !important;
        max-width: 1400px !important;
      }
      
      /* BETTER MOBILE COLORS */
      @media (max-width: 768px) {
        .claude-interface, .claude-messages {
          background-color: #f8f9fa !important;
        }
        
        .claude-message-bot .claude-message-content {
          background-color: #ffffff !important;
          color: #666666 !important;
          border: 1px solid #e0e5eb !important;
        }
        
        .claude-input-container, .claude-input-area {
          background-color: #f8f9fa !important;
          border-color: #e0e5eb !important;
        }
        
        .claude-input {
          color: #666666 !important;
        }
        
        .claude-welcome {
          background-color: #f8f9fa !important;
          color: #666666 !important;
        }
      }
      
      /* SOURCES MODAL */
      .sources-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .sources-modal.active {
        opacity: 1;
        visibility: visible;
      }
      
      .sources-modal-content {
        background-color: white;
        width: 95%;
        max-width: 1200px !important;
        max-height: 90vh;
        border-radius: 12px;
        box-shadow: 0 5px 30px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .sources-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #eeeeee;
        background-color: #f8f9fa;
      }
      
      .sources-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin: 0;
      }
      
      .sources-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        line-height: 1;
        color: #888;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .sources-modal-body {
        padding: 24px;
        overflow-y: auto;
        flex: 1;
      }
      
      /* HELP BUTTON */
      .help-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 44px;
        height: 44px;
        background-color: #2ea3f2;
        color: white;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        z-index: 100;
      }
      
      .help-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }
      
      .help-modal.active {
        opacity: 1;
        visibility: visible;
      }
      
      .help-modal-content {
        background-color: white;
        width: 90%;
        max-width: 600px;
        max-height: 90vh;
        border-radius: 12px;
        box-shadow: 0 5px 30px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .help-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #eeeeee;
        background-color: #f8f9fa;
      }
      
      .help-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #333333;
        margin: 0;
      }
      
      .help-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        line-height: 1;
        color: #888;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .help-modal-body {
        padding: 24px;
        overflow-y: auto;
      }
      
      /* SOURCE TOGGLE BUTTON */
      .claude-sources-toggle {
        margin-top: 16px;
        padding: 8px 16px;
        background-color: rgba(46, 163, 242, 0.1);
        color: #2ea3f2;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 500;
      }
      
      .claude-sources-toggle:hover {
        background-color: rgba(46, 163, 242, 0.2);
      }
      
      .claude-sources-toggle-icon {
        display: inline-block;
        margin-right: 6px;
        transition: transform 0.2s ease;
      }
      
      .claude-sources-toggle[data-active="true"] .claude-sources-toggle-icon {
        transform: rotate(180deg);
      }
    `;
    
    document.head.appendChild(style);
  })();
  
  // Initialize enhancements when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Create modals container
    const modalsContainer = document.createElement('div');
    modalsContainer.id = 'modals-container';
    document.body.appendChild(modalsContainer);
    
    // Create help button and modal with "About This Tool" info
    createHelpButton();
    createHelpModal();
    
    // Convert sources panel to modal
    createSourcesModal();
    
    // Override displayAnswer to use our modal
    overrideDisplayAnswer();
  });
  
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
   * Create help modal with "About This Tool" content
   */
  function createHelpModal() {
    // Create help modal structure
    const helpModal = document.createElement('div');
    helpModal.id = 'help-modal';
    helpModal.className = 'help-modal';
    
    // Get translations for the content (or use default text)
    const title = getTranslation('about-tool', 'About This Tool');
    const explanation = getTranslation('search-explanation', 
      'This search tool uses artificial intelligence to analyze sermon transcripts and provide relevant information.');
    const aiFeatures = getTranslation('ai-features', 
      'When you ask a question, the AI will:');
    const feature1 = getTranslation('feature-1', 
      'Search through the entire sermon library');
    const feature2 = getTranslation('feature-2', 
      'Find the most relevant content to your question');
    const feature3 = getTranslation('feature-3', 
      'Provide direct links to video timestamps');
    const feature4 = getTranslation('feature-4', 
      'Show you the exact context where information was found');
    const answersSource = getTranslation('answers-source', 
      'All answers are based solely on the pastor\'s actual sermon content.');
    
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
   * Create sources modal and connect it to the original sources panel
   */
  function createSourcesModal() {
    // Create new sources modal
    const sourcesModal = document.createElement('div');
    sourcesModal.id = 'sources-modal';
    sourcesModal.className = 'sources-modal';
    
    const sourcesTitle = getTranslation('sources-found', 'Sources Found');
    
    // Create structure
    sourcesModal.innerHTML = `
      <div class="sources-modal-content">
        <div class="sources-modal-header">
          <h2 class="sources-modal-title">${sourcesTitle} <span class="sources-count">0</span></h2>
          <button class="sources-modal-close" aria-label="Close sources">&times;</button>
        </div>
        <div class="sources-modal-body" id="sources-modal-body"></div>
      </div>
    `;
    
    // Add close button event
    sourcesModal.querySelector('.sources-modal-close').addEventListener('click', function() {
      closeModal(sourcesModal);
      
      // Update any active source toggle buttons
      const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
      activeToggles.forEach(toggle => {
        toggle.setAttribute('data-active', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + 
          getTranslation('show-sources', 'Show Sources');
      });
    });
    
    // Add click event to close when clicking outside modal
    sourcesModal.addEventListener('click', function(e) {
      if (e.target === sourcesModal) {
        closeModal(sourcesModal);
        
        // Update any active source toggle buttons
        const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
        activeToggles.forEach(toggle => {
          toggle.setAttribute('data-active', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + 
            getTranslation('show-sources', 'Show Sources');
        });
      }
    });
    
    // Add to modals container
    document.getElementById('modals-container').appendChild(sourcesModal);
    
    // Update the original sources panel if it exists
    const originalSourcesPanel = document.getElementById('sourcesPanel');
    const closeSourcesPanelButton = document.getElementById('closeSourcesPanel');
    
    if (originalSourcesPanel && closeSourcesPanelButton) {
      // Hide the original panel but keep it in DOM for compatibility
      originalSourcesPanel.style.display = 'none';
      
      // Override the close button to work with our modal
      closeSourcesPanelButton.addEventListener('click', function() {
        closeModal(document.getElementById('sources-modal'));
      });
    }
  }
  
  /**
   * Override the displayAnswer function to use our modal
   */
  function overrideDisplayAnswer() {
    // Store the original function if it exists
    const originalDisplayAnswer = window.displayAnswer;
    
    // Only override if the function exists
    if (typeof originalDisplayAnswer === 'function') {
      window.displayAnswer = function(data) {
        if (!data || !data.answer) {
          console.error('Invalid data received from API');
          if (typeof addMessage === 'function') {
            addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
          }
          return;
        }
        
        // Check if there are any sermon sources
        const hasSermonContent = data.sources && data.sources.length > 0;
        
        // If no sermon content but we have conversation history, use the fallback logic
        if (!hasSermonContent && 
            data.answer.includes(getTranslation('no-results', 'No relevant sermon content found')) && 
            window.conversationHistory && window.conversationHistory.length > 0) {
          if (originalDisplayAnswer) {
            return originalDisplayAnswer(data);
          }
          return;
        }
        
        // Add the answer message using the original function
        const messageElement = originalDisplayAnswer(data);
        
        // If we have sermon content, update our modal and add a toggle button
        if (hasSermonContent) {
          try {
            // Get our sources modal
            const sourcesModal = document.getElementById('sources-modal');
            const sourcesModalBody = document.getElementById('sources-modal-body');
            
            if (sourcesModal && sourcesModalBody) {
              // Copy content from original panel to our modal
              const originalContent = document.getElementById('sourcesPanelContent');
              if (originalContent) {
                sourcesModalBody.innerHTML = originalContent.innerHTML;
              }
              
              // Update source count if possible
              const sourcesCountElement = sourcesModal.querySelector('.sources-count');
              if (sourcesCountElement && data.sources) {
                sourcesCountElement.textContent = data.sources.length;
              }
              
              // Find the last message (the one we just added)
              const messages = document.querySelectorAll('.message.bot:not(.typing-indicator)');
              const lastMessage = messages[messages.length - 1];
              
              if (lastMessage) {
                // Add sources toggle button if not already present
                if (!lastMessage.querySelector('.claude-sources-toggle')) {
                  const sourcesToggle = document.createElement('button');
                  sourcesToggle.className = 'claude-sources-toggle';
                  sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + 
                    getTranslation('show-sources', 'Show Sources');
                  sourcesToggle.setAttribute('data-active', 'false');
                  sourcesToggle.setAttribute('aria-expanded', 'false');
                  
                  sourcesToggle.addEventListener('click', function() {
                    const isActive = this.getAttribute('data-active') === 'true';
                    
                    if (isActive) {
                      closeModal(sourcesModal);
                      this.setAttribute('data-active', 'false');
                      this.setAttribute('aria-expanded', 'false');
                      this.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + 
                        getTranslation('show-sources', 'Show Sources');
                    } else {
                      openModal(sourcesModal);
                      this.setAttribute('data-active', 'true');
                      this.setAttribute('aria-expanded', 'true');
                      this.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> ' + 
                        getTranslation('hide-sources', 'Hide Sources');
                    }
                  });
                  
                  lastMessage.appendChild(sourcesToggle);
                }
              }
            }
          } catch (error) {
            console.error('Error setting up sources modal:', error);
          }
        }
        
        return messageElement;
      };
    }
  }
  
  /**
   * Open a modal with animation
   */
  function openModal(modal) {
    if (!modal) return;
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Trigger animation
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
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
      
      // Restore body scrolling if no other modals are active
      const activeModals = document.querySelectorAll('.sources-modal.active, .help-modal.active');
      if (activeModals.length === 0) {
        document.body.style.overflow = '';
      }
    }, 300);
  }
  
  /**
   * Get translation for a key or use default text
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
 * Sermon Chat Interface Fix
 * This script fixes sources panel toggling and matches mobile colors with web
 */

// Fix for the sources panel toggling issues
function fixSourcesPanel() {
    console.log("Initializing sources panel fix...");
    
    // Direct fix for sources toggle buttons
    document.addEventListener('click', function(event) {
      const toggleButton = event.target.closest('.claude-sources-toggle');
      if (!toggleButton) return;
      
      console.log("Sources toggle button clicked");
      
      const sourcesPanel = document.getElementById('sourcesPanel');
      if (!sourcesPanel) {
        console.error("Sources panel element not found");
        return;
      }
      
      // Toggle the active class directly
      sourcesPanel.classList.toggle('active');
      
      // Update the button state
      const isActive = sourcesPanel.classList.contains('active');
      toggleButton.setAttribute('data-active', isActive ? 'true' : 'false');
      toggleButton.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      
      // Get translation function if available
      let showText = 'Show Sources';
      let hideText = 'Hide Sources';
      if (window.translate && typeof window.translate === 'function') {
        showText = window.translate('show-sources') || 'Show Sources';
        hideText = window.translate('hide-sources') || 'Hide Sources';
      }
      
      toggleButton.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + 
        (isActive ? hideText : showText);
      
      // Show/hide backdrop on mobile
      const backdrop = document.querySelector('.claude-sources-backdrop');
      if (backdrop) {
        if (isActive) {
          backdrop.style.display = 'block';
          setTimeout(() => { backdrop.style.opacity = '1'; }, 10);
        } else {
          backdrop.style.opacity = '0';
          setTimeout(() => { backdrop.style.display = 'none'; }, 300);
        }
      }
    });
    
    // Make sure we have a backdrop for mobile
    const createBackdropIfNeeded = () => {
      if (!document.querySelector('.claude-sources-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'claude-sources-backdrop';
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.right = '0';
        backdrop.style.bottom = '0';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        backdrop.style.zIndex = '50';
        backdrop.style.opacity = '0';
        backdrop.style.transition = 'opacity 0.3s ease';
        backdrop.style.display = 'none';
        
        // Close panel when backdrop is clicked
        backdrop.addEventListener('click', function() {
          const sourcesPanel = document.getElementById('sourcesPanel');
          if (sourcesPanel) {
            sourcesPanel.classList.remove('active');
            
            // Update any active source toggle buttons
            const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
            activeToggles.forEach(toggle => {
              toggle.setAttribute('data-active', 'false');
              toggle.setAttribute('aria-expanded', 'false');
              toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + 
                (window.translate ? window.translate('show-sources') : 'Show Sources');
            });
          }
        });
        
        document.body.appendChild(backdrop);
      }
    };
    
    createBackdropIfNeeded();
    
    // Fix for close button
    const closeButton = document.getElementById('closeSourcesPanel');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        const sourcesPanel = document.getElementById('sourcesPanel');
        if (sourcesPanel) {
          sourcesPanel.classList.remove('active');
          
          // Update any active source toggle buttons
          const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
          activeToggles.forEach(toggle => {
            toggle.setAttribute('data-active', 'false');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + 
              (window.translate ? window.translate('show-sources') : 'Show Sources');
          });
        }
      });
    }
  }
  
  // Match mobile colors to website
  function matchMobileColors() {
    console.log("Applying consistent color scheme for mobile...");
    
    const style = document.createElement('style');
    style.textContent = `
      /* CONSISTENT COLOR SCHEME FOR MOBILE */
      @media (max-width: 768px) {
        :root {
          --color-mobile-chat-bg: #f8f9fa !important;
          --color-mobile-message-bg: #ffffff !important;
        }
        
        .claude-interface, 
        .claude-messages,
        .app-container,
        .app-header {
          background-color: #f8f9fa !important;
        }
        
        .app-header {
          color: #333333 !important;
          border-bottom: 1px solid #e0e5eb !important;
        }
        
        .app-menu-button {
          color: #333333 !important;
        }
        
        .claude-message-bot .claude-message-content {
          background-color: #ffffff !important;
          color: #666666 !important;
          border: 1px solid #e0e5eb !important;
        }
        
        .claude-message-bot {
          border-bottom: 1px solid #f0f0f0 !important;
        }
        
        .claude-input-container, 
        .claude-input-area {
          background-color: #f8f9fa !important;
          border-color: #e0e5eb !important;
        }
        
        .claude-input {
          color: #666666 !important;
        }
        
        .claude-input::placeholder {
          color: #999999 !important;
        }
        
        .claude-welcome {
          background-color: rgba(46, 163, 242, 0.05) !important;
          color: #666666 !important;
        }
        
        .claude-welcome h4 {
          color: #2ea3f2 !important;
        }
        
        .claude-welcome p,
        .claude-suggestion-label {
          color: #666666 !important;
        }
        
        .claude-suggestion {
          background-color: rgba(46, 163, 242, 0.1) !important;
          color: #2ea3f2 !important;
          border: 1px solid rgba(46, 163, 242, 0.1) !important;
        }
        
        .claude-sources-toggle {
          background-color: rgba(46, 163, 242, 0.1) !important;
          color: #2ea3f2 !important;
        }
        
        .claude-sources-panel {
          background-color: #ffffff !important;
        }
        
        .bible-reference {
          background-color: rgba(46, 163, 242, 0.05) !important;
          color: #2ea3f2 !important;
        }
        
        .control-button {
          background-color: rgba(46, 163, 242, 0.05) !important;
          color: #2ea3f2 !important;
          border: 1px solid rgba(46, 163, 242, 0.1) !important;
        }
        
        /* Fix the typing indicator for light theme */
        .claude-typing-bubble {
          background-color: rgba(46, 163, 242, 0.5) !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Initialize both fixes
  document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Sermon Chat Interface Fix");
    
    // Apply fixes
    fixSourcesPanel();
    matchMobileColors();
  });
  
  // If DOM is already loaded, apply fixes immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log("DOM already loaded, applying fixes immediately");
    fixSourcesPanel();
    matchMobileColors();
  }