import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import './timings.css';

const DAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

const blank = () =>
  DAYS.reduce((acc, [k]) => {
    acc[k] = { open: '09:00', close: '21:00', closed: false };
    return acc;
  }, {});

const TimingsPage = () => {
  const [hours, setHours] = useState(blank);
  const [tempClosed, setTempClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null); // { kind, text }
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/shop-owner/profile');
      const shop = res.data?.data?.shop;
      if (shop?.operatingHours) {
        const next = blank();
        for (const [k] of DAYS) {
          const d = shop.operatingHours[k];
          if (d) next[k] = { open: d.open || '09:00', close: d.close || '21:00', closed: !!d.closed };
        }
        setHours(next);
      }
      setTempClosed(Boolean(shop?.isTemporarilyClosed));
    } catch {
      setNote({ kind: 'error', text: 'Could not load your opening hours.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount: state lands after the request settles, which the
    // set-state-in-effect rule cannot tell apart from a sync cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const edit = (day, patch) => {
    setHours((h) => ({ ...h, [day]: { ...h[day], ...patch } }));
    setDirty(true);
  };

  const copyMondayToAll = () => {
    const m = hours.monday;
    setHours((h) => {
      const next = { ...h };
      for (const [k] of DAYS) next[k] = { ...m };
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setNote(null);
    try {
      await api.put('/shop-owner/timings', { operatingHours: hours, isTemporarilyClosed: tempClosed });
      setNote({ kind: 'ok', text: 'Saved. Your shop now follows these hours.' });
      setDirty(false);
    } catch (err) {
      setNote({ kind: 'error', text: err.response?.data?.message || 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>Loading your hours...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">Settings</p>
        <h1 className="display" style={{ fontSize: 'clamp(26px,4vw,38px)' }}>
          Opening hours
        </h1>
        <p className="muted" style={{ marginTop: 8, maxWidth: 560, lineHeight: 1.6 }}>
          Customers can only order while you are open. Changes take effect straight away.
        </p>
      </div>

      {note && <div className={`alert alert-${note.kind === 'ok' ? 'ok' : 'error'}`}>{note.text}</div>}

      <motion.div
        className={`glass temp-closed ${tempClosed ? 'on' : ''}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div>
          <strong>Temporarily closed</strong>
          <p className="muted">
            Turn this on to stop taking orders right now, without changing your usual hours.
          </p>
        </div>
        <button
          className={`toggle ${tempClosed ? 'on' : ''}`}
          onClick={() => {
            setTempClosed((v) => !v);
            setDirty(true);
          }}
          aria-pressed={tempClosed}
          aria-label="Temporarily closed"
        >
          <span />
        </button>
      </motion.div>

      <div className="spread" style={{ margin: '22px 0 12px' }}>
        <h3 style={{ fontSize: 16 }}>Weekly schedule</h3>
        <button className="btn btn-ghost" onClick={copyMondayToAll}>
          Copy Monday to every day
        </button>
      </div>

      <div className="day-list">
        {DAYS.map(([key, label], i) => (
          <motion.div
            key={key}
            className={`glass day-row ${hours[key].closed ? 'closed' : ''}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
          >
            <span className="day-name">{label}</span>

            <div className="day-times">
              <input
                className="input time"
                type="time"
                value={hours[key].open}
                disabled={hours[key].closed}
                onChange={(e) => edit(key, { open: e.target.value })}
              />
              <span className="day-dash" aria-hidden="true">
                &ndash;
              </span>
              <input
                className="input time"
                type="time"
                value={hours[key].close}
                disabled={hours[key].closed}
                onChange={(e) => edit(key, { close: e.target.value })}
              />
            </div>

            <button
              className={`toggle small ${hours[key].closed ? '' : 'on'}`}
              onClick={() => edit(key, { closed: !hours[key].closed })}
              aria-pressed={!hours[key].closed}
              aria-label={`${label} open`}
            >
              <span />
            </button>
            <span className={`day-state ${hours[key].closed ? 'off' : ''}`}>
              {hours[key].closed ? 'Closed' : 'Open'}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="save-bar">
        <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving...' : dirty ? 'Save changes' : 'Saved'}
        </button>
      </div>
    </div>
  );
};

export default TimingsPage;
