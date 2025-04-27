---
---
/**
 * Sermon analytics functionality
 */

// Constants
const API_URL = '{{ site.api_url }}';

// Bible books data
const bibleBooks = {
  oldTestament: [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', 
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ],
  gospels: ['Matthew', 'Mark', 'Luke', 'John'],
  epistles: [
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 
    'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 
    'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude'
  ],
  other: ['Acts', 'Revelation']
};

// Chart colors
const chartColors = {
  oldTestament: 'rgba(74, 144, 226, 0.7)',
  gospels: 'rgba(255, 149, 0, 0.7)',
  epistles: 'rgba(187, 107, 217, 0.7)',
  other: 'rgba(80, 200, 120, 0.7)'
};

// DOM Elements
const loadingSection = document.getElementById('loadingSection');
const analyticsContent = document.getElementById('analyticsContent');
const errorSection = document.getElementById('errorSection');
const retryButton = document.getElementById('retryButton');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeAnalytics);
if (retryButton) {
  retryButton.addEventListener('click', initializeAnalytics);
}

/**
 * Initialize analytics
 */
async function initializeAnalytics() {
  // Show loading, hide other sections
  loadingSection.style.display = 'block';
  analyticsContent.style.display = 'none';
  errorSection.style.display = 'none';
  
  try {
    // Verify API connection first
    console.log('Testing API connection to:', API_URL);
    
    const initialResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors'
    });
    
    if (!initialResponse.ok) {
      throw new Error(`API connection failed with status: ${initialResponse.status}`);
    }
    
    console.log('API connection successful, fetching sermon data');
    
    // Fetch sermon data
    const sermonsResponse = await fetch(`${API_URL}/sermons`, {
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors'
    });
    
    if (!sermonsResponse.ok) {
      throw new Error(`Failed to fetch sermons: ${sermonsResponse.status}`);
    }
    
    const sermonsData = await sermonsResponse.json();
    console.log('Sermons data:', sermonsData);
    
    // Update total sermons count
    document.getElementById('totalSermonsValue').textContent = sermonsData.total || 0;
    
    // Display recent sermons
    displayRecentSermons(sermonsData.sermons || []);
    
    // Get all sermon chunks to analyze Bible references
    const allSermonChunks = await getAllSermonChunks(sermonsData.sermons || []);
    
    // Extract and analyze Bible references
    const referenceData = analyzeBibleReferences(allSermonChunks);
    
    // Update stats
    document.getElementById('totalReferencesValue').textContent = referenceData.totalReferences || 0;
    
    // Find the most referenced book
    const topBook = Object.entries(referenceData.bookCount)
      .sort((a, b) => b[1] - a[1])[0];
    document.getElementById('topBookValue').textContent = topBook ? topBook[0] : 'N/A';
    
    // Create Bible references chart
    createBibleBooksChart(referenceData.bookCount);
    
    // Create testament distribution chart
    createTestamentChart(referenceData.testamentCount);
    
    // Display top chapters
    displayTopChapters(referenceData.chapterCount);
    
    // Hide loading, show content
    loadingSection.style.display = 'none';
    analyticsContent.style.display = 'block';
    
  } catch (error) {
    console.error('Error loading analytics:', error);
    loadingSection.style.display = 'none';
    errorSection.style.display = 'block';
    
    // Show error message
    const errorMessageElement = document.getElementById('errorMessage');
    if (errorMessageElement) {
      errorMessageElement.textContent = `Error: ${error.message}`;
    }
  }
}

/**
 * Fetch all sermon chunks for analysis (limiting to a reasonable number to avoid overload)
 */
async function getAllSermonChunks(sermons) {
  const allChunks = [];
  
  // For demo purposes, limit to a reasonable number to avoid excessive API calls
  const sermonsToProcess = sermons.slice(0, 10);
  
  for (const sermon of sermonsToProcess) {
    try {
      console.log(`Fetching sermon ${sermon.video_id}...`);
      
      const url = `${API_URL}/sermons/${sermon.video_id}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        console.error(`Error fetching sermon ${sermon.video_id}:`, response.status, response.statusText);
        continue;
      }
      
      const sermonData = await response.json();
      console.log(`Successfully fetched sermon ${sermon.video_id} with ${sermonData.chunks?.length || 0} chunks`);
      
      if (sermonData.chunks && Array.isArray(sermonData.chunks)) {
        allChunks.push(...sermonData.chunks);
      } else {
        console.warn(`No chunks found for sermon ${sermon.video_id}`);
      }
    } catch (error) {
      console.error(`Error fetching sermon ${sermon.video_id}:`, error);
    }
  }
  
  console.log(`Total chunks collected: ${allChunks.length}`);
  return allChunks;
}

/**
 * Analyze Bible references in sermon chunks
 */
function analyzeBibleReferences(chunks) {
  // Regular expression to match Bible references
  const bibleRefPattern = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+(\d+)(?::(\d+)(?:-(\d+))?)?/gi;
  
  const bookCount = {};
  const chapterCount = {};
  const verseCount = {};
  const testamentCount = {
    'Old Testament': 0,
    'New Testament': 0
  };
  
  let totalReferences = 0;
  
  // Process each chunk
  chunks.forEach(chunk => {
    const text = chunk.text || '';
    const matches = [...text.matchAll(bibleRefPattern)];
    
    matches.forEach(match => {
      totalReferences++;
      
      // Standardize book name (capitalize properly)
      let book = match[1].replace(/\b\w/g, c => c.toUpperCase());
      if (book === 'Psalm') book = 'Psalms'; // Standardize Psalm/Psalms
      
      // Count book references
      bookCount[book] = (bookCount[book] || 0) + 1;
      
      // Count testament references
      if (bibleBooks.oldTestament.includes(book)) {
        testamentCount['Old Testament']++;
      } else {
        testamentCount['New Testament']++;
      }
      
      // If chapter is specified
      if (match[2]) {
        const chapter = match[2];
        const chapterKey = `${book} ${chapter}`;
        chapterCount[chapterKey] = (chapterCount[chapterKey] || 0) + 1;
        
        // If verse is specified
        if (match[3]) {
          const verse = match[3];
          const verseKey = `${book} ${chapter}:${verse}`;
          verseCount[verseKey] = (verseCount[verseKey] || 0) + 1;
          
          // If verse range
          if (match[4]) {
            // We could process verse ranges, but we'll keep it simple for now
          }
        }
      }
    });
  });
  
  return {
    totalReferences,
    bookCount,
    chapterCount,
    verseCount,
    testamentCount
  };
}

// Rest of your analytics functions...
// (I'll skip including them all to save space, but make sure they're all in your final file)

/**
 * Helper function to determine book category
 */
function getBookCategory(book) {
  if (bibleBooks.oldTestament.includes(book)) return 'oldTestament';
  if (bibleBooks.gospels.includes(book)) return 'gospels';
  if (bibleBooks.epistles.includes(book)) return 'epistles';
  return 'other';
}

/**
 * Helper function to get color by book
 */
function getBookColor(book) {
  const category = getBookCategory(book);
  return chartColors[category];
}

/**
 * Create Bible books chart
 */
function createBibleBooksChart(bookCount) {
  const canvas = document.getElementById('bibleReferencesChart');
  
  // If no data or no canvas, return
  if (!canvas || Object.keys(bookCount).length === 0) {
    return;
  }
  
  // Sort books by reference count
  const sortedBooks = Object.entries(bookCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // Top 15 books
  
  const labels = sortedBooks.map(item => item[0]);
  const data = sortedBooks.map(item => item[1]);
  const backgroundColors = labels.map(book => getBookColor(book));
  
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'References',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `References: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

/**
 * Create testament distribution chart
 */
function createTestamentChart(testamentCount) {
  const canvas = document.getElementById('testamentChart');
  
  // If no data or no canvas, return
  if (!canvas || !testamentCount || Object.values(testamentCount).every(v => v === 0)) {
    return;
  }
  
  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: Object.keys(testamentCount),
      datasets: [{
        data: Object.values(testamentCount),
        backgroundColor: [
          chartColors.oldTestament,
          chartColors.other
        ],
        borderColor: [
          chartColors.oldTestament.replace('0.7', '1'),
          chartColors.other.replace('0.7', '1')
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Display top chapters
 */
function displayTopChapters(chapterCount) {
  const container = document.getElementById('topChaptersList');
  
  if (!container) return;
  
  // Sort chapters by reference count
  const topChapters = Object.entries(chapterCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 chapters
  
  if (topChapters.length === 0) {
    container.innerHTML = '<p class="text-center py-4">No chapter data available</p>';
    return;
  }
  
  let html = '';
  
  topChapters.forEach(([chapter, count]) => {
    html += `
      <div class="reference-item">
        <span class="reference-book">${chapter}</span>
        <span class="reference-count">${count}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Display recent sermons
 */
function displayRecentSermons(sermons) {
  const container = document.getElementById('recentSermonsContainer');
  
  if (!container) return;
  
  if (!sermons || sermons.length === 0) {
    container.innerHTML = '<p class="text-center py-4">No sermons available</p>';
    return;
  }
  
  // Only show up to 5 most recent sermons
  const recentSermons = sermons.slice(0, 5);
  
  let html = '<div class="sermon-list">';
  
  recentSermons.forEach(sermon => {
    // Format date if available
    let dateStr = 'Date unknown';
    if (sermon.publish_date) {
      try {
        const date = new Date(sermon.publish_date);
        dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) {
        dateStr = sermon.publish_date;
      }
    }
    
    html += `
      <div class="sermon-item">
        <div class="sermon-info">
          <h3 class="sermon-title">${sermon.title}</h3>
          <p class="sermon-date">${dateStr}</p>
        </div>
        <a href="${sermon.url}" target="_blank" class="btn">Watch on YouTube</a>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}