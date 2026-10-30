'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Truck,
  Eye,
  ArrowRight,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  HardDrive,
  User,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AuthModal } from '@/components/auth/AuthModal';

export default function ShowroomHomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredCategory, setFilteredCategory] = useState<string>('All');
  const [quickTrackNumber, setQuickTrackNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch((e) => console.error(e));
  }, []);

  const handleQuickTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackNumber.trim()) return;
    setTrackingLoading(true);
    setTrackError(null);
    setTrackedOrder(null);

    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const found = data.orders?.find(
          (o: any) =>
            o.orderNumber.toLowerCase() === quickTrackNumber.trim().toLowerCase() ||
            o.customerPhone?.includes(quickTrackNumber.trim())
        );
        if (found) {
          setTrackedOrder(found);
        } else {
          setTrackError(`No order found matching "${quickTrackNumber}". Please verify your order number or contact concierge.`);
        }
      } else {
        // If not logged in, prompt user to log in to patron portal
        setShowAuthModal(true);
      }
    } catch {
      setTrackError('Tracking lookup temporarily unavailable. Please sign in to your patron account.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const categories = ['All', 'Living Room', 'Bedroom', 'Dining Room', 'Executive Office'];

  const displayedProducts =
    filteredCategory === 'All'
      ? products
      : products.filter((p) => p.category === filteredCategory);

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 selection:bg-[#c5a880]/30 selection:text-white flex flex-col">
      {/* Top Banner */}
      <div className="bg-[#121620] border-b border-[#c5a880]/20 py-2 px-4 text-center text-xs text-[#e5caa2] font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#c5a880]" />
        <span>Saad Furniture Private Exhibition: Handcrafted Bespoke Collection Now on Display.</span>
        <span className="hidden sm:inline text-slate-500">|</span>
        <span className="hidden sm:inline text-slate-400">White-Glove Delivery Worldwide</span>
      </div>

      {/* Main Luxury Navigation */}
      <header className="border-b border-white/5 bg-[#10131a]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5a880] to-[#9e7f53] flex items-center justify-center text-slate-950 font-serif font-bold text-xl shadow-lg shadow-[#c5a880]/20">
              S
            </div>
            <div>
              <span className="font-serif tracking-[0.25em] text-lg font-bold text-white block uppercase">
                SAAD <span className="text-[#c5a880]">FURNITURE</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">
                Master Woodcraft & Interior Architecture
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="text-xs"
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              Patron & Staff Portal
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => {
                const trackElem = document.getElementById('tracking-section');
                trackElem?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-bold"
            >
              Track Order
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#10131a] via-[#0b0d11] to-[#0b0d11]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#c5a880]/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <Badge variant="gold" className="px-4 py-1.5 text-xs uppercase tracking-widest">
            Bespoke Furniture Engineering & White-Glove Tracking
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
            Handcrafted Luxury Built For <br className="hidden sm:inline" />
            <span className="gold-gradient-text">Generations of Distinction.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-light">
            Saad Furniture merges timeless artisanal woodcraft with real-time digital transparency. From raw Honduran mahogany cutting to French polishing and white-glove arrival, follow your furniture's journey live.
          </p>

          {/* Quick Track Search Widget */}
          <div id="tracking-section" className="max-w-xl mx-auto pt-6">
            <form
              onSubmit={handleQuickTrack}
              className="p-2 rounded-2xl bg-[#141822] border border-[#c5a880]/30 shadow-2xl flex items-center gap-2"
            >
              <div className="pl-3 text-slate-500">
                <Search className="w-5 h-5 text-[#c5a880]" />
              </div>
              <input
                type="text"
                value={quickTrackNumber}
                onChange={(e) => setQuickTrackNumber(e.target.value)}
                placeholder="Enter Order # (e.g. SF-2026-101) or Patron Phone"
                className="w-full bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <Button variant="gold" size="md" type="submit" loading={trackingLoading}>
                Track Now
              </Button>
            </form>

            {trackError && (
              <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                {trackError}
              </div>
            )}

            {trackedOrder && (
              <div className="mt-4 p-5 rounded-2xl bg-[#171c27] border border-[#c5a880] text-left space-y-3 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#c5a880] uppercase tracking-wider block font-semibold">
                      Live Workshop Milestone
                    </span>
                    <h3 className="text-lg font-serif font-bold text-white">
                      Order {trackedOrder.orderNumber}
                    </h3>
                  </div>
                  <Badge variant="gold">
                    {trackedOrder.productionProgress}% Completed
                  </Badge>
                </div>
                <div className="text-xs text-slate-300">
                  Current Stage:{' '}
                  <strong className="text-white capitalize">
                    {trackedOrder.productionStage?.replace('_', ' ')}
                  </strong>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#c5a880] to-[#e5caa2] h-full rounded-full"
                    style={{ width: `${trackedOrder.productionProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Destination: {trackedOrder.deliveryAddress}</span>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-[#c5a880] font-semibold underline hover:text-white"
                  >
                    View Photos & Video Clips →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Switcher Prompt */}
          <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-3">
            <span>Direct Portal Sign In:</span>
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[#c5a880] underline font-medium hover:text-white"
            >
              👑 Super Admin
            </button>
            <span>•</span>
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[#c5a880] underline font-medium hover:text-white"
            >
              👤 VIP Patron
            </button>
            <span>•</span>
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[#c5a880] underline font-medium hover:text-white"
            >
              🛠️ Showroom Staff
            </button>
          </div>
        </div>
      </section>

      {/* 3 Pillars of Excellence */}
      <section className="py-12 border-y border-white/5 bg-[#0e1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#c5a880]/15 text-[#c5a880]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base">Centuries-Old Joinery</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Hand-cut mortise and tenon joinery using seasoned French oak, Honduran mahogany, and Burmese teak.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#c5a880]/15 text-[#c5a880]">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base">5TB Cloud Media Vault</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                High-definition photos and 4K artisan video updates captured at every milestone and securely archived on Google Drive Enterprise storage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#c5a880]/15 text-[#c5a880]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base">White-Glove Fleet</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dedicated climate-controlled private transport, white-glove uncrating, room-of-choice placement, and debris removal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom Furniture Catalogue */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#c5a880] uppercase tracking-widest block">
              Curated Masterpieces
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              Current Showroom Exhibition
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilteredCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filteredCategory === cat
                    ? 'bg-[#c5a880] text-slate-950 font-bold shadow-md'
                    : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProducts.map((prod) => {
            let imgs: string[] = [];
            try {
              imgs = JSON.parse(prod.images || '[]');
            } catch {
              imgs = [];
            }
            return (
              <div
                key={prod.id}
                className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:border-[#c5a880]/50 transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-black overflow-hidden">
                  <img
                    src={imgs[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="gold">{prod.category}</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant={prod.status === 'available' ? 'green' : 'neutral'}>
                      {prod.status === 'available' ? 'In Showroom' : 'Bespoke Order'}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider">{prod.sku}</span>
                    <h3 className="font-serif font-bold text-white text-lg mt-0.5 group-hover:text-[#c5a880] transition-colors">
                      {prod.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  <div className="text-xs space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-white/5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Material:</span>
                      <span className="text-white font-medium truncate max-w-[200px]">{prod.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dimensions:</span>
                      <span className="text-white font-medium">{prod.dimensions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Showroom Bay:</span>
                      <span className="text-[#c5a880] font-medium">{prod.showroomLocation}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block tracking-wider font-semibold">
                        Acquisition Price
                      </span>
                      <span className="text-xl font-serif font-bold text-white">
                        ${prod.price?.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => setShowAuthModal(true)}
                      className="text-xs"
                    >
                      Commission / Order
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0c10] py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c5a880] to-[#9e7f53] flex items-center justify-center text-slate-950 font-serif font-bold text-sm">
              S
            </div>
            <div>
              <span className="font-serif tracking-widest text-sm font-bold text-white uppercase block">
                SAAD FURNITURE
              </span>
              <span className="text-[10px]">Private Client Showroom & Atelier Works</span>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="text-slate-400">Saad Grand Showroom, 742 Prestige Avenue, Luxury Design District</p>
            <p>Direct Concierge: +1 (800) 555-SAAD | Email: concierge@saadfurniture.com</p>
            <p className="text-[10px] text-slate-600">
              © {new Date().getFullYear()} Saad Furniture. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Patron & Staff Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
