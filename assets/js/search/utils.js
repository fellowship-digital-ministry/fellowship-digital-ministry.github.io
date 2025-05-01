/**
 * utils.js
 * Common utility functions used throughout the application
 */

// Safely get DOM elements with error handling
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
    }
    return element;
  }
  
  // Escape HTML for safety
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // Smooth scroll to the bottom of a container
  function smoothScrollToBottom(container) {
    const scrollHeight = container.scrollHeight;
    const currentScroll = container.scrollTop + container.clientHeight;
    const targetScroll = scrollHeight;
    
    // Only smooth scroll if we're reasonably close to the bottom already
    // This avoids jarring scrolling when lots of content is added
    if (targetScroll - currentScroll < 500) {
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    } else {
      container.scrollTop = targetScroll;
    }
  }
  
  // Format timestamp to MM:SS
  function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  // Format a date string from various possible formats
  function formatSermonDate(dateStr, language = 'en') {
    if (!dateStr) return 'Date unknown';
    
    try {
      // Handle YYYYMMDD format (common in the metadata)
      if (typeof dateStr === 'number' || (typeof dateStr === 'string' && /^\d{8}$/.test(dateStr))) {
        const yearStr = String(dateStr).substring(0, 4);
        const monthStr = String(dateStr).substring(4, 6);
        const dayStr = String(dateStr).substring(6, 8);
        
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
        const day = parseInt(dayStr);
        
        const date = new Date(year, month, day);
        
        // Verify the date is valid
        if (isNaN(date.getTime())) {
          return 'Date unknown';
        }
        
        return new Intl.DateTimeFormat(language, {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      // Handle ISO date strings (YYYY-MM-DD)
      if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const date = new Date(dateStr);
        
        // Verify the date is valid
        if (isNaN(date.getTime())) {
          return 'Date unknown';
        }
        
        return new Intl.DateTimeFormat(language, {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      // Handle timestamp (milliseconds since epoch)
      if (typeof dateStr === 'number') {
        const date = new Date(dateStr);
        
        // Verify the date is valid
        if (isNaN(date.getTime())) {
          return 'Date unknown';
        }
        
        return new Intl.DateTimeFormat(language, {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      // For any other format, try a direct Date parsing as last resort
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(language, {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      // Return as is if we can't parse it
      return typeof dateStr === 'string' ? dateStr : 'Date unknown';
    } catch (e) {
      console.error(`Error parsing date: ${dateStr}`, e);
      return 'Date unknown';
    }
  }
  
  // Clean and format sermon title
  function formatSermonTitle(title) {
    if (!title) return 'Unknown Sermon';
    
    // Remove quotes that might be in the title
    return title.replace(/^["']|["']$/g, '');
  }
  
  // Add global error handler
  window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    
    // Try to show error in the UI if possible
    const messagesContainer = safeGetElement('messages');
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
  
  // Export utilities
  const Utils = {
    safeGetElement,
    escapeHTML,
    smoothScrollToBottom,
    formatTimestamp,
    formatSermonDate,
    formatSermonTitle
  };