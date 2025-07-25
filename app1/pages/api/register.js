const consul = require('consul')({
  host: process.env.CONSUL_HOST || 'localhost',
  port: process.env.CONSUL_PORT || 8500,
  promisify: true
});

export default async function handler(req, res) {
  try {
    const serviceName = process.env.SERVICE_NAME || 'app1';
    const serviceId = process.env.SERVICE_ID || 'app1-instance';
    const servicePort = parseInt(process.env.SERVICE_PORT || '3000');
    
    await consul.agent.service.register({
      id: serviceId,
      name: serviceName,
      port: servicePort,
      address: serviceName, // Use service name as address for container networking
      check: {
        http: `http://${serviceName}:${servicePort}/api/health`,
        interval: '10s',
        timeout: '3s'
      }
    });
    
    console.log(`Service ${serviceName} registered successfully`);
    res.status(200).json({ 
      message: 'Service registered successfully',
      service: serviceName,
      id: serviceId,
      port: servicePort
    });
  } catch (error) {
    console.error('Error registering service:', error);
    res.status(500).json({ error: 'Failed to register service', details: error.message });
  }
}
