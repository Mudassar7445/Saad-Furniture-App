'use client';

import React from 'react';
import { Home, ShoppingBag, Clock, Bell, User } from 'lucide-react';

export type MobileTab = 'home' | 'shop' | 'orders' | 'notifications' | 'profile';

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
    { id: 'orders' as MobileTab, label: 'My Orders', icon: Clock },
    { id: 'notifications' as MobileTab, label: 'Inbox', icon: Bell, badge: unreadNotificationsCount },
    { id: 'profile' as MobileTab, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#EAE2D6] safe-nav-height px-3 flex items-center justify-around shadow-[0_-4px_25px_rgba(38,36,33,0.06)] md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate(10); } catch {}
              }
              onChangeTab(tab.id);
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 relative transition-all duration-200"
          >
            <div className="relative">
              <div
                className={`p-1.5 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-[#262421] text-[#F7F5F0]' : 'text-[#89847C] hover:text-[#262421]'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              {tab.badge && tab.badge > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#B99A68] text-[#262421] text-[9px] font-black flex items-center justify-center border border-[#FFFFFF] shadow-sm">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </div>
            <span
              className={`text-[10px] tracking-tight font-medium mt-0.5 transition-colors ${
                isActive ? 'text-[#262421] font-bold' : 'text-[#89847C]'
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
