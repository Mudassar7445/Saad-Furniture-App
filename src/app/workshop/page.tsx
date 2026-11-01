'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Film } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { MobileWorkshopScreen } from '@/components/mobile/MobileWorkshopScreen';

export default function WorkshopPage() {
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

      {/* Mobile Top Navigation Return Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-[#F7F5F0]/95 backdrop-blur-md border-b border-[#EAE2D6] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-[#262421]">
          <ArrowLeft className="w-4 h-4 text-[#B99A68]" />
          <span>Showroom</span>
        </Link>
        <span className="font-serif font-bold text-xs text-[#B99A68] uppercase flex items-center gap-1">
          <Film className="w-3.5 h-3.5" /> Inside Our Workshop
        </span>
      </div>

      {/* Main Workshop Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <MobileWorkshopScreen />
      </main>
    </div>
  );
}

