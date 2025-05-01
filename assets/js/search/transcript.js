/**
 * transcript.js
 * Handles transcript functionality
 */

/**
 * Toggle transcript visibility and load if needed
 * @param {string} videoId - YouTube video ID
 * @param {number} startTime - Start time in seconds
 */
async function toggleTranscript(videoId, startTime = 0) {
    try {
      if (!videoId) {
        console.error('Invalid videoId for toggleTranscript');
        return;
      }
      
      const transcriptContainer = document.getElementById(`transcript-${videoId}`);
      const button = document.querySelector(`.view-transcript-btn[onclick*="toggleTranscript('${videoId}')"]`);
      
      if (!transcriptContainer) {
        // Transcript hasn't been loaded yet, fetch it
        await loadTranscript(videoId, startTime);
        // Update button text if found
        if (button) {
          button.textContent = I18n.translate('hide-transcript');
        }
        return;
      }
      
      // Toggle visibility
      const isHidden = transcriptContainer.style.display === 'none';
      transcriptContainer.style.display = isHidden ? 'block' : 'none';
      
      // Update button text
      if (button) {
        const hideText = I18n.translate('hide-transcript');
        const showText = I18n.translate('view-transcript');
        button.textContent = isHidden ? hideText : showText;
      }
      
      // Scroll into view if showing
      if (isHidden) {
        setTimeout(() => {
          transcriptContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    } catch (error) {
      console.error('Error in toggleTranscript:', error);
    }
  }
  
  /**
   * Load and display a sermon transcript
   * @param {string} videoId - YouTube video ID
   * @param {number} startTime - Start time in seconds
   */
  async function loadTranscript(videoId, startTime = 0) {
    try {
      // Find or create the transcript container for this source
      let transcriptContainer = document.getElementById(`transcript-${videoId}`);
      
      if (!transcriptContainer) {
        // If no container exists yet, create one
        transcriptContainer = document.createElement('div');
        transcriptContainer.id = `transcript-${videoId}`;
        transcriptContainer.className = 'transcript-container';
        transcriptContainer.style.display = 'block';
        
        // Find the source container to append to
        const sourceContainer = document.querySelector(`.source-container[data-video-id="${videoId}"]`);
        if (sourceContainer) {
          sourceContainer.appendChild(transcriptContainer);
        } else {
          console.error('Could not find source container for video ID:', videoId);
          return;
        }
      }
      
      // Show loading state
      const loadingElement = document.createElement('div');
      loadingElement.className = 'transcript-loading';
      loadingElement.textContent = I18n.translate('loading-transcript');
      
      // Clear and show loading
      transcriptContainer.innerHTML = '';
      transcriptContainer.appendChild(loadingElement);
      
      console.log(`Fetching transcript for video ${videoId} with language ${I18n.currentLanguage}`);
      
      // Fetch the transcript from the API
      const data = await API.fetchTranscript(videoId, startTime);
      
      // Remove loading element
      loadingElement.remove();
      
      // Create transcript content
      const transcriptContent = document.createElement('div');
      transcriptContent.className = 'transcript-content';
      
      // If there's a note (like language unavailability), display it
      if (data.note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'transcript-note';
        noteElement.innerHTML = `<p><em>${data.note}</em></p>`;
        transcriptContainer.appendChild(noteElement);
      }
      
      // Add search functionality
      const searchContainer = document.createElement('div');
      searchContainer.className = 'transcript-search';
      searchContainer.innerHTML = `
        <input type="text" placeholder="Search in transcript..." class="transcript-search-input">
        <button class="transcript-search-button">Search</button>
      `;
      
      // Add event listeners for search
      const searchInput = searchContainer.querySelector('.transcript-search-input');
      const searchButton = searchContainer.querySelector('.transcript-search-button');
      
      searchButton.addEventListener('click', () => {
        searchTranscript(searchInput.value, transcriptContent);
      });
      
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          searchTranscript(searchInput.value, transcriptContent);
        }
      });
      
      // Add download transcript option
      const downloadButton = document.createElement('button');
      downloadButton.className = 'transcript-download-button';
      downloadButton.textContent = 'Download Transcript';
      downloadButton.addEventListener('click', () => {
        downloadTranscript(videoId, data.segments);
      });
      searchContainer.appendChild(downloadButton);
      
      // If the API returns segments with timestamps
      if (data.segments && Array.isArray(data.segments)) {
        // Add transcript info
        const infoElement = document.createElement('div');
        infoElement.className = 'transcript-info';
        infoElement.innerHTML = `<p>Full transcript (${data.total_segments} segments)</p>`;
        transcriptContainer.appendChild(infoElement);
        
        // Handle segmented transcript with timestamps
        data.segments.forEach(segment => {
          const segmentElement = document.createElement('div');
          
          // Check if this is a gap segment
          if (segment.is_gap) {
            segmentElement.className = 'transcript-gap';
            segmentElement.innerHTML = '<span class="transcript-gap-indicator">[...]</span>';
            transcriptContent.appendChild(segmentElement);
            return;
          }
          
          segmentElement.className = 'transcript-segment';
          
          const timestampElement = document.createElement('span');
          timestampElement.className = 'transcript-timestamp';
          timestampElement.textContent = Utils.formatTimestamp(segment.start_time);
          
          const textElement = document.createElement('span');
          textElement.className = 'transcript-text';
          textElement.textContent = segment.text;
          
          // Apply highlighting to this segment if it contains our search terms
          segmentElement.setAttribute('data-time', segment.start_time);
          
          // Highlight the segment closest to our start time
          if (Math.abs(segment.start_time - startTime) < 10) {
            segmentElement.classList.add('transcript-highlight-segment');
          }
          
          segmentElement.appendChild(timestampElement);
          segmentElement.appendChild(textElement);
          transcriptContent.appendChild(segmentElement);
        });
      } else if (data.transcript) {
        // Handle plain text transcript (fallback)
        transcriptContent.innerHTML = data.transcript
          .split('\n\n') // Split paragraphs
          .map(para => `<p>${para}</p>`)
          .join('');
      } else {
        // Fallback for unexpected format
        transcriptContent.innerHTML = '<p>Transcript is available but in an unexpected format. Please try again later.</p>';
      }
      
      // Add timestamp navigation helper
      const timestampHelper = document.createElement('div');
      timestampHelper.className = 'transcript-timestamp-helper';
      timestampHelper.innerHTML = `
        <small>Click on timestamps to jump to that part of the sermon</small>
      `;
      
      // Add content to container
      transcriptContainer.appendChild(searchContainer);
      transcriptContainer.appendChild(timestampHelper);
      transcriptContainer.appendChild(transcriptContent);
      
      // Add timestamp click handling
      setupTimestampClickHandlers(transcriptContainer);
      
      // Scroll to highlighted segment if it exists
      const highlightedSegment = transcriptContainer.querySelector('.transcript-highlight-segment');
      if (highlightedSegment) {
        setTimeout(() => {
          highlightedSegment.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      
    } catch (error) {
      console.error('Error fetching transcript:', error);
      
      // Show error in container
      const errorElement = document.createElement('div');
      errorElement.className = 'transcript-error';
      errorElement.textContent = `Could not load transcript: ${error.message}`;
      
      // Find the transcript container
      let transcriptContainer = document.getElementById(`transcript-${videoId}`);
      
      if (!transcriptContainer) {
        // If no container exists yet, create one
        transcriptContainer = document.createElement('div');
        transcriptContainer.id = `transcript-${videoId}`;
        transcriptContainer.className = 'transcript-container';
        
        // Find the source container to append to
        const sourceContainer = document.querySelector(`.source-container[data-video-id="${videoId}"]`);
        if (sourceContainer) {
          sourceContainer.appendChild(transcriptContainer);
        } else {
          console.error('Could not find source container for video ID:', videoId);
          return;
        }
      }
      
      transcriptContainer.innerHTML = '';
      transcriptContainer.appendChild(errorElement);
      
      // Add retry button
      const retryButton = document.createElement('button');
      retryButton.className = 'retry-button';
      retryButton.textContent = I18n.translate('retry');
      retryButton.onclick = () => loadTranscript(videoId, startTime);
      transcriptContainer.appendChild(retryButton);
    }
  }
  
  /**
   * Setup click handlers for transcript timestamps
   * @param {HTMLElement} transcriptContainer 
   */
  function setupTimestampClickHandlers(transcriptContainer) {
    const timestamps = transcriptContainer.querySelectorAll('.transcript-timestamp');
    timestamps.forEach(timestamp => {
      timestamp.style.cursor = 'pointer';
      timestamp.setAttribute('title', 'Click to jump to this part of the sermon');
      
      timestamp.addEventListener('click', function() {
        const segment = this.closest('.transcript-segment');
        if (segment) {
          const time = segment.getAttribute('data-time');
          if (time) {
            // Find the YouTube embed and update its time
            const sourceContainer = transcriptContainer.closest('.source-container');
            if (sourceContainer) {
              // Make sure video is visible
              const videoEmbed = sourceContainer.querySelector('.video-embed');
              const watchButton = sourceContainer.querySelector('.watch-video-btn');
              
              if (videoEmbed && videoEmbed.style.display === 'none') {
                // Show the video if it's hidden
                videoEmbed.style.display = 'block';
                if (watchButton) {
                  watchButton.textContent = I18n.translate('hide-video');
                }
              }
              
              // Update iframe src to jump to timestamp
              const iframe = sourceContainer.querySelector('iframe');
              if (iframe) {
                const currentSrc = iframe.src;
                const baseUrl = currentSrc.split('?')[0];
                iframe.src = `${baseUrl}?start=${Math.floor(time)}`;
                
                // Scroll to make video visible
                videoEmbed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }
          }
        }
      });
    });
  }
  
  /**
   * Search within a transcript and highlight matches
   * @param {string} query - The search query
   * @param {HTMLElement} transcriptContent - The transcript content element
   */
  function searchTranscript(query, transcriptContent) {
    if (!query || !transcriptContent) return;
    
    // Remove existing highlights
    const existingHighlights = transcriptContent.querySelectorAll('.transcript-highlight');
    existingHighlights.forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      // Normalize to combine adjacent text nodes
      parent.normalize();
    });
    
    if (!query.trim()) return;
    
    // Function to highlight matches in a text node
    function highlightMatches(textNode, regex) {
      const parent = textNode.parentNode;
      const content = textNode.textContent;
      
      let match;
      let lastIndex = 0;
      let hasMatches = false;
      
      // Create a document fragment to hold the new content
      const fragment = document.createDocumentFragment();
      
      // Find all matches in this text node
      while ((match = regex.exec(content)) !== null) {
        hasMatches = true;
        
        // Add the text up to this match
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(
            content.substring(lastIndex, match.index)
          ));
        }
        
        // Create a highlight span for the match
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'transcript-highlight';
        highlightSpan.textContent = match[0];
        fragment.appendChild(highlightSpan);
        
        // Update lastIndex
        lastIndex = regex.lastIndex;
      }
      
      // Add any remaining text
      if (lastIndex < content.length) {
        fragment.appendChild(document.createTextNode(
          content.substring(lastIndex)
        ));
      }
      
      // Only replace if we found matches
      if (hasMatches) {
        parent.replaceChild(fragment, textNode);
        return true;
      }
      
      return false;
    }
    
    // Create a case-insensitive regex for the search term
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    
    // Process all text nodes in the transcript
    const walker = document.createTreeWalker(
      transcriptContent,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    let matchCount = 0;
    
    while (node = walker.nextNode()) {
      if (highlightMatches(node, regex)) {
        matchCount++;
      }
    }
    
    // Scroll to first highlight if any found
    const firstHighlight = transcriptContent.querySelector('.transcript-highlight');
    if (firstHighlight) {
      firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Show match count
    const matchCountElement = document.createElement('div');
    matchCountElement.className = 'transcript-match-count';
    matchCountElement.textContent = matchCount > 0 
      ? `Found ${matchCount} matches` 
      : 'No matches found';
    
    // Replace existing count or add new one
    const existingCount = transcriptContent.parentNode.querySelector('.transcript-match-count');
    if (existingCount) {
      existingCount.replaceWith(matchCountElement);
    } else {
      transcriptContent.parentNode.insertBefore(matchCountElement, transcriptContent);
    }
  }
  
  /**
   * Download transcript as a text file with proper sermon title
   * @param {string} videoId - YouTube video ID
   * @param {Array} segments - Transcript segments
   */
  function downloadTranscript(videoId, segments) {
    if (!segments || !segments.length) return;
    
    // Try to find the sermon title
    const sourceContainer = document.querySelector(`.source-container[data-video-id="${videoId}"]`);
    let sermonTitle = "Unknown Sermon";
    
    if (sourceContainer) {
      const titleElement = sourceContainer.querySelector('.source-title');
      if (titleElement) {
        sermonTitle = titleElement.textContent.trim();
      }
    }
    
    // Create the text content with proper title
    let textContent = `${sermonTitle} (ID: ${videoId})\n\n`;
    
    segments.forEach(segment => {
      if (segment.is_gap) {
        textContent += '[...]\n\n';
      } else {
        textContent += `[${Utils.formatTimestamp(segment.start_time)}] ${segment.text}\n\n`;
      }
    });
    
    // Create a blob with the text content
    const blob = new Blob([textContent], { type: 'text/plain' });
    
    // Create an object URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sermonTitle.replace(/[^\w\s-]/g, '')}-transcript.txt`;
    
    // Append the link to the body, click it, and then remove it
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  // Export Transcript module
  const Transcript = {
    toggleTranscript,
    loadTranscript,
    searchTranscript,
    downloadTranscript
  };
  
  // Expose toggleTranscript globally for onclick handlers
  window.toggleTranscript = toggleTranscript;