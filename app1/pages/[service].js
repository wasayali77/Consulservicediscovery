// app1/pages/[service].js (IFRAME PROXY APPROACH)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function ServicePage() {
  const router = useRouter();
  const { service } = router.query;
  const [serviceInfo, setServiceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (service) {
      findServiceInfo();
    }
  }, [service]);

  const findServiceInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get service info from Consul
      const servicesResponse = await axios.get('/api/services');
      const availableServices = servicesResponse.data;
      
      const serviceFound = availableServices.find(s => s.ServiceName === service);
      
      if (!serviceFound) {
        throw new Error(`Service '${service}' is not registered with Consul`);
      }

      setServiceInfo(serviceFound);
      
    } catch (error) {
      console.error(`Error loading ${service}:`, error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
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
            onClick={findServiceInfo}
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

  if (serviceInfo) {
    const serviceUrl = `http://${serviceInfo.ServiceAddress || serviceInfo.Address}:${serviceInfo.ServicePort}`;
    // Map the ports to the actual external ports
    const externalPort = serviceInfo.ServicePort === 3000 ? 
      (service === 'app1' ? '3001' : service === 'app2' ? '3002' : '3003') : serviceInfo.ServicePort;
    const externalUrl = `http://localhost:${externalPort}`;

    return (
      <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
        {/* Header with service info */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '50px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => router.push('/')} 
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
              ← Main App
            </button>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              🎯 {service.toUpperCase()} via Consul Discovery
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' }}>
            <span>Discovered: {serviceUrl}</span>
            <span>•</span>
            <span>External: {externalUrl}</span>
          </div>
        </div>

        {/* IFrame containing the actual service */}
        <iframe
          src={externalUrl}
          style={{
            width: '100%',
            height: 'calc(100vh - 50px)',
            border: 'none',
            margin: 0,
            padding: 0
          }}
          title={`${service} Service`}
          onLoad={() => console.log(`${service} loaded successfully`)}
          onError={() => console.error(`Failed to load ${service}`)}
        />
      </div>
    );
  }

  return null;
}
