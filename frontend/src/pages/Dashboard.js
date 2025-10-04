import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Link } from 'react-router-dom';
import { 
  CubeIcon, 
  TruckIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { isConnected, account, contract, getAllProducts, checkStakeholderStatus } = useWeb3();
  const [stakeholderStatus, setStakeholderStatus] = useState({ isRegistered: false, type: null, name: null });
  const [stats, setStats] = useState({
    totalProducts: 0,
    inTransit: 0,
    completed: 0,
    pending: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshDashboard = async () => {
    if (!contract || !isConnected || !account) return;
    
    try {
      setLoading(true);
      
      const status = await checkStakeholderStatus(account);
      setStakeholderStatus(status);
      
      const productCount = await contract.getProductCount();
      const transactionCount = await contract.getTransactionCount();
      const products = await getAllProducts();
      
      const statusCounts = { harvested: 0, processed: 0, inTransit: 0, delivered: 0, sold: 0 };
      products.forEach(product => {
        const status = product.status.toLowerCase().replace(' ', '');
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      });
      
      setStats({
        totalProducts: Number(productCount),
        inTransit: statusCounts.inTransit,
        completed: statusCounts.delivered + statusCounts.sold,
        pending: statusCounts.harvested + statusCounts.processed
      });
      
      setPieData([
        { name: 'Harvested', value: statusCounts.harvested, color: '#22c55e' },
        { name: 'Processed', value: statusCounts.processed, color: '#eab308' },
        { name: 'In Transit', value: statusCounts.inTransit, color: '#3b82f6' },
        { name: 'Delivered', value: statusCounts.delivered + statusCounts.sold, color: '#8b5cf6' }
      ]);
      
      const activity = products.slice(-4).map((product, index) => ({
        id: index + 1,
        action: 'Product Created',
        product: `${product.variety} Batch #${product.batchId}`,
        time: new Date(product.harvestDate).toLocaleDateString(),
        status: 'success'
      }));
      
      setRecentActivity(activity);
      setChartData([{ name: 'Current', products: Number(productCount), transactions: Number(transactionCount) }]);
      
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!contract || !isConnected || !account) return;
      
      try {
        setLoading(true);
        
        // Check stakeholder status
        const status = await checkStakeholderStatus(account);
        setStakeholderStatus(status);
        
        // Get products
        const products = await getAllProducts();
        const productCount = products.length;
        
        // Set basic stats
        setStats({
          totalProducts: productCount,
          inTransit: Math.floor(productCount * 0.2),
          completed: Math.floor(productCount * 0.6),
          pending: Math.floor(productCount * 0.2)
        });
        
        // Set pie data
        if (productCount > 0) {
          setPieData([
            { name: 'Harvested', value: Math.floor(productCount * 0.4), color: '#22c55e' },
            { name: 'Processed', value: Math.floor(productCount * 0.3), color: '#eab308' },
            { name: 'In Transit', value: Math.floor(productCount * 0.2), color: '#3b82f6' },
            { name: 'Delivered', value: Math.floor(productCount * 0.1), color: '#8b5cf6' }
          ]);
        }
        
        // Set chart data
        setChartData([{ name: 'Current', products: productCount, transactions: productCount * 2 }]);
        
        // Set recent activity
        if (products.length > 0) {
          const activity = products.slice(-4).map((product, index) => ({
            id: index + 1,
            action: 'Product Created',
            product: `${product.variety} Batch #${product.batchId}`,
            time: new Date(product.harvestDate).toLocaleDateString(),
            status: 'success'
          }));
          setRecentActivity(activity);
        }
        
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [contract, isConnected, account]);

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CubeIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-4">Please connect your wallet to access the tea supply chain dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Background */}
      <div className="relative bg-gradient-to-r from-green-600 to-green-800 rounded-xl overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`
          }}
        ></div>
        <div className="relative px-6 py-12 sm:px-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Welcome to Tea Supply Chain
            </h1>
            <p className="text-lg text-green-100 mb-6 leading-relaxed">
              Experience complete transparency in your tea journey from farm to cup. Our blockchain-powered platform 
              ensures every step is tracked, verified, and trusted. Join thousands of farmers, processors, and retailers 
              building a more transparent tea industry.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                <span className="text-sm">Blockchain Verified</span>
              </div>
              <div className="flex items-center text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                <span className="text-sm">End-to-End Traceability</span>
              </div>
              <div className="flex items-center text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-2"></div>
                <span className="text-sm">Quality Assured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your tea supply chain.</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <button
            onClick={refreshDashboard}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-4 h-4" />
              <span>Connected: {account?.slice(0, 6)}...{account?.slice(-4)}</span>
            </div>
            {stakeholderStatus.isRegistered ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {stakeholderStatus.type}
              </span>
            ) : (
              <Link 
                to="/profile" 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
              >
                Register Now
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Registration Warning for Unregistered Users */}
      {!stakeholderStatus.isRegistered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Complete Your Registration
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You need to register as a stakeholder to access all features of the tea supply chain platform.
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    to="/profile"
                    className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={CubeIcon}
          color="bg-primary-500"
          change={12}
        />
        <StatCard
          title="In Transit"
          value={stats.inTransit}
          icon={TruckIcon}
          color="bg-blue-500"
          change={-3}
        />
        <StatCard
          title="Completed"
          value={stats.completed.toLocaleString()}
          icon={CheckCircleIcon}
          color="bg-green-500"
          change={8}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={ClockIcon}
          color="bg-yellow-500"
          change={5}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="products" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.product}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;