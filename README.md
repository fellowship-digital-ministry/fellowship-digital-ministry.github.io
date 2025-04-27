# Fellowship Baptist Church Sermon Library

This repository contains the Jekyll-based frontend for the Fellowship Baptist Church Sermon Library, designed to be deployed on GitHub Pages.

## Overview

The Sermon Library provides a searchable collection of sermon transcripts and videos from the church's YouTube channel. It features:

- Full-text search of sermon content
- AI-powered question answering
- Video playback with synchronized transcripts
- Topic and scripture-based organization

## Project Structure

- `_data/`: Configuration files for navigation and site settings
- `_includes/`: Reusable HTML components
- `_layouts/`: Page templates
- `_sass/`: SCSS stylesheets
- `assets/`: Static files (CSS, JavaScript, images)
- `pages/`: Additional content pages
- Various root HTML files for main pages

## Setup Instructions

### Prerequisites

- [Ruby](https://www.ruby-lang.org/en/downloads/) (2.7.0 or higher)
- [Bundler](https://bundler.io/)
- [Git](https://git-scm.com/)

### Local Development

1. Clone this repository:
   ```
   git clone https://github.com/your-username/fellowship-sermon-library.git
   cd fellowship-sermon-library
   ```

2. Install dependencies:
   ```
   bundle install
   ```

3. Start the Jekyll development server:
   ```
   bundle exec jekyll serve
   ```

4. Visit `http://localhost:4000` in your browser to view the site.

### Configuration

- Update site settings in `_config.yml`
- Modify church information in `_data/site_settings.yml`
- Edit navigation menus in `_data/navigation.yml`

## Deployment to GitHub Pages

1. Create a new GitHub repository for your site.

2. Update the repository settings:
   - Go to the repository's "Settings" tab
   - Navigate to "Pages"
   - Select the branch you want to deploy (usually `main` or `master`)
   - Save the settings

3. Push your changes to GitHub:
   ```
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. GitHub will automatically build and deploy your site. You can find the URL in the "Pages" section of your repository settings.

## Connecting to the API

The frontend connects to the sermon API deployed at `https://sermon-search-api-8fok.onrender.com`. If you need to change the API endpoint, update it in the following files:

- `_config.yml`: Update the `sermon_api.base_url` value
- JavaScript files where the API URL is directly referenced

## Adding Content

New sermons will be automatically added to the library through the backend pipeline, which:
1. Monitors the YouTube channel for new uploads
2. Downloads and transcribes new sermons
3. Processes them into searchable chunks
4. Adds them to the vector database

No manual content management is required for the Jekyll site.

## Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Backend API Documentation](https://sermon-search-api-8fok.onrender.com/docs)

## License

This project is licensed under the terms specified in the LICENSE file.