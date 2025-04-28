---
---
/**
 * Optimized sermon analytics using pre-computed data
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
const timeFilterSelect = document.getElementById('timeFilterSelect');

// Chart instances for updating
let bibleReferencesChart = null;
let testamentChart = null;

// Data storage
let analyticsData = {
  summary: null,
  books: null,
  chapters: null,
  verses: null,
  sermons: null,
  timeGrouping: null
};

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeAnalytics);
if (retryButton) {
  retryButton.addEventListener('click', initializeAnalytics);
}
if (timeFilterSelect) {
  timeFilterSelect.addEventListener('change', updateVisualizations);
}

/**
 * Initialize analytics by loading precomputed data
 */
async function initializeAnalytics() {
  // Show loading, hide other sections
  loadingSection.style.display = 'block';
  analyticsContent.style.display = 'none';
  errorSection.style.display = 'none';
  
  try {
    // Load all the pre-computed JSON files
    await Promise.all([
      loadAnalyticsFile('summary', '/assets/data/analytics/summary.json'),
      loadAnalyticsFile('books', '/assets/data/analytics/books.json'),
      loadAnalyticsFile('chapters', '/assets/data/analytics/chapters.json'),
      loadAnalyticsFile('verses', '/assets/data/analytics/verses.json'),
      loadAnalyticsFile('sermons', '/assets/data/analytics/sermons.json'),
      loadAnalyticsFile('timeGrouping', '/assets/data/analytics/time_grouping.json')
    ]);
    
    console.log('All analytics data loaded successfully');
    
    // Initialize time filter options
    initializeTimeFilter();
    
    // Display initial visualizations
    updateVisualizations();
    
    // Display everything
    loadingSection.style.display = 'none';
    analyticsContent.style.display = 'block';
    
  } catch (error) {
    console.error('Error loading analytics data:', error);
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
 * Load a specific analytics JSON file
 */
async function loadAnalyticsFile(key, url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${key} data (${response.status})`);
    }
    
    analyticsData[key] = await response.json();
    console.log(`Loaded ${key} data:`, analyticsData[key]);
    return analyticsData[key];
  } catch (error) {
    console.error(`Error loading ${key} data:`, error);
    throw error;
  }
}

/**
 * Initialize time filter dropdown options
 */
function initializeTimeFilter() {
  if (!timeFilterSelect || !analyticsData.timeGrouping) return;
  
  // Clear existing options
  timeFilterSelect.innerHTML = '<option value="all">All Time</option>';
  
  // Add year options
  const years = Object.keys(analyticsData.timeGrouping.by_year).sort().reverse();
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = `year-${year}`;
    option.textContent = `Year: ${year}`;
    timeFilterSelect.appendChild(option);
  });
  
  // Add month options
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Add month options (for filtering across years)
  Object.keys(analyticsData.timeGrouping.by_month).sort().forEach(month => {
    const option = document.createElement('option');
    option.value = `month-${month}`;
    option.textContent = `Month: ${months[parseInt(month) - 1]}`;
    timeFilterSelect.appendChild(option);
  });
  
  // Add year-month options
  Object.keys(analyticsData.timeGrouping.by_year_month).sort().reverse().forEach(yearMonth => {
    const [year, month] = yearMonth.split('-');
    const option = document.createElement('option');
    option.value = `year-month-${yearMonth}`;
    option.textContent = `${months[parseInt(month) - 1]} ${year}`;
    timeFilterSelect.appendChild(option);
  });
}

/**
 * Update all visualizations based on the current time filter
 */
function updateVisualizations() {
  // Update summary stats
  updateSummaryStats();
  
  // Get filtered data based on selected time period
  const filteredData = getFilteredData();
  
  // Update charts with filtered data
  updateBibleBooksChart(filteredData.books);
  updateTestamentChart(filteredData.testament);
  updateTopChapters(filteredData.chapters);
  updateRecentSermons(filteredData.sermons);
}

/**
 * Get filtered data based on the current time filter selection
 */
function getFilteredData() {
  // Default to all data
  let filteredBooks = analyticsData.books;
  let filteredChapters = analyticsData.chapters;
  let filteredSermons = Object.values(analyticsData.sermons).sort((a, b) => {
    return new Date(b.publish_date) - new Date(a.publish_date);
  });
  
  // Calculate testament totals
  const testament = {
    'Old Testament': 0,
    'New Testament': 0
  };
  
  Object.entries(filteredBooks).forEach(([book, count]) => {
    if (bibleBooks.oldTestament.includes(book)) {
      testament['Old Testament'] += count;
    } else {
      testament['New Testament'] += count;
    }
  });
  
  // If a time filter is selected
  if (timeFilterSelect && timeFilterSelect.value !== 'all') {
    const filterValue = timeFilterSelect.value;
    
    // Get sermon IDs for the selected time period
    let filteredSermonIds = [];
    
    if (filterValue.startsWith('year-')) {
      const year = filterValue.replace('year-', '');
      filteredSermonIds = analyticsData.timeGrouping.by_year[year] || [];
    } else if (filterValue.startsWith('month-')) {
      const month = filterValue.replace('month-', '');
      filteredSermonIds = analyticsData.timeGrouping.by_month[month] || [];
    } else if (filterValue.startsWith('year-month-')) {
      const yearMonth = filterValue.replace('year-month-', '');
      filteredSermonIds = analyticsData.timeGrouping.by_year_month[yearMonth] || [];
    }
    
    // Filter sermons
    filteredSermons = Object.entries(analyticsData.sermons)
      .filter(([id, _]) => filteredSermonIds.includes(id))
      .map(([_, data]) => data)
      .sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date));
    
    // TODO: In a full implementation, we would have pre-computed analytics for each time period
    // For now, we'll just return the full dataset regardless of filter
    // In a real implementation, you'd have separate JSON files for each time period
  }
  
  return {
    books: filteredBooks,
    chapters: filteredChapters, 
    testament: testament,
    sermons: filteredSermons.slice(0, 5) // Limit to 5 most recent
  };
}

/**
 * Update summary statistics
 */
function updateSummaryStats() {
  if (!analyticsData.summary) return;
  
  document.getElementById('totalSermonsValue').textContent = analyticsData.summary.total_sermons;
  document.getElementById('totalReferencesValue').textContent = analyticsData.summary.total_references;
  
  // Get the most referenced book
  const topBooks = analyticsData.summary.top_books;
  const topBook = Object.keys(topBooks)[0];
  document.getElementById('topBookValue').textContent = topBook || 'N/A';
}

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
 * Update Bible books chart
 */
function updateBibleBooksChart(booksData) {
  const canvas = document.getElementById('bibleReferencesChart');
  
  // If no data or no canvas, return
  if (!canvas || !booksData || Object.keys(booksData).length === 0) {
    return;
  }
  
  // Sort books by reference count
  const sortedBooks = Object.entries(booksData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15); // Top 15 books
  
  const labels = sortedBooks.map(item => item[0]);
  const data = sortedBooks.map(item => item[1]);
  const backgroundColors = labels.map(book => getBookColor(book));
  
  // Destroy existing chart if it exists
  if (bibleReferencesChart) {
    bibleReferencesChart.destroy();
  }
  
  // Create new chart
  bibleReferencesChart = new Chart(canvas, {
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
      },
      onClick: (event, elements) => {
        if (elements && elements.length > 0) {
          const index = elements[0].index;
          const book = labels[index];
          // Navigate to the reference viewer
          window.location.href = `/reference-viewer.html?reference=${encodeURIComponent(book)}`;
        }
      }
    }
  });
  
  // Add click instruction
  const container = canvas.parentElement;
  if (container && !document.getElementById('chart-instruction')) {
    const instruction = document.createElement('div');
    instruction.id = 'chart-instruction';
    instruction.className = 'chart-instruction';
    instruction.textContent = 'Click on a bar to see all occurrences of that book in sermons';
    container.appendChild(instruction);
  }
}

/**
 * Update testament distribution chart
 */
function updateTestamentChart(testament) {
  const canvas = document.getElementById('testamentChart');
  
  // If no data or no canvas, return
  if (!canvas || !testament) {
    return;
  }
  
  // Destroy existing chart if it exists
  if (testamentChart) {
    testamentChart.destroy();
  }
  
  // Create new chart
  testamentChart = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: Object.keys(testament),
      datasets: [{
        data: Object.values(testament),
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
 * Update top chapters list
 */
function updateTopChapters(chaptersData) {
  const container = document.getElementById('topChaptersList');
  
  if (!container || !chaptersData) return;
  
  // Sort chapters by reference count
  const topChapters = Object.entries(chaptersData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // Top 10 chapters
  
  if (topChapters.length === 0) {
    container.innerHTML = '<p class="text-center py-4">No chapter data available</p>';
    return;
  }
  
  let html = '';
  
  topChapters.forEach(([chapter, count]) => {
    html += `
      <div class="reference-item" onclick="window.location.href='/reference-viewer.html?reference=${encodeURIComponent(chapter)}'">
        <span class="reference-book">${chapter}</span>
        <span class="reference-count">${count}</span>
        <span class="view-link">View occurrences →</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Add instruction above the list if not already present
  const parentContainer = container.parentElement;
  if (parentContainer && !document.getElementById('chapters-instruction')) {
    const instruction = document.createElement('div');
    instruction.id = 'chapters-instruction';
    instruction.className = 'list-instruction';
    instruction.textContent = 'Click on a chapter to see all occurrences in sermons';
    parentContainer.insertBefore(instruction, container);
  }
}

/**
 * Update recent sermons list
 */
function updateRecentSermons(sermons) {
  const container = document.getElementById('recentSermonsContainer');
  
  if (!container) return;
  
  if (!sermons || sermons.length === 0) {
    container.innerHTML = '<p class="text-center py-4">No sermons available</p>';
    return;
  }
  
  let html = '<div class="sermon-list">';
  
  sermons.forEach(sermon => {
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