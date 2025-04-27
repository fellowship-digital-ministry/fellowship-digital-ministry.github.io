# API Troubleshooting Guide

If you're experiencing issues connecting to the Sermon Search API, this guide will help you diagnose and fix common problems.

## Common Issues

### 405 Method Not Allowed Error

If you see a 405 Method Not Allowed error in your browser console (as shown in your screenshot), this indicates that the API endpoint is rejecting the HTTP method you're using. This could be due to:

1. **CORS Configuration**: The API is not configured to accept requests from your domain
2. **Method Restriction**: The API endpoint doesn't support the HTTP method you're using (e.g., POST)
3. **API Changes**: The API endpoint URL or parameters may have changed

### How to Fix

#### 1. Use the API Test Tool

Use the included `api-test.html` file to diagnose API connection issues:

1. Open `api-test.html` in your browser
2. Test the health check endpoint to verify basic connectivity
3. Test the sermons list endpoint
4. Test a search query
5. Check the console for detailed error messages

#### 2. Verify API Endpoint

Make sure you're using the correct API endpoint:

```yaml
# In _config.yml
api_url: "https://sermon-search-api-8fok.onrender.com"  # Without trailing slash
```

#### 3. Check API Documentation

Review the API documentation to ensure you're:

- Using the correct endpoint paths
- Sending the right parameters
- Using the correct HTTP methods

#### 4. CORS Issues

If it's a CORS issue (common with cross-domain API requests), you have a few options:

1. **Contact the API Provider**: Ask them to add your domain to their allowed origins
2. **Use a CORS Proxy** (temporary solution for testing):
   ```javascript
   // Update _config.yml
   api_url: "https://cors-anywhere.herokuapp.com/https://sermon-search-api-8fok.onrender.com"
   ```
3. **Set up a Server-Side Proxy**: Create a simple server-side proxy that forwards requests to the API

#### 5. API Unavailability

The API might be temporarily down or have changed. Check if https://sermon-search-api-8fok.onrender.com is accessible directly in your browser.

## Server-Side Proxy Solution

If CORS continues to be an issue, you can create a simple server-side proxy with Jekyll on GitHub Pages using GitHub Actions:

1. Create a `.github/workflows/proxy.yml` file
2. Set up a GitHub Action that fetches from the API and generates static JSON files
3. Update your JavaScript to fetch from these local JSON files instead

## Testing Directly with cURL

You can test the API directly using cURL to verify it's working outside your web application:

```bash
# Test health endpoint
curl -X GET https://sermon-search-api-8fok.onrender.com/health

# Test sermons endpoint
curl -X GET https://sermon-search-api-8fok.onrender.com/sermons

# Test search endpoint
curl -X POST https://sermon-search-api-8fok.onrender.com/answer \
  -H "Content-Type: application/json" \
  -d '{"query":"What does the pastor teach about faith?","top_k":5,"include_sources":true}'
```

If these commands work but your web application doesn't, it's likely a CORS issue.

## API Configuration Changes

If the API was recently updated, check if the endpoints or parameter format has changed. Common changes include:

- Endpoint path changes (e.g., `/answer` to `/api/answer`)
- Parameter name changes
- Authentication requirements
- Rate limiting

## Contact Information

If you continue to experience issues, contact the API maintainer at the associated Render dashboard or check if there's updated documentation available.