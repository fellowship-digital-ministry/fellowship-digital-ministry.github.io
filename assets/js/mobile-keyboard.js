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
  
  // Listen for window resize events (triggered when keyboard opens/closes)
  window.addEventListener('resize', function() {
    // Skip for desktop
    if (window.innerWidth > 768) return;
    
    // If height significantly decreases, keyboard is likely open
    if (window.innerHeight < originalHeight * 0.75) {
      document.body.classList.add('keyboard-open');
      
      // Scroll to make input visible
      setTimeout(() => {
        if (queryInput) {
          queryInput.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
      }, 300);
    } else {
      document.body.classList.remove('keyboard-open');
    }
  });
  
  // Adjust on input focus (additional trigger for keyboard)
  if (queryInput) {
    queryInput.addEventListener('focus', function() {
      // Skip for desktop
      if (window.innerWidth > 768) return;
      
      // Small delay to ensure keyboard is open
      setTimeout(() => {
        this.scrollIntoView({behavior: 'smooth', block: 'center'});
      }, 300);
    });
  }
});
