/**
 * app.js
 * Main application initialization
 */

// DOM Elements
const chatForm = Utils.safeGetElement('chatForm');
const languageSelect = Utils.safeGetElement('languageSelect');
const clearConversationBtn = Utils.safeGetElement('clearConversation');
const retryConnectionButton = Utils.safeGetElement('retry-connection');

/**
 * Initialize the application
 */
function initApp() {
  console.log('Initializing sermon search application...');
  
  // Check if the form exists on this page before attaching events
  if (chatForm) {
    console.log('Chat form found, adding event listeners');
    
    // Add form submit handler
    chatForm.addEventListener('submit', Search.handleSubmit);
    
    // Add language change handler
    if (languageSelect) {
      languageSelect.addEventListener('change', function() {
        I18n.changeLanguage(this.value);
      });
    }
    
    // Add clear conversation handler
    if (clearConversationBtn) {
      clearConversationBtn.addEventListener('click', clearConversation);
    }
    
    // Add retry connection button handler
    if (retryConnectionButton) {
      retryConnectionButton.addEventListener('click', function() {
        API.verifyApiConnection(true);
      });
    }
    
    // Verify API connection on page load
    API.verifyApiConnection(false);
    
    // Initialize UI components
    UI.initUI();
    
    // Set initial language
    I18n.changeLanguage(languageSelect.value);
    
    // Initialize textarea auto-resize
    initTextareaAutoResize();
  } else {
    console.error('Chat form not found on this page');
  }
}

/**
 * Initialize textarea auto-resize functionality
 */
function initTextareaAutoResize() {
  const textarea = Utils.safeGetElement('queryInput');
  if (textarea) {
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });
    
    // Set initial height
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    
    // Focus the input field on page load
    setTimeout(() => textarea.focus(), 500);
  }
}

/**
 * Clear the conversation
 */
function clearConversation() {
  // Clear conversation history
  API.clearConversationHistory();
  
  // Clear the messages container
  const messagesContainer = Utils.safeGetElement('messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = '';
  }
  
  // Display welcome message again
  UI.displayWelcomeMessage();
  
  // Focus the input field
  const queryInput = Utils.safeGetElement('queryInput');
  if (queryInput) {
    queryInput.focus();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);

// Add global error handler
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
  
  // Try to show error in the UI if possible
  const messagesContainer = Utils.safeGetElement('messages');
  if (messagesContainer) {
    const errorMsg = `
      <div class="error-container">
        <p>A script error occurred: ${event.error.message}. Try refreshing the page.</p>
      </div>
    `;
    
    try {
      // Use the UI module to add the message if it's loaded
      if (typeof UI !== 'undefined' && UI.addMessage) {
        UI.addMessage(errorMsg, 'bot', true);
      } else {
        // Fallback if UI module isn't loaded
        const errorElement = document.createElement('div');
        errorElement.className = 'message bot error';
        errorElement.innerHTML = errorMsg;
        messagesContainer.appendChild(errorElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } catch (e) {
      console.error('Could not display error message:', e);
    }
  }
  
  // Prevent the error from causing more issues
  event.preventDefault();
});

// Make the clearConversation function available globally
window.clearConversation = clearConversation;