import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [services, setServices] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/services');
      console.log('Services response:', response.data);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const callService = async (serviceName) => {
    try {
      setResponses(prev => ({
        ...prev,
        [serviceName]: { loading: true }
      }));
      
      const response = await axios.get(`/api/call-service?service=${serviceName}`);
      setResponses(prev => ({
        ...prev,
        [serviceName]: response.data
      }));
    } catch (error) {
      console.error(`Error calling ${serviceName}:`, error);
      setResponses(prev => ({
        ...prev,
        [serviceName]: { error: error.response?.data?.error || error.message }
      }));
    }
  };

  const registerService = async () => {
    try {
      const response = await axios.get('/api/register');
      alert('Service registered: ' + response.data.message);
      fetchServices(); // Refresh services after registration
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Next.js App1 - Service Discovery Demo</h1>
      <p>This is App1 running on port 3001</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={registerService} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Register This Service
        </button>
        <button onClick={fetchServices} style={{ padding: '8px 16px' }}>
          {loading ? 'Loading...' : 'Refresh Services'}
        </button>
      </div>
      
      <h2>Available Services:</h2>
      {loading ? (
        <p>Loading services...</p>
      ) : services.length === 0 ? (
        <p>No services found. Make sure to register services first.</p>
      ) : (
        <div>
          {services.map((service, index) => (
            <div key={service.ServiceID || index} style={{ 
              margin: '10px 0', 
              padding: '15px', 
              border: '1px solid #ccc',
              borderRadius: '5px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>Service:</strong> {service.ServiceName} <br />
                <strong>ID:</strong> {service.ServiceID} <br />
                <strong>Address:</strong> {service.ServiceAddress || service.Address}:{service.ServicePort} <br />
                <strong>Node:</strong> {service.Node}
              </div>
              
              <button 
                onClick={() => callService(service.ServiceName)} 
                style={{ 
                  padding: '5px 10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Call Service
              </button>
              
              {responses[service.ServiceName] && (
                <div style={{ marginTop: '10px' }}>
                  {responses[service.ServiceName].loading ? (
                    <p>Calling service...</p>
                  ) : (
                    <pre style={{ 
                      background: responses[service.ServiceName].error ? '#ffe6e6' : '#e6ffe6', 
                      padding: '10px', 
                      borderRadius: '3px',
                      fontSize: '12px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(responses[service.ServiceName], null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
