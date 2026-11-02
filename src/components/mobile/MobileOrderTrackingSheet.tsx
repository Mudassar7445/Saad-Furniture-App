'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Package,
  Calendar,
  Image as ImageIcon,
  Video,
  FileText,
  MapPin,
  ExternalLink,
  Layers,
  Sparkles,
  PhoneCall,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  MessageCircle,
  Play,
  Camera,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getSafeThumbnailUrl } from '@/lib/media/videoThumbnail';
import { OrderCraftingGallery } from '@/components/orders/OrderCraftingGallery';

interface MobileOrderTrackingSheetProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMedia?: (mediaList: any[], initialIndex?: number) => void;
  initialTab?: string;
  initialFilter?: string;
}

// Complete 16-Stage Furniture Manufacturing Workflow
export const ORDER_STAGES = [
  { id: 'order_placed', title: 'Order Placed', desc: 'Customer order has been received and logged in master atelier system' },
  { id: 'order_confirmed', title: 'Order Confirmed', desc: 'Order details, price, timber grade, and specifications confirmed' },
  { id: 'design_measurements', title: 'Design & Measurements', desc: 'Design, dimensions, blueprint, and customizations finalized' },
  { id: 'material_preparation', title: 'Material Preparation', desc: 'Wood, MDF, high-resilience foam, fabric, and materials arranged' },
  { id: 'frame_cutting', title: 'Frame Cutting & Preparation', desc: 'Solid wood frame components being cut, planed, and prepared' },
  { id: 'frame_assembly', title: 'Frame Assembly', desc: 'Heavy-duty mortise & tenon furniture carcass assembled' },
  { id: 'frame_inspection', title: 'Frame Inspection', desc: 'Frame structural integrity, joinery, and strength audited' },
  { id: 'foam_work', title: 'Foam Work', desc: 'Multi-density ergonomic foam cutting, fitting, and cushioning' },
  { id: 'fabric_cutting_stitching', title: 'Fabric Cutting & Stitching', desc: 'Premium upholstery fabric or leather precision cut and stitched' },
  { id: 'upholstery_work', title: 'Upholstery Work', desc: 'Fabric, leather, tufting, and webbing fitted onto furniture frame' },
  { id: 'polishing_finishing', title: 'Polishing & Finishing', desc: 'Multi-coat hand-rubbed Italian lacquer, staining, and deco polish' },
  { id: 'quality_inspection', title: 'Quality Inspection', desc: 'Rigorous 28-point final inspection, leveling, and finishing audit' },
  { id: 'ready_for_delivery', title: 'Ready for Delivery', desc: 'Protective padded wrapping and vehicle dispatch staging complete' },
  { id: 'dispatched', title: 'Dispatched', desc: 'Furniture has left the workshop/showroom transit center' },
  { id: 'out_for_delivery', title: 'Out for Delivery', desc: 'White-glove delivery van en route to customer destination' },
  { id: 'delivered', title: 'Delivered', desc: 'Furniture delivered, unpacked, placed, and handover completed' },
];

