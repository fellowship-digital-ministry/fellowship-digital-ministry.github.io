/**
 * Mobile-friendly header functionality
 * Handles the mobile navigation toggle and other header interactions
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get the navigation toggle button and mobile navigation panel
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  
  // Toggle mobile navigation when hamburger icon is clicked
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', function() {
      // Toggle active class on the button for animation
      this.classList.toggle('active');
      
      // Toggle active class on the mobile navigation panel
      navMobile.classList.toggle('active');
      
      // Update aria-expanded attribute for accessibility
      const isExpanded = navMobile.classList.contains('active');
      this.setAttribute('aria-expanded', isExpanded);
    });
  }
  
  // Close mobile navigation when clicking outside
  document.addEventListener('click', function(event) {
    if (navMobile && navMobile.classList.contains('active')) {
      // Check if the click was outside the mobile navigation and toggle button
      if (!navMobile.contains(event.target) && !navToggle.contains(event.target)) {
        navMobile.classList.remove('active');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', false);
      }
    }
  });
  
  // Close mobile navigation when window is resized to desktop size
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768 && navMobile && navMobile.classList.contains('active')) {
      navMobile.classList.remove('active');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', false);
    }
  });
  
  // Handle language selector functionality if needed
  const languageSelector = document.getElementById('languageSelect');
  if (languageSelector) {
    languageSelector.addEventListener('change', function() {
      // Add language switching functionality here if needed
      console.log('Language changed to:', this.value);
      
      // Example: You could reload the page with a language parameter
      // window.location.href = window.location.pathname + '?lang=' + this.value;
    });
  }
});
