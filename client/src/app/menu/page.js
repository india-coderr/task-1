'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/formatters';

export default function MenuManagementPage() {
  const { isAdmin } = useAuth();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states (Admin)
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'Burgers',
    price: '',
    description: '',
    image: '',
    isAvailable: true
  });
  const [submittingForm, setSubmittingForm] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res?.data?.currency) setCurrency(res.data.currency);
    }).catch(() => {});
  }, []);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const queryParam = isAdmin ? '' : '?activeOnly=true';
      const res = await api.get(`/menu${queryParam}`);
      setMenuItems(res.data.items || []);
      setCategories(res.data.categories || ['All']);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, search]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      category: 'Burgers',
      price: '',
      description: '',
      image: '',
      isAvailable: true
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || '',
      image: item.image || '',
      isAvailable: item.isAvailable,
      isActive: item.isActive
    });
    setShowEditModal(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setSubmittingForm(true);
    setErrorMsg('');
    try {
      await api.post('/menu', {
        ...formData,
        price: Number(formData.price)
      });
      setShowAddModal(false);
      setSuccessMsg(`Menu dish '${formData.name}' created successfully.`);
      fetchMenu();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add dish to catalog.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSubmittingForm(true);
    setErrorMsg('');
    try {
      await api.put(`/menu/${editingItem._id}`, {
        ...formData,
        price: Number(formData.price)
      });
      setShowEditModal(false);
      setSuccessMsg(`Menu dish '${formData.name}' updated successfully.`);
      fetchMenu();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update menu dish.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeactivate = async (item) => {
    if (!confirm(`Deactivate '${item.name}'? It will no longer appear on the POS ordering register.`)) {
      return;
    }

    try {
      await api.patch(`/menu/${item._id}/deactivate`);
      setSuccessMsg(`'${item.name}' has been deactivated.`);
      fetchMenu();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to deactivate item.');
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.put(`/menu/${item._id}`, {
        isAvailable: !item.isAvailable
      });
      fetchMenu();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update item availability.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-4 bg-white">
        {/* Top Header - Thin border and 3px border radius */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[3px] border border-stone-200">
          <div>
            <h1 className="text-base font-bold text-stone-900 tracking-tight">
              Kitchen Menu Catalog
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {isAdmin
                ? 'Administrative catalog control: prices, inventory stock, and availability'
                : 'Kitchen dish offerings and inventory statuses'}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white text-xs font-bold rounded-[3px] border border-[#B8421E] transition-colors self-start sm:self-auto cursor-pointer"
            >
              + Add Catalog Dish
            </button>
          )}
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-3 bg-white border border-rose-300 text-rose-800 rounded-[3px] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-600">[!]</span>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="font-bold ml-2">
              &times;
            </button>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-white border border-emerald-300 text-emerald-800 rounded-[3px] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-600">&check;</span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="font-bold ml-2">
              &times;
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-3.5 rounded-[3px] border border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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

            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Search catalog dishes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Menu Cards - Thin borders with 3px radius */}
        {loading ? (
          <div className="py-20 text-center text-stone-400 text-xs">
            Loading catalog...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            No dishes found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`bg-white rounded-[3px] border ${
                  item.isActive ? 'border-stone-200' : 'border-dashed border-rose-300 bg-white opacity-60'
                } overflow-hidden flex flex-col justify-between`}
              >
                {/* Image */}
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

                {/* Details */}
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

                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] uppercase font-bold text-stone-700 bg-white border border-stone-200 px-1.5 py-0.5 rounded-[3px]">
                        {item.category}
                      </span>
                      {!item.isActive && (
                        <span className="text-[10px] uppercase font-bold text-rose-700 bg-white border border-rose-300 px-1.5 py-0.5 rounded-[3px]">
                          Deactivated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & Controls */}
                  <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[11px] font-bold ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-stone-50 text-stone-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isAvailable ? 'bg-emerald-600' : 'bg-stone-400'
                        }`}
                      />
                      {item.isAvailable ? 'In Stock' : 'Sold Out'}
                    </span>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item)}
                          className="px-2 py-0.5 text-[11px] font-bold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 rounded-[3px] border border-stone-200 hover:border-stone-400 cursor-pointer"
                          title="Toggle Stock"
                        >
                          {item.isAvailable ? 'Out' : 'In'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="px-2 py-0.5 text-[11px] font-bold text-[#B8421E] hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        {item.isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(item)}
                            className="px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                            title="Soft delete item"
                          >
                            Disable
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal (Admin) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-[3px] max-w-md w-full p-5 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900">
                  Add Catalog Dish
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-stone-400 hover:text-stone-800 text-sm font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveAdd} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Dish Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smashed Beef Burger"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Category <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs font-bold focus:outline-none focus:border-stone-400"
                    >
                      <option value="Burgers">Burgers</option>
                      <option value="Pizzas">Pizzas</option>
                      <option value="Pastas">Pastas</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Price ({currency}) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="9.99"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs num-tabular font-bold focus:outline-none focus:border-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Menu Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ingredients, preparation notes, allergen tags..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isAvailableAdd"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded-[3px] text-[#B8421E]"
                  />
                  <label htmlFor="isAvailableAdd" className="font-bold text-stone-700 cursor-pointer">
                    Immediately mark available in inventory
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-400 text-stone-700 font-bold rounded-[3px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingForm}
                    className="px-4 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white font-bold rounded-[3px] border border-[#B8421E] disabled:opacity-50 cursor-pointer"
                  >
                    {submittingForm ? 'Saving...' : 'Add Dish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal (Admin) */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-[3px] max-w-md w-full p-5 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900">
                  Edit Dish Details
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-stone-400 hover:text-stone-800 text-sm font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Dish Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs font-bold focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Category <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs font-bold focus:outline-none focus:border-stone-400"
                    >
                      <option value="Burgers">Burgers</option>
                      <option value="Pizzas">Pizzas</option>
                      <option value="Pastas">Pastas</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Price ({currency}) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs num-tabular font-bold focus:outline-none focus:border-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-[3px] text-xs focus:outline-none focus:border-stone-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAvailableEdit"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="rounded-[3px] text-[#B8421E]"
                    />
                    <label htmlFor="isAvailableEdit" className="font-bold text-stone-700 cursor-pointer">
                      In Stock
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActiveEdit"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded-[3px] text-[#B8421E]"
                    />
                    <label htmlFor="isActiveEdit" className="font-bold text-stone-700 cursor-pointer">
                      Active
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-400 text-stone-700 font-bold rounded-[3px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingForm}
                    className="px-4 py-1.5 bg-[#B8421E] hover:bg-[#9E3515] text-white font-bold rounded-[3px] border border-[#B8421E] disabled:opacity-50 cursor-pointer"
                  >
                    {submittingForm ? 'Saving...' : 'Update Dish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
