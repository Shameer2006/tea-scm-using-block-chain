import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import QrScanner from 'qr-scanner';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { 
  QrCodeIcon, 
  CameraIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const QRScanner = () => {
  const { contract, getAllProducts, isConnected, getProductHistory } = useWeb3();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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

  const findProductByBatchId = async (batchId) => {
    if (!contract) {
      setError('Please connect your wallet first');
      return null;
    }

    try {
      setLoading(true);
      
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
        return null;
      }
      
      // Get product history
      const history = await getProductHistory(productId);
      
      // Get stakeholder info for current owner
      const currentOwnerInfo = await contract.stakeholders(foundProduct.currentOwner);
      
      // Build journey data
      const journey = [];
      
      // Add creation/harvest entry - get original farmer from transaction history or use first transaction's fromParty
      let farmerInfo;
      if (history.length > 0) {
        // Get the farmer from the first transaction's fromParty
        farmerInfo = await contract.stakeholders(history[0].fromParty);
      } else {
        // Fallback to current owner if no history (shouldn't happen for transferred products)
        farmerInfo = await contract.stakeholders(foundProduct.currentOwner);
      }
      
      const harvestCoords = getCoordinatesFromLocation(foundProduct.origin);
      
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
      
      return {
        id: Number(foundProduct.id),
        batchId: foundProduct.batchId,
        variety: foundProduct.variety,
        origin: foundProduct.origin,
        cultivationMethod: foundProduct.cultivationMethod,
        processingMethod: foundProduct.processingMethod,
        grade: foundProduct.grade,
        status: ['Harvested', 'Processed', 'InTransit', 'Delivered', 'Sold'][foundProduct.status],
        harvestDate: new Date(Number(foundProduct.harvestDate) * 1000).toISOString(),
        currentOwner: foundProduct.currentOwner,
        stakeholderName: currentOwnerInfo.name || 'Unknown',
        stakeholderLocation: currentOwnerInfo.location || 'Unknown Location',
        certifications: [],
        journey: journey
      };
    } catch (error) {
      console.error('Error finding product:', error);
      setError('Error searching for product: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        
        // Start QR code detection
        detectQRCode();
      }
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Error accessing camera:', err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.qrScanner) {
      videoRef.current.qrScanner.destroy();
      videoRef.current.qrScanner = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const detectQRCode = () => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        handleQRCodeDetected(result.data);
        qrScanner.destroy();
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    qrScanner.start().catch(err => {
      console.error('QR Scanner error:', err);
      setError('Failed to start QR scanner');
    });

    // Store scanner reference for cleanup
    videoRef.current.qrScanner = qrScanner;
  };

  const handleQRCodeDetected = async (qrData) => {
    stopScanning();
    
    // Extract batch ID from QR data
    const batchId = qrData.replace('TEA-', '');
    const productData = await findProductByBatchId(batchId);
    
    if (productData) {
      setScannedData(productData);
      toast.success('Product found!');
    } else {
      setError('Product not found in blockchain');
      toast.error('Product not found');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    
    const batchId = manualInput.trim().replace('TEA-', '');
    const productData = await findProductByBatchId(batchId);
    
    if (productData) {
      setScannedData(productData);
      toast.success('Product found!');
      setManualInput('');
    } else {
      setError('Product not found in blockchain');
      toast.error('Product not found');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    toast('Processing uploaded image...');

    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });
      
      handleQRCodeDetected(result.data);
      toast.success('QR code detected from image!');
    } catch (error) {
      console.error('QR scan error:', error);
      setError('Could not detect QR code in image');
      toast.error('No QR code detected in image');
    } finally {
      setLoading(false);
    }
  };

  const viewFullTraceability = () => {
    navigate('/traceability');
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'harvested': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'in transit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-gray-600">Scan product QR codes to instantly access traceability information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Camera Scanner</h3>
          
          <div className="space-y-4">
            {/* Camera View */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {isScanning ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <QrCodeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Camera preview will appear here</p>
                  </div>
                </div>
              )}
              
              {/* Scanning Overlay */}
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary-500 rounded-lg">
                    <div className="w-full h-full border border-white/50 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex justify-center space-x-3">
              {!isScanning ? (
                <>
                  <button
                    onClick={startScanning}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <CameraIcon className="w-4 h-4" />
                    <span>Start Scanning</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    <span>Upload Image</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </>
              ) : (
                <button
                  onClick={stopScanning}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Stop Scanning
                </button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Manual Input Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Entry</h3>
          
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Batch ID or QR Code Data
              </label>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g., TEA001 or TEA-TEA001"
                className="input-field"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2 w-full"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Look Up Product'}</span>
            </button>
          </form>

          {!isConnected && (
            <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please connect your wallet to search for products in the blockchain.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scanned Product Information */}
      {scannedData && (
        <div className="space-y-6">
          {/* Product Info Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(scannedData.status)}`}>
                {scannedData.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Basic Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Batch ID:</span> {scannedData.batchId}</p>
                  <p><span className="font-medium">Variety:</span> {scannedData.variety}</p>
                  <p><span className="font-medium">Origin:</span> {scannedData.origin}</p>
                  <p><span className="font-medium">Processing Method:</span> {scannedData.processingMethod}</p>
                  <p><span className="font-medium">Grade:</span> {scannedData.grade}</p>
                </div>
              </div>

              {/* Current Status */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Current Status</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Current Owner:</span> {scannedData.stakeholderName}</p>
                  <p><span className="font-medium">Location:</span> {scannedData.stakeholderLocation}</p>
                  <p><span className="font-medium">Harvest Date:</span> {formatDate(scannedData.harvestDate)}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Additional Info</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Cultivation:</span> {scannedData.cultivationMethod}</p>
                  <p><span className="font-medium">Owner Address:</span> {scannedData.currentOwner.slice(0,6)}...{scannedData.currentOwner.slice(-4)}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Blockchain Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Map */}
          {scannedData.journey && scannedData.journey.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Journey Timeline */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Journey Timeline - {scannedData.variety}
                </h3>
                <div className="space-y-4">
                  {scannedData.journey.map((step, index) => (
                    <div key={step.id} className="relative">
                      {index < scannedData.journey.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                          step.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          step.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                          <CheckCircleIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">{step.stage}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              step.status === 'completed' ? 'bg-green-100 text-green-800' :
                              step.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {step.status}
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
                            <p className="text-sm text-gray-900 font-medium">
                              {step.stakeholder}
                            </p>
                            {step.details && (
                              <p className="text-sm text-gray-600">
                                {step.details}
                              </p>
                            )}
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
                    center={scannedData.journey.length > 0 ? scannedData.journey[0].coordinates : [20.0, 77.0]}
                    zoom={4}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    {/* Journey Path - only for completed steps */}
                    {scannedData.journey.filter(step => step.status === 'completed').length > 1 && (
                      <Polyline
                        positions={scannedData.journey
                          .filter(step => step.status === 'completed')
                          .map(step => step.coordinates)
                        }
                        color="#22c55e"
                        weight={3}
                        opacity={0.7}
                      />
                    )}
                    
                    {/* Location Markers */}
                    {scannedData.journey.map((step) => (
                      <Marker key={step.id} position={step.coordinates}>
                        <Popup>
                          <div className="p-2">
                            <h4 className="font-medium text-gray-900">{step.stage}</h4>
                            <p className="text-sm text-gray-600">{step.location}</p>
                            <p className="text-sm text-gray-600">{step.stakeholder}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(step.timestamp)}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              step.status === 'completed' ? 'bg-green-100 text-green-800' :
                              step.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {step.status}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={viewFullTraceability}
                className="btn-primary flex-1"
              >
                View Full Traceability
              </button>
              <button
                onClick={() => setScannedData(null)}
                className="btn-secondary flex-1"
              >
                Scan Another Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Click "Start Scanning" to use your camera to scan QR codes</p>
          <p>• Position the QR code within the scanning frame</p>
          <p>• Alternatively, enter the batch ID manually in the form</p>
          <p>• View instant product information with interactive journey map</p>
          <p>• Track the complete supply chain path from farm to cup</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;