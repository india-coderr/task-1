'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatTime } from '@/lib/formatters';

function OrderDetailsContent({ params }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState({ currency: '₹', taxRate: 5, restaurantName: 'Foodly Kitchen' });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Payment recording state
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Status transition state
  const [advancingStatus, setAdvancingStatus] = useState(false);

  // Edit items modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [editItems, setEditItems] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [orderRes, settingsRes] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get('/settings')
      ]);
      setOrder(orderRes.data);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to retrieve order.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Advance status forward strictly one step
  const handleAdvanceStatus = async () => {
    if (!order) return;
    const nextSteps = {
      Pending: 'Preparing',
      Preparing: 'Ready',
      Ready: 'Completed'
    };

    const nextStatus = nextSteps[order.status];
    if (!nextStatus) return;

    if (nextStatus === 'Completed' && order.paymentStatus !== 'Paid') {
      setErrorMsg('Cannot mark order as Completed. Payment must be recorded first.');
      return;
    }

    setAdvancingStatus(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.patch(`/orders/${order._id}/status`, {
        status: nextStatus
      });
      setOrder(res.data);
      setSuccessMsg(`Order status advanced to '${nextStatus}'.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order status.');
    } finally {
      setAdvancingStatus(false);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!order) return;

    setRecordingPayment(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/orders/${order._id}/payment`, {
        method: paymentMethod,
        amount: order.total
      });
      setOrder(res.data);
      setSuccessMsg(`Payment of ${formatCurrency(order.total, settings.currency)} recorded via ${paymentMethod}.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record payment.');
    } finally {
      setRecordingPayment(false);
    }
  };

  // Open Edit Modal
  const openEditModal = async () => {
    try {
      const res = await api.get('/menu?activeOnly=true&availableOnly=true');
      setAllMenuItems(res.data.items || []);
      setEditItems(
        order.items.map((i) => ({
          menuItemId: i.menuItem?._id || i.menuItem,
          menuItem: i.menuItem?._id || i.menuItem,
          nameSnapshot: i.nameSnapshot,
          priceSnapshot: i.priceSnapshot,
          quantity: i.quantity
        }))
      );
      setShowEditModal(true);
    } catch (err) {
      setErrorMsg('Failed to load menu for editing: ' + err.message);
    }
  };

  // Save Edited Items
  const handleSaveEdit = async () => {
    if (editItems.length === 0) {
      setErrorMsg('An order must have at least one dish.');
      return;
    }

    setSavingEdit(true);
    setErrorMsg('');
    try {
      const payload = {
        items: editItems.map((i) => ({
          menuItemId: i.menuItemId || i.menuItem,
          menuItem: i.menuItemId || i.menuItem,
          quantity: i.quantity
        })),
        discountType: order.discountType || 'none',
        discountValue: order.discountValue || 0
      };

      const res = await api.put(`/orders/${order._id}/items`, payload);
      setOrder(res.data);
      setShowEditModal(false);
      setSuccessMsg('Order items updated successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currency = settings.currency || '₹';

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="py-20 text-center text-stone-400 text-xs">
          Loading order details...
        </div>
      </ProtectedRoute>
    );
  }

  if (!order) {
    return (
      <ProtectedRoute>
        <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-[3px] border border-stone-200 text-center">
          <p className="text-stone-600 text-xs mb-3">Order not found.</p>
          <Link
            href="/orders"
            className="px-3.5 py-1.5 bg-[#B8421E] text-white text-xs font-semibold rounded-[3px] border border-[#B8421E]"
          >
            Back to Orders
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const nextStepMap = {
    Pending: 'Preparing',
    Preparing: 'Ready',
    Ready: 'Completed'
  };
  const nextStatusLabel = nextStepMap[order.status];

  return (
    <ProtectedRoute>
      <div className="space-y-4 max-w-4xl mx-auto bg-white">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[3px] border border-stone-200">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="text-xs font-bold text-stone-700 hover:text-stone-900"
            >
              &larr; Back to Orders
            </Link>
            <span className="text-stone-300">|</span>
            <span className="font-mono text-sm font-bold text-stone-800">
              {order.orderNumber}
            </span>
            <StatusBadge status={order.status} type="order" />
            <StatusBadge status={order.paymentStatus} type="payment" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold rounded-[3px] border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
            >
              Print Check
            </button>

            {order.status === 'Pending' && order.paymentStatus !== 'Paid' && (
              <button
                onClick={openEditModal}
                className="px-3.5 py-1.5 bg-white hover:bg-stone-50 text-stone-900 text-xs font-bold rounded-[3px] border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
              >
                Edit Items
              </button>
            )}

            {nextStatusLabel && (
              <button
                onClick={handleAdvanceStatus}
                disabled={advancingStatus}
                className="px-4 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white text-xs font-bold rounded-[3px] border border-[#B8421E] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {advancingStatus ? 'Advancing...' : `Advance to ${nextStatusLabel}`}
              </button>
            )}
          </div>
        </div>

        {/* Feedback Notifications */}
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

        {/* Kitchen Status Stepper - Thin borders with 3px radius */}
        <div className="bg-white rounded-[3px] p-4 border border-stone-200">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">
            Kitchen Preparation Status
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['Pending', 'Preparing', 'Ready', 'Completed'].map((st, i) => {
              const statusOrder = ['Pending', 'Preparing', 'Ready', 'Completed'];
              const currentIdx = statusOrder.indexOf(order.status);
              const stepIdx = i;
              const isDone = stepIdx <= currentIdx;
              const isCurrent = stepIdx === currentIdx;

              return (
                <div
                  key={st}
                  className={`py-2.5 px-3 rounded-[3px] text-center transition-all ${
                    isCurrent
                      ? 'bg-[#FDF5F2] text-[#B8421E] font-bold'
                      : isDone
                      ? 'bg-stone-100 text-stone-800 font-semibold'
                      : 'bg-stone-50 text-stone-400 font-normal'
                  }`}
                >
                  <div className="text-xs font-bold">{st}</div>
                </div>
              );
            })}
          </div>

          {order.status === 'Ready' && order.paymentStatus !== 'Paid' && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-[3px] border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
              <span className="font-bold text-amber-700">[!]</span>
              <span>
                <strong>Attention:</strong> Order is ready for guest delivery. Settle balance below before advancing to <strong>Completed</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Printable Guest Check Box - Thin borders with 3px radius */}
        <div
          id="printable-receipt"
          className="bg-white rounded-[3px] p-5 border border-stone-200 space-y-4"
        >
          {/* Header Ticket Info */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="text-base font-bold text-stone-900 tracking-tight">
                {settings.restaurantName || 'Foodly Kitchen'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-bold text-stone-700">
                  {order.orderNumber}
                </span>
                <StatusBadge status={order.status} type="order" />
                <StatusBadge status={order.paymentStatus} type="payment" />
              </div>
              <p className="text-[11px] text-stone-400 mt-1" suppressHydrationWarning>
                Logged at {formatTime(order.createdAt)} by{' '}
                <span className="font-medium text-stone-600">
                  {order.createdBy?.name || 'Staff'}
                </span>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs">
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Service Desk
              </div>
              <div className="font-bold text-stone-800 capitalize mt-0.5">
                {order.orderType === 'dine-in'
                  ? `Dine-In · Table ${order.tableNumber}`
                  : 'Takeaway Service'}
              </div>
              {order.customerName && (
                <div className="text-[11px] text-stone-500 mt-0.5">
                  Guest: <span className="font-medium text-stone-700">{order.customerName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ordered Items Table */}
          <div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                  <th className="py-2 font-normal">Dish Description</th>
                  <th className="py-2 text-center font-normal">Unit Price</th>
                  <th className="py-2 text-center font-normal">Qty</th>
                  <th className="py-2 text-right font-normal">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {order.items.map((it, idx) => (
                  <tr key={idx} className="text-stone-800">
                    <td className="py-2 font-medium text-stone-900">
                      {it.nameSnapshot}
                    </td>
                    <td className="py-2 text-center text-stone-600 num-tabular">
                      {formatCurrency(it.priceSnapshot, currency)}
                    </td>
                    <td className="py-2 text-center font-bold text-stone-900 num-tabular">
                      {it.quantity}
                    </td>
                    <td className="py-2 text-right font-semibold text-stone-900 num-tabular">
                      {formatCurrency(it.lineTotal, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary */}
          <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row sm:justify-end">
            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-medium text-stone-900 num-tabular">
                  {formatCurrency(order.subtotal, currency)}
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>
                    Discount ({order.discountType === 'percent' ? `${order.discountValue}%` : 'Fixed'})
                  </span>
                  <span className="num-tabular font-medium">
                    -{formatCurrency(order.discountAmount, currency)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-stone-600">
                <span>Sales Tax ({order.taxRate}%)</span>
                <span className="font-medium text-stone-900 num-tabular">
                  {formatCurrency(order.taxAmount, currency)}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-bold text-stone-900">
                <span>Total Amount Due</span>
                <span className="text-base text-[#B8421E] num-tabular">
                  {formatCurrency(order.total, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Status & Settlement */}
          <div className="pt-4 border-t border-stone-200">
            {order.paymentStatus === 'Paid' && order.payment ? (
              <div className="bg-white rounded-[3px] border border-emerald-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-[3px]">
                    &check; PAID
                  </span>
                  <div>
                    <span className="font-bold text-stone-900 text-xs">
                      Settled via {order.payment.method}
                    </span>
                    <p className="text-stone-500 text-[11px] num-tabular mt-0.5" suppressHydrationWarning>
                      Amount: {formatCurrency(order.payment.amount, currency)} &middot; Processed by {order.payment.recordedBy?.name || 'Staff'} at {formatTime(order.payment.paidAt)}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 bg-white text-emerald-800 font-semibold rounded-[3px] text-[11px] border border-emerald-200 self-start sm:self-auto">
                  Receipt Closed
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleRecordPayment}
                className="bg-white rounded-[3px] p-4 space-y-3 border border-stone-200"
              >
                <div className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Tender Customer Payment
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  {/* Method selector */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash')}
                      className={`flex-1 py-1.5 rounded-[3px] text-xs font-bold transition-colors border ${
                        paymentMethod === 'Cash'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`flex-1 py-1.5 rounded-[3px] text-xs font-bold transition-colors border ${
                        paymentMethod === 'UPI'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      UPI
                    </button>
                  </div>

                  {/* Amount display */}
                  <div className="px-3 py-1.5 bg-white rounded-[3px] border border-stone-200 text-xs flex items-center justify-between">
                    <span className="text-stone-500 font-bold">Due:</span>
                    <span className="font-bold text-stone-900 num-tabular">
                      {formatCurrency(order.total, currency)}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={recordingPayment}
                    className="w-full py-1.5 px-3 bg-[#B8421E] hover:bg-[#9E3515] text-white font-bold text-xs rounded-[3px] border border-[#B8421E] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {recordingPayment ? 'Settling...' : `Confirm Payment (${paymentMethod})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Edit Order Items Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-[3px] max-w-md w-full p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="text-xs font-bold text-stone-900">
                  Edit Order #{order.orderNumber}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-stone-400 hover:text-stone-800 text-sm font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2">
                {editItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-stone-50 rounded-[3px] text-xs border border-stone-200"
                  >
                    <span className="font-medium text-stone-800 mr-2 flex-1">
                      {item.nameSnapshot}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-stone-200 rounded-[3px]">
                        <button
                          type="button"
                          onClick={() => {
                            const newQty = item.quantity - 1;
                            if (newQty <= 0) {
                              setEditItems(editItems.filter((_, i) => i !== index));
                            } else {
                              const updated = [...editItems];
                              updated[index].quantity = newQty;
                              setEditItems(updated);
                            }
                          }}
                          className="px-2 py-0.5 text-stone-600 hover:text-black font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-1.5 font-bold text-stone-900 num-tabular">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...editItems];
                            updated[index].quantity = item.quantity + 1;
                            setEditItems(updated);
                          }}
                          className="px-2 py-0.5 text-stone-600 hover:text-black font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditItems(editItems.filter((_, i) => i !== index))}
                        className="text-stone-400 hover:text-rose-600 p-0.5 text-xs font-bold cursor-pointer"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                  Add Dish to Order
                </label>
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) return;
                    const found = allMenuItems.find((m) => m._id === selectedId);
                    if (found) {
                      const existIndex = editItems.findIndex(
                        (it) => (it.menuItemId || it.menuItem) === found._id
                      );
                      if (existIndex >= 0) {
                        const updated = [...editItems];
                        updated[existIndex].quantity += 1;
                        setEditItems(updated);
                      } else {
                        setEditItems([
                          ...editItems,
                          {
                            menuItemId: found._id,
                            menuItem: found._id,
                            nameSnapshot: found.name,
                            priceSnapshot: found.price,
                            quantity: 1
                          }
                        ]);
                      }
                    }
                    e.target.value = '';
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400 font-medium"
                >
                  <option value="">-- Choose dish to add --</option>
                  {allMenuItems.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({formatCurrency(m.price, currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-[3px] border border-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit || editItems.length === 0}
                  className="px-3.5 py-1 bg-[#B8421E] hover:bg-[#9E3515] text-white text-xs font-bold rounded-[3px] border border-[#B8421E] disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Updating Order...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function OrderDetailsPage(props) {
  return (
    <React.Suspense
      fallback={
        <div className="py-20 text-center text-stone-400">
          <p className="text-xs font-medium">Loading order...</p>
        </div>
      }
    >
      <OrderDetailsContent {...props} />
    </React.Suspense>
  );
}
