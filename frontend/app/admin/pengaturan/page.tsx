'use client';

import { useState, useEffect } from 'react';

interface InstitutionSettings {
  name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  max_users: number;
  subscription_type: string;
}

export default function AdminPengaturanPage() {
  const [settings, setSettings] = useState<InstitutionSettings>({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    max_users: 100,
    subscription_type: 'basic',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institutions/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institutions/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSuccess('Settings updated successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings (Pengaturan)</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your institution settings and preferences
        </p>
      </div>

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4" role="alert">
          <p className="text-sm font-medium text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4" role="alert">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">Institution Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Basic information about your institution
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Institution Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  aria-label="Institution name"
                />
              </div>

              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700">
                  Contact Email *
                </label>
                <input
                  type="email"
                  id="contact_email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  aria-label="Contact email"
                />
              </div>

              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  id="contact_phone"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  aria-label="Contact phone"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  aria-label="Institution address"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your current subscription plan and limits
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="subscription_type" className="block text-sm font-medium text-gray-700">
                  Plan Type
                </label>
                <select
                  id="subscription_type"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={settings.subscription_type}
                  onChange={(e) => setSettings({ ...settings, subscription_type: e.target.value })}
                  disabled
                  aria-label="Subscription type"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Contact support to upgrade your plan</p>
              </div>

              <div>
                <label htmlFor="max_users" className="block text-sm font-medium text-gray-700">
                  Maximum Users
                </label>
                <input
                  type="number"
                  id="max_users"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={settings.max_users}
                  disabled
                  aria-label="Maximum users allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Based on your subscription plan</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure how you receive notifications
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="email_notifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    defaultChecked
                    aria-label="Email notifications"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="email_notifications" className="font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-gray-500">Receive email updates for important events</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="test_completion_alerts"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    defaultChecked
                    aria-label="Test completion alerts"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="test_completion_alerts" className="font-medium text-gray-700">
                    Test Completion Alerts
                  </label>
                  <p className="text-gray-500">Get notified when users complete tests</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="payment_notifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    defaultChecked
                    aria-label="Payment notifications"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="payment_notifications" className="font-medium text-gray-700">
                    Payment Notifications
                  </label>
                  <p className="text-gray-500">Receive alerts for payment transactions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save settings"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
