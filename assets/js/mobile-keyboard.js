/**
 * Mobile Keyboard Detection
 * Detects when the mobile keyboard is open and adjusts the UI accordingly
 * Fellowship Digital Ministry
 */

document.addEventListener('DOMContentLoaded', function() {
  // Only run this on mobile devices
  if (window.innerWidth > 768) return;
  
  // Store original window height
  const originalHeight = window.innerHeight;
  
  // Get DOM elements
  const queryInput = document.getElementById('queryInput');
  const clearConversationBtn = document.getElementById('clearConversation');
  const chatForm = document.getElementById('chatForm');
  const inputContainer = document.querySelector('.claude-input-container');
  
  // Store input value to prevent loss
  let savedInputValue = '';
  
  // Listen for window resize events (triggered when keyboard opens/closes)
  window.addEventListener('resize', function() {
    // Skip for desktop
    if (window.innerWidth > 768) return;
    
    // If height significantly decreases, keyboard is likely open
    if (window.innerHeight < originalHeight * 0.75) {
      document.body.classList.add('keyboard-open');
      
      // Restore saved input value if it was lost
      if (queryInput && queryInput.value === '' && savedInputValue !== '') {
        queryInput.value = savedInputValue;
      }
      
      // Scroll to make input visible with better positioning
      setTimeout(() => {
        if (queryInput) {
          // Use 'start' instead of 'center' to position input at the top of visible area
          queryInput.scrollIntoView({behavior: 'smooth', block: 'start'});
          
          // Force the input to be visible above the keyboard
          const inputRect = queryInput.getBoundingClientRect();
          const visibleHeight = window.innerHeight * 0.4; // Adjust based on keyboard height
          
          if (inputRect.bottom > visibleHeight) {
            window.scrollBy({
              top: inputRect.bottom - visibleHeight,
              behavior: 'smooth'
            });
          }
        }
      }, 300);
    } else {
      document.body.classList.remove('keyboard-open');
    }
  });
  
  // Save input value when typing
  if (queryInput) {
    queryInput.addEventListener('input', function() {
      savedInputValue = this.value;
    });
    
    // Adjust on input focus (additional trigger for keyboard)
    queryInput.addEventListener('focus', function() {
      // Skip for desktop
      if (window.innerWidth > 768) return;
      
      // Save current input value
      savedInputValue = this.value;
      
      // Add a class to the input container for styling
      if (inputContainer) {
        inputContainer.classList.add('keyboard-focused');
      }
      
      // Small delay to ensure keyboard is open
      setTimeout(() => {
        // Use 'start' for better positioning
        this.scrollIntoView({behavior: 'smooth', block: 'start'});
        
        // Force additional scroll to ensure input is visible above keyboard
        window.scrollBy({
          top: -100, // Scroll up a bit to give more space
          behavior: 'smooth'
        });
      }, 300);
    });
    
    // Remove focus class when blurred
    queryInput.addEventListener('blur', function() {
      if (inputContainer) {
        inputContainer.classList.remove('keyboard-focused');
      }
    });
  }
  
  // Ensure Clear Conversation button doesn't interfere with keyboard
  if (clearConversationBtn) {
    clearConversationBtn.addEventListener('touchstart', function(e) {
      // Save input value before clearing
      if (queryInput) {
        savedInputValue = queryInput.value;
      }
    });
  }
});
