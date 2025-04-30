/**
 * Minimal Sources Modal Solution
 * This focuses only on making the sources panel work as a modal
 * without changing the existing styles
 */

(function() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', initSourcesModal);
    
    // Also try to run immediately in case DOM is already loaded
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      initSourcesModal();
    }
    
    function initSourcesModal() {
      console.log("📱 Initializing sources modal solution");
      
      // Create sources modal if it doesn't exist
      if (!document.getElementById('sources-modal')) {
        createSourcesModal();
      }
      
      // Add click handler for all sources toggle buttons
      document.addEventListener('click', handleSourcesToggleClick);
    }
    
    /**
     * Create sources modal that will display sources content
     */
    function createSourcesModal() {
      console.log("🛠️ Creating sources modal");
      
      // Create modal container if needed
      let modalsContainer = document.getElementById('modals-container');
      if (!modalsContainer) {
        modalsContainer = document.createElement('div');
        modalsContainer.id = 'modals-container';
        document.body.appendChild(modalsContainer);
      }
      
      // Create sources modal
      const sourcesModal = document.createElement('div');
      sourcesModal.id = 'sources-modal';
      sourcesModal.className = 'sources-modal';
      sourcesModal.innerHTML = `
        <div class="sources-modal-content">
          <div class="sources-modal-header">
            <h2 class="sources-modal-title">Sources <span class="sources-count">0</span></h2>
            <button class="sources-modal-close" aria-label="Close sources">&times;</button>
          </div>
          <div class="sources-modal-body" id="sources-modal-body"></div>
        </div>
      `;
      
      // Add minimal styling for the modal
      const modalStyle = document.createElement('style');
      modalStyle.textContent = `
        /* Modal base styles - these won't affect existing UI */
        .sources-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .sources-modal.active {
          opacity: 1;
          visibility: visible;
        }
        
        .sources-modal-content {
          background-color: white;
          width: 95%;
          max-height: 90vh;
          border-radius: 12px;
          box-shadow: 0 5px 30px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        /* Adjust modal size based on device */
        @media (min-width: 768px) {
          .sources-modal-content {
            max-width: 800px;
          }
        }
        
        @media (max-width: 767px) {
          .sources-modal-content {
            width: 100%;
            height: 80vh;
            border-radius: 12px 12px 0 0;
            margin-top: auto;
            margin-bottom: 0;
          }
          
          .sources-modal {
            align-items: flex-end;
          }
        }
        
        .sources-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #eeeeee;
          background-color: #f8f9fa;
        }
        
        .sources-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #333333;
          margin: 0;
        }
        
        .sources-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          line-height: 1;
          color: #888;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .sources-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
      `;
      
      document.head.appendChild(modalStyle);
      modalsContainer.appendChild(sourcesModal);
      
      // Add close button event
      sourcesModal.querySelector('.sources-modal-close').addEventListener('click', function() {
        closeModal(sourcesModal);
        
        // Update any active source toggle buttons
        const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
        activeToggles.forEach(toggle => {
          toggle.setAttribute('data-active', 'false');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> Show Sources';
        });
      });
      
      // Add click event to close when clicking outside modal
      sourcesModal.addEventListener('click', function(e) {
        if (e.target === sourcesModal) {
          closeModal(sourcesModal);
          
          // Update any active source toggle buttons
          const activeToggles = document.querySelectorAll('.claude-sources-toggle[data-active="true"]');
          activeToggles.forEach(toggle => {
            toggle.setAttribute('data-active', 'false');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> Show Sources';
          });
        }
      });
      
      console.log("✅ Sources modal created");
    }
    
    /**
     * Handle clicks on source toggle buttons
     */
    function handleSourcesToggleClick(event) {
      // Check if a sources toggle button was clicked
      const toggleButton = event.target.closest('.claude-sources-toggle');
      if (!toggleButton) return;
      
      console.log("🖱️ Sources toggle button clicked");
      
      // Get the sources modal
      const sourcesModal = document.getElementById('sources-modal');
      const sourcesModalBody = document.getElementById('sources-modal-body');
      
      if (!sourcesModal || !sourcesModalBody) {
        console.error("❌ Sources modal not found");
        return;
      }
      
      // Get the original sources panel content
      const sourcesPanelContent = document.getElementById('sourcesPanelContent');
      if (!sourcesPanelContent) {
        console.error("❌ Original sources panel content not found");
        return;
      }
      
      // Get button state
      const isActive = toggleButton.getAttribute('data-active') === 'true';
      
      if (isActive) {
        // Close the modal
        closeModal(sourcesModal);
        
        // Update button
        toggleButton.setAttribute('data-active', 'false');
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> Show Sources';
        
        console.log("📉 Closed sources modal");
      } else {
        // Copy content from original panel to our modal
        sourcesModalBody.innerHTML = sourcesPanelContent.innerHTML;
        
        // Update source count
        const sourcesCountElement = sourcesModal.querySelector('.sources-count');
        if (sourcesCountElement) {
          // Try to determine number of sources from content
          const sourceElements = sourcesModalBody.querySelectorAll('.source-container');
          if (sourceElements.length > 0) {
            sourcesCountElement.textContent = ` (${sourceElements.length})`;
          } else {
            sourcesCountElement.textContent = '';
          }
        }
        
        // Open the modal
        openModal(sourcesModal);
        
        // Update button
        toggleButton.setAttribute('data-active', 'true');
        toggleButton.setAttribute('aria-expanded', 'true');
        toggleButton.innerHTML = '<span class="claude-sources-toggle-icon">⬇</span> Hide Sources';
        
        console.log("📈 Opened sources modal");
      }
    }
    
    /**
     * Open a modal with animation
     */
    function openModal(modal) {
      if (!modal) return;
      
      // Show the modal
      modal.style.display = 'flex';
      
      // Trigger animation
      setTimeout(() => {
        modal.classList.add('active');
      }, 10);
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
    }
    
    /**
     * Close a modal with animation
     */
    function closeModal(modal) {
      if (!modal) return;
      
      // Trigger animation
      modal.classList.remove('active');
      
      // Remove after animation
      setTimeout(() => {
        modal.style.display = 'none';
        
        // Restore body scrolling
        document.body.style.overflow = '';
      }, 300);
    }
  })();