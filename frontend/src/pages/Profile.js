import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useSupabase } from '../context/SupabaseContext';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  MapPinIcon, 
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Profile = () => {
  const { account, isConnected, registerStakeholder, checkStakeholderStatus, getStakeholder } = useWeb3();
  const { getProfile: getSupabaseProfile, saveProfile: saveSupabaseProfile, updateProfile: updateSupabaseProfile } = useSupabase();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stakeholderStatus, setStakeholderStatus] = useState({ isRegistered: false, type: null, name: null });

  // Profile data - will be populated from blockchain or defaults for new users
  const [profile, setProfile] = useState({
    name: '',
    type: 'Farmer',
    location: '',
    email: '',
    phone: '',
    established: '',
    certifications: [],
    description: '',
    walletAddress: account,
    reputation: 0,
    totalProducts: 0,
    completedTransactions: 0,
    activeContracts: 0
  });

  const [editForm, setEditForm] = useState({ ...profile });

  const stakeholderTypes = [
    'Farmer',
    'Processor', 
    'Exporter',
    'Importer',
    'Retailer',
    'Regulator'
  ];

  const availableCertifications = [
    'Organic',
    'Fair Trade',
    'Rainforest Alliance',
    'UTZ Certified',
    'ISO 22000',
    'HACCP',
    'Quality Assured',
    'Carbon Neutral'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCertificationChange = (certification) => {
    setEditForm(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter(cert => cert !== certification)
        : [...prev.certifications, certification]
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // If this is a new registration (user not registered on blockchain)
      if (!stakeholderStatus.isRegistered) {
        const typeIndex = stakeholderTypes.indexOf(editForm.type);
        await registerStakeholder(
          editForm.name,
          typeIndex,
          editForm.location,
          editForm.certifications
        );
        
        // Update stakeholder status after registration
        setTimeout(async () => {
          const newStatus = await checkStakeholderStatus(account);
          setStakeholderStatus(newStatus);
        }, 2000);
      }
      
      // Save non-blockchain data to Supabase
      const supabaseData = {
        email: editForm.email,
        phone: editForm.phone,
        established: editForm.established,
        description: editForm.description
      };
      
      try {
        await saveSupabaseProfile(supabaseData);
      } catch (error) {
        console.warn('Could not save to Supabase:', error);
      }
      
      setProfile({ ...editForm, walletAddress: account });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({ ...profile });
    setIsEditing(false);
  };

  // Load stakeholder data when component mounts or account changes
  useEffect(() => {
    const loadStakeholderData = async () => {
      if (account && isConnected && checkStakeholderStatus && !isEditing) {
        const status = await checkStakeholderStatus(account);
        setStakeholderStatus(status);
        
        if (status.isRegistered) {
          // Get blockchain data
          const stakeholderData = await getStakeholder(account);
          // Get Supabase data
          const supabaseData = await getSupabaseProfile();
          
          const newProfile = {
            name: status.name || '',
            type: status.type || 'Farmer',
            location: stakeholderData?.location || '',
            email: supabaseData?.email || '',
            phone: supabaseData?.phone || '',
            established: supabaseData?.established || '',
            certifications: stakeholderData?.certifications || [],
            description: supabaseData?.description || '',
            walletAddress: account,
            reputation: stakeholderData?.reputation || 0,
            totalProducts: 0,
            completedTransactions: 0,
            activeContracts: 0
          };
          setProfile(newProfile);
          if (!isEditing) setEditForm(newProfile);
        } else {
          const defaultProfile = {
            name: '',
            type: 'Farmer',
            location: '',
            email: '',
            phone: '',
            established: '',
            certifications: [],
            description: '',
            walletAddress: account,
            reputation: 0,
            totalProducts: 0,
            completedTransactions: 0,
            activeContracts: 0
          };
          setProfile(defaultProfile);
          if (!isEditing) setEditForm(defaultProfile);
        }
      }
    };
    
    loadStakeholderData();
  }, [account, isConnected, isEditing]);

  const getReputationColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'farmer': return '🌱';
      case 'processor': return '⚙️';
      case 'exporter': return '📦';
      case 'importer': return '🚢';
      case 'retailer': return '🏪';
      case 'regulator': return '🏛️';
      default: return '👤';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to view and manage your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your stakeholder information and credentials.</p>
          {stakeholderStatus.isRegistered ? (
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Registered as {stakeholderStatus.type}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⚠ Not registered - Please complete registration
              </span>
            </div>
          )}
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <CheckIcon className="w-4 h-4" />
              <span>{loading ? (stakeholderStatus.isRegistered ? 'Saving...' : 'Registering...') : (stakeholderStatus.isRegistered ? 'Save' : 'Register on Blockchain')}</span>
            </button>
            <button
              onClick={handleCancel}
              className="btn-secondary flex items-center space-x-2"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              <div className="text-xs text-gray-500">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 mr-2">
                  🔗 Blockchain
                </span>
                Name, Type, Location, Certifications
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Data Storage:</strong> Name, Type, Location, and Certifications are stored on blockchain. Email, Phone, Established, and Description are stored in Supabase database.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-blue-600">🔗</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stakeholder Type <span className="text-blue-600">🔗</span>
                </label>
                {isEditing ? (
                  <select
                    name="type"
                    value={editForm.type}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    {stakeholderTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getTypeIcon(profile.type)}</span>
                    <span className="text-gray-900">{profile.type}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-blue-600">🔗</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900 flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1 text-gray-500" />
                    {profile.location}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900">{profile.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900">{profile.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Established
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="established"
                    value={editForm.established}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900">{profile.established}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              {isEditing ? (
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-900">{profile.description}</p>
              )}
            </div>
          </div>

          {/* Certifications */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
              <span className="text-blue-600">🔗 Blockchain</span>
            </div>
            
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableCertifications.map(cert => (
                  <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.certifications.includes(cert)}
                      onChange={() => handleCertificationChange(cert)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{cert}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.certifications.map(cert => (
                  <span
                    key={cert}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span>{cert}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Blockchain Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Information</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                    {account}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(account)}
                    className="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Reputation Score */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation Score</h3>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getReputationColor(profile.reputation)}`}>
                {profile.reputation}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Based on transaction history and quality metrics
              </p>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Statistics</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Products</span>
                <span className="font-semibold text-gray-900">{profile.totalProducts}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Transactions</span>
                <span className="font-semibold text-gray-900">{profile.completedTransactions}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Contracts</span>
                <span className="font-semibold text-gray-900">{profile.activeContracts}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-semibold text-green-600">
                  {Math.round((profile.completedTransactions / profile.totalProducts) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <button className="w-full text-left p-2 text-sm text-primary-600 hover:bg-primary-50 rounded border border-primary-200 transition-colors">
                View Transaction History
              </button>
              <button className="w-full text-left p-2 text-sm text-primary-600 hover:bg-primary-50 rounded border border-primary-200 transition-colors">
                Download Certificates
              </button>
              <button className="w-full text-left p-2 text-sm text-primary-600 hover:bg-primary-50 rounded border border-primary-200 transition-colors">
                Export Profile Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;