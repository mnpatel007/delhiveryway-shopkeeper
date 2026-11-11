import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useVendor } from '../context/VendorContext';
import './Shell.css';

export const Aurora = () => (
  <div className="aurora" aria-hidden="true">
    <span />
    <span />
    <span />
  </div>
);

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: '◈' },
  { to: '/orders', label: 'Orders', icon: '▤' },
  { to: '/menu', label: 'Menu', icon: '▦' },
  { to: '/timings', label: 'Opening hours', icon: '◷' },
  { to: '/profile', label: 'Profile', icon: '◉' },
];

const Shell = ({ children }) => {
  const { user, logout } = useAuth();
  const { status } = useVendor();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <Aurora />

      <header className="shell-bar">
        <div className="shell-bar-inner">
          <div className="shell-brand">
            <span className="shell-mark" aria-hidden="true" />
            <div className="shell-brand-text">
              <strong>{status?.shop?.name || 'Partner portal'}</strong>
              <span>{user?.name}</span>
            </div>
          </div>

          <nav className="shell-nav">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `shell-link ${isActive ? 'active' : ''}`}
              >
                <span className="shell-link-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="shell-link-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button className="btn btn-ghost shell-out" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.main>
    </>
  );
};

export default Shell;
