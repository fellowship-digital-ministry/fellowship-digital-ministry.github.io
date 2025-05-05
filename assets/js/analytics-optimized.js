/**
 * Bible Reference Analytics - Optimized for Jekyll
 * This script powers the Bible reference analytics dashboard
 */

// Global configuration
const API_BASE_URL = window.location.hostname === 'fellowship-digital-ministry.github.io' 
  ? 'https://sermon-search-api-8fok.onrender.com' // Use your actual API endpoint
  : 'http://localhost:8000';

// Chart color scheme - matches Fellowship branding
const CHART_COLORS = {
  primary: '#2284c5',
  secondary: '#641c14',
  light: 'rgba(34, 132, 197, 0.7)',
  veryLight: 'rgba(34, 132, 197, 0.3)',
  oldTestament: '#641c14',
  newTestament: '#2284c5',
  border: 'rgba(200, 200, 200, 0.75)'
};

// Bible books in canonical order for consistent display
const BIBLE_BOOKS_ORDER = [
  // Old Testament
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", 
  "1_Samuel", "2_Samuel", "1_Kings", "2_Kings", "1_Chronicles", "2_Chronicles", "Ezra", 
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song_of_Solomon", 
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", 
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  // New Testament
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1_Corinthians", "2_Corinthians", 
  "Galatians", "Ephesians", "Philippians", "Colossians", "1_Thessalonians", "2_Thessalonians", 
  "1_Timothy", "2_Timothy", "Titus", "Philemon", "Hebrews", "James", "1_Peter", "2_Peter", 
  "1_John", "2_John", "3_John", "Jude", "Revelation"
];

// Global state
let bibleData = null;
let timeFilter = 'all';
let charts = {}; // Store chart instances for potential updates

/**
 * Initialize the analytics dashboard
 */
async function initializeAnalytics() {
  try {
    // Show loading state
    const loadingSection = document.getElementById('loadingSection');
    const analyticsContent = document.getElementById('analyticsContent');
    const errorSection = document.getElementById('errorSection');
    
    if (loadingSection) loadingSection.style.display = 'block';
    if (analyticsContent) analyticsContent.style.display = 'none';
    if (errorSection) errorSection.style.display = 'none';
    
    // Fetch Bible reference statistics
    bibleData = await fetchBibleStats();
    
    // Initialize time filter options
    initializeTimeFilters();
    
    // Initialize dashboard components
    updateKeyStatistics();
    createBibleBooksChart();
    createTestamentChart();
    displayTopChapters();
    
    // Also load recent sermons (already implemented in your template)
    loadRecentSermons();
    
    // Hide loading state, show content
    if (loadingSection) loadingSection.style.display = 'none';
    if (analyticsContent) analyticsContent.style.display = 'block';
  } catch (error) {
    console.error('Error initializing analytics:', error);
    
    // Still hide loading indicator
    if (document.getElementById('loadingSection')) {
      document.getElementById('loadingSection').style.display = 'none';
    }
    
    // Show error section if it exists
    if (document.getElementById('errorSection')) {
      document.getElementById('errorSection').style.display = 'block';
      
      // Update error message if the element exists
      const errorMessage = document.getElementById('errorMessage');
      if (errorMessage) {
        errorMessage.textContent = `Error loading analytics data: ${error.message}`;
      }
      
      // Update error stack if the element exists
      const errorStack = document.getElementById('errorStack');
      if (errorStack) {
        errorStack.textContent = error.stack || 'No stack trace available';
      }
    }
  }
}

/**
 * Fetch Bible reference statistics from the API, with demonstration data fallback
 */
async function fetchBibleStats() {
  try {
    console.log(`Fetching Bible stats from ${API_BASE_URL}/bible/stats`);
    const response = await fetch(`${API_BASE_URL}/bible/stats`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('Successfully fetched Bible stats:', data);
      return {
        ...data,
        isReal: true
      };
    } else {
      console.warn(`API error: ${data.detail || 'Unknown error'}`);
      throw new Error(data.detail || 'Failed to fetch Bible stats');
    }
  } catch (error) {
    console.error('Using demonstration data due to API error:', error);
    
    // Return clearly marked demonstration data
    return {
      total_references: 1823,
      old_testament_count: 743,
      new_testament_count: 1080,
      top_books: [
        { book: "Matthew", count: 257 },
        { book: "John", count: 189 },
        { book: "Romans", count: 165 },
        { book: "Psalms", count: 143 },
        { book: "Genesis", count: 102 }
      ],
      top_chapters: [
        { book: "John", chapter: "3", count: 45 },
        { book: "Romans", chapter: "8", count: 32 },
        { book: "Genesis", chapter: "1", count: 28 }
      ],
      isDemo: true  // Flag to indicate this is demonstration data
    };
  }
}

