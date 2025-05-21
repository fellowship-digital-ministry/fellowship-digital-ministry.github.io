/**
 * Simple CORS Proxy for local development
 * 
 * Run with: node cors-proxy.js
 * 
 * This creates a local proxy server that forwards requests to the API
 * and adds CORS headers to the responses, allowing your local development
 * site to communicate with the API.
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const PORT = 3000;
const TARGET_API = 'https://sermon-search-api-8fok.onrender.com';

// Create server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Log the request
  console.log(`${req.method} ${req.url}`);
  
  // Parse the request URL
  const reqUrl = url.parse(req.url, true);
  const apiPath = reqUrl.pathname;
  const apiUrl = `${TARGET_API}${apiPath}`;
  
  // Prepare options for the proxied request
  const options = {
    method: req.method,
    headers: { ...req.headers }
  };
  
  // Remove host header to avoid conflicts
  delete options.headers.host;
  
  // Create the request to the API
  const proxyReq = https.request(apiUrl, options, (proxyRes) => {
    // Copy status code
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    
    // Pipe the response directly to our response
    proxyRes.pipe(res, { end: true });
  });
  
  // Handle proxy request errors
  proxyReq.on('error', (error) => {
    console.error('Proxy request error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Proxy request failed', message: error.message }));
  });
  
  // If there's request body data, pipe it to the proxy request
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`CORS Proxy running at http://localhost:${PORT}`);
  console.log(`Proxying requests to ${TARGET_API}`);
  console.log(`To use this proxy, update your API_URL to http://localhost:${PORT}`);
});