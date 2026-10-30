'use client';

import React from 'react';
import { Search, ShoppingBag, Heart, Sparkles } from 'lucide-react';
import { useShopSettings } from '@/lib/settings/useShopSettings';

interface MobileTopBarProps {
  currentUser?: any;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onSearchClick: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  currentUser,
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onSearchClick,
}) => {
  const { settings } = useShopSettings();
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : null;

  return (
    <header className="sticky top-0 z-30 bg-[#F7F5F0]/95 backdrop-blur-md border-b border-[#EAE2D6] px-4 py-3 flex items-center justify-between md:hidden">
      {/* Brand & Greeting */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#B99A68]/40 shadow-sm shrink-0 bg-[#262421]">
          <img
            src={settings.appIconUrl || '/assets/branding/app-dp.svg'}
            alt={settings.shopName}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#89847C] font-semibold block leading-tight">
            {firstName ? `Salam, ${firstName}` : 'Saad Atelier'}
          </span>
          <span className="font-serif tracking-wider text-sm font-bold text-[#262421] block leading-tight">
            {settings.shopName.split(' ')[0]}{' '}
            <span className="text-[#B99A68]">
              {settings.shopName.split(' ').slice(1).join(' ') || 'FURNITURE'}
            </span>
          </span>
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onSearchClick}
          className="p-2 rounded-full text-[#262421] hover:bg-[#EAE2D6]/60 transition-colors"
          title="Search Catalogue"
        >
          <Search className="w-5 h-5 stroke-[2.2]" />
        </button>

        <button
          type="button"
          onClick={onOpenWishlist}
          className="relative p-2 rounded-full text-[#262421] hover:bg-[#EAE2D6]/60 transition-colors"
          title="My Wishlist"
        >
          <Heart className="w-5 h-5 stroke-[2.2]" />
          {wishlistCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
              {wishlistCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className="relative p-2 rounded-full bg-[#262421] text-[#F7F5F0] hover:bg-[#383531] transition-colors shadow-sm ml-0.5"
          title="Cart"
        >
          <ShoppingBag className="w-4 h-4 stroke-[2.2] text-[#B99A68]" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#B99A68] text-[#262421] text-[9px] font-black flex items-center justify-center border border-[#FFFFFF] shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

