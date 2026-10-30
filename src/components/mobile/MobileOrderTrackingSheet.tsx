'use client';

import React, { useState } from 'react';
import {
  X,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  FileText,
  MapPin,
  ExternalLink,
  Layers,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface MobileOrderTrackingSheetProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMedia?: (mediaList: any[], initialIndex?: number) => void;
}

const ORDER_STAGES = [
  { id: 'confirmed', title: 'Order Confirmed', desc: 'Order details and custom specifications validated' },
  { id: 'design', title: 'Design & Measurements', desc: 'Architectural cad drafting and room sizing verification' },
  { id: 'materials', title: 'Material Selection', desc: 'Seasoned solid wood and premium fabric reserved' },
  { id: 'manufacturing', title: 'Manufacturing Started', desc: 'Handcrafted master carpentry commenced in workshop' },
  { id: 'frame', title: 'Frame Preparation', desc: 'Heavy-duty joinery, re-inforcements & carcass assembly' },
  { id: 'foam_upholstery', title: 'Foam & Upholstery', desc: 'High-density memory foam shaping and luxury fabric stitching' },
  { id: 'polishing', title: 'Polishing & Finishing', desc: 'Multi-coat hand-rubbed Italian polish & protective seal' },
  { id: 'inspection', title: 'Quality Inspection', desc: 'Strict 28-point artisanal quality and durability audit' },
  { id: 'ready_delivery', title: 'Ready for Delivery', desc: 'Corner-guarded padded packing and vehicle dispatch staging' },
  { id: 'out_delivery', title: 'Out for Delivery', desc: 'Saad Furniture white-glove transport en route to your residence' },
  { id: 'delivered', title: 'Successfully Delivered', desc: 'Installed, leveled, and handover completed to patron satisfaction' },
];

