import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { VendorProvider, useVendor } from './context/VendorContext';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import { VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from './pages/auth/authpages';
import ClaimPage from './pages/claim/ClaimPage';
import Dashboard from './pages/dashboard/Dashboard';
import OrdersPage from './pages/orders/OrdersPage';
import MenuPage from './pages/menu/MenuPage';
import TimingsPage from './pages/settings/TimingsPage';
import ProfilePage from './pages/profile/ProfilePage';
import Shell, { Aurora } from './components/Shell';

import './styles/theme.css';

const Booting = ({ text = 'Loading...' }) => (
  <>
    <Aurora />
    <div className="center-screen">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  </>
);

/**
 * Signed in, and bound to a shop. A vendor who has not yet redeemed their
 * claim code is sent to the claim screen rather than an empty dashboard.
 */
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  const { linked, loading: vendorLoading } = useVendor();

  if (loading || vendorLoading) return <Booting text="Checking your account..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!linked) return <Navigate to="/claim" replace />;

  return <Shell>{children}</Shell>;
};

/** Signed in, but deliberately outside the shell — the claim gate. */
const ClaimGate = () => {
  const { user, loading } = useAuth();
  const { linked, loading: vendorLoading } = useVendor();

  if (loading || vendorLoading) return <Booting text="Checking your account..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (linked) return <Navigate to="/dashboard" replace />;

  return <ClaimPage />;
};

/** Already signed in? Skip the sign-in screens. */
const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Booting />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicOnly>
          <LoginPage />
        </PublicOnly>
      }
    />
    <Route
      path="/signup"
      element={
        <PublicOnly>
          <SignupPage />
        </PublicOnly>
      }
    />
    {/* These stay reachable while signed in: the links arrive by email. */}
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    <Route path="/claim" element={<ClaimGate />} />

    <Route
      path="/dashboard"
      element={
        <Protected>
          <Dashboard />
        </Protected>
      }
    />
    <Route
      path="/orders"
      element={
        <Protected>
          <OrdersPage />
        </Protected>
      }
    />
    <Route
      path="/menu"
      element={
        <Protected>
          <MenuPage />
        </Protected>
      }
    />
    <Route
      path="/timings"
      element={
        <Protected>
          <TimingsPage />
        </Protected>
      }
    />
    <Route
      path="/profile"
      element={
        <Protected>
          <ProfilePage />
        </Protected>
      }
    />

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <VendorProvider>
      <AppRoutes />
    </VendorProvider>
  </BrowserRouter>
);

export default App;
