import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ConsentPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAgree = async () => {
    setLoading(true);
    setError('');
    try {
      await api.put('/shop-owner/consent');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4">
      <div className="card w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Partnership Agreement</h1>
          <p className="text-gray-600 mt-2">Please review and accept our terms to access your dashboard</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8 max-h-96 overflow-y-auto border border-gray-200">
          <div className="space-y-6 text-gray-700">
            <section>
              <h3 className="font-bold text-gray-900 mb-2">1. Shop Management</h3>
              <p>You agree to list and manage your shop on our platform. You are responsible for maintaining the accuracy of your shop's information, including name, description, and contact details.</p>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-2">2. Commission and Payments</h3>
              <p>You agree that a commission will be deducted from each order placed through the platform. The commission rate is as agreed upon in your settings. Net payments will be settled according to the platform's payment cycle.</p>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-2">3. Accuracy of Information</h3>
              <p>You agree that shop timing, business information, and product availability must be kept accurate at all times. Frequent inaccuracies may lead to temporary suspension of your shop on the platform.</p>
            </section>

            <section>
              <h3 className="font-bold text-gray-900 mb-2">4. Data and Analytics</h3>
              <p>You understand that all sales and order data shown in this portal is based on platform records. While we strive for 100% accuracy, these records serve as the primary source for settlement and performance tracking.</p>
            </section>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/login')}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleAgree}
            className="btn btn-primary flex-1"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'I Agree and Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentPage;
