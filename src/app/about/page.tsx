'use client';

import React from 'react';
import Link from 'next/link';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Truck,
  Heart,
  Share2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useShopSettings } from '@/lib/settings/useShopSettings';
import { Header } from '@/components/layout/Header';

export default function AboutUsPage() {
  const { settings, loading } = useShopSettings();

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#292722] flex flex-col font-sans selection:bg-[#B99A68] selection:text-[#1c1a18]">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header
          onOpenAuth={() => {}}
          onOpenCart={() => {}}
          cartCount={0}
          wishlistCount={0}
        />
      </div>

      {/* Mobile Top Return Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-[#F7F5F0]/95 backdrop-blur-md border-b border-[#EAE2D6] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-[#262421]">
          <ArrowLeft className="w-4 h-4 text-[#B99A68]" />
          <span>Back to Showroom</span>
        </Link>
        <span className="font-serif font-bold text-xs text-[#B99A68] uppercase">
          About Saad Atelier
        </span>
      </div>

      {/* Hero Presentation */}
      <section className="relative bg-gradient-to-b from-[#262421] to-[#1c1a18] text-white py-16 px-4 md:px-8 border-b border-[#B99A68]/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#B99A68]/15 via-transparent to-transparent opacity-60" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-[#B99A68]/20 border border-[#B99A68]/40 p-3 shadow-2xl flex items-center justify-center">
            <img
              src={settings.appIconUrl || '/assets/branding/app-dp.svg'}
              alt={settings.shopName}
              className="w-full h-full object-contain drop-shadow"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#B99A68]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Architectural Woodcraft Atelier</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-white">
            {settings.shopName}
          </h1>

          <p className="text-sm md:text-base font-serif italic text-[#B99A68] max-w-xl mx-auto">
            "{settings.tagline}"
          </p>

          <p className="text-xs md:text-sm text-[#89847C] max-w-2xl mx-auto leading-relaxed">
            {settings.description}
          </p>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-10 space-y-10 w-full">
        {/* Atelier Craftsmanship Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-[#EAE2D6] shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#262421] text-[#B99A68] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-serif font-bold text-[#262421]">Seasoned Solid Timber</h3>
            <p className="text-xs text-[#89847C] leading-relaxed">
              Every log of Sheesham, Teak, and Burma timber is kiln-dried and seasoned for 180 days to eliminate warping and termite susceptibility.
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#EAE2D6] shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#262421] text-[#B99A68] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-serif font-bold text-[#262421]">Lifetime Structural Warranty</h3>
            <p className="text-xs text-[#89847C] leading-relaxed">
              {settings.warrantyInformation}
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-[#EAE2D6] shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#262421] text-[#B99A68] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-serif font-bold text-[#262421]">White-Glove Transport</h3>
            <p className="text-xs text-[#89847C] leading-relaxed">
              {settings.deliveryInformation}
            </p>
          </div>
        </section>

        {/* Showroom & Atelier Gallery */}
        <section className="bg-white p-6 rounded-3xl border border-[#EAE2D6] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-serif font-bold text-[#262421]">
                Workshop & Showroom Gallery
              </h2>
              <p className="text-xs text-[#89847C]">A glimpse inside our bespoke manufacturing process</p>
            </div>
            <Badge variant="gold" className="text-[10px] uppercase font-bold">
              Atelier Vault
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                title: 'Royal Master Bed Crafting',
                url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
              },
              {
                title: 'Solid Wood Hand Carving',
                url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=600&q=80',
              },
              {
                title: 'Luxury Velvet Upholstery',
                url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
              },
              {
                title: 'Master Polishing & Buffing',
                url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
              },
            ].map((img, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-2xl overflow-hidden bg-[#262421] group shadow-sm"
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[11px] font-medium text-white line-clamp-1">{img.title}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Location & Direct Contact Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-[#EAE2D6] shadow-sm space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#262421] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#B99A68]" />
              Physical Showroom Location
            </h3>
            <div className="space-y-2 text-xs">
              <p className="text-[#262421] font-semibold">{settings.displayName}</p>
              <p className="text-[#89847C] leading-relaxed">{settings.completeAddress}</p>
              <div className="pt-2 flex items-center gap-1.5 text-[#B99A68] font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{settings.openingHours}</span>
              </div>
            </div>

            <Button
              onClick={() =>
                window.open(
                  `https://maps.google.com/?q=${encodeURIComponent(settings.completeAddress)}`,
                  '_blank'
                )
              }
              className="w-full bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white text-xs font-bold rounded-xl h-10 flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Get Showroom Directions</span>
            </Button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#EAE2D6] shadow-sm space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#262421] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#B99A68]" />
              Patron Concierge & Direct Inquiries
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#F7F5F0]">
                <span className="text-[#89847C]">WhatsApp Hotline</span>
                <strong className="text-[#262421]">{settings.whatsappNumber}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F7F5F0]">
                <span className="text-[#89847C]">Showroom Desk</span>
                <strong className="text-[#262421]">{settings.primaryPhone}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F7F5F0]">
                <span className="text-[#89847C]">Official Email</span>
                <strong className="text-[#262421]">{settings.officialEmail}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#89847C]">Concierge Desk</span>
                <strong className="text-[#262421]">{settings.supportEmail}</strong>
              </div>
            </div>

            <Button
              onClick={() =>
                window.open(
                  `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=Salam,%20I%20would%20like%20to%20inquire%20about%20Saad%20Furniture%20masterpieces.`,
                  '_blank'
                )
              }
              className="w-full bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white text-xs font-bold rounded-xl h-10 flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Connect with Master Craftsman</span>
            </Button>
          </div>
        </section>

        {/* Social Media Channels */}
        <section className="bg-white p-6 rounded-3xl border border-[#EAE2D6] shadow-sm text-center space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">
            Follow Saad Furniture Online
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(settings.socialLinks || {}).map(([key, item]: any) => {
              if (!item || item.enabled === false || !item.url) return null;
              return (
                <a
                  key={key}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#F7F5F0] hover:bg-[#262421] hover:text-[#B99A68] text-xs font-bold text-[#262421] border border-[#EAE2D6] transition-colors capitalize flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{key}</span>
                </a>
              );
            })}
          </div>
        </section>

        {/* Footer Brand Seal */}
        <footer className="pt-6 border-t border-[#EAE2D6] text-center space-y-2">
          <p className="text-xs font-serif font-bold text-[#262421]">
            {settings.displayName} • Handcrafted Luxury Built For Generations
          </p>
          <p className="text-[11px] text-[#89847C]">
            Application Version 2.5 • Licensed Turso Cloud Architecture • &copy; {new Date().getFullYear()} {settings.shopName}. All Rights Reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
