import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useVendor } from '../../context/VendorContext';
import { money } from '../../utils/format';
import './dashboard.css';

const PERIODS = [
  { key: 'this-month', label: 'This month' },
  { key: 'last-month', label: 'Last month' },
  { key: 'last-30', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
];

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const Dashboard = () => {
  const { status } = useVendor();
  const [period, setPeriod] = useState('this-month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shop-owner/monthly-stats', { params: { period: p } });
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your figures.');
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

  const peak = Math.max(1, ...(data?.dailyBreakdown || []).map((d) => d.revenue));

  return (
    <div className="page">
      <div className="spread" style={{ marginBottom: 22 }}>
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="display" style={{ fontSize: 'clamp(26px,4vw,38px)' }}>
            {status?.shop?.name || 'Your shop'}
          </h1>
        </div>

        <div className="period-switch">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={period === p.key ? 'active' : ''}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="center-screen" style={{ minHeight: '40vh' }}>
          <div className="spinner" />
          <p>Adding it up...</p>
        </div>
      ) : (
        data && (
          <>
            <motion.div
              className="glass earn-hero skew-edge"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <p className="eyebrow">Your earnings &middot; {data.label}</p>
                <div className="earn-figure numeral">{money(data.revenue)}</div>
                <p className="muted earn-note">
                  From {data.delivered} delivered order{data.delivered === 1 ? '' : 's'}

                </p>
              </div>
              <div className="earn-split">
                {data.taxes > 0 && (
                  <div>
                    <span className="eyebrow">Tax</span>
                    <strong className="numeral">{money(data.taxes)}</strong>
                  </div>
                )}
                {data.packagingCharges > 0 && (
                  <div>
                    <span className="eyebrow">Packaging</span>
                    <strong className="numeral">{money(data.packagingCharges)}</strong>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="grid-auto" style={{ marginTop: 16 }}>
              {[
                ['Orders received', data.ordersPlaced, null],
                ['Delivered', data.delivered, 'ok'],
                ['Cancelled', data.cancelled, data.cancelled > 0 ? 'bad' : null],
                [
                  'Average order',
                  money(data.averageOrderValue),
                  null,
                  data.delivered ? 'across delivered orders' : null,
                ],
              ].map(([label, value, tone, sub], i) => (
                <motion.div
                  key={label}
                  className="glass glass-hover stat-card"
                  variants={rise}
                  initial="hidden"
                  animate="show"
                  custom={i}
                >
                  <span className="eyebrow">{label}</span>
                  <strong className={`stat-value numeral ${tone || ''}`}>{value}</strong>
                  {sub && <span className="stat-sub">{sub}</span>}
                </motion.div>
              ))}
            </div>

            {data.dailyBreakdown?.length > 0 && (
              <motion.div
                className="glass chart"
                variants={rise}
                initial="hidden"
                animate="show"
                custom={5}
              >
                <div className="spread" style={{ marginBottom: 18 }}>
                  <h3>Day by day</h3>
                  <Link to="/orders" className="chart-link">
                    See all orders &rarr;
                  </Link>
                </div>
                <div className="bars">
                  {data.dailyBreakdown
                    .slice(0, 14)
                    .reverse()
                    .map((d) => (
                      <div className="bar-col" key={d.date} title={`${d.date}: ${money(d.revenue)}`}>
                        <div className="bar-track">
                          <motion.div
                            className="bar-fill"
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(4, (d.revenue / peak) * 100)}%` }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                        <span className="bar-label">
                          {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default Dashboard;
