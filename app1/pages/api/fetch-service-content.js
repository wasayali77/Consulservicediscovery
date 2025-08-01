// app1/pages/api/fetch-service-content.js (UPDATED FOR FULL PROXYING)
const consul = require('consul')({
  host: process.env.CONSUL_HOST || 'localhost',
  port: process.env.CONSUL_PORT || 8500,
  promisify: true
});
const axios = require('axios');

export default async function handler(req, res) {
  const { service, path = '' } = req.query;
  
  try {
    // Get service instances from Consul
    const services = await consul.catalog.service.nodes(service);
    
    if (!services || services.length === 0) {
      return res.status(404).json({ error: `Service ${service} not found` });
    }
    
    const serviceInstance = services[0];
    const baseUrl = `http://${serviceInstance.ServiceAddress || serviceInstance.Address}:${serviceInstance.ServicePort}`;
    
    // Fetch the complete HTML content from the service's root page
    const serviceUrl = `${baseUrl}/${path}`;
    console.log(`Fetching HTML content from: ${serviceUrl}`);
    
    const response = await axios.get(serviceUrl, { 
      timeout: 10000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    let htmlContent = response.data;
    
    // If it's HTML content, we need to modify asset paths to point to the original service
    if (response.headers['content-type']?.includes('text/html')) {
      // Replace relative paths with absolute paths pointing to the original service
      htmlContent = htmlContent
        // Fix script sources
        .replace(/src="\/([^"]*\.js[^"]*)"/g, `src="${baseUrl}/$1"`)
        .replace(/src='\/([^']*\.js[^']*)'/g, `src='${baseUrl}/$1'`)
        
        // Fix CSS links
        .replace(/href="\/([^"]*\.css[^"]*)"/g, `href="${baseUrl}/$1"`)
        .replace(/href='\/([^']*\.css[^']*)'/g, `href='${baseUrl}/$1'`)
        
        // Fix Next.js specific assets
        .replace(/src="\/_next\//g, `src="${baseUrl}/_next/`)
        .replace(/src='\/_next\//g, `src='${baseUrl}/_next/`)
        .replace(/href="\/_next\//g, `href="${baseUrl}/_next/`)
        .replace(/href='\/_next\//g, `href='${baseUrl}/_next/`)
        
        // Fix API calls - redirect them to the original service
        .replace(/fetch\('\/api\//g, `fetch('${baseUrl}/api/`)
        .replace(/fetch\("\/api\//g, `fetch("${baseUrl}/api/`)
        .replace(/axios\.get\('\/api\//g, `axios.get('${baseUrl}/api/`)
        .replace(/axios\.get\("\/api\//g, `axios.get("${baseUrl}/api/`)
        .replace(/axios\.post\('\/api\//g, `axios.post('${baseUrl}/api/`)
        .replace(/axios\.post\("\/api\//g, `axios.post("${baseUrl}/api/`)
        
        // Fix favicon and other assets
        .replace(/href="\/favicon/g, `href="${baseUrl}/favicon`)
        .replace(/href='\/favicon/g, `href='${baseUrl}/favicon`)
        
        // Add base tag to handle any remaining relative URLs
        .replace(/<head>/i, `<head>\n  <base href="${baseUrl}/" target="_self">`)
        
        // Add CORS headers script to handle cross-origin requests
        .replace(/<\/head>/i, `
  <script>
    // Override fetch to handle CORS
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      if (url.startsWith('/')) {
        url = '${baseUrl}' + url;
      }
      return originalFetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'include'
      });
    };
    
    // Override XMLHttpRequest for axios
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      if (typeof url === 'string' && url.startsWith('/')) {
        url = '${baseUrl}' + url;
      }
      return originalXHROpen.call(this, method, url, ...rest);
    };
  </script>
</head>`);
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Return the modified HTML content directly
    res.status(200).send(htmlContent);
    
  } catch (error) {
    console.error(`Error fetching content from ${service}:`, error.message);
    res.status(500).json({ 
      error: `Failed to fetch content from ${service}`, 
      details: error.message,
      service: service
    });
  }
}
