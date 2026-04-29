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

  if (loading) return <Layout><div className="flex justify-center p-20"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Sales Report</h2>
            <p className="text-gray-500 font-medium text-sm mt-1">{stats?.month || 'Current Month'}</p>
          </div>
          <button onClick={() => window.print()} className="btn btn-secondary shadow-sm hover:shadow-md transition-all">
            <span className="mr-2">🖨️</span> Print Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card stat-card hover:translate-y-[-4px] transition-all duration-300">
            <div className="stat-value text-gray-800">₹{(stats?.grossSales || 0).toLocaleString()}</div>
            <div className="stat-label">Gross Revenue</div>
            <div className="text-xs text-gray-500 font-medium mt-2">Total item sales before deductions</div>
          </div>
          <div className="card stat-card hover:translate-y-[-4px] transition-all duration-300">
            <div className="stat-value text-red-500">-₹{(stats?.commissionDeducted || 0).toLocaleString()}</div>
            <div className="stat-label">Platform Fees</div>
            <div className="text-xs text-gray-500 font-medium mt-2">Commission due to platform</div>
          </div>
          <div className="card stat-card premium-gradient-card shadow-lg hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
            <div className="stat-value">₹{(stats?.payableAmount || 0).toLocaleString()}</div>
            <div className="stat-label text-primary-100">Net Earnings</div>
            <div className="text-xs text-white font-medium mt-2 bg-white/20 inline-block px-2 py-1 rounded-md">Amount in your bank</div>
          </div>
        </div>

        <div className="card border-t-4 border-t-primary-500">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Orders Breakdown</h3>
            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full">{orders.length} Orders</span>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold rounded-tl-lg">Order ID</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Customer</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm bg-white divide-y divide-gray-100">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs text-gray-500">{order.orderNumber}</td>
                    <td className="p-4 text-gray-700 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-gray-900 font-semibold">{order.customerId?.name || 'Guest'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        order.status === 'delivered' ? 'bg-green-50 text-green-700 border border-green-200' : 
                        order.status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {order.status === 'delivered' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                        {order.status === 'cancelled' && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900 text-base">₹{order.orderValue?.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg mt-4 border border-dashed border-gray-200">
              <span className="text-4xl mb-3 block">📉</span>
              <p className="text-gray-500 font-medium">No orders found for this period.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SalesReport;
