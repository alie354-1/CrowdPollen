import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Layers, Info, Eye, EyeOff, Settings, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../contexts/LocationContext';
import { crowdPollenAPI } from '../../services/crowdPollenAPI';
import googlePollenService from '../../services/googlePollenService';

export default function EnhancedMapScreen() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showLayerControls, setShowLayerControls] = useState(false);
  
  // Layer visibility states
  const [layers, setLayers] = useState({
    userSubmissions: true,
    googleTree: false,
    googleGrass: false,
    googleWeed: false,
    heatmap: true
  });

  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/light-v11');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.mapboxgl) {
      initializeMap();
    } else {
      // Load Mapbox GL JS if not already loaded
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = initializeMap;
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [location]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMapLayers();
    }
  }, [layers]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      setError('Mapbox access token not configured');
      setLoading(false);
      return;
    }

    window.mapboxgl.accessToken = mapboxToken;

    const map = new window.mapboxgl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: location ? [location.longitude, location.latitude] : [-98.5795, 39.8283],
      zoom: location ? 10 : 4,
      attributionControl: false
    });

    map.addControl(new window.mapboxgl.AttributionControl({
      compact: true
    }));

    map.on('load', () => {
      mapInstanceRef.current = map;
      setupMapLayers();
      setLoading(false);
    });

    map.on('click', (e) => {
      // Check if clicked on a submission marker
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['user-submissions']
      });

      if (features.length > 0) {
        const submission = features[0].properties;
        setSelectedSubmission({
          ...submission,
          latitude: features[0].geometry.coordinates[1],
          longitude: features[0].geometry.coordinates[0]
        });
      } else {
        setSelectedSubmission(null);
      }
    });

    // Change cursor on hover
    map.on('mouseenter', 'user-submissions', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'user-submissions', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  const setupMapLayers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Add user submissions layer
    if (submissions.length > 0) {
      addUserSubmissionsLayer();
    }

    // Add Google Pollen heatmap layers
    addGooglePollenLayers();
  };

  const addUserSubmissionsLayer = () => {
    const map = mapInstanceRef.current;
    if (!map || !submissions.length) return;

    const geojsonData = {
      type: 'FeatureCollection',
      features: submissions.map(submission => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [submission.longitude, submission.latitude]
        },
        properties: {
          id: submission.id,
          pollen_level: submission.pollen_level,
          pollen_count: submission.pollen_count,
          created_at: submission.created_at,
          confidence_score: submission.confidence_score
        }
      }))
    };

    // Add source
    if (map.getSource('user-submissions')) {
      map.getSource('user-submissions').setData(geojsonData);
    } else {
      map.addSource('user-submissions', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });
    }

    // Add cluster layer
    if (!map.getLayer('user-submissions-clusters')) {
      map.addLayer({
        id: 'user-submissions-clusters',
        type: 'circle',
        source: 'user-submissions',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });
    }

    // Add cluster count layer
    if (!map.getLayer('user-submissions-cluster-count')) {
      map.addLayer({
        id: 'user-submissions-cluster-count',
        type: 'symbol',
        source: 'user-submissions',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });
    }

    // Add individual points layer
    if (!map.getLayer('user-submissions')) {
      map.addLayer({
        id: 'user-submissions',
        type: 'circle',
        source: 'user-submissions',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'pollen_level'],
            'very_low', '#22c55e',
            'low', '#84cc16',
            'moderate', '#eab308',
            'high', '#f97316',
            'very_high', '#ef4444',
            '#6b7280'
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 4,
            16, 8
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    }
  };

  const addGooglePollenLayers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const apiKey = import.meta.env.VITE_GOOGLE_POLLEN_API_KEY;
    if (!apiKey) return;

    // Add Google Pollen heatmap tile layers
    const pollenTypes = [
      { id: 'google-tree', type: 'TREE_UPI', name: 'Tree Pollen' },
      { id: 'google-grass', type: 'GRASS_UPI', name: 'Grass Pollen' },
      { id: 'google-weed', type: 'WEED_UPI', name: 'Weed Pollen' }
    ];

    pollenTypes.forEach(({ id, type }) => {
      if (!map.getSource(id)) {
        map.addSource(id, {
          type: 'raster',
          tiles: [
            `https://pollen.googleapis.com/v1/mapTypes/${type}/heatmapTiles/{z}/{x}/{y}?key=${apiKey}`
          ],
          tileSize: 256
        });

        map.addLayer({
          id: id,
          type: 'raster',
          source: id,
          layout: {
            visibility: layers[id.replace('google-', 'google')] ? 'visible' : 'none'
          },
          paint: {
            'raster-opacity': 0.6
          }
        });
      }
    });
  };

  const updateMapLayers = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update user submissions visibility
    const submissionLayers = ['user-submissions', 'user-submissions-clusters', 'user-submissions-cluster-count'];
    submissionLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', layers.userSubmissions ? 'visible' : 'none');
      }
    });

    // Update Google Pollen layers visibility
    const googleLayers = [
      { id: 'google-tree', key: 'googleTree' },
      { id: 'google-grass', key: 'googleGrass' },
      { id: 'google-weed', key: 'googleWeed' }
    ];

    googleLayers.forEach(({ id, key }) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', layers[key] ? 'visible' : 'none');
      }
    });
  };

  const loadSubmissions = async () => {
    try {
      setError(null);
      
      let data;
      if (location) {
        data = await crowdPollenAPI.getLocalPollenData(
          location.latitude,
          location.longitude,
          50 // 50km radius
        );
      } else {
        data = await crowdPollenAPI.getNationalPollenData();
      }
      
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError('Failed to load pollen data');
    }
  };

  const toggleLayer = (layerKey) => {
    setLayers(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  const changeMapStyle = (newStyle) => {
    setMapStyle(newStyle);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setStyle(newStyle);
      mapInstanceRef.current.once('styledata', () => {
        setupMapLayers();
      });
    }
  };

  const getPollenLevelInfo = (level) => {
    const levels = {
      very_low: { color: '#22c55e', emoji: '🟢', description: 'Very Low' },
      low: { color: '#84cc16', emoji: '🟢', description: 'Low' },
      moderate: { color: '#eab308', emoji: '🟡', description: 'Moderate' },
      high: { color: '#f97316', emoji: '🟠', description: 'High' },
      very_high: { color: '#ef4444', emoji: '🔴', description: 'Very High' }
    };
    return levels[level] || { color: '#6b7280', emoji: '❓', description: 'Unknown' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Pollen Map</h1>
            <p className="text-sm text-gray-600">
              {location ? `${location.address?.split(',')[0] || 'Your area'}` : 'Global view'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadSubmissions}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowLayerControls(!showLayerControls)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Layer controls"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div ref={mapRef} className="w-full h-[calc(100vh-80px)]" />
        
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-10">
            <div className="flex items-center">
              <Info className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Layer Controls */}
        {showLayerControls && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 w-64">
            <h3 className="font-semibold mb-3 flex items-center">
              <Layers className="w-4 h-4 mr-2" />
              Map Layers
            </h3>
            
            <div className="space-y-3">
              {/* Map Style */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Map Style</label>
                <select
                  value={mapStyle}
                  onChange={(e) => changeMapStyle(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="mapbox://styles/mapbox/light-v11">Light</option>
                  <option value="mapbox://styles/mapbox/dark-v11">Dark</option>
                  <option value="mapbox://styles/mapbox/satellite-v9">Satellite</option>
                  <option value="mapbox://styles/mapbox/outdoors-v12">Outdoors</option>
                </select>
              </div>

              {/* Data Layers */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Data Layers</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={layers.userSubmissions}
                      onChange={() => toggleLayer('userSubmissions')}
                      className="mr-2"
                    />
                    <span className="text-sm">User Submissions</span>
                  </label>
                </div>
              </div>

              {/* Google Pollen Layers */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Google Pollen Forecast</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={layers.googleTree}
                      onChange={() => toggleLayer('googleTree')}
                      className="mr-2"
                    />
                    <span className="text-sm">Tree Pollen</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={layers.googleGrass}
                      onChange={() => toggleLayer('googleGrass')}
                      className="mr-2"
                    />
                    <span className="text-sm">Grass Pollen</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={layers.googleWeed}
                      onChange={() => toggleLayer('googleWeed')}
                      className="mr-2"
                    />
                    <span className="text-sm">Weed Pollen</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <h4 className="font-medium text-sm mb-2">Pollen Levels</h4>
          <div className="space-y-1">
            {['very_low', 'low', 'moderate', 'high', 'very_high'].map(level => {
              const info = getPollenLevelInfo(level);
              return (
                <div key={level} className="flex items-center text-xs">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: info.color }}
                  />
                  <span>{info.description}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Submission Details */}
        {selectedSubmission && (
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 w-64">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Submission Details</h4>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Level:</span>
                <div className="flex items-center">
                  <span>{getPollenLevelInfo(selectedSubmission.pollen_level).emoji}</span>
                  <span className="ml-1 capitalize">
                    {selectedSubmission.pollen_level?.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              {selectedSubmission.pollen_count && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Count:</span>
                  <span>{selectedSubmission.pollen_count} grains/m³</span>
                </div>
              )}
              
              {selectedSubmission.confidence_score && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span>{Math.round(selectedSubmission.confidence_score * 100)}%</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span>{formatDate(selectedSubmission.created_at)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
