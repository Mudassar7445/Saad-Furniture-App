'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  Package,
  Image as ImageIcon,
  Truck,
  Sparkles,
  Info,
  Calendar,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface MobileNotificationsScreenProps {
  currentUser: any | null;
  onOpenAuth: () => void;
  onNavigateToOrders?: () => void;
  onUpdateUnreadCount?: (count: number) => void;
}

export const MobileNotificationsScreen: React.FC<MobileNotificationsScreenProps> = ({
  currentUser,
  onOpenAuth,
  onNavigateToOrders,
  onUpdateUnreadCount,
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'orders' | 'media' | 'delivery' | 'announcements'>('all');

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        setNotifications(list);

        // Automatically mark displayed notifications as read in the database
        const unreadList = list.filter((n: any) => !n.isRead);
        if (unreadList.length > 0) {
          try {
            await fetch('/api/notifications', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
            // Update local state and tell parent shell to remove unread badge immediately
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
            if (onUpdateUnreadCount) onUpdateUnreadCount(0);
          } catch (patchErr) {
            console.error('Failed to auto-mark notifications read', patchErr);
          }
        } else {
          if (onUpdateUnreadCount) onUpdateUnreadCount(0);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markSingleAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: 1 } : n))
      );
      const remainingUnread = notifications.filter((n) => n.id !== notificationId && !n.isRead).length;
      if (onUpdateUnreadCount) onUpdateUnreadCount(remainingUnread);
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      if (onUpdateUnreadCount) onUpdateUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read', err);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center select-none animate-fadeIn text-white">
        <div className="w-16 h-16 rounded-2xl bg-[#171719] text-[#D6B36A] flex items-center justify-center mb-4 shadow-inner border border-[#D6B36A]/40">
          <Bell className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-white">Patron Notification Hub</h2>
        <p className="text-xs text-[#A5A5A5] mt-2 max-w-xs leading-relaxed">
          Sign in to receive instant verified updates on your bespoke manufacturing progress, workshop videos, and receipts.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 w-full max-w-xs bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-serif font-black rounded-xl h-11 text-xs shadow-md active:scale-95 transition-all cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Filter by category
  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === 'all') return true;
    const cat = (n.category || n.type || '').toLowerCase();
    if (activeCategory === 'orders') return cat.includes('order') || cat.includes('stage');
    if (activeCategory === 'media') return cat.includes('photo') || cat.includes('video') || cat.includes('media');
    if (activeCategory === 'delivery') return cat.includes('delivery') || cat.includes('dispatch');
    if (activeCategory === 'announcements') return cat.includes('announce') || cat.includes('general');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4 pb-20 select-none animate-fadeIn text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#D6B36A] rounded-full inline-block" />
            <h1 className="text-xl font-serif font-bold text-white">Notifications</h1>
          </div>
          <p className="text-xs text-[#C5C5C5] pl-3 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-[#D6B36A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'orders', label: 'Orders & Stages' },
          { id: 'media', label: 'Photos & Videos' },
          { id: 'delivery', label: 'Deliveries' },
          { id: 'announcements', label: 'Announcements' },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setActiveCategory(chip.id as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeCategory === chip.id
                ? 'bg-[#D6B36A] text-[#0B0B0D] border-[#D6B36A] font-black'
                : 'bg-[#171719] text-[#C5C5C5] border-[#2D2D30] hover:text-white'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-[#222222] rounded-2xl border border-[#2D2D30] animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-8 text-center bg-[#222222] rounded-2xl border border-[#2D2D30] shadow-sm">
          <Bell className="w-10 h-10 mx-auto text-[#D6B36A] opacity-40 mb-2" />
          <p className="text-sm font-serif font-bold text-white">No notifications</p>
          <p className="text-xs text-[#A5A5A5] mt-1">
            You don't have any notifications in this section.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((n) => {
            const isMedia = (n.title || '').toLowerCase().includes('photo') || (n.title || '').toLowerCase().includes('video');
            const isDelivery = (n.title || '').toLowerCase().includes('delivery') || (n.title || '').toLowerCase().includes('dispatched');

            return (
              <div
                key={n.id}
                onClick={() => {
                  markSingleAsRead(n.id);
                  if (onNavigateToOrders) onNavigateToOrders();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start ${
                  n.isRead
                    ? 'bg-[#222222] border-[#2D2D30] hover:border-[#D6B36A]/40'
                    : 'bg-[#171719] border-[#D6B36A]/60 shadow-md ring-1 ring-[#D6B36A]/20'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isMedia
                      ? 'bg-purple-950/60 border border-purple-500/30 text-purple-300'
                      : isDelivery
                      ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                      : 'bg-[#171719] border border-[#D6B36A]/40 text-[#D6B36A]'
                  }`}
                >
                  {isMedia ? (
                    <ImageIcon className="w-4 h-4" />
                  ) : isDelivery ? (
                    <Truck className="w-4 h-4" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xs font-bold text-white line-clamp-1">{n.title}</h4>
                    <span className="text-[10px] text-[#A5A5A5] shrink-0 font-mono">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-[#C5C5C5] mt-0.5 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-[#A5A5A5] self-center shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
