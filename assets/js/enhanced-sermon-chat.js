/**
 * Complete Sermon Chat Fix
 * - Fixes mobile styling issues (dark background, contrast, overflow)
 * - Makes the sources panel work properly
 * - Adds help button for the "About This Tool" info
 * - Makes chat and sources wider
 * 
 * Add this script right before the closing </body> tag
 */

(function() {
    // Add comprehensive styles
    const style = document.createElement('style');
    
    style.textContent = `
      /* ========== MOBILE INTERFACE FIXES ========== */
      
      @media (max-width: 768px) {
        /* Fix the background color everywhere */
        body, 
        .claude-interface, 
        .claude-messages,
        .chat-container, 
        .messages,
        .claude-message,
        .message {
          background-color: #f8f9fa !important;
        }
        
        /* Fix the message bubble styles */
        .message.bot, 
        .claude-message-bot .claude-message-content,
        .message.bot .message-content {
          background-color: #ffffff !important;
          color: #666666 !important;
          border: 1px solid #e0e5eb !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
          max-width: 85% !important;
          padding: 12px 16px !important;
          border-radius: 12px 12px 2px 12px !important;
          margin-bottom: 12px !important;
        }
        
        /* Fix user message bubbles */
        .message.user,
        .claude-message-user .claude-message-content,
        .message.user .message-content {
          background-color: #2ea3f2 !important;
          color: white !important;
          border: none !important;
          max-width: 85% !important;
          padding: 12px 16px !important;
          border-radius: 12px 12px 12px 2px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
          margin-bottom: 12px !important;
        }
        
        /* Fix the welcome message */
        .claude-welcome,
        .welcome-message {
          background-color: #ffffff !important;
          border: 1px solid #e0e5eb !important;
          border-left: 3px solid #2ea3f2 !important;
          color: #666666 !important;
          padding: 16px !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
          margin-bottom: 20px !important;
        }
        
        /* Fix the suggestion buttons */
        .suggestion-chip,
        .claude-suggestion,
        .suggestion-button {
          background-color: #ffffff !important;
          color: #2ea3f2 !important;
          border: 1px solid rgba(46, 163, 242, 0.3) !important;
          padding: 10px 16px !important;
          border-radius: 20px !important;
          font-size: 14px !important;
          margin-bottom: 10px !important;
          text-align: left !important;
          width: 100% !important;
          max-width: 100% !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
          transition: transform 0.2s ease, background-color 0.2s ease !important;
          overflow: hidden !important;
          white-space: normal !important;
          text-overflow: ellipsis !important;
          display: block !important;
        }
        
        /* Make suggestion buttons not overflow */
        .suggestion-chips,
        .claude-suggestions {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
        }
        
        /* Fix input area */
        .claude-input-area,
        .chat-controls {
          background-color: #f8f9fa !important;
          border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
          padding: 12px !important;
        }
        
        .claude-input-container,
        .chat-form {
          background-color: #ffffff !important;
          border: 1px solid #e0e5eb !important;
          border-radius: 24px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
        }
        
        .claude-input,
        .chat-input {
          color: #666666 !important;
          background: transparent !important;
        }
        
        /* Fix container width to prevent overflow */
        .container,
        .chat-container,
        .claude-interface,
        .chat-section-wrapper {
          width: 100% !important;
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 auto !important;
          box-sizing: border-box !important;
          overflow-x: hidden !important;
        }
        
        /* Fix padding to give more space */
        .claude-messages,
        .messages {
          padding: 16px !important;
          overflow-x: hidden !important;
        }
        
        /* Fixed height for chat container */
        .chat-container,
        .claude-interface {
          height: 100vh !important;
          max-height: 100vh !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        .claude-messages,
        .messages {
          flex: 1 !important;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        /* Bible references styling fix */
        .bible-reference {
          background-color: rgba(46, 163, 242, 0.1) !important;
          color: #2ea3f2 !important;
          padding: 2px 6px !important;
          border-radius: 3px !important;
          font-weight: 600 !important;
          display: inline-block !important;
          margin: 2px 0 !important;
        }
        
        /* Make sure header text is visible */
        .welcome-message h4,
        .claude-welcome h4 {
          color: #333333 !important;
          margin-top: 0 !important;
          margin-bottom: 12px !important;
          font-size: 18px !important;
        }
        
        /* Try asking about text */
        .suggestion-heading,
        .claude-suggestion-label {
          color: #666666 !important;
          margin-bottom: 12px !important;
          margin-top: 16px !important;
          font-weight: 600 !important;
        }
        
        /* Fix clear conversation button */
        .control-button,
        #clearConversation {
          background-color: rgba(0,0,0,0.05) !important;
          border: none !important;
          color: #666666 !important;
          padding: 8px 16px !important;
          border-radius: 16px !important;
          font-size: 12px !important;
          margin-top: 8px !important;
        }
        
        /* Sources panel fixes */
        .claude-sources-panel,
        #sourcesPanel {
          position: fixed !important;
          z-index: 1000 !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          top: auto !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 75vh !important;
          background-color: #ffffff !important;
          border-radius: 16px 16px 0 0 !important;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.1) !important;
          transition: transform 0.3s ease, height 0.3s ease !important;
          transform: translateY(100%) !important;
          display: block !important;
        }
        
        .claude-sources-panel.active,
        #sourcesPanel.active {
          transform: translateY(0) !important;
        }
        
        .claude-sources-panel-content,
        #sourcesPanelContent {
          height: calc(100% - 40px) !important;
          padding: 20px !important;
          overflow-y: auto !important;
          background-color: #ffffff !important;
        }
        
        /* Handle swipe gesture helper */
        .source-panel-handle {
          position: absolute !important;
          top: 10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 40px !important;
          height: 4px !important;
          background-color: #e0e5eb !important;
          border-radius: 2px !important;
        }
      }
      
      /* ========== WIDER INTERFACE ========== */
      
      /* Make chat area wider on desktop */
      @media (min-width: 769px) {
        .chat-container, 
        .claude-interface {
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
        
        .message, 
        .claude-message-content {
          max-width: 85% !important;
        }
        
        .container {
          width: 95% !important;
          max-width: 1400px !important;
        }
        
        /* Make sources panel wider */
        #sourcesPanel.active, 
        .claude-sources-panel.active {
          width: 70% !important;
          max-width: 800px !important;
        }
      }
      
      /* ========== HELP BUTTON ========== */
      
      /* Help button - positioned next to chat controls */
      .chat-help-button {
        background-color: #2ea3f2;
        color: white;
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        margin-left: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      /* For Claude-style interface */
      .conversation-controls {
        display: flex !important;
        align-items: center;
        justify-content: flex-end;
      }
      
      /* For classic chat interface */
      .chat-controls {
        position: relative;
      }
      
      .chat-controls-help {
        position: absolute;
        right: 60px;
        top: 50%;
        transform: translateY(-50%);
      }
      
      .help-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: none;
        align-items: center;
        justify-content: center;
      }
      
      .help-modal.active {
        display: flex;
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
      
      /* Sources toggle button styling */
      .claude-sources-toggle,
      .show-sources-btn {
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
    `;
    
    document.head.appendChild(style);
  
    // Add our functionality
    document.addEventListener('DOMContentLoaded', function() {
      // Fix sources panel functionality
      fixSourcesPanelFunctionality();
      
      // Fix mobile welcome message styling
      fixWelcomeMessage();
      
      // Add help button next to chat controls
      addChatHelpButton();
      
      // Add observer for dynamic content
      observeDynamicContent();
    });
  
    // Run now in case DOM is already loaded
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      fixSourcesPanelFunctionality();
      fixWelcomeMessage();
      addChatHelpButton();
      observeDynamicContent();
    }
  
    /**
     * Fix the functionality of the sources panel
     */
    function fixSourcesPanelFunctionality() {
      // Make sure the sources panel is present and functional
      const sourcesPanel = document.getElementById('sourcesPanel');
      const sourcesPanelContent = document.getElementById('sourcesPanelContent');
      
      if (sourcesPanel) {
        // Make sure its display is set correctly
        if (window.getComputedStyle(sourcesPanel).display === 'none') {
          sourcesPanel.style.display = 'block';
          sourcesPanel.style.visibility = 'hidden';
          sourcesPanel.style.opacity = '0';
        }
        
        // Add swipe handle for mobile
        if (!sourcesPanel.querySelector('.source-panel-handle')) {
          const handle = document.createElement('div');
          handle.className = 'source-panel-handle';
          sourcesPanel.appendChild(handle);
        }
        
        // Add touch event handling for swipe to dismiss
        let touchStartY = 0;
        let touchMoveY = 0;
        
        sourcesPanel.addEventListener('touchstart', function(e) {
          touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        sourcesPanel.addEventListener('touchmove', function(e) {
          touchMoveY = e.touches[0].clientY;
          const deltaY = touchMoveY - touchStartY;
          
          // Only allow swiping down to close
          if (deltaY > 0 && window.innerWidth <= 768) {
            // Apply transform to follow finger
            const translateY = Math.min(deltaY * 0.5, 200);
            sourcesPanel.style.transform = `translateY(${translateY}px)`;
          }
        }, { passive: true });
        
        sourcesPanel.addEventListener('touchend', function() {
          const deltaY = touchMoveY - touchStartY;
          
          if (deltaY > 80 && window.innerWidth <= 768) {
            // Close panel if swiped down enough
            sourcesPanel.classList.remove('active');
            
            // Update any active source toggle buttons
            document.querySelectorAll('[class*="sources-toggle"][data-active="true"]').forEach(btn => {
              btn.setAttribute('data-active', 'false');
              const iconSpan = btn.querySelector('span');
              if (iconSpan) {
                iconSpan.style.transform = 'rotate(0deg)';
              }
            });
          }
          
          // Reset transform
          sourcesPanel.style.transform = '';
          touchStartY = 0;
          touchMoveY = 0;
        }, { passive: true });
      }
      
      // Override the default sources toggle buttons to make our panel actually work
      document.addEventListener('click', function(e) {
        // If a sources toggle button was clicked
        if (e.target && (
            e.target.classList.contains('claude-sources-toggle') || 
            e.target.closest('.claude-sources-toggle') ||
            e.target.classList.contains('show-sources-btn') ||
            e.target.closest('.show-sources-btn')
        )) {
          e.preventDefault();
          e.stopPropagation();
          
          const button = e.target.classList.contains('claude-sources-toggle') || 
                         e.target.classList.contains('show-sources-btn') ? 
                         e.target : 
                         e.target.closest('.claude-sources-toggle') || 
                         e.target.closest('.show-sources-btn');
          
          const isActive = button.getAttribute('data-active') === 'true';
          
          if (isActive) {
            // Hide the panel
            if (sourcesPanel) {
              sourcesPanel.classList.remove('active');
            }
            
            // Update button
            button.setAttribute('data-active', 'false');
            const iconSpan = button.querySelector('span');
            if (iconSpan) {
              iconSpan.style.transform = 'rotate(0deg)';
            }
          } else {
            // Show the panel
            if (sourcesPanel) {
              sourcesPanel.classList.add('active');
              
              // Make sure panel is visible
              sourcesPanel.style.display = 'block';
              sourcesPanel.style.visibility = 'visible';
              sourcesPanel.style.opacity = '1';
            }
            
            // Update button
            button.setAttribute('data-active', 'true');
            const iconSpan = button.querySelector('span');
            if (iconSpan) {
              iconSpan.style.transform = 'rotate(180deg)';
            }
          }
        }
        
        // Handle close button for sources panel
        if (e.target && (
            e.target.id === 'closeSourcesPanel' ||
            e.target.closest('#closeSourcesPanel')
        )) {
          e.preventDefault();
          e.stopPropagation();
          
          // Hide the panel
          if (sourcesPanel) {
            sourcesPanel.classList.remove('active');
          }
          
          // Update any active toggle buttons
          document.querySelectorAll('[class*="sources-toggle"][data-active="true"]').forEach(btn => {
            btn.setAttribute('data-active', 'false');
            const iconSpan = btn.querySelector('span');
            if (iconSpan) {
              iconSpan.style.transform = 'rotate(0deg)';
            }
          });
        }
      });
    }
  
    /**
     * Fix the welcome message styling on mobile
     */
    function fixWelcomeMessage() {
      // Look for welcome message
      const welcomeElements = document.querySelectorAll('.welcome-message, .claude-welcome');
      
      if (welcomeElements.length > 0) {
        welcomeElements.forEach(welcome => {
          // Fix any dark background
          welcome.style.backgroundColor = '#ffffff';
          welcome.style.color = '#666666';
          welcome.style.borderLeft = '3px solid #2ea3f2';
          
          // Fix any headers inside
          const headers = welcome.querySelectorAll('h4');
          headers.forEach(header => {
            header.style.color = '#333333';
          });
          
          // Fix suggestion button container if it exists
          const suggestionContainer = welcome.querySelector('.suggestion-chips, .claude-suggestions');
          if (suggestionContainer) {
            suggestionContainer.style.display = 'flex';
            suggestionContainer.style.flexDirection = 'column';
            suggestionContainer.style.width = '100%';
            
            // Fix each suggestion button
            const suggestions = suggestionContainer.querySelectorAll('.suggestion-chip, .claude-suggestion');
            suggestions.forEach(suggestion => {
              suggestion.style.backgroundColor = '#ffffff';
              suggestion.style.color = '#2ea3f2';
              suggestion.style.border = '1px solid rgba(46, 163, 242, 0.3)';
              suggestion.style.width = '100%';
              suggestion.style.maxWidth = '100%';
              suggestion.style.textAlign = 'left';
              suggestion.style.marginBottom = '10px';
              suggestion.style.whiteSpace = 'normal';
              suggestion.style.overflow = 'hidden';
              suggestion.style.textOverflow = 'ellipsis';
              suggestion.style.display = 'block';
            });
          }
        });
      }
    }
  
    /**
     * Add help button with "About This Tool" info near chat controls
     */
    function addChatHelpButton() {
      // Create help modal first
      const helpModal = document.createElement('div');
      helpModal.className = 'help-modal';
      helpModal.innerHTML = `
        <div class="help-modal-content">
          <div class="help-modal-header">
            <h2 class="help-modal-title">About This Tool</h2>
            <button class="help-modal-close" aria-label="Close help">&times;</button>
          </div>
          <div class="help-modal-body">
            <p>This search tool uses artificial intelligence to analyze sermon transcripts and provide relevant information.</p>
            <p>When you ask a question, the AI will:</p>
            <ul>
              <li>Search through the entire sermon library</li>
              <li>Find the most relevant content to your question</li>
              <li>Provide direct links to video timestamps</li>
              <li>Show you the exact context where information was found</li>
            </ul>
            <p>All answers are based solely on the pastor's actual sermon content.</p>
          </div>
        </div>
      `;
      document.body.appendChild(helpModal);
      
      // Set up modal events
      helpModal.querySelector('.help-modal-close').addEventListener('click', function() {
        helpModal.classList.remove('active');
      });
      
      helpModal.addEventListener('click', function(e) {
        if (e.target === helpModal) {
          helpModal.classList.remove('active');
        }
      });
      
      // Create help button
      const helpButton = document.createElement('button');
      helpButton.className = 'chat-help-button';
      helpButton.innerHTML = '?';
      helpButton.setAttribute('aria-label', 'About This Tool');
      helpButton.setAttribute('title', 'About This Tool');
      
      helpButton.addEventListener('click', function() {
        helpModal.classList.add('active');
      });
      
      // Find a place to add the help button
      
      // 1. Try the conversation controls
      const controls = document.querySelector('.conversation-controls');
      if (controls) {
        controls.appendChild(helpButton);
        return;
      }
      
      // 2. Try the clear conversation button
      const clearButton = document.getElementById('clearConversation');
      if (clearButton && clearButton.parentNode) {
        clearButton.parentNode.appendChild(helpButton);
        return;
      }
      
      // 3. Try the chat form
      const chatForm = document.getElementById('chatForm');
      if (chatForm) {
        const helpContainer = document.createElement('div');
        helpContainer.style.textAlign = 'right';
        helpContainer.style.marginTop = '8px';
        helpContainer.appendChild(helpButton);
        
        if (chatForm.nextSibling) {
          chatForm.parentNode.insertBefore(helpContainer, chatForm.nextSibling);
        } else {
          chatForm.parentNode.appendChild(helpContainer);
        }
        return;
      }
    }
  
    /**
     * Observe dynamic content and fix it
     */
    function observeDynamicContent() {
      // Create a MutationObserver to watch for dynamically added content
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // Check for welcome message
            fixWelcomeMessage();
            
            // Check for new messages that need the sources toggle
            const newMessages = document.querySelectorAll('.message.bot:not([data-enhanced])');
            
            newMessages.forEach(message => {
              // Mark as enhanced
              message.setAttribute('data-enhanced', 'true');
              
              // If this message has sources but no toggle button, add one
              if (message.innerHTML.includes('sermon') && 
                  !message.innerHTML.includes('No relevant sermon content found') &&
                  !message.querySelector('.claude-sources-toggle')) {
                
                // Add a sources toggle button
                const sourcesToggle = document.createElement('button');
                sourcesToggle.className = 'claude-sources-toggle';
                sourcesToggle.innerHTML = '<span style="display: inline-block; margin-right: 6px; transition: transform 0.2s ease;">⬆</span> Show Sources';
                sourcesToggle.setAttribute('data-active', 'false');
                
                message.appendChild(sourcesToggle);
              }
            });
          }
        });
      });
      
      // Start observing the body
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  })();