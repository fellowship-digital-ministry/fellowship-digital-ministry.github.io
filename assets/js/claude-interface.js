/**
 * Enhanced Sources Panel Implementation
 * Based on library science and information retrieval principles
 */

// Function to set up the enhanced sources panel
function setupEnhancedSourcesPanel() {
  console.log('Setting up enhanced sources panel');
  
  // Add icon SVGs for the buttons
  const iconSVGs = {
    fullscreen: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>',
    video: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>',
    transcript: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    youtube: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    download: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'
  };
  
  // Replace the original createClaudeSourceElement function
  window.createClaudeSourceElement = function(source, index) {
    const sourceElement = document.createElement('div');
    sourceElement.className = 'claude-source-item';
    sourceElement.setAttribute('data-video-id', source.video_id);
    
    // Calculate relevance categories
    const similarity = Math.round(source.similarity * 100);
    let matchCategory = 'low';
    if (similarity >= 90) {
      matchCategory = 'high';
    } else if (similarity >= 75) {
      matchCategory = 'medium';
    }
    
    // Create video URL
    const videoUrl = `https://www.youtube.com/embed/${source.video_id}?start=${Math.floor(source.start_time)}`;
    
    // Format title and date
    const formattedTitle = formatSermonTitle(source.title);
    let formattedDate = 'Date unknown';
    if (source.publish_date) {
      formattedDate = formatSermonDate(source.publish_date);
    }
    
    // Create relevance indicator
    const relevanceIndicator = document.createElement('div');
    relevanceIndicator.className = 'claude-source-relevance';
    relevanceIndicator.setAttribute('data-match', matchCategory);
    sourceElement.appendChild(relevanceIndicator);
    
    // Create source header
    const header = document.createElement('div');
    header.className = 'claude-source-header';
    
    const headerLeft = document.createElement('div');
    headerLeft.className = 'claude-source-header-left';
    
    const title = document.createElement('div');
    title.className = 'claude-source-title';
    title.textContent = formattedTitle;
    
    const metadata = document.createElement('div');
    metadata.className = 'claude-source-metadata';
    
    const date = document.createElement('div');
    date.className = 'claude-source-date';
    date.textContent = formattedDate;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'claude-source-timestamp';
    timestamp.textContent = formatTimestamp(source.start_time);
    
    metadata.appendChild(date);
    metadata.appendChild(timestamp);
    
    headerLeft.appendChild(title);
    headerLeft.appendChild(metadata);
    
    const match = document.createElement('div');
    match.className = 'claude-source-match';
    match.setAttribute('data-match', matchCategory);
    match.textContent = `${similarity}% match`;
    
    header.appendChild(headerLeft);
    header.appendChild(match);
    
    // Create source content
    const content = document.createElement('div');
    content.className = 'claude-source-content';
    
    // Create text with expand functionality
    const textContainer = document.createElement('div');
    textContainer.className = 'claude-source-text';
    textContainer.innerHTML = formatText(source.text);
    
    // Add expand button if text is long
    const expandContainer = document.createElement('div');
    expandContainer.className = 'claude-source-expand';
    
    const expandButton = document.createElement('button');
    expandButton.className = 'claude-source-expand-button';
    expandButton.textContent = 'Show more';
    expandButton.addEventListener('click', function() {
      if (textContainer.classList.contains('expanded')) {
        textContainer.classList.remove('expanded');
        this.textContent = 'Show more';
        // Scroll back to top of text
        textContainer.scrollTop = 0;
      } else {
        textContainer.classList.add('expanded');
        this.textContent = 'Show less';
      }
    });
    
    expandContainer.appendChild(expandButton);
    
    // Create action buttons
    const actions = document.createElement('div');
    actions.className = 'claude-source-actions';
    
    // Create tabs system
    const tabs = document.createElement('div');
    tabs.className = 'claude-source-tabs';
    
    const videoTab = document.createElement('div');
    videoTab.className = 'claude-source-tab active';
    videoTab.setAttribute('data-tab', 'video');
    videoTab.textContent = 'Video';
    
    const transcriptTab = document.createElement('div');
    transcriptTab.className = 'claude-source-tab';
    transcriptTab.setAttribute('data-tab', 'transcript');
    transcriptTab.textContent = 'Transcript';
    
    tabs.appendChild(videoTab);
    tabs.appendChild(transcriptTab);
    
    // Create tab content containers
    const videoContent = document.createElement('div');
    videoContent.className = 'claude-source-tabcontent active';
    videoContent.setAttribute('data-tabcontent', 'video');
    
    const transcriptContent = document.createElement('div');
    transcriptContent.className = 'claude-source-tabcontent';
    transcriptContent.setAttribute('data-tabcontent', 'transcript');
    
    // Watch button
    const watchButton = document.createElement('button');
    watchButton.className = 'claude-source-button claude-source-button-primary';
    watchButton.innerHTML = `${iconSVGs.video} ${translate('watch-video')}`;
    watchButton.onclick = function() {
      if (videoContent.querySelector('.claude-video-container')) {
        // Video already exists, just show tab
        videoTab.click();
      } else {
        // Create video container
        const videoContainer = document.createElement('div');
        videoContainer.className = 'claude-video-container';
        videoContainer.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        videoContent.appendChild(videoContainer);
        
        // Switch to video tab
        videoTab.click();
      }
    };
    
    // Transcript button
    const transcriptButton = document.createElement('button');
    transcriptButton.className = 'claude-source-button';
    transcriptButton.innerHTML = `${iconSVGs.transcript} ${translate('view-transcript')}`;
    transcriptButton.onclick = function() {
      // Get video ID from parent element
      const videoId = this.closest('.claude-source-item').getAttribute('data-video-id');
      const startTime = source.start_time;
      
      if (transcriptContent.querySelector('.claude-transcript')) {
        // Transcript already exists, just show tab
        transcriptTab.click();
      } else {
        // Create transcript container with loading state
        const transcriptContainer = document.createElement('div');
        transcriptContainer.className = 'claude-transcript';
        transcriptContainer.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript')}</div>`;
        transcriptContent.appendChild(transcriptContainer);
        
        // Fetch transcript
        fetchTranscript(videoId, startTime).then(transcriptData => {
          // Update container with enhanced transcript UI
          createEnhancedTranscript(transcriptContainer, transcriptData, startTime, videoId);
        });
        
        // Switch to transcript tab
        transcriptTab.click();
      }
    };
    
    // YouTube button
    const youtubeButton = document.createElement('button');
    youtubeButton.className = 'claude-source-button';
    youtubeButton.innerHTML = `${iconSVGs.youtube} ${translate('open-youtube')}`;
    youtubeButton.onclick = function() {
      window.open(`https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}`, '_blank');
    };
    
    // Add tab switching functionality
    videoTab.addEventListener('click', function() {
      // Hide all tab content
      const tabContents = this.closest('.claude-source-item').querySelectorAll('.claude-source-tabcontent');
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Deactivate all tabs
      const tabs = this.closest('.claude-source-tabs').querySelectorAll('.claude-source-tab');
      tabs.forEach(tab => tab.classList.remove('active'));
      
      // Activate this tab and its content
      this.classList.add('active');
      videoContent.classList.add('active');
    });
    
    transcriptTab.addEventListener('click', function() {
      // Hide all tab content
      const tabContents = this.closest('.claude-source-item').querySelectorAll('.claude-source-tabcontent');
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Deactivate all tabs
      const tabs = this.closest('.claude-source-tabs').querySelectorAll('.claude-source-tab');
      tabs.forEach(tab => tab.classList.remove('active'));
      
      // Activate this tab and its content
      this.classList.add('active');
      transcriptContent.classList.add('active');
    });
    
    // Add action buttons
    actions.appendChild(watchButton);
    actions.appendChild(transcriptButton);
    actions.appendChild(youtubeButton);
    
    // Assemble content
    content.appendChild(textContainer);
    content.appendChild(expandContainer);
    content.appendChild(actions);
    content.appendChild(tabs);
    content.appendChild(videoContent);
    content.appendChild(transcriptContent);
    
    // Assemble source item
    sourceElement.appendChild(header);
    sourceElement.appendChild(content);
    
    // Check if we need to add expand button
    setTimeout(() => {
      if (textContainer.scrollHeight > textContainer.clientHeight) {
        expandContainer.style.display = 'block';
      } else {
        expandContainer.style.display = 'none';
      }
    }, 100);
    
    return sourceElement;
  };
  
  // Enhanced transcript display 
  function createEnhancedTranscript(container, data, startTime, videoId) {
    container.innerHTML = '';
    
    // Check if transcript data is valid
    if (!data || (!data.segments && !data.transcript)) {
      container.innerHTML = '<div class="claude-transcript-error">Transcript data not available</div>';
      return;
    }
    
    // Create transcript header
    const header = document.createElement('div');
    header.className = 'claude-transcript-header';
    
    const title = document.createElement('div');
    title.className = 'claude-transcript-title';
    title.textContent = 'Full Transcript';
    
    const controls = document.createElement('div');
    controls.className = 'claude-transcript-controls';
    
    const downloadButton = document.createElement('button');
    downloadButton.className = 'claude-transcript-control';
    downloadButton.innerHTML = iconSVGs.download;
    downloadButton.title = 'Download transcript';
    downloadButton.onclick = function() {
      if (typeof downloadTranscript === 'function') {
        downloadTranscript(videoId, data.segments);
      }
    };
    
    controls.appendChild(downloadButton);
    header.appendChild(title);
    header.appendChild(controls);
    
    // Create search functionality
    const search = document.createElement('div');
    search.className = 'claude-transcript-search';
    
    const searchInput = document.createElement('input');
    searchInput.className = 'claude-transcript-search-input';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search in transcript...';
    
    const searchButton = document.createElement('button');
    searchButton.className = 'claude-transcript-search-button';
    searchButton.innerHTML = iconSVGs.search;
    searchButton.onclick = function() {
      const query = searchInput.value.trim();
      if (query) {
        searchInTranscript(query, container);
      }
    };
    
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchButton.click();
      }
    });
    
    search.appendChild(searchInput);
    search.appendChild(searchButton);
    
    // Create transcript content container
    const content = document.createElement('div');
    content.className = 'claude-transcript-content';
    
    // If there's a note (like language unavailability), display it
    if (data.note) {
      const noteElement = document.createElement('div');
      noteElement.className = 'claude-transcript-note';
      noteElement.innerHTML = `<p><em>${data.note}</em></p>`;
      content.appendChild(noteElement);
    }
    
    // Process segmented transcript with timestamps
    if (data.segments && Array.isArray(data.segments)) {
      data.segments.forEach(segment => {
        // Skip gap segments
        if (segment.is_gap) {
          const gapElement = document.createElement('div');
          gapElement.className = 'claude-transcript-gap';
          gapElement.innerHTML = '[...]';
          content.appendChild(gapElement);
          return;
        }
        
        const segmentElement = document.createElement('div');
        segmentElement.className = 'claude-transcript-segment';
        
        // Highlight segments close to the start time
        if (Math.abs(segment.start_time - startTime) < 10) {
          segmentElement.classList.add('claude-transcript-highlight');
        }
        
        const timestampElement = document.createElement('div');
        timestampElement.className = 'claude-transcript-timestamp';
        timestampElement.textContent = formatTimestamp(segment.start_time);
        timestampElement.setAttribute('data-time', segment.start_time);
        timestampElement.setAttribute('title', 'Click to jump to this part of the sermon');
        
        // Add timestamp click handler to jump to that time in the video
        timestampElement.addEventListener('click', function() {
          const time = this.getAttribute('data-time');
          if (time) {
            // Find the video tab and click it
            const sourceItem = this.closest('.claude-source-item');
            if (sourceItem) {
              // Click the video tab
              const videoTab = sourceItem.querySelector('.claude-source-tab[data-tab="video"]');
              if (videoTab) {
                videoTab.click();
              }
              
              // Get the video container
              const videoContent = sourceItem.querySelector('.claude-source-tabcontent[data-tabcontent="video"]');
              
              // Check if video exists, if not create it
              let videoContainer = videoContent.querySelector('.claude-video-container');
              if (!videoContainer) {
                // Create video if it doesn't exist
                videoContainer = document.createElement('div');
                videoContainer.className = 'claude-video-container';
                videoContent.appendChild(videoContainer);
              }
              
              // Update iframe src to jump to timestamp
              videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?start=${Math.floor(time)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            }
          }
        });
        
        const textElement = document.createElement('div');
        textElement.className = 'claude-transcript-text';
        textElement.textContent = segment.text;
        
        segmentElement.appendChild(timestampElement);
        segmentElement.appendChild(textElement);
        content.appendChild(segmentElement);
      });
    } 
    else if (data.transcript) {
      // Handle plain text transcript
      container.innerHTML = data.transcript
        .split('\n\n')
        .map(para => `<p>${para}</p>`)
        .join('');
    } 
    else {
      container.innerHTML = '<div class="claude-transcript-error">Transcript format unknown</div>';
    }
    
    // Assemble all components
    container.appendChild(header);
    container.appendChild(search);
    container.appendChild(content);
    
    // Scroll to the highlighted segment
    setTimeout(() => {
      const highlight = container.querySelector('.claude-transcript-highlight');
      if (highlight) {
        highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
  
  // Function to search within a transcript
  function searchInTranscript(query, transcriptContainer) {
    if (!query || !transcriptContainer) return;
    
    // Get all segments
    const segments = transcriptContainer.querySelectorAll('.claude-transcript-segment');
    
    // Remove existing highlights
    transcriptContainer.querySelectorAll('.search-highlight').forEach(el => {
      el.outerHTML = el.textContent;
    });
    
    // Clear any existing count display
    const existingCount = transcriptContainer.querySelector('.search-count');
    if (existingCount) {
      existingCount.remove();
    }
    
    // Create regex for search
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    
    let matchCount = 0;
    let firstMatch = null;
    
    // Search each segment
    segments.forEach(segment => {
      const textElement = segment.querySelector('.claude-transcript-text');
      const text = textElement.textContent;
      
      if (regex.test(text)) {
        // Reset regex lastIndex
        regex.lastIndex = 0;
        
        // Replace text with highlighted version
        textElement.innerHTML = text.replace(regex, match => {
          matchCount++;
          return `<span class="search-highlight">${match}</span>`;
        });
        
        // Store first match element
        if (!firstMatch) {
          firstMatch = segment.querySelector('.search-highlight');
        }
      }
    });
    
    // Create count display
    const countElement = document.createElement('div');
    countElement.className = 'search-count';
    countElement.style.padding = '0.5rem 1rem';
    countElement.style.backgroundColor = '#f8f9fa';
    countElement.style.borderBottom = '1px solid #eee';
    countElement.style.fontSize = '0.9rem';
    
    if (matchCount > 0) {
      countElement.textContent = `Found ${matchCount} matches`;
      countElement.style.color = '#2e7d32';
    } else {
      countElement.textContent = 'No matches found';
      countElement.style.color = '#c62828';
    }
    
    // Insert after search
    const searchElement = transcriptContainer.querySelector('.claude-transcript-search');
    if (searchElement) {
      searchElement.parentNode.insertBefore(countElement, searchElement.nextSibling);
    }
    
    // Scroll to first match
    if (firstMatch) {
      firstMatch.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
    
    // Add highlight styling
    const style = document.createElement('style');
    style.textContent = `
      .search-highlight {
        background-color: rgba(255, 213, 79, 0.4);
        border-radius: 2px;
        padding: 0 2px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Override the original displayAnswer function to use enhanced sources panel
  const originalDisplayAnswer = window.displayAnswer;
  window.displayAnswer = function(data) {
    if (!data || !data.answer) {
      console.error('Invalid data received from API');
      addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
      return;
    }
    
    // Check if there are any sermon sources
    const hasSermonContent = data.sources && data.sources.length > 0;
    
    // If no sermon content but we have conversation history, use the original logic
    if (!hasSermonContent && data.answer.includes(translate('no-results')) && conversationHistory.length > 0) {
      if (originalDisplayAnswer) {
        return originalDisplayAnswer(data);
      }
      return;
    }
    
    // Add the answer message
    const messageElement = addMessage(data.answer, 'bot');
    
    // Display sources in the enhanced side panel if available
    if (hasSermonContent) {
      try {
        // Get references to panels
        const sourcesPanel = document.getElementById('sourcesPanel');
        const sourcesPanelContent = document.getElementById('sourcesPanelContent');
        
        // Clear previous sources
        sourcesPanelContent.innerHTML = '';
        
        // Add enhanced header with filters
        const sourcesHeader = document.createElement('div');
        sourcesHeader.className = 'claude-sources-header';
        
        const sourcesTitle = document.createElement('div');
        sourcesTitle.className = 'claude-sources-title';
        sourcesTitle.innerHTML = `Sources <span class="claude-sources-count">${data.sources.length}</span>`;
        
        const sourcesActions = document.createElement('div');
        sourcesActions.className = 'claude-sources-actions';
        
        // Add fullscreen button
        const fullscreenButton = document.createElement('button');
        fullscreenButton.className = 'claude-sources-action';
        fullscreenButton.title = 'Fullscreen';
        fullscreenButton.innerHTML = iconSVGs.fullscreen;
        fullscreenButton.addEventListener('click', function() {
          sourcesPanel.classList.add('fullscreen');
          
          // Add fullscreen toolbar
          if (!sourcesPanel.querySelector('.claude-sources-fullscreen-toolbar')) {
            const toolbar = document.createElement('div');
            toolbar.className = 'claude-sources-fullscreen-toolbar';
            
            const toolbarTitle = document.createElement('div');
            toolbarTitle.className = 'claude-fullscreen-title';
            toolbarTitle.textContent = 'Source Material';
            
            const toolbarActions = document.createElement('div');
            toolbarActions.className = 'claude-fullscreen-actions';
            
            const exitButton = document.createElement('button');
            exitButton.className = 'claude-fullscreen-action claude-fullscreen-exit';
            exitButton.innerHTML = `${iconSVGs.close} Exit Fullscreen`;
            exitButton.addEventListener('click', function() {
              sourcesPanel.classList.remove('fullscreen');
            });
            
            toolbarActions.appendChild(exitButton);
            toolbar.appendChild(toolbarTitle);
            toolbar.appendChild(toolbarActions);
            
            sourcesPanel.appendChild(toolbar);
          }
        });
        
        sourcesActions.appendChild(fullscreenButton);
        sourcesHeader.appendChild(sourcesTitle);
        sourcesHeader.appendChild(sourcesActions);
        
        // Add filters section
        const sourcesFilters = document.createElement('div');
        sourcesFilters.className = 'claude-sources-filters';
        
        const relevanceLabel = document.createElement('div');
        relevanceLabel.className = 'claude-sources-filter-label';
        relevanceLabel.textContent = 'Sort by:';
        
        const relevanceOptions = document.createElement('div');
        relevanceOptions.className = 'claude-sources-filter-options';
        
        const relevanceOption = document.createElement('div');
        relevanceOption.className = 'claude-sources-filter-option active';
        relevanceOption.textContent = 'Relevance';
        relevanceOption.setAttribute('data-sort', 'relevance');
        
        const dateOption = document.createElement('div');
        dateOption.className = 'claude-sources-filter-option';
        dateOption.textContent = 'Date';
        dateOption.setAttribute('data-sort', 'date');
        
        relevanceOptions.appendChild(relevanceOption);
        relevanceOptions.appendChild(dateOption);
        
        sourcesFilters.appendChild(relevanceLabel);
        sourcesFilters.appendChild(relevanceOptions);
        
        // Add sorting functionality
        relevanceOption.addEventListener('click', function() {
          if (!this.classList.contains('active')) {
            // Remove active from other options
            relevanceOptions.querySelectorAll('.claude-sources-filter-option').forEach(opt => {
              opt.classList.remove('active');
            });
            
            // Mark this as active
            this.classList.add('active');
            
            // Sort by relevance
            sortSourcesByRelevance();
          }
        });
        
        dateOption.addEventListener('click', function() {
          if (!this.classList.contains('active')) {
            // Remove active from other options
            relevanceOptions.querySelectorAll('.claude-sources-filter-option').forEach(opt => {
              opt.classList.remove('active');
            });
            
            // Mark this as active
            this.classList.add('active');
            
            // Sort by date
            sortSourcesByDate();
          }
        });
        
        // Function to sort sources by relevance
        function sortSourcesByRelevance() {
          const sourceItems = Array.from(sourcesPanelContent.querySelectorAll('.claude-source-item'));
          
          // Sort by data-match attribute
          sourceItems.sort((a, b) => {
            const aMatch = a.querySelector('.claude-source-match').getAttribute('data-match');
            const bMatch = b.querySelector('.claude-source-match').getAttribute('data-match');
            
            // Convert match categories to numeric values
            const matchValues = { 'high': 3, 'medium': 2, 'low': 1 };
            
            return matchValues[bMatch] - matchValues[aMatch];
          });
          
          // Re-append in new order
          sourceItems.forEach(item => {
            sourcesPanelContent.appendChild(item);
          });
        }
        
        // Function to sort sources by date
        function sortSourcesByDate() {
          const sourceItems = Array.from(sourcesPanelContent.querySelectorAll('.claude-source-item'));
          
          // Sort by date text
          sourceItems.sort((a, b) => {
            const aDate = a.querySelector('.claude-source-date').textContent;
            const bDate = b.querySelector('.claude-source-date').textContent;
            
            // Try to parse dates
            let aTimestamp, bTimestamp;
            
            try {
              aTimestamp = new Date(aDate).getTime();
            } catch (e) {
              aTimestamp = 0;
            }
            
            try {
              bTimestamp = new Date(bDate).getTime();
            } catch (e) {
              bTimestamp = 0;
            }
            
            // If both dates are valid, sort by timestamp
            if (!isNaN(aTimestamp) && !isNaN(bTimestamp)) {
              return bTimestamp - aTimestamp; // Newer first
            }
            
            // Fallback to string comparison
            return bDate.localeCompare(aDate);
          });
          
          // Re-append in new order
          sourceItems.forEach(item => {
            sourcesPanelContent.appendChild(item);
          });
        }
        
        // Add sources container
        const sourcesContainer = document.createElement('div');
        sourcesContainer.className = 'claude-sources-container';
        
        // Sort sources by similarity score
        const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
        
        // Add sources to panel
        sortedSources.forEach((source, index) => {
          const sourceElement = createClaudeSourceElement(source, index);
          sourcesContainer.appendChild(sourceElement);
        });
        
        // Assemble the panel content
        sourcesPanelContent.appendChild(sourcesHeader);
        sourcesPanelContent.appendChild(sourcesFilters);
        sourcesPanelContent.appendChild(sourcesContainer);
        
        // Auto-open sources panel
        sourcesPanel.classList.add('active');
        
        // Update any sources toggle in the message
        const sourcesToggle = messageElement.querySelector('.claude-sources-toggle');
        if (sourcesToggle) {
          sourcesToggle.setAttribute('data-active', 'true');
          sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> Hide Sources';
          
          // Make sure toggle shows/hides panel
          sourcesToggle.addEventListener('click', function() {
            const isActive = this.getAttribute('data-active') === 'true';
            
            if (isActive) {
              sourcesPanel.classList.remove('active');
              this.setAttribute('data-active', 'false');
              this.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> View Sources';
            } else {
              sourcesPanel.classList.add('active');
              this.setAttribute('data-active', 'true');
              this.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> Hide Sources';
            }
          });
        }
        
        // Add to conversation history
        conversationHistory.push({ role: 'assistant', content: data.answer });
        
      } catch (error) {
        console.error('Error displaying sources:', error);
        
        // Continue without displaying sources
        conversationHistory.push({ role: 'assistant', content: data.answer });
      }
    } else {
      // Add to conversation history
      conversationHistory.push({ role: 'assistant', content: data.answer });
    }
  };
}

// Call this function during initialization
document.addEventListener('DOMContentLoaded', function() {
  // Ensure we add this to the init stack if using the Claude interface
  if (typeof initClaudeInterface === 'function') {
    const originalInit = initClaudeInterface;
    
    window.initClaudeInterface = function() {
      // Call the original initialization
      originalInit();
      
      // Add our enhanced sources functionality
      setupEnhancedSourcesPanel();
    };
  } else {
    // If Claude interface isn't available, add directly
    setupEnhancedSourcesPanel();
  }
});