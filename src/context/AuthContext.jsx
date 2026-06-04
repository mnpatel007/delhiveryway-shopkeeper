/* eslint-disable react-refresh/only-export-components --
   This context file intentionally co-locates the AuthProvider component and the
   useAuth hook. Splitting them would only satisfy React Fast Refresh's DX rule
   without any runtime benefit. */
import { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

// Hydrate the initial auth state from localStorage so we never call setState
// synchronously inside an effect (react-hooks/set-state-in-effect).
const getInitialUser = () => {
  const token = localStorage.getItem('vendorToken');
  const userData = localStorage.getItem('vendorData');

  if (!token || !userData) return null;

  try {
    const decoded = jwtDecode(token);
    // Token expired -> treat as logged out and clear the stale storage.
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('vendorToken');
      localStorage.removeItem('vendorData');
      return null;
    }
    return JSON.parse(userData);
  } catch {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorData');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [loading] = useState(false);

  const login = (token, userData) => {
    localStorage.setItem('vendorToken', token);
    localStorage.setItem('vendorData', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
