'use client';

import React from 'react';

/**
 * Clean StatusBadge component with subtle micro-dot indicator and crisp typography.
 */
export function StatusBadge({ status, type = 'order' }) {
  if (type === 'payment') {
    const isPaid = status === 'Paid';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-xs font-bold bg-white ${
          isPaid ? 'text-emerald-700' : 'text-rose-700'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 ${isPaid ? 'bg-emerald-600' : 'bg-rose-500'}`}
        />
        {status}
      </span>
    );
  }

  // Kitchen Order Status (Pending, Preparing, Ready, Completed)
  // Clean white theme, no borders, simple indicator dot
  const config = {
    Pending: {
      text: 'text-amber-800',
      dot: 'bg-amber-500'
    },
    Preparing: {
      text: 'text-sky-800',
      dot: 'bg-sky-500'
    },
    Ready: {
      text: 'text-purple-800',
      dot: 'bg-purple-500'
    },
    Completed: {
      text: 'text-emerald-800',
      dot: 'bg-emerald-600'
    }
  };

  const style = config[status] || {
    text: 'text-stone-700',
    dot: 'bg-stone-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-xs font-bold bg-white ${style.text}`}
    >
      <span className={`inline-flex h-1.5 w-1.5 ${style.dot}`} />
      {status}
    </span>
  );
}

export default StatusBadge;
