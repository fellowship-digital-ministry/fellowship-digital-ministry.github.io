/**
 * Modal Fix for Reference Viewer
 * 
 * This script fixes issues with modal closing in the reference viewer page.
 * It properly isolates the modal functionality from potential conflicts.
 */

// Self-executing function to avoid polluting global scope
(function() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
      // Get all elements we need to work with
      const modals = document.querySelectorAll('.modal');
      const closeButtons = document.querySelectorAll('.close-modal');
      const videoModal = document.getElementById('videoModal');
      const shareModal = document.getElementById('shareModal');
      
      // Add close handlers to all close buttons
      closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation(); // Stop event bubbling
          
          // Find the parent modal
          const modal = this.closest('.modal');
          if (modal) {
            closeModal(modal);
          }
        });
      });
      
      // Add click handler to close when clicking outside modal content
      modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
          // Only close if clicking the backdrop, not the modal content
          if (e.target === this) {
            closeModal(this);
          }
        });
      });
      
      // Add ESC key handler
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          // Find any open modals and close them
          document.querySelectorAll('.modal:not([hidden])').forEach(modal => {
            closeModal(modal);
          });
        }
      });
      
      // Share button functionality
      const shareButton = document.getElementById('shareReferenceBtn');
      if (shareButton && shareModal) {
        shareButton.addEventListener('click', function(e) {
          e.preventDefault();
          openModal(shareModal);
        });
      }
      
      // Ensure any video is stopped when video modal is closed
      if (videoModal) {
        const closeVideoButton = videoModal.querySelector('.close-modal');
        if (closeVideoButton) {
          closeVideoButton.addEventListener('click', function() {
            // Clear video container to stop playback
            const videoContainer = document.getElementById('videoContainer');
            if (videoContainer) {
              videoContainer.innerHTML = '';
            }
          });
        }
      }
      
      /**
       * Open a modal properly
       */
      function openModal(modal) {
        if (!modal) return;
        
        // Set display to block first
        modal.hidden = false;
        
        // Force reflow to enable transition
        modal.offsetHeight;
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
      }
      
      /**
       * Close a modal properly
       */
      function closeModal(modal) {
        if (!modal) return;
  
        // If it's the video modal, also clear video
        if (modal.id === 'videoModal') {
          const videoContainer = document.getElementById('videoContainer');
          if (videoContainer) {
            videoContainer.innerHTML = '';
          }
        }
        
        // Hide the modal
        modal.hidden = true;
        
        // Restore body scrolling
        document.body.style.overflow = '';
      }
      
      // Handle opening video for occurrence items
      const occurrenceItems = document.querySelectorAll('.occurrence-item');
      occurrenceItems.forEach(item => {
        item.addEventListener('click', function() {
          const videoLink = this.querySelector('.video-link');
          if (videoLink && videoLink.href) {
            // Extract video ID and timestamp from URL
            const url = new URL(videoLink.href);
            const videoId = url.searchParams.get('v');
            const timestamp = url.searchParams.get('t') || '0';
            
            if (videoId) {
              openVideoModal(videoId, timestamp);
            }
          }
        });
      });
      
      /**
       * Open video modal with specific video
       */
      function openVideoModal(videoId, timestamp) {
        if (!videoModal || !videoId) return;
        
        // Set up video iframe
        const videoContainer = document.getElementById('videoContainer');
        if (videoContainer) {
          videoContainer.innerHTML = `
            <iframe 
              src="https://www.youtube.com/embed/${videoId}?start=${timestamp}&autoplay=1" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
            ></iframe>
          `;
        }
        
        // Update title if available
        const videoTitle = videoModal.querySelector('#videoModalTitle');
        if (videoTitle) {
          // Try to find sermon title from page
          const sermonTitle = document.querySelector('.sermon-title');
          if (sermonTitle) {
            videoTitle.textContent = `Video Segment - ${sermonTitle.textContent}`;
          } else {
            videoTitle.textContent = 'Video Segment';
          }
        }
        
        // Open the modal
        openModal(videoModal);
      }
    });
  })();