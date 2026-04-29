import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shopId: ''
  });
  const [availableShops, setAvailableShops] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await api.get('/shop-owner/available-shops');
        setAvailableShops(response.data.data.shops || []);
      } catch (err) {
        console.error('Failed to fetch available shops');
      }
    };
    fetchShops();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      await api.post('/auth/signup', {
        ...formData,
        role: 'vendor'
      });
      navigate('/login', { state: { message: 'Signup successful! Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Partner with Us</h1>
          <p className="text-gray-600">Register as a shop owner</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="owner@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="1234567890"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Your Shop (if already listed)</label>
            <select
              className="form-input"
              value={formData.shopId}
              onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
            >
              <option value="">-- Select Shop --</option>
              {availableShops.map(shop => (
                <option key={shop._id} value={shop._id}>{shop.name} ({shop.address.city})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm</label>
              <input
                type="password"
                className="form-input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-4"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-primary-600 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
