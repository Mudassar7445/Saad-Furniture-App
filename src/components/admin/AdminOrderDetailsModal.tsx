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
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      fetch(`/api/orders/${orderId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => setData(json))
        .catch((err) => console.error('Failed to load order details', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, orderId]);

  if (!isOpen || !orderId) return null;

  const order = data?.order;
  const items = data?.items || [];
  const media = data?.media || [];
  const payments = data?.payments || [];

  return (
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
          {/* Header Summary */}
          <div className="p-4 bg-black/40 border border-[#B99A68]/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-serif font-bold text-white">{order.orderNumber}</span>
                <Badge variant="gold">{order.status || order.orderStatus}</Badge>
                <Badge variant="blue">{order.productionStage?.replace('_', ' ')}</Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Patron: <strong className="text-white">{order.customerName}</strong> ({order.customerPhone || order.customerEmail})
              </p>
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

          {/* MULTI-ITEM COMMISSION TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#B99A68] font-bold uppercase tracking-wider text-[11px]">
                <Package className="w-4 h-4" /> Commissioned Line Items ({items.length || 1})
              </div>
              <span className="text-[11px] text-slate-400">
                Total Quantity: {items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || order.quantity || 1} pieces
              </span>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded-2xl bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Product Name & SKU</th>
                    <th className="p-3">Specifications / Carving Notes</th>
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
                        {it.skuSnapshot && (
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{it.skuSnapshot}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {it.customDetails && <p className="italic">{it.customDetails}</p>}
                        {it.specifications && <p className="text-[11px] text-slate-400 mt-0.5">{it.specifications}</p>}
                        {it.customizationDetails && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{it.customizationDetails}</p>
                        )}
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

            {/* Financial Ledger Breakdown */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Subtotal</span>
                <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                  ₨{Number(order.subtotal || order.totalAmount).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Grand Total</span>
                <span className="text-base font-bold text-[#B99A68] font-mono mt-0.5 block">
                  ₨{Number(order.totalAmount).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Advance Paid</span>
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
          </div>

          {/* GOOGLE DRIVE MEDIA REPOSITORY FOR THIS ORDER */}
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
  );
};

