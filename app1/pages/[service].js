// app1/pages/[service].js (NEW FILE)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function ServicePage() {
  const router = useRouter();
  const { service } = router.query;
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    if (service) {
      fetchServiceContent();
    }
  }, [service]);

  const fetchServiceContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, check if service is registered
      const servicesResponse = await axios.get('/api/services');
      const availableServices = servicesResponse.data;
      
      const serviceExists = availableServices.some(s => s.ServiceName === service);
      
      if (!serviceExists) {
        throw new Error(`Service '${service}' is not registered with Consul`);
      }

      // Fetch the service's data through our API
      const contentResponse = await axios.get(`/api/fetch-service-content?service=${service}`);
      setServiceData(contentResponse.data);
      
      // Set health status
      if (contentResponse.data.endpoints?.health?.data) {
        setServiceStatus(contentResponse.data.endpoints.health.data);
      }
      
      // Set services list if available
      if (contentResponse.data.endpoints?.services?.data) {
        setServicesList(contentResponse.data.endpoints.services.data);
      }
      
    } catch (error) {
      console.error(`Error loading ${service}:`, error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const callServiceFromProxy = async (serviceName) => {
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

  const registerServiceFromProxy = async () => {
    try {
      // Call the service's register endpoint through our proxy
      const response = await axios.get(`/api/call-service?service=${service}`);
      alert(`Service ${service} is healthy: ` + response.data.message);
      fetchServiceContent(); // Refresh after "registration"
    } catch (error) {
      alert('Health check failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderServiceContent = () => {
    if (!serviceData) return null;

    return (
      <div>
        {/* Service Health Status */}
        {serviceStatus && (
          <div style={{ 
            background: '#d4edda', 
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>
              💓 Service Health Status
            </h3>
            <div style={{ color: '#155724' }}>
              <strong>Service:</strong> {serviceStatus.service}<br/>
              <strong>Status:</strong> {serviceStatus.status}<br/>
              <strong>Message:</strong> {serviceStatus.message}<br/>
              <strong>Timestamp:</strong> {serviceStatus.timestamp}
            </div>
          </div>
        )}

        {/* Recreate the service interface */}
        <div style={{ 
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>
            🔧 Service Management (Proxied through App1)
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button 
              onClick={registerServiceFromProxy}
              style={{ 
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ✅ Check Service Health
            </button>
            <button 
              onClick={fetchServiceContent}
              style={{ 
                padding: '10px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Refresh Service Data
            </button>
          </div>
        </div>

        {/* Available Services (if the service has them) */}
        {servicesList && servicesList.length > 0 && (
          <div>
            <h3 style={{ color: '#495057' }}>🔍 Services Discovered by {service.toUpperCase()}:</h3>
            <div>
              {servicesList.map((svc, index) => (
                <div key={svc.ServiceID || index} style={{ 
                  margin: '10px 0', 
                  padding: '15px', 
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Service:</strong> {svc.ServiceName} <br />
                    <strong>ID:</strong> {svc.ServiceID} <br />
                    <strong>Address:</strong> {svc.ServiceAddress || svc.Address}:{svc.ServicePort} <br />
                    <strong>Node:</strong> {svc.Node}
                  </div>
                  
                  <button 
                    onClick={() => callServiceFromProxy(svc.ServiceName)} 
                    style={{ 
                      padding: '5px 10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    📞 Call Service (via App1)
                  </button>
                  
                  {responses[svc.ServiceName] && (
                    <div style={{ marginTop: '10px' }}>
                      {responses[svc.ServiceName].loading ? (
                        <p>Calling service...</p>
                      ) : (
                        <pre style={{ 
                          background: responses[svc.ServiceName].error ? '#ffe6e6' : '#e6ffe6', 
                          padding: '10px', 
                          borderRadius: '3px',
                          fontSize: '12px',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(responses[svc.ServiceName], null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Service Data */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ color: '#495057' }}>📊 Raw Service Data:</h3>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '5px',
            fontSize: '12px',
            overflow: 'auto',
            border: '1px solid #dee2e6'
          }}>
            {JSON.stringify(serviceData, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => router.push('/')} 
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Main App
          </button>
        </div>
        <h1>🔄 Loading {service} via Consul...</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          marginTop: '20px'
        }}>
          <div style={{ 
            width: '20px', 
            height: '20px', 
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span>Discovering service location...</span>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={() => router.push('/')} 
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Main App
          </button>
        </div>
        
        <div style={{ 
          background: '#ffe6e6', 
          border: '1px solid #ff9999',
          borderRadius: '5px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#cc0000', margin: '0 0 10px 0' }}>
            ❌ Failed to Load Service: {service}
          </h2>
          <p style={{ margin: '0', color: '#660000' }}>{error}</p>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button 
            onClick={fetchServiceContent}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🔄 Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header with navigation */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        padding: '15px 20px', 
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <button 
            onClick={() => router.push('/')} 
            style={{ 
              padding: '8px 16px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '15px'
            }}
          >
            ← Main App
          </button>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            🎯 Loaded via Consul: {service.toUpperCase()}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {serviceStatus && (
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              ✅ {serviceStatus.status}
            </div>
          )}
          
          <button 
            onClick={fetchServiceContent}
            style={{ 
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Service discovery info */}
      <div style={{ 
        background: '#e3f2fd', 
        padding: '15px 20px', 
        borderBottom: '1px solid #bbdefb',
        fontSize: '14px'
      }}>
        <strong>🔍 Service Discovery Info:</strong><br/>
        <div style={{ marginTop: '5px' }}>
          Service: <strong>{serviceData?.service}</strong> | 
          Source: <strong>{serviceData?.baseUrl}</strong> | 
          Status: <strong style={{ color: '#1976d2' }}>{serviceData?.status}</strong> |
          Fetched: <strong>{serviceData?.timestamp}</strong>
        </div>
      </div>

      {/* Service content */}
      <div style={{ padding: '20px' }}>
        <h2>📄 {service.toUpperCase()} Service Interface (Recreated in App1):</h2>
        {serviceData && renderServiceContent()}
      </div>
    </div>
  );
}
