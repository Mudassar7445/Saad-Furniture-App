'use client';

import React from 'react';
import { Home, ShoppingBag, Film, Clock, User } from 'lucide-react';

export type MobileTab = 'home' | 'shop' | 'workshop' | 'orders' | 'notifications' | 'profile' | 'documents';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  unreadNotificationsCount?: number;
  cartCount?: number;
}

const NAV_ITEMS = [
  { id: 'home' as MobileTab, label: 'Home', icon: Home },
  { id: 'shop' as MobileTab, label: 'Shop', icon: ShoppingBag, isCart: true },
  { id: 'workshop' as MobileTab, label: 'Workshop', icon: Film },
  { id: 'orders' as MobileTab, label: 'Orders', icon: Clock },
  { id: 'profile' as MobileTab, label: 'Profile', icon: User, isProfile: true },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadNotificationsCount = 0,
  cartCount = 0,
}) => {
  const handleTabClick = (tabId: MobileTab) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(6);
      } catch {}
    }

    if (activeTab === tabId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onChangeTab(tabId);
  };

  return (
    <nav
      role="navigation"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0B0D] border-t border-[#2D2D30] shadow-[0_-4px_24px_rgba(0,0,0,0.8)] md:hidden select-none box-border"
      style={{
        boxSizing: 'border-box',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        paddingBottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 12px))',
      }}
    >
      <div className="grid grid-cols-5 w-full max-w-md mx-auto items-center px-1 pt-2 pb-1">
        {NAV_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = tab.isCart ? cartCount : tab.isProfile ? unreadNotificationsCount : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className="w-full flex flex-col items-center justify-center py-1 relative touch-manipulation cursor-pointer group"
              aria-label={tab.label}
              aria-selected={isActive}
            >
              {/* Stationary Icon Container */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 stroke-[2] transition-colors duration-150 ${
                    isActive
                      ? 'text-[#D6B36A]'
                      : 'text-[#A5A5A5] group-hover:text-white'
                  }`}
                />

                {/* Badge */}
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-[#D6B36A] text-[#0B0B0D] text-[8px] font-black flex items-center justify-center border border-[#0B0B0D] shadow-xs pointer-events-none">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>

              {/* Text Label */}
              <span
                className={`text-[10.5px] tracking-tight mt-1 transition-colors duration-150 leading-tight block text-center truncate w-full px-0.5 ${
                  isActive
                    ? 'text-[#D6B36A] font-bold'
                    : 'text-[#A5A5A5] font-medium group-hover:text-white'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
