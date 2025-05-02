/**
 * Improved Mobile-friendly header functionality
 * Fixed toggle behavior and scroll issues
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
        
        // Prevent body scrolling when menu is open
        if (navMobile.classList.contains('active')) {
          body.style.overflow = 'hidden';
        } else {
          body.style.overflow = '';
        }
        
        // Update aria-expanded attribute for accessibility
        const isExpanded = navMobile.classList.contains('active');
        this.setAttribute('aria-expanded', isExpanded);
      });
    }
    
    // Close mobile navigation when clicking anywhere outside nav or toggle
    document.addEventListener('click', function(event) {
      if (navMobile && navMobile.classList.contains('active')) {
        // Check if the click was outside the mobile navigation and toggle button
        if (!navMobile.contains(event.target) && !navToggle.contains(event.target)) {
          navMobile.classList.remove('active');
          navToggle.classList.remove('active');
          navToggle.setAttribute('aria-expanded', false);
          body.style.overflow = '';
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
          navToggle.setAttribute('aria-expanded', false);
          body.style.overflow = '';
        });
      });
    }
    
    // Close mobile navigation when window is resized to desktop size
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768 && navMobile && navMobile.classList.contains('active')) {
        navMobile.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', false);
        body.style.overflow = '';
      }
      
      // Special handling for search page height calculations
      if (document.body.classList.contains('search-page')) {
        const chatSectionWrapper = document.querySelector('.chat-section-wrapper');
        if (chatSectionWrapper) {
          const headerHeight = window.innerWidth <= 768 ? 50 : 60;
          chatSectionWrapper.style.height = `calc(100vh - ${headerHeight}px)`;
          chatSectionWrapper.style.top = `${headerHeight}px`;
        }
      }
    });
    
    // Handle language selector functionality if needed
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
        const headerHeight = window.innerWidth <= 768 ? 50 : 60;
        chatSectionWrapper.style.height = `calc(100vh - ${headerHeight}px)`;
        chatSectionWrapper.style.top = `${headerHeight}px`;
      }
      
      // Fix messages container height
      const messagesContainer = document.querySelector('.claude-messages');
      if (messagesContainer) {
        messagesContainer.style.maxHeight = `calc(100vh - 140px)`;
      }
    }
  });