// app1/pages/[service].js (NEW FILE)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function ServicePage() {
  const router = useRouter();
  const { service } = router.query;
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);

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

      // Fetch the service's main page content
      const contentResponse = await axios.get(`/api/fetch-service-content?service=${service}&path=`);
      setContent(contentResponse.data);
      
      // Get service health status
      const healthResponse = await axios.get(`/api/call-service?service=${service}`);
      setServiceStatus(healthResponse.data);
      
    } catch (error) {
      console.error(`Error loading ${service}:`, error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderServiceContent = (serviceData) => {
    if (!serviceData || !serviceData.content) return null;

    // If it's HTML content, render it in an iframe
    if (serviceData.contentType && serviceData.contentType.includes('text/html')) {
      return (
        <div style={{ width: '100%', height: '80vh' }}>
          <iframe
            srcDoc={serviceData.content}
            width="100%"
            height="100%"
            style={{ border: '1px solid #ddd', borderRadius: '5px' }}
            title={`${service} Content`}
          />
        </div>
      );
    }
    
    // If it's JSON, display it formatted
    if (typeof serviceData.content === 'object') {
      return (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '5px',
          border: '1px solid #ddd'
        }}>
          <h3>Service Response:</h3>
          <pre style={{ overflow: 'auto', fontSize: '14px' }}>
            {JSON.stringify(serviceData.content, null, 2)}
          </pre>
        </div>
      );
    }

    // Default text content
    return (
      <div style={{ 
        background: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '5px',
        border: '1px solid #ddd'
      }}>
        <pre>{serviceData.content}</pre>
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
          Service: <strong>{content?.service}</strong> | 
          Source: <strong>{content?.sourceUrl}</strong> | 
          Status: <strong style={{ color: '#1976d2' }}>{content?.status}</strong>
        </div>
      </div>

      {/* Service content */}
      <div style={{ padding: '20px' }}>
        <h2>📄 Content from {service.toUpperCase()} Service:</h2>
        {content && renderServiceContent(content)}
      </div>
    </div>
  );
}
