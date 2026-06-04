import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

const TimingSettings = () => {
  const [operatingHours, setOperatingHours] = useState({});
  const [isTemporarilyClosed, setIsTemporarilyClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    const fetchTimings = async () => {
      try {
        const response = await api.get('/shop-owner/profile');
        const { shop } = response.data.data;
        setOperatingHours(shop.operatingHours || {});
        setIsTemporarilyClosed(shop.isTemporarilyClosed || false);
      } catch {
        console.error('Failed to fetch timings');
      } finally {
        setLoading(false);
      }
    };
    fetchTimings();
  }, []);

  const handleToggleDay = (day) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        closed: !operatingHours[day]?.closed,
      },
    });
  };

  const handleTimeChange = (day, field, value) => {
    setOperatingHours({
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/shop-owner/timings', {
        operatingHours,
        isTemporarilyClosed,
      });
      setMessage('Settings updated successfully! ✅');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to update settings. ❌');
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
      <div className="max-w-4xl">
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-xl">Operating Hours</h3>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <span className="text-sm font-bold text-gray-600">Temporarily Closed</span>
              <button
                onClick={() => setIsTemporarilyClosed(!isTemporarilyClosed)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isTemporarilyClosed ? 'bg-red-500' : 'bg-gray-300'}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isTemporarilyClosed ? 'translate-x-7' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {days.map((day) => (
              <div
                key={day}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4"
              >
                <div className="flex items-center gap-4 min-w-[150px]">
                  <input
                    type="checkbox"
                    checked={!operatingHours[day]?.closed}
                    onChange={() => handleToggleDay(day)}
                    className="w-5 h-5 accent-primary-600"
                  />
                  <span className="capitalize font-bold text-gray-700">{day}</span>
                </div>

                {!operatingHours[day]?.closed ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      className="form-input !py-1 !px-2 w-32"
                      value={operatingHours[day]?.open || '09:00'}
                      onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      className="form-input !py-1 !px-2 w-32"
                      value={operatingHours[day]?.close || '21:00'}
                      onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="text-red-500 font-bold uppercase text-xs tracking-widest bg-red-50 px-3 py-1 rounded">
                    Closed
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {message && <span className="font-bold">{message}</span>}
          </p>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default TimingSettings;
