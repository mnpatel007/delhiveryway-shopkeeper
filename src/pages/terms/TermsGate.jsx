import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { Aurora } from '../../components/Shell';
import './terms.css';

/**
 * The partner agreement, standing in for the paper one.
 *
 * Nothing in the portal opens until the vendor has accepted the version that
 * is currently published. When an admin publishes a new version, that becomes
 * the live one and every partner is asked again on their next visit, which is
 * the point: a rule change reaches everyone without chasing signatures shop
 * by shop.
 *
 * Acceptance is recorded against the signed-in account with a timestamp,
 * so there is a record of who agreed to what and when.
 */
const TermsGate = ({ children }) => {
  const [terms, setTerms] = useState(null);
  const [checked, setChecked] = useState(false);
  const [ticked, setTicked] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/terms/current', { params: { audience: 'vendor' } });
      const current = res.data?.data?.terms || null;
      // Nothing published, or this account already agreed to it.
      setTerms(current && !current.hasAccepted ? current : null);
    } catch {
      // The agreement must never be the reason a partner cannot reach their
      // own orders, so a failed check lets them through.
      setTerms(null);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount: state lands after the request settles, which the
    // set-state-in-effect rule cannot tell apart from a sync cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await api.post('/terms/accept', { termsId: terms._id });
      setTerms(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record that. Please try again.');
      setAccepting(false);
    }
  };

  if (!checked) {
    return (
      <>
        <Aurora />
        <div className="center-screen">
          <div className="spinner" />
          <p>Checking your account...</p>
        </div>
      </>
    );
  }

  if (!terms) return children;

  return (
    <>
      <Aurora />
      <div className="terms-screen">
        <motion.div
          className="glass terms-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="terms-head">
            <p className="eyebrow">Partner agreement</p>
            <h1>{terms.title}</h1>
            <p className="muted terms-version">
              Version {terms.version}
              {terms.createdAt &&
                ` · published ${new Date(terms.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`}
            </p>
          </div>

          <div className="terms-body" tabIndex={0}>
            {terms.content.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <label className="terms-tick">
            <input
              type="checkbox"
              checked={ticked}
              onChange={(e) => setTicked(e.target.checked)}
            />
            <span>I have read the agreement above and I accept it on behalf of my shop.</span>
          </label>

          <button
            className="btn btn-primary btn-wide"
            onClick={accept}
            disabled={!ticked || accepting}
          >
            {accepting ? 'Saving...' : 'Accept and continue'}
          </button>

          <p className="muted terms-foot">
            We record the date and time you accept this, the same way a signed copy would be
            kept. If the agreement changes later you will be asked to read and accept the new
            version.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default TermsGate;
