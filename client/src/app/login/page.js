'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[78vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Foodly Kitchen
          </h1>
          <p className="text-xs text-stone-500 mt-1">Restaurant POS & Kitchen Terminal</p>
        </div>

        <div className="bg-white rounded-[3px] border border-stone-200 p-6">
          <h2 className="text-sm font-bold text-stone-900 mb-4">
            Sign in to Terminal
          </h2>

          {error && (
            <div className="mb-4 p-2.5 bg-white text-rose-800 rounded-[3px] text-xs border border-rose-300 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@pos.com"
                className="w-full px-3 py-1.5 rounded-[3px] border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-stone-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 rounded-[3px] border border-stone-200 text-stone-900 text-xs focus:outline-none focus:border-stone-400 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#B8421E] hover:bg-[#9E3515] text-white font-bold rounded-[3px] border border-[#B8421E] text-xs transition-colors disabled:opacity-50 mt-1 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-5 pt-4 border-t border-stone-100">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin@pos.com', 'Admin@123')}
                className="p-2 border border-stone-200 rounded-[3px] text-left hover:border-stone-400 bg-white cursor-pointer"
              >
                <div className="font-bold text-stone-900">Admin</div>
                <div className="text-stone-500 text-[11px]">admin@pos.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('staff@pos.com', 'Staff@123')}
                className="p-2 border border-stone-200 rounded-[3px] text-left hover:border-stone-400 bg-white cursor-pointer"
              >
                <div className="font-bold text-stone-900">Staff</div>
                <div className="text-stone-500 text-[11px]">staff@pos.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
