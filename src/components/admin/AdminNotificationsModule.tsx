'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Smartphone,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Layers,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  url: string | null;
  targetUserId: string;
  category: string;
  status: 'pending' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  sentCount: number;
  failedCount: number;
  lastError: string | null;
  scheduledAt: string;
  processedAt: string | null;
  createdAt: string;
}

export function AdminNotificationsModule() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registeredDevices, setRegisteredDevices] = useState<number>(0);
  const [subscribedCustomers, setSubscribedCustomers] = useState<number>(0);
  const [events, setEvents] = useState<NotificationEvent[]>([]);

  // Filter
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Broadcast Form
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    category: 'announcements',
    targetUserId: 'all',
    url: '/',
  });

  const fetchNotificationData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setRegisteredDevices(data.registeredDevicesCount || 0);
        setSubscribedCustomers(data.subscribedCustomersCount || 0);
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load notification telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;

    setBroadcasting(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_announcement',
          ...broadcastForm,
        }),
      });

      if (res.ok) {
        setShowBroadcastModal(false);
        setBroadcastForm({
          title: '',
          message: '',
          category: 'announcements',
          targetUserId: 'all',
          url: '/',
        });
        await fetchNotificationData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to dispatch broadcast');
      }
    } catch (err: any) {
      alert(err.message || 'Error dispatching broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSendTestPush = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_test' }),
      });
      if (res.ok) {
        await fetchNotificationData();
        alert('Test notification queued. Subscribed devices will receive it in real-time.');
      } else {
        alert('Could not dispatch test alert.');
      }
    } catch (err: any) {
      alert(err.message || 'Error dispatching test alert');
    } finally {
      setTesting(false);
    }
  };

  const handleRetryEvent = async (eventId: string) => {
    setRetryingId(eventId);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry_event', eventId }),
      });
      if (res.ok) {
        await fetchNotificationData();
      }
    } catch (err) {
      console.error('Retry error:', err);
    } finally {
      setRetryingId(null);
    }
  };

  const handleProcessQueue = async () => {
    try {
      setRefreshing(true);
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_queue' }),
      });
      await fetchNotificationData();
    } catch (err) {
      console.error('Queue processing error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchQuery =
      evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || evt.type === filterType;
    const matchStatus = filterStatus === 'all' || evt.status === filterStatus;
    return matchQuery && matchType && matchStatus;
  });

  const totalDelivered = events.reduce((sum, e) => sum + (e.sentCount || 0), 0);
  const pendingEventsCount = events.filter((e) => e.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#B99A68]" />
            Client Communications & Push Notification System
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Web Push alerts to customer mobile devices with persistent Outbox queue, retry logic, and zero UI blocking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotificationData}
            disabled={refreshing}
            className="border-white/10 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestPush}
            disabled={testing}
            className="border-[#B99A68]/40 text-[#B99A68] hover:bg-[#B99A68]/10"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1.5" />
            {testing ? 'Sending...' : 'Send Test Alert'}
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => setShowBroadcastModal(true)}
            className="shadow-lg shadow-[#B99A68]/20"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Broadcast Announcement
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#141822] border border-white/5 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Registered Devices</span>
            <Smartphone className="w-4 h-4 text-[#B99A68]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-white">
            {registeredDevices}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Active browser & mobile push subscriptions
          </p>
        </div>

        <div className="bg-[#141822] border border-white/5 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Subscribed Patrons</span>
            <Users className="w-4 h-4 text-[#B99A68]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-white">
            {subscribedCustomers}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Distinct verified client accounts
          </p>
        </div>

        <div className="bg-[#141822] border border-white/5 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Dispatched Alerts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-white">
            {totalDelivered}
          </div>
          <p className="text-[10px] text-emerald-400/80 mt-1">
            Successfully delivered device pushes
          </p>
        </div>

        <div className="bg-[#141822] border border-white/5 rounded-2xl p-4.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Outbox Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-serif text-white flex items-center gap-2">
            <span>{pendingEventsCount}</span>
            {pendingEventsCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessQueue}
                className="text-[10px] py-0.5 px-2 h-6 border-amber-500/40 text-amber-400"
              >
                Flush Queue
              </Button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Automatic background processing
          </p>
        </div>
      </div>

      {/* Outbox & Dispatch History Table */}
      <div className="bg-[#141822] border border-white/5 rounded-2xl overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E1118] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter by Event Type"
              className="bg-[#0E1118] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#B99A68]"
            >
              <option value="all">All Types</option>
              <option value="announcement">Announcements</option>
              <option value="new_product">New Products</option>
              <option value="product_update">Product Updates</option>
              <option value="workshop_update">Workshop Updates</option>
              <option value="order_status">Order Status</option>
              <option value="order_media">Crafting Media</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by Dispatch Status"
              className="bg-[#0E1118] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-[#B99A68]"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#B99A68]" />
            Loading notifications telemetry...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No notification events recorded in the outbox yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Title & Message</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sent / Failed</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredEvents.map((evt) => {
                  const isCompleted = evt.status === 'completed';
                  const isPending = evt.status === 'pending';
                  const isFailed = evt.status === 'failed';

                  return (
                    <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="neutral"
                          className={`text-[10px] font-mono capitalize ${
                            evt.type === 'announcement'
                              ? 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10'
                              : evt.type === 'new_product' || evt.type === 'product_update'
                              ? 'border-[#B99A68]/30 text-[#B99A68] bg-[#B99A68]/10'
                              : evt.type === 'workshop_update'
                              ? 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                              : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'
                          }`}
                        >
                          {evt.type.replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-white line-clamp-1">{evt.title}</div>
                        <div className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{evt.message}</div>
                        {evt.lastError && (
                          <div className="text-rose-400 text-[10px] mt-1 line-clamp-1">
                            Error: {evt.lastError}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-300 text-[11px]">
                        {evt.targetUserId === 'all' ? (
                          <div>
                            <span className="text-emerald-400 font-medium block">All Patrons</span>
                            <span className="text-[10px] text-slate-400">Broadcast</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-white block">{(evt as any).customerName || 'Patron Account'}</span>
                            <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[180px]">
                              {(evt as any).customerEmail || (evt as any).customerPhone || evt.targetUserId}
                            </span>
                            <span className="text-[9px] text-[#B99A68] block mt-0.5">
                              {(evt as any).activeDevicesCount ?? 0} active device{((evt as any).activeDevicesCount === 1 ? '' : 's')}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/20">
                            <AlertTriangle className="w-3 h-3" />
                            Failed ({evt.attempts}/{evt.maxAttempts})
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                        <span className="text-emerald-400 font-medium">{evt.sentCount || 0}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-rose-400">{evt.failedCount || 0}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {evt.createdAt ? new Date(evt.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : '-'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        {(isFailed || isPending) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryEvent(evt.id)}
                            disabled={retryingId === evt.id}
                            className="text-[10px] h-6 px-2 border-white/10 hover:border-[#B99A68] hover:text-[#B99A68]"
                          >
                            <RotateCcw className={`w-3 h-3 mr-1 ${retryingId === evt.id ? 'animate-spin' : ''}`} />
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      <Modal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        title="Broadcast Announcement to Patrons"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4">
          <p className="text-xs text-slate-400">
            Send an instant push notification to all subscribed customer devices. The alert will be delivered even if the application is closed or running in background.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notification Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Exclusive Private Viewing: Royal Dining Collection"
              value={broadcastForm.title}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              className="w-full bg-[#0E1118] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Notification Message
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Discover our newest handcrafted solid Burma Teak dining sets now featured in our Lahore atelier showroom."
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              className="w-full bg-[#0E1118] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={broadcastForm.category}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, category: e.target.value })}
                className="w-full bg-[#0E1118] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#B99A68]"
              >
                <option value="announcements">Showroom Announcements</option>
                <option value="products">Products & Offers</option>
                <option value="workshop">Workshop Updates</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Destination URL
              </label>
              <input
                type="text"
                value={broadcastForm.url}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, url: e.target.value })}
                placeholder="/"
                className="w-full bg-[#0E1118] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBroadcastModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              disabled={broadcasting}
            >
              {broadcasting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Dispatch Push Alert
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

