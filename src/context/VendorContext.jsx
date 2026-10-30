/* eslint-disable react-refresh/only-export-components --
   Provider and hook are co-located deliberately, as in AuthContext. */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const VendorContext = createContext(null);

/**
 * Where this vendor stands with their shop. Everything behind the login is
 * gated on `linked`: until an admin's claim code has been redeemed there is
 * no shop to show, so the portal sends them to the claim screen instead.
 */
export const VendorProvider = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(Boolean(user));

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await api.get('/shop-owner/status');
      const data = res.data?.data || null;
      setStatus(data);
      return data;
    } catch {
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Fetching on mount: state lands after the request settles, which the
    // set-state-in-effect rule cannot tell apart from a sync cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return (
    <VendorContext.Provider value={{ status, loading, refresh, linked: Boolean(status?.linked) }}>
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = () => {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error('useVendor must be used within a VendorProvider');
  return ctx;
};
