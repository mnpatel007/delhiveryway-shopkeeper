import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Row = ({ label, value }) => (
  <div className="om-row">
    <span>{label}</span>
    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{value || '—'}</span>
  </div>
);

const ProfilePage = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/shop-owner/profile')
      .then((res) => {
        setShop(res.data?.data?.shop || null);
        setVendor(res.data?.data?.vendor || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  const addr = shop?.address;
  const addressLine = addr
    ? [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')
    : null;

  return (
    <div className="page">
      <div style={{ marginBottom: 22 }}>
        <p className="eyebrow">Account</p>
        <h1 className="display" style={{ fontSize: 'clamp(26px,4vw,38px)' }}>
          Your details
        </h1>
      </div>

      <motion.div
        className="glass"
        style={{ padding: '24px 26px', marginBottom: 16 }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>You</h3>
        <div className="order-money" style={{ background: 'transparent', border: 0, padding: 0 }}>
          <Row label="Name" value={vendor?.name || user?.name} />
          <Row label="Email" value={vendor?.email || user?.email} />
          <Row label="Phone" value={vendor?.phone || user?.phone} />
          <Row
            label="Email verified"
            value={vendor?.isVerified ? 'Yes' : 'Not yet'}
          />
        </div>
      </motion.div>

      <motion.div
        className="glass"
        style={{ padding: '24px 26px' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>Your shop</h3>
        {shop ? (
          <div className="order-money" style={{ background: 'transparent', border: 0, padding: 0 }}>
            <Row label="Shop" value={shop.name} />
            <Row label="Category" value={shop.category} />
            <Row label="Address" value={addressLine} />
            <Row label="Status" value={shop.isActive === false ? 'Inactive' : 'Active'} />
            <Row
              label="Temporarily closed"
              value={shop.isTemporarilyClosed ? 'Yes' : 'No'}
            />
          </div>
        ) : (
          <p className="muted">No shop is connected to your account yet.</p>
        )}

        <div className="alert alert-info" style={{ marginTop: 18, marginBottom: 0 }}>
          Need any of this changed? Contact the team — shop details are managed centrally so the
          storefront stays accurate.
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
