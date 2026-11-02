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
    // Subtle haptic feedback on supported Android devices
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#131722] border-t border-[#EAE2D6] dark:border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.6)] md:hidden select-none box-border"
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
                      ? 'text-[#B99A68] dark:text-[#E5CAA2]'
                      : 'text-[#89847C] dark:text-[#94A3B8] group-hover:text-stone-900 dark:group-hover:text-white'
                  }`}
                />

                {/* Fixed Stationary Badge */}
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-3.5 px-1 rounded-full bg-[#B99A68] text-[#131722] text-[8px] font-black flex items-center justify-center border border-white dark:border-[#131722] shadow-xs pointer-events-none">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </div>

              {/* Stationary Text Label */}
              <span
                className={`text-[10.5px] tracking-tight mt-1 transition-colors duration-150 leading-tight block text-center truncate w-full px-0.5 ${
                  isActive
                    ? 'text-[#B99A68] dark:text-[#E5CAA2] font-bold'
                    : 'text-[#89847C] dark:text-[#94A3B8] font-medium group-hover:text-stone-900 dark:group-hover:text-white'
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
