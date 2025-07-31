// app1/pages/index.js (REPLACE EXISTING)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Home() {
  const router = useRouter();
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

  const navigateToService = (serviceName) => {
    router.push(`/${serviceName}`);
  };

  // Filter out the current service (app1) from the list for navigation
  const otherServices = services.filter(service => service.ServiceName !== 'app1');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '10px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
          🚀 Main Application (App1)
        </h1>
        <p style={{ margin: '0', fontSize: '16px', opacity: '0.9' }}>
          Host Application with Dynamic Service Loading via Consul
        </p>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', opacity: '0.8' }}>
          Running on localhost:3001
        </p>
      </div>
      
      {/* Service Management */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: '0', color: '#495057' }}>🔧 Service Management</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={registerService} 
            style={{ 
              padding: '12px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📝 Register This Service
          </button>
          <button 
            onClick={fetchServices} 
            style={{ 
              padding: '12px 20px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? '🔄 Loading...' : '🔍 Refresh Services'}
          </button>
        </div>
      </div>

      {/* Dynamic Service Navigation - This is the KEY FEATURE! */}
      {otherServices.length > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)', 
          padding: '25px', 
          borderRadius: '12px',
          marginBottom: '30px',
          border: '2px solid #81c784'
        }}>
          <h2 style={{ marginTop: '0', color: '#2e7d32', fontSize: '22px' }}>
            🎯 Navigate to Other Services
          </h2>
          <p style={{ marginBottom: '20px', color: '#388e3c', fontSize: '16px' }}>
            <strong>Click to load complete service content dynamically via Consul discovery:</strong>
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {otherServices.map((service, index) => (
              <div key={service.ServiceID || index} style={{
                background: 'white',
                padding: '20px',
                borderRadius: '10px',
                border: '1px solid #c8e6c9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#1b5e20' }}>
                  🔧 {service.ServiceName.toUpperCase()}
                </h3>
                <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#424242' }}>
                  <strong>Address:</strong> {service.ServiceAddress || service.Address}:{service.ServicePort}
                </p>
                
                <button
                  onClick={() => navigateToService(service.ServiceName)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}
                >
                  🚀 Load {service.ServiceName}
                </button>
                
                <div style={{ 
                  marginTop: '10px',
                  padding: '8px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#1565c0',
                  textAlign: 'center'
                }}>
                  <strong>URL:</strong> localhost:3001/{service.ServiceName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Discovery Testing */}
      <div style={{ 
        background: '#fff3cd', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #ffeaa7'
      }}>
        <h2 style={{ marginTop: '0', color: '#856404' }}>
          🔍 Service Discovery Testing
        </h2>
        <p style={{ marginBottom: '15px', color: '#856404' }}>
          Test direct service communication through Consul:
        </p>
        
        {loading ? (
          <p>Loading services...</p>
        ) : services.length === 0 ? (
          <p>No services found. Make sure to register services first.</p>
        ) : (
          <div>
            {services.map((service, index) => (
              <div key={service.ServiceID || index} style={{ 
                margin: '15px 0', 
                padding: '15px', 
                border: '1px solid #ffeaa7',
                borderRadius: '8px',
                backgroundColor: '#fffbf0'
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
                    padding: '8px 15px',
                    backgroundColor: '#fd7e14',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🔍 Test Service Call
                </button>
                
                {responses[service.ServiceName] && (
                  <div style={{ marginTop: '10px' }}>
                    {responses[service.ServiceName].loading ? (
                      <p>Calling service...</p>
                    ) : (
                      <pre style={{ 
                        background: responses[service.ServiceName].error ? '#f8d7da' : '#d4edda', 
                        padding: '10px', 
                        borderRadius: '5px',
                        fontSize: '12px',
                        overflow: 'auto',
                        color: responses[service.ServiceName].error ? '#721c24' : '#155724'
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

      {/* Instructions */}
      <div style={{ 
        background: '#f1f3f4', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #dadce0'
      }}>
        <h3 style={{ marginTop: '0', color: '#5f6368' }}>💡 How This Works:</h3>
        <ol style={{ color: '#5f6368', lineHeight: '1.8' }}>
          <li><strong>Service Registration:</strong> Each service registers itself with Consul</li>
          <li><strong>Dynamic Discovery:</strong> App1 queries Consul to find other services</li>
          <li><strong>Content Loading:</strong> When you click "Load [service]", App1 uses Consul to find the service location</li>
          <li><strong>Dynamic Rendering:</strong> App1 fetches the complete content and renders it at localhost:3001/[service]</li>
          <li><strong>No Hardcoding:</strong> All service locations are discovered dynamically through Consul</li>
        </ol>
        
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#e8f5e8',
          borderRadius: '5px'
        }}>
          <strong style={{ color: '#155724' }}>🎯 Demo URLs:</strong>
          <ul style={{ margin: '5px 0 0 0', color: '#155724' }}>
            <li>localhost:3001 → Main App (this page)</li>
            <li>localhost:3001/app2 → App2 content via Consul</li>
            <li>localhost:3001/app3 → App3 content via Consul</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
