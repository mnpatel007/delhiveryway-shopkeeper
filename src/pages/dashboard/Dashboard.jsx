import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Profile to check consent
        const profileRes = await api.get('/shop-owner/profile');
        const { shop } = profileRes.data.data;

        if (!shop) {
          setError('No shop associated with your account. Please contact support.');
          setLoading(false);
          return;
        }

        if (!shop.consent?.hasAgreed) {
          navigate('/consent');
          return;
        }

        // 2. Fetch Monthly Stats
        const statsRes = await api.get('/shop-owner/monthly-stats');
        setStats(statsRes.data.data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading)
    return (
      <Layout>
        <div className="flex justify-center p-20">
          <div className="spinner"></div>
        </div>
      </Layout>
    );

  return (
    <Layout>
      {error ? (
        <div className="card bg-red-50 text-red-600 border-red-200">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* Performance Stats Area */}
          <section>
            <h2 className="text-xl font-bold mb-6 text-gray-800">
              Performance Last Month{' '}
              <span className="text-primary-600 font-medium">({stats?.month})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card stat-card hover:translate-y-[-4px] transition-all duration-300">
                <div className="stat-value">{stats?.totalOrders || 0}</div>
                <div className="stat-label">Delivered Orders</div>
              </div>
              <div className="card stat-card hover:translate-y-[-4px] transition-all duration-300">
                <div className="stat-value text-gray-800">
                  ₹{(stats?.grossSales || 0).toLocaleString()}
                </div>
                <div className="stat-label">Gross Sales</div>
              </div>
              <div className="card stat-card hover:translate-y-[-4px] transition-all duration-300">
                <div className="stat-value text-red-500">
                  -₹{(stats?.commissionDeducted || 0).toLocaleString()}
                </div>
                <div className="stat-label">Commission Deducted</div>
              </div>
              <div className="card stat-card premium-gradient-card shadow-lg hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
                <div className="stat-value">₹{(stats?.payableAmount || 0).toLocaleString()}</div>
                <div className="stat-label text-primary-100">Net Earnings</div>
                <div className="text-xs text-white font-medium mt-2 bg-white/20 inline-block px-2 py-1 rounded-md">
                  Amount in your bank
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-7">
              <div className="card h-full">
                <h3 className="text-lg font-bold mb-6 text-gray-800">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => navigate('/settings/timing')} className="quick-action-btn">
                    <span className="quick-action-icon">🕒</span>
                    <span>Update Timings</span>
                  </button>
                  <button
                    onClick={() => navigate('/settings/commission')}
                    className="quick-action-btn"
                  >
                    <span className="quick-action-icon">💰</span>
                    <span>Commission Settings</span>
                  </button>
                  <button onClick={() => navigate('/sales-report')} className="quick-action-btn">
                    <span className="quick-action-icon">📊</span>
                    <span>View Sales Report</span>
                  </button>
                  <button
                    onClick={() => window.alert('Coming Soon: Order History')}
                    className="quick-action-btn bg-gray-50 border-gray-100 opacity-80 hover:opacity-100"
                  >
                    <span className="quick-action-icon grayscale opacity-60">📜</span>
                    <span>Order History (Soon)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Platform Updates */}
            <div className="lg:col-span-5">
              <div className="card h-full bg-primary-50 border-primary-100">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-bold text-primary-900">Platform Updates</h3>
                  <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                    NEW
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="glass p-4 rounded-xl border border-white/50 transition-all hover:bg-white/60">
                    <p className="font-bold text-primary-800 text-sm mb-1">
                      Real-time Order Tracking
                    </p>
                    <p className="text-sm text-primary-700">
                      Customers can now see your preparation status in real-time. Keep statuses
                      updated to improve customer satisfaction.
                    </p>
                  </div>

                  <div className="glass p-4 rounded-xl border border-white/50 transition-all hover:bg-white/60">
                    <p className="font-bold text-primary-800 text-sm mb-1">Weekend Incentives</p>
                    <p className="text-sm text-primary-700">
                      Check out the new weekend incentive program in your commission settings to
                      maximize your earnings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
