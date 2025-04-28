---
---
/**
 * Bible References Helper
 * 
 * This script identifies Bible references in any text on the page
 * and makes them clickable links to the reference viewer.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Regular expression to match Bible references
  const bibleRefRegex = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi;
  
  // Find all text nodes in the document
  const walker = document.createTreeWalker(
    document.body, 
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip text nodes in script, style, and code elements
        const parent = node.parentNode;
        if (parent && (
          parent.nodeName === 'SCRIPT' || 
          parent.nodeName === 'STYLE' || 
          parent.nodeName === 'CODE' ||
          parent.classList.contains('no-ref-links')
        )) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Only process text nodes that might contain Bible references
        if (node.nodeValue && node.nodeValue.match(bibleRefRegex)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        
        return NodeFilter.FILTER_SKIP;
      }
    }
  );
  
  // Process text nodes
  const textNodes = [];
  let currentNode;
  while (currentNode = walker.nextNode()) {
    textNodes.push(currentNode);
  }
  
  // Replace Bible references with clickable links
  textNodes.forEach(function(textNode) {
    const text = textNode.nodeValue;
    const parent = textNode.parentNode;
    
    // Create a document fragment to hold the new content
    const fragment = document.createDocumentFragment();
    
    // Keep track of the last end index
    let lastIndex = 0;
    
    // Find all Bible references in this text node
    let match;
    while ((match = bibleRefRegex.exec(text)) !== null) {
      // Add the text up to this match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(
          text.substring(lastIndex, match.index)
        ));
      }
      
      // Create a link for the Bible reference
      const reference = match[0];
      const link = document.createElement('a');
      link.href = `/reference-viewer.html?reference=${encodeURIComponent(reference)}`;
      link.className = 'bible-reference';
      link.textContent = reference;
      link.title = `See all occurrences of ${reference} in sermons`;
      
      // Add the link to the fragment
      fragment.appendChild(link);
      
      // Update the last index
      lastIndex = match.index + reference.length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(
        text.substring(lastIndex)
      ));
    }
    
    // Only replace the node if we found matches
    if (lastIndex > 0) {
      parent.replaceChild(fragment, textNode);
    }
  });
  
  console.log('Bible references processed and linked to reference viewer');
});