export const MobileOrderTrackingSheet: React.FC<MobileOrderTrackingSheetProps> = ({
  order,
  isOpen,
  onClose,
  initialTab,
  initialFilter,
}) => {
  const normalizeTab = (t?: string): 'timeline' | 'media' | 'details' | 'payments' => {
    if (!t) return 'timeline';
    const lower = t.toLowerCase();
    if (lower === 'stages' || lower === 'timeline' || lower === 'overview') return 'timeline';
    if (lower === 'media' || lower === 'crafting' || lower === 'photos' || lower === 'videos') return 'media';
    if (lower === 'specifications' || lower === 'details' || lower === 'specs' || lower === 'items') return 'details';
    if (lower === 'finance' || lower === 'payments' || lower === 'ledger') return 'payments';
    return 'timeline';
  };

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'media' | 'details' | 'payments'>(
    normalizeTab(initialTab)
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeTab(initialTab));
    }
  }, [initialTab]);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background page scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Fetch complete real-time order data including admin-uploaded media and timeline
  useEffect(() => {
    if (isOpen && order?.id) {
      setLoadingDetails(true);
      fetch(`/api/orders/${order.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setOrderDetails(data);
          }
        })
        .catch((err) => console.error('Failed to load order detail', err))
        .finally(() => setLoadingDetails(false));
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order || !mounted) return null;

  const currentOrder = orderDetails?.order || order;
  const currentMedia = orderDetails?.media || order.media || [];
  const currentPayments = orderDetails?.payments || order.payments || [];

  // Determine current active stage index based on order productionStage or status
  const rawStage = (currentOrder.productionStage || currentOrder.status || '').toLowerCase().replace(/[\s-]+/g, '_');
  let activeIndex = ORDER_STAGES.findIndex(
    (s) =>
      s.id === rawStage ||
      s.title.toLowerCase().replace(/[\s-]+/g, '_') === rawStage ||
      rawStage.includes(s.id)
  );
  if (activeIndex < 0) {
    if (rawStage.includes('deliver') && !rawStage.includes('out') && !rawStage.includes('ready')) activeIndex = 15;
    else if (rawStage.includes('out') && rawStage.includes('deliver')) activeIndex = 14;
    else if (rawStage.includes('dispatch')) activeIndex = 13;
    else if (rawStage.includes('ready')) activeIndex = 12;
    else if (rawStage.includes('inspect') || rawStage.includes('quality')) activeIndex = 11;
    else if (rawStage.includes('polish') || rawStage.includes('finish')) activeIndex = 10;
    else if (rawStage.includes('upholster')) activeIndex = 9;
    else if (rawStage.includes('stitch') || rawStage.includes('fabric')) activeIndex = 8;
    else if (rawStage.includes('foam')) activeIndex = 7;
    else if (rawStage.includes('frame') && rawStage.includes('inspect')) activeIndex = 6;
    else if (rawStage.includes('frame') && rawStage.includes('assembl')) activeIndex = 5;
    else if (rawStage.includes('frame') || rawStage.includes('cut')) activeIndex = 4;
    else if (rawStage.includes('material')) activeIndex = 3;
    else if (rawStage.includes('design') || rawStage.includes('measure')) activeIndex = 2;
    else if (rawStage.includes('confirm')) activeIndex = 1;
    else activeIndex = 0;
  }

  const progressPercent = Math.round(((activeIndex + 1) / ORDER_STAGES.length) * 100);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Near-Full-Screen Mobile & Centered Desktop Panel (100dvh minus system bar, zero empty black space) */}
      <div
        className="w-full h-[96dvh] sm:h-[88vh] sm:max-w-3xl bg-[#F7F5F0] dark:bg-[#131722] text-[#1C1A18] dark:text-[#F1F5F9] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border-t sm:border border-[#B99A68]/40 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar — Fixed at top of modal */}
        <div className="pt-3 pb-2 px-4 bg-white dark:bg-[#1a1e27] border-b border-[#EAE2D6] dark:border-white/10 shrink-0">
          <div className="w-12 h-1 bg-[#D8D0C5] dark:bg-white/20 rounded-full mx-auto mb-2.5" />
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#262421] text-[#E5CAA2]">
                  #{currentOrder.orderNumber || currentOrder.id?.slice(0, 8).toUpperCase()}
                </span>
                <Badge variant="gold" className="text-[10px] uppercase font-bold">
                  {currentOrder.status || 'Manufacturing'}
                </Badge>
                {loadingDetails && (
                  <RefreshCw className="w-3 h-3 text-[#B99A68] animate-spin" />
                )}
              </div>
              <h2 className="text-base font-serif font-bold text-[#1C1A18] dark:text-white mt-1 line-clamp-1">
                {currentOrder.productName || 'Artisan Custom Furniture Piece'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#F7F5F0] dark:bg-white/10 flex items-center justify-center text-[#5A554E] dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4 Navigation Tabs */}
          <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-[#F7F5F0] dark:border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'timeline'
                  ? 'bg-[#262421] dark:bg-[#B99A68] text-[#E5CAA2] dark:text-[#0B0D11] shadow-sm'
                  : 'bg-[#F7F5F0] dark:bg-white/5 text-[#5A554E] dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-white/10'
                }`}
            >
              Stages
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'media'
                  ? 'bg-[#262421] dark:bg-[#B99A68] text-[#E5CAA2] dark:text-[#0B0D11] shadow-sm'
                  : 'bg-[#F7F5F0] dark:bg-white/5 text-[#5A554E] dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-white/10'
                }`}
            >
              Media ({currentMedia.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'details'
                  ? 'bg-[#262421] dark:bg-[#B99A68] text-[#E5CAA2] dark:text-[#0B0D11] shadow-sm'
                  : 'bg-[#F7F5F0] dark:bg-white/5 text-[#5A554E] dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-white/10'
                }`}
            >
              Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'payments'
                  ? 'bg-[#262421] dark:bg-[#B99A68] text-[#E5CAA2] dark:text-[#0B0D11] shadow-sm'
                  : 'bg-[#F7F5F0] dark:bg-white/5 text-[#5A554E] dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-white/10'
                }`}
            >
              Finance ({currentPayments.length})
            </button>
          </div>
        </div>

        {/* Tab Content Canvas — Smooth Independent Scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 no-scrollbar pb-16">
          {/* TAB 1: 16-STAGE TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Progress Summary Card */}
              <div className="bg-white dark:bg-[#1a1e27] p-4 rounded-2xl border border-[#EAE2D6] dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#89847C] dark:text-slate-400">Production Progress</span>
                  <span className="text-sm font-extrabold text-[#B99A68] dark:text-[#E5CAA2]">{progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-[#F7F5F0] dark:bg-white/5 rounded-full h-2.5 overflow-hidden border border-[#EAE2D6] dark:border-white/10">
                  <div
                    className="bg-gradient-to-r from-[#262421] via-[#B99A68] to-[#262421] dark:from-[#B99A68] dark:to-[#E5CAA2] h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5A554E] dark:text-slate-400 mt-2">
                  <span>Current: <strong className="text-[#1C1A18] dark:text-white">{ORDER_STAGES[activeIndex]?.title}</strong></span>
                  <span>Est. Handover: <strong className="text-[#1C1A18] dark:text-white">{currentOrder.expectedCompletionDate || '14 Days'}</strong></span>
                </div>
              </div>

              {/* Exact 16-Stage Progress Tracker */}
              <div className="bg-white dark:bg-[#1a1e27] p-4 rounded-2xl border border-[#EAE2D6] dark:border-white/10 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] dark:text-white">16-Stage Master Production Roadmap</h3>
                <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE2D6] dark:before:bg-white/10">
                  {ORDER_STAGES.map((stage, idx) => {
                    const isDone = idx < activeIndex;
                    const isCurrent = idx === activeIndex;

                    return (
                      <div key={stage.id} className="relative flex items-start group">
                        {/* Status Icon */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${isDone
                              ? 'bg-[#262421] dark:bg-[#B99A68] text-[#B99A68] dark:text-[#0B0D11] ring-4 ring-white dark:ring-[#1a1e27]'
                              : isCurrent
                                ? 'bg-[#B99A68] text-[#0B0D11] font-bold ring-4 ring-[#B99A68]/30 animate-pulse'
                                : 'bg-white dark:bg-[#131722] border-2 border-[#EAE2D6] dark:border-white/20 text-[#89847C] dark:text-slate-500'
                            }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isCurrent ? (
                            <Sparkles className="w-3 h-3" />
                          ) : (
                            <span className="text-[9px]">{idx + 1}</span>
                          )}
                        </div>

                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold ${isCurrent
                                  ? 'text-[#B99A68] dark:text-[#E5CAA2] font-serif text-sm'
                                  : isDone
                                    ? 'text-[#1C1A18] dark:text-white'
                                    : 'text-[#89847C] dark:text-slate-400'
                                }`}
                            >
                              {stage.title}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 bg-[#B99A68]/20 text-[#B99A68] dark:text-[#E5CAA2] text-[9px] font-bold rounded uppercase">
                                Active Stage
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#5A554E] dark:text-slate-400 mt-0.5 leading-relaxed">{stage.desc}</p>

                          {/* Stage Media Quick-Link Badge */}
                          {(() => {
                            const stgMedia = currentMedia.filter((m: any) => {
                              const ms = (m.stage || '').toLowerCase().replace(/[\s-]+/g, '_');
                              const ss = stage.id.toLowerCase().replace(/[\s-]+/g, '_');
                              return ms === ss || ms.includes(ss) || ss.includes(ms);
                            });
                            if (stgMedia.length === 0) return null;
                            const vCount = stgMedia.filter((m: any) => m.mediaType === 'video' || m.mimeType?.startsWith('video')).length;
                            const pCount = stgMedia.length - vCount;
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStageFilter(stage.id);
                                  setActiveTab('media');
                                }}
                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#B99A68]/15 hover:bg-[#B99A68] hover:text-[#0B0D11] text-[#B99A68] dark:text-[#E5CAA2] text-[10px] font-bold border border-[#B99A68]/30 transition-all active:scale-95 shadow-sm cursor-pointer"
                              >
                                <Camera className="w-3 h-3" />
                                {pCount > 0 ? `${pCount} Photo${pCount > 1 ? 's' : ''}` : ''}
                                {vCount > 0 ? ` ${vCount} Video${vCount > 1 ? 's' : ''}` : ''}
                                <span className="underline ml-0.5">View in Gallery</span>
                              </button>
                            );
                          })()}

                          {isCurrent && currentOrder.specialInstructions && (
                            <div className="mt-2 p-2 bg-[#F7F5F0] dark:bg-white/5 rounded-xl border border-[#EAE2D6] dark:border-white/10 text-[11px] text-[#292722] dark:text-slate-200">
                              <p className="font-semibold text-[#1C1A18] dark:text-white">Supervisor Note:</p>
                              <p className="italic">"{currentOrder.specialInstructions}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKSHOP PHOTOS & VIDEOS (ORDER CRAFTING GALLERY) */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <OrderCraftingGallery
                orderId={currentOrder.id}
                order={currentOrder}
                items={orderDetails?.items || []}
                initialMedia={currentMedia}
                isAdmin={false}
                theme="light"
                initialMediaFilter={initialFilter === 'videos' ? 'videos' : initialFilter === 'photos' ? 'photos' : 'all'}
                selectedStageFilter={selectedStageFilter}
                onClearStageFilter={() => setSelectedStageFilter(null)}
              />
            </div>
          )}

          {/* TAB 3: SPECIFICATIONS & MULTI-ITEM BREAKDOWN */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Multi-Item Breakdown */}
              {orderDetails?.items && orderDetails.items.length > 0 ? (
                <div className="bg-white dark:bg-[#1a1e27] p-4 rounded-2xl border border-[#EAE2D6] dark:border-white/10 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] dark:text-white">
                      Commissioned Furniture Items ({orderDetails.items.length})
                    </h3>
                    <span className="text-[10px] text-[#B99A68] dark:text-[#E5CAA2] font-bold">Multi-Piece Order</span>
                  </div>

                  <div className="space-y-2.5">
                    {orderDetails.items.map((it: any, itIdx: number) => (
                      <div
                        key={it.id || itIdx}
                        className="p-3 bg-[#F7F5F0] dark:bg-white/5 rounded-xl border border-[#EAE2D6] dark:border-white/10 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#131722] border border-[#EAE2D6] dark:border-white/10 flex items-center justify-center text-[#B99A68] dark:text-[#E5CAA2] shrink-0 font-bold text-xs">
                              {itIdx + 1}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-[#1C1A18] dark:text-white block leading-tight">
                                {it.productTitle || it.title || 'Bespoke Piece'}
                              </span>
                              <span className="text-[10px] text-[#89847C] dark:text-slate-400 block mt-0.5">
                                SKU: {it.skuSnapshot || 'SF-CUSTOM'} • Qty: {it.quantity || 1} {it.unit || 'pcs'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-serif font-bold text-xs text-[#1C1A18] dark:text-white block">
                              ₨{(it.lineTotal || (it.unitPrice || 0) * (it.quantity || 1)).toLocaleString()}
                            </span>
                            {it.discount > 0 && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block">
                                -₨{it.discount.toLocaleString()} Off
                              </span>
                            )}
                          </div>
                        </div>

                        {(it.customDetails || it.specifications || it.customizationDetails) && (
                          <div className="p-2 bg-white dark:bg-[#131722] rounded-lg border border-[#EAE2D6] dark:border-white/10 text-[10px] text-[#5A554E] dark:text-slate-300 space-y-1">
                            {it.customDetails && <p>{it.customDetails}</p>}
                            {it.specifications && <p>{it.specifications}</p>}
                            {it.customizationDetails && <p>{it.customizationDetails}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Primary Piece Specifications */}
              <div className="bg-white dark:bg-[#1a1e27] p-4 rounded-2xl border border-[#EAE2D6] dark:border-white/10 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] dark:text-white">
                  Piece Specifications & Custom Notes
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#F7F5F0] dark:bg-white/5 rounded-xl border border-[#EAE2D6] dark:border-white/10">
                    <span className="text-[9px] text-[#89847C] dark:text-slate-400 uppercase font-bold block">Category</span>
                    <span className="font-semibold text-[#1C1A18] dark:text-white mt-0.5 block">{currentOrder.productCategory || 'Living Room Masterpiece'}</span>
                  </div>

                  <div className="p-2.5 bg-[#F7F5F0] dark:bg-white/5 rounded-xl border border-[#EAE2D6] dark:border-white/10">
                    <span className="text-[9px] text-[#89847C] dark:text-slate-400 uppercase font-bold block">Timber / Material</span>
                    <span className="font-semibold text-[#1C1A18] dark:text-white mt-0.5 block">{currentOrder.dimensions || 'Solid Sheesham Hardwood'}</span>
                  </div>

                  <div className="p-2.5 bg-[#F7F5F0] dark:bg-white/5 rounded-xl border border-[#EAE2D6] dark:border-white/10">
                    <span className="text-[9px] text-[#89847C] dark:text-slate-400 uppercase font-bold block">Upholstery & Fabric</span>
                    <span className="font-semibold text-[#1C1A18] dark:text-white mt-0.5 block">{currentOrder.fabricInfo || 'Imported Velvet / Leather'}</span>
                  </div>

                  <div className="p-2.5 bg-[#F7F5F0] dark:bg-white/5 rounded-xl border border-[#EAE2D6] dark:border-white/10">
                    <span className="text-[9px] text-[#89847C] dark:text-slate-400 uppercase font-bold block">Finish & Shade</span>
                    <span className="font-semibold text-[#1C1A18] dark:text-white mt-0.5 block">{currentOrder.colourInfo || 'Natural Walnut Italian Deco'}</span>
                  </div>
                </div>

                {currentOrder.customDesignDetails && (
                  <div className="p-3 bg-[#F7F5F0] dark:bg-white/5 rounded-xl border border-[#EAE2D6] dark:border-white/10">
                    <span className="text-[9px] text-[#89847C] dark:text-slate-400 uppercase font-bold block">Custom Blueprint Directives</span>
                    <p className="text-xs text-[#1C1A18] dark:text-slate-200 mt-1 leading-relaxed">{currentOrder.customDesignDetails}</p>
                  </div>
                )}
              </div>

              {/* Delivery & Logistics Details */}
              <div className="bg-white dark:bg-[#1a1e27] p-4 rounded-2xl border border-[#EAE2D6] dark:border-white/10 shadow-sm space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] dark:text-white">White-Glove Delivery Staging</h3>
                <div className="flex items-start gap-2.5 text-xs text-[#5A554E] dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-[#B99A68] dark:text-[#E5CAA2] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#1C1A18] dark:text-white block">Client Destination</span>
                    <span>{currentOrder.deliveryAddress || 'Showroom Collection Point'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCE & AUDITED PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#1a1e27] p-4 rounded-2xl border border-[#EAE2D6] dark:border-white/10 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] dark:text-white">Financial Statement</h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#F7F5F0] dark:border-white/5">
                    <span className="text-[#89847C] dark:text-slate-400">Order Subtotal</span>
                    <span className="font-semibold text-[#1C1A18] dark:text-white">₨{(currentOrder.subtotal || currentOrder.totalAmount || 0).toLocaleString()}</span>
                  </div>

                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between py-1 border-b border-[#F7F5F0] dark:border-white/5 text-emerald-600 dark:text-emerald-400">
                      <span>Promotional Privilege</span>
                      <span className="font-semibold">-₨{Number(currentOrder.discount).toLocaleString()}</span>
                    </div>
                  )}

                  {currentOrder.deliveryCharges > 0 && (
                    <div className="flex justify-between py-1 border-b border-[#F7F5F0] dark:border-white/5">
                      <span className="text-[#89847C] dark:text-slate-400">White-Glove Transit & Setup</span>
                      <span className="font-semibold text-[#1C1A18] dark:text-white">₨{Number(currentOrder.deliveryCharges).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5 font-bold text-sm text-[#1C1A18] dark:text-white border-b border-[#F7F5F0] dark:border-white/5">
                    <span className="font-serif">Grand Order Valuation</span>
                    <span className="font-serif text-[#B99A68] dark:text-[#E5CAA2]">₨{(currentOrder.totalAmount || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1 text-emerald-700 dark:text-emerald-400">
                    <span>Credited Advance / Payments</span>
                    <span className="font-bold">₨{(currentOrder.paidAmount || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-1.5 font-bold text-xs bg-[#F7F5F0] dark:bg-white/5 px-2.5 rounded-lg border border-[#EAE2D6] dark:border-white/10">
                    <span className="text-[#89847C] dark:text-slate-400 uppercase">Outstanding Balance</span>
                    <span
                      className={
                        currentOrder.remainingBalance > 0 ? 'text-amber-700 dark:text-amber-400 font-serif' : 'text-emerald-600 dark:text-emerald-400 font-serif'
                      }
                    >
                      {currentOrder.remainingBalance > 0
                        ? `₨${currentOrder.remainingBalance.toLocaleString()}`
                        : '₨0 (Fully Settled)'}
                    </span>
                  </div>
                </div>

                {/* Payments Table */}
                {currentPayments.length > 0 && (
                  <div className="pt-2 border-t border-[#F7F5F0] dark:border-white/5 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#89847C] dark:text-slate-400 block">
                      Receipt Transactions ({currentPayments.length})
                    </span>
                    {currentPayments.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-[#F7F5F0] dark:bg-white/5 rounded-xl border border-[#EAE2D6] dark:border-white/10 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#1C1A18] dark:text-white">{p.paymentNumber}</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                              Verified
                            </span>
                          </div>
                          <span className="text-[10px] text-[#89847C] dark:text-slate-400 block mt-0.5">
                            {p.paymentMethod} • {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-serif font-bold text-[#1C1A18] dark:text-white">
                          ₨{(p.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    className="w-full bg-[#262421] dark:bg-[#B99A68] text-[#E5CAA2] dark:text-[#0B0D11] hover:brightness-110 text-xs font-bold rounded-xl h-10 flex items-center justify-center gap-2 shadow-sm"
                    onClick={() =>
                      window.open(
                        `https://wa.me/923001234567?text=Payment%20inquiry%20for%20order%20${currentOrder.orderNumber}`,
                        '_blank'
                      )
                    }
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire About Order Payment</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal for full photo view */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-[10000] bg-black/90 flex flex-col items-center justify-center p-4">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto}
              alt="Workshop photo enlarged"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
