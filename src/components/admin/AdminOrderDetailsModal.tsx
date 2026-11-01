'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  DollarSign,
  Calendar,
  Clock,
  User,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  Video,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  CreditCard,
  Building2,
  Plus,
  Receipt,
  Phone,
  Mail,
  Truck,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface AdminOrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const AdminOrderDetailsModal: React.FC<AdminOrderDetailsModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // Split / Additional Payment recording state
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentType, setPaymentType] = useState('Progress Installment');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const fetchOrderDetails = () => {
    if (orderId) {
      setLoading(true);
      fetch(`/api/orders/${orderId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => setData(json))
        .catch((err) => console.error('Failed to load order details', err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(paymentAmount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setRecordingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: numAmount,
          paymentMethod,
          paymentType,
          transactionReference: paymentRef || `TXN-${Date.now().toString().slice(-6)}`,
          notes: paymentNotes || null,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setShowAddPaymentModal(false);
        setPaymentAmount('');
        setPaymentRef('');
        setPaymentNotes('');
        fetchOrderDetails();
        if (onRefresh) onRefresh();
      } else {
        alert(json.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Record payment error', err);
      alert('Network error recording payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  if (!isOpen || !orderId) return null;

  const order = data?.order;
  const items = data?.items || [];
  const media = data?.media || [];
  const payments = data?.payments || [];

  // Parse custom specifications if present
  let customSpecs: any = null;
  try {
    if (order?.customSpecifications) {
      customSpecs = JSON.parse(order.customSpecifications);
    }
  } catch {}

  const additionalPaymentsTotal = payments
    .slice(1) // additional beyond initial
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={order ? `Order Dossier: ${order.orderNumber}` : 'Loading Order...'}
        subtitle="Complete multi-item commission specifications, workshop media & financial ledger"
        maxWidth="xl"
      >
        {loading || !order ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading multi-item commission dossier...
          </div>
        ) : (
          <div className="space-y-6 text-xs text-white">
            {/* Header Summary Card */}
            <div className="p-4 bg-black/40 border border-[#B99A68]/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-serif font-bold text-white">{order.orderNumber}</span>
                  <Badge variant="gold">{order.orderStatus || order.status}</Badge>
                  <Badge variant="blue">{order.productionStage?.replace('_', ' ')}</Badge>
                  <Badge variant={order.paymentStatus === 'paid' ? 'green' : 'amber'}>
                    Payment: {order.paymentStatus?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#B99A68]" />
                    <strong className="text-white">{order.customerName}</strong>
                  </span>
                  {order.customerPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{order.customerPhone}</span>
                    </span>
                  )}
                  {order.customerEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{order.customerEmail}</span>
                    </span>
                  )}
                  {order.expectedCompletionDate && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Calendar className="w-3 h-3 text-[#B99A68]" />
                      <span>Delivery: {order.expectedCompletionDate}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="px-3 py-1.5 rounded-xl bg-[#B99A68] text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-[#a68856] transition-colors"
                >
                  <span>Full Production Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* COMMISSIONED LINE ITEMS TABLE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#B99A68] font-bold uppercase tracking-wider text-[11px]">
                  <Package className="w-4 h-4" /> Commissioned Products ({items.length || 1})
                </div>
                <span className="text-[11px] text-slate-400">
                  Total Quantity: {items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || order.quantity || 1} units
                </span>
              </div>

              <div className="overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Product Name & Specifications</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Discount</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(items.length > 0
                      ? items
                      : [
                          {
                            id: 'fallback',
                            productTitle: order.productName,
                            skuSnapshot: `SF-${order.productCategory?.substring(0, 3).toUpperCase()}-101`,
                            customDetails: order.customDesignDetails || order.productDescription,
                            specifications: order.dimensions ? `Dimensions: ${order.dimensions}` : null,
                            quantity: order.quantity || 1,
                            unit: 'pcs',
                            unitPrice: order.totalAmount,
                            discount: 0,
                            lineTotal: order.totalAmount,
                          },
                        ]
                    ).map((it: any, idx: number) => (
                      <tr key={it.id || idx} className="hover:bg-white/[0.02]">
                        <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <span className="font-bold text-white block">{it.productTitle || it.title}</span>
                          {it.customDetails && <p className="text-[11px] text-slate-300 italic">{it.customDetails}</p>}
                          {it.specifications && <p className="text-[10px] text-slate-400 mt-0.5">{it.specifications}</p>}
                          {it.fabricInfo && <p className="text-[10px] text-slate-400">Fabric: {it.fabricInfo}</p>}
                        </td>
                        <td className="p-3 text-center font-bold text-white">
                          {it.quantity} <span className="text-[10px] text-slate-400 font-normal">{it.unit || 'pcs'}</span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300">
                          ₨{Number(it.unitPrice || 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-400">
                          {Number(it.discount || 0) > 0 ? `-₨${Number(it.discount).toLocaleString()}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white text-sm">
                          ₨{Number(it.lineTotal || it.totalPrice || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FINANCIAL SUMMARY & LEDGER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#B99A68] font-bold uppercase tracking-wider text-[11px]">
                  <CreditCard className="w-4 h-4" /> Financial Summary & Payment Breakdown
                </div>
                {order.remainingBalance > 0 && (
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => {
                      setPaymentAmount(order.remainingBalance.toString());
                      setShowAddPaymentModal(true);
                    }}
                    className="h-7 text-[10px] px-2.5 font-bold"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Record Split / Additional Payment
                  </Button>
                )}
              </div>

              {/* 5-Column Financial Overview Cards */}
              <div className="bg-black/40 p-4 rounded-xl border border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Grand Total</span>
                  <span className="text-base font-bold text-[#B99A68] font-mono mt-0.5 block">
                    ₨{Number(order.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Advance Paid</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                    ₨{Number(payments[0]?.amount || order.paidAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Additional Payments</span>
                  <span className="text-sm font-bold text-blue-400 font-mono mt-0.5 block">
                    ₨{additionalPaymentsTotal.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Total Paid to Date</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                    ₨{Number(order.paidAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Remaining Balance</span>
                  <span className={`text-base font-bold font-mono mt-0.5 block ${order.remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ₨{Number(order.remainingBalance || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* ITEMIZED PAYMENT LEDGER TABLE */}
              <div className="border border-white/10 rounded-2xl bg-slate-950/60 overflow-hidden">
                <div className="p-3 bg-slate-900/80 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#B99A68]" /> Complete Order Payment Ledger ({payments.length} Transactions)
                  </span>
                  <span className="text-[10px] text-slate-400">Immutable Audit Trail</span>
                </div>

                {payments.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No payment transactions recorded for this order yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/40 text-slate-400 uppercase text-[10px] border-b border-white/5">
                        <tr>
                          <th className="p-3">Receipt #</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Payment Type</th>
                          <th className="p-3">Reference / UTR</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {payments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-white/[0.02]">
                            <td className="p-3 font-mono font-bold text-[#B99A68]">
                              {p.paymentNumber || p.id}
                            </td>
                            <td className="p-3 text-slate-400">
                              {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-white">{p.paymentMethod}</span>
                            </td>
                            <td className="p-3 text-slate-300">
                              {p.paymentType || 'Installment'}
                            </td>
                            <td className="p-3 font-mono text-slate-400">
                              {p.transactionReference || '—'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-400">
                              ₨{Number(p.amount).toLocaleString()}
                            </td>
                            <td className="p-3 text-slate-400">
                              {p.receivedBy || 'Staff'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* GOOGLE DRIVE WORKSHOP MEDIA REPOSITORY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#B99A68] font-bold uppercase tracking-wider text-[11px]">
                  <ImageIcon className="w-4 h-4" /> Google Drive Workshop Media ({media.length})
                </div>
              </div>

              {media.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {media.map((m: any, mIdx: number) => (
                    <div
                      key={m.id || mIdx}
                      className="p-2 bg-slate-900 border border-white/10 rounded-xl space-y-1.5 relative group"
                    >
                      <div className="aspect-video rounded-lg overflow-hidden bg-black/60 relative">
                        {m.mediaType === 'video' ? (
                          <video src={m.webViewLink || m.thumbnailUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={m.thumbnailUrl || m.webViewLink}
                            alt={m.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute top-1 left-1 bg-black/80 text-[9px] px-1.5 py-0.5 rounded text-white uppercase font-bold">
                          {m.stage?.replace('_', ' ')}
                        </div>
                      </div>
                      <span className="font-semibold text-white truncate block">{m.title || m.fileName}</span>
                      <a
                        href={m.webViewLink || m.thumbnailUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#B99A68] hover:underline flex items-center gap-1"
                      >
                        <span>Open in Drive</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-900/40 border border-dashed border-white/10 rounded-xl text-center text-slate-500">
                  No workshop media uploaded to Google Drive for this order yet.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <Button variant="ghost" onClick={onClose}>
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: RECORD SPLIT / ADDITIONAL PAYMENT */}
      <Modal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        title="Record Split / Additional Payment"
        subtitle={`Order #${order?.orderNumber} • Outstanding Balance: ₨${Number(order?.remainingBalance || 0).toLocaleString()}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs text-white">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Payment Amount (₨) *
            </label>
            <input
              type="number"
              required
              min={1}
              max={order?.remainingBalance || undefined}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount received"
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Remaining balance after this payment: ₨{Math.max(0, (order?.remainingBalance || 0) - Number(paymentAmount || 0)).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card (Debit/Credit)">Card (Debit/Credit)</option>
                <option value="Cash">Cash at Showroom</option>
                <option value="JazzCash / Mobile">JazzCash / Easypaisa</option>
                <option value="Cheque">Pay Order / Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
              >
                <option value="Progress Installment">Progress Installment</option>
                <option value="Split Payment">Split Payment</option>
                <option value="Final Settlement">Final Settlement</option>
                <option value="Advance Confirmation">Advance Confirmation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Transaction Ref / UTR / Receipt #
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. MEZN-98214 or Cash-Slip-104"
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Accounting Notes (Optional)
            </label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. Received partial advance via online transfer, balance on delivery"
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowAddPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              loading={recordingPayment}
              className="font-bold"
            >
              Confirm & Post to Ledger
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