/**
 * Initialize time filter dropdown
 */
function initializeTimeFilters() {
  const timeFilterSelect = document.getElementById('timeFilterSelect');
  if (!timeFilterSelect) {
    console.warn('Time filter select element not found');
    return;
  }
  
  // Add default all time option (already in HTML)
  
  // Add year options - last 3 years
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= currentYear - 2; year--) {
    const option = document.createElement('option');
    option.value = `year_${year}`;
    option.textContent = `${year}`;
    timeFilterSelect.appendChild(option);
  }
  
  // Add period options
  const periods = [
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_30_days', label: 'Last 30 Days' }
  ];
  
  periods.forEach(period => {
    const option = document.createElement('option');
    option.value = period.value;
    option.textContent = period.label;
    timeFilterSelect.appendChild(option);
  });
  
  // Add event listener for filter changes
  timeFilterSelect.addEventListener('change', handleTimeFilterChange);
}

/**
 * Handle time filter change events
 */
function handleTimeFilterChange(event) {
  timeFilter = event.target.value;
  
  // Update all visualizations with the new filter
  updateKeyStatistics();
  updateCharts();
  displayTopChapters();
}

/**
 * Update key statistics section with latest data
 */
function updateKeyStatistics() {
  if (!bibleData) return;
  
  // Check if using demo data
  if (bibleData.isDemo) {
    // Add a demo data notice to the page
    const analyticsContent = document.getElementById('analyticsContent');
    if (analyticsContent) {
      // Only add the notice if it doesn't already exist
      if (!document.getElementById('demoDataNotice')) {
        const notice = document.createElement('div');
        notice.id = 'demoDataNotice';
        notice.className = 'demo-data-notice';
        notice.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Displaying demonstration data. The API endpoint <code>/bible/stats</code> is not working correctly. Check your server logs for errors.</span>
        `;
        analyticsContent.insertBefore(notice, analyticsContent.firstChild);
      }
    }
  }
  
  // Update statistics with animation
  const totalSermonsElement = document.getElementById('totalSermonsValue');
  const totalReferencesElement = document.getElementById('totalReferencesValue');
  const topBookElement = document.getElementById('topBookValue');
  
  if (totalSermonsElement) {
    animateCounter(totalSermonsElement, 0, 429); // Placeholder sermon count
  }
  
  if (totalReferencesElement) {
    animateCounter(totalReferencesElement, 0, bibleData.total_references);
  }
  
  // Find top book
  if (topBookElement && bibleData.top_books && bibleData.top_books.length > 0) {
    const topBook = bibleData.top_books[0];
    topBookElement.textContent = formatBookName(topBook.book);
  } else if (topBookElement) {
    topBookElement.textContent = 'N/A';
  }
}

/**
 * Create the Bible Books chart visualization
 */
function createBibleBooksChart() {
  if (!bibleData || !bibleData.top_books) {
    console.error('No Bible data available for chart');
    return;
  }
  
  const chartCanvas = document.getElementById('bibleReferencesChart');
  if (!chartCanvas) {
    console.error('Chart canvas element not found');
    return;
  }
  
  const ctx = chartCanvas.getContext('2d');
  if (!ctx) {
    console.error('Unable to get canvas context');
    return;
  }
  
  // Prepare data for the chart - using top 15 books for readability
  const topBooks = bibleData.top_books.slice(0, 15);
  
  const chartData = {
    labels: topBooks.map(book => formatBookName(book.book)),
    datasets: [{
      label: 'References',
      data: topBooks.map(book => book.count),
      backgroundColor: CHART_COLORS.light,
      borderColor: CHART_COLORS.primary,
      borderWidth: 1,
      borderRadius: 4,
      maxBarThickness: 50
    }]
  };
  
  // Also update the data table if it exists
  updateDataTable(topBooks);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Horizontal bar chart
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.raw} references`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.2)'
        },
        ticks: {
          precision: 0
        }
      },
      y: {
        grid: {
          display: false
        }
      }
    },
    onClick: function(event, elements) {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const bookName = topBooks[index].book;
        // Navigate to book details page
        window.location.href = `reference-viewer.html?ref=${bookName}`;
      }
    },
    animation: {
      duration: 1000
    }
  };
  
  // Create and store chart instance for potential updates
  charts.bibleBooks = new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: options
  });
}

