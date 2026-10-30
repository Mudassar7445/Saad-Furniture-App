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
}

export const MobileNotificationsScreen: React.FC<MobileNotificationsScreenProps> = ({
  currentUser,
  onOpenAuth,
  onNavigateToOrders,
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
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EAE2D6]/50 flex items-center justify-center mb-4 text-[#B99A68]">
          <Bell className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#262421]">Patron Notifications</h2>
        <p className="text-xs text-[#89847C] mt-2 max-w-xs leading-relaxed">
          Sign in to receive instant manufacturing stage alerts, uploaded workshop media, and delivery notifications.
        </p>
        <Button
          onClick={onOpenAuth}
          className="mt-6 w-full max-w-xs bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-serif font-bold rounded-xl h-11"
        >
          Sign In
        </Button>
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
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#262421]">Notifications</h1>
          <p className="text-xs text-[#89847C]">
            {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-bold text-[#B99A68] hover:underline flex items-center gap-1"
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
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === chip.id
                ? 'bg-[#262421] text-[#B99A68] border-[#262421]'
                : 'bg-white text-[#89847C] border-[#EAE2D6]'
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
            <div key={i} className="h-20 bg-white rounded-2xl border border-[#EAE2D6] animate-pulse" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#EAE2D6] shadow-sm">
          <Bell className="w-10 h-10 mx-auto text-[#89847C] opacity-40 mb-2" />
          <p className="text-sm font-serif font-bold text-[#262421]">No notifications</p>
          <p className="text-xs text-[#89847C] mt-1">
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
                onClick={onNavigateToOrders}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex gap-3 items-start ${
                  n.isRead
                    ? 'bg-white border-[#EAE2D6]'
                    : 'bg-[#F7F5F0] border-[#B99A68]/50 shadow-sm'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isMedia
                      ? 'bg-purple-50 text-purple-600'
                      : isDelivery
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-[#262421] text-[#B99A68]'
                  }`}
                >
                  {isMedia ? (
                    <ImageIcon className="w-5 h-5" />
                  ) : isDelivery ? (
                    <Truck className="w-5 h-5" />
                  ) : (
                    <Package className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#262421] truncate">{n.title || 'Workshop Update'}</h4>
                    <span className="text-[10px] text-[#89847C] shrink-0">
                      {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#89847C] mt-0.5 line-clamp-2 leading-relaxed">
                    {n.message || n.content || 'Your bespoke furniture production has an update.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
