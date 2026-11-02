'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building2,
  CreditCard,
  Smartphone,
  Banknote,
  Truck,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export const OnlineOrdersModule: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Receipt Modal
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (paymentFilter) params.append('paymentStatus', paymentFilter);
      if (statusFilter) params.append('orderStatus', statusFilter);

      const res = await fetch(`/api/orders/online?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Failed to load online orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, paymentFilter, statusFilter]);

  const handleReceiptReview = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      setSubmittingAction(true);
      const res = await fetch('/api/orders/online', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          receiptAction: action,
          notes: reviewNotes,
        }),
      });
      if (res.ok) {
        setActiveReceiptOrder(null);
        setReviewNotes('');
        await fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, action: 'confirm' | 'cancel') => {
    try {
      const res = await fetch('/api/orders/online', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // KPIs
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingReceipts = orders.filter((o) => o.paymentStatus === 'pending_verification').length;
  const inProductionCount = orders.filter((o) => o.orderStatus === 'in_production').length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#c5a880]" />
            <span>Online E-Commerce Orders Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time control over customer online cart orders, digital payments, and bank transfer receipts.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={fetchOrders} className="text-xs">
          Refresh Orders
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#141822] border border-white/5 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Total Online Orders
          </span>
          <span className="text-2xl font-bold font-serif text-white">{orders.length}</span>
          <span className="text-[10px] text-slate-500 block">Placed via website</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141822] border border-amber-500/20 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block">
            Pending Bank Receipts
          </span>
          <span className="text-2xl font-bold font-serif text-amber-400">{pendingReceipts}</span>
          <span className="text-[10px] text-amber-500/80 block">Requires account audit</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141822] border border-emerald-500/20 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold block">
            Verified Revenue
          </span>
          <span className="text-2xl font-bold font-serif text-emerald-400">
            PKR {totalRevenue.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-500/80 block">Cleared digital funds</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141822] border border-blue-500/20 space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-blue-300 font-semibold block">
            Atelier Preparation
          </span>
          <span className="text-2xl font-bold font-serif text-blue-400">{inProductionCount}</span>
          <span className="text-[10px] text-blue-500/80 block">In white-glove workflow</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order ID, Customer Name, Phone, Email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-[#c5a880]"
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid & Cleared</option>
          <option value="pending_verification">Pending Bank Receipt Review</option>
          <option value="unpaid">Unpaid / Cash on Delivery</option>
          <option value="failed">Failed / Rejected</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-[#c5a880]"
        >
          <option value="">All Order Statuses</option>
          <option value="in_production">In Production / Packing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading online store orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-slate-400">
            <ShoppingBag className="w-10 h-10 opacity-30 mx-auto text-[#c5a880]" />
            <p className="text-sm">No online orders found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items Summary</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Order ID */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-white">#{ord.orderNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <div className="font-semibold text-white">{ord.customerName}</div>
                      <div className="text-[10px] text-slate-400">{ord.customerPhone}</div>
                      <div className="text-[10px] text-slate-500">{ord.customerEmail}</div>
                    </td>

                    {/* Items */}
                    <td className="p-4 max-w-xs">
                      <div className="font-medium text-slate-200 line-clamp-1">{ord.productName}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {ord.deliveryAddress}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-4 font-bold text-white">
                      PKR {ord.totalAmount?.toLocaleString()}
                    </td>

                    {/* Payment Method */}
                    <td className="p-4 capitalize">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        {ord.paymentMethod === 'card' && <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                        {ord.paymentMethod === 'jazzcash' && <Smartphone className="w-3.5 h-3.5 text-rose-400" />}
                        {ord.paymentMethod === 'bank_transfer' && <Building2 className="w-3.5 h-3.5 text-amber-400" />}
                        {ord.paymentMethod === 'cod' && <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{ord.paymentMethod?.replace('_', ' ')}</span>
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="p-4">
                      {ord.paymentStatus === 'paid' && <Badge variant="green">Paid & Cleared</Badge>}
                      {ord.paymentStatus === 'pending_verification' && (
                        <div className="space-y-1">
                          <Badge variant="gold">Awaiting Verification</Badge>
                          {ord.bankReceipt && (
                            <button
                              onClick={() => setActiveReceiptOrder(ord)}
                              className="block text-[10px] text-[#e5caa2] hover:underline font-bold"
                            >
                              Inspect Bank Receipt →
                            </button>
                          )}
                        </div>
                      )}
                      {ord.paymentStatus === 'unpaid' && <Badge variant="neutral">Cash on Delivery</Badge>}
                      {ord.paymentStatus === 'failed' && <Badge variant="red">Failed / Rejected</Badge>}
                    </td>

                    {/* Order Status */}
                    <td className="p-4">
                      <Badge
                        variant={
                          ord.orderStatus === 'delivered'
                            ? 'green'
                            : ord.orderStatus === 'in_production'
                              ? 'gold'
                              : 'neutral'
                        }
                      >
                        {ord.orderStatus?.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ord.orderStatus === 'pending' && (
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => handleOrderStatusUpdate(ord.id, 'confirm')}
                            className="text-[11px] px-2 py-1"
                          >
                            Accept
                          </Button>
                        )}
                        <Link href={`/orders/${ord.id}`}>
                          <Button variant="secondary" size="sm" className="text-[11px] px-2 py-1 flex items-center gap-1">
                            <span>Track</span>
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bank Transfer Receipt Review Modal */}
      {activeReceiptOrder && (
        <Modal
          isOpen={Boolean(activeReceiptOrder)}
          onClose={() => setActiveReceiptOrder(null)}
          title={`Review Bank Transfer: Order #${activeReceiptOrder.orderNumber}`}
          subtitle={`Patron: ${activeReceiptOrder.customerName} • Total: PKR ${activeReceiptOrder.totalAmount?.toLocaleString()}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-slate-100 text-xs">
            {activeReceiptOrder.bankReceipt ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sender Account:</span>
                    <span className="font-semibold text-white">
                      {activeReceiptOrder.bankReceipt.senderAccountTitle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bank Name:</span>
                    <span className="text-white">{activeReceiptOrder.bankReceipt.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction Reference:</span>
                    <span className="font-mono font-bold text-[#e5caa2]">
                      {activeReceiptOrder.bankReceipt.transactionReference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Claimed Amount:</span>
                    <span className="font-bold text-emerald-400">
                      PKR {activeReceiptOrder.bankReceipt.amountPaid?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Receipt Image Display */}
                <div>
                  <span className="text-slate-400 block mb-1 font-semibold">Uploaded Payment Proof:</span>
                  <div className="rounded-xl overflow-hidden border border-white/10 max-h-72 bg-black flex items-center justify-center">
                    <img
                      src={activeReceiptOrder.bankReceipt.receiptImageUrl}
                      alt="Bank Receipt"
                      className="max-h-72 object-contain"
                    />
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Audit Review Notes</label>
                  <input
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="e.g. Verified with bank statement credit reference #981"
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex justify-between gap-3">
                  <Button
                    variant="danger"
                    size="md"
                    loading={submittingAction}
                    onClick={() => handleReceiptReview(activeReceiptOrder.id, 'reject')}
                  >
                    Reject Receipt
                  </Button>
                  <Button
                    variant="gold"
                    size="md"
                    loading={submittingAction}
                    onClick={() => handleReceiptReview(activeReceiptOrder.id, 'approve')}
                    className="font-bold flex items-center gap-1.5 shadow-lg shadow-[#c5a880]/20"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Approve & Credit Ledger (PKR {activeReceiptOrder.totalAmount?.toLocaleString()})</span>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">No bank transfer receipt recorded for this order.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