/**
 * Update the data table with book references
 */
function updateDataTable(topBooks) {
  const tableBodyElement = document.getElementById('bookDataTableBody');
  if (!tableBodyElement) return;
  
  let tableHtml = '';
  
  topBooks.forEach(book => {
    const formattedBook = formatBookName(book.book);
    tableHtml += `
      <tr>
        <td>${formattedBook}</td>
        <td>${book.count}</td>
        <td>
          <a href="reference-viewer.html?ref=${book.book}" class="btn btn-sm">View References</a>
        </td>
      </tr>
    `;
  });
  
  tableBodyElement.innerHTML = tableHtml;
}

/**
 * Create the Testament distribution pie chart
 */
function createTestamentChart() {
  if (!bibleData) {
    console.error('No Bible data available for testament chart');
    return;
  }
  
  const ctx = document.getElementById('testamentChart');
  if (!ctx) {
    console.error('Testament chart canvas not found');
    return;
  }
  
  const chartData = {
    labels: ['Old Testament', 'New Testament'],
    datasets: [{
      data: [bibleData.old_testament_count, bibleData.new_testament_count],
      backgroundColor: [CHART_COLORS.oldTestament, CHART_COLORS.newTestament],
      borderColor: CHART_COLORS.border,
      borderWidth: 1
    }]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            const total = bibleData.total_references;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${value} references (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    }
  };
  
  // Create and store chart instance for potential updates
  charts.testament = new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: options
  });
  
  // Update the text summary
  updateTestamentSummary(bibleData.old_testament_count, bibleData.new_testament_count, bibleData.total_references);
}

/**
 * Update testament percentages summary text
 */
function updateTestamentSummary(oldCount, newCount, total) {
  const summaryElement = document.getElementById('testamentPercentages');
  if (!summaryElement) return;
  
  const oldPct = ((oldCount / total) * 100).toFixed(1);
  const newPct = ((newCount / total) * 100).toFixed(1);
  
  summaryElement.innerHTML = `
    <strong>Old Testament:</strong> ${oldCount} references (${oldPct}%) | 
    <strong>New Testament:</strong> ${newCount} references (${newPct}%)
  `;
}

/**
 * Display top chapters in a list format
 */
function displayTopChapters() {
  if (!bibleData || !bibleData.top_chapters) {
    console.warn('No top chapters data available');
    return;
  }
  
  const container = document.getElementById('topChaptersList');
  if (!container) {
    console.warn('Top chapters list container not found');
    return;
  }
  
  container.innerHTML = ''; // Clear existing content
  
  // Create items for each top chapter
  bibleData.top_chapters.forEach(item => {
    const referenceItem = document.createElement('div');
    referenceItem.className = 'reference-item';
    referenceItem.setAttribute('tabindex', '0'); // Make focusable for keyboard navigation
    
    const formattedReference = `${formatBookName(item.book)} ${item.chapter}`;
    
    referenceItem.innerHTML = `
      <span class="reference-book">${formattedReference}</span>
      <span class="reference-count">${item.count}</span>
      <a href="reference-viewer.html?ref=${item.book}_${item.chapter}" class="view-link">
        View All <i class="fa fa-arrow-right"></i>
      </a>
    `;
    
    // Add click handler for the entire item
    referenceItem.addEventListener('click', function(e) {
      if (!e.target.closest('.view-link')) {
        window.location.href = `reference-viewer.html?ref=${item.book}_${item.chapter}`;
      }
    });
    
    // Add keyboard handler for accessibility
    referenceItem.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = `reference-viewer.html?ref=${item.book}_${item.chapter}`;
      }
    });
    
    container.appendChild(referenceItem);
  });
}

/**
 * Update chart visualizations when filter changes
 */
function updateCharts() {
  if (charts.bibleBooks) {
    charts.bibleBooks.update();
  }
  
  if (charts.testament) {
    charts.testament.update();
  }
}

/**
 * Format a book name for display (convert underscores to spaces)
 */
function formatBookName(bookName) {
  return bookName.replace(/_/g, ' ');
}

/**
 * Animate a counter for better visual engagement
 */
function animateCounter(element, start, end) {
  if (!element) return;
  
  const duration = 1000; // Animation duration in milliseconds
  const frameDuration = 1000 / 60; // 60fps
  const totalFrames = Math.round(duration / frameDuration);
  const countIncrement = (end - start) / totalFrames;
  
  let currentCount = start;
  let frame = 0;
  
  const animate = () => {
    currentCount += countIncrement;
    element.textContent = Math.floor(currentCount).toLocaleString();
    
    if (frame < totalFrames) {
      frame++;
      requestAnimationFrame(animate);
    } else {
      element.textContent = end.toLocaleString();
    }
  };
  
  animate();
}

