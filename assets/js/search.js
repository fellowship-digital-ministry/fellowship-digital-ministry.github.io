/**
 * Search functionality for the sermon library
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const searchTabs = document.querySelectorAll('.search-tab');
    const tabContents = document.querySelectorAll('.search-tab-content');
    const keywordForm = document.getElementById('keyword-search-form');
    const questionForm = document.getElementById('question-form');
    const loadingIndicator = document.getElementById('loading-indicator');
    const searchResults = document.getElementById('search-results');
    const answerContainer = document.getElementById('answer-container');
    const answerText = document.getElementById('answer-text');
    const sourcesList = document.getElementById('sources-list');
    const noResults = document.getElementById('no-results');
    
    // Tab switching
    searchTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        searchTabs.forEach(t => t.classList.remove('active'));
        
        // Add active class to clicked tab
        this.classList.add('active');
        
        // Hide all tab contents
        tabContents.forEach(content => content.style.display = 'none');
        
        // Show the selected tab content
        document.getElementById(this.dataset.tab).style.display = 'block';
        
        // Reset results
        resetResults();
      });
    });
    
    // Keyword search form submission
    keywordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const query = document.getElementById('keyword-query').value.trim();
      if (!query) return;
      
      resetResults();
      showLoading();
      
      try {
        const results = await window.sermonApi.search(query);
        hideLoading();
        
        if (results.results && results.results.length > 0) {
          displaySearchResults(results.results);
        } else {
          showNoResults();
        }
      } catch (error) {
        hideLoading();
        displayError('An error occurred while searching. Please try again.');
        console.error(error);
      }
    });
    
    // Question form submission
    questionForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const query = document.getElementById('question-query').value.trim();
      if (!query) return;
      
      resetResults();
      showLoading();
      
      try {
        const answer = await window.sermonApi.answer(query);
        hideLoading();
        
        if (answer) {
          displayAnswer(answer);
        } else {
          showNoResults();
        }
      } catch (error) {
        hideLoading();
        displayError('An error occurred while processing your question. Please try again.');
        console.error(error);
      }
    });
    
    // Helper functions
    function resetResults() {
      searchResults.innerHTML = '';
      answerContainer.style.display = 'none';
      answerText.innerHTML = '';
      sourcesList.innerHTML = '';
      noResults.style.display = 'none';
    }
    
    function showLoading() {
      loadingIndicator.style.display = 'block';
    }
    
    function hideLoading() {
      loadingIndicator.style.display = 'none';
    }
    
    function showNoResults() {
      noResults.style.display = 'block';
    }
    
    function displaySearchResults(results) {
      searchResults.innerHTML = '';
      
      results.forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.className = 'result-item';
        
        const formattedStartTime = SermonApiClient.formatTime(result.start_time);
        
        resultElement.innerHTML = `
          <h3><a href="/sermons/${result.video_id}?t=${Math.floor(result.start_time)}">${result.title}</a></h3>
          <div class="meta">
            <a href="${result.url}" target="_blank" class="timestamp">${formattedStartTime}</a>
          </div>
          <p>${truncateText(result.text, 200)}</p>
          <a href="/sermons/${result.video_id}?t=${Math.floor(result.start_time)}" class="button secondary">View Sermon</a>
        `;
        
        searchResults.appendChild(resultElement);
      });
    }
    
    function displayAnswer(answer) {
      answerContainer.style.display = 'block';
      answerText.innerHTML = `<p>${answer.answer}</p>`;
      
      if (answer.sources && answer.sources.length > 0) {
        displaySearchResults(answer.sources);
      }
    }
    
    function displayError(message) {
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.innerHTML = `<p>${message}</p>`;
      searchResults.appendChild(errorElement);
    }
    
    function truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      
      // Find the last complete word within the maxLength
      const truncated = text.substr(0, maxLength);
      return truncated.substr(0, truncated.lastIndexOf(' ')) + '...';
    }
  });