// app1/pages/api/fetch-service-content.js (NEW FILE)
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
    
    // Fetch the complete page content from the service
    const serviceUrl = `${baseUrl}/${path}`;
    console.log(`Fetching content from: ${serviceUrl}`);
    
    const response = await axios.get(serviceUrl, { 
      timeout: 10000,
      headers: {
        'Accept': 'text/html,application/json',
      }
    });
    
    // Return the content with service info
    res.status(200).json({
      service: service,
      content: response.data,
      contentType: response.headers['content-type'],
      status: 'success',
      sourceUrl: serviceUrl
    });
    
  } catch (error) {
    console.error(`Error fetching content from ${service}:`, error.message);
    res.status(500).json({ 
      error: `Failed to fetch content from ${service}`, 
      details: error.message,
      service: service
    });
  }
}
