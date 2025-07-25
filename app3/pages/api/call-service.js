const consul = require('consul')({
  host: process.env.CONSUL_HOST || 'localhost',
  port: process.env.CONSUL_PORT || 8500,
  promisify: true
});
const axios = require('axios');

export default async function handler(req, res) {
  const { service } = req.query;
  
  try {
    // Get service instances from catalog
    const services = await consul.catalog.service.nodes(service);
    
    if (!services || services.length === 0) {
      return res.status(404).json({ error: `Service ${service} not found` });
    }
    
    const serviceInstance = services[0];
    const serviceUrl = `http://${serviceInstance.ServiceAddress || serviceInstance.Address}:${serviceInstance.ServicePort}/api/health`;
    
    console.log(`Calling service at: ${serviceUrl}`);
    
    const response = await axios.get(serviceUrl, { timeout: 5000 });
    res.status(200).json(response.data);
  } catch (error) {
    console.error(`Error calling service ${service}:`, error.message);
    res.status(500).json({ error: `Failed to call service ${service}`, details: error.message });
  }
}
