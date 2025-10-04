import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useWeb3 } from '../context/Web3Context';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  ClockIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Traceability = () => {
  const { isConnected, getProductHistory, getProduct, contract } = useWeb3();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [traceabilityData, setTraceabilityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Function to get coordinates from location string (enhanced geocoding with fuzzy matching)
  const getCoordinatesFromLocation = (location) => {
    const locationMap = {
      // India locations with common spelling variations
      'darjeeling': [27.0360, 88.2627],
      'assam': [26.2006, 92.9376],
      'chennai': [13.0827, 80.2707],
      'tamil nadu': [11.1271, 78.6569],
      'tamilnadu': [11.1271, 78.6569],
      'mumbai': [19.0760, 72.8777],
      'maharashtra': [19.7515, 75.7139],
      'kerala': [10.8505, 76.2711],
      'karnataka': [15.3173, 75.7139],
      'west bengal': [22.9868, 87.8550],
      'odisha': [20.9517, 85.0985],
      'odisa': [20.9517, 85.0985],
      'orissa': [20.9517, 85.0985],
      'bhubaneswar': [20.2961, 85.8245],
      'cuttack': [20.4625, 85.8828],
      'processing facility': [13.0827, 80.2707],
      'export terminal': [19.0760, 72.8777],
      'import terminal': [25.2048, 55.2708], // Dubai
      'retail store': [37.7749, -122.4194],
      
      // Middle East locations
      'dubai': [25.2048, 55.2708],
      'uae': [23.4241, 53.8478],
      'united arab emirates': [23.4241, 53.8478],
      'abu dhabi': [24.4539, 54.3773],
      'sharjah': [25.3463, 55.4209],
      'qatar': [25.3548, 51.1839],
      'doha': [25.2867, 51.5333],
      'kuwait': [29.3117, 47.4818],
      'saudi arabia': [23.8859, 45.0792],
      'riyadh': [24.7136, 46.6753],
      'jeddah': [21.4858, 39.1925],
      'bahrain': [26.0667, 50.5577],
      'oman': [21.4735, 55.9754],
      'muscat': [23.5859, 58.4059],
      
      // Other international locations
      'china': [35.8617, 104.1954],
      'fujian': [26.0789, 117.9874],
      'sri lanka': [7.8731, 80.7718],
      'kenya': [-0.0236, 37.9062],
      'singapore': [1.3521, 103.8198],
      'malaysia': [4.2105, 101.9758],
      'thailand': [15.8700, 100.9925],
      'vietnam': [14.0583, 108.2772],
      'japan': [36.2048, 138.2529],
      'south korea': [35.9078, 127.7669],
      'us': [39.8283, -98.5795],
      'usa': [39.8283, -98.5795],
      'united states': [39.8283, -98.5795],
      'america': [39.8283, -98.5795],
      'united states of america': [39.8283, -98.5795],
      'uk': [55.3781, -3.4360],
      'united kingdom': [55.3781, -3.4360],
      'germany': [51.1657, 10.4515],
      'france': [46.6034, 1.8883],
      'netherlands': [52.1326, 5.2913],
      'default': [20.5937, 78.9629]
    };
    
    // Fuzzy matching for common spelling variations
    const fuzzyMatches = {
      'odisa': 'odisha',
      'orisa': 'odisha',
      'orrisa': 'odisha',
      'udisa': 'odisha',
      'tamilnad': 'tamil nadu',
      'tamilnadu': 'tamil nadu',
      'karnatak': 'karnataka',
      'keral': 'kerala',
      'maharastra': 'maharashtra',
      'maharasht': 'maharashtra',
      'bengal': 'west bengal',
      'westbengal': 'west bengal',
      'u.a.e': 'uae',
      'u.a.e.': 'uae',
      'emirates': 'uae'
    };
    
    const locationLower = location.toLowerCase().trim();
    
    // First try exact match (word boundaries and exact match)
    for (const [key, coords] of Object.entries(locationMap)) {
      // Try exact match first
      if (locationLower === key) {
        return coords;
      }
      // Then try word boundary match
      const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(locationLower)) {
        return coords;
      }
    }
    
    // Then try fuzzy matching (word boundaries)
    for (const [variant, correct] of Object.entries(fuzzyMatches)) {
      const regex = new RegExp(`\\b${variant}\\b`, 'i');
      if (regex.test(locationLower)) {
        return locationMap[correct] || locationMap.default;
      }
    }
    
    // Partial matching for common patterns
    if (locationLower.includes('od') && (locationLower.includes('isa') || locationLower.includes('isha'))) {
      return locationMap.odisha;
    }
    
    return locationMap.default;
  };

  const fetchTraceabilityData = async (batchId) => {
    if (!contract) {
      setError('Contract not initialized');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Find product by batch ID
      const productCount = await contract.getProductCount();
      let foundProduct = null;
      let productId = null;
      
      for (let i = 1; i <= productCount; i++) {
        const product = await contract.products(i);
        if (product.batchId.toLowerCase() === batchId.toLowerCase()) {
          foundProduct = product;
          productId = i;
          break;
        }
      }
      
      if (!foundProduct) {
        setError('Product not found');
        return;
      }
      
      // Get product history
      const history = await getProductHistory(productId);
      
      // Get stakeholder info for current owner
      const currentOwnerInfo = await contract.stakeholders(foundProduct.currentOwner);
      
      // Build journey data
      const journey = [];
      
      // Add creation/harvest entry - get original farmer from transaction history
      let farmerInfo;
      if (history.length > 0) {
        // Get the farmer from the first transaction's fromParty
        farmerInfo = await contract.stakeholders(history[0].fromParty);
      } else {
        // Fallback to current owner if no history (shouldn't happen for transferred products)
        farmerInfo = await contract.stakeholders(foundProduct.currentOwner);
      }
      
      const harvestCoords = getCoordinatesFromLocation(foundProduct.origin);
      
      console.log(`Mapping location "${foundProduct.origin}" to coordinates:`, harvestCoords);
      
      journey.push({
        id: 0,
        stage: 'Harvest',
        location: foundProduct.origin,
        coordinates: harvestCoords,
        timestamp: new Date(Number(foundProduct.harvestDate) * 1000).toISOString(),
        stakeholder: farmerInfo.name || 'Unknown Farmer',
        status: 'completed',
        details: `${foundProduct.variety} harvested using ${foundProduct.cultivationMethod} methods`
      });
      
      // Add transaction history
      for (let i = 0; i < history.length; i++) {
        const tx = history[i];
        const fromStakeholder = await contract.stakeholders(tx.fromParty);
        const toStakeholder = await contract.stakeholders(tx.toParty);
        const coords = getCoordinatesFromLocation(tx.location || 'default');
        
        const stageNames = ['Harvest', 'Processing', 'Export', 'Import', 'Retail'];
        const stageName = stageNames[tx.transactionType] || 'Transfer';
        
        journey.push({
          id: i + 1,
          stage: stageName,
          location: tx.location || foundProduct.origin,
          coordinates: coords,
          timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
          stakeholder: toStakeholder.name || 'Unknown',
          status: tx.isCompleted ? 'completed' : 'pending',
          details: tx.conditions || `Product transferred to ${toStakeholder.name}`
        });
      }
      
      const traceData = {
        product: {
          id: Number(foundProduct.id),
          batchId: foundProduct.batchId,
          variety: foundProduct.variety,
          origin: foundProduct.origin,
          grade: foundProduct.grade,
          status: ['Harvested', 'Processed', 'InTransit', 'Delivered', 'Sold'][foundProduct.status]
        },
        journey: journey
      };
      
      setTraceabilityData(traceData);
      
    } catch (error) {
      console.error('Error fetching traceability data:', error);
      setError('Failed to fetch product data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    const batchId = searchTerm.trim().replace('TEA-', ''); // Remove TEA- prefix if present
    await fetchTraceabilityData(batchId);
  };



  const getStageIcon = (stage, status) => {
    const iconClass = "w-5 h-5";
    
    if (status === 'completed') {
      return <CheckCircleIcon className={`${iconClass} text-green-600`} />;
    } else if (status === 'in-transit') {
      return <TruckIcon className={`${iconClass} text-blue-600`} />;
    } else {
      return <ClockIcon className={`${iconClass} text-yellow-600`} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Create polyline coordinates for the journey path
  const journeyPath = traceabilityData?.journey
    .filter(step => step.status === 'completed')
    .map(step => step.coordinates) || [];

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to access traceability features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Traceability</h1>
        <p className="text-gray-600">Track your tea products from farm to cup with complete transparency.</p>
      </div>

      {/* Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Enter batch ID or product ID to trace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchTerm.trim()}
            className="btn-primary"
          >
            {loading ? 'Searching...' : 'Trace Product'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {traceabilityData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Journey Timeline */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Journey Timeline - {traceabilityData.product.variety}
            </h3>
            <div className="space-y-4">
              {traceabilityData.journey.map((step, index) => (
                <div key={step.id} className="relative">
                  {index < traceabilityData.journey.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                  )}
                  
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStatusColor(step.status)}`}>
                      {getStageIcon(step.stage, step.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{step.stage}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                          {step.status.replace('-', ' ')}
                        </span>
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {step.location}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {formatDate(step.timestamp)}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-900 font-medium">
                            {step.stakeholder}
                          </p>

                        </div>
                        <p className="text-sm text-gray-600">
                          {step.details}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Map */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Journey Map</h3>
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer
                center={traceabilityData.journey.length > 0 ? traceabilityData.journey[0].coordinates : [20.0, 77.0]}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Journey Path */}
                {journeyPath.length > 1 && (
                  <Polyline
                    positions={journeyPath}
                    color="#22c55e"
                    weight={3}
                    opacity={0.7}
                  />
                )}
                
                {/* Location Markers */}
                {traceabilityData.journey.map((step) => (
                  <Marker key={step.id} position={step.coordinates}>
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-medium text-gray-900">{step.stage}</h4>
                        <p className="text-sm text-gray-600">{step.location}</p>
                        <p className="text-sm text-gray-600">{step.stakeholder}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(step.timestamp)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      {/* Product Details */}
      {traceabilityData && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Basic Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Batch ID:</span> {traceabilityData.product.batchId}</p>
                <p><span className="font-medium">Variety:</span> {traceabilityData.product.variety}</p>
                <p><span className="font-medium">Origin:</span> {traceabilityData.product.origin}</p>
                <p><span className="font-medium">Grade:</span> {traceabilityData.product.grade}</p>
                <p><span className="font-medium">Current Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    traceabilityData.product.status === 'Harvested' ? 'bg-green-100 text-green-800' :
                    traceabilityData.product.status === 'Processed' ? 'bg-yellow-100 text-yellow-800' :
                    traceabilityData.product.status === 'InTransit' ? 'bg-blue-100 text-blue-800' :
                    traceabilityData.product.status === 'Delivered' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {traceabilityData.product.status}
                  </span>
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Journey Stats</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Total Stages:</span> {traceabilityData.journey.length}</p>
                <p><span className="font-medium">Completed:</span> {traceabilityData.journey.filter(s => s.status === 'completed').length}</p>
                <p><span className="font-medium">In Progress:</span> {traceabilityData.journey.filter(s => s.status === 'in-transit').length}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Current Status</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Stage:</span> {traceabilityData.journey[traceabilityData.journey.length - 1]?.stage}</p>
                <p><span className="font-medium">Location:</span> {traceabilityData.journey[traceabilityData.journey.length - 1]?.location}</p>
                <p><span className="font-medium">Handler:</span> {traceabilityData.journey[traceabilityData.journey.length - 1]?.stakeholder}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!traceabilityData && !loading && (
        <div className="card text-center py-12">
          <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Selected</h3>
          <p className="text-gray-600">Enter a batch ID or product ID above to start tracing the product journey.</p>
        </div>
      )}


    </div>
  );
};

export default Traceability;