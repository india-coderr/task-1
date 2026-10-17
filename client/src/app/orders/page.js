'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { formatCurrency, formatTime } from '@/lib/formatters';

export default function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [currency, setCurrency] = useState('₹');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res?.data?.currency) setCurrency(res.data.currency);
    }).catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (paymentFilter !== 'All') params.append('paymentStatus', paymentFilter);
      if (search.trim()) params.append('search', search.trim());
      if (selectedDate) params.append('date', selectedDate);
      params.append('page', page.toString());
      params.append('limit', '15');

      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.totalCount || 0);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve orders register.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, search, selectedDate, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleResetFilters = () => {
    setStatusFilter('All');
    setPaymentFilter('All');
    setSearch('');
    setSelectedDate('');
    setPage(1);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4 bg-white">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[3px] border border-stone-200">
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Order Register
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Live audit of active, ready, and fulfilled dining orders ({totalCount} total)
            </p>
          </div>

          <Link
            href="/orders/new"
            className="inline-flex items-center px-4 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white text-xs font-bold rounded-[3px] border border-[#B8421E] transition-colors self-start sm:self-auto"
          >
            + New Order
          </Link>
        </div>

        {/* Filter Bar - Thin borders with 3px radius and off-white theme */}
        <div className="bg-white p-3.5 rounded-[3px] border border-stone-200 space-y-2.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Pending', 'Preparing', 'Ready', 'Completed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-[3px] text-xs font-bold whitespace-nowrap transition-colors border ${
                  statusFilter === st
                    ? 'border-[#B8421E] bg-[#B8421E] text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Secondary Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100">
            {/* Search */}
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Search order #, table number, guest name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400 font-medium"
              />
            </div>

            {/* Payment Filter */}
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs font-bold focus:outline-none focus:border-stone-400"
              >
                <option value="All">Payment: All</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400 font-semibold"
              />
              {(statusFilter !== 'All' || paymentFilter !== 'All' || search || selectedDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold rounded-[3px] border border-stone-200 whitespace-nowrap"
                  title="Clear filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-white border border-rose-300 text-rose-800 rounded-[3px] text-xs">
            {errorMsg}
          </div>
        )}

        {/* Orders Table - Thin borders with 3px radius */}
        <div className="bg-white rounded-[3px] border border-stone-200 overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-stone-400 text-xs">
              Loading orders register...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs">
              No orders found matching the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600 bg-white">
                <thead className="bg-white text-[10px] uppercase font-bold tracking-wider text-stone-700 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Service & Table</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Gross Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Settlement</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {orders.map((ord) => (
                    <tr
                      key={ord._id}
                      className="hover:bg-stone-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-stone-900">
                        {ord.orderNumber}
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
                      <td className="px-4 py-3 text-[11px] text-stone-400 whitespace-nowrap" suppressHydrationWarning>
                        {formatTime(ord.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/orders/${ord._id}`}
                          className="px-3 py-1 bg-white hover:bg-stone-50 text-stone-900 font-bold text-[11px] rounded-[3px] border border-stone-200 hover:border-stone-400 transition-colors inline-block"
                        >
                          View Order
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600 bg-white">
              <span className="num-tabular text-[11px] font-bold">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 bg-white border border-stone-200 rounded-[3px] text-xs font-bold disabled:opacity-40 hover:border-stone-400"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 bg-white border border-stone-200 rounded-[3px] text-xs font-bold disabled:opacity-40 hover:border-stone-400"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
