'use client';

import React, { memo } from 'react';
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

const MobileBottomNavComponent: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadNotificationsCount = 0,
  cartCount = 0,
}) => {
  const handleTabClick = (tabId: MobileTab) => {
    // Subtle haptic feedback
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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] dark:bg-[#131722] border-t border-[#EAE2D6] dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden select-none"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)',
        height: 'calc(60px + max(env(safe-area-inset-bottom, 8px), 8px))',
      }}
    >
      <div className="grid grid-cols-5 h-full w-full max-w-md mx-auto items-center">
        {NAV_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badgeCount = tab.isCart ? cartCount : tab.isProfile ? unreadNotificationsCount : 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className="w-full h-full flex flex-col items-center justify-center relative touch-manipulation cursor-pointer"
              aria-label={tab.label}
              aria-selected={isActive}
            >
              {/* Stationary Icon Container */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 stroke-[2] transition-colors duration-150 ${
                    isActive
                      ? 'text-[#B99A68] dark:text-[#B99A68]'
                      : 'text-[#89847C] dark:text-[#89847C]'
                  }`}
                />

                {/* Fixed Stationary Badge */}
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-0.5 rounded-full bg-[#B99A68] text-[#131722] text-[8px] font-black flex items-center justify-center border border-[#FFFFFF] dark:border-[#131722] shadow-xs pointer-events-none">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>

              {/* Stationary Text Label */}
              <span
                className={`text-[10px] tracking-tight mt-1 transition-colors duration-150 leading-none ${
                  isActive
                    ? 'text-[#B99A68] dark:text-[#B99A68] font-bold'
                    : 'text-[#89847C] dark:text-[#89847C] font-medium'
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

export const MobileBottomNav = memo(MobileBottomNavComponent);
