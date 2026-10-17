'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    restaurantName: 'Foodly Kitchen',
    taxRate: 5,
    currency: '₹',
    staffDiscountLimit: 15
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await api.get('/settings');
        if (res.data) {
          setFormData({
            restaurantName: res.data.restaurantName || 'Foodly Kitchen',
            taxRate: res.data.taxRate ?? 5,
            currency: res.data.currency || '₹',
            staffDiscountLimit: res.data.staffDiscountLimit ?? 15
          });
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.put('/settings', {
        restaurantName: formData.restaurantName.trim(),
        taxRate: Number(formData.taxRate),
        currency: formData.currency.trim(),
        staffDiscountLimit: Number(formData.staffDiscountLimit)
      });
      setFormData({
        restaurantName: res.data.restaurantName,
        taxRate: res.data.taxRate,
        currency: res.data.currency,
        staffDiscountLimit: res.data.staffDiscountLimit
      });
      setSuccessMsg('Settings updated.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="max-w-xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Restaurant Settings
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure billing defaults, GST tax rate, and staff discount limits.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-white text-rose-800 rounded-[3px] text-xs border border-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-600">[!]</span>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="font-bold ml-2 cursor-pointer">
              &times;
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-white text-emerald-800 rounded-[3px] text-xs border border-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-600">&check;</span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="font-bold ml-2 cursor-pointer">
              &times;
            </button>
          </div>
        )}

        <div className="bg-white rounded-[3px] border border-stone-200 p-6">
          {loading ? (
            <div className="py-10 text-center text-stone-400 text-xs">
              Loading settings...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  Restaurant Legal / Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                  placeholder="Foodly Kitchen"
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs text-stone-900 focus:outline-none focus:border-stone-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1.5">
                    Tax Rate / GST (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    placeholder="5"
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs tabular-nums text-stone-900 focus:outline-none focus:border-stone-400 font-bold"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">Default restaurant GST in India is 5%</p>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1.5">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="₹"
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs text-stone-900 focus:outline-none focus:border-stone-400 font-bold"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">Displays across all tickets & invoices</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1.5">
                  Max Staff Discount Limit (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  required
                  value={formData.staffDiscountLimit}
                  onChange={(e) => setFormData({ ...formData, staffDiscountLimit: e.target.value })}
                  placeholder="15"
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs tabular-nums text-stone-900 focus:outline-none focus:border-stone-400 font-bold"
                />
                <p className="text-[11px] text-stone-400 mt-1">Maximum % discount non-admin staff can apply</p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white text-xs font-bold rounded-[3px] border border-[#B8421E] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
