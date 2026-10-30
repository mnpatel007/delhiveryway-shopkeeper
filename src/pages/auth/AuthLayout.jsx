import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Aurora } from '../../components/Shell';
import './auth.css';

/**
 * Shared frame for every signed-out screen: aurora ground, a glass panel,
 * and a quiet marketing rail that collapses away on small screens.
 */
const AuthLayout = ({ title, subtitle, children, footer }) => (
  <>
    <Aurora />
    <div className="auth-wrap">
      <motion.aside
        className="auth-rail"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-rail-mark" aria-hidden="true" />
        <h2 className="display">
          Run your shop,
          <br />
          <span className="skew-slab">on your terms</span>
        </h2>
        <p className="muted auth-rail-copy">
          Set your own opening hours, watch orders land in real time, and see exactly what each day
          earned you.
        </p>
        <ul className="auth-rail-list">
          <li>
            <span aria-hidden="true">◷</span> Open and close whenever you choose
          </li>
          <li>
            <span aria-hidden="true">▤</span> Every order, delivered and cancelled
          </li>
          <li>
            <span aria-hidden="true">◈</span> Earnings broken down day by day
          </li>
        </ul>
      </motion.aside>

      <motion.div
        className="auth-panel glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      >
        <div className="auth-head">
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="auth-foot">{footer}</div>}
      </motion.div>
    </div>
  </>
);

export const AuthLink = ({ to, children }) => (
  <Link to={to} className="auth-link">
    {children}
  </Link>
);

export default AuthLayout;
