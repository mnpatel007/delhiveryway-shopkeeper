import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

const SalesReport = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/shop-owner/monthly-stats'),
          api.get('/shop-owner/orders')
        ]);
        setStats(statsRes.data.data);
        setOrders(ordersRes.data.data.orders || []);
      } catch (err) {
        console.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Layout><div className="spinner"></div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Monthly Sales Report - {stats?.month}</h2>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
            🖨️ Print Report
          </button>
        </div>

        <div className="stats-grid">
          <div className="card stat-card bg-white">
            <div className="stat-label">Gross Revenue</div>
            <div className="stat-value">₹{stats?.grossSales?.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-2">Total item sales before deductions</div>
          </div>
          <div className="card stat-card bg-white">
            <div className="stat-label">Platform Fees</div>
            <div className="stat-value text-red-500">₹{stats?.commissionDeducted?.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-2">Commission & platform service charges</div>
          </div>
          <div className="card stat-card bg-white">
            <div className="stat-label">Net Payable</div>
            <div className="stat-value text-green-600">₹{stats?.payableAmount?.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-2">Amount to be settled to your bank</div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold mb-6">Recent Orders Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                  <th className="pb-4 font-semibold">Order ID</th>
                  <th className="pb-4 font-semibold">Date</th>
                  <th className="pb-4 font-semibold">Customer</th>
                  <th className="pb-4 font-semibold">Status</th>
                  <th className="pb-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order._id} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 font-mono text-xs">{order.orderNumber}</td>
                    <td className="py-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 text-gray-900 font-medium">{order.customerId?.name || 'Guest'}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right font-bold text-gray-900">₹{order.orderValue?.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div className="text-center py-10 text-gray-400">No orders found for this period.</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SalesReport;
