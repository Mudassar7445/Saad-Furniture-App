'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Layers,
  FileText,
  Calendar,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MobileOrderTrackingSheet } from './MobileOrderTrackingSheet';

interface MobileOrdersScreenProps {
  currentUser: any | null;
  onOpenAuth: () => void;
  onExploreShop: () => void;
}

export const MobileOrdersScreen: React.FC<MobileOrdersScreenProps> = ({
  currentUser,
  onOpenAuth,
  onExploreShop,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load patron orders', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center select-none animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-[#171719] text-[#D6B36A] flex items-center justify-center mb-4 shadow-inner border border-[#D6B36A]/40">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-white">Patron Order Portfolio</h2>
        <p className="text-xs text-[#A5A5A5] mt-2 max-w-xs leading-relaxed">
          Sign in to your private account to view real-time 16-stage workshop tracking, progress videos, and verified invoices.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 w-full max-w-xs bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-serif font-black rounded-xl h-11 text-xs shadow-md active:scale-95 transition-all cursor-pointer"
        >
          Sign In to Access Orders
        </button>
      </div>
    );
  }

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    const status = (o.status || '').toLowerCase();
    const matchesTab =
      filterTab === 'all'
        ? true
        : filterTab === 'active'
        ? !status.includes('delivered') && !status.includes('cancel')
        : filterTab === 'completed'
        ? status.includes('delivered')
        : status.includes('cancel');

    const matchesSearch =
      searchQuery.trim() === '' ||
      (o.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.productCategory || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20 select-none animate-fadeIn text-white">
      {/* Header & Subtitle */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#D6B36A] rounded-full inline-block" />
            <h1 className="text-xl font-serif font-bold text-white">My Orders & Commissions</h1>
          </div>
          <p className="text-xs text-[#C5C5C5] pl-3 mt-0.5">Track bespoke manufacturing and white-glove delivery</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl bg-[#171719] border border-[#2D2D30] text-[#C5C5C5] hover:text-white cursor-pointer active:scale-95 transition-transform"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-[#171719] rounded-2xl border border-[#2D2D30] shadow-sm">
        {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
              filterTab === tab
                ? 'bg-[#D6B36A] text-[#0B0B0D] shadow-sm font-black'
                : 'text-[#A5A5A5] hover:text-white'
            }`}
          >
            {tab === 'all' ? `All (${orders.length})` : tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5A5A5]" />
        <input
          type="text"
          placeholder="Search by order #, piece name, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#171719] rounded-2xl border border-[#2D2D30] text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A] shadow-sm"
        />
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-[#222222] rounded-3xl border border-[#2D2D30] animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-8 text-center bg-[#222222] rounded-3xl border border-[#2D2D30] shadow-sm space-y-3">
          <Package className="w-12 h-12 mx-auto text-[#D6B36A] opacity-40" />
          <p className="text-sm font-serif font-bold text-white">No orders found</p>
          <p className="text-xs text-[#A5A5A5] max-w-xs mx-auto">
            {filterTab !== 'all'
              ? `You currently do not have any ${filterTab} furniture orders.`
              : 'You haven’t commissioned any furniture pieces yet. Browse our handcrafted showroom masterpieces.'}
          </p>
          <button
            onClick={onExploreShop}
            className="bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] text-xs font-black rounded-xl h-10 px-5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Explore Showroom Catalog
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const isDelivered = (order.status || '').toLowerCase().includes('delivered');
            const isCancelled = (order.status || '').toLowerCase().includes('cancel');
            const orderTypeLabel =
              order.orderType === 'online'
                ? 'Online Store'
                : order.orderType === 'custom'
                ? 'Custom Workshop'
                : 'Showroom Bespoke';

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-[#222222] p-4 rounded-3xl border border-[#2D2D30] shadow-md hover:border-[#D6B36A]/60 transition-all cursor-pointer space-y-3"
              >
                {/* Header row: Order ID, Type & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#171719] text-[#D6B36A] border border-[#2D2D30]">
                      #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#A5A5A5] uppercase tracking-wider font-semibold">
                      {orderTypeLabel}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      isDelivered
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : isCancelled
                        ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                        : 'bg-[#D6B36A]/20 border-[#D6B36A]/40 text-[#D6B36A]'
                    }`}
                  >
                    {order.status || 'In Production'}
                  </span>
                </div>

                {/* Main Piece Title & Details */}
                <div>
                  <h3 className="font-serif font-bold text-sm text-white line-clamp-1">
                    {order.productName || 'Bespoke Atelier Commission'}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-[#A5A5A5] mt-1">
                    {order.productCategory && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#D6B36A]" /> {order.productCategory}
                      </span>
                    )}
                    {order.woodType && (
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#D6B36A]" /> {order.woodType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar indication */}
                {!isCancelled && (
                  <div className="space-y-1.5 pt-1 border-t border-[#2D2D30]">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#C5C5C5] flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#D6B36A]" />
                        <strong className="text-white capitalize">
                          {order.productionStage?.replace(/_/g, ' ') || 'Wood Selection & Blueprint'}
                        </strong>
                      </span>
                      <span className="text-[10px] text-[#A5A5A5]">16-Stage Atelier Tracking</span>
                    </div>
                  </div>
                )}

                {/* Footer: Date, Price & View Tracking */}
                <div className="pt-2 border-t border-[#2D2D30] flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-[10px] text-[#A5A5A5] block">Total Contract</span>
                    <span className="font-serif font-black text-[#D6B36A] text-sm">
                      PKR {Number(order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-bold text-[#D6B36A] hover:underline"
                  >
                    <span>Track 16 Stages</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Order Detailed Tracking Sheet */}
      {selectedOrder && (
        <MobileOrderTrackingSheet
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
