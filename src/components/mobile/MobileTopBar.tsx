'use client';

import React from 'react';
import { Search, ShoppingBag, Heart, Sparkles, Film, Bell } from 'lucide-react';
import { useShopSettings } from '@/lib/settings/useShopSettings';

interface MobileTopBarProps {
  currentUser?: any;
  cartCount: number;
  wishlistCount: number;
  unreadInboxCount?: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onSearchClick: () => void;
  onOpenProfile?: () => void;
  onOpenWorkshop?: () => void;
  onOpenInbox?: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  currentUser,
  cartCount = 0,
  wishlistCount = 0,
  unreadInboxCount = 0,
  onOpenCart,
  onOpenWishlist,
  onSearchClick,
  onOpenProfile,
  onOpenWorkshop,
  onOpenInbox,
}) => {
  const { settings } = useShopSettings();
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : null;

  return (
    <header className="sticky top-0 z-30 bg-[#F7F5F0]/95 backdrop-blur-md border-b border-[#EAE2D6] px-3.5 py-2.5 flex items-center justify-between md:hidden">
      {/* Brand & Greeting */}
      <div
        onClick={onOpenProfile}
        className="flex items-center gap-2 cursor-pointer group shrink-0"
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#B99A68]/50 shadow-sm shrink-0 bg-[#1C1A18] group-hover:scale-105 transition-transform p-0.5 flex items-center justify-center">
          <img
            src={settings.appIconUrl || '/assets/branding/app-dp.svg'}
            alt={settings.shopName}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[#89847C] font-semibold block leading-tight">
            {firstName ? `Salam, ${firstName}` : 'Saad Atelier'}
          </span>
          <span className="font-serif tracking-wider text-xs font-bold text-[#262421] block leading-tight">
            {settings.shopName.split(' ')[0]}{' '}
            <span className="text-[#B99A68]">
              {settings.shopName.split(' ').slice(1).join(' ') || 'FURNITURE'}
            </span>
          </span>
        </div>
      </div>

      {/* Action Icons: Dedicated Workshop & Top Inbox Button */}
      <div className="flex items-center gap-1">
        {onOpenWorkshop && (
          <button
            type="button"
            onClick={onOpenWorkshop}
            className="px-2 py-1 rounded-full bg-[#B99A68]/15 border border-[#B99A68]/40 text-[#262421] text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
            title="Inside Our Workshop"
          >
            <Film className="w-3.5 h-3.5 text-[#B99A68]" />
            <span className="hidden sm:inline">Workshop</span>
          </button>
        )}

        {onOpenInbox && (
          <button
            type="button"
            onClick={onOpenInbox}
            className="relative p-2 rounded-full text-[#262421] hover:bg-[#EAE2D6]/60 transition-colors"
            title="Messages & Inbox"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            {unreadInboxCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#B99A68] text-[#262421] text-[8px] font-black flex items-center justify-center shadow-xs">
                {unreadInboxCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onSearchClick}
          className="p-1.5 rounded-full text-[#262421] hover:bg-[#EAE2D6]/60 transition-colors"
          title="Search Catalogue"
        >
          <Search className="w-4 h-4 stroke-[2.2]" />
        </button>

        <button
          type="button"
          onClick={onOpenWishlist}
          className="relative p-1.5 rounded-full text-[#262421] hover:bg-[#EAE2D6]/60 transition-colors"
          title="My Wishlist"
        >
          <Heart className="w-4 h-4 stroke-[2.2]" />
          {wishlistCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center shadow-sm">
              {wishlistCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className="relative p-1.5 rounded-full bg-[#262421] text-[#F7F5F0] hover:bg-[#383531] transition-colors shadow-sm ml-0.5"
          title="Cart"
        >
          <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2] text-[#B99A68]" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-0.5 rounded-full bg-[#B99A68] text-[#262421] text-[8px] font-black flex items-center justify-center border border-[#FFFFFF] shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

