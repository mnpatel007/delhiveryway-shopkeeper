import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useVendor } from '../../context/VendorContext';
import AuthLayout from '../auth/AuthLayout';

/**
 * The gate between signing in and seeing a shop.
 *
 * Three states, driven by /shop-owner/status:
 *   not applied  -> ask which shop is theirs
 *   applied      -> waiting on an admin to issue a code
 *   code issued  -> enter it, once
 */
const ClaimPage = () => {
  const { status, refresh } = useVendor();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const applied = Boolean(status?.applied);
  const codeIssued = Boolean(status?.codeIssued);
  const needsPhone = Boolean(status?.needsPhone);

  // Keep the field in the shape codes are issued in: XXXX-XXXX.
  const onCodeChange = (e) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw);
  };

  const apply = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/shop-owner/apply', { shopName, phone });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your request.');
    } finally {
      setBusy(false);
    }
  };

  const claim = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/shop-owner/claim', { code });
      const next = await refresh();
      if (next?.linked) navigate('/dashboard', { replace: true });
      else setError('Connected, but the shop did not load. Try signing in again.');
    } catch (err) {
      setError(err.response?.data?.message || 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const footer = (
    <button
      onClick={signOut}
      className="auth-link"
      style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}
    >
      Sign out
    </button>
  );

  /* ------------------------------------------------ 1. has not applied yet */
  if (!applied && !codeIssued) {
    return (
      <AuthLayout
        title="Which shop is yours?"
        subtitle="You are signed in. Tell us your shop and we will connect you to it."
        footer={footer}
      >
        <form onSubmit={apply}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="alert alert-info">
            Hello {user?.name?.split(' ')[0]} — you are using the same account you order with, so
            there is nothing new to remember.
          </div>

          <div className="field">
            <label htmlFor="shopName">Shop name</label>
            <input
              id="shopName"
              className="input"
              placeholder="The name customers see"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>

          {/* Only asked for when we have no usable number on the account -
              typically a Google sign-in, which never gave us one. */}
          {needsPhone && (
            <div className="field">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                className="input"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
              <p className="auth-aside-note" style={{ marginTop: 8 }}>
                We have no number on your account. This is how we reach you about orders.
              </p>
            </div>
          )}

          <button
            className="btn btn-primary btn-wide"
            type="submit"
            disabled={busy || !shopName.trim() || (needsPhone && phone.length !== 10)}
          >
            {busy ? 'Sending...' : 'Request access'}
          </button>
        </form>
      </AuthLayout>
    );
  }

  /* ------------------------------------------- 2 & 3. waiting / enter code */
  return (
    <AuthLayout
      title={codeIssued ? 'Enter your access code' : 'Almost there'}
      subtitle={
        codeIssued
          ? 'Use the code we emailed you. You only need it once.'
          : 'We are matching you to your shop.'
      }
      footer={footer}
    >
      {codeIssued ? (
        <div className="alert alert-ok">
          A code for your shop was emailed to <strong>{user?.email}</strong>
          {status?.codeExpiresAt && (
            <>
              {' '}
              and expires on{' '}
              {new Date(status.codeExpiresAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </>
          )}
          .
        </div>
      ) : (
        <div className="auth-centered">
          <div className="auth-result-icon wait" aria-hidden="true">
            ◷
          </div>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            Thanks {user?.name?.split(' ')[0]}. We are checking{' '}
            <strong>{status?.requestedShopName || 'your shop'}</strong>. Once confirmed, an access
            code arrives by email.
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left', marginTop: 18 }}>
            Already been sent a code? Enter it below.
          </div>
        </div>
      )}

      <form onSubmit={claim} style={{ marginTop: codeIssued ? 0 : 18 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="code">Access code</label>
          <input
            id="code"
            className="input"
            placeholder="ABCD-2345"
            value={code}
            onChange={onCodeChange}
            autoComplete="one-time-code"
            style={{ textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: '0.3em' }}
            required
          />
        </div>

        <button
          className="btn btn-primary btn-wide"
          type="submit"
          disabled={busy || code.replace('-', '').length < 8}
        >
          {busy ? 'Connecting...' : 'Connect my shop'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ClaimPage;
