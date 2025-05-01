/**
 * Enhanced Sermon Sources Modal Fix
 * 
 * This script fixes the interaction issues between the sources panel and 
 * the content that appears when clicking on video clips or transcripts.
 * 
 * It properly manages z-indices, modal stacking, and ensures a clean user experience
 * on both mobile and desktop views.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const config = {
    sourcesPanel: '#sourcesPanel, .claude-sources-panel, .sources-modal, .sources-modal-content',
    videoContainer: '.video-embed, .video-container, iframe',
    transcriptContainer: '.transcript-container, [id^="transcript-"]',
    watchButton: '.watch-video-btn, button[onclick*="toggleVideo"]',
    transcriptButton: '.view-transcript-btn, button[onclick*="toggleTranscript"]',
    closeButton: '#closeSourcesPanel, .claude-sources-close',
    sourceBackdrop: '.claude-sources-backdrop'
  };

  // DOM elements
  const elements = {};
  
  // Initialize by finding elements
  function initElements() {
    for (const [key, selector] of Object.entries(config)) {
      elements[key] = document.querySelectorAll(selector);
    }
  }
  
  // Initial setup
  initElements();
  setupModalBehavior();
  
  // Watch for new elements being added to the DOM
  setupMutationObserver();
  
  /**
   * Setup proper modal behavior
   */
  function setupModalBehavior() {
    // Override toggleVideo function
    window.originalToggleVideo = window.toggleVideo;
    window.toggleVideo = function(button) {
      try {
        // If sources panel is active, hide it first
        hideSourcesPanel();
        
        // Call the original function
        if (window.originalToggleVideo) {
          window.originalToggleVideo(button);
        } else {
          // Fallback implementation
          if (!button || !button.parentElement) return;
          
          const videoEmbed = button.parentElement.nextElementSibling;
          if (!videoEmbed || !videoEmbed.classList.contains('video-embed')) return;
          
          const isHidden = videoEmbed.style.display === 'none';
          videoEmbed.style.display = isHidden ? 'block' : 'none';
          
          // Update button text
          const hideText = typeof translate === 'function' ? translate('hide-video') : 'Hide Video';
          const showText = typeof translate === 'function' ? translate('watch-video') : 'Watch Video';
          button.textContent = isHidden ? hideText : showText;
          
          // Scroll to make video visible
          if (isHidden) {
            setTimeout(() => {
              videoEmbed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error in enhanced toggleVideo:', error);
      }
    };
    
    // Override toggleTranscript function
    window.originalToggleTranscript = window.toggleTranscript;
    window.toggleTranscript = function(videoId, startTime = 0) {
      try {
        // If sources panel is active, hide it first
        hideSourcesPanel();
        
        // Call the original function
        if (window.originalToggleTranscript) {
          window.originalToggleTranscript(videoId, startTime);
        } else {
          // Fallback implementation
          if (!videoId) return;
          
          const transcriptContainer = document.getElementById(`transcript-${videoId}`);
          const button = document.querySelector(`.view-transcript-btn[onclick*="toggleTranscript('${videoId}')"]`);
          
          if (!transcriptContainer) {
            // Load transcript
            if (typeof fetchTranscript === 'function') {
              fetchTranscript(videoId, startTime);
            }
            
            // Update button text
            if (button) {
              const hideText = typeof translate === 'function' ? translate('hide-transcript') : 'Hide Transcript';
              button.textContent = hideText;
            }
            return;
          }
          
          // Toggle visibility
          const isHidden = transcriptContainer.style.display === 'none';
          transcriptContainer.style.display = isHidden ? 'block' : 'none';
          
          // Update button text
          if (button) {
            const hideText = typeof translate === 'function' ? translate('hide-transcript') : 'Hide Transcript';
            const showText = typeof translate === 'function' ? translate('view-transcript') : 'View Transcript';
            button.textContent = isHidden ? hideText : showText;
          }
          
          // Scroll to transcript
          if (isHidden) {
            setTimeout(() => {
              transcriptContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error in enhanced toggleTranscript:', error);
      }
    };
    
    // Setup close button behavior
    setupCloseButtons();
    
    // Ensure global function is available
    window.hideSourcesPanel = hideSourcesPanel;
  }
  
  /**
   * Setup close button behavior
   */
  function setupCloseButtons() {
    elements.closeButton.forEach(button => {
      if (button) {
        // Remove existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new event listener
        newButton.addEventListener('click', function(e) {
          e.preventDefault();
          hideSourcesPanel();
        });
      }
    });
    
    // Close on backdrop click
    elements.sourceBackdrop.forEach(backdrop => {
      if (backdrop) {
        backdrop.addEventListener('click', hideSourcesPanel);
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        hideSourcesPanel();
      }
    });
  }
  
  /**
   * Hide the sources panel
   */
  function hideSourcesPanel() {
    // Hide all source panels
    elements.sourcesPanel.forEach(panel => {
      if (panel) {
        if (panel.classList.contains('active')) {
          panel.classList.remove('active');
        }
        if (panel.style.display === 'block') {
          panel.style.display = 'none';
        }
      }
    });
    
    // Hide backdrop if it exists
    elements.sourceBackdrop.forEach(backdrop => {
      if (backdrop) {
        backdrop.style.opacity = '0';
        setTimeout(() => {
          backdrop.style.display = 'none';
        }, 300);
      }
    });
    
    // Update any toggle buttons
    const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"], .show-sources[data-active="true"]');
    activeToggles.forEach(toggle => {
      toggle.setAttribute('data-active', 'false');
      if (toggle.hasAttribute('aria-expanded')) {
        toggle.setAttribute('aria-expanded', 'false');
      }
      
      // Update text if possible
      const showText = typeof translate === 'function' ? translate('show-sources') : 'Show Sources';
      if (toggle.textContent.includes('Hide') || toggle.textContent.includes('hide')) {
        const iconSpan = toggle.querySelector('.claude-sources-toggle-icon');
        if (iconSpan) {
          toggle.innerHTML = `<span class="claude-sources-toggle-icon">⬆</span> ${showText}`;
        } else {
          toggle.textContent = showText;
        }
      }
    });
  }
  
  /**
   * Setup mutation observer to watch for DOM changes
   */
  function setupMutationObserver() {
    const observer = new MutationObserver(function(mutations) {
      let needsRefresh = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          // Check if any relevant elements were added
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if this is a relevant element or contains relevant elements
              if (isRelevantElement(node) || node.querySelector(Object.values(config).join(','))) {
                needsRefresh = true;
                break;
              }
            }
          }
        }
      });
      
      if (needsRefresh) {
        // Refresh our element references
        initElements();
        // Reapply setup
        setupModalBehavior();
      }
    });
    
    // Start observing document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Check if an element matches any of our selectors
   */
  function isRelevantElement(element) {
    return Object.values(config).some(selector => {
      // Convert comma-separated selectors to array
      const individualSelectors = selector.split(',').map(s => s.trim());
      return individualSelectors.some(s => element.matches(s));
    });
  }
  
  // Apply CSS fixes
  applyStyleFixes();
  
  /**
   * Apply CSS fixes for z-index and modal behavior
   */
  function applyStyleFixes() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Z-index hierarchy fixes */
      .claude-sources-panel,
      .sources-modal,
      #sourcesPanel {
        z-index: 900 !important;
      }
      
      .video-embed,
      .transcript-container,
      [id^="transcript-"] {
        position: relative !important;
        z-index: 1000 !important;
        background-color: white !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        margin: 1rem auto !important;
        width: 100% !important;
        border: 1px solid #eee !important;
      }
      
      /* Fix the close button positioning */
      #closeSourcesPanel,
      .claude-sources-close {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        z-index: 1001 !important;
      }
      
      /* Improve video container appearance */
      .video-embed iframe {
        width: 100% !important;
        height: 100% !important;
        min-height: 320px !important;
      }
      
      /* Source container improvements */
      .source-container {
        margin-bottom: 1rem !important;
        position: relative !important;
      }
      
      /* Transcript modal positioning */
      #transcript-container {
        max-height: 60vh !important;
        overflow-y: auto !important;
      }
      
      /* Better mobile experience */
      @media (max-width: 768px) {
        .claude-sources-panel.active,
        .sources-modal.active,
        #sourcesPanel.active {
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 75vh !important;
          width: 100% !important;
          max-width: none !important;
          border-radius: 12px 12px 0 0 !important;
          overflow: hidden !important;
          z-index: 900 !important;
        }
        
        .video-embed iframe {
          min-height: 240px !important;
        }
      }
    `;
    
    document.head.appendChild(styleEl);
  }
  
  console.log('Enhanced sermon sources modal fix initialized');
});
