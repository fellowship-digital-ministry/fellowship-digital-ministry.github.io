# Fellowship Digital Ministry

A Jekyll-based GitHub Pages site that provides an interface for exploring sermon content through search and analytics, powered by a Pinecone vector database.

## Features

- **Sermon Search**: Ask questions about sermon content and get AI-generated answers based on the transcript library
- **Video Integration**: Watch relevant sermon segments directly on the site with timestamp linking
- **Bible Reference Explorer**: Click on any Bible reference to see all sermon mentions with context
- **Analytics Dashboard**: Explore insights about Bible references, most cited verses, and sermon content
- **Time Filtering**: Analyze sermons by year, month, or specific time periods
- **Mobile Responsive**: Works well on all devices

## Project Structure

```
.
├── _config.yml               # Jekyll configuration
├── _data/                    # Pre-computed analytics data
│   └── analytics/            # JSON files for analytics
├── _includes/                # Reusable components
│   ├── footer.html
│   └── header.html
├── _layouts/                 # Page templates
│   └── default.html
├── .github/workflows/        # GitHub Actions
│   └── generate-analytics.yml # Weekly analytics generation
├── assets/                   # Static assets
│   ├── css/
│   │   ├── style.css
│   │   └── style-additions.css
│   ├── img/
│   │   └── default-thumbnail.svg
│   └── js/
│       ├── bible-references.js
│       ├── bible-sources-panel.js
│       ├── claude-interface.js
│       ├── enhanced-sermon-chat.js
│       ├── mobile-header.js
│       ├── mobile-keyboard.js
│       └── search.js
├── scripts/                  # Python scripts for data generation
│   ├── generate_analytics.py
│   └── process_existing_metadata.py
├── index.html                # Home page
├── search.html               # Search interface
├── analytics.html            # Analytics dashboard
├── reference-viewer.html     # Bible reference viewer
├── api-test.html             # Tool for API testing
└── API-TROUBLESHOOTING.md    # Guide for API issues
```

## Setup and Deployment

### Prerequisites

- A GitHub account
- The sermon transcripts API endpoint

### Deployment Steps

1. **Create a GitHub repository**

   Create a new repository named `fellowship-digital-ministry.github.io`

2. **Clone this repository**

   ```bash
   git clone https://github.com/fellowship-digital-ministry/fellowship-digital-ministry.github.io.git
   cd fellowship-digital-ministry.github.io
   ```

3. **Configure your API endpoint**

   Update the `api_url` in `_config.yml`:

   ```yaml
   api_url: "https://sermon-search-api-8fok.onrender.com"
   ```

4. **Set up GitHub secrets**

   In your repository settings, add the following secret:
   - `API_URL`: Your sermon search API endpoint

5. **Run the initial analytics generation**

   Manually run the GitHub Action workflow to generate the initial analytics data.

6. **Enable GitHub Pages**

   In repository settings, enable GitHub Pages from the main branch.

7. **Access your site**

   Your site will be available at `https://fellowship-digital-ministry.github.io`

## Analytics Generation

The site uses pre-computed analytics data to efficiently display insights about all 428 sermon transcripts. This data is automatically updated weekly by a GitHub Action workflow:

1. **Process Existing Metadata** (`process_existing_metadata.py`)
   - Fetches sermon metadata from your API
   - Organizes sermon titles, dates, and other information 

2. **Generate Analytics** (`generate_analytics.py`)
   - Analyzes sermon chunks for Bible references
   - Generates statistics for books, chapters, and verses
   - Creates time-based groupings for filtering
   - Builds reference occurrence data for the reference viewer

3. **Data Storage**
   - All data is stored as static JSON files in `_data/analytics/`
   - The site's JavaScript components read from these files
   - No runtime API calls are needed for analytics

## Components

### Search Interface

The search interface allows users to ask questions about sermon content and get AI-generated answers. It makes direct API calls to your Render API endpoint.

### Analytics Dashboard

The analytics dashboard visualizes Bible references across all sermons. Features include:
- Bible book reference chart
- Testament distribution pie chart
- Top chapters list
- Time period filtering

### Bible Reference Explorer

Every Bible reference on the site is clickable and leads to a reference viewer page showing:
- All occurrences of that reference across sermons
- Context in which the reference was mentioned
- Direct links to YouTube videos at the exact timestamp
- Sermon metadata (title, date, etc.)

## Customization

### Styling

To customize the appearance:
1. Edit `assets/css/style.css` for base styles
2. Edit `assets/css/style-additions.css` for component-specific styles

### API Endpoint

If your API endpoint changes:
1. Update `_config.yml`
2. Update GitHub secret `API_URL`

## Troubleshooting

If you encounter API connection issues, refer to `API-TROUBLESHOOTING.md` for guidance on diagnosing and resolving common problems.

## License

This project is provided for the specific use of Fellowship Digital Ministry.