export const MobileOrderTrackingSheet: React.FC<MobileOrderTrackingSheetProps> = ({
  order,
  isOpen,
  onClose,
  onOpenMedia,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'media' | 'details'>('timeline');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  // Determine stage index
  const currentStageIndex = ORDER_STAGES.findIndex(
    (s) => s.title.toLowerCase() === (order.status || '').toLowerCase()
  );
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 3; // Default to realistic stage
  const progressPercent = Math.round(((activeIndex + 1) / ORDER_STAGES.length) * 100);

  const photos = order.photos || order.media?.filter((m: any) => m.type === 'photo' || m.mimeType?.startsWith('image')) || [];
  const videos = order.videos || order.media?.filter((m: any) => m.type === 'video' || m.mimeType?.startsWith('video')) || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full bg-[#F7F5F0] rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-[#B99A68]/30"
        style={{ color: '#292722' }}
      >
        {/* Drag Handle & Header */}
        <div className="pt-3 pb-2 px-4 bg-white border-b border-[#EAE2D6] shrink-0">
          <div className="w-12 h-1 bg-[#EAE2D6] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#262421] text-[#B99A68]">
                  #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                </span>
                <Badge variant="gold" className="text-[10px] uppercase font-bold border-[#B99A68] text-[#B99A68]">
                  {order.status || 'Manufacturing'}
                </Badge>
              </div>
              <h2 className="text-base font-serif font-bold text-[#262421] mt-1 line-clamp-1">
                {order.productName || order.title || 'Artisan Custom Furniture'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F7F5F0] flex items-center justify-center text-[#89847C] hover:text-[#262421]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-2 mt-3 pt-2 border-t border-[#F7F5F0]">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'timeline'
                  ? 'bg-[#262421] text-[#B99A68]'
                  : 'bg-[#F7F5F0] text-[#89847C]'
              }`}
            >
              11-Stage Timeline
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'media'
                  ? 'bg-[#262421] text-[#B99A68]'
                  : 'bg-[#F7F5F0] text-[#89847C]'
              }`}
            >
              Media ({photos.length + videos.length})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'details'
                  ? 'bg-[#262421] text-[#B99A68]'
                  : 'bg-[#F7F5F0] text-[#89847C]'
              }`}
            >
              Order Details
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-10">
          {/* TAB 1: 11-STAGE TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Progress Summary Card */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#89847C]">Progress Status</span>
                  <span className="text-sm font-extrabold text-[#B99A68]">{progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-[#F7F5F0] rounded-full h-2.5 overflow-hidden border border-[#EAE2D6]">
                  <div
                    className="bg-gradient-to-r from-[#262421] via-[#B99A68] to-[#262421] h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#89847C] mt-2">
                  <span>Current Stage: <strong className="text-[#262421]">{ORDER_STAGES[activeIndex]?.title}</strong></span>
                  <span>Est. Completion: <strong className="text-[#262421]">{order.expectedCompletionDate || '14 Days'}</strong></span>
                </div>
              </div>

              {/* Vertical 11-Stage Timeline */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">Production Stages</h3>
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE2D6]">
                  {ORDER_STAGES.map((stage, idx) => {
                    const isDone = idx < activeIndex;
                    const isCurrent = idx === activeIndex;
                    const isPending = idx > activeIndex;

                    return (
                      <div key={stage.id} className="relative flex items-start group">
                        {/* Status Icon */}
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${
                            isDone
                              ? 'bg-[#262421] text-[#B99A68] ring-4 ring-white'
                              : isCurrent
                              ? 'bg-[#B99A68] text-white ring-4 ring-[#B99A68]/20 animate-pulse'
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
                              <span className="px-1.5 py-0.2 bg-[#B99A68]/15 text-[#B99A68] text-[9px] font-bold rounded uppercase">
                                In Progress
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#89847C] mt-0.5 leading-relaxed">{stage.desc}</p>
                          {isCurrent && order.statusDescription && (
                            <div className="mt-2 p-2 bg-[#F7F5F0] rounded-lg border border-[#EAE2D6] text-[11px] text-[#292722]">
                              <p className="font-semibold text-[#262421]">Master Craftsman Note:</p>
                              <p className="italic">"{order.statusDescription}"</p>
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

          {/* TAB 2: WORKSHOP PHOTOS & VIDEOS (GOOGLE DRIVE INTEGRATED) */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421] mb-1">
                  Workshop Production Media
                </h3>
                <p className="text-xs text-[#89847C] mb-3">
                  High-definition verified progress photos and video streams from Saad Furniture ateliers.
                </p>

                {photos.length === 0 && videos.length === 0 ? (
                  <div className="p-8 text-center bg-[#F7F5F0] rounded-xl border border-dashed border-[#EAE2D6]">
                    <ImageIcon className="w-8 h-8 mx-auto text-[#89847C] opacity-40 mb-2" />
                    <p className="text-xs font-bold text-[#262421]">No Media Uploaded Yet</p>
                    <p className="text-[11px] text-[#89847C] mt-1">
                      Our production supervisor updates this gallery as your order completes each craftsmanship phase.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {photos.map((photo: any, index: number) => {
                      const url = photo.url || photo.driveViewUrl || photo.thumbnailUrl || photo;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedPhoto(url)}
                          className="relative aspect-square rounded-xl overflow-hidden bg-[#262421] border border-[#EAE2D6] cursor-pointer group shadow-sm"
                        >
                          <img
                            src={url}
                            alt={`Progress photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] text-white font-medium flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-[#B99A68]" /> View Photo
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {videos.map((vid: any, index: number) => {
                      const url = vid.url || vid.driveViewUrl || vid;
                      return (
                        <div
                          key={`vid-${index}`}
                          className="relative aspect-square rounded-xl overflow-hidden bg-black border border-[#EAE2D6] flex items-center justify-center group"
                        >
                          <video
                            src={url}
                            className="w-full h-full object-cover opacity-80"
                            controls
                            playsInline
                          />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold flex items-center gap-1">
                            <Video className="w-2.5 h-2.5 text-[#B99A68]" /> HD Video
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETE SPECIFICATIONS & FINANCIALS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Product Specifications */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">Specifications</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#F7F5F0] rounded-xl">
                    <span className="text-[10px] text-[#89847C] uppercase font-bold block">Category</span>
                    <span className="font-semibold text-[#262421]">{order.productCategory || 'Living Room'}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F5F0] rounded-xl">
                    <span className="text-[10px] text-[#89847C] uppercase font-bold block">Wood / Timber</span>
                    <span className="font-semibold text-[#262421]">{order.woodType || 'Solid Sheesham'}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F5F0] rounded-xl">
                    <span className="text-[10px] text-[#89847C] uppercase font-bold block">Fabric & Color</span>
                    <span className="font-semibold text-[#262421]">{order.fabricDetails || order.color || 'Velvet Sand Beige'}</span>
                  </div>
                  <div className="p-2.5 bg-[#F7F5F0] rounded-xl">
                    <span className="text-[10px] text-[#89847C] uppercase font-bold block">Dimensions</span>
                    <span className="font-semibold text-[#262421]">{order.dimensions || 'Standard Luxury Sizing'}</span>
                  </div>
                </div>

                {order.specialInstructions && (
                  <div className="p-2.5 bg-[#F7F5F0] rounded-xl text-xs">
                    <span className="text-[10px] text-[#89847C] uppercase font-bold block">Special Instructions</span>
                    <span className="text-[#262421]">{order.specialInstructions}</span>
                  </div>
                )}
              </div>

              {/* Financial Ledger */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">Payment & Invoicing</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#F7F5F0]">
                    <span className="text-[#89847C]">Total Contract Value</span>
                    <span className="font-bold text-[#262421]">₨{(order.totalAmount || order.price || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F7F5F0]">
                    <span className="text-[#89847C]">Advance Paid</span>
                    <span className="font-bold text-emerald-600">₨{(order.advancePaid || order.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-[#262421]">Outstanding Balance</span>
                    <span className="font-bold text-amber-600">₨{(order.remainingBalance || (order.totalAmount || 0) - (order.advancePaid || 0)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs border-[#EAE2D6] text-[#262421] h-9 gap-1.5"
                    onClick={() => window.print()}
                  >
                    <FileText className="w-3.5 h-3.5 text-[#B99A68]" />
                    Invoice Receipt
                  </Button>
                  <Button
                    className="flex-1 text-xs bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white h-9 gap-1.5"
                    onClick={() => window.open(`https://wa.me/923000000000?text=Inquiry%20regarding%20Order%20${order.orderNumber}`, '_blank')}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Artisan Concierge
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
