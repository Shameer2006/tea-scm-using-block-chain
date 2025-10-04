import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://suxamyqeuswzmjtpurng.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1eGFteXFldXN3em1qdHB1cm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MjU3MjksImV4cCI6MjA3NDMwMTcyOX0.H7QBZM6Qp3j0_HWGNioeY7rlo3lR0Y8u4JP7WF1857U'
);

const Dashboard = ({ setIsAuthenticated }) => {
  const [stakeholders, setStakeholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    loadStakeholders();
  }, []);

  const loadStakeholders = async () => {
    try {
      const { data, error } = await supabase
        .from('stakeholder_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStakeholders(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(s => s.approval_status === 'pending').length || 0;
      const approved = data?.filter(s => s.approval_status === 'approved').length || 0;
      const rejected = data?.filter(s => s.approval_status === 'rejected').length || 0;
      
      setStats({ total, pending, approved, rejected });
    } catch (error) {
      console.error('Error loading stakeholders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApprovalStatus = async (walletAddress, status) => {
    try {
      const { error } = await supabase
        .from('stakeholder_profiles')
        .update({ 
          approval_status: status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('wallet_address', walletAddress);

      if (error) throw error;
      
      loadStakeholders(); // Refresh data
    } catch (error) {
      console.error('Error updating approval status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  const getStakeholderTypeLabel = (type) => {
    const types = {
      0: 'Farmer',
      1: 'Processor', 
      2: 'Exporter',
      3: 'Importer',
      4: 'Retailer',
      5: 'Regulator'
    };
    return types[type] || 'Unknown';
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">🍃</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tea Chain Admin</h1>
                <p className="text-sm text-gray-500">Stakeholder Management Portal</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Stakeholders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stakeholders Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Stakeholder Registrations</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stakeholder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stakeholders.map((stakeholder) => (
                  <tr key={stakeholder.wallet_address} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {stakeholder.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stakeholder.wallet_address.slice(0, 10)}...{stakeholder.wallet_address.slice(-8)}
                        </div>
                        {stakeholder.email && (
                          <div className="text-sm text-gray-500">{stakeholder.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {getStakeholderTypeLabel(stakeholder.stakeholder_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stakeholder.location || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(stakeholder.approval_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(stakeholder.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {stakeholder.approval_status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateApprovalStatus(stakeholder.wallet_address, 'approved')}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => updateApprovalStatus(stakeholder.wallet_address, 'rejected')}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                      {stakeholder.approval_status === 'approved' && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <ShieldCheckIcon className="h-4 w-4" />
                          <span>Verified</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {stakeholders.length === 0 && (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No stakeholders</h3>
                <p className="mt-1 text-sm text-gray-500">No stakeholder registrations found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;