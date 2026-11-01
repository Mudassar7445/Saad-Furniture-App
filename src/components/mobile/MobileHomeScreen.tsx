'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  Search,
  Play,
  Phone,
  MessageCircle,
  ChevronRight,
  Heart,
  Star,
  Award,
  FileText,
  BookOpen,
  MapPin,
  Film,
  X,
  Wrench,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useShopSettings } from '@/lib/settings/useShopSettings';
import { WORKSHOP_CATEGORIES } from './MobileWorkshopScreen';

interface MobileHomeScreenProps {
  products: any[];
  currentUser?: any;
  onSelectCategory: (cat: string) => void;
  onOpenProductDetail: (product: any) => void;
  onAddToCart: (product: any) => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (productId: string) => void;
  onOpenTracking: (orderNumber?: string) => void;
  onOpenShop: () => void;
  onOpenDocuments?: () => void;
  onOpenWorkshop?: () => void;
}

let homeWorkshopCache: any[] | null = null;
let homeWorkshopCacheTime = 0;

export const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({
  products,
  currentUser,
  onSelectCategory,
  onOpenProductDetail,
  onAddToCart,
  wishlistIds,
  onToggleWishlist,
  onOpenTracking,
  onOpenShop,
  onOpenDocuments,
  onOpenWorkshop,
}) => {
  const { settings } = useShopSettings();
  const [quickOrderInput, setQuickOrderInput] = useState('');
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [selectedOrderIdx, setSelectedOrderIdx] = useState(0);
  const [workshopMediaList, setWorkshopMediaList] = useState<any[]>(homeWorkshopCache || []);
  const [selectedWorkshopCat, setSelectedWorkshopCat] = useState('all');
  const [loadingWorkshop, setLoadingWorkshop] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState<any | null>(null);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const [videoIsBuffering, setVideoIsBuffering] = useState(true);
  const [activePromo, setActivePromo] = useState<any | null>(null);

  // Fetch active promotional code dynamically configured by Admin
  useEffect(() => {
    fetch('/api/coupons?public=true')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.coupons && data.coupons.length > 0) {
          setActivePromo(data.coupons[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch active customer orders
  useEffect(() => {
    if (currentUser) {
      fetch('/api/orders')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.orders && Array.isArray(data.orders)) {
            setUserOrders(data.orders);
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  // Fetch lightweight workshop showcase metadata with in-memory caching
  useEffect(() => {
    const isCacheFresh = homeWorkshopCache && Date.now() - homeWorkshopCacheTime < 180000;
    if (isCacheFresh && homeWorkshopCache) {
      setWorkshopMediaList(homeWorkshopCache);
      return;
    }

    setLoadingWorkshop(true);
    const controller = new AbortController();
    fetch('/api/workshop', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { media: [] }))
      .then((data) => {
        const media = data.media || [];
        homeWorkshopCache = media;
        homeWorkshopCacheTime = Date.now();
        setWorkshopMediaList(media);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') console.warn('Workshop fetch warning:', e);
      })
      .finally(() => setLoadingWorkshop(false));

    return () => controller.abort();
  }, []);

  const categories = [
    { name: 'Sofas', icon: '🛋️', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
    { name: 'Double Beds', icon: '🛏️', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80' },
    { name: 'Single Beds', icon: '🛏️', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80' },
    { name: 'Wardrobes', icon: '🚪', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80' },
    { name: 'Center Tables', icon: '🪵', image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80' },
    { name: 'Mattresses', icon: '☁️', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80' },
    { name: 'Room Chairs', icon: '🪑', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80' },
    { name: 'Custom Furniture', icon: '✨', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80' },
  ];

  const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
    'Sofas': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    'Double Beds': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    'Single Beds': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
    'Wardrobes': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    'Center Tables': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
    'Mattresses': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    'Room Chairs': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    'Custom Furniture': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  };

  const featured = products.filter((p) => p.featured || p.isPublished).slice(0, 8);
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8);
  const bestSellers = [...products].reverse().slice(0, 8);

  const getPrimaryImage = (p: any) => {
    if (p.featuredImage && typeof p.featuredImage === 'string' && p.featuredImage.trim()) {
      return p.featuredImage;
    }
    try {
      const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
      if (imgs && imgs.length > 0 && imgs[0]) {
        return imgs[0];
      }
    } catch {}
    return (
      CATEGORY_DEFAULT_IMAGES[p.category] ||
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
    );
  };

  const activeOrders = userOrders.filter(
    (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  );
  const displayOrder = activeOrders[selectedOrderIdx] || activeOrders[0] || userOrders[0];

  return (
    <div className="space-y-6 pb-6">
      {/* 1. HERO PROMOTIONAL BANNER */}
      <div className="px-4 pt-2">
        <div className="relative rounded-3xl overflow-hidden bg-[#262421] text-[#F7F5F0] p-6 shadow-md border border-[#EAE2D6]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#262421] via-[#262421]/90 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80"
            alt="Hero Furniture"
            className="absolute right-0 top-0 bottom-0 w-3/5 object-cover object-center"
          />

          <div className="relative z-20 space-y-2 max-w-[200px]">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#B99A68] text-[#262421] text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 fill-current" /> Royal 2026
            </span>
            <h2 className="text-xl font-serif font-black leading-tight tracking-tight">
              Artisan Solid Wood Collection
            </h2>
            <p className="text-[11px] text-[#EAE2D6] leading-relaxed">
              Complimentary White-Glove Placement on orders over $3,000.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenShop}
                className="px-3.5 py-2 rounded-xl bg-[#B99A68] text-[#262421] text-xs font-bold shadow-md hover:bg-[#a68856] flex items-center gap-1.5 transition-colors"
              >
                <span>Shop Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ORDER TRACKING SECTION (PROMINENT TOP POSITION) */}
      <div className="px-4">
        <div className="rounded-3xl bg-[#262421] text-[#F7F5F0] p-4 sm:p-5 space-y-3.5 shadow-xl border border-[#B99A68]/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#B99A68]/20 text-[#B99A68] flex items-center justify-center shrink-0 border border-[#B99A68]/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  Live Order Milestone Tracker
                </h3>
                <span className="text-[10px] text-[#B99A68] font-medium block">
                  16-Stage Master Workshop Production Monitor
                </span>
              </div>
            </div>

            {displayOrder && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B99A68]/20 text-[#B99A68] border border-[#B99A68]/30">
                Active Commission
              </span>
            )}
          </div>

          {/* ACTIVE ORDER CARD IF AVAILABLE */}
          {displayOrder ? (
            <div className="p-3.5 rounded-2xl bg-[#191816] border border-white/5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Order ID</span>
                  <span className="font-mono font-bold text-white text-xs block">
                    #{displayOrder.orderNumber}
                  </span>
                  <p className="text-[11px] text-slate-300 font-semibold truncate max-w-[200px] mt-0.5">
                    {displayOrder.productName || 'Custom Furniture Suite'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block uppercase">Estimated Delivery</span>
                  <span className="text-xs font-bold text-[#B99A68] block">
                    {displayOrder.expectedCompletionDate || displayOrder.estimatedDeliveryDate || 'In Artisan Craft'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">
                    Stage: <strong className="text-white capitalize">{displayOrder.productionStage?.replace(/_/g, ' ') || 'Order Confirmed'}</strong>
                  </span>
                  <span className="font-mono font-bold text-[#B99A68]">
                    {displayOrder.productionProgress || 20}% Complete
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#8C734B] via-[#B99A68] to-[#E5CAA2] rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(10, displayOrder.productionProgress || 20)}%` }}
                  />
                </div>
              </div>

              {/* Multi-Order Switcher if user has multiple active orders */}
              {activeOrders.length > 1 && (
                <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                  <span className="text-[9px] text-slate-400 uppercase mr-1">Switch:</span>
                  {activeOrders.map((ord, idx) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setSelectedOrderIdx(idx)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono shrink-0 transition-colors ${
                        (selectedOrderIdx === idx || (!selectedOrderIdx && idx === 0))
                          ? 'bg-[#B99A68] text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 border border-white/5'
                      }`}
                    >
                      #{ord.orderNumber?.slice(-6) || idx + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Status: <strong className="text-emerald-400 capitalize">{displayOrder.orderStatus?.replace(/_/g, ' ')}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => onOpenTracking(displayOrder.orderNumber)}
                  className="px-3 py-1.5 rounded-xl bg-[#B99A68] hover:bg-[#a68856] text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                >
                  <span>Track Full Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Guest / Quick Search Box */
            <div className="space-y-2">
              <p className="text-[11px] text-[#EAE2D6] leading-relaxed">
                Enter your official Saad Furniture Order ID to view real-time woodworking, foam shaping, polishing, and white-glove delivery milestones.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickOrderInput}
                  onChange={(e) => setQuickOrderInput(e.target.value)}
                  placeholder="Order Number (e.g. SF-ONL-101)..."
                  className="flex-1 px-3 py-2 text-xs bg-[#191816] border border-[#B99A68]/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                />
                <button
                  type="button"
                  onClick={() => onOpenTracking(quickOrderInput.trim() || undefined)}
                  className="px-4 py-2 rounded-xl bg-[#B99A68] hover:bg-[#a68856] text-[#262421] text-xs font-black shadow-sm transition-colors flex items-center gap-1"
                >
                  <span>Track</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2B. DIGITAL CATALOGUES & PRICE LISTS PILL */}
      {onOpenDocuments && (
        <div className="px-4">
          <div
            onClick={onOpenDocuments}
            className="bg-gradient-to-r from-[#262421] to-[#38342f] text-white rounded-2xl p-3.5 flex items-center justify-between shadow-sm cursor-pointer border border-[#B99A68]/30 hover:border-[#B99A68] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#B99A68]/20 text-[#B99A68] flex items-center justify-center shrink-0 border border-[#B99A68]/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#B99A68] font-bold uppercase tracking-wider block">
                  Official 2026 Lookbook
                </span>
                <span className="text-xs font-bold text-white font-serif block">
                  Showroom Catalogues & Price Lists
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#B99A68]">
              <span>View</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* 3. SHOP BY CATEGORIES (HORIZONTAL SNAP CAROUSEL) */}
      <div className="space-y-2.5">
        <div className="px-4 flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-[#262421]">Shop by Category</h3>
          <button
            onClick={onOpenShop}
            className="text-xs text-[#B99A68] font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1 snap-x">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="flex-shrink-0 w-24 snap-start text-center group space-y-1.5"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden relative border border-[#EAE2D6] bg-[#FFFFFF] shadow-sm group-active:scale-95 transition-transform">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <span className="absolute bottom-1 right-1.5 text-sm">{cat.icon}</span>
              </div>
              <span className="text-[11px] font-bold text-[#262421] block leading-tight truncate">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3B. INSIDE OUR WORKSHOP SHOWCASE (SECTION 3) */}
      <div className="space-y-3 pt-1">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#262421]">Inside Our Workshop</h3>
            <span className="text-[10px] text-[#89847C] block leading-tight">
              Every piece is crafted with passion, precision, and attention to detail.
            </span>
          </div>
          {onOpenWorkshop && (
            <button
              onClick={onOpenWorkshop}
              className="text-xs text-[#B99A68] font-bold flex items-center gap-0.5 hover:underline shrink-0 ml-2"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-1">
          {WORKSHOP_CATEGORIES.slice(0, 8).map((cat) => {
            const isSelected = selectedWorkshopCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedWorkshopCat(cat.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#262421] text-[#F7F5F0] shadow-sm'
                    : 'bg-white border border-[#EAE2D6] text-[#89847C] hover:text-[#262421]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Featured Video Card or Empty State */}
        <div className="px-4">
          {workshopMediaList.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-[#EAE2D6] space-y-2">
              <Wrench className="w-8 h-8 mx-auto text-[#B99A68]/50" />
              <h4 className="text-xs font-bold text-[#262421]">Workshop Production Updates Coming Soon</h4>
              <p className="text-[11px] text-[#89847C]">
                Our artisans are currently crafting custom commissions in the studio. Live production footage will appear here.
              </p>
            </div>
          ) : (
            (() => {
              const filteredWorkshopItems = workshopMediaList.filter((m) => {
                if (selectedWorkshopCat === 'all') return true;
                return m.category === selectedWorkshopCat;
              });

              const feat =
                filteredWorkshopItems.find((m) => m.isFeatured && m.mediaType === 'video') ||
                filteredWorkshopItems.find((m) => m.mediaType === 'video') ||
                filteredWorkshopItems[0] ||
                workshopMediaList[0];

              if (!feat) return null;
              return (
                <div
                  onClick={() => {
                    setVideoPlaybackError(false);
                    setVideoIsBuffering(true);
                    setActiveVideoModal(feat);
                  }}
                  className="group relative rounded-2xl overflow-hidden aspect-video bg-black border border-[#EAE2D6] shadow-md cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <img
                    src={feat.thumbnailUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
                    alt={feat.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-between p-3.5">
                    <div className="self-end">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#B99A68] text-slate-950 uppercase tracking-wider shadow">
                        {feat.isFeatured ? 'Featured Atelier Tour' : feat.category?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#B99A68] text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {feat.title}
                      </h4>
                      <p className="text-[10px] text-[#EAE2D6] line-clamp-1 mt-0.5">
                        {feat.description || 'Watch our master artisans craft bespoke luxury furniture in-app.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* Additional Workshop Videos (if present) */}
        {(() => {
          const filteredWorkshopItems = workshopMediaList.filter((m) => {
            if (selectedWorkshopCat === 'all') return true;
            return m.category === selectedWorkshopCat;
          });
          const feat =
            filteredWorkshopItems.find((m) => m.isFeatured && m.mediaType === 'video') ||
            filteredWorkshopItems.find((m) => m.mediaType === 'video') ||
            filteredWorkshopItems[0];
          const otherVideos = filteredWorkshopItems.filter(
            (m) => m.mediaType === 'video' && m.id !== feat?.id
          );
          if (otherVideos.length === 0) return null;
          return (
            <div className="space-y-1.5 px-4 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B99A68] block">
                Additional Production Videos
              </span>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x">
                {otherVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => {
                      setVideoPlaybackError(false);
                      setVideoIsBuffering(true);
                      setActiveVideoModal(vid);
                    }}
                    className="flex-shrink-0 w-40 snap-start rounded-xl overflow-hidden bg-white border border-[#EAE2D6] shadow-sm cursor-pointer group active:scale-95 transition-transform"
                  >
                    <div className="relative aspect-video bg-[#1A1816] overflow-hidden">
                      <img
                        src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80'}
                        alt={vid.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-[#B99A68] text-slate-950 flex items-center justify-center shadow">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-2 space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-[#B99A68] font-bold block truncate">
                        {vid.category?.replace(/_/g, ' ')}
                      </span>
                      <h5 className="text-[11px] font-bold text-[#262421] line-clamp-1">
                        {vid.title}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Workshop Photo Gallery */}
        {(() => {
          const photos = workshopMediaList.filter((m) => m.mediaType === 'photo');
          if (photos.length === 0) return null;
          return (
            <div className="space-y-1.5 px-4 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#89847C] block">
                Workshop Photographic Gallery
              </span>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x">
                {photos.slice(0, 8).map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setActiveVideoModal(photo)}
                    className="flex-shrink-0 w-36 snap-start rounded-xl overflow-hidden bg-white border border-[#EAE2D6] shadow-sm cursor-pointer group active:scale-95 transition-transform"
                  >
                    <div className="relative aspect-video bg-[#1A1816] overflow-hidden">
                      <img
                        src={photo.thumbnailUrl || photo.url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80'}
                        alt={photo.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-2 space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-[#B99A68] font-bold block truncate">
                        {photo.category?.replace(/_/g, ' ')}
                      </span>
                      <h5 className="text-[11px] font-bold text-[#262421] line-clamp-1">
                        {photo.title}
                      </h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. LATEST CATALOG PIECES & NEW ARRIVALS (HORIZONTAL CAROUSEL) */}
      <div className="space-y-2.5">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#262421]">Latest Showroom Pieces</h3>
            <span className="text-[10px] text-[#89847C] block">Newly Added Handcrafted Suites ({products.length} Available)</span>
          </div>
          <button
            onClick={onOpenShop}
            className="text-xs text-[#B99A68] font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
          {newArrivals.map((prod) => {
            const price = prod.discountPrice || prod.price;
            const isWish = wishlistIds.has(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => onOpenProductDetail(prod)}
                className="flex-shrink-0 w-44 snap-start rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] overflow-hidden mobile-card-shadow flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="relative aspect-square bg-[#F7F5F0] overflow-hidden">
                  <img
                    src={getPrimaryImage(prod)}
                    alt={prod.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGES[prod.category] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(prod.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-[#262421]"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                  {prod.discountPrice && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-[#B99A68] text-[#262421] text-[9px] font-black">
                      SALE
                    </span>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#89847C] font-semibold block truncate">
                    {prod.category}
                  </span>
                  <h4 className="text-xs font-bold text-[#262421] line-clamp-1">{prod.title}</h4>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-xs font-serif font-black text-[#262421]">
                      ₨ {price?.toLocaleString()}
                    </span>
                    {prod.discountPrice && (
                      <span className="text-[10px] text-[#89847C] line-through">
                        ₨ {prod.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. BEST SELLERS CAROUSEL */}
      <div className="space-y-2.5">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#262421]">Most Coveted Suites</h3>
            <span className="text-[10px] text-[#89847C] block">Client Favorites & Showroom Icons</span>
          </div>
          <button
            onClick={onOpenShop}
            className="text-xs text-[#B99A68] font-bold flex items-center gap-0.5 hover:underline"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
          {bestSellers.map((prod) => {
            const price = prod.discountPrice || prod.price;
            const isWish = wishlistIds.has(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => onOpenProductDetail(prod)}
                className="flex-shrink-0 w-44 snap-start rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] overflow-hidden mobile-card-shadow flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="relative aspect-square bg-[#F7F5F0] overflow-hidden">
                  <img
                    src={getPrimaryImage(prod)}
                    alt={prod.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGES[prod.category] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(prod.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm text-[#262421]"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                <div className="p-3 space-y-1">
                  <div className="flex items-center text-[#B99A68] gap-0.5 text-[10px] font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    <span>5.0 (48 reviews)</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#262421] line-clamp-1">{prod.title}</h4>
                  <div className="text-xs font-serif font-black text-[#262421]">
                    ₨ {price?.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. SHOWROOM CONCIERGE BANNER */}
      <div className="px-4">
        <div className="bg-[#FFFFFF] border border-[#EAE2D6] rounded-3xl p-5 space-y-3 mobile-card-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#262421] text-[#B99A68] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#262421] truncate">
                {settings.displayName || settings.shopName || 'Saad Grand Flagship Showroom'}
              </h4>
              <span className="text-[10px] text-[#89847C] flex items-center gap-1 line-clamp-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#B99A68] shrink-0" />
                <span className="truncate">{settings.completeAddress || 'Sheikh-U-Pura Road Near Imtiaz Mega Mall, Faisalabad'}</span>
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#89847C] leading-relaxed">
            {settings.description ||
              'Experience our solid teak wood finishes, velvet swatches, and bespoke royal living room suites in person.'}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`tel:${(settings.primaryPhone || '+923007207445').replace(/\s+/g, '')}`}
              className="py-2.5 px-3 rounded-xl bg-[#262421] text-[#F7F5F0] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <Phone className="w-3.5 h-3.5 text-[#B99A68]" />
              <span className="truncate">Call: {settings.primaryPhone || '+92 300 7207445'}</span>
            </a>
            <a
              href={`https://wa.me/${(settings.whatsappNumber || '+923130207445').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#128C7E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
          {settings.openingHours && (
            <div className="text-[10px] text-[#89847C] flex items-center gap-1.5 pt-1 border-t border-[#EAE2D6]">
              <Clock className="w-3 h-3 text-[#B99A68]" />
              <span>Timings: {settings.openingHours}</span>
            </div>
          )}
        </div>
      </div>

      {/* In-App Workshop Video / Photo Modal */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4"
          onClick={() => {
            setActiveVideoModal(null);
            setVideoPlaybackError(false);
          }}
        >
          <div className="flex items-center justify-between z-10 text-white" onClick={(e) => e.stopPropagation()}>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#B99A68] font-bold block">
                Saad Master Workshop • Live Production
              </span>
              <h3 className="text-sm font-bold text-white truncate max-w-[260px]">
                {activeVideoModal.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveVideoModal(null);
                setVideoPlaybackError(false);
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {activeVideoModal.mediaType === 'video' ? (
              <div className="w-full max-w-md aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">
                {videoIsBuffering && !videoPlaybackError && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 pointer-events-none gap-2">
                    <div className="w-7 h-7 border-2 border-[#B99A68] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-[#EAE2D6] font-mono">Streaming Atelier HD...</span>
                  </div>
                )}

                {videoPlaybackError ? (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
                    <span className="text-xs text-[#EAE2D6]">Craftsmanship video is currently being prepared by the atelier.</span>
                    <button
                      type="button"
                      onClick={() => setVideoPlaybackError(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#B99A68] text-slate-950 text-xs font-bold hover:bg-[#a68856] transition-colors"
                    >
                      Retry Stream
                    </button>
                  </div>
                ) : (
                  <video
                    key={activeVideoModal.id}
                    src={`/api/workshop/videos/${activeVideoModal.id}/stream`}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    onWaiting={() => setVideoIsBuffering(true)}
                    onCanPlay={() => setVideoIsBuffering(false)}
                    onError={() => {
                      setVideoIsBuffering(false);
                      setVideoPlaybackError(true);
                    }}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="max-w-md max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={activeVideoModal.url || activeVideoModal.thumbnailUrl}
                  alt={activeVideoModal.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <div
            className="bg-slate-900/90 border border-white/10 p-3.5 rounded-2xl text-xs text-white space-y-1.5 max-w-md mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#B99A68] font-bold uppercase text-[10px] tracking-wider">
                Category: {activeVideoModal.category?.replace('_', ' ')}
              </span>
              {onOpenWorkshop && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveVideoModal(null);
                    onOpenWorkshop();
                  }}
                  className="text-[10px] text-[#B99A68] hover:underline font-bold"
                >
                  View Complete Atelier Gallery →
                </button>
              )}
            </div>
            {activeVideoModal.description && (
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {activeVideoModal.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

