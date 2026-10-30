'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Clock,
  Search,
  Play,
  Phone,
  ChevronRight,
  Heart,
  Star,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileHomeScreenProps {
  products: any[];
  onSelectCategory: (cat: string) => void;
  onOpenProductDetail: (product: any) => void;
  onAddToCart: (product: any) => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (productId: string) => void;
  onOpenTracking: () => void;
  onOpenShop: () => void;
}

export const MobileHomeScreen: React.FC<MobileHomeScreenProps> = ({
  products,
  onSelectCategory,
  onOpenProductDetail,
  onAddToCart,
  wishlistIds,
  onToggleWishlist,
  onOpenTracking,
  onOpenShop,
}) => {
  const [quickOrderInput, setQuickOrderInput] = useState('');

  const categories = [
    { name: 'Sofas', icon: '🛋️', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80' },
    { name: 'Double Beds', icon: '🛏️', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80' },
    { name: 'Single Beds', icon: '🛏️', image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=600&q=80' },
    { name: 'Wardrobes', icon: '🚪', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80' },
    { name: 'Center Tables', icon: '🪵', image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80' },
    { name: 'Mattresses', icon: '☁️', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80' },
    { name: 'Room Chairs', icon: '🪑', image: 'https://images.unsplash.com/photo-1580481077195-c22ae4b9868e?auto=format&fit=crop&w=600&q=80' },
    { name: 'Custom Furniture', icon: '✨', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80' },
  ];

  const featured = products.slice(0, 4);
  const bestSellers = products.slice(2, 6);
  const newArrivals = products.slice(1, 5);

  const getPrimaryImage = (p: any) => {
    try {
      const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
      return imgs[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
    } catch {
      return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
    }
  };

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

      {/* 2. PROMO CODE MINI CARD */}
      <div className="px-4">
        <div className="bg-[#FFFFFF] border border-[#EAE2D6] rounded-2xl p-3 flex items-center justify-between mobile-card-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAE2D6]/50 flex items-center justify-center text-[#B99A68]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#89847C] block font-semibold uppercase tracking-wider">
                Patron Welcome Gift
              </span>
              <span className="text-xs font-bold text-[#262421]">
                Use Code <strong className="text-[#B99A68] underline">SAAD10</strong> for 10% Off
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-[#F7F5F0] text-[#262421] font-bold border border-[#EAE2D6]">
            Active
          </span>
        </div>
      </div>

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
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
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

      {/* 4. FEATURED PRODUCTS (HORIZONTAL CAROUSEL) */}
      <div className="space-y-2.5">
        <div className="px-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#262421]">Featured Masterpieces</h3>
            <span className="text-[10px] text-[#89847C] block">Handcrafted by Master Artisans</span>
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
          {featured.map((prod) => {
            const price = prod.discountPrice || prod.price;
            const isWish = wishlistIds.has(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => onOpenProductDetail(prod)}
                className="flex-shrink-0 w-44 snap-start rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] overflow-hidden mobile-card-shadow flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="relative aspect-square bg-[#F7F5F0] overflow-hidden">
                  <img src={getPrimaryImage(prod)} alt={prod.title} className="w-full h-full object-cover" />
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
                      ${price?.toLocaleString()}
                    </span>
                    {prod.discountPrice && (
                      <span className="text-[10px] text-[#89847C] line-through">
                        ${prod.price?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. QUICK TRACK ORDER CARD */}
      <div className="px-4">
        <div className="rounded-3xl bg-[#262421] text-[#F7F5F0] p-5 space-y-3 shadow-md border border-[#B99A68]/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#B99A68]/20 text-[#B99A68] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#F7F5F0]">Track Your Order Progress</h4>
              <span className="text-[10px] text-[#EAE2D6]">Live 11-Stage Workshop Milestone Monitor</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={quickOrderInput}
              onChange={(e) => setQuickOrderInput(e.target.value)}
              placeholder="Order Number (e.g. SF-2026-101)..."
              className="flex-1 px-3 py-2 text-xs bg-[#191816] border border-[#B99A68]/40 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
            />
            <button
              type="button"
              onClick={onOpenTracking}
              className="px-3.5 py-2 rounded-xl bg-[#B99A68] text-[#262421] text-xs font-black shadow-sm"
            >
              Track
            </button>
          </div>
        </div>
      </div>

      {/* 6. BEST SELLERS CAROUSEL */}
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
                  <img src={getPrimaryImage(prod)} alt={prod.title} className="w-full h-full object-cover" />
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
                    ${price?.toLocaleString()}
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
            <div className="w-10 h-10 rounded-2xl bg-[#262421] text-[#B99A68] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#262421]">Saad Grand Flagship Showroom</h4>
              <span className="text-[10px] text-[#89847C]">742 Prestige Avenue, Luxury Design District</span>
            </div>
          </div>
          <p className="text-[11px] text-[#89847C] leading-relaxed">
            Experience our timber finishes, velvet swatches, and ergonomic suites in person. Private concierge consultations available daily.
          </p>
          <div className="flex gap-2 pt-1">
            <a
              href="tel:+18005557223"
              className="flex-1 py-2 rounded-xl bg-[#262421] text-[#F7F5F0] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Phone className="w-3.5 h-3.5 text-[#B99A68]" />
              <span>Call Concierge</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
