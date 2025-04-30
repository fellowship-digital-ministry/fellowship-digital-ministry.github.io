/**
 * Claude-Style Interface for Sermon Search
 * This script adds Claude-like UI behavior while preserving all backend functionality
 * Add this after your main script
 */

document.addEventListener('DOMContentLoaded', function() {
  initClaudeInterface();
});

function initClaudeInterface() {
  console.log('Initializing Claude-style interface');
  
  // Elements
  const queryInput = document.getElementById('queryInput');
  const sourcesPanel = document.getElementById('sourcesPanel');
  const sourcesPanelContent = document.getElementById('sourcesPanelContent');
  const closeSourcesButton = document.getElementById('closeSourcesPanel');
  
  // Auto-resize textarea
  if (queryInput) {
    queryInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
    
    // Enter to submit, Shift+Enter for new line
    queryInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('chatForm').dispatchEvent(new Event('submit'));
      }
    });
  }
  
  // Close sources panel
  if (closeSourcesButton) {
    closeSourcesButton.addEventListener('click', function() {
      sourcesPanel.classList.remove('active');
    });
  }
  
  // Override the original addMessage function to use Claude-style layout
  window.originalAddMessage = window.addMessage;
  window.addMessage = function(text, sender, isError = false) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `claude-message claude-message-${sender}`;
    messageElement.id = 'msg-' + Date.now();
    
    const messageContent = document.createElement('div');
    messageContent.className = 'claude-message-content';
    
    if (isError) {
      messageContent.classList.add('error');
    }
    
    // For bot messages, apply formatting
    if (sender === 'bot') {
      if (text.startsWith('<div class="welcome-message">')) {
        // Convert old welcome message format to new Claude-style
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
          const sourcesToggle = document.createElement('div');
          sourcesToggle.className = 'claude-sources-toggle';
          sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> View Sources';
          sourcesToggle.setAttribute('data-active', 'false');
          
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
          
          messageContent.appendChild(sourcesToggle);
        }
      }
      
      // Make Bible references clickable
      setupBibleReferenceClicks(messageContent);
      
    } else {
      // For user messages, use text content
      messageContent.textContent = text;
    }
    
    messageElement.appendChild(messageContent);
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageElement;
  };
  
  // Override the typing indicator
  window.addTypingIndicator = function() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'claude-typing';
    typingElement.id = 'typing-' + Date.now();
    
    typingElement.innerHTML = `
      <div class="claude-typing-bubble"></div>
      <div class="claude-typing-bubble"></div>
      <div class="claude-typing-bubble"></div>
    `;
    
    messagesContainer.appendChild(typingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return typingElement.id;
  };
  
  // Override displayAnswer to put sources in the side panel
  window.originalDisplayAnswer = window.displayAnswer;
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
        
        // Add title
        const sourcesTitle = document.createElement('h3');
        sourcesTitle.textContent = 'Sources';
        sourcesPanelContent.appendChild(sourcesTitle);
        
        // Sort sources by similarity score
        const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
        
        // Add sources to panel
        sortedSources.forEach((source, index) => {
          const sourceElement = createClaudeSourceElement(source, index);
          sourcesPanelContent.appendChild(sourceElement);
        });
        
        // Auto-open sources panel for first message
        if (conversationHistory.length <= 2) {
          setTimeout(() => {
            sourcesPanel.classList.add('active');
            const sourcesToggle = messageElement.querySelector('.claude-sources-toggle');
            if (sourcesToggle) {
              sourcesToggle.setAttribute('data-active', 'true');
              sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> Hide Sources';
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
  };
  
  // Create Claude-style welcome message
  function createClaudeWelcomeMessage() {
    const welcomeContainer = document.createElement('div');
    welcomeContainer.className = 'claude-welcome';
    
    const title = document.createElement('h4');
    title.textContent = translate('welcome-title');
    
    const description = document.createElement('p');
    description.textContent = translate('welcome-intro');
    
    const suggestionLabel = document.createElement('p');
    suggestionLabel.className = 'claude-suggestion-label';
    suggestionLabel.textContent = translate('suggestion-heading');
    
    const suggestions = document.createElement('div');
    suggestions.className = 'claude-suggestions';
    
    // Add suggestion chips
    getTranslatedQueries().forEach(query => {
      const chip = document.createElement('div');
      chip.className = 'claude-suggestion';
      chip.textContent = query;
      chip.addEventListener('click', function() {
        document.getElementById('queryInput').value = query;
        document.getElementById('chatForm').dispatchEvent(new Event('submit'));
      });
      suggestions.appendChild(chip);
    });
    
    welcomeContainer.appendChild(title);
    welcomeContainer.appendChild(description);
    welcomeContainer.appendChild(suggestionLabel);
    welcomeContainer.appendChild(suggestions);
    
    return welcomeContainer;
  }
  
  // Create a Claude-style source element
  function createClaudeSourceElement(source, index) {
    const sourceElement = document.createElement('div');
    sourceElement.className = 'claude-source-item';
    sourceElement.setAttribute('data-video-id', source.video_id);
    
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
    
    const text = document.createElement('div');
    text.className = 'claude-source-text';
    text.innerHTML = `"${formatText(source.text)}"`;
    
    const meta = document.createElement('div');
    meta.className = 'claude-source-meta';
    
    const timestamp = document.createElement('div');
    timestamp.className = 'claude-source-timestamp';
    timestamp.textContent = `Timestamp: ${formatTimestamp(source.start_time)}`;
    
    const match = document.createElement('div');
    match.className = 'claude-source-match';
    match.textContent = `${similarity}% match`;
    
    meta.appendChild(timestamp);
    meta.appendChild(match);
    
    // Create actions
    const actions = document.createElement('div');
    actions.className = 'claude-source-actions';
    
    const watchButton = document.createElement('button');
    watchButton.className = 'claude-source-button claude-source-button-primary';
    watchButton.textContent = translate('watch-video');
    watchButton.onclick = function() {
      const videoContainer = this.parentElement.parentElement.querySelector('.claude-video-container');
      if (!videoContainer) {
        // Create video container if it doesn't exist
        const container = document.createElement('div');
        container.className = 'claude-video-container';
        container.innerHTML = `<iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        content.appendChild(container);
        this.textContent = translate('hide-video');
      } else {
        // Toggle visibility
        if (videoContainer.style.display === 'none') {
          videoContainer.style.display = 'block';
          this.textContent = translate('hide-video');
        } else {
          videoContainer.style.display = 'none';
          this.textContent = translate('watch-video');
        }
      }
    };
    
    const transcriptButton = document.createElement('button');
    transcriptButton.className = 'claude-source-button';
    transcriptButton.textContent = translate('view-transcript');
    transcriptButton.onclick = function() {
      // Get video ID from parent element
      const videoId = this.closest('.claude-source-item').getAttribute('data-video-id');
      const startTime = source.start_time;
      
      // Look for existing transcript
      const transcriptContainer = this.parentElement.parentElement.querySelector('.claude-transcript');
      if (!transcriptContainer) {
        // Create transcript container if it doesn't exist
        const container = document.createElement('div');
        container.className = 'claude-transcript';
        container.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript')}</div>`;
        content.appendChild(container);
        
        // Fetch transcript
        fetchTranscript(videoId, startTime).then(transcriptData => {
          // Update container with transcript content
          updateClaudeTranscript(container, transcriptData, startTime);
        });
        
        this.textContent = translate('hide-transcript');
      } else {
        // Toggle visibility
        if (transcriptContainer.style.display === 'none') {
          transcriptContainer.style.display = 'block';
          this.textContent = translate('hide-transcript');
        } else {
          transcriptContainer.style.display = 'none';
          this.textContent = translate('view-transcript');
        }
      }
    };
    
    const youtubeButton = document.createElement('button');
    youtubeButton.className = 'claude-source-button';
    youtubeButton.textContent = translate('open-youtube');
    youtubeButton.onclick = function() {
      window.open(`https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}`, '_blank');
    };
    
    actions.appendChild(watchButton);
    actions.appendChild(transcriptButton);
    actions.appendChild(youtubeButton);
    
    // Assemble all components
    content.appendChild(text);
    content.appendChild(meta);
    content.appendChild(actions);
    
    sourceElement.appendChild(header);
    sourceElement.appendChild(content);
    
    return sourceElement;
  }
  
  // Update transcript container with data
  function updateClaudeTranscript(container, data, startTime) {
    container.innerHTML = '';
    
    // Check if transcript data is valid
    if (!data || (!data.segments && !data.transcript)) {
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
    
    // Process segmented transcript with timestamps
    if (data.segments && Array.isArray(data.segments)) {
      data.segments.forEach(segment => {
        // Skip gap segments
        if (segment.is_gap) {
          const gapElement = document.createElement('div');
          gapElement.className = 'claude-transcript-gap';
          gapElement.innerHTML = '[...]';
          container.appendChild(gapElement);
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
        
        const textElement = document.createElement('div');
        textElement.className = 'claude-transcript-text';
        textElement.textContent = segment.text;
        
        segmentElement.appendChild(timestampElement);
        segmentElement.appendChild(textElement);
        container.appendChild(segmentElement);
      });
      
      // Scroll to the highlighted segment
      setTimeout(() => {
        const highlight = container.querySelector('.claude-transcript-highlight');
        if (highlight) {
          highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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
  }
  
  // Display welcome message in Claude style
  function displayClaudeWelcome() {
    const messagesContainer = document.getElementById('messages');
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
  
  // Auto-resize input on first load
  if (queryInput) {
    setTimeout(() => {
      queryInput.style.height = 'auto';
      queryInput.style.height = Math.min(queryInput.scrollHeight, 200) + 'px';
      queryInput.focus();
    }, 500);
  }
  
  // If isFirstLoad is true, show welcome message in Claude style
  if (window.isFirstLoad) {
    // Clear existing welcome message if any
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    
    // Display Claude-style welcome
    displayClaudeWelcome();
    window.isFirstLoad = false;
  }
  
  console.log('Claude-style interface initialized');
}

// Helper function to fetch transcripts with Claude-style UI
async function fetchTranscript(videoId, startTime = 0) {
  try {
    console.log(`Fetching transcript for video ${videoId} with language ${currentLanguage}`);
    
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
    return { error: error.message };
  }
}