import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AuthLayout, { AuthLink } from './AuthLayout';

const SignupPage = () => {
  const [form, setForm] = useState({
    name: '',
    shopName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      setError('Enter a 10-digit phone number.');
      return;
    }

    setBusy(true);
    try {
      await api.post('/auth/signup', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        shopName: form.shopName.trim(),
        role: 'vendor',
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step before you can sign in.">
        <div className="auth-centered">
          <div className="auth-result-icon ok" aria-hidden="true">
            ✓
          </div>
          <p className="muted" style={{ lineHeight: 1.65 }}>
            We have sent a verification link to <strong>{form.email}</strong>. Open it to confirm
            your address.
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left', marginTop: 18 }}>
            After verifying, our team will connect your account to{' '}
            <strong>{form.shopName || 'your shop'}</strong> and send you an access code. You will
            enter it once when you first sign in.
          </div>
          <Link to="/login" className="btn btn-primary btn-wide" style={{ marginTop: 6 }}>
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Become a partner"
      subtitle="Tell us about you and your shop."
      footer={
        <>
          Already registered? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field">
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            className="input"
            placeholder="Full name"
            value={form.name}
            onChange={set('name')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="shopName">Shop name</label>
          <input
            id="shopName"
            className="input"
            placeholder="The name customers see"
            value={form.shopName}
            onChange={set('shopName')}
            required
          />
          <p className="auth-aside-note" style={{ marginTop: 8 }}>
            We use this to match you to the right shop before granting access.
          </p>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            className="input"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit number"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
            required
          />
        </div>

        <div className="auth-row">
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm</label>
            <input
              id="confirm"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat it"
              value={form.confirm}
              onChange={set('confirm')}
              required
            />
          </div>
        </div>

        <button className="btn btn-primary btn-wide" type="submit" disabled={busy}>
          {busy ? 'Creating your account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default SignupPage;
