import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import QRCode from 'react-qr-code';
import ChatWidget from '../components/ChatWidget';

const Products = () => {
  const { isConnected, createProduct, getUserProducts, getAllProducts, transferProduct: transferProductToBlockchain, account, checkStakeholderStatus } = useWeb3();
  const [stakeholderStatus, setStakeholderStatus] = useState({ isRegistered: false, type: null, name: null });
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [productToTransfer, setProductToTransfer] = useState(null);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferLocation, setTransferLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState('my-products');

  const [chatProductId, setChatProductId] = useState(null);
  const [chatOwnerAddress, setChatOwnerAddress] = useState(null);
  const [readyForExport, setReadyForExport] = useState(new Set());


  const handleBatchRequest = (product) => {
    setChatProductId(product.batchId);
    setChatOwnerAddress(product.currentOwner);
    // Trigger chat widget to open with this product
    const event = new CustomEvent('startBatchRequest', {
      detail: { 
        ownerAddress: product.currentOwner, 
        productInfo: {
          id: product.batchId,
          batchId: product.batchId,
          variety: product.variety,
          origin: product.origin
        }
      }
    });
    window.dispatchEvent(event);
  };

  const generateUniqueBatchId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `TEA${timestamp}${random}`;
  };

  const [formData, setFormData] = useState({
    batchId: '',
    variety: '',
    origin: '',
    cultivationMethod: 'organic',
    processingMethod: '',
    grade: '',
    certifications: [],
    ipfsHash: ''
  });

  // Fetch real products from blockchain
  const fetchProducts = async () => {
    if (!isConnected || !account) return;
    
    try {
      setFetchingProducts(true);
      
      // Check stakeholder status first
      const status = await checkStakeholderStatus(account);
      setStakeholderStatus(status);
      
      if (status.isRegistered) {
        // Get user's own products
        const userProducts = await getUserProducts(account);
        setProducts(userProducts);
        
        // Load ready for export status for processor's products
        if (status.type === 'Processor') {
          const exportReady = JSON.parse(localStorage.getItem('readyForExport') || '[]');
          const processorReady = new Set(
            exportReady.filter(item => item.startsWith(account)).map(item => item.split('-')[1])
          );
          setReadyForExport(processorReady);
        }
        
        // If processor, also get all available products for purchase
        if (status.type === 'Processor') {
          const allProducts = await getAllProducts();
          // Filter products that are available for purchase (not owned by current user)
          const available = allProducts.filter(product => 
            product.currentOwner.toLowerCase() !== account.toLowerCase() &&
            product.status === 'Harvested'
          );
          setAvailableProducts(available);
        }
        
        // If exporter, get processed products ready for export
        if (status.type === 'Exporter') {
          const allProducts = await getAllProducts();
          // Get ready for export list from localStorage
          const exportReady = JSON.parse(localStorage.getItem('readyForExport') || '[]');
          // Filter products that are marked as ready for export
          const available = allProducts.filter(product => 
            product.currentOwner.toLowerCase() !== account.toLowerCase() &&
            product.status === 'Processed' &&
            exportReady.includes(`${product.currentOwner}-${product.id}`)
          );
          setAvailableProducts(available);
        }
        
        // If importer, get exported products ready for import
        if (status.type === 'Importer') {
          const allProducts = await getAllProducts();
          // Filter products owned by exporters only
          const available = [];
          for (const product of allProducts) {
            if (product.currentOwner.toLowerCase() !== account.toLowerCase()) {
              // Check if the product owner is an exporter
              const ownerStatus = await checkStakeholderStatus(product.currentOwner);
              if (ownerStatus.type === 'Exporter' && (product.status === 'Processed' || product.status === 'InTransit')) {
                available.push(product);
              }
            }
          }
          setAvailableProducts(available);
        }
        
        // If retailer, get imported products ready for retail
        if (status.type === 'Retailer') {
          const allProducts = await getAllProducts();
          // Filter products owned by importers only
          const available = [];
          for (const product of allProducts) {
            if (product.currentOwner.toLowerCase() !== account.toLowerCase()) {
              // Check if the product owner is an importer
              const ownerStatus = await checkStakeholderStatus(product.currentOwner);
              if (ownerStatus.type === 'Importer' && (product.status === 'Processed' || product.status === 'InTransit' || product.status === 'Delivered')) {
                available.push(product);
              }
            }
          }
          setAvailableProducts(available);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setFetchingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [isConnected, account]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCertificationChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      certifications: checked 
        ? [...prev.certifications, value]
        : prev.certifications.filter(cert => cert !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) return;

    try {
      setLoading(true);
      await createProduct(formData);
      setShowCreateForm(false);
      setFormData({
        batchId: '',
        variety: '',
        origin: '',
        cultivationMethod: 'organic',
        processingMethod: '',
        grade: '',
        certifications: [],
        ipfsHash: ''
      });
      await fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!isConnected || !productToTransfer || !transferAddress) return;

    try {
      setLoading(true);
      
      // Determine transaction type based on stakeholder type
      let transactionType = 1; // Default to PROCESSING
      if (stakeholderStatus.type === 'Farmer') {
        transactionType = 1; // PROCESSING
      } else if (stakeholderStatus.type === 'Processor') {
        transactionType = 2; // EXPORT
      } else if (stakeholderStatus.type === 'Exporter') {
        transactionType = 3; // IMPORT
      } else if (stakeholderStatus.type === 'Importer') {
        transactionType = 4; // RETAIL
      } else if (stakeholderStatus.type === 'Retailer') {
        transactionType = 5; // SALE (to customer)
      }
      
      await transferProductToBlockchain(
        productToTransfer.id,
        transferAddress,
        transactionType,
        transferLocation,
        [],
        `Product transferred from ${stakeholderStatus.type} to ${getNextStakeholder(stakeholderStatus.type)}`
      );
      setShowTransferForm(false);
      setProductToTransfer(null);
      setTransferAddress('');
      setTransferLocation('');
      toast.success('Product transferred successfully!');
      await fetchProducts();
    } catch (error) {
      console.error('Error transferring product:', error);
      toast.error('Failed to transfer product: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Sort products with priority: untransferred first, then transferred
  const sortProductsByTransferStatus = (products) => {
    return products.sort((a, b) => {
      const aTransferred = a.currentOwner.toLowerCase() !== account.toLowerCase();
      const bTransferred = b.currentOwner.toLowerCase() !== account.toLowerCase();
      
      // Untransferred products (owned by user) come first
      if (!aTransferred && bTransferred) return -1;
      if (aTransferred && !bTransferred) return 1;
      
      // Within same transfer status, sort by ID (newest first)
      return b.id - a.id;
    });
  };

  const filteredProducts = sortProductsByTransferStatus(
    products.filter(product => {
      const matchesSearch = product.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.origin.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || product.status.toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesFilter;
    })
  );

  const filteredAvailableProducts = availableProducts.filter(product => {
    const matchesSearch = product.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.variety.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.origin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || product.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'harvested': return 'bg-green-100 text-green-800';
      case 'processed': return 'bg-yellow-100 text-yellow-800';
      case 'intransit': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const getNextStakeholder = (stakeholderType) => {
    switch (stakeholderType) {
      case 'Farmer': return 'Processor';
      case 'Processor': return 'Exporter';
      case 'Exporter': return 'Importer';
      case 'Importer': return 'Retailer';
      case 'Retailer': return 'Customer';
      default: return 'Next Stakeholder';
    }
  };

  const getDefaultLocation = (stakeholderType) => {
    switch (stakeholderType) {
      case 'Farmer': return 'Processing Facility';
      case 'Processor': return 'Export Terminal';
      case 'Exporter': return 'Import Terminal';
      case 'Importer': return 'Retail Store';
      case 'Retailer': return 'Customer Location';
      default: return 'Transfer Location';
    }
  };

  const toggleReadyForExport = (product) => {
    const key = `${account}-${product.id}`;
    const exportReady = JSON.parse(localStorage.getItem('readyForExport') || '[]');
    
    let updatedReady;
    if (exportReady.includes(key)) {
      // Remove from ready for export
      updatedReady = exportReady.filter(item => item !== key);
      setReadyForExport(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id.toString());
        return newSet;
      });
      toast.success('Product removed from export list');
    } else {
      // Add to ready for export
      updatedReady = [...exportReady, key];
      setReadyForExport(prev => new Set([...prev, product.id.toString()]));
      toast.success('Product marked as ready for export');
    }
    
    localStorage.setItem('readyForExport', JSON.stringify(updatedReady));
  };

  const downloadQRCode = (product) => {
    // Find the QR code SVG element in the modal
    const qrElement = document.querySelector('#qr-download-area svg');
    if (!qrElement) {
      toast.error('QR code not found. Please try again.');
      return;
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const qrSize = 300;
    canvas.width = qrSize + 100;
    canvas.height = qrSize + 200;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(qrElement);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      // Draw QR code
      ctx.drawImage(img, 50, 60, qrSize, qrSize);
      
      // Add product info
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${product.variety}`, canvas.width/2, 30);
      ctx.fillText(`Batch: ${product.batchId}`, canvas.width/2, 50);
      
      ctx.font = '14px Arial';
      ctx.fillText(`Origin: ${product.origin}`, canvas.width/2, qrSize + 90);
      ctx.fillText(`Grade: ${product.grade}`, canvas.width/2, qrSize + 110);
      ctx.fillText(`Method: ${product.cultivationMethod}`, canvas.width/2, qrSize + 130);
      ctx.fillText(`Status: ${product.status}`, canvas.width/2, qrSize + 150);
      
      ctx.font = '12px Arial';
      ctx.fillText('Scan for full traceability', canvas.width/2, qrSize + 180);
      
      // Download
      const link = document.createElement('a');
      link.download = `tea-qr-${product.batchId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('QR code downloaded successfully!');
    };
    
    img.onerror = () => {
      toast.error('Failed to generate QR code image.');
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const printQRCode = (product) => {
    // Get the actual QR code from the DOM
    const qrElement = document.querySelector('#qr-download-area svg');
    if (!qrElement) {
      toast.error('QR code not found. Please try again.');
      return;
    }

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(qrElement);
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Tea QR Code - ${product.batchId}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; margin: 0; }
            .qr-container { border: 2px solid #000; padding: 20px; margin: 20px auto; width: fit-content; max-width: 400px; }
            .product-info { margin: 15px 0; }
            .batch-id { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .details { font-size: 14px; margin: 5px 0; }
            .qr-code { margin: 20px 0; }
            .qr-code img { width: 200px; height: 200px; }
            @media print { 
              body { margin: 0; }
              .qr-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="product-info">
              <div class="batch-id">${product.variety}</div>
              <div class="details">Batch ID: ${product.batchId}</div>
              <div class="details">Origin: ${product.origin}</div>
              <div class="details">Grade: ${product.grade}</div>
              <div class="details">Method: ${product.cultivationMethod}</div>
              <div class="details">Status: ${product.status}</div>
            </div>
            <div class="qr-code">
              <img src="${url}" alt="QR Code for ${product.batchId}" />
            </div>
            <div class="details">Scan for full traceability</div>
            <div class="details" style="font-size: 12px; color: #666; margin-top: 10px;">
              Tea Supply Chain Management System
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to manage products.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your tea products and track their journey.</p>
          {stakeholderStatus.isRegistered && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Registered as {stakeholderStatus.type}
              </span>
            </div>
          )}
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={fetchProducts}
            disabled={fetchingProducts}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${fetchingProducts ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {stakeholderStatus.type === 'Farmer' && (
            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, batchId: generateUniqueBatchId() }));
                setShowCreateForm(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs for All Stakeholders */}
      {stakeholderStatus.isRegistered && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-products'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transfer'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transfer Products
            </button>
            {(stakeholderStatus.type === 'Processor' || stakeholderStatus.type === 'Exporter' || stakeholderStatus.type === 'Importer' || stakeholderStatus.type === 'Retailer') && (
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {stakeholderStatus.type === 'Processor' ? 'Available to Purchase' : 
                 stakeholderStatus.type === 'Exporter' ? 'Ready for Export' : 
                 stakeholderStatus.type === 'Importer' ? 'Ready for Import' : 'Available for Retail'} ({availableProducts.length})
              </button>
            )}
          </nav>
        </div>
      )}



      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="harvested">Harvested</option>
            <option value="processing">Processing</option>
            <option value="intransit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {fetchingProducts && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading products from blockchain...</p>
          </div>
        </div>
      )}

      {/* Registration Required State */}
      {!stakeholderStatus.isRegistered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <CubeIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Registration Required</h3>
            <p className="text-yellow-700 mb-4">You need to register as a stakeholder to access products.</p>
            <Link to="/profile" className="btn-primary">
              Complete Registration
            </Link>
          </div>
        </div>
      )}

      {/* Non-Farmer State */}
      {stakeholderStatus.isRegistered && stakeholderStatus.type !== 'Farmer' && products.length === 0 && (
        <div className="text-center py-12">
          <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
          <p className="text-gray-600 mb-4">
            As a {stakeholderStatus.type}, you can view and manage products transferred to you, but cannot create new products.
          </p>
          <p className="text-sm text-gray-500">
            Only farmers can create new tea products in the supply chain.
          </p>
        </div>
      )}

      {/* Empty State for Farmers */}
      {stakeholderStatus.isRegistered && stakeholderStatus.type === 'Farmer' && !fetchingProducts && products.length === 0 && (
        <div className="text-center py-12">
          <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600 mb-4">You haven't created any products yet.</p>
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, batchId: generateUniqueBatchId() }));
              setShowCreateForm(true);
            }}
            className="btn-primary"
          >
            Create Your First Product
          </button>
        </div>
      )}

      {/* Products Grid */}
      {stakeholderStatus.isRegistered && !fetchingProducts && (
        <div>
          {/* My Products Tab */}
          {activeTab === 'my-products' && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const isTransferred = product.currentOwner.toLowerCase() !== account.toLowerCase();
                return (
                <div key={product.id} className={`card hover:shadow-xl transition-shadow ${
                  isTransferred ? 'bg-gray-50 border-gray-300' : 'border-primary-200'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isTransferred ? 'text-gray-600' : 'text-gray-900'
                      }`}>{product.variety}</h3>
                      <p className="text-sm text-gray-600">Batch: {product.batchId}</p>
                      {isTransferred && (
                        <p className="text-xs text-orange-600 font-medium mt-1">
                          ✓ Transferred
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                      {!isTransferred && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-sm"><span className="font-medium">Origin:</span> {product.origin}</p>
                    <p className="text-sm"><span className="font-medium">Method:</span> {product.cultivationMethod}</p>
                    <p className="text-sm"><span className="font-medium">Grade:</span> {product.grade}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      {(stakeholderStatus.type === 'Farmer' || stakeholderStatus.type === 'Processor' || stakeholderStatus.type === 'Exporter' || stakeholderStatus.type === 'Importer' || stakeholderStatus.type === 'Retailer') && (
                        <button
                          onClick={() => {
                            setProductToTransfer(product);
                            setTransferLocation(getDefaultLocation(stakeholderStatus.type));
                            setShowTransferForm(true);
                          }}
                          disabled={product.currentOwner.toLowerCase() !== account.toLowerCase()}
                          className={`text-xs px-2 py-1 ${
                            product.currentOwner.toLowerCase() !== account.toLowerCase()
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'btn-primary'
                          }`}
                          title={product.currentOwner.toLowerCase() !== account.toLowerCase() ? 'Product already transferred' : `Transfer to ${getNextStakeholder(stakeholderStatus.type)}`}
                        >
                          {product.currentOwner.toLowerCase() !== account.toLowerCase() ? 'Transferred' : 'Transfer'}
                        </button>
                      )}
                      {stakeholderStatus.type === 'Processor' && product.status === 'Processed' && (
                        <button
                          onClick={() => toggleReadyForExport(product)}
                          className={`text-xs px-2 py-1 ${
                            readyForExport.has(product.id.toString())
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                          title={readyForExport.has(product.id.toString()) ? 'Remove from export list' : 'Mark ready for export'}
                        >
                          {readyForExport.has(product.id.toString()) ? '✓ Export Ready' : 'Mark for Export'}
                        </button>
                      )}
                      <div className="w-12 h-12">
                        <QRCode value={`TEA-${product.batchId}`} size={48} />
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Transfer Products Tab */}
          {activeTab === 'transfer' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Transfer Your Products</h3>
                <p className="text-sm text-blue-700">
                  Transfer your products to the next level in the supply chain. As a {stakeholderStatus.type}, you can transfer to {getNextStakeholder(stakeholderStatus.type)}s.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Products you own appear first, transferred products appear below
                </p>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Products to Transfer</h3>
                  <p className="text-gray-600">You don't have any products available for transfer.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortProductsByTransferStatus(products).map((product) => {
                    const isTransferred = product.currentOwner.toLowerCase() !== account.toLowerCase();
                    return (
                    <div key={product.id} className={`card hover:shadow-xl transition-shadow border-2 ${
                      isTransferred ? 'border-gray-300 bg-gray-50' : 'border-blue-200'
                    }`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className={`text-lg font-semibold ${
                            isTransferred ? 'text-gray-600' : 'text-gray-900'
                          }`}>{product.variety}</h3>
                          <p className="text-sm text-gray-600">Batch: {product.batchId}</p>
                          <p className={`text-xs ${
                            isTransferred ? 'text-gray-500' : 'text-blue-600'
                          }`}>Owner: {isTransferred ? 'Transferred' : 'You'}</p>
                          {!isTransferred && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              🟢 Ready to Transfer
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                            {product.status}
                          </span>
                          {isTransferred && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Transferred
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm"><span className="font-medium">Origin:</span> {product.origin}</p>
                        <p className="text-sm"><span className="font-medium">Method:</span> {product.cultivationMethod}</p>
                        <p className="text-sm"><span className="font-medium">Grade:</span> {product.grade}</p>
                        <p className="text-sm"><span className="font-medium">Next Level:</span> {getNextStakeholder(stakeholderStatus.type)}</p>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                        >
                          <EyeIcon className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                        {(stakeholderStatus.type === 'Farmer' || stakeholderStatus.type === 'Processor' || stakeholderStatus.type === 'Exporter' || stakeholderStatus.type === 'Importer') && (
                          <button
                            onClick={() => {
                              setProductToTransfer(product);
                              setTransferLocation(getDefaultLocation(stakeholderStatus.type));
                              setShowTransferForm(true);
                            }}
                            disabled={loading || isTransferred}
                            className={`flex items-center space-x-2 text-sm px-3 py-1 ${
                              isTransferred
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'btn-primary'
                            }`}
                            title={isTransferred ? 'Product already transferred' : `Transfer to ${getNextStakeholder(stakeholderStatus.type)}`}
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                            <span>{isTransferred ? 'Transferred' : 'Transfer'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Available Products for Processors */}
          {stakeholderStatus.type === 'Processor' && activeTab === 'available' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">How Product Transfer Works</h3>
                <p className="text-sm text-blue-700">
                  Products can only be transferred by their current owner (farmer). Contact the farmer directly to request a transfer to your address: <code className="bg-blue-100 px-1 rounded">{account}</code>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableProducts.map((product) => (
                  <div key={product.id} className="card hover:shadow-xl transition-shadow border-2 border-green-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{product.variety}</h3>
                        <p className="text-sm text-gray-600">Batch: {product.batchId}</p>
                        <p className="text-xs text-green-600">Processor: {product.currentOwner.slice(0,6)}...{product.currentOwner.slice(-4)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm"><span className="font-medium">Origin:</span> {product.origin}</p>
                      <p className="text-sm"><span className="font-medium">Processing:</span> {product.processingMethod}</p>
                      <p className="text-sm"><span className="font-medium">Grade:</span> {product.grade}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBatchRequest(product)}
                          className="btn-primary text-sm px-3 py-1"
                          title="Chat with processor about export"
                        >
                          Request Transfer
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(account)}
                          className="btn-secondary text-sm px-2 py-1"
                          title="Copy your address"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Products for Exporters */}
          {stakeholderStatus.type === 'Exporter' && activeTab === 'available' && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-green-800 mb-2">Ready for Export</h3>
                <p className="text-sm text-green-700">
                  These processed products are ready for export. Chat with processors to negotiate terms and request transfer to your address: <code className="bg-green-100 px-1 rounded">{account}</code>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableProducts.map((product) => (
                  <div key={product.id} className="card hover:shadow-xl transition-shadow border-2 border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{product.variety}</h3>
                        <p className="text-sm text-gray-600">Batch: {product.batchId}</p>
                        <p className="text-xs text-blue-600">Owner: {product.currentOwner.slice(0,6)}...{product.currentOwner.slice(-4)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm"><span className="font-medium">Origin:</span> {product.origin}</p>
                      <p className="text-sm"><span className="font-medium">Method:</span> {product.cultivationMethod}</p>
                      <p className="text-sm"><span className="font-medium">Grade:</span> {product.grade}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBatchRequest(product)}
                          className="btn-primary text-sm px-3 py-1"
                          title="Send message to processor about this batch"
                        >
                          Request Batch
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(account)}
                          className="btn-secondary text-sm px-2 py-1"
                          title="Copy your address"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Products for Importers */}
          {stakeholderStatus.type === 'Importer' && activeTab === 'available' && (
            <div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-purple-800 mb-2">Ready for Import</h3>
                <p className="text-sm text-purple-700">
                  These products from exporters are ready for import. Chat with exporters to negotiate terms and request transfer to your address: <code className="bg-purple-100 px-1 rounded">{account}</code>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableProducts.map((product) => (
                  <div key={product.id} className="card hover:shadow-xl transition-shadow border-2 border-purple-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{product.variety}</h3>
                        <p className="text-sm text-gray-600">Batch: {product.batchId}</p>
                        <p className="text-xs text-purple-600">Exporter: {product.currentOwner.slice(0,6)}...{product.currentOwner.slice(-4)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm"><span className="font-medium">Origin:</span> {product.origin}</p>
                      <p className="text-sm"><span className="font-medium">Method:</span> {product.cultivationMethod}</p>
                      <p className="text-sm"><span className="font-medium">Grade:</span> {product.grade}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBatchRequest(product)}
                          className="btn-primary text-sm px-3 py-1"
                          title="Send message to exporter about this batch"
                        >
                          Request Import
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(account)}
                          className="btn-secondary text-sm px-2 py-1"
                          title="Copy your address"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Products for Retailers */}
          {stakeholderStatus.type === 'Retailer' && activeTab === 'available' && (
            <div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-orange-800 mb-2">Available for Retail</h3>
                <p className="text-sm text-orange-700">
                  These products from importers are available for retail. Chat with importers to negotiate terms and request transfer to your address: <code className="bg-orange-100 px-1 rounded">{account}</code>
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableProducts.map((product) => (
                  <div key={product.id} className="card hover:shadow-xl transition-shadow border-2 border-orange-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{product.variety}</h3>
                        <p className="text-sm text-gray-600">Batch: {product.batchId}</p>
                        <p className="text-xs text-orange-600">Importer: {product.currentOwner.slice(0,6)}...{product.currentOwner.slice(-4)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm"><span className="font-medium">Origin:</span> {product.origin}</p>
                      <p className="text-sm"><span className="font-medium">Method:</span> {product.cultivationMethod}</p>
                      <p className="text-sm"><span className="font-medium">Grade:</span> {product.grade}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                      >
                        <EyeIcon className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBatchRequest(product)}
                          className="btn-primary text-sm px-3 py-1"
                          title="Send message to importer about this batch"
                        >
                          Request Purchase
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(account)}
                          className="btn-secondary text-sm px-2 py-1"
                          title="Copy your address"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      )}

      {/* Create Product Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Product</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch ID</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        name="batchId"
                        value={formData.batchId}
                        onChange={handleInputChange}
                        className="input-field flex-1"
                        required
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, batchId: generateUniqueBatchId() }))}
                        className="btn-secondary px-3 py-2 text-sm"
                        title="Generate new batch ID"
                      >
                        🔄
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-generated unique batch ID</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
                    <input
                      type="text"
                      name="variety"
                      value={formData.variety}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                    <input
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cultivation Method</label>
                    <select
                      name="cultivationMethod"
                      value={formData.cultivationMethod}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="organic">Organic</option>
                      <option value="conventional">Conventional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Processing Method</label>
                    <input
                      type="text"
                      name="processingMethod"
                      value={formData.processingMethod}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <input
                      type="text"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Organic', 'Fair Trade', 'Quality Assured', 'Rainforest Alliance'].map((cert) => (
                      <label key={cert} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={cert}
                          checked={formData.certifications.includes(cert)}
                          onChange={handleCertificationChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm">{cert}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                    <span>{loading ? 'Creating...' : 'Create Product'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}



      {/* Transfer Modal for All Stakeholders */}
      {showTransferForm && productToTransfer && (stakeholderStatus.type === 'Farmer' || stakeholderStatus.type === 'Processor' || stakeholderStatus.type === 'Exporter' || stakeholderStatus.type === 'Importer' || stakeholderStatus.type === 'Retailer') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Transfer Product</h2>
              
              <form onSubmit={handleTransfer}>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">{productToTransfer.variety}</h3>
                    <p className="text-sm text-gray-600">Batch: {productToTransfer.batchId}</p>
                    <p className="text-sm text-gray-600">Origin: {productToTransfer.origin}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer to {getNextStakeholder(stakeholderStatus.type)} Address *
                    </label>
                    <input
                      type="text"
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      placeholder="0x..."
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the {getNextStakeholder(stakeholderStatus.type).toLowerCase()}'s wallet address
                    </p>
                    {transferAddress && !transferAddress.startsWith('0x') && (
                      <p className="text-xs text-red-500 mt-1">
                        Address must start with 0x
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Location *
                    </label>
                    <input
                      type="text"
                      value={transferLocation}
                      onChange={(e) => setTransferLocation(e.target.value)}
                      placeholder={getDefaultLocation(stakeholderStatus.type)}
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Location where the product will be transferred
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transfer Notes
                    </label>
                    <textarea
                      value={transferAddress ? `Product transferred to ${getNextStakeholder(stakeholderStatus.type)} for further processing` : ''}
                      onChange={() => {}} // Read-only for now
                      placeholder="Additional notes about the transfer"
                      className="input-field bg-gray-50"
                      rows="2"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Automatic transfer description
                    </p>
                  </div>
                </div>

                {transferAddress && transferLocation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-blue-900 mb-2">Transfer Summary</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><span className="font-medium">From:</span> {stakeholderStatus.type} (You)</p>
                      <p><span className="font-medium">To:</span> {getNextStakeholder(stakeholderStatus.type)} ({transferAddress.slice(0,6)}...{transferAddress.slice(-4)})</p>
                      <p><span className="font-medium">Product:</span> {productToTransfer?.variety} - {productToTransfer?.batchId}</p>
                      <p><span className="font-medium">Location:</span> {transferLocation}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferForm(false);
                      setProductToTransfer(null);
                      setTransferAddress('');
                      setTransferLocation('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !transferAddress.startsWith('0x') || transferAddress.length !== 42}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                    <span>{loading ? 'Transferring...' : `Transfer to ${getNextStakeholder(stakeholderStatus.type)}`}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedProduct.variety}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Product Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Batch ID:</span> {selectedProduct.batchId}</p>
                      <p><span className="font-medium">Origin:</span> {selectedProduct.origin}</p>
                      <p><span className="font-medium">Method:</span> {selectedProduct.cultivationMethod}</p>
                      <p><span className="font-medium">Processing:</span> {selectedProduct.processingMethod}</p>
                      <p><span className="font-medium">Grade:</span> {selectedProduct.grade}</p>
                      <p><span className="font-medium">Status:</span> 
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedProduct.status)}`}>
                          {selectedProduct.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Certifications</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedProduct.certifications.map((cert, index) => (
                        <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <h3 className="font-medium text-gray-900 mb-2">QR Code</h3>
                  <div id="qr-download-area" className="bg-white p-4 rounded-lg border">
                    <QRCode value={`TEA-${selectedProduct.batchId}`} size={200} />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center mb-4">
                    Scan to view product details
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadQRCode(selectedProduct)}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => printQRCode(selectedProduct)}
                      className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      <PrinterIcon className="w-4 h-4" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Floating Chat Widget - Always Available */}
      <ChatWidget 
        productId={chatProductId} 
        ownerAddress={chatOwnerAddress}
      />
    </div>
  );
};

export default Products;