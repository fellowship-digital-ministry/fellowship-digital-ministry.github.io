/**
 * Sermon Library API Client
 * 
 * A client-side JavaScript wrapper for the Sermon API
 */

class SermonApiClient {
    constructor(baseUrl) {
      this.baseUrl = baseUrl;
      this.endpoints = {
        search: '/search',
        answer: '/answer',
        sermons: '/sermons',
        sermon: '/sermons/' // + videoId
      };
    }
  
    /**
     * Search for sermon segments matching a query
     * @param {string} query - The search term
     * @param {Object} options - Additional options like top_k, min_score
     * @returns {Promise} - The search results
     */
    async search(query, options = {}) {
      const params = new URLSearchParams({
        query: query,
        top_k: options.topK || 5,
        min_score: options.minScore || 0.6
      });
      
      try {
        const response = await fetch(`${this.baseUrl}${this.endpoints.search}?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error searching sermons');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Search error:', error);
        throw error;
      }
    }
  
    /**
     * Get an AI-generated answer based on sermon content
     * @param {string} query - The question to answer
     * @param {Object} options - Additional options
     * @returns {Promise} - The answer and sources
     */
    async answer(query, options = {}) {
      try {
        const response = await fetch(`${this.baseUrl}${this.endpoints.answer}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: query,
            top_k: options.topK || 5,
            include_sources: options.includeSources !== false
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error generating answer');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Answer error:', error);
        throw error;
      }
    }
  
    /**
     * Get a list of all sermons
     * @param {Object} options - Pagination options
     * @returns {Promise} - The list of sermons
     */
    async listSermons(options = {}) {
      const params = new URLSearchParams({
        limit: options.limit || 50,
        offset: options.offset || 0
      });
      
      try {
        const response = await fetch(`${this.baseUrl}${this.endpoints.sermons}?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error listing sermons');
        }
        
        return await response.json();
      } catch (error) {
        console.error('List sermons error:', error);
        throw error;
      }
    }
  
    /**
     * Get details about a specific sermon
     * @param {string} videoId - The YouTube video ID
     * @returns {Promise} - The sermon details and transcript chunks
     */
    async getSermon(videoId) {
      try {
        const response = await fetch(`${this.baseUrl}${this.endpoints.sermon}${videoId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error getting sermon details');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Get sermon error:', error);
        throw error;
      }
    }
  
    /**
     * Format a time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} - Formatted time
     */
    static formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  
    /**
     * Generate a YouTube timestamp URL
     * @param {string} videoId - YouTube video ID
     * @param {number} seconds - Time in seconds
     * @returns {string} - YouTube URL with timestamp
     */
    static getYouTubeUrl(videoId, seconds) {
      return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}`;
    }
  }
  
  // Initialize the API client globally
  window.sermonApi = new SermonApiClient(
    document.currentScript.getAttribute('data-api-url') || 'https://sermon-search-api-8fok.onrender.com'
  );