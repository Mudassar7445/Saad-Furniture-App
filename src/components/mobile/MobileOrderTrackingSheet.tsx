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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface MobileOrderTrackingSheetProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMedia?: (mediaList: any[], initialIndex?: number) => void;
}

// Exactly 11 Stages from User Specification
const ORDER_STAGES = [
  { id: 'order_received', title: 'Order Received', desc: 'Bespoke custom order specifications logged into master production ledger' },
  { id: 'order_confirmed', title: 'Order Confirmed', desc: 'Dimensions, timber grade, and fabric selection verified with patron' },
  { id: 'design_measurements', title: 'Design / Measurements', desc: 'Architectural CAD drafting and scale verification by master craftsmen' },
  { id: 'material_selection', title: 'Material Selection', desc: 'Seasoned solid wood and premium upholstery textiles reserved' },
  { id: 'manufacturing_started', title: 'Manufacturing Started', desc: 'Rough milling, precision joinery, and structural frame carving initiated' },
  { id: 'manufacturing_in_progress', title: 'Manufacturing in Progress', desc: 'Heavy-duty joinery, re-inforcements & carcass assembly' },
  { id: 'finishing_polish', title: 'Finishing / Polish', desc: 'Multi-coat hand-rubbed Italian lacquer, staining, and protective seal' },
  { id: 'quality_inspection', title: 'Quality Inspection', desc: 'Strict 28-point artisanal quality, leveling, and durability audit' },
  { id: 'ready_for_delivery', title: 'Ready for Delivery', desc: 'Corner-guarded padded protective wrap and vehicle dispatch staging' },
  { id: 'dispatched', title: 'Dispatched', desc: 'Saad Furniture white-glove transport vehicle en route to your delivery address' },
  { id: 'delivered', title: 'Delivered', desc: 'Unpacked, positioned, leveled, and handover completed to patron satisfaction' },
];

export const MobileOrderTrackingSheet: React.FC<MobileOrderTrackingSheetProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'media' | 'details' | 'payments'>('timeline');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
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

  // Determine current active stage index based on order status
  const normalizedStatus = (currentOrder.status || '').toLowerCase().replace(/[\s_-]+/g, ' ');
  let activeIndex = ORDER_STAGES.findIndex(
    (s) =>
      s.title.toLowerCase() === normalizedStatus ||
      s.id.toLowerCase() === normalizedStatus ||
      normalizedStatus.includes(s.title.toLowerCase())
  );
  if (activeIndex < 0) {
    if (normalizedStatus.includes('deliver')) activeIndex = 10;
    else if (normalizedStatus.includes('dispatch')) activeIndex = 9;
    else if (normalizedStatus.includes('ready')) activeIndex = 8;
    else if (normalizedStatus.includes('inspect')) activeIndex = 7;
    else if (normalizedStatus.includes('finish') || normalizedStatus.includes('polish')) activeIndex = 6;
    else if (normalizedStatus.includes('progress')) activeIndex = 5;
    else if (normalizedStatus.includes('start')) activeIndex = 4;
    else if (normalizedStatus.includes('material')) activeIndex = 3;
    else if (normalizedStatus.includes('design')) activeIndex = 2;
    else if (normalizedStatus.includes('confirm')) activeIndex = 1;
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

              {/* Exact 11-Stage Progress Tracker */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">11-Stage Production Roadmap</h3>
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
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421] mb-1">
                  Workshop Media & Progress Proofs
                </h3>
                <p className="text-xs text-[#89847C] mb-3">
                  Admin-verified HD progress photographs, 4K carpentry videos, and architectural CAD blueprints.
                </p>

                {currentMedia.length === 0 ? (
                  <div className="p-8 text-center bg-[#F7F5F0] rounded-xl border border-dashed border-[#EAE2D6]">
                    <ImageIcon className="w-8 h-8 mx-auto text-[#89847C] opacity-40 mb-2" />
                    <p className="text-xs font-bold text-[#262421]">No Media Uploaded Yet</p>
                    <p className="text-[11px] text-[#89847C] mt-1">
                      Our master craftsman will upload photos and videos as your bespoke piece completes each stage.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Photos Grid */}
                    {photos.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-[#89847C] uppercase tracking-wider block mb-2">
                          HD Photographs ({photos.length})
                        </span>
                        <div className="grid grid-cols-2 gap-2.5">
                          {photos.map((photo: any, index: number) => {
                            const url = photo.thumbnailUrl || `/api/library/stream/${photo.id}` || photo.url;
                            return (
                              <div
                                key={photo.id || index}
                                onClick={() => setSelectedPhoto(url)}
                                className="relative aspect-square rounded-xl overflow-hidden bg-[#262421] border border-[#EAE2D6] cursor-pointer group shadow-sm"
                              >
                                <img
                                  src={url}
                                  alt={photo.name || `Photo ${index + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                  <span className="text-[10px] text-white font-medium flex items-center gap-1">
                                    <Eye className="w-3 h-3 text-[#B99A68]" /> View Photo
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {videos.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-[#89847C] uppercase tracking-wider block mb-2">
                          Craftsmanship Videos ({videos.length})
                        </span>
                        <div className="space-y-2">
                          {videos.map((vid: any, index: number) => (
                            <div
                              key={vid.id || index}
                              className="rounded-xl overflow-hidden bg-black border border-[#EAE2D6]"
                            >
                              <video
                                src={`/api/library/stream/${vid.id}`}
                                className="w-full max-h-48 object-cover"
                                controls
                                playsInline
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents & Blueprints */}
                    {documents.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-[#89847C] uppercase tracking-wider block mb-2">
                          Documents & CAD Blueprints ({documents.length})
                        </span>
                        <div className="space-y-2">
                          {documents.map((doc: any) => (
                            <div
                              key={doc.id}
                              className="p-3 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-[#B99A68]" />
                                <span className="font-bold text-[#262421] truncate max-w-[200px]">
                                  {doc.name || 'Order Blueprint'}
                                </span>
                              </div>
                              <a
                                href={`/api/library/stream/${doc.id}`}
                                download={doc.name}
                                className="p-1.5 rounded-lg bg-white border border-[#EAE2D6] text-[#B99A68]"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SPECIFICATIONS & DELIVERY */}
          {activeTab === 'details' && (
            <div className="space-y-4">
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
                  <div className="flex justify-between py-1.5 border-b border-[#F7F5F0]">
                    <span className="text-[#89847C]">Total Confirmed Price</span>
                    <span className="font-bold text-[#262421] font-serif">
                      ₨{(currentOrder.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#F7F5F0]">
                    <span className="text-[#89847C]">Total Paid to Date</span>
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
