/**
 * Sermon list functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const SERMONS_PER_PAGE = 10;
    
    // Elements
    const sermonsList = document.getElementById('sermons-list');
    const loadingIndicator = document.getElementById('loading-indicator');
    const sortSelect = document.getElementById('sort-select');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const currentPageElem = document.getElementById('current-page');
    const totalPagesElem = document.getElementById('total-pages');
    
    // State
    let allSermons = [];
    let currentPage = 1;
    let totalPages = 1;
    let sortOrder = 'date-desc';
    
    // Event listeners
    sortSelect.addEventListener('change', function() {
      sortOrder = this.value;
      currentPage = 1;
      renderSermonsList();
    });
    
    prevPageBtn.addEventListener('click', function() {
      if (currentPage > 1) {
        currentPage--;
        renderSermonsList();
        window.scrollTo(0, 0);
      }
    });
    
    nextPageBtn.addEventListener('click', function() {
      if (currentPage < totalPages) {
        currentPage++;
        renderSermonsList();
        window.scrollTo(0, 0);
      }
    });
    
    // Initialize
    loadSermons();
    
    /**
     * Load sermons from the API
     */
    async function loadSermons() {
      showLoading();
      
      try {
        const result = await window.sermonApi.listSermons({ limit: 200 }); // Get more sermons at once to reduce API calls
        allSermons = result.sermons || [];
        
        // Calculate total pages
        totalPages = Math.ceil(allSermons.length / SERMONS_PER_PAGE);
        totalPagesElem.textContent = totalPages;
        
        renderSermonsList();
      } catch (error) {
        console.error('Error loading sermons:', error);
        sermonsList.innerHTML = '<p class="error-message">Error loading sermons. Please try again later.</p>';
      } finally {
        hideLoading();
      }
    }
    
    /**
     * Render the sermons list with pagination
     */
    function renderSermonsList() {
      // Sort sermons
      const sortedSermons = sortSermons(allSermons, sortOrder);
      
      // Paginate
      const start = (currentPage - 1) * SERMONS_PER_PAGE;
      const end = start + SERMONS_PER_PAGE;
      const pageSermons = sortedSermons.slice(start, end);
      
      // Update UI
      sermonsList.innerHTML = '';
      
      if (pageSermons.length === 0) {
        sermonsList.innerHTML = '<p>No sermons found.</p>';
        return;
      }
      
      pageSermons.forEach(sermon => {
        const sermonElement = document.createElement('div');
        sermonElement.className = 'sermon-item';
        
        // Format date if available
        let dateDisplay = '';
        if (sermon.publish_date) {
          const date = new Date(sermon.publish_date);
          dateDisplay = `<span class="date">${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>`;
        }
        
        sermonElement.innerHTML = `
          <h3><a href="/sermons/${sermon.video_id}">${sermon.title}</a></h3>
          <div class="meta">
            ${dateDisplay}
            <a href="${sermon.url}" target="_blank" class="youtube-link">Watch on YouTube</a>
          </div>
          <a href="/sermons/${sermon.video_id}" class="button secondary">View Sermon</a>
        `;
        
        sermonsList.appendChild(sermonElement);
      });
      
      // Update pagination
      updatePagination();
    }
    
    /**
     * Sort sermons based on the selected sort order
     */
    function sortSermons(sermons, order) {
      const sorted = [...sermons];
      
      switch (order) {
        case 'date-desc':
          return sorted.sort((a, b) => new Date(b.publish_date || 0) - new Date(a.publish_date || 0));
        case 'date-asc':
          return sorted.sort((a, b) => new Date(a.publish_date || 0) - new Date(b.publish_date || 0));
        case 'title':
          return sorted.sort((a, b) => a.title.localeCompare(b.title));
        default:
          return sorted;
      }
    }
    
    /**
     * Update the pagination controls
     */
    function updatePagination() {
      currentPageElem.textContent = currentPage;
      prevPageBtn.disabled = currentPage <= 1;
      nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    /**
     * Show loading indicator
     */
    function showLoading() {
      loadingIndicator.style.display = 'block';
      sermonsList.style.display = 'none';
    }
    
    /**
     * Hide loading indicator
     */
    function hideLoading() {
      loadingIndicator.style.display = 'none';
      sermonsList.style.display = 'block';
    }
  });