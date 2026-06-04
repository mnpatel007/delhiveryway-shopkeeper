import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shopId: '',
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
      } catch {
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
        role: 'vendor',
      });
      navigate('/login', { state: { message: 'Signup successful! Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
        style={{ animationDelay: '2s' }}
      ></div>

      <div className="card w-full max-w-xl relative z-10 shadow-2xl border-t-4 border-t-primary-600">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-100 shadow-sm">
            <span className="text-3xl text-primary-600">🚀</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Partner with Us</h1>
          <p className="text-gray-500 font-medium text-sm">
            Register as a shop owner to grow your business
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="form-label text-sm">Full Name</label>
            <input
              type="text"
              className="form-input bg-gray-50 focus:bg-white transition-colors"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="form-label text-sm">Email Address</label>
              <input
                type="email"
                className="form-input bg-gray-50 focus:bg-white transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="owner@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="form-label text-sm">Phone Number</label>
              <input
                type="tel"
                className="form-input bg-gray-50 focus:bg-white transition-colors"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="1234567890"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="form-label text-sm">
              Select Your Shop{' '}
              <span className="text-gray-400 font-normal">(if already listed)</span>
            </label>
            <select
              className="form-input bg-gray-50 focus:bg-white transition-colors cursor-pointer"
              value={formData.shopId}
              onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
            >
              <option value="">-- Select an available shop --</option>
              {availableShops.map((shop) => (
                <option key={shop._id} value={shop._id}>
                  {shop.name} ({shop.address.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="form-label text-sm">Password</label>
              <input
                type="password"
                className="form-input bg-gray-50 focus:bg-white transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="form-label text-sm">Confirm Password</label>
              <input
                type="password"
                className="form-input bg-gray-50 focus:bg-white transition-colors"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 text-lg mt-4 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm font-medium text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-800 transition-colors">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
