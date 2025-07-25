const consul = require('consul')({
  host: process.env.CONSUL_HOST || 'localhost',
  port: process.env.CONSUL_PORT || 8500,
  promisify: true
});

export default async function handler(req, res) {
  try {
    // Get all services from catalog
    const services = await consul.catalog.service.list();
    
    // Filter out consul service and get service details
    const serviceNames = Object.keys(services).filter(name => name !== 'consul');
    const serviceDetails = [];
    
    for (const serviceName of serviceNames) {
      const instances = await consul.catalog.service.nodes(serviceName);
      serviceDetails.push(...instances);
    }
    
    res.status(200).json(serviceDetails);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services', details: error.message });
  }
}

