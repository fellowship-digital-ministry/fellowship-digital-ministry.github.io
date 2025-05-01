/**
 * Enhanced Sermon Chat - Visual Improvements
 * 
 * This script enhances the visual appearance and mobile-friendliness of the sermon search
 * interface without interfering with the core functionality in claude-interface.js.
 * 
 * Features:
 * - Better mobile display for sources panel
 * - Improved visual hierarchy and spacing
 * - Enhanced accessibility
 * - Maintains compatibility with core functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Configuration - use classes for selectors to avoid direct ID conflicts
    const config = {
      sourcesPanel: '.claude-sources-panel',
      sourcesPanelContent: '.claude-sources-panel-content',
      closeButton: '.claude-sources-close',
      sourceBackdrop: '.claude-sources-backdrop',
      sourceToggle: '.claude-sources-toggle',
      messageContent: '.claude-message-content',
      transcriptContainer: '[id^="transcript-"]',
      videoContainer: '.video-embed'
    };
    
    // Initialize - don't directly manipulate elements, just add enhancements
    initializeVisualEnhancements();
    
    /**
     * Initialize visual enhancements without affecting core functionality
     */
    function initializeVisualEnhancements() {
      console.log('Initializing visual enhancements for sermon chat interface');
      
      // Add backdrop for mobile if it doesn't exist
      addBackdropIfNeeded();
      
      // Apply enhanced styling
      applyEnhancedStyles();
      
      // Set up additional mobile touch gestures
      setupTouchGestures();
      
      // Set up viewport adjustments for mobile
      setupViewportAdjustments();
      
      // Enhance transcript styling (without overriding functionality)
      enhanceTranscriptStyling();
      
      // Add observer for dynamic content
      setupDynamicContentObserver();
    }
    
    /**
     * Add backdrop element for mobile overlay if needed
     */
    function addBackdropIfNeeded() {
      // Only add if it doesn't exist yet
      if (!document.querySelector(config.sourceBackdrop)) {
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
        
        // Add click listener - but don't override existing close functionality,
        // just call the existing toggle function
        backdrop.addEventListener('click', function() {
          const sourcesPanel = document.querySelector(config.sourcesPanel);
          if (sourcesPanel && sourcesPanel.classList.contains('active')) {
            // If hideSourcesPanel exists, use it, otherwise just remove the active class
            if (typeof window.hideSourcesPanel === 'function') {
              window.hideSourcesPanel();
            } else {
              sourcesPanel.classList.remove('active');
              updateToggleButtons(false);
              hideBackdrop();
            }
          }
        });
      }
    }
    
    /**
     * Show backdrop with animation
     */
    function showBackdrop() {
      const backdrop = document.querySelector(config.sourceBackdrop);
      if (backdrop) {
        backdrop.style.display = 'block';
        // Force reflow to enable transition
        backdrop.offsetHeight;
        backdrop.style.opacity = '1';
      }
    }
    
    /**
     * Hide backdrop with animation
     */
    function hideBackdrop() {
      const backdrop = document.querySelector(config.sourceBackdrop);
      if (backdrop) {
        backdrop.style.opacity = '0';
        setTimeout(() => {
          backdrop.style.display = 'none';
        }, 300);
      }
    }
    
    /**
     * Update toggle buttons to reflect current state
     */
    function updateToggleButtons(isActive) {
      const activeToggles = document.querySelectorAll(`${config.sourceToggle}[data-active="true"]`);
      activeToggles.forEach(toggle => {
        toggle.setAttribute('data-active', isActive ? 'true' : 'false');
        if (toggle.hasAttribute('aria-expanded')) {
          toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        }
        
        // Update text if possible
        const showText = typeof translate === 'function' ? translate('show-sources') : 'Show Sources';
        const hideText = typeof translate === 'function' ? translate('hide-sources') : 'Hide Sources';
        
        const iconSpan = toggle.querySelector('.claude-sources-toggle-icon');
        if (iconSpan) {
          toggle.innerHTML = isActive ? 
            `<span class="claude-sources-toggle-icon">⬇</span> ${hideText}` : 
            `<span class="claude-sources-toggle-icon">⬆</span> ${showText}`;
        } else {
          toggle.textContent = isActive ? hideText : showText;
        }
      });
    }
    
    /**
     * Set up touch gestures for mobile
     */
    function setupTouchGestures() {
      const sourcesPanel = document.querySelector(config.sourcesPanel);
      if (!sourcesPanel) return;
      
      let touchStartY = 0;
      let touchMoveY = 0;
      
      sourcesPanel.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
      }, {passive: true});
      
      sourcesPanel.addEventListener('touchmove', function(e) {
        // Only apply on mobile
        if (window.innerWidth > 768) return;
        
        touchMoveY = e.touches[0].clientY;
        const deltaY = touchMoveY - touchStartY;
        
        // Only allow swiping down to close
        if (deltaY > 0) {
          // Not using preventDefault() to avoid interfering with scrolling
          // Instead, only apply transform if we're at the top of the scroll
          const scrollTop = sourcesPanel.scrollTop || 
                           document.querySelector(config.sourcesPanelContent)?.scrollTop || 0;
          
          if (scrollTop <= 0) {
            // Apply a transform to follow finger but with resistance
            const translateY = Math.min(deltaY * 0.5, 100);
            sourcesPanel.style.transform = `translateY(${translateY}px)`;
          }
        }
      }, {passive: true});
      
      sourcesPanel.addEventListener('touchend', function() {
        // Only apply on mobile
        if (window.innerWidth > 768) return;
        
        const deltaY = touchMoveY - touchStartY;
        
        if (deltaY > 80) {
          // Close the panel if swiped down enough
          if (typeof window.hideSourcesPanel === 'function') {
            window.hideSourcesPanel();
          } else {
            sourcesPanel.classList.remove('active');
            updateToggleButtons(false);
            hideBackdrop();
          }
        }
        
        // Reset transform
        sourcesPanel.style.transform = '';
        touchStartY = 0;
        touchMoveY = 0;
      }, {passive: true});
    }
    
    /**
     * Set up viewport adjustments for mobile
     */
    function setupViewportAdjustments() {
      // Watch for panel activation to show backdrop
      const sourcesPanel = document.querySelector(config.sourcesPanel);
      if (!sourcesPanel) return;
      
      // Use MutationObserver to detect when the panel becomes active
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.attributeName === 'class') {
            const isActive = sourcesPanel.classList.contains('active');
            
            // Show/hide backdrop based on active state
            if (isActive) {
              showBackdrop();
            } else {
              hideBackdrop();
            }
            
            // Update button states
            updateToggleButtons(isActive);
          }
        });
      });
      
      observer.observe(sourcesPanel, {attributes: true});
      
      // Handle resize events
      window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
          // If transitioning from mobile to desktop, reset panel styles
          if (sourcesPanel.style.transform) {
            sourcesPanel.style.transform = '';
          }
        }
      });
      
      // Handle orientation change on mobile
      window.addEventListener('orientationchange', function() {
        // Slight delay to allow browser to adjust
        setTimeout(() => {
          // If panel is active, adjust its height
          if (sourcesPanel.classList.contains('active') && window.innerWidth <= 768) {
            sourcesPanel.style.height = (window.innerHeight * 0.75) + 'px';
          }
        }, 100);
      });
    }
    
    /**
     * Enhance transcript styling
     */
    function enhanceTranscriptStyling() {
      // Add styles without overriding functionality
      const style = document.createElement('style');
      style.textContent = `
        /* Improved transcript styling */
        [id^="transcript-"] {
          max-height: 60vh;
          overflow-y: auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 1rem auto;
          padding: 1rem;
          border: 1px solid #eee;
        }
        
        /* Transcript segments */
        .transcript-segment {
          display: flex;
          margin-bottom: 10px;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        
        .transcript-segment:hover {
          background-color: rgba(46, 163, 242, 0.05);
        }
        
        .transcript-highlight-segment {
          background-color: rgba(46, 163, 242, 0.1);
          border-left: 3px solid #2ea3f2;
          padding-left: 8px;
        }
        
        /* Timestamp styling */
        .transcript-timestamp {
          flex: 0 0 70px;
          font-family: monospace;
          font-weight: bold;
          color: #666;
        }
        
        /* Improved source styling */
        .source-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid #eee;
          transition: box-shadow 0.2s ease;
        }
        
        .source-container:hover {
          box-shadow: a 2px 8px rgba(0,0,0,0.15);
        }
        
        /* Improved button styling */
        .watch-video-btn,
        .view-transcript-btn,
        .open-youtube-btn {
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .watch-video-btn:hover,
        .view-transcript-btn:hover,
        .open-youtube-btn:hover {
          background-color: #e9ecef;
        }
        
        /* Make claude-sources-panel more mobile friendly */
        @media (max-width: 768px) {
          .claude-sources-panel.active {
            position: fixed !important;
            top: auto !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: 75vh !important;
            border-radius: 12px 12px 0 0 !important;
            z-index: 900 !important;
          }
          
          /* Add a visual handle for mobile */
          .claude-sources-panel.active::before {
            content: "";
            display: block;
            width: 40px;
            height: 4px;
            background-color: #ddd;
            border-radius: 2px;
            margin: 10px auto;
            position: absolute;
            top: 5px;
            left: 50%;
            transform: translateX(-50%);
          }
          
          /* Adjust padding for mobile */
          .claude-sources-panel-content {
            padding-top: 20px !important;
          }
        }
        
        /* Better video container */
        .video-embed {
          position: relative;
          background-color: #000;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .video-embed iframe {
          width: 100%;
          min-height: 320px;
          border: none;
        }
      `;
      
      document.head.appendChild(style);
    }
    
    /**
     * Set up observer to enhance dynamically added content
     */
    function setupDynamicContentObserver() {
      // Watch for new messages or sources being added
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            // Check for new source items
            const addedNodes = Array.from(mutation.addedNodes);
            addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Look for newly added sources
                const sourceItems = node.querySelectorAll ? 
                  node.querySelectorAll('.source-container, .claude-source-item') : [];
                
                if (sourceItems.length > 0) {
                  // Apply enhancements to source items
                  enhanceSourceItems(sourceItems);
                }
                
                // Look for newly added transcript containers
                const transcriptContainers = node.querySelectorAll ?
                  node.querySelectorAll(config.transcriptContainer) : [];
                
                if (transcriptContainers.length > 0) {
                  // Apply enhancements to transcript containers
                  enhanceTranscriptContainers(transcriptContainers);
                }
              }
            });
          }
        });
      });
      
      // Start observing the document for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    /**
     * Apply enhancements to source items
     */
    function enhanceSourceItems(sourceItems) {
      sourceItems.forEach(sourceItem => {
        // Add focus styles for better accessibility
        if (!sourceItem.classList.contains('enhanced')) {
          sourceItem.classList.add('enhanced');
          
          // Add subtle hover effect
          sourceItem.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
          
          // Add aria attributes for better screen reader support
          sourceItem.setAttribute('role', 'region');
          sourceItem.setAttribute('aria-label', 'Sermon source');
          
          // Enhance buttons if they exist
          const buttons = sourceItem.querySelectorAll('button');
          buttons.forEach(button => {
            // Add hover effect
            button.style.transition = 'all 0.2s ease';
            
            // Add aria attributes
            if (button.textContent.includes('Video')) {
              button.setAttribute('aria-label', 'Watch video clip');
            } else if (button.textContent.includes('Transcript')) {
              button.setAttribute('aria-label', 'View transcript');
            }
          });
        }
      });
    }
    
    /**
     * Apply enhancements to transcript containers
     */
    function enhanceTranscriptContainers(containers) {
      containers.forEach(container => {
        if (!container.classList.contains('enhanced')) {
          container.classList.add('enhanced');
          
          // Add proper heading for accessibility
          if (!container.querySelector('.transcript-heading')) {
            const heading = document.createElement('h3');
            heading.className = 'transcript-heading';
            heading.style.fontSize = '1.1rem';
            heading.style.marginTop = '0';
            heading.style.marginBottom = '1rem';
            heading.style.color = '#444';
            heading.textContent = typeof translate === 'function' ? 
              translate('transcript') || 'Transcript' : 'Transcript';
            
            // Insert at the beginning
            if (container.firstChild) {
              container.insertBefore(heading, container.firstChild);
            } else {
              container.appendChild(heading);
            }
          }
          
          // Make timestamps clickable if they aren't already
          const timestamps = container.querySelectorAll('.transcript-timestamp');
          timestamps.forEach(timestamp => {
            if (!timestamp.hasAttribute('role')) {
              timestamp.setAttribute('role', 'button');
              timestamp.setAttribute('tabindex', '0');
              timestamp.style.cursor = 'pointer';
              timestamp.title = 'Click to jump to this timestamp in the video';
              
              // We're not adding click handlers here to avoid conflicts
              // with existing functionality
            }
          });
        }
      });
    }
    
    /**
     * Apply enhanced CSS styles for better visual hierarchy and mobile support
     */
    function applyEnhancedStyles() {
      const styleElement = document.createElement('style');
      styleElement.id = 'enhanced-sermon-chat-styles';
      styleElement.textContent = `
        /* Improved source panel styling */
        .claude-sources-panel {
          background-color: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.15);
          border-radius: 8px;
          z-index: 900;
          transition: all 0.3s ease;
        }
        
        /* Better close button */
        .claude-sources-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: white;
          color: #333;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          cursor: pointer;
          font-size: 18px;
          border: none;
          outline: none;
          z-index: 1000;
          transition: all 0.2s ease;
        }
        
        .claude-sources-close:hover {
          background-color: #f8f9fa;
          transform: scale(1.05);
        }
        
        /* Source toggle button styling */
        .claude-sources-toggle {
          display: inline-flex;
          align-items: center;
          background-color: #f8f9fa;
          border: 1px solid #e0e5eb;
          color: #555;
          padding: 6px 12px;
          border-radius: 6px;
          margin-top: 12px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        
        .claude-sources-toggle:hover {
          background-color: #e9ecef;
        }
        
        .claude-sources-toggle-icon {
          margin-right: 6px;
          font-size: 0.8rem;
        }
        
        /* Improved message styling */
        .claude-message {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          line-height: 1.5;
          position: relative;
          transform-origin: bottom;
          animation: message-appear 0.3s ease;
        }
        
        @keyframes message-appear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .claude-message-user {
          background-color: #2ea3f2;
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 3px;
        }
        
        .claude-message-bot {
          background-color: white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          margin-right: auto;
          border-bottom-left-radius: 3px;
        }
        
        /* Source item styling */
        .claude-source-item {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #eee;
          transition: all 0.2s ease;
        }
        
        .claude-source-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .claude-message {
            max-width: 90%;
            padding: 10px 14px;
          }
          
          .claude-source-item {
            padding: 12px;
          }
          
          .claude-source-actions {
            display: flex;
            flex-direction: column;
          }
          
          .claude-source-button {
            margin-bottom: 8px;
            width: 100%;
          }
        }
        
        /* Improved typing indicator */
        .claude-typing {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          background-color: rgba(255,255,255,0.8);
          padding: 12px 16px;
          border-radius: 12px;
          max-width: 100px;
          animation: typing-appear 0.3s ease;
        }
        
        @keyframes typing-appear {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .claude-typing-bubble {
          width: 8px;
          height: 8px;
          margin: 0 2px;
          background-color: #aaa;
          border-radius: 50%;
          animation: typing-bubble 1.4s infinite ease-in-out both;
        }
        
        .claude-typing-bubble:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .claude-typing-bubble:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes typing-bubble {
          0%, 80%, 100% { transform: scale(0.7); background-color: #bbb; }
          40% { transform: scale(1.0); background-color: #888; }
        }
        
        /* Improved transitions for source panel */
        .claude-ripple {
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: ripple 0.6s linear;
          background-color: rgba(46, 163, 242, 0.15);
        }
        
        @keyframes ripple {
          to {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        
        /* Better Bible reference styling */
        .bible-reference {
          color: #2ea3f2;
          font-weight: 600;
          cursor: pointer;
          padding: 0 2px;
          border-radius: 3px;
          background-color: rgba(46, 163, 242, 0.05);
          transition: background-color 0.2s ease;
          text-decoration: none;
          white-space: nowrap;
        }
        
        .bible-reference:hover {
          background-color: rgba(46, 163, 242, 0.15);
          text-decoration: underline;
        }
        
        /* Improved overlay styling */
        .claude-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        .claude-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        
        .claude-overlay-content {
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transform: scale(0.9);
          transition: transform 0.3s ease;
        }
        
        .claude-overlay.active .claude-overlay-content {
          transform: scale(1);
        }
        
        /* Better scrollbar styling */
        .claude-sources-panel-content::-webkit-scrollbar,
        .transcript-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .claude-sources-panel-content::-webkit-scrollbar-track,
        .transcript-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .claude-sources-panel-content::-webkit-scrollbar-thumb,
        .transcript-container::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        
        .claude-sources-panel-content::-webkit-scrollbar-thumb:hover,
        .transcript-container::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `;
      
      document.head.appendChild(styleElement);
    }
  });