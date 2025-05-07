/**
 * Bible Sources Panel Integration
 * This integrates the sources panel functionality from search.js into the Bible Reference Explorer
 */

const BibleSourcesPanel = (function() {
    // Configuration
    const config = {
      apiBaseUrl: 'https://sermon-search-api-8fok.onrender.com',
      youtubeBaseUrl: 'https://www.youtube.com/watch?v=',
      bibleGatewayBaseUrl: 'https://www.biblegateway.com/passage/?search=',
      bibleVersion: 'KJV'
    };
    
    // Cache for transcript data
    const transcriptCache = {};
    
    // DOM Elements - will be initialized in init function
    let elements = {};
    
    /**
     * Initialize the Sources Panel
     */
    function init() {
      // Get DOM elements
      elements = {
        sourcesPanel: document.getElementById('sourcesPanel'),
        sourcesPanelContent: document.getElementById('sourcesPanelContent'),
        closeSourcesButton: document.getElementById('closeSourcesPanel'),
        overlayContainer: document.getElementById('claude-overlay-container')
      };
      
      // Create backdrop for mobile sources panel
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
      
      // Setup event listeners
      if (elements.closeSourcesButton) {
        elements.closeSourcesButton.addEventListener('click', function() {
          toggleSourcesPanel(false);
        });
      }
      
      // Ensure overlay container exists
      ensureOverlayContainer();
      
      // Add touch swipe down to close Sources panel on mobile
      if (elements.sourcesPanel) {
        const scrollable = elements.sourcesPanelContent || elements.sourcesPanel;
        
        let touchStartY = 0;
        let touchMoveY = 0;
        let atTop = false;
        
        elements.sourcesPanel.addEventListener('touchstart', e => {
          touchStartY = e.touches[0].clientY;
          atTop = (scrollable.scrollTop === 0);
        }, { passive: true });
        
        elements.sourcesPanel.addEventListener('touchmove', e => {
          touchMoveY = e.touches[0].clientY;
          const deltaY = touchMoveY - touchStartY;
          
          // Intercept only when pulling down and already at top
          if (deltaY > 0 && atTop && window.innerWidth <= 768) {
            e.preventDefault();
            const translateY = Math.min(deltaY * 0.5, 100);
            elements.sourcesPanel.style.transform = `translateY(${translateY}px)`;
          }
        }, { passive: false });
        
        elements.sourcesPanel.addEventListener('touchend', () => {
          const deltaY = touchMoveY - touchStartY;
          
          // Close only if started at top and pulled far enough
          if (atTop && deltaY > 80 && window.innerWidth <= 768) {
            toggleSourcesPanel(false);
          }
          
          // Reset
          elements.sourcesPanel.style.transform = '';
          touchStartY = touchMoveY = 0;
          atTop = false;
        }, { passive: true });
      }
      
      // Add popstate listener for handling browser Back button with Sources panel
      window.addEventListener('popstate', () => {
        // If Sources panel is showing, close it
        if (elements.sourcesPanel?.classList.contains('active')) {
          toggleSourcesPanel(false, true);
        }
      });
    }
    
    /**
     * Toggle sources panel visibility
     */
    function toggleSourcesPanel(show, fromPopstate = false) {
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
        
        // Create a dummy history entry once per opening
        if (!fromPopstate) {
          history.pushState({ sourcesOpen: true }, '', '#sources');
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
        
        // If closing by any means other than Back,
        // quietly go one step back so the dummy entry disappears
        if (!fromPopstate && history.state?.sourcesOpen) {
          history.back();
          return;
        }
        
        // Update any active source toggle buttons
        document.querySelectorAll('.claude-sources-toggle[data-active="true"]').forEach(toggle => {
          toggle.setAttribute('data-active', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> Show Sources';
        });
      }
    }
    
    /**
     * Display sources in the panel
     */
    function displaySources(sources, reference) {
      if (!elements.sourcesPanelContent || !sources || !Array.isArray(sources)) return;
      
      // Clear previous sources
      elements.sourcesPanelContent.innerHTML = '';
      
      // Add title with source count
      const sourcesTitle = document.createElement('h3');
      sourcesTitle.textContent = `References to ${reference} (${sources.length})`;
      elements.sourcesPanelContent.appendChild(sourcesTitle);
      
      // Sort sources by similarity score if available
      const sortedSources = [...sources];
      if (sortedSources[0] && 'similarity' in sortedSources[0]) {
        sortedSources.sort((a, b) => b.similarity - a.similarity);
      }
      
      // Add sources to panel
      sortedSources.forEach((source, index) => {
        const sourceElement = createSourceElement(source, index);
        elements.sourcesPanelContent.appendChild(sourceElement);
        
        // Add staggered animation
        sourceElement.style.animationDelay = `${index * 50}ms`;
        sourceElement.classList.add('animating-in');
        
        // Remove animation class after animation completes
        setTimeout(() => {
          sourceElement.classList.remove('animating-in');
          sourceElement.style.animationDelay = '';
        }, 500 + (index * 50));
      });
      
      // Show sources panel
      toggleSourcesPanel(true);
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
      
      // Set similarity value if available, default to 100%
      const similarity = source.similarity ? Math.round(source.similarity * 100) : 100;
      
      // Format title and date for display
      const formattedTitle = formatTitle(source.sermon_title || source.title);
      let formattedDate = 'Date unknown';
      if (source.publish_date) {
        formattedDate = formatDate(source.publish_date);
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
      const text = source.context || source.text;
      const previewText = text && text.length > 100 ? 
        text.substring(0, 100) + '...' : 
        text;
      
      textPreview.innerHTML = `"${formatText(previewText)}"`;
      
      // Create "View full text" button that opens modal
      const viewFullButton = document.createElement('button');
      viewFullButton.className = 'claude-source-text-view-button';
      viewFullButton.textContent = 'View full text';
      viewFullButton.setAttribute('aria-haspopup', 'dialog');
      
      // Add click handler for the view full text button
      viewFullButton.addEventListener('click', function() {
        openSourceTextOverlay(text, formattedTitle);
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
      </svg> ${similarity}% match`;
      
      meta.appendChild(timestamp);
      meta.appendChild(match);
      
      // Create actions with improved accessibility and modal support
      const actions = document.createElement('div');
      actions.className = 'claude-source-actions';
      
      // Watch video button - opens modal overlay
      const watchButton = document.createElement('button');
      watchButton.className = 'claude-source-button claude-source-button-primary';
      watchButton.textContent = 'Watch Video';
      watchButton.setAttribute('aria-haspopup', 'dialog');
      
      watchButton.onclick = function() {
        openVideoOverlay(source.video_id, Math.floor(source.start_time), formattedTitle);
      };
      
      // Transcript button - opens modal overlay
      const transcriptButton = document.createElement('button');
      transcriptButton.className = 'claude-source-button';
      transcriptButton.textContent = 'View Transcript';
      transcriptButton.setAttribute('aria-haspopup', 'dialog');
      
      transcriptButton.onclick = function() {
        openTranscriptOverlay(source.video_id, source.start_time, formattedTitle);
      };
      
      // YouTube button - opens in new tab
      const youtubeButton = document.createElement('button');
      youtubeButton.className = 'claude-source-button';
      youtubeButton.textContent = 'Open in YouTube';
      youtubeButton.setAttribute('aria-label', 'Open video in YouTube at ' + formatTimestamp(source.start_time));
      
      youtubeButton.onclick = function() {
        window.open(`${config.youtubeBaseUrl}${source.video_id}&t=${Math.floor(source.start_time)}`, '_blank');
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
      body.innerHTML = `<div class="claude-transcript-loading">Loading transcript...</div>`;
      
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
        updateTranscriptOverlay(body, transcriptData, startTime, videoId);
      }).catch(error => {
        body.innerHTML = `<div class="claude-transcript-error">Error loading transcript: ${error.message}</div>`;
      });
    }
    
    /**
     * Fetch transcript data
     */
    async function fetchTranscript(videoId, startTime = 0) {
      // Check cache first
      if (transcriptCache[videoId]) {
        return transcriptCache[videoId];
      }
      
      try {
        const url = `${config.apiBaseUrl}/transcript/${videoId}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin
          },
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache the result
        transcriptCache[videoId] = data;
        
        return data;
      } catch (error) {
        console.error('Error fetching transcript:', error);
        throw error;
      }
    }
    
    /**
     * Update transcript overlay with data
     */
    function updateTranscriptOverlay(container, data, startTime, videoId) {
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
          <input type="text" class="claude-transcript-search-input" placeholder="Search in transcript..." aria-label="Search in transcript">
          <button class="claude-transcript-search-button" aria-label="Search">Search</button>
        </div>
      `;
      
      // Create transcript content area
      const transcriptElement = document.createElement('div');
      transcriptElement.className = 'claude-transcript';
      
      const transcriptContent = document.createElement('div');
      transcriptContent.className = 'claude-transcript-content';
      
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
            const vid = this.getAttribute('data-video-id');
            if (vid && time) {
              // Check if video overlay already exists
              const existingVideoOverlay = document.querySelector('.claude-video-overlay.active');
              if (existingVideoOverlay) {
                // Update existing video iframe with new timestamp
                const iframe = existingVideoOverlay.querySelector('iframe');
                if (iframe) {
                  iframe.src = `https://www.youtube.com/embed/${vid}?start=${Math.floor(time)}&autoplay=1`;
                }
              } else {
                // Open new video overlay
                openVideoOverlay(vid, Math.floor(time), '');
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
      downloadButton.textContent = 'Download Transcript';
      downloadButton.setAttribute('aria-label', 'Download Transcript');
      
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
            newHtml += escapeHTML(originalText.substring(lastIndex, match.index));
            
            // Add highlighted match
            newHtml += `<span class="search-highlight" style="background-color: #ffeb3b; font-weight: bold;">${match[0]}</span>`;
            
            // Update lastIndex
            lastIndex = regex.lastIndex;
          }
          
          // Add remaining text
          if (lastIndex < originalText.length) {
            newHtml += escapeHTML(originalText.substring(lastIndex));
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
          ? `${matchCount} matches found`
          : `No matches found`;
        
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
    
    // ======= UTILITY FUNCTIONS =======
    
    /**
     * Format text with Bible references highlighted
     */
    function formatText(text) {
      if (!text) return '';
      // First escape HTML
      text = escapeHTML(text);
      // Then highlight Bible references
      return text.replace(/\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi, '<span class="bible-reference">$&</span>');
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
     * Format timestamp to MM:SS
     */
    function formatTimestamp(seconds) {
      if (!seconds && seconds !== 0) return '00:00';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Format date for display
     */
    function formatDate(dateValue) {
      if (!dateValue) return 'Date unknown';
      
      try {
        // Handle YYYYMMDD format
        if (typeof dateValue === 'number' || /^\d{8}$/.test(dateValue)) {
          const dateStr = String(dateValue);
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          
          return new Date(year, month - 1, day).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        
        // Try to parse as date string
        return new Date(dateValue).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        return 'Date unknown';
      }
    }
    
    /**
     * Format sermon title
     */
    function formatTitle(title) {
      if (!title) return 'Unknown Sermon';
      return title.replace(/^["']|["']$/g, '');
    }
    
    // Return public API
    return {
      init,
      toggleSourcesPanel,
      displaySources,
      openVideoOverlay,
      openTranscriptOverlay,
      openSourceTextOverlay
    };
  })();
  
  // Initialize Sources Panel on page load
  document.addEventListener('DOMContentLoaded', function() {
    BibleSourcesPanel.init();
    
    // Connect Sources Panel to the Bible Explorer
    connectSourcesWithBibleExplorer();
  });
  
  /**
   * Connect the Sources Panel with Bible Explorer
   * This extends the BibleExplorer with sources panel functionality
   */
  function connectSourcesWithBibleExplorer() {
    // Wait for BibleExplorer to be initialized
    if (typeof BibleExplorer === 'undefined') {
      console.error('BibleExplorer not found. Make sure it is loaded before this script.');
      return;
    }
    
    // Override the original verse occurrence display to add a sources button
    const originalDisplayOccurrences = BibleExplorer.displayOccurrences;
    
    // If the original function exists, extend it
    if (typeof originalDisplayOccurrences === 'function') {
      BibleExplorer.displayOccurrences = function(occurrences) {
        // First call the original function to display the occurrences
        originalDisplayOccurrences.call(BibleExplorer, occurrences);
        
        // Then add the sources toggle button
        if (occurrences && occurrences.length > 0) {
          const verseView = document.getElementById('verse-view');
          if (verseView) {
            // Check if a toggle already exists
            if (!verseView.querySelector('.claude-sources-toggle')) {
              // Create sources toggle button
              const sourcesToggle = document.createElement('button');
              sourcesToggle.className = 'claude-sources-toggle';
              sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> Show Sources';
              sourcesToggle.setAttribute('data-active', 'false');
              sourcesToggle.setAttribute('aria-expanded', 'false');
              sourcesToggle.setAttribute('aria-controls', 'sourcesPanel');
              
              // Get the formatted reference for display
              const verseTitle = document.getElementById('verse-title');
              const reference = verseTitle ? verseTitle.textContent : '';
              
              // Add click handler
              sourcesToggle.addEventListener('click', function() {
                const isActive = this.getAttribute('data-active') === 'true';
                
                if (!isActive) {
                  // Display sources in the panel
                  BibleSourcesPanel.displaySources(occurrences, reference);
                } else {
                  // Close the panel
                  BibleSourcesPanel.toggleSourcesPanel(false);
                }
                
                // Update toggle state
                this.setAttribute('data-active', !isActive);
                this.setAttribute('aria-expanded', !isActive);
                this.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> Show Sources';
              });
              
              // Add button before the occurrences list
              const occurrencesList = verseView.querySelector('.verse-occurrences');
              if (occurrencesList) {
                verseView.insertBefore(sourcesToggle, occurrencesList);
              }
            }
          }
        }
      };
    }
    
    // Override the openVideoModal to use the sources panel's version
    if (typeof BibleExplorer.openVideoModal === 'function') {
      BibleExplorer.openVideoModal = function(videoId, timestamp, title) {
        BibleSourcesPanel.openVideoOverlay(videoId, timestamp, title);
      };
    }
    
    // Override the openTranscriptModal to use the sources panel's version
    if (typeof BibleExplorer.openTranscriptModal === 'function') {
      BibleExplorer.openTranscriptModal = function(videoId, timestamp, title) {
        BibleSourcesPanel.openTranscriptOverlay(videoId, timestamp, title);
      };
    }
    
    console.log('Connected Sources Panel with Bible Explorer');
  }
