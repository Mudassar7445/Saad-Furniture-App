'use client';

import React, { useState, useEffect } from 'react';
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
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'media' | 'details' | 'payments'>('timeline');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  if (!isOpen || !order) return null;

  const currentOrder = orderDetails?.order || order;
  const currentMedia = orderDetails?.media || order.media || [];
  const currentPayments = orderDetails?.payments || order.payments || [];
  const currentTimeline = orderDetails?.timeline || [];

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

  const photos = currentMedia.filter(
    (m: any) => m.mediaType === 'photo' || m.mimeType?.startsWith('image')
  );
  const videos = currentMedia.filter(
    (m: any) => m.mediaType === 'video' || m.mimeType?.startsWith('video')
  );
  const documents = currentMedia.filter(
    (m: any) => m.mediaType === 'document' || m.mimeType?.includes('pdf') || m.mimeType?.includes('word')
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full bg-[#F7F5F0] rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-[#B99A68]/30"
        style={{ color: '#292722' }}
      >
        {/* Header Bar */}
        <div className="pt-3 pb-2 px-4 bg-white border-b border-[#EAE2D6] shrink-0">
          <div className="w-12 h-1 bg-[#EAE2D6] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#262421] text-[#B99A68]">
                  #{currentOrder.orderNumber || currentOrder.id?.slice(0, 8).toUpperCase()}
                </span>
                <Badge variant="gold" className="text-[10px] uppercase font-bold border-[#B99A68] text-[#B99A68]">
                  {currentOrder.status || 'Manufacturing'}
                </Badge>
                {loadingDetails && (
                  <RefreshCw className="w-3 h-3 text-[#B99A68] animate-spin" />
                )}
              </div>
              <h2 className="text-base font-serif font-bold text-[#262421] mt-1 line-clamp-1">
                {currentOrder.productName || 'Artisan Custom Furniture Piece'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F7F5F0] flex items-center justify-center text-[#89847C] hover:text-[#262421]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Navigation Tabs */}
          <div className="flex gap-1.5 mt-3 pt-2 border-t border-[#F7F5F0]">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'timeline'
                  ? 'bg-[#262421] text-[#B99A68] shadow-sm'
                  : 'bg-[#F7F5F0] text-[#89847C]'
              }`}
            >
              11 Stages
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'media'
                  ? 'bg-[#262421] text-[#B99A68] shadow-sm'
                  : 'bg-[#F7F5F0] text-[#89847C]'
              }`}
            >
              Media ({currentMedia.length})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'details'
                  ? 'bg-[#262421] text-[#B99A68] shadow-sm'
                  : 'bg-[#F7F5F0] text-[#89847C]'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'payments'
                  ? 'bg-[#262421] text-[#B99A68] shadow-sm'
                  : 'bg-[#F7F5F0] text-[#89847C]'
              }`}
            >
              Finance ({currentPayments.length})
            </button>
          </div>
        </div>

        {/* Tab Content Canvas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-10">
          {/* TAB 1: 11-STAGE TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Progress Summary Card */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#89847C]">Production Progress</span>
                  <span className="text-sm font-extrabold text-[#B99A68]">{progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-[#F7F5F0] rounded-full h-2.5 overflow-hidden border border-[#EAE2D6]">
                  <div
                    className="bg-gradient-to-r from-[#262421] via-[#B99A68] to-[#262421] h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#89847C] mt-2">
                  <span>Current: <strong className="text-[#262421]">{ORDER_STAGES[activeIndex]?.title}</strong></span>
                  <span>Est. Handover: <strong className="text-[#262421]">{currentOrder.expectedCompletionDate || '14 Days'}</strong></span>
                </div>
              </div>

              {/* Exact 16-Stage Progress Tracker */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">16-Stage Master Production Roadmap</h3>
                <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE2D6]">
                  {ORDER_STAGES.map((stage, idx) => {
                    const isDone = idx < activeIndex;
                    const isCurrent = idx === activeIndex;

                    return (
                      <div key={stage.id} className="relative flex items-start group">
                        {/* Status Icon */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                            isDone
                              ? 'bg-[#262421] text-[#B99A68] ring-4 ring-white'
                              : isCurrent
                              ? 'bg-[#B99A68] text-[#262421] font-bold ring-4 ring-[#B99A68]/30 animate-pulse'
                              : 'bg-white border-2 border-[#EAE2D6] text-[#89847C]'
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

                        <div className="ml-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-[#B99A68] font-serif text-sm'
                                  : isDone
                                  ? 'text-[#262421]'
                                  : 'text-[#89847C]'
                              }`}
                            >
                              {stage.title}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 bg-[#B99A68]/20 text-[#B99A68] text-[9px] font-bold rounded uppercase">
                                Active Stage
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#89847C] mt-0.5 leading-relaxed">{stage.desc}</p>

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
                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#B99A68]/15 hover:bg-[#B99A68] hover:text-[#262421] text-[#B99A68] text-[10px] font-bold border border-[#B99A68]/30 transition-all active:scale-95 shadow-sm"
                              >
                                <Camera className="w-3 h-3" />
                                {pCount > 0 ? `${pCount} Photo${pCount > 1 ? 's' : ''}` : ''}
                                {vCount > 0 ? ` ${vCount} Video${vCount > 1 ? 's' : ''}` : ''}
                                <span className="underline ml-0.5">View in Gallery</span>
                              </button>
                            );
                          })()}

                          {isCurrent && currentOrder.specialInstructions && (
                            <div className="mt-2 p-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-[11px] text-[#292722]">
                              <p className="font-semibold text-[#262421]">Supervisor Note:</p>
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

          {/* TAB 2: WORKSHOP PHOTOS & VIDEOS */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <OrderCraftingGallery
                orderId={currentOrder.id}
                order={currentOrder}
                items={orderDetails?.items || []}
                initialMedia={currentMedia}
                isAdmin={false}
                theme="light"
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
                <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">
                      Commissioned Furniture Items ({orderDetails.items.length})
                    </h3>
                    <span className="text-[10px] text-[#B99A68] font-bold">Multi-Piece Order</span>
                  </div>

                  <div className="space-y-2.5">
                    {orderDetails.items.map((it: any, itIdx: number) => (
                      <div
                        key={it.id || itIdx}
                        className="p-3 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-white border border-[#EAE2D6] flex items-center justify-center text-[#B99A68] shrink-0 font-bold text-xs">
                              {itIdx + 1}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-[#262421] block leading-tight">
                                {it.productTitle || it.title || 'Bespoke Piece'}
                              </span>
                              {it.skuSnapshot && (
                                <span className="text-[10px] text-[#89847C] font-mono block mt-0.5">
                                  SKU: {it.skuSnapshot}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-xs text-[#262421] font-serif block">
                              ₨{(it.lineTotal || it.totalPrice || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-[#89847C] block">
                              {it.quantity} {it.unit || 'pcs'} × ₨{(it.unitPrice || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {(it.customDetails || it.specifications || it.customizationDetails) && (
                          <div className="pt-2 border-t border-[#EAE2D6]/60 text-[11px] text-[#5c5852] space-y-0.5">
                            {it.customDetails && <p className="italic">{it.customDetails}</p>}
                            {it.specifications && <p>{it.specifications}</p>}
                            {it.customizationDetails && <p>{it.customizationDetails}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">
                    Piece Specifications & Custom Notes
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[#F7F5F0] rounded-xl">
                      <span className="text-[10px] text-[#89847C] uppercase font-bold block">Category</span>
                      <span className="font-semibold text-[#262421]">{currentOrder.productCategory || 'Living Room'}</span>
                    </div>
                    <div className="p-2.5 bg-[#F7F5F0] rounded-xl">
                      <span className="text-[10px] text-[#89847C] uppercase font-bold block">Timber / Wood</span>
                      <span className="font-semibold text-[#262421]">{currentOrder.woodType || 'Solid Seasoned Sheesham'}</span>
                    </div>
                    <div className="p-2.5 bg-[#F7F5F0] rounded-xl">
                      <span className="text-[10px] text-[#89847C] uppercase font-bold block">Fabric / Upholstery</span>
                      <span className="font-semibold text-[#262421]">{currentOrder.fabricDetails || currentOrder.colourInfo || 'Velvet Sand Beige'}</span>
                    </div>
                    <div className="p-2.5 bg-[#F7F5F0] rounded-xl">
                      <span className="text-[10px] text-[#89847C] uppercase font-bold block">Dimensions</span>
                      <span className="font-semibold text-[#262421]">{currentOrder.dimensions || 'Bespoke Sizing'}</span>
                    </div>
                  </div>

                  {currentOrder.specialInstructions && (
                    <div className="p-2.5 bg-[#F7F5F0] rounded-xl text-xs">
                      <span className="text-[10px] text-[#89847C] uppercase font-bold block">Custom Details & Notes</span>
                      <span className="text-[#262421]">{currentOrder.specialInstructions}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Details */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">Delivery & Logistics</h3>
                <div className="p-3 bg-[#F7F5F0] rounded-xl text-xs space-y-1.5 border border-[#EAE2D6]">
                  <div className="flex items-center gap-2 text-[#262421]">
                    <MapPin className="w-3.5 h-3.5 text-[#B99A68] shrink-0" />
                    <span className="font-medium">{currentOrder.deliveryAddress || 'Primary Residence Delivery'}</span>
                  </div>
                  {currentOrder.expectedCompletionDate && (
                    <div className="flex items-center gap-2 text-[#89847C] text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-[#B99A68] shrink-0" />
                      <span>Expected Completion Date: {currentOrder.expectedCompletionDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENTS & FINANCIAL SUMMARY */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">Order Financial Summary</h3>
                <div className="space-y-2 text-xs">
                  {currentOrder.subtotal !== undefined && currentOrder.subtotal !== null && (
                    <div className="flex justify-between py-1.5 border-b border-[#F7F5F0]">
                      <span className="text-[#89847C]">Order Subtotal</span>
                      <span className="font-medium text-[#262421] font-serif">
                        ₨{Number(currentOrder.subtotal).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {Number(currentOrder.discount) > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-[#F7F5F0] text-emerald-600">
                      <span>Order Discount</span>
                      <span className="font-medium font-serif">
                        -₨{Number(currentOrder.discount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {Number(currentOrder.deliveryCharges) > 0 && (
                    <div className="flex justify-between py-1.5 border-b border-[#F7F5F0]">
                      <span className="text-[#89847C]">Delivery Charges</span>
                      <span className="font-medium text-[#262421] font-serif">
                        +₨{Number(currentOrder.deliveryCharges).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-b border-[#F7F5F0]">
                    <span className="text-[#89847C] font-bold">Grand Total</span>
                    <span className="font-bold text-[#262421] font-serif text-sm">
                      ₨{(currentOrder.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#F7F5F0]">
                    <span className="text-[#89847C]">Total Paid (Advance)</span>
                    <span className="font-bold text-emerald-600 font-serif">
                      ₨{(currentOrder.paidAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="font-bold text-[#262421]">Remaining Balance</span>
                    <span
                      className={`font-bold font-serif ${
                        currentOrder.remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {currentOrder.remainingBalance > 0
                        ? `₨${currentOrder.remainingBalance.toLocaleString()}`
                        : '₨0 (Fully Paid)'}
                    </span>
                  </div>
                </div>

                {/* Payments Table */}
                {currentPayments.length > 0 && (
                  <div className="pt-2 border-t border-[#F7F5F0] space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#89847C] block">
                      Receipt Transactions ({currentPayments.length})
                    </span>
                    {currentPayments.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#262421]">{p.paymentNumber}</span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Verified
                            </span>
                          </div>
                          <span className="text-[10px] text-[#89847C] block mt-0.5">
                            {p.paymentMethod} • {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-serif font-bold text-[#262421]">
                          ₨{(p.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    className="w-full bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white text-xs font-bold rounded-xl h-10 flex items-center justify-center gap-2 shadow-sm"
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
          <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4">
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
};