/**
 * Load recent sermons from the API
 */
function loadRecentSermons() {
  const container = document.getElementById('recentSermonsContainer');
  if (!container) {
    console.warn('Recent sermons container not found');
    return;
  }
  
  fetch(`${API_BASE_URL}/sermons?limit=5`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch recent sermons');
      }
      return response.json();
    })
    .then(data => {
      if (data.sermons && data.sermons.length > 0) {
        // Clear loading indicator
        container.innerHTML = '';
        
        // Create sermon list container
        const sermonList = document.createElement('div');
        sermonList.className = 'sermon-list';
        
        // Add each sermon
        data.sermons.forEach(sermon => {
          const sermonDate = sermon.publish_date 
            ? new Date(sermon.publish_date * 1000).toLocaleDateString()
            : 'Date unknown';
            
          const sermonItem = document.createElement('div');
          sermonItem.className = 'sermon-item';
          
          sermonItem.innerHTML = `
            <div class="sermon-info">
              <h4 class="sermon-title">${sermon.title}</h4>
              <p class="sermon-date">${sermonDate}</p>
            </div>
            <a href="${sermon.url}" target="_blank" class="btn sermon-btn">Watch Sermon</a>
          `;
          
          sermonList.appendChild(sermonItem);
        });
        
        container.appendChild(sermonList);
      } else {
        container.innerHTML = '<p class="text-center">No recent sermons found.</p>';
      }
    })
    .catch(error => {
      console.error('Error loading sermons:', error);
      container.innerHTML = `
        <p class="text-center text-danger">
          Error loading sermon data. Please try again later.
        </p>
      `;
    });
}

/**
 * Initialize print functionality
 */
function initializePrintFunctionality() {
  const printButton = document.getElementById('printAnalytics');
  
  if (printButton) {
    printButton.addEventListener('click', function() {
      // Before printing, expand data tables for better print view
      const chartDataTable = document.getElementById('chartDataTable');
      if (chartDataTable) {
        chartDataTable.hidden = false;
      }
      
      // Add print class to body
      document.body.classList.add('printing');
      
      // Print the page
      window.print();
      
      // After printing, restore the state
      setTimeout(() => {
        document.body.classList.remove('printing');
        
        // Restore state of data table based on button text
        const showTableButton = document.getElementById('showChartDataTable');
        if (showTableButton && showTableButton.textContent.includes('View as')) {
          chartDataTable.hidden = true;
        }
      }, 1000);
    });
  }
}

/**
 * Initialize CSV download
 */
function initializeCSVDownload() {
  const downloadButton = document.getElementById('downloadCSV');
  
  if (downloadButton) {
    downloadButton.addEventListener('click', function() {
      if (!bibleData || !bibleData.top_books) {
        console.error('No Bible data available for CSV export');
        return;
      }
      
      // Create CSV content
      let csvContent = "Book,References\n";
      
      bibleData.top_books.forEach(book => {
        csvContent += `"${formatBookName(book.book)}",${book.count}\n`;
      });
      
      // Create a Blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'bible_references.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}

/**
 * Handle retry button click
 */
document.getElementById('retryButton')?.addEventListener('click', function() {
  initializeAnalytics();
});

/**
 * Toggle data table visibility
 */
document.getElementById('showChartDataTable')?.addEventListener('click', function() {
  const chartDataTable = document.getElementById('chartDataTable');
  if (!chartDataTable) return;
  
  const isHidden = chartDataTable.hidden;
  chartDataTable.hidden = !isHidden;
  this.textContent = isHidden ? 'Hide Data Table' : 'View as Data Table';
});

/**
 * Initialize error details toggle
 */
function initializeErrorDetails() {
  const showErrorDetails = document.getElementById('showErrorDetails');
  const errorDetailsContent = document.getElementById('errorDetailsContent');
  
  if (showErrorDetails && errorDetailsContent) {
    showErrorDetails.addEventListener('click', function() {
      const isHidden = errorDetailsContent.hidden;
      errorDetailsContent.hidden = !isHidden;
      this.textContent = isHidden ? 'Hide Technical Details' : 'Show Technical Details';
    });
  }
}

// When the document is ready, run initialization functions
document.addEventListener('DOMContentLoaded', function() {
  initializeAnalytics();
  initializePrintFunctionality();
  initializeCSVDownload();
  initializeErrorDetails();
});