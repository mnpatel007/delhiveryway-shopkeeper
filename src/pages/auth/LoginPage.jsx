import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import AuthLayout, { AuthLink } from './AuthLayout';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/auth/login', form);
      const token = res.data?.token || res.data?.data?.token;
      const user = res.data?.data?.user || res.data?.user;

      if (!token || !user) throw new Error('Unexpected response from the server.');

      if (user.role !== 'vendor') {
        setError('That account is not a partner account. Use the customer app to sign in.');
        return;
      }

      login(token, user);
      // Where they land is decided by the route guard: the claim screen if
      // they have no shop yet, the dashboard if they do.
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not sign you in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your shop."
      footer={
        <>
          New partner? <AuthLink to="/signup">Create an account</AuthLink>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}

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
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            value={form.password}
            onChange={set('password')}
            required
          />
          <button
            type="button"
            className="auth-link"
            style={{ background: 'none', border: 0, padding: 0, marginTop: 8, cursor: 'pointer' }}
            onClick={() => setShowPw((v) => !v)}
          >
            {showPw ? 'Hide password' : 'Show password'}
          </button>
        </div>

        <button className="btn btn-primary btn-wide" type="submit" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <AuthLink to="/forgot-password">Forgotten your password?</AuthLink>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
