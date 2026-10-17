'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace('/login');
    }
  }, [mounted, user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
        <p className="text-gray-500 text-xs">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border border-stone-200 rounded-[3px] text-center">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">
          Admin access required
        </h2>
        <p className="text-gray-600 mb-4 text-xs">
          Logged in as {user.name} ({user.role}). This section is restricted to administrators.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-3 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white font-medium rounded-[3px] border border-[#B8421E] text-xs transition-colors cursor-pointer"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  return children;
}
