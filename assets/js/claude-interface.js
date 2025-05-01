/**
 * Enhanced Claude-Style Interface with Overlay Modals for Sermon Search
 * Includes mobile improvements and collapsible source descriptions
 */

document.addEventListener('DOMContentLoaded', function() {
    initClaudeInterface();
});
  
function initClaudeInterface() {
    console.log('Initializing enhanced Claude-style interface with overlay modals');
    
    // Elements
    const queryInput = document.getElementById('queryInput');
    const messagesContainer = document.getElementById('messages');
    const sourcesPanel = document.getElementById('sourcesPanel');
    const sourcesPanelContent = document.getElementById('sourcesPanelContent');
    const closeSourcesButton = document.getElementById('closeSourcesPanel');
    const apiStatusBanner = document.getElementById('api-status-banner');
    const chatForm = document.getElementById('chatForm');
    
    // Create overlay container for modals if it doesn't exist
    if (!document.getElementById('claude-overlay-container')) {
      const overlayContainer = document.createElement('div');
      overlayContainer.id = 'claude-overlay-container';
      document.body.appendChild(overlayContainer);
    }
    
    // Add a close button to the API status banner
  // Add a close button to the API status banner
  if (apiStatusBanner) {
    // Add this line to hide the banner by default
    apiStatusBanner.style.display = 'none';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'claude-api-status-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close notification');
    closeButton.addEventListener('click', function() {
      apiStatusBanner.style.display = 'none';
    });
    apiStatusBanner.appendChild(closeButton);
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
    
    // Close sources panel with improved gestures
    if (closeSourcesButton) {
      closeSourcesButton.addEventListener('click', function() {
        sourcesPanel.classList.remove('active');
        
        // Also update any active source toggle buttons
        const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
        activeToggles.forEach(toggle => {
          toggle.setAttribute('data-active', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
        });
      });
    }
    
    // Add swipe handling for mobile
    if (sourcesPanel) {
      // Add backdrop for mobile
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
      
      // Update backdrop when sources panel is toggled
      const updateBackdrop = () => {
        if (sourcesPanel.classList.contains('active')) {
          backdrop.style.display = 'block';
          // Trigger reflow to enable transition
          backdrop.offsetHeight;
          backdrop.style.opacity = '1';
        } else {
          backdrop.style.opacity = '0';
          setTimeout(() => {
            backdrop.style.display = 'none';
          }, 300);
        }
      };
      
      // Add observer to detect class changes on the sources panel
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            updateBackdrop();
          }
        });
      });
      
      observer.observe(sourcesPanel, {attributes: true});
      
      // Close panel when backdrop is clicked
      backdrop.addEventListener('click', function() {
        sourcesPanel.classList.remove('active');
        
        // Update any active source toggle buttons
        const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
        activeToggles.forEach(toggle => {
          toggle.setAttribute('data-active', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
        });
      });
      
      // Add touch swipe down to close on mobile
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
          sourcesPanel.classList.remove('active');
          
          // Update any active source toggle buttons
          const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
          activeToggles.forEach(toggle => {
            toggle.setAttribute('data-active', 'false');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
          });
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
              } else {
                sourcesPanel.classList.add('active');
                this.setAttribute('data-active', 'true');
                this.setAttribute('aria-expanded', 'true');
                this.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> ' + translate('hide-sources');
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
          sourcesPanelContent.innerHTML = '';
          
          // Add title with source count
          const sourcesTitle = document.createElement('h3');
          sourcesTitle.textContent = translate('sources-found') + ' (' + data.sources.length + ')';
          sourcesPanelContent.appendChild(sourcesTitle);
          
          // Sort sources by similarity score
          const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
          
          // Add sources to panel
          sortedSources.forEach((source, index) => {
            const sourceElement = createEnhancedSourceElement(source, index);
            sourcesPanelContent.appendChild(sourceElement);
          });
          
          // Auto-open sources panel for first answer
          if (conversationHistory.length <= 2) {
            setTimeout(() => {
              sourcesPanel.classList.add('active');
              const sourcesToggle = messageElement.querySelector('.claude-sources-toggle');
              if (sourcesToggle) {
                sourcesToggle.setAttribute('data-active', 'true');
                sourcesToggle.setAttribute('aria-expanded', 'true');
                sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> ' + translate('hide-sources');
              }
            }, 500);
          }
          
          // Add to conversation history
          conversationHistory.push({ role: 'assistant', content: data.answer });
          
        } catch (error) {
          console.error('Error displaying sources:', error);
          // Continue without displaying sources
          
          // Still add to conversation history
          conversationHistory.push({ role: 'assistant', content: data.answer });
        }
      } else {
        // Add to conversation history
        conversationHistory.push({ role: 'assistant', content: data.answer });
      }
      
      // Add ripple effect to new message for attention
      addRippleEffect(messageElement);
    };
    
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
      getTranslatedQueries().forEach(query => {
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
    
    function createEnhancedSourceElement(source, index) {
        const sourceElement = document.createElement('div');
        sourceElement.className = 'claude-source-item';
        sourceElement.setAttribute('data-video-id', source.video_id);
        
        // Add ARIA attributes for accessibility
        sourceElement.setAttribute('role', 'region');
        sourceElement.setAttribute('aria-label', 'Sermon source ' + (index + 1));
        
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
        
        // Create collapsible text container - CONDENSED VERSION
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
        
        // Watch video button - now opens modal overlay
        const watchButton = document.createElement('button');
        watchButton.className = 'claude-source-button claude-source-button-primary';
        watchButton.textContent = translate('watch-video') || 'Watch Video';
        watchButton.setAttribute('aria-haspopup', 'dialog');
        
        watchButton.onclick = function() {
          openVideoOverlay(source.video_id, Math.floor(source.start_time), formattedTitle);
        };
        
        // Transcript button - now opens modal overlay
        const transcriptButton = document.createElement('button');
        transcriptButton.className = 'claude-source-button';
        transcriptButton.textContent = translate('view-transcript') || 'View Transcript';
        transcriptButton.setAttribute('aria-haspopup', 'dialog');
        
        transcriptButton.onclick = function() {
          openTranscriptOverlay(source.video_id, source.start_time, formattedTitle);
        };
        
        // YouTube button - now opens modal overlay
        const youtubeButton = document.createElement('button');
        youtubeButton.className = 'claude-source-button';
        youtubeButton.textContent = translate('open-youtube') || 'Open YouTube';
        youtubeButton.setAttribute('aria-label', 'Open video in YouTube at ' + formatTimestamp(source.start_time));
        
        youtubeButton.onclick = function() {
          // For YouTube, we'll just open in a new tab since we want to go to youtube.com
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
    
      function openSourceTextOverlay(text, title) {
        const overlayContainer = document.getElementById('claude-overlay-container');
        if (!overlayContainer) return;
        
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

    // NEW FUNCTION: Open video overlay modal
    function openVideoOverlay(videoId, startTime, title) {
      const overlayContainer = document.getElementById('claude-overlay-container');
      if (!overlayContainer) return;
      
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
    
    // NEW FUNCTION: Open transcript overlay modal
    function openTranscriptOverlay(videoId, startTime, title) {
      const overlayContainer = document.getElementById('claude-overlay-container');
      if (!overlayContainer) return;
      
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
        updateEnhancedTranscriptOverlay(body, transcriptData, startTime);
      }).catch(error => {
        body.innerHTML = `<div class="claude-transcript-error">Error loading transcript: ${error.message}</div>`;
      });
    }
    
    // Close overlay function
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
    
    // Add keyboard handling for overlays
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
    
    function updateEnhancedTranscriptOverlay(container, data, startTime) {
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
            
            // ENHANCEMENT 3: Make timestamps clickable and linked to video
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
          downloadTranscript(data);
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
            const bibleConfig = bibleWebsites[currentLanguage] || bibleWebsites.en;
            
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
      
      // Function to download transcript
      function downloadTranscript(data) {
        if (!data) return;
        
        let content = '';
        let filename = 'sermon-transcript.txt';
        
        // Try to get sermon title from the page
        const sourceItem = document.querySelector('.claude-source-item');
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
      
      // Function to initialize collapsible source text for existing and dynamically added elements
      function initializeCollapsibleSourceText() {
        // MutationObserver to watch for new source elements being added
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              // Check each added node
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                  // Look for source items within the added node
                  const sourceItems = node.querySelectorAll ? node.querySelectorAll('.claude-source-item') : [];
                  sourceItems.forEach(setupCollapsibleSourceText);
                  
                  // Or if the node itself is a source item
                  if (node.classList && node.classList.contains('claude-source-item')) {
                    setupCollapsibleSourceText(node);
                  }
                }
              });
            }
          });
        });
        
        // Start observing the sources panel content
        const sourcesPanelContent = document.getElementById('sourcesPanelContent');
        if (sourcesPanelContent) {
          observer.observe(sourcesPanelContent, { childList: true, subtree: true });
          
          // Also set up existing source items
          const existingSourceItems = sourcesPanelContent.querySelectorAll('.claude-source-item');
          existingSourceItems.forEach(setupCollapsibleSourceText);
        }
      }
      
      // Function to set up a single collapsible source text element
      function setupCollapsibleSourceText(sourceItem) {
        if (!sourceItem) return;
        
        const sourceText = sourceItem.querySelector('.claude-source-text');
        if (!sourceText) return;
        
        // Check if we already wrapped this element
        if (sourceText.parentNode.classList && sourceText.parentNode.classList.contains('claude-source-text-wrapper')) {
          return;
        }
        
        // Create wrapper if it doesn't exist
        const wrapper = document.createElement('div');
        wrapper.className = 'claude-source-text-wrapper';
        
        // Move the source text into the wrapper
        sourceText.parentNode.insertBefore(wrapper, sourceText);
        wrapper.appendChild(sourceText);
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'claude-source-text-toggle';
        toggleButton.textContent = translate('read-more') || 'Read more';
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.setAttribute('aria-controls', sourceText.id || 'source-text-' + Math.random().toString(36).substr(2, 9));
        
        // Add click handler for toggle
        toggleButton.addEventListener('click', function() {
          const isExpanded = wrapper.classList.contains('expanded');
          
          if (isExpanded) {
            wrapper.classList.remove('expanded');
            this.textContent = translate('read-more') || 'Read more';
            this.setAttribute('aria-expanded', 'false');
            
            // Scroll back to top of element
            sourceItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            wrapper.classList.add('expanded');
            this.textContent = translate('read-less') || 'Show less';
            this.setAttribute('aria-expanded', 'true');
          }
        });
        
        // Add the toggle button
        wrapper.appendChild(toggleButton);
      }
      
      // Helper function to fetch transcripts with enhanced error handling
      async function fetchTranscript(videoId, startTime = 0) {
        try {
          console.log(`Fetching transcript for video ${videoId} with language ${currentLanguage}`);
          
          // Show loading indicator
          const transcriptContainer = document.getElementById(`transcript-${videoId}`);
          if (transcriptContainer) {
            transcriptContainer.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript') || 'Loading transcript...'}</div>`;
          }
          
          const response = await fetch(`${API_URL}/transcript/${videoId}?language=${currentLanguage}`, {
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
      
      // Handle window resize for mobile transitions
      window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
          // If transitioning from mobile to desktop, reset transitions
          if (sourcesPanel && sourcesPanel.classList.contains('active')) {
            sourcesPanel.style.transform = '';
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
      
      // Auto-resize input on first load
      if (queryInput) {
        setTimeout(() => {
          adjustTextareaHeight(queryInput);
          queryInput.focus();
        }, 500);
      }
      
      // If isFirstLoad is true, show welcome message in Claude style
      if (window.isFirstLoad) {
        // Clear existing welcome message if any
        if (messagesContainer) {
          messagesContainer.innerHTML = '';
        }
        
        // Display Claude-style welcome
        displayClaudeWelcome();
        window.isFirstLoad = false;
      }
      
      // Setup global event listener for overlay close via escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          const activeOverlay = document.querySelector('.claude-overlay.active');
          if (activeOverlay) {
            closeOverlay(activeOverlay);
          }
        }
      });
      
      // Initialize source text collapsible behavior for existing elements
      initializeCollapsibleSourceText();
      
      console.log('Enhanced Claude-style interface with overlay modals initialized');
  }
  // Add this function to claude-interface.js
function fixModalAppearance() {
  const styleElement = document.createElement('style');
  styleElement.id = 'modal-appearance-fix';
  styleElement.textContent = `
    /* Fix for modal width and background */
    .claude-overlay {
      background-color: rgba(0, 0, 0, 0.6) !important;
    }
    
    .claude-overlay-content {
      width: 90% !important;
      max-width: 800px !important;
      background-color: white !important;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2) !important;
    }
  `;
  document.head.appendChild(styleElement);
}

// Add this line in the DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', function() {
  // Add this line along with your other initializations
  fixModalAppearance();
  
  // Your existing initialization code...
});