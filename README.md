# Fellowship Digital Ministry

A Jekyll-based GitHub Pages site that serves as a frontend for the Sermon Search API. This project provides a user-friendly interface for searching sermon content and exploring analytics based on the sermon transcripts.

## Features

- **Sermon Search**: Ask questions about sermon content and get AI-generated answers based on the transcript library
- **Video Integration**: Watch relevant sermon segments directly on the site with timestamp linking
- **Analytics Dashboard**: Explore insights about Bible references, most cited verses, and sermon content
- **Mobile Responsive**: Works well on all devices

## Setup and Deployment

### Prerequisites

- A GitHub account
- Basic knowledge of Git and GitHub

### Deployment Steps

1. **Create a new GitHub repository**

   - Go to GitHub and create a new repository named `fellowship-digital-ministry.github.io`
   - This specific name format is required for organization GitHub Pages sites

2. **Clone this repository locally**

   ```bash
   git clone https://github.com/fellowship-digital-ministry/fellowship-digital-ministry.github.io.git
   cd fellowship-digital-ministry.github.io
   ```

3. **Add the files from this project**

   - Copy all files and directories to your local repository, maintaining the Jekyll directory structure:
     ```
     .
     ├── _config.yml
     ├── _layouts
     │   └── default.html
     ├── _includes
     │   ├── header.html
     │   └── footer.html
     ├── assets
     │   ├── css
     │   │   └── style.css
     │   └── js
     │       ├── search.js
     │       └── analytics.js
     ├── index.html
     ├── search.html
     └── analytics.html
     ```

4. **Configure your GitHub Pages settings**

   - In the repository settings, go to the "Pages" section
   - Ensure the source is set to "main" branch and the folder is set to "/ (root)"
   - GitHub Pages will automatically recognize the Jekyll structure

5. **Commit and push your changes**

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

6. **Access your site**

   - Your site will be available at `https://fellowship-digital-ministry.github.io`
   - It may take a few minutes for the site to be published after pushing changes

## Customization

### API Endpoint

The site is configured to use the Sermon Search API at `https://sermon-search-api-8fok.onrender.com`. If you need to update this endpoint:

1. Update the `api_url` setting in `_config.yml`

```yaml
api_url: "https://your-new-api-endpoint.com"
```

### Church Website Link

To update the link to the main church website:

1. Update the `church_website` setting in `_config.yml`

```yaml
church_website: "https://www.your-church-website.com"
```

### Color Scheme and Styling

The site uses CSS variables for consistent styling. To update the color scheme:

1. Open `assets/css/style.css`
2. Locate the `:root` CSS section at the top of the file
3. Modify the color variables to match your desired scheme

```css
:root {
  --color-primary: #2ea3f2; /* Primary accent color */
  --color-bg: #ffffff;      /* Background color */
  --color-bg-dark: #222222; /* Dark background (footer) */
  --color-text: #666666;    /* Main text color */
  --color-heading: #333333; /* Heading text color */
  --color-border: #eeeeee;  /* Border color */
}
```

## Maintenance

### Adding New Pages

To add new pages to the site:

1. Create a new HTML file in the root directory with Jekyll front matter:

```yaml
---
layout: default
title: Your Page Title
hero: true
hero_title: Your Hero Title
hero_description: Your page description goes here.
custom_js: your_js_file  # Optional, if you need custom JS
---

<!-- Your page content here -->
```

2. Add any custom JavaScript to the `assets/js/` directory if needed
3. Link to it from the navigation in `_includes/header.html`

### Jekyll Configuration

The site uses a simple Jekyll configuration with minimal plugins. You can modify the Jekyll configuration in `_config.yml` if needed:

- Update site title and description
- Add additional Jekyll plugins (note that GitHub Pages supports only a limited set of plugins)
- Configure additional Jekyll settings

### Updating the Site

To update the site after making changes:

1. Make your changes locally
2. Commit and push to GitHub
3. GitHub Pages will automatically rebuild and deploy your site

## Technical Details

- The site uses Jekyll for static site generation, which is natively supported by GitHub Pages
- The sermon search and analytics functionality use client-side JavaScript to interact with the API
- Chart.js is used for data visualization on the analytics page
- All API requests are made client-side using JavaScript fetch API
- The site does not require any build process beyond what GitHub Pages automatically provides

## License

This project is provided for the specific use of Fellowship Digital Ministry and is not licensed for general distribution or reuse.