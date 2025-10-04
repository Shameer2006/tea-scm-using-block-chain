import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import { SupabaseProvider } from './context/SupabaseContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Traceability from './pages/Traceability';
import Profile from './pages/Profile';
import QRScanner from './pages/QRScanner';
import Auth from './pages/Auth';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const authData = localStorage.getItem('teaAuth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // Check if auth is still valid (24 hours)
        const loginTime = new Date(parsed.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('teaAuth');
        }
      } catch (error) {
        localStorage.removeItem('teaAuth');
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('teaAuth');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">🍃</span>
          </div>
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <Web3Provider>
      <SupabaseProvider>
        {!isAuthenticated ? (
          <Auth onAuthSuccess={handleAuthSuccess} />
        ) : (
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Navbar onLogout={handleLogout} />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/traceability" element={<Traceability />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/scanner" element={<QRScanner />} />
                </Routes>
              </main>
              <Toaster position="top-right" />
            </div>
          </Router>
        )}
      </SupabaseProvider>
    </Web3Provider>
  );
}

export default App;