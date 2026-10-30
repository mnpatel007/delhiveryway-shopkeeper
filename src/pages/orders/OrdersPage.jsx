import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { money } from '../../utils/format';
import './orders.css';

// Same windows as the overview, so the two screens always agree.
const PERIODS = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'last-30', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'pending_shopper', label: 'Waiting' },
];

const TONE = {
  delivered: 'ok',
  cancelled: 'bad',
};

const prettyStatus = (s) =>
  String(s || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, truncated: false, label: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('this-month');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);

  const load = useCallback(async (p) => {
    setError('');
    try {
      const res = await api.get('/shop-owner/orders', { params: { period: p } });
      const d = res.data?.data || {};
      setOrders(d.orders || []);
      setMeta({
        total: d.total ?? (d.orders || []).length,
        truncated: Boolean(d.truncated),
        label: d.label || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching on mount: state lands after the request settles, which the
    // set-state-in-effect rule cannot tell apart from a sync cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(period);
  }, [load, period]);

  const changePeriod = (key) => {
    setLoading(true);
    setOpen(null);
    setPeriod(key);
  };

  const visible = orders.filter((o) => filter === 'all' || o.status === filter);

  const totals = visible.reduce(
    (acc, o) => {
      if (o.status === 'delivered') {
        acc.revenue += o.value.shopTotal;
        acc.delivered += 1;
      }
      return acc;
    },
    { revenue: 0, delivered: 0 }
  );

  return (
    <div className="page">
      <div className="spread" style={{ marginBottom: 20 }}>
        <div>
          <p className="eyebrow">History</p>
          <h1 className="display" style={{ fontSize: 'clamp(26px,4vw,38px)' }}>
            Your orders
          </h1>
        </div>

        <div className="period-switch">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={period === p.key ? 'active' : ''}
              onClick={() => changePeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="order-filters">
        {FILTERS.map((f) => {
          const n = f.key === 'all' ? orders.length : orders.filter((o) => o.status === f.key).length;
          return (
            <button
              key={f.key}
              className={filter === f.key ? 'active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="chip">{n}</span>
            </button>
          );
        })}
        <button className="btn btn-ghost order-refresh" onClick={() => changePeriod(period)}>
          Refresh
        </button>
      </div>

      {meta.truncated && (
        <div className="alert alert-info">
          Showing the most recent {orders.length} of {meta.total} orders for this period. Narrow the
          period to see the rest.
        </div>
      )}

      {totals.delivered > 0 && (
        <div className="glass order-total">
          <span className="eyebrow">
            {meta.label} &middot; {totals.delivered} delivered
          </span>
          <strong className="numeral">{money(totals.revenue)}</strong>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="center-screen" style={{ minHeight: '36vh' }}>
          <div className="spinner" />
          <p>Fetching orders...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass order-empty">
          <h3>Nothing to show</h3>
          <p className="muted">
            {orders.length === 0
              ? `No orders in ${(meta.label || 'this period').toLowerCase()}. Try a wider period.`
              : 'No orders match this filter.'}
          </p>
        </div>
      ) : (
        <div className="order-list">
          {visible.map((o, i) => {
            const isOpen = open === o._id;
            return (
              <motion.div
                key={o._id}
                className={`glass glass-hover order-card ${o.status}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.4 }}
              >
                <button
                  className="order-head"
                  onClick={() => setOpen(isOpen ? null : o._id)}
                  aria-expanded={isOpen}
                >
                  <div className="order-id">
                    <strong>#{o.orderNumber || o._id.slice(-6)}</strong>
                    <span className="muted">
                      {new Date(o.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="order-mid">
                    <span className={`badge badge-${TONE[o.status] || ''}`}>
                      {prettyStatus(o.status)}
                    </span>
                    {o.value.wasRevised && <span className="badge">Revised</span>}
                    <span className="muted order-items-count">
                      {o.items.length} item{o.items.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="order-amount numeral">{money(o.value.shopTotal)}</div>
                  <span className={`order-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true">
                    ⌄
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="order-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="order-body-inner">
                        <div className="order-customer">
                          For <strong>{o.customerName}</strong>
                        </div>

                        <ul className="order-items">
                          {o.items.map((it, k) => (
                            <li key={k} className={it.unavailable ? 'gone' : ''}>
                              <span className="oi-name">
                                {it.name}
                                {it.unavailable && <em> — unavailable</em>}
                              </span>
                              <span className="oi-qty numeral">
                                {it.quantity} &times; {money(it.price)}
                              </span>
                              <span className="oi-total numeral">{money(it.lineTotal)}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="order-money">
                          <div className="om-row">
                            <span>Items subtotal</span>
                            <span className="numeral">{money(o.value.subtotal)}</span>
                          </div>
                          {o.value.taxes > 0 && (
                            <div className="om-row">
                              <span>Tax</span>
                              <span className="numeral">{money(o.value.taxes)}</span>
                            </div>
                          )}
                          {o.value.packagingCharges > 0 && (
                            <div className="om-row">
                              <span>Packaging charges</span>
                              <span className="numeral">{money(o.value.packagingCharges)}</span>
                            </div>
                          )}
                          <div className="om-row total">
                            <span>Your total</span>
                            <span className="numeral">{money(o.value.shopTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
