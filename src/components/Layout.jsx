import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="mb-10">
          <h2 className="text-xl font-bold text-primary-600">DelhiveryWay</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Shop Owner</p>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-600 font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-8 left-8 right-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg transition-colors font-semibold"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 capitalize">
              {location.pathname.split('/').pop() || 'Dashboard'}
            </h1>
            <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500">Shop Owner</p>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default Layout;
