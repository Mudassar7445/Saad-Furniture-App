'use client';

import React from 'react';
import { Home, ShoppingBag, Clock, User, Film } from 'lucide-react';

export type MobileTab = 'home' | 'shop' | 'workshop' | 'orders' | 'notifications' | 'profile' | 'documents';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  unreadNotificationsCount?: number;
  cartCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadNotificationsCount = 0,
  cartCount = 0,
}) => {
  const tabs = [
    { id: 'home' as MobileTab, label: 'Home', icon: Home },
    { id: 'shop' as MobileTab, label: 'Shop', icon: ShoppingBag, badge: cartCount },
    { id: 'workshop' as MobileTab, label: 'Workshop', icon: Film },
    { id: 'orders' as MobileTab, label: 'Orders', icon: Clock },
    { id: 'profile' as MobileTab, label: 'Profile', icon: User, badge: unreadNotificationsCount },
  ];

  const handleTabClick = (tabId: MobileTab) => {
    // Provide subtle haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }

    // If already on this tab, smoothly scroll to top without adding duplicate history
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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#131722]/95 backdrop-blur-xl border-t border-[#EAE2D6] dark:border-white/10 px-2 flex items-center justify-around shadow-[0_-8px_30px_rgba(38,36,33,0.08)] md:hidden transition-colors select-none"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 10px), 10px)',
        height: 'calc(62px + max(env(safe-area-inset-bottom, 10px), 10px))',
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className="flex-1 min-h-[48px] py-1 flex flex-col items-center justify-center relative touch-manipulation cursor-pointer active:scale-95 transition-transform duration-150"
            aria-label={tab.label}
            aria-selected={isActive}
          >
            {/* Active Pill Glow Indicator */}
            <div className="relative flex items-center justify-center">
              <div
                className={`relative px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? 'bg-[#262421] dark:bg-[#B99A68] text-[#F7F5F0] dark:text-[#131722] shadow-[0_2px_12px_rgba(185,154,104,0.3)]'
                    : 'text-[#89847C] hover:text-[#262421] dark:hover:text-[#F1F5F9]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.9]'
                  }`}
                />
              </div>

              {/* Luxury Badge (Cart count / Unread count) */}
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#B99A68] text-[#262421] text-[9px] font-black flex items-center justify-center border-2 border-[#FFFFFF] dark:border-[#131722] shadow-sm animate-pulse">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </div>

            {/* Tab Label */}
            <span
              className={`text-[10px] tracking-tight font-medium mt-0.5 transition-all duration-150 ${
                isActive
                  ? 'text-[#262421] dark:text-[#B99A68] font-bold scale-105'
                  : 'text-[#89847C] dark:text-[#94A3B8]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
