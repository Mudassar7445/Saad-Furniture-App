'use client';

import React from 'react';
import { Search, ShoppingBag, Heart, Bell } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-[#0B0B0D]/95 backdrop-blur-md border-b border-[#2D2D30] px-3.5 py-2.5 flex items-center justify-between md:hidden">
      {/* Brand & Greeting */}
      <div
        onClick={onOpenProfile}
        className="flex items-center gap-2 cursor-pointer group shrink-0"
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#D6B36A]/60 shadow-sm shrink-0 bg-[#171719] group-hover:scale-105 transition-transform p-0.5 flex items-center justify-center">
          <img
            src={settings.appIconUrl || '/assets/branding/app-dp.svg'}
            alt={settings.shopName}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[#C5C5C5] font-semibold block leading-tight">
            {firstName ? `Salam, ${firstName}` : 'Salam, Patron'}
          </span>
          <span className="font-serif tracking-wider text-xs font-bold text-white block leading-tight">
            SAAD{' '}
            <span className="text-[#D6B36A] font-serif font-black">
              FURNITURE
            </span>
          </span>
        </div>
      </div>

      {/* Action Icons: Notification (Bell), Search, Wishlist, Cart */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onSearchClick}
          className="p-1.5 rounded-full text-[#C5C5C5] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Search Catalogue"
        >
          <Search className="w-4 h-4 stroke-[2.2]" />
        </button>

        <button
          type="button"
          onClick={onOpenWishlist}
          className="relative p-1.5 rounded-full text-[#C5C5C5] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="My Wishlist"
        >
          <Heart className="w-4 h-4 stroke-[2.2]" />
          {wishlistCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center shadow-sm">
              {wishlistCount}
            </span>
          )}
        </button>

        {onOpenInbox && (
          <button
            type="button"
            onClick={onOpenInbox}
            className="relative p-1.5 rounded-full text-[#C5C5C5] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Notifications & Updates"
          >
            <Bell className="w-4 h-4 stroke-[2.2]" />
            {unreadInboxCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-[#D6B36A] text-[#0B0B0D] text-[8px] font-black flex items-center justify-center border border-[#0B0B0D] shadow-xs">
                {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCart}
          className="relative p-1.5 rounded-full bg-[#171719] border border-[#2D2D30] text-white hover:border-[#D6B36A] transition-colors shadow-sm ml-0.5 cursor-pointer"
          title="Cart"
        >
          <ShoppingBag className="w-3.5 h-3.5 stroke-[2.2] text-[#D6B36A]" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-3.5 px-0.5 rounded-full bg-[#D6B36A] text-[#0B0B0D] text-[8px] font-black flex items-center justify-center border border-[#0B0B0D] shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
