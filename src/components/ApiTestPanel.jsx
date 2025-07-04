/**
 * API Test Panel Component
 * Provides a simple interface to test all API integrations
 */

import React, { useState, useEffect } from 'react';
import { testAllServices, getSetupInstructions, generateEnvTemplate } from '../services/apiTestService';
import { useLocation } from '../contexts/LocationContext';

const ApiTestPanel = () => {
  const { useGoogleGeolocation, updateGeolocationPreference, isGoogleGeolocationConfigured } = useLocation();
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [setupInstructions, setSetupInstructions] = useState(null);
  const [showEnvTemplate, setShowEnvTemplate] = useState(false);

  useEffect(() => {
    // Get setup instructions on component mount
    const instructions = getSetupInstructions();
    setSetupInstructions(instructions);
  }, []);

  const runTests = async () => {
    setLoading(true);
    try {
      const results = await testAllServices();
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-50';
      case 'working': return 'text-green-600 bg-green-50';
      case 'using_mock_data': return 'text-yellow-600 bg-yellow-50';
      case 'needs_api_key': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return '✅';
      case 'working': return '✅';
      case 'using_mock_data': return '🔄';
      case 'needs_api_key': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 CrowdPollen API Test Panel
        </h2>
        <p className="text-gray-600">
          Test your API configuration and see what's working
        </p>
      </div>

      {/* Setup Status */}
      {setupInstructions && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Setup Status: {setupInstructions.status === 'complete' ? '✅ Complete' : '⚠️ Incomplete'}
          </h3>
          
          {setupInstructions.required.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-700 mb-2">Required API Keys Missing:</h4>
              <ul className="space-y-1">
                {setupInstructions.required.map((item, index) => (
                  <li key={index} className="text-sm text-red-600">
                    • <code className="bg-red-100 px-1 rounded">{item.key}</code> - {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {setupInstructions.optional.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-yellow-700 mb-2">Optional API Keys (using fallbacks):</h4>
              <ul className="space-y-1">
                {setupInstructions.optional.map((item, index) => (
                  <li key={index} className="text-sm text-yellow-600">
                    • <code className="bg-yellow-100 px-1 rounded">{item.key}</code> - {item.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setShowEnvTemplate(!showEnvTemplate)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showEnvTemplate ? 'Hide' : 'Show'} .env Template
          </button>

          {showEnvTemplate && (
            <div className="mt-3">
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                {generateEnvTemplate()}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Admin Controls */}
      {isGoogleGeolocationConfigured && (
        <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">🔧 Admin Controls</h3>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-orange-800">Google Geolocation Service</h4>
              <p className="text-sm text-orange-700">Enable location without GPS ($5 per 1,000 requests)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useGoogleGeolocation}
                onChange={(e) => updateGeolocationPreference(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>
      )}

      {/* Test Button */}
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {loading ? '🔄 Testing APIs...' : '🧪 Test All APIs'}
        </button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            <span className="text-sm text-gray-500">
              {new Date(testResults.timestamp).toLocaleString()}
            </span>
          </div>

          {testResults.error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">❌ Test failed: {testResults.error}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {Object.entries(testResults.services).map(([serviceName, service]) => (
                <div key={serviceName} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-medium text-gray-900 capitalize">
                      {serviceName.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)} {service.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">{service.message}</p>

                  {service.configured !== undefined && (
                    <div className="text-sm text-gray-500 mb-2">
                      API Key: {service.configured ? '✅ Found' : '❌ Missing'}
                    </div>
                  )}

                  {service.dataSource && (
                    <div className="text-sm text-gray-500 mb-2">
                      Data Source: <code className="bg-gray-100 px-1 rounded">{service.dataSource}</code>
                    </div>
                  )}

                  {service.sampleData && (
                    <div className="text-sm text-gray-500 mb-2">
                      Sample Data: {JSON.stringify(service.sampleData, null, 2)}
                    </div>
                  )}

                  {service.testLocation && (
                    <div className="text-sm text-gray-500 mb-2">
                      Test Location: {service.testLocation.address} 
                      ({service.testLocation.latitude}, {service.testLocation.longitude})
                    </div>
                  )}

                  {service.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Error: {service.error}
                    </div>
                  )}

                  {/* Service-specific details */}
                  {serviceName === 'googleMaps' && service.geocoding && (
                    <div className="text-sm text-green-600">
                      ✅ Geocoding: {service.geocoding}
                    </div>
                  )}

                  {serviceName === 'googlePollen' && service.forecast && (
                    <div className="text-sm text-green-600">
                      ✅ Forecast: {service.forecast}
                    </div>
                  )}

                  {serviceName === 'googleWeather' && service.current && (
                    <div className="text-sm text-green-600">
                      ✅ Current Weather: {service.current}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Setup Guide */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Quick Setup</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>1. Copy .env.example to .env:</strong> <code className="bg-gray-200 px-1 rounded">cp .env.example .env</code></p>
          <p><strong>2. Add your API keys to .env file</strong></p>
          <p><strong>3. Restart the development server:</strong> <code className="bg-gray-200 px-1 rounded">npm run dev</code></p>
          <p><strong>4. Click "Test All APIs" to verify setup</strong></p>
        </div>
      </div>
    </div>
  );
};

export default ApiTestPanel;
