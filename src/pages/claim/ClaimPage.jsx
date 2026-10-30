import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useVendor } from '../../context/VendorContext';
import AuthLayout from '../auth/AuthLayout';

/**
 * The gate. A verified vendor lands here until they redeem the one-time code
 * an admin issued for their shop.
 */
const ClaimPage = () => {
  const { status, refresh } = useVendor();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Keep the field in the shape codes are issued in: XXXX-XXXX.
  const onChange = (e) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw);
  };

  const submit = async (e) => {
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

  const waiting = !status?.codeIssued;

  return (
    <AuthLayout
      title={waiting ? 'Almost there' : 'Enter your access code'}
      subtitle={
        waiting
          ? 'Your account is ready — it just needs connecting to your shop.'
          : 'Use the code we emailed you. You only need it once.'
      }
      footer={
        <button
          onClick={signOut}
          className="auth-link"
          style={{ background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}
        >
          Sign out
        </button>
      }
    >
      {waiting ? (
        <div className="auth-centered">
          <div className="auth-result-icon wait" aria-hidden="true">
            ◷
          </div>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            Hello {user?.name?.split(' ')[0]}. We are matching your account to{' '}
            <strong>{status?.requestedShopName || 'your shop'}</strong>. Once our team confirms it,
            you will get an access code by email.
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left', marginTop: 18 }}>
            Already been sent a code? Enter it below.
          </div>
        </div>
      ) : (
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
      )}

      <form onSubmit={submit} style={{ marginTop: waiting ? 18 : 0 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="code">Access code</label>
          <input
            id="code"
            className="input"
            placeholder="ABCD-2345"
            value={code}
            onChange={onChange}
            autoComplete="one-time-code"
            style={{
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '0.3em',
            }}
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
