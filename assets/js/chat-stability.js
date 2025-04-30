/**
 * chat-stability.js
 * Enhances the stability and user experience of the sermon chat interface
 * Add this script to your HTML after your existing JavaScript files
 */

document.addEventListener('DOMContentLoaded', function() {
    initChatStabilityEnhancements();
  });
  
  function initChatStabilityEnhancements() {
    console.log('Initializing chat stability enhancements...');
    
    // Setup the enhanced interface
    setupChatInterface();
    
    // Initialize lazy loading for source content
    setupSourceLazyLoading();
    
    // Override scrolling behavior
    improveScrollingBehavior();
    
    // Add resize handling
    window.addEventListener('resize', handleWindowResize);
    
    // Run initial resize handler
    setTimeout(handleWindowResize, 500);
    
    console.log('Chat stability enhancements initialized');
  }
  
  /**
   * Setup the chat interface with stability enhancements
   */
  function setupChatInterface() {
    // Add info section toggle button
    addInfoSectionToggle();
    
    // Override the original addMessage function for better stability
    overrideAddMessageFunction();
    
    // Override typing indicator for smoother appearance
    overrideTypingIndicator();
    
    // Add status indicator
    addStatusIndicator();
    
    // Make example questions have smoother transitions
    improveExampleQuestions();
  }
  
  /**
   * Add a toggle button for the info section
   */
  function addInfoSectionToggle() {
    const infoSection = document.querySelector('.info-section');
    if (!infoSection) return;
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'info-toggle';
    toggleButton.setAttribute('data-collapsed', 'false');
    toggleButton.setAttribute('aria-label', 'Toggle information section');
    toggleButton.innerHTML = '<span class="info-toggle-icon">↑</span>';
    
    toggleButton.addEventListener('click', function() {
      const isCollapsed = this.getAttribute('data-collapsed') === 'true';
      
      if (isCollapsed) {
        // Expand
        infoSection.classList.remove('collapsed');
        this.setAttribute('data-collapsed', 'false');
        this.innerHTML = '<span class="info-toggle-icon">↑</span>';
      } else {
        // Collapse
        infoSection.classList.add('collapsed');
        this.setAttribute('data-collapsed', 'true');
        this.innerHTML = '<span class="info-toggle-icon">↓</span>';
      }
      
      // Adjust layout
      handleWindowResize();
    });
    
    document.body.appendChild(toggleButton);
  }
  
  /**
   * Override the addMessage function for better stability
   */
  function overrideAddMessageFunction() {
    if (typeof window.addMessage !== 'function') {
      console.warn('Original addMessage function not found');
      return;
    }
    
    // Store original function
    window.originalAddMessage = window.addMessage;
    
    // Override with enhanced version
    window.addMessage = function(text, sender, isError = false) {
      // Reserve space for the message first
      reserveSpaceForNewMessage();
      
      // Call original function
      const messageElement = window.originalAddMessage(text, sender, isError);
      
      // Ensure message is visible
      setTimeout(() => {
        ensureLatestMessageVisible(messageElement);
      }, 100);
      
      return messageElement;
    };
  }
  
  /**
   * Reserve space for a new message to prevent layout shifts
   */
  function reserveSpaceForNewMessage() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    // Create placeholder to reserve space
    const placeholder = document.createElement('div');
    placeholder.className = 'message-placeholder';
    placeholder.style.height = '60px';  // Approximate height of a simple message
    placeholder.style.opacity = '0';
    placeholder.style.pointerEvents = 'none';
    
    messagesContainer.appendChild(placeholder);
    
    // Remove after a short delay
    setTimeout(() => {
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    }, 300);
  }
  
  /**
   * Override typing indicator for smoother appearance
   */
  function overrideTypingIndicator() {
    if (typeof window.addTypingIndicator !== 'function') {
      console.warn('Original addTypingIndicator function not found');
      return;
    }
    
    // Store original function
    window.originalAddTypingIndicator = window.addTypingIndicator;
    
    // Override with enhanced version
    window.addTypingIndicator = function() {
      // Reserve space first
      reserveSpaceForNewMessage();
      
      // Call original function
      const indicatorId = window.originalAddTypingIndicator();
      
      // Ensure indicator is visible
      const indicator = document.getElementById(indicatorId);
      if (indicator) {
        setTimeout(() => {
          smoothScrollToBottom(document.getElementById('messages'));
        }, 50);
      }
      
      return indicatorId;
    };
  }
  
  /**
   * Add a status indicator for user feedback
   */
  function addStatusIndicator() {
    // Check if status indicator already exists
    if (document.getElementById('statusIndicator')) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'status-indicator';
    indicator.id = 'statusIndicator';
    document.body.appendChild(indicator);
    
    // Function to show status messages
    window.showStatus = function(message, duration = 3000) {
      indicator.textContent = message;
      indicator.classList.add('visible');
      
      setTimeout(() => {
        indicator.classList.remove('visible');
      }, duration);
    };
  }
  
  /**
   * Improve example questions click behavior
   */
  function improveExampleQuestions() {
    document.querySelectorAll('.example-questions li').forEach(item => {
      item.addEventListener('click', function() {
        // Add visual feedback
        this.style.backgroundColor = 'rgba(46, 163, 242, 0.2)';
        setTimeout(() => {
          this.style.backgroundColor = '';
        }, 300);
        
        // Show status
        if (window.showStatus) {
          window.showStatus('Question selected');
        }
      });
    });
  }
  
  /**
   * Setup lazy loading for source content
   */
  function setupSourceLazyLoading() {
    // Create a mutation observer to watch for new source containers
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              // Check if this is a source container or contains one
              const containers = node.classList && node.classList.contains('source-container') ? 
                [node] : node.querySelectorAll('.source-container');
              
              if (containers.length) {
                prepareSourceContainers(containers);
              }
              
              // Also check for video embeds directly
              const videoEmbeds = node.classList && node.classList.contains('video-embed') ?
                [node] : node.querySelectorAll('.video-embed');
              
              if (videoEmbeds.length) {
                prepareVideoEmbeds(videoEmbeds);
              }
            }
          });
        }
      });
    });
    
    // Start observing the entire document
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also handle any existing source containers
    const existingContainers = document.querySelectorAll('.source-container');
    if (existingContainers.length) {
      prepareSourceContainers(existingContainers);
    }
    
    // Handle existing video embeds
    const existingVideoEmbeds = document.querySelectorAll('.video-embed');
    if (existingVideoEmbeds.length) {
      prepareVideoEmbeds(existingVideoEmbeds);
    }
  }
  
  /**
   * Prepare source containers for lazy loading
   */
  function prepareSourceContainers(containers) {
    containers.forEach(container => {
      // Add intersection observer to load content only when visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Container is visible, load the video if any
            const videoEmbed = entry.target.querySelector('.video-embed');
            if (videoEmbed) {
              const iframe = videoEmbed.querySelector('iframe');
              if (iframe && iframe.dataset.src) {
                iframe.src = iframe.dataset.src;
                iframe.removeAttribute('data-src');
                videoEmbed.classList.add('loaded');
              }
            }
            
            // Stop observing
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      });
      
      // Start observing
      observer.observe(container);
    });
  }
  
  /**
   * Prepare video embeds for lazy loading
   */
  function prepareVideoEmbeds(embeds) {
    embeds.forEach(embed => {
      const iframe = embed.querySelector('iframe');
      if (iframe && iframe.src) {
        // Store the src and clear it
        iframe.dataset.src = iframe.src;
        iframe.removeAttribute('src');
        
        // Create intersection observer
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Embed is visible, load the iframe
              const iframe = entry.target.querySelector('iframe');
              if (iframe && iframe.dataset.src) {
                iframe.src = iframe.dataset.src;
                iframe.removeAttribute('data-src');
                entry.target.classList.add('loaded');
                
                // Stop observing
                observer.unobserve(entry.target);
              }
            }
          });
        }, {
          root: null,
          rootMargin: '100px',
          threshold: 0.1
        });
        
        // Start observing
        observer.observe(embed);
      }
    });
  }
  
  /**
   * Improve scrolling behavior for better performance
   */
  function improveScrollingBehavior() {
    // Override the smoothScrollToBottom function
    if (typeof window.smoothScrollToBottom === 'function') {
      window.originalSmoothScrollToBottom = window.smoothScrollToBottom;
      
      window.smoothScrollToBottom = function(container) {
        if (!container) return;
        
        const scrollHeight = container.scrollHeight;
        const currentScroll = container.scrollTop + container.clientHeight;
        const distanceToBottom = scrollHeight - currentScroll;
        
        // Only smooth scroll for small distances
        if (distanceToBottom < 300) {
          container.scrollTo({
            top: scrollHeight,
            behavior: 'smooth'
          });
        } else {
          // Jump directly for large distances to avoid jarring scrolling
          container.scrollTop = scrollHeight;
        }
      };
    }
    
    // Ensure latest message is visible
    window.ensureLatestMessageVisible = function(messageElement) {
      if (!messageElement) return;
      
      const container = document.getElementById('messages');
      if (!container) return;
      
      // Calculate if the new message is fully visible
      const containerRect = container.getBoundingClientRect();
      const messageRect = messageElement.getBoundingClientRect();
      
      const isFullyVisible = (
        messageRect.bottom <= containerRect.bottom &&
        messageRect.top >= containerRect.top
      );
      
      if (!isFullyVisible) {
        // Scroll to make it visible
        window.smoothScrollToBottom(container);
      }
    };
  }
  
  /**
   * Add enhanced toggle video function
   */
  window.toggleVideo = function(button) {
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
      const hideText = typeof translate === 'function' ? translate('hide-video') : 'Hide Video';
      const showText = typeof translate === 'function' ? translate('watch-video') : 'Watch Video';
      button.textContent = isHidden ? hideText : showText;
      
      // If showing video, ensure it's loaded
      if (isHidden) {
        const iframe = videoEmbed.querySelector('iframe');
        if (iframe && !iframe.src && iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
          iframe.removeAttribute('data-src');
          videoEmbed.classList.add('loaded');
        }
        
        // Scroll to make video visible
        setTimeout(() => {
          videoEmbed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    } catch (error) {
      console.error('Error in toggleVideo:', error);
    }
  };
  
  /**
   * Handle window resize to adjust layout
   */
  function handleWindowResize() {
    const claudeInterface = document.querySelector('.claude-interface');
    const infoSection = document.querySelector('.info-section');
    const chatSectionWrapper = document.querySelector('.chat-section-wrapper');
    
    if (!claudeInterface || !chatSectionWrapper) return;
    
    // Calculate available height
    let availableHeight = window.innerHeight;
    
    // Subtract info section height if visible
    if (infoSection && !infoSection.classList.contains('collapsed')) {
      availableHeight -= infoSection.offsetHeight;
    }
    
    // Keep some margin
    availableHeight -= 40;
    
    // Set minimum height
    const minHeight = 400;
    const finalHeight = Math.max(minHeight, availableHeight);
    
    // Apply the height
    chatSectionWrapper.style.height = `${finalHeight}px`;
    
    // Adjust for hero section and header if present
    adjustForHeaderAndHero(chatSectionWrapper);
    
    // Make sure messages container fills available space
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      // Force a tiny timeout to ensure layout has updated
      setTimeout(() => {
        const inputArea = document.querySelector('.claude-input-area');
        if (inputArea) {
          const inputHeight = inputArea.offsetHeight;
          messagesContainer.style.height = `calc(100% - ${inputHeight}px)`;
        }
      }, 10);
    }
  }
  
  /**
   * Adjust chat container for header and hero elements
   */
  function adjustForHeaderAndHero(chatSectionWrapper) {
    const hero = document.querySelector('.hero');
    const header = document.querySelector('header, .app-header, nav');
    
    if (hero || header) {
      // If we have a hero or header, add some margin
      chatSectionWrapper.style.marginTop = '20px';
      chatSectionWrapper.style.marginBottom = '20px';
      
      // Adjust height to account for these elements
      const heroHeight = hero ? hero.offsetHeight : 0;
      const headerHeight = header ? header.offsetHeight : 0;
      
      // Only reduce height if we're on a desktop (mobile should be full height)
      if (window.innerWidth > 768) {
        chatSectionWrapper.style.height = `calc(${chatSectionWrapper.style.height} - ${heroHeight + headerHeight + 40}px)`;
      }
    }
  }