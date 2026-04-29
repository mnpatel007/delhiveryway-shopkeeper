import React, { useState, useEffect } from 'react';
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

  if (loading) return <Layout><div className="flex justify-center p-20"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      {error ? (
        <div className="card bg-red-50 text-red-600 border-red-200">{error}</div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold">Performance Last Month ({stats?.month})</h2>
              <span className="text-[10px] text-gray-400 font-mono mb-1">SHOP ID: {stats?.shopId || 'Connecting...'}</span>
            </div>
            <div className="stats-grid">
              <div className="card stat-card">
                <div className="stat-value">{stats?.totalOrders}</div>
                <div className="stat-label">Delivered Orders</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">₹{stats?.grossSales?.toLocaleString()}</div>
                <div className="stat-label">Gross Sales</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value text-red-500">-₹{stats?.commissionDeducted?.toLocaleString()}</div>
                <div className="stat-label">Commission Deducted</div>
              </div>
              <div className="card stat-card bg-primary-600">
                <div className="stat-value text-white">₹{stats?.payableAmount?.toLocaleString()}</div>
                <div className="stat-label text-primary-100">Final Payable</div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => navigate('/settings/timing')} className="btn btn-secondary flex-col p-6 h-auto">
                  <span className="text-2xl mb-2">🕒</span>
                  Update Timings
                </button>
                <button onClick={() => navigate('/settings/commission')} className="btn btn-secondary flex-col p-6 h-auto">
                  <span className="text-2xl mb-2">💰</span>
                  Commission Settings
                </button>
                <button onClick={() => navigate('/sales-report')} className="btn btn-secondary flex-col p-6 h-auto">
                  <span className="text-2xl mb-2">📊</span>
                  View Sales Report
                </button>
                <button onClick={() => window.alert('Coming Soon: Order History')} className="btn btn-secondary flex-col p-6 h-auto">
                  <span className="text-2xl mb-2">📜</span>
                  Order History
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold mb-4">Platform Updates</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-bold text-sm">New Feature: Real-time Order Tracking</p>
                  <p className="text-xs text-gray-500 mt-1">Customers can now see your preparation status in real-time.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-bold text-sm">Policy Update: Weekend Commissions</p>
                  <p className="text-xs text-gray-500 mt-1">Check out the new weekend incentive program in your settings.</p>
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
