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
  DollarSign,
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
        <div className="w-16 h-16 rounded-2xl bg-[#262421] text-[#B99A68] flex items-center justify-center mb-4 shadow-inner border border-[#B99A68]/30">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#262421]">Patron Order Portfolio</h2>
        <p className="text-xs text-[#89847C] mt-2 max-w-xs leading-relaxed">
          Sign in to your private account to view real-time 11-stage workshop tracking, progress videos, and verified invoices.
        </p>
        <Button
          onClick={onOpenAuth}
          className="mt-6 w-full max-w-xs bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-serif font-bold rounded-xl h-11 text-xs shadow-md"
        >
          Sign In to Access Orders
        </Button>
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
    <div className="space-y-4 pb-20 select-none animate-fadeIn">
      {/* Header & Subtitle */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h1 className="text-xl font-serif font-bold text-[#262421]">My Orders & Commissions</h1>
          <p className="text-xs text-[#89847C]">Track bespoke manufacturing and white-glove delivery</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-xl bg-white border border-[#EAE2D6] text-[#89847C] hover:text-[#262421]"
          title="Refresh Orders"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-white rounded-2xl border border-[#EAE2D6] shadow-sm">
        {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all ${
              filterTab === tab
                ? 'bg-[#262421] text-[#B99A68] shadow-sm'
                : 'text-[#89847C] hover:text-[#262421]'
            }`}
          >
            {tab === 'all' ? `All (${orders.length})` : tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89847C]" />
        <input
          type="text"
          placeholder="Search by order #, piece name, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-[#EAE2D6] text-xs text-[#292722] placeholder:text-[#89847C] focus:outline-none focus:border-[#B99A68] shadow-sm"
        />
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-white rounded-3xl border border-[#EAE2D6] animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE2D6] shadow-sm space-y-3">
          <Package className="w-12 h-12 mx-auto text-[#89847C] opacity-30" />
          <p className="text-sm font-serif font-bold text-[#262421]">No orders found</p>
          <p className="text-xs text-[#89847C] max-w-xs mx-auto">
            {filterTab !== 'all'
              ? `You currently do not have any ${filterTab} furniture orders.`
              : 'You haven’t commissioned any furniture pieces yet. Browse our handcrafted showroom masterpieces.'}
          </p>
          <Button
            onClick={onExploreShop}
            className="bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white text-xs font-bold rounded-xl h-10 px-5 shadow-sm"
          >
            Explore Showroom Catalog
          </Button>
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
                className="bg-white p-4 rounded-3xl border border-[#EAE2D6] shadow-sm hover:border-[#B99A68] transition-all cursor-pointer space-y-3"
              >
                {/* Header row: Order ID, Type & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#262421] text-[#B99A68]">
                      #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] bg-[#F7F5F0] text-[#89847C] px-2 py-0.5 rounded-md font-semibold">
                      {orderTypeLabel}
                    </span>
                  </div>
                  <Badge
                    variant="gold"
                    className={`text-[10px] uppercase font-bold ${
                      isDelivered
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                        : isCancelled
                        ? 'border-red-500 text-red-600 bg-red-50'
                        : 'border-[#B99A68] text-[#B99A68] bg-[#F7F5F0]'
                    }`}
                  >
                    {order.status || 'Manufacturing'}
                  </Badge>
                </div>

                {/* Main Product Info */}
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#F7F5F0] overflow-hidden border border-[#EAE2D6] shrink-0">
                    <img
                      src={
                        order.productImageUrl ||
                        order.imageUrl ||
                        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={order.productName || 'Order'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-serif font-bold text-[#262421] truncate">
                      {order.productName || 'Artisanal Bespoke Order'}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-[#89847C] mt-0.5">
                      <span>{order.productCategory || 'Custom Furniture'}</span>
                      <span>•</span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Price, Paid, Balance Breakdown */}
                    <div className="grid grid-cols-3 gap-1 mt-2 text-center bg-[#F7F5F0] p-1.5 rounded-xl border border-[#EAE2D6]">
                      <div>
                        <span className="text-[8px] text-[#89847C] uppercase font-bold block">Total</span>
                        <span className="text-[11px] font-bold text-[#262421] font-serif">
                          ₨{(order.totalAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[#89847C] uppercase font-bold block">Paid</span>
                        <span className="text-[11px] font-bold text-emerald-700 font-serif">
                          ₨{(order.paidAmount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[#89847C] uppercase font-bold block">Balance</span>
                        <span
                          className={`text-[11px] font-bold font-serif ${
                            order.remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {order.remainingBalance > 0 ? `₨${order.remainingBalance.toLocaleString()}` : 'Paid'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with delivery date & view details button */}
                <div className="pt-2 border-t border-[#F7F5F0] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#89847C]">
                    <Calendar className="w-3.5 h-3.5 text-[#B99A68]" />
                    <span>
                      {order.expectedCompletionDate
                        ? `Est: ${order.expectedCompletionDate}`
                        : 'Workshop Active'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#B99A68]">
                    <span>View 11-Stage Progress</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tracking Modal Sheet */}
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
