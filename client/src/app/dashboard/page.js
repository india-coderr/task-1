'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { formatCurrency, getTodayLocalDate } from '@/lib/formatters';

export default function DashboardPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchDailyReport = useCallback(async (date) => {
    setLoading(true);
    setError('');
    try {
      const target = date || getTodayLocalDate();
      const res = await api.get(`/reports/daily-sales?date=${target}`);
      setReport(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const today = getTodayLocalDate();
    setSelectedDate(today);
    fetchDailyReport(today);
  }, [fetchDailyReport]);

  const currency = report?.currency || '₹';
  const metrics = report?.metrics || {
    totalOrders: 0,
    completedOrders: 0,
    inProgressOrders: 0,
    totalSales: 0,
    paymentSplit: {
      cash: { total: 0, count: 0 },
      upi: { total: 0, count: 0 }
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4 bg-white">
        {/* Top Header - Thin Borders with 3px border-radius and off-white theme */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-stone-200 rounded-[3px]">
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Kitchen Operations & Daily Sales
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Live order progression, table service, and settled receipts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-[3px] px-2.5 py-1 border border-stone-200">
              <span className="text-[11px] font-bold text-stone-700">
                Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  fetchDailyReport(e.target.value);
                }}
                className="bg-transparent text-xs font-semibold text-stone-900 focus:outline-none cursor-pointer"
              />
            </div>

            <Link
              href="/orders/new"
              className="inline-flex items-center px-4 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white text-xs font-bold rounded-[3px] border border-[#B8421E] transition-colors"
            >
              + New Order
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-white border border-rose-300 text-rose-800 rounded-[3px] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-600">[!]</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchDailyReport(selectedDate)}
              className="font-bold underline text-xs ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Metric Cards - Thin borders with 3px radius, off-white color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Revenue */}
          <div className="bg-white p-4 border border-stone-200 rounded-[3px] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Gross Revenue
              </span>
              <div className="text-2xl font-bold text-stone-900 num-tabular tracking-tight mt-2">
                {formatCurrency(metrics.totalSales, currency)}
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-2">
              Settled through cash & UPI
            </p>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white p-4 border border-stone-200 rounded-[3px] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="text-2xl font-bold text-stone-900 num-tabular tracking-tight mt-2">
                {metrics.totalOrders}
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-2">
              Dine-in and takeaway orders
            </p>
          </div>

          {/* Card 3: In Progress */}
          <div className="bg-white p-4 border border-stone-200 rounded-[3px] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Active in Kitchen
              </span>
              <div className="text-2xl font-bold text-stone-900 num-tabular tracking-tight mt-2">
                {metrics.inProgressOrders}
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-2">
              {metrics.pendingOrders || 0} Pending &middot; {metrics.preparingOrders || 0} In Prep &middot; {metrics.readyOrders || 0} Ready
            </p>
          </div>

          {/* Card 4: Completed */}
          <div className="bg-white p-4 border border-stone-200 rounded-[3px] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Served & Completed
              </span>
              <div className="text-2xl font-bold text-stone-900 num-tabular tracking-tight mt-2">
                {metrics.completedOrders}
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-2">
              Fulfilled and closed orders
            </p>
          </div>
        </div>

        {/* Payment Channel Settlement Breakdown - Thin borders with 3px radius */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white p-4 border border-stone-200 rounded-[3px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-800 bg-white border border-stone-200 px-2 py-0.5 rounded-[3px]">
                CASH
              </span>
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Cash Register
                </span>
                <div className="text-base font-bold text-stone-900 num-tabular mt-0.5">
                  {formatCurrency(metrics.paymentSplit.cash.total, currency)}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-[3px] text-[11px] font-bold text-stone-700 num-tabular">
              {metrics.paymentSplit.cash.count} payments
            </span>
          </div>

          <div className="bg-white p-4 border border-stone-200 rounded-[3px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-800 bg-white border border-stone-200 px-2 py-0.5 rounded-[3px]">
                UPI
              </span>
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  UPI / Digital
                </span>
                <div className="text-base font-bold text-stone-900 num-tabular mt-0.5">
                  {formatCurrency(metrics.paymentSplit.upi.total, currency)}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white border border-stone-200 rounded-[3px] text-[11px] font-bold text-stone-700 num-tabular">
              {metrics.paymentSplit.upi.count} payments
            </span>
          </div>
        </div>

        {/* Recent Orders Table - Thin borders with 3px radius, off-white color */}
        <div className="bg-white border border-stone-200 rounded-[3px] overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                Recent Orders
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Orders created for selected date
              </p>
            </div>
            <Link
              href="/orders"
              className="text-xs font-bold text-[#B8421E] hover:underline"
            >
              View all orders &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              Loading orders...
            </div>
          ) : !report?.recentOrders || report.recentOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No orders for this date yet. Click <Link href="/orders/new" className="text-[#B8421E] font-bold underline">New Order</Link> to start an order.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600 bg-white">
                <thead className="bg-white text-[10px] uppercase font-bold tracking-wider text-stone-700 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Service & Table</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Kitchen Status</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {report.recentOrders.map((ord) => (
                    <tr
                      key={ord._id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-stone-900">
                        <Link href={`/orders/${ord._id}`} className="hover:text-[#B8421E]">
                          {ord.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize font-semibold text-stone-800">
                          {ord.orderType}
                        </span>
                        {ord.tableNumber && (
                          <span className="text-stone-500 ml-1">
                            (Table {ord.tableNumber})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {ord.customerName || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-500 num-tabular">
                        {ord.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-900 num-tabular">
                        {formatCurrency(ord.total, currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ord.status} type="order" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ord.paymentStatus} type="payment" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/orders/${ord._id}`}
                          className="px-3 py-1 bg-white hover:bg-stone-50 text-stone-900 font-bold text-[11px] rounded-[3px] border border-stone-200 hover:border-stone-400 transition-colors inline-block"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
