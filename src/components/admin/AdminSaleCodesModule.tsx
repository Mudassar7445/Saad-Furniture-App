'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Calendar,
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  validUntil: string | null;
  usageLimit: number;
  usedCount: number;
  isActive: number;
  createdAt: string;
}

export function AdminSaleCodesModule() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState<number | ''>('');
  const [formMinOrder, setFormMinOrder] = useState<number | ''>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | ''>('');
  const [formValidUntil, setFormValidUntil] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState<number | ''>(100);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      } else {
        showToast('Failed to load promotional sale codes.', 'error');
      }
    } catch {
      showToast('Network error loading coupons.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormType('percentage');
    setFormValue('');
    setFormMinOrder(0);
    setFormMaxDiscount('');
    setFormValidUntil('');
    setFormUsageLimit(100);
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormType(coupon.discountType);
    setFormValue(coupon.discountValue);
    setFormMinOrder(coupon.minOrderAmount);
    setFormMaxDiscount(coupon.maxDiscountAmount || '');
    setFormValidUntil(coupon.validUntil ? coupon.validUntil.split('T')[0] : '');
    setFormUsageLimit(coupon.usageLimit);
    setFormIsActive(coupon.isActive === 1);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCode.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (formValue === '' || Number(formValue) <= 0) {
      setFormError('Please enter a valid positive discount value.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: formCode.trim().toUpperCase(),
        discountType: formType,
        discountValue: Number(formValue),
        minOrderAmount: Number(formMinOrder) || 0,
        maxDiscountAmount: formMaxDiscount !== '' ? Number(formMaxDiscount) : null,
        validUntil: formValidUntil ? new Date(formValidUntil).toISOString() : null,
        usageLimit: Number(formUsageLimit) || 100,
        isActive: formIsActive ? 1 : 0,
      };

      let res;
      if (editingCoupon) {
        res = await fetch(`/api/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save coupon.');
      }

      showToast(editingCoupon ? 'Coupon updated successfully!' : 'New coupon created successfully!');
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const nextActive = coupon.isActive === 1 ? 0 : 1;
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: nextActive } : c))
        );
        showToast(`Coupon "${coupon.code}" is now ${nextActive === 1 ? 'Active' : 'Inactive'}.`);
      } else {
        showToast('Failed to toggle coupon status.', 'error');
      }
    } catch {
      showToast('Error changing coupon status.', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setDeleteConfirmId(null);
        showToast('Coupon removed successfully.');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete coupon.', 'error');
      }
    } catch {
      showToast('Error deleting coupon.', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const now = new Date();
  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < now;
  };

  // Filtered List
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.discountType.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const expired = isExpired(coupon.validUntil);
    if (filterStatus === 'active') return coupon.isActive === 1 && !expired;
    if (filterStatus === 'inactive') return coupon.isActive === 0;
    if (filterStatus === 'expired') return expired;
    return true;
  });

  const totalActive = coupons.filter((c) => c.isActive === 1 && !isExpired(c.validUntil)).length;
  const totalUsed = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs text-white border ${
            toastMessage.type === 'success'
              ? 'bg-[#141824] border-emerald-500/50'
              : 'bg-[#241414] border-rose-500/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-[#c5a880]" />
            <span>Sale Code & Coupon Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, monitor, and regulate promotional discount codes for showroom patrons.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCoupons}
            className="border-slate-700 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-[#c5a880] hover:bg-[#b59870] text-[#141824] font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Sale Code
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141824]/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880]">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Configured Codes</span>
            <span className="text-xl font-bold text-white">{coupons.length}</span>
          </div>
        </div>

        <div className="bg-[#141824]/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Currently Active & Redeemable</span>
            <span className="text-xl font-bold text-emerald-400">{totalActive}</span>
          </div>
        </div>

        <div className="bg-[#141824]/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Patron Redemptions</span>
            <span className="text-xl font-bold text-blue-400">{totalUsed}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#141824]/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search code or discount type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b0e14] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'inactive', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filterStatus === status
                  ? 'bg-[#c5a880] text-[#141824] font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table / Cards */}
      <div className="bg-[#141824]/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#c5a880]" />
            <span className="text-xs">Loading promotional sale codes...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <Tag className="w-8 h-8 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No sale codes found.</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Click &quot;Create Sale Code&quot; above to issue your first bespoke discount code.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Threshold / Cap</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Usage Stats</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCoupons.map((coupon) => {
                  const expired = isExpired(coupon.validUntil);
                  const usageExhausted = coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(coupon.code)}
                            title="Copy Code"
                            className="text-slate-500 hover:text-[#c5a880] transition-colors p-1"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-400 text-sm">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}% Off`
                            : `$${coupon.discountValue} Off`}
                        </span>
                        <span className="text-[10px] text-slate-500 block uppercase">
                          {coupon.discountType}
                        </span>
                      </td>

                      {/* Min Order & Max Cap */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="text-slate-300 block">
                            Min: {coupon.minOrderAmount > 0 ? `$${coupon.minOrderAmount}` : 'None'}
                          </span>
                          {coupon.maxDiscountAmount && (
                            <span className="text-[10px] text-slate-400 block">
                              Max Cap: ${coupon.maxDiscountAmount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="py-3 px-4">
                        {coupon.validUntil ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{new Date(coupon.validUntil).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">No Expiration</span>
                        )}
                        {expired && (
                          <span className="text-[10px] text-rose-400 block font-semibold">
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-300">
                            <span>{coupon.usedCount} used</span>
                            <span className="text-slate-500">limit {coupon.usageLimit}</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                usageExhausted ? 'bg-rose-500' : 'bg-[#c5a880]'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (coupon.usedCount / (coupon.usageLimit || 1)) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                            coupon.isActive === 1 && !expired
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              coupon.isActive === 1 && !expired ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          {coupon.isActive === 1 && !expired ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit Coupon"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(coupon.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title={editingCoupon ? `Edit Sale Code: ${editingCoupon.code}` : 'Create New Sale Code'}
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Code */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Coupon Code <span className="text-[#c5a880]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. SUMMER20, BESPOKE15"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tracking-wider focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Discount Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as 'percentage' | 'fixed')}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Discount Value <span className="text-[#c5a880]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder={formType === 'percentage' ? '15' : '150'}
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  {formType === 'percentage' ? '%' : '$'}
                </span>
              </div>
            </div>
          </div>

          {/* Min Order & Max Cap */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Min Order Investment ($)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Max Discount Cap ($)</label>
              <input
                type="number"
                min="0"
                placeholder="Optional"
                value={formMaxDiscount}
                onChange={(e) =>
                  setFormMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          {/* Expiry Date & Usage Limit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={formValidUntil}
                onChange={(e) => setFormValidUntil(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Usage Limit</label>
              <input
                type="number"
                min="1"
                placeholder="100"
                value={formUsageLimit}
                onChange={(e) =>
                  setFormUsageLimit(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={formIsActive}
              onChange={(e) => setFormIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-[#c5a880] focus:ring-[#c5a880]"
            />
            <label htmlFor="isActiveToggle" className="text-slate-300 font-medium cursor-pointer">
              Enable code immediately upon saving
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => setIsModalOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-[#c5a880] hover:bg-[#b59870] text-[#141824] font-semibold"
            >
              {submitting ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Code'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Sale Code Deletion"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to permanently delete this sale code? Patrons will no longer be able to redeem it.
          </p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => deleteConfirmId && handleDeleteCoupon(deleteConfirmId)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

