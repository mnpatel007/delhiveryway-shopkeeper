import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import Dashboard from './pages/dashboard/Dashboard';
import ConsentPage from './pages/consent/ConsentPage';
import TimingSettings from './pages/settings/TimingSettings';
import CommissionSettings from './pages/settings/CommissionSettings';
import SalesReport from './pages/reports/SalesReport';

const PrivateRoute = ({ children, requireConsent = true }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  // Note: We might need to fetch the shop data to check consent status
  // For now, we'll handle consent redirection inside the Dashboard or a Layout component
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Private Routes */}
        <Route path="/consent" element={
          <PrivateRoute requireConsent={false}>
            <ConsentPage />
          </PrivateRoute>
        } />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        <Route path="/settings/timing" element={
          <PrivateRoute>
            <TimingSettings />
          </PrivateRoute>
        } />

        <Route path="/settings/commission" element={
          <PrivateRoute>
            <CommissionSettings />
          </PrivateRoute>
        } />

        <Route path="/sales-report" element={
          <PrivateRoute>
            <SalesReport />
          </PrivateRoute>
        } />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
