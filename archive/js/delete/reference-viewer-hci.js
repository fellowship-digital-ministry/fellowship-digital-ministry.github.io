/**
 * Bible Reference Viewer HCI Enhancements
 * This script adds human-computer interaction improvements to the reference viewer
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeHCIEnhancements();
  });
  
  /**
   * Initialize HCI enhancements for better usability
   */
  function initializeHCIEnhancements() {
    // Add skip link for keyboard accessibility
    addSkipLink();
    
    // Add keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Add touch-friendly enhancements for mobile
    enhanceTouchInteractions();
    
    // Add progress feedback
    enhanceProgressFeedback();
    
    // Setup print functionality
    setupPrintButton();
    
    // Add copy reference functionality
    addCopyReferenceButton();
    
    // Enhanced error handling with retry option
    enhanceErrorHandling();
    
    // Add scroll position memory
    implementScrollMemory();
    
    // Add visual cues for interaction (after content loads)
    document.addEventListener('referenceLoaded', function() {
      addVisualCuesForInteraction();
    });
  }
  
  /**
   * Add skip link for keyboard accessibility
   */
  function addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#occurrences-list';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to references';
    skipLink.setAttribute('aria-label', 'Skip to reference list');
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
  
  /**
   * Setup keyboard shortcuts for navigation
   */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Alt+B to go back (on most platforms)
      if (e.altKey && e.key === 'b') {
        e.preventDefault();
        navigateBack();
      }
      
      // Alt+R to focus on the first reference
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        focusFirstReference();
      }
  
      // Check if we need to handle the escape key
      if (e.key === 'Escape') {
        // Close any open modals or expanded content
        closeExpandedContent();
      }
    });
    
    // Add keyboard shortcut hint to the page
    const keyboardHint = document.createElement('div');
    keyboardHint.className = 'keyboard-shortcuts-hint';
    keyboardHint.innerHTML = `
      <button aria-expanded="false" class="shortcuts-toggle">Keyboard Shortcuts ⌨️</button>
      <div class="shortcuts-panel" hidden>
        <ul>
          <li><kbd>Alt</kbd> + <kbd>B</kbd> - Go back to previous page</li>
          <li><kbd>Alt</kbd> + <kbd>R</kbd> - Jump to first reference</li>
          <li><kbd>Esc</kbd> - Close expanded content</li>
        </ul>
      </div>
    `;
    
    // Add it after the reference header
    const referenceHeader = document.querySelector('.reference-header');
    if (referenceHeader) {
      referenceHeader.parentNode.insertBefore(keyboardHint, referenceHeader.nextSibling);
      
      // Toggle shortcuts panel visibility
      const toggleButton = keyboardHint.querySelector('.shortcuts-toggle');
      const panel = keyboardHint.querySelector('.shortcuts-panel');
      
      toggleButton.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        panel.hidden = isExpanded;
      });
    }
  }
  
  /**
   * Helper function to navigate back
   */
  function navigateBack() {
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
      window.history.back();
    } else {
      window.location.href = 'analytics.html';
    }
  }
  
  /**
   * Helper function to focus on the first reference
   */
  function focusFirstReference() {
    const firstReference = document.querySelector('.occurrence-item');
    if (firstReference) {
      firstReference.focus();
      firstReference.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  /**
   * Helper function to close any expanded content
   */
  function closeExpandedContent() {
    // Close any open video embeds
    const openVideos = document.querySelectorAll('.video-embed');
    openVideos.forEach(video => {
      if (video.style.display !== 'none') {
        video.style.display = 'none';
      }
    });
    
    // Close any open shortcuts panel
    const shortcutsPanel = document.querySelector('.shortcuts-panel');
    if (shortcutsPanel && !shortcutsPanel.hidden) {
      const toggleButton = document.querySelector('.shortcuts-toggle');
      toggleButton.setAttribute('aria-expanded', 'false');
      shortcutsPanel.hidden = true;
    }
    
    // Close the first-time visitor guide if it's open
    const firstTimeGuide = document.getElementById('firstTimeGuide');
    if (firstTimeGuide && !firstTimeGuide.hidden) {
      firstTimeGuide.hidden = true;
    }
  }
  
  /**
   * Enhance touch interactions for mobile devices
   */
  function enhanceTouchInteractions() {
    // Add touch-specific classes for CSS targeting
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('touch-device');
      
      // Implement gesture recognizers
      let touchStartY = 0;
      
      document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });
      
      document.addEventListener('touchmove', function(e) {
        const touchY = e.touches[0].clientY;
        const diff = touchStartY - touchY;
        
        // If scrolling down significantly, add a class to hide non-essential UI
        if (diff > 60) {
          document.body.classList.add('scrolling-down');
        } else if (diff < -60) {
          document.body.classList.remove('scrolling-down');
        }
      }, { passive: true });
      
      // Add larger touch targets for mobile
      document.querySelectorAll('.video-link, .related-verse, .view-link').forEach(link => {
        link.classList.add('touch-target');
      });
    }
  }
  
  /**
   * Enhance progress feedback during loading states
   */
  function enhanceProgressFeedback() {
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (!loadingIndicator) return;
    
    // Create a progress element
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    progressContainer.innerHTML = `
      <div class="progress-bar" id="loadingProgress"></div>
    `;
    
    loadingIndicator.appendChild(progressContainer);
    
    // Simulate progress updates
    simulateProgressUpdates();
  }
  
  /**
   * Simulate progress updates for better UX during loading
   */
  function simulateProgressUpdates() {
    const progressBar = document.getElementById('loadingProgress');
    if (!progressBar) return;
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      
      // Slow down as we approach 90%
      if (progress > 90) {
        progress = 90 + (Math.random() * 2);
      }
      
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      progressBar.style.width = `${progress}%`;
      
      // Update loading text based on progress
      const loadingText = document.querySelector('.loading-text');
      if (loadingText) {
        if (progress < 30) {
          loadingText.textContent = 'Connecting to Bible reference data...';
        } else if (progress < 60) {
          loadingText.textContent = 'Finding sermon occurrences...';
        } else if (progress < 90) {
          loadingText.textContent = 'Preparing reference details...';
        } else {
          loadingText.textContent = 'Almost ready...';
        }
      }
    }, 200);
    
    // Set up an event listener to complete the progress when content is loaded
    document.addEventListener('referenceLoaded', function() {
      progressBar.style.width = '100%';
      clearInterval(interval);
    });
  }
  
  /**
   * Setup print functionality for reference data
   */
  function setupPrintButton() {
    const referenceHeader = document.querySelector('.reference-header');
    if (!referenceHeader) return;
    
    const printButton = document.createElement('button');
    printButton.className = 'print-button';
    printButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Print References
    `;
    
    printButton.setAttribute('aria-label', 'Print reference data');
    
    printButton.addEventListener('click', function() {
      // Before printing, add a print-friendly title
      const originalTitle = document.title;
      const referenceTitle = document.getElementById('reference-title').textContent;
      document.title = `Bible Reference: ${referenceTitle}`;
      
      // Add print-only class to body for print-specific styling
      document.body.classList.add('print-mode');
      
      // Print the page
      window.print();
      
      // After printing, restore original title and remove print mode
      setTimeout(() => {
        document.title = originalTitle;
        document.body.classList.remove('print-mode');
      }, 500);
    });
    
    referenceHeader.appendChild(printButton);
  }
  
  /**
   * Add copy reference functionality
   */
  function addCopyReferenceButton() {
    // Wait for the reference title to be available
    const checkForTitle = setInterval(() => {
      const referenceTitle = document.getElementById('reference-title');
      if (referenceTitle && referenceTitle.textContent) {
        clearInterval(checkForTitle);
        
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-reference-button';
        copyButton.setAttribute('aria-label', 'Copy reference');
        copyButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copy
        `;
        
        copyButton.addEventListener('click', function() {
          // Get the reference text
          const referenceText = referenceTitle.textContent;
          
          // Copy to clipboard
          navigator.clipboard.writeText(referenceText).then(() => {
            // Show success state
            this.classList.add('copied');
            this.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copied!
            `;
            
            // Reset after 2 seconds
            setTimeout(() => {
              this.classList.remove('copied');
              this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              `;
            }, 2000);
          }).catch(err => {
            console.error('Could not copy text: ', err);
            
            // Show error state
            this.classList.add('error');
            this.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Error
            `;
            
            // Reset after 2 seconds
            setTimeout(() => {
              this.classList.remove('error');
              this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              `;
            }, 2000);
          });
        });
        
        // Add button next to the reference title
        referenceTitle.parentNode.insertBefore(copyButton, referenceTitle.nextSibling);
      }
    }, 500);
    
    // Timeout after 10 seconds if title never loads
    setTimeout(() => clearInterval(checkForTitle), 10000);
  }
  
  /**
   * Enhanced error handling with retry option
   */
  function enhanceErrorHandling() {
    const errorMessage = document.getElementById('error-message');
    if (!errorMessage) return;
    
    // Add a retry button to the error message
    if (!document.querySelector('.retry-button')) {
      const retryButton = document.createElement('button');
      retryButton.className = 'retry-button';
      retryButton.textContent = 'Try Again';
      
      retryButton.addEventListener('click', function() {
        window.location.reload();
      });
      
      errorMessage.appendChild(retryButton);
    }
    
    // Add helpful debugging info in a collapsible section
    const debugInfo = document.createElement('div');
    debugInfo.className = 'debug-info';
    debugInfo.innerHTML = `
      <button class="debug-toggle" aria-expanded="false">Show Technical Details</button>
      <div class="debug-content" hidden>
        <p>URL: ${window.location.href}</p>
        <p>Browser: ${navigator.userAgent}</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      </div>
    `;
    
    errorMessage.appendChild(debugInfo);
    
    // Add toggle behavior
    const debugToggle = debugInfo.querySelector('.debug-toggle');
    const debugContent = debugInfo.querySelector('.debug-content');
    
    debugToggle.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      debugContent.hidden = isExpanded;
      this.textContent = isExpanded ? 'Show Technical Details' : 'Hide Technical Details';
    });
  }
  
  /**
   * Implement scroll position memory
   */
  function implementScrollMemory() {
    // Store scroll position when user clicks on a related reference
    document.addEventListener('click', function(e) {
      const relatedLink = e.target.closest('.related-verse');
      if (relatedLink) {
        // Save current scroll position to session storage
        sessionStorage.setItem('scrollPosition', window.scrollY);
      }
    });
    
    // Restore scroll position if returning from a related reference
    if (document.referrer && document.referrer.includes(window.location.hostname) && 
        document.referrer.includes('reference-viewer.html')) {
      const savedPosition = sessionStorage.getItem('scrollPosition');
      if (savedPosition) {
        // Wait for content to load before scrolling
        window.addEventListener('referenceLoaded', function() {
          window.scrollTo(0, parseInt(savedPosition));
          sessionStorage.removeItem('scrollPosition');
        });
      }
    }
  }
  
  /**
   * Add visual cues for interaction
   */
  function addVisualCuesForInteraction() {
    // Add tooltip hints for interactive elements
    document.querySelectorAll('.video-link, .related-verse').forEach(element => {
      // Only add if tooltip doesn't already exist
      if (!element.hasAttribute('title')) {
        if (element.classList.contains('video-link')) {
          element.setAttribute('title', 'Open video at this timestamp');
        } else if (element.classList.contains('related-verse')) {
          element.setAttribute('title', 'View occurrences of this verse');
        }
      }
    });
    
    // Add interaction hints for Bible reference sections
    const firstOccurrence = document.querySelector('.occurrence-item');
    if (firstOccurrence) {
      const hint = document.createElement('div');
      hint.className = 'interaction-hint';
      hint.textContent = 'Click any reference to expand details';
      hint.setAttribute('aria-hidden', 'true'); // Hide from screen readers
      
      // Add hint before the first occurrence
      firstOccurrence.parentNode.insertBefore(hint, firstOccurrence);
      
      // Remove hint after 5 seconds or when user interacts
      setTimeout(() => {
        hint.classList.add('fade-out');
        setTimeout(() => hint.remove(), 1000);
      }, 5000);
      
      document.addEventListener('click', function() {
        if (document.contains(hint)) {
          hint.classList.add('fade-out');
          setTimeout(() => hint.remove(), 1000);
        }
      });
    }
    
    // Add visual feedback for related verses section
    const relatedSection = document.getElementById('related-references-list');
    if (relatedSection && !relatedSection.querySelector('.pulse-indicator')) {
      const pulseIndicator = document.createElement('div');
      pulseIndicator.className = 'pulse-indicator';
      pulseIndicator.setAttribute('aria-hidden', 'true');
      
      // Add to the section heading
      const heading = relatedSection.querySelector('h3');
      if (heading) {
        heading.appendChild(pulseIndicator);
      }
    }
  }
  
  /**
   * Check if the user has seen the reference viewer before
   * and tailor the experience accordingly
   */
  function checkFirstTimeVisitor() {
    // We'll use the main welcome guide in reference-viewer.html instead
    // This prevents conflicts between the two welcome implementations
    
    // If we need to show additional tooltips later, we can add them here
    // after the main welcome guide has been closed
  }
  
  /**
   * Show first-time visitor guide with helpful tooltips
   * This function is kept for reference but not used
   */
  function showFirstTimeVisitorGuide() {
    // This functionality has been moved to reference-viewer.html
    // to avoid conflicts between multiple welcome popups
  }
  
  // Initialize HCI enhancements when the reference data is loaded
  document.addEventListener('referenceLoaded', function() {
    // Add tabindex attributes to make elements focusable
    document.querySelectorAll('.occurrence-item').forEach((item, index) => {
      item.setAttribute('tabindex', '0');
    });
    
    // Add ARIA roles for better screen reader support
    document.querySelectorAll('.sermon-group').forEach((group, index) => {
      group.setAttribute('role', 'region');
      group.setAttribute('aria-labelledby', `sermon-title-${index}`);
      
      // Add ID to sermon title for aria-labelledby
      const title = group.querySelector('.sermon-title');
      if (title) {
        title.id = `sermon-title-${index}`;
      }
    });
    
    // Check for first-time visitors
    checkFirstTimeVisitor();
  });
  
  // Add custom styles for HCI enhancements
  function addHCIStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Skip link */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        padding: 8px 16px;
        background-color: var(--color-primary);
        color: white;
        z-index: 1000;
        transition: top 0.3s;
      }
      
      .skip-link:focus {
        top: 0;
      }
      
      /* Progress bar */
      .progress-container {
        height: 6px;
        width: 80%;
        max-width: 400px;
        background-color: #f0f0f0;
        border-radius: 3px;
        margin: 1rem auto;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        width: 0;
        background-color: var(--color-primary);
        transition: width 0.4s ease;
      }
      
      /* Print button */
      .print-button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        color: #333;
        cursor: pointer;
        margin-left: auto;
      }
      
      .print-button:hover {
        background-color: #f0f0f0;
      }
      
      /* Copy button */
      .copy-reference-button {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.8rem;
        color: #333;
        cursor: pointer;
        margin-left: 8px;
        vertical-align: middle;
      }
      
      .copy-reference-button:hover {
        background-color: #f0f0f0;
      }
      
      .copy-reference-button.copied {
        background-color: #d4edda;
        color: #155724;
        border-color: #c3e6cb;
      }
      
      .copy-reference-button.error {
        background-color: #f8d7da;
        color: #721c24;
        border-color: #f5c6cb;
      }
      
      /* Keyboard shortcuts */
      .keyboard-shortcuts-hint {
        margin: 1rem 0;
        font-size: 0.9rem;
      }
      
      .shortcuts-toggle {
        background: none;
        border: none;
        color: var(--color-primary);
        cursor: pointer;
        padding: 0;
        font-size: inherit;
        display: inline-flex;
        align-items: center;
      }
      
      .shortcuts-toggle:hover {
        text-decoration: underline;
      }
      
      .shortcuts-panel {
        margin-top: 8px;
        padding: 12px 16px;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
      }
      
      .shortcuts-panel ul {
        margin: 0;
        padding-left: 16px;
      }
      
      .shortcuts-panel li {
        margin-bottom: 6px;
      }
      
      .shortcuts-panel kbd {
        display: inline-block;
        padding: 2px 6px;
        background-color: #eee;
        border: 1px solid #ddd;
        border-radius: 3px;
        box-shadow: 0 1px 1px rgba(0,0,0,0.1);
        font-family: monospace;
        font-size: 0.9em;
      }
      
      /* Debug info styling */
      .debug-info {
        margin-top: 16px;
        font-size: 0.9rem;
      }
      
      .debug-toggle {
        color: #666;
        background: none;
        border: none;
        padding: 0;
        text-decoration: underline;
        cursor: pointer;
        font-size: 0.85rem;
      }
      
      .debug-content {
        margin-top: 8px;
        padding: 8px;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.85rem;
        white-space: pre-wrap;
      }
      
      /* Interaction hints */
      .interaction-hint {
        background-color: #fff8e6;
        border: 1px solid #ffe8a8;
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 12px;
        font-size: 0.9rem;
        text-align: center;
        color: #856404;
        animation: pulse 2s infinite;
        transition: opacity 0.5s ease;
      }
      
      .interaction-hint.fade-out {
        opacity: 0;
      }
      
      /* Pulse indicator */
      .pulse-indicator {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: var(--color-primary);
        margin-left: 8px;
        animation: pulse 2s infinite;
      }
      
      /* Welcome tooltip */
      .welcome-tooltip {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        z-index: 1000;
        overflow: hidden;
        transition: opacity 0.5s ease;
      }
      
      .welcome-tooltip.fade-out {
        opacity: 0;
      }
      
      .tooltip-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--color-primary);
        color: white;
      }
      
      .close-tooltip {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      
      .tooltip-content {
        padding: 16px;
      }
      
      .tooltip-content p {
        margin: 0 0 12px;
      }
      
      .tooltip-content ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .tooltip-content li {
        margin-bottom: 6px;
      }
      
      .got-it-button {
        display: block;
        width: 100%;
        padding: 8px;
        margin-top: 16px;
        background-color: var(--color-primary);
        color: white;
        border: none;
        border-radius: 4px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .got-it-button:hover {
        background-color: #1c74b3;
      }
      
      /* Touch specific enhancements */
      .touch-device .touch-target {
        padding: 12px !important;
        min-height: 44px;
        min-width: 44px;
      }
      
      .touch-device.scrolling-down .reference-header {
        transform: translateY(-100%);
        transition: transform 0.3s ease;
      }
      
      /* Animations */
      @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
      
      /* Print specific styles */
      @media print {
        .skip-link, .keyboard-shortcuts-hint, .print-button, 
        .copy-reference-button, .interaction-hint, .welcome-tooltip {
          display: none !important;
        }
        
        .sermon-group {
          page-break-inside: avoid;
          margin-bottom: 20px;
          border: 1px solid #ddd;
        }
        
        .occurrence-item {
          page-break-inside: avoid;
        }
        
        .video-link::after {
          content: " (" attr(href) ")";
          font-size: 0.8em;
          color: #666;
        }
      }
      
      /* Accessibility - reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .progress-bar, .welcome-tooltip, .interaction-hint,
        .pulse-indicator {
          transition: none !important;
          animation: none !important;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
  }
  
  // Add HCI styles on load
  document.addEventListener('DOMContentLoaded', addHCIStyles);
