'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/formatters';

export default function NewOrderPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Settings
  const [settings, setSettings] = useState({
    taxRate: 5,
    currency: '₹',
    staffDiscountLimit: 15
  });

  // Cart / Order state
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch menu and settings
  useEffect(() => {
    async function loadData() {
      setLoadingMenu(true);
      try {
        const [menuRes, settingsRes] = await Promise.all([
          api.get('/menu?activeOnly=true&availableOnly=true'),
          api.get('/settings')
        ]);
        setMenuItems(menuRes.data.items || []);
        setCategories(menuRes.data.categories || ['All']);
        if (settingsRes.data) {
          setSettings(settingsRes.data);
        }
      } catch (err) {
        setErrorMsg('Failed to load menu or settings: ' + err.message);
      } finally {
        setLoadingMenu(false);
      }
    }
    loadData();
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem._id === item._id);
      if (existing) {
        return prev.map((c) =>
          c.menuItem._id === item._id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.menuItem._id === itemId ? { ...c, quantity: newQty } : c))
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.menuItem._id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountType('none');
    setDiscountValue(0);
    setErrorMsg('');
  };

  // Live client-side calculation
  const billingCalculation = useMemo(() => {
    let subtotal = 0;
    cart.forEach((c) => {
      subtotal += c.menuItem.price * c.quantity;
    });
    subtotal = Math.round(subtotal * 100) / 100;

    let discountAmount = 0;
    const numVal = parseFloat(discountValue) || 0;
    if (discountType === 'percent') {
      discountAmount = Math.round(subtotal * (numVal / 100) * 100) / 100;
    } else if (discountType === 'fixed') {
      discountAmount = Math.min(numVal, subtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxRate = typeof settings.taxRate === 'number' ? settings.taxRate : 5;
    const taxAmount = Math.round(discountedSubtotal * (taxRate / 100) * 100) / 100;
    const total = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  }, [cart, discountType, discountValue, settings.taxRate]);

  // Handle Order Submission
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMsg('Add at least one dish to submit an order.');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber.trim()) {
      setErrorMsg('Please specify a table number for dine-in orders.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        orderType,
        customerName: customerName.trim() || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItem._id,
          menuItem: c.menuItem._id,
          quantity: c.quantity
        })),
        discountType,
        discountValue: parseFloat(discountValue) || 0
      };

      if (orderType === 'dine-in') {
        payload.tableNumber = tableNumber.trim();
      }

      const res = await api.post('/orders', payload);
      const newOrder = res.data;
      router.push(`/orders/${newOrder._id}`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create order.');
      setSubmitting(false);
    }
  };

  const currency = settings.currency || '₹';

  return (
    <ProtectedRoute>
      <div className="flex flex-col lg:flex-row gap-4 items-start bg-white">
        {/* Left Column: Menu Dishes Catalog */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 bg-white p-4 border border-stone-200 rounded-[3px]">
            <div>
              <h1 className="text-base font-bold text-stone-900 tracking-tight">
                Menu Catalog & Ordering
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Select dishes to build order &middot; Prices calculated with system tax
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Search catalog by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400 font-medium"
              />
            </div>
          </div>

          {/* Category Filter Buttons - Thin borders with 3px radius */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-[3px] text-xs font-bold whitespace-nowrap transition-colors border ${
                  selectedCategory === cat
                    ? 'border-[#B8421E] bg-[#B8421E] text-white'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid - Thin borders with 3px radius, simple and clear */}
          {loadingMenu ? (
            <div className="py-20 text-center text-stone-400 text-xs">
              Loading menu catalog...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs">
              No dishes found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.menuItem._id === item._id);
                return (
                  <div
                    key={item._id}
                    className="bg-white rounded-[3px] border border-stone-200 overflow-hidden flex flex-col justify-between"
                  >
                    {/* Item Image */}
                    {item.image && (
                      <div className="h-36 w-full bg-stone-100 overflow-hidden border-b border-stone-200">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-stone-900 text-sm leading-snug">
                            {item.name}
                          </h3>
                          <span className="text-sm font-bold text-stone-900 num-tabular whitespace-nowrap">
                            {formatCurrency(item.price, currency)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <span className="inline-block mt-2 text-[10px] uppercase font-bold text-stone-700 bg-white border border-stone-200 px-1.5 py-0.5 rounded-[3px]">
                          {item.category}
                        </span>
                      </div>

                      {/* Add button or Quantity Stepper - Thin borders with 3px radius */}
                      <div className="mt-3.5 pt-2.5 border-t border-stone-100">
                        {inCart ? (
                          <div className="flex items-center justify-between w-full bg-white border border-stone-200 rounded-[3px] px-2 py-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item._id, inCart.quantity - 1)}
                              className="w-6 h-6 rounded-[3px] bg-white text-stone-900 font-bold text-xs hover:bg-stone-100 flex items-center justify-center border border-stone-200"
                              title="Decrease"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-stone-900 num-tabular px-2">
                              {inCart.quantity} in order
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item._id, inCart.quantity + 1)}
                              className="w-6 h-6 rounded-[3px] bg-[#B8421E] text-white font-bold text-xs hover:bg-[#9E3515] flex items-center justify-center border border-[#B8421E]"
                              title="Increase"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(item)}
                            className="w-full py-1.5 px-3 bg-[#B8421E] hover:bg-[#9E3515] text-white text-xs font-bold rounded-[3px] border border-[#B8421E] transition-colors"
                          >
                            + Add to Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary Cart Drawer - Thin borders with 3px radius, off-white theme */}
        <div className="w-full lg:w-[350px] shrink-0 sticky top-20 bg-white rounded-[3px] p-4 border border-stone-200">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h2 className="text-sm font-bold text-stone-900">Order Summary</h2>
              <p className="text-[11px] text-stone-400 num-tabular">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items selected
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-stone-500 hover:text-rose-600 transition-colors font-bold underline"
              >
                Clear
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mt-3 p-2 bg-white border border-rose-300 text-rose-800 rounded-[3px] text-xs flex items-center gap-2">
              <span className="font-bold text-rose-600">[!]</span>
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleCreateOrder} className="mt-3 space-y-3">
            {/* Service Type Selection - Thin borders with 3px radius */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Service Type
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrderType('dine-in')}
                  className={`py-1.5 px-2 rounded-[3px] text-xs font-bold transition-colors border ${
                    orderType === 'dine-in'
                      ? 'border-stone-900 bg-white text-stone-900'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                  }`}
                >
                  Dine-In
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  className={`py-1.5 px-2 rounded-[3px] text-xs font-bold transition-colors border ${
                    orderType === 'takeaway'
                      ? 'border-stone-900 bg-white text-stone-900'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                  }`}
                >
                  Takeaway
                </button>
              </div>
            </div>

            {/* Table Number & Customer */}
            <div className="grid grid-cols-2 gap-2">
              {orderType === 'dine-in' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Table # <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs font-bold focus:outline-none focus:border-stone-400"
                  />
                </div>
              )}
              <div className={orderType === 'dine-in' ? 'col-span-1' : 'col-span-2'}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Customer
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400 font-medium"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Itemized Dishes
              </label>

              {cart.length === 0 ? (
                <div className="py-5 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-[3px] bg-white">
                  Cart is empty.<br />Click &quot;+ Add to Order&quot; on any dish.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.menuItem._id}
                      className="flex items-center justify-between p-2 bg-white rounded-[3px] border border-stone-100 text-xs"
                    >
                      <div className="flex-1 mr-2">
                        <div className="font-bold text-stone-900 leading-snug">
                          {item.menuItem.name}
                        </div>
                        <div className="text-[11px] text-stone-500 num-tabular mt-0.5">
                          {formatCurrency(item.menuItem.price, currency)} each
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-stone-200 rounded-[3px]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                            className="px-2 py-0.5 text-stone-700 hover:text-black font-bold"
                          >
                            -
                          </button>
                          <span className="px-1.5 font-bold text-stone-900 num-tabular">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                            className="px-2 py-0.5 text-stone-700 hover:text-black font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-stone-900 num-tabular w-12 text-right">
                          {formatCurrency(item.menuItem.price * item.quantity, currency)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.menuItem._id)}
                          className="text-stone-400 hover:text-rose-600 text-xs font-bold px-1"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount Section */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-700">
                  Discount
                </span>
                {!isAdmin && (
                  <span className="text-[10px] text-stone-400">
                    (Staff limit: {settings.staffDiscountLimit}%)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1 mb-2">
                {['none', 'percent', 'fixed'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setDiscountType(type);
                      if (type === 'none') setDiscountValue(0);
                    }}
                    className={`py-1 rounded-[3px] text-xs font-bold capitalize transition-colors border ${
                      discountType === type
                        ? 'border-[#B8421E] bg-[#B8421E] text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    {type === 'none' ? 'None' : type === 'percent' ? '% Off' : `${currency} Off`}
                  </button>
                ))}
              </div>

              {discountType !== 'none' && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : undefined}
                    step={discountType === 'percent' ? '1' : '0.01'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percent' ? '10' : '50'}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs font-bold focus:outline-none num-tabular"
                  />
                  <span className="text-xs font-bold text-stone-700">
                    {discountType === 'percent' ? '%' : currency}
                  </span>
                </div>
              )}
            </div>

            {/* Bill Summary Breakdown */}
            <div className="pt-2 border-t border-stone-200 space-y-1 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Subtotal</span>
                <span className="font-bold text-stone-900 num-tabular">
                  {formatCurrency(billingCalculation.subtotal, currency)}
                </span>
              </div>

              {billingCalculation.discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-800 font-bold">
                  <span>Discount</span>
                  <span className="num-tabular">
                    -{formatCurrency(billingCalculation.discountAmount, currency)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-stone-600">
                <span>Tax ({settings.taxRate || 5}%)</span>
                <span className="font-bold text-stone-900 num-tabular">
                  {formatCurrency(billingCalculation.taxAmount, currency)}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200 flex items-center justify-between font-bold text-stone-900">
                <span>Balance Due</span>
                <span className="text-base text-[#B8421E] num-tabular">
                  {formatCurrency(billingCalculation.total, currency)}
                </span>
              </div>
            </div>

            {/* Submit Button - Thin borders with 3px radius */}
            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full py-2 px-4 bg-[#B8421E] hover:bg-[#9E3515] text-white font-bold rounded-[3px] border border-[#B8421E] text-xs transition-colors disabled:opacity-50 mt-1 cursor-pointer"
            >
              {submitting ? 'Transmitting to Kitchen...' : '+ Send Order to Kitchen'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
