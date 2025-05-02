/**
 * Streamlined Mobile-friendly header functionality
 * Improved toggle behavior, fixed scroll issues, and enhanced accessibility
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get the navigation toggle button and mobile navigation panel
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  const body = document.body;
  
  // Toggle mobile navigation when hamburger icon is clicked
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle active class on the button for animation
      this.classList.toggle('active');
      
      // Toggle active class on the mobile navigation panel
      navMobile.classList.toggle('active');
      
      // Toggle body class to prevent scrolling when nav is open
      body.classList.toggle('nav-open');
      
      // Fix for search page - ensure mobile nav is visible when active
      if (navMobile.classList.contains('active')) {
        navMobile.style.transform = 'translateX(0)';
        navMobile.style.display = 'block';
      } else {
        navMobile.style.transform = 'translateX(100%)';
        
        // Don't hide immediately to allow for transition
        setTimeout(() => {
          if (!navMobile.classList.contains('active')) {
            navMobile.style.display = '';
          }
        }, 300);
      }
      
      // Update aria-expanded attribute for accessibility
      const isExpanded = navMobile.classList.contains('active');
      this.setAttribute('aria-expanded', isExpanded);
      navMobile.setAttribute('aria-hidden', !isExpanded);
    });
  }
  
  // Close mobile navigation when clicking anywhere outside nav or toggle
  document.addEventListener('click', function(event) {
    if (navMobile && navMobile.classList.contains('active')) {
      // Check if the click was outside the mobile navigation and toggle button
      if (!navMobile.contains(event.target) && !navToggle.contains(event.target)) {
        navMobile.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navMobile.setAttribute('aria-hidden', 'true');
        navMobile.style.transform = 'translateX(100%)';
        body.classList.remove('nav-open');
        
        // Don't hide immediately to allow for transition
        setTimeout(() => {
          if (!navMobile.classList.contains('active')) {
            navMobile.style.display = '';
          }
        }, 300);
      }
    }
  });
  
  // Close mobile navigation when any link inside it is clicked
  if (navMobile) {
    const navLinks = navMobile.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        navMobile.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        navMobile.setAttribute('aria-hidden', 'true');
        navMobile.style.transform = 'translateX(100%)';
        body.classList.remove('nav-open');
        
        // Don't hide immediately to allow for transition
        setTimeout(() => {
          if (!navMobile.classList.contains('active')) {
            navMobile.style.display = '';
          }
        }, 300);
      });
    });
  }
  
  // Close mobile navigation when window is resized to desktop size
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && navMobile && navMobile.classList.contains('active')) {
      navMobile.classList.remove('active');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      navMobile.setAttribute('aria-hidden', 'true');
      navMobile.style.transform = 'translateX(100%)';
      body.classList.remove('nav-open');
      
      // Don't hide immediately to allow for transition
      setTimeout(() => {
        if (!navMobile.classList.contains('active')) {
          navMobile.style.display = '';
        }
      }, 300);
    }
    
    // Special handling for search page height calculations
    if (document.body.classList.contains('search-page')) {
      const chatSectionWrapper = document.querySelector('.chat-section-wrapper');
      if (chatSectionWrapper) {
        const headerHeight = window.innerWidth <= 768 ? 56 : 64; // Updated to match new header heights
        chatSectionWrapper.style.height = `calc(100vh - ${headerHeight}px)`;
        
        // Update messages container height
        const messagesContainer = document.querySelector('.claude-messages');
        if (messagesContainer) {
          messagesContainer.style.maxHeight = `calc(100vh - ${headerHeight + 90}px)`;
        }
      }
    }
  });
  
  // Handle language selector functionality
  const languageSelector = document.getElementById('languageSelect');
  if (languageSelector) {
    languageSelector.addEventListener('change', function() {
      // Add language switching functionality here if needed
      console.log('Language changed to:', this.value);
    });
  }
  
  // Fix initial height calculations for search page
  if (document.body.classList.contains('search-page')) {
    // Fix chat section wrapper height
    const chatSectionWrapper = document.querySelector('.chat-section-wrapper');
    if (chatSectionWrapper) {
      const headerHeight = window.innerWidth <= 768 ? 56 : 64; // Updated to match new header heights
      chatSectionWrapper.style.height = `calc(100vh - ${headerHeight}px)`;
      
      // Fix messages container height
      const messagesContainer = document.querySelector('.claude-messages');
      if (messagesContainer) {
        messagesContainer.style.maxHeight = `calc(100vh - ${headerHeight + 90}px)`;
      }
    }
  }
  
  // Ensure mobile nav is properly configured on page load
  if (navMobile) {
    // Set initial aria state
    navMobile.setAttribute('aria-hidden', 'true');
    
    // Fix height and positioning
    const headerHeight = document.querySelector('.mobile-friendly-header')?.offsetHeight || 64; // Updated from 60 to 64
    navMobile.style.paddingTop = `${headerHeight + 20}px`;
  }
  
  // Fix for info section positioning
  const infoSection = document.querySelector('.info-section');
  if (infoSection && document.body.classList.contains('search-page')) {
    const headerHeight = window.innerWidth <= 768 ? 56 : 64; // Updated to match new header heights
    infoSection.style.top = `${headerHeight}px`;
  }
});
