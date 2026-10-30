/* Three short signed-out screens kept together: verify, forgot, reset. */
import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AuthLayout, { AuthLink } from './AuthLayout';

/* ------------------------------------------------------------- verify */
export const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState('working'); // working | ok | bad
  const [message, setMessage] = useState('');
  // StrictMode mounts effects twice in dev; the token is single-use, so guard.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    const email = params.get('email');

    if (!token || !email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState('bad');
      setMessage('That link is incomplete. Open the one from your email directly.');
      return;
    }

    api
      .get('/auth/verify-email', { params: { token, email } })
      .then(() => {
        setState('ok');
        setMessage('Your email address is confirmed.');
      })
      .catch((err) => {
        setState('bad');
        setMessage(
          err.response?.data?.message ||
            'We could not verify that link. It may have expired or already been used.'
        );
      });
  }, [params]);

  if (state === 'working') {
    return (
      <AuthLayout title="Verifying" subtitle="One moment.">
        <div className="auth-centered">
          <div className="spinner" style={{ margin: '10px auto 18px' }} />
          <p className="muted">Checking your link...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={state === 'ok' ? "You're verified" : 'Link not valid'}>
      <div className="auth-centered">
        <div className={`auth-result-icon ${state === 'ok' ? 'ok' : 'bad'}`} aria-hidden="true">
          {state === 'ok' ? '✓' : '!'}
        </div>
        <p className="muted" style={{ lineHeight: 1.65 }}>
          {message}
        </p>

        {state === 'ok' && (
          <div className="alert alert-info" style={{ textAlign: 'left', marginTop: 18 }}>
            Next, our team connects your account to your shop and emails you an access code. Enter
            it once after signing in.
          </div>
        )}

        <Link to="/login" className="btn btn-primary btn-wide" style={{ marginTop: 10 }}>
          {state === 'ok' ? 'Sign in' : 'Back to sign in'}
        </Link>
      </div>
    </AuthLayout>
  );
};

/* ------------------------------------------------------------- forgot */
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the reset link.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your email">
        <div className="auth-centered">
          <div className="auth-result-icon ok" aria-hidden="true">
            ✓
          </div>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            If an account exists for <strong>{email}</strong>, a reset link is on its way. It
            expires in 30 minutes.
          </p>
          <Link to="/login" className="btn btn-ghost btn-wide" style={{ marginTop: 16 }}>
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We will email you a link to set a new one."
      footer={
        <>
          Remembered it? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="fp-email">Email</label>
          <input
            id="fp-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary btn-wide" type="submit" disabled={busy}>
          {busy ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
};

/* -------------------------------------------------------------- reset */
export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const token = params.get('token');
  const email = params.get('email');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (pw !== confirm) return setError('The two passwords do not match.');
    if (pw.length < 6) return setError('Use at least 6 characters.');

    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, email, newPassword: pw });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset your password.');
    } finally {
      setBusy(false);
    }
  };

  if (!token || !email) {
    return (
      <AuthLayout title="Link not valid">
        <div className="auth-centered">
          <div className="auth-result-icon bad" aria-hidden="true">
            !
          </div>
          <p className="muted">Open the reset link from your email directly.</p>
          <Link to="/forgot-password" className="btn btn-primary btn-wide" style={{ marginTop: 16 }}>
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle={`For ${email}`}>
      <form onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="np">New password</label>
          <input
            id="np"
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="np2">Confirm</label>
          <input
            id="np2"
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat it"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary btn-wide" type="submit" disabled={busy}>
          {busy ? 'Saving...' : 'Save new password'}
        </button>
      </form>
    </AuthLayout>
  );
};
