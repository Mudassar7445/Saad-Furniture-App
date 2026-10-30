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
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#EAE2D6]/50 flex items-center justify-center mb-4 text-[#B99A68]">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#262421]">Patron Order Portfolio</h2>
        <p className="text-xs text-[#89847C] mt-2 max-w-xs leading-relaxed">
          Sign in to your private account to view real-time workshop tracking, progress videos, and verified invoices.
        </p>
        <Button
          onClick={onOpenAuth}
          className="mt-6 w-full max-w-xs bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-serif font-bold rounded-xl h-11"
        >
          Access Your Orders
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
      (o.productName || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Subtitle */}
      <div className="px-1 pt-1">
        <h1 className="text-xl font-serif font-bold text-[#262421]">My Orders & Commissions</h1>
        <p className="text-xs text-[#89847C]">Track bespoke manufacturing and white-glove delivery</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-white rounded-xl border border-[#EAE2D6] shadow-sm">
        {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
              filterTab === tab
                ? 'bg-[#262421] text-[#B99A68] shadow-sm'
                : 'text-[#89847C] hover:text-[#262421]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#89847C]" />
        <input
          type="text"
          placeholder="Search by order # or piece name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#EAE2D6] text-xs text-[#292722] placeholder:text-[#89847C] focus:outline-none focus:border-[#B99A68]"
        />
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-[#EAE2D6] animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-[#EAE2D6] shadow-sm">
          <Package className="w-10 h-10 mx-auto text-[#89847C] opacity-40 mb-2" />
          <p className="text-sm font-serif font-bold text-[#262421]">No orders found</p>
          <p className="text-xs text-[#89847C] mt-1 max-w-xs mx-auto">
            {filterTab !== 'all'
              ? `You currently do not have any ${filterTab} furniture orders.`
              : 'You haven’t commissioned any furniture pieces yet. Browse our handcrafted showroom masterpieces.'}
          </p>
          <Button
            onClick={onExploreShop}
            className="mt-4 bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white text-xs font-bold rounded-xl h-9 px-5"
          >
            Explore Showroom Catalog
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isDelivered = (order.status || '').toLowerCase().includes('delivered');
            const isCancelled = (order.status || '').toLowerCase().includes('cancel');

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white p-4 rounded-2xl border border-[#EAE2D6] shadow-sm hover:border-[#B99A68] transition-all cursor-pointer space-y-3"
              >
                {/* Header row: Order ID & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#262421] text-[#B99A68]">
                      #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#89847C]">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
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
                  <div className="w-16 h-16 rounded-xl bg-[#F7F5F0] overflow-hidden border border-[#EAE2D6] shrink-0">
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
                    <p className="text-[11px] text-[#89847C] truncate mt-0.5">
                      {order.productCategory || 'Custom Furniture'} • {order.woodType || 'Solid Sheesham'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-[#262421]">
                        ₨{(order.totalAmount || order.price || 0).toLocaleString()}
                      </span>
                      {order.remainingBalance > 0 && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          Bal: ₨{order.remainingBalance.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar and view button */}
                <div className="pt-2 border-t border-[#F7F5F0] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#B99A68] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>View 11-Stage Live Progress</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#89847C]" />
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
