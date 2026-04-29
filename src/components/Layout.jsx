import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shopName, setShopName] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/shop-owner/profile');
        if (response.data.data.shop) {
          setShopName(response.data.data.shop.name);
        }
      } catch (err) {
        console.error('Failed to fetch shop profile', err);
      }
    };
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Sales Report', path: '/sales-report', icon: '📈' },
    { name: 'Shop Timing', path: '/settings/timing', icon: '🕒' },
    { name: 'Commission', path: '/settings/commission', icon: '💰' },
  ];

  return (
    <div className="layout">
      {/* Premium Sidebar */}
      <aside className="sidebar">
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-bold text-primary-600 mb-1">DelhiveryWay</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Shop Owner Portal</p>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-100 px-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-500 hover:bg-red-50 w-full rounded-lg transition-all font-semibold"
          >
            <span className="text-lg">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="flex justify-between items-center mb-10 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 capitalize mb-2">
              {location.pathname.split('/').pop().replace('-', ' ') || 'Dashboard'}
            </h1>
            <p className="text-gray-500 text-base">
              Welcome back, {user?.name} {shopName && <span className="text-primary-600 font-semibold">• {shopName}</span>}
            </p>
          </div>
          
          {/* Profile Widget properly aligned */}
          <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-full shadow-sm border">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600 text-lg">
              {user?.name?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-bold text-sm text-gray-900">{shopName || user?.name}</p>
              <p className="text-xs text-gray-500 font-medium">Shop Owner</p>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default Layout;
