/**
 * Element Initializer
 * 
 * This script ensures that all elements required by search.js exist in the DOM
 * before search.js tries to access them. It creates placeholder elements if they
 * don't exist yet, which prevents the "Element with ID not found" warnings.
 */

// Run this script before search.js loads
document.addEventListener('DOMContentLoaded', function() {
  // List of element IDs that search.js expects to find
  const requiredElementIds = [
    'chatForm',
    'queryInput',
    'messages',
    'sourcesPanel',
    'sourcesPanelContent',
    'closeSourcesPanel',
    'api-status-banner',
    'api-status-message',
    'retry-connection',
    'languageSelect',
    'clearConversation',
    'infoToggle',
    'infoSection'
  ];

  // Check each required element and create a placeholder if it doesn't exist
  requiredElementIds.forEach(function(id) {
    if (!document.getElementById(id)) {
      console.log(`Creating placeholder for element with ID '${id}'`);
      const placeholder = document.createElement('div');
      placeholder.id = id;
      placeholder.style.display = 'none'; // Hide placeholder elements
      document.body.appendChild(placeholder);
    }
  });
});
