import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

const CommissionSettings = () => {
  const [commission, setCommission] = useState({
    commissionType: 'percentage',
    commissionValue: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const response = await api.get('/shop-owner/commission');
        setCommission(response.data.data.commission);
      } catch {
        console.error('Failed to fetch commission');
      } finally {
        setLoading(false);
      }
    };
    fetchCommission();
  }, []);

  const handleSave = async () => {
    setError('');
    setMessage('');

    // Validation
    const val = Number(commission.commissionValue);
    if (isNaN(val) || val < 0) {
      return setError('Commission value cannot be negative');
    }
    if (commission.commissionType === 'percentage' && val > 100) {
      return setError('Percentage commission cannot exceed 100%');
    }

    setSaving(true);
    try {
      await api.put('/shop-owner/commission', commission);
      setMessage('Commission updated successfully! ✅');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update commission');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Layout>
        <div className="spinner"></div>
      </Layout>
    );

  return (
    <Layout>
      <div className="max-w-2xl">
        <div className="card mb-8">
          <div className="mb-8">
            <h3 className="font-bold text-xl mb-2">Platform Commission</h3>
            <p className="text-gray-500 text-sm">
              Set the commission you contribute to the platform for each order.
            </p>
          </div>

          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Commission Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setCommission({ ...commission, commissionType: 'percentage' })}
                  className={`btn ${commission.commissionType === 'percentage' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setCommission({ ...commission, commissionType: 'fixed' })}
                  className={`btn ${commission.commissionType === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Fixed Amount (₹)
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {commission.commissionType === 'percentage'
                  ? 'Percentage Value'
                  : 'Fixed Amount per Order'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="form-input pl-10"
                  value={commission.commissionValue}
                  onChange={(e) =>
                    setCommission({ ...commission, commissionValue: e.target.value })
                  }
                  min="0"
                  max={commission.commissionType === 'percentage' ? '100' : undefined}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  {commission.commissionType === 'percentage' ? '%' : '₹'}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700">
                <span className="font-bold">Info:</span> Your current plan allows for a minimum of{' '}
                {commission.commissionType === 'percentage' ? '5%' : '₹20'} contribution. Higher
                contributions can improve your shop's visibility in search results.
              </p>
            </div>
          </div>
        </div>

        {error && <div className="mb-4 text-red-600 font-bold text-sm">{error}</div>}
        {message && <div className="mb-4 text-green-600 font-bold text-sm">{message}</div>}

        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? 'Updating...' : 'Update Commission Settings'}
        </button>
      </div>
    </Layout>
  );
};

export default CommissionSettings;
