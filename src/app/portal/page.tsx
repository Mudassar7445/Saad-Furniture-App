'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Calendar,
  Truck,
  Image as ImageIcon,
  Play,
  FileText,
  Bell,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Phone,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function CustomerPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'payments' | 'media' | 'products'>('active');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Showroom Catalogue & Inquiries
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductForInquiry, setSelectedProductForInquiry] = useState<any>(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  useEffect(() => {
    fetchCustomerDashboard();
  }, []);

  const fetchCustomerDashboard = async () => {
    try {
      setLoading(true);
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authRes.ok || !authData.user) {
        router.push('/');
        return;
      }

      if (authData.user.role !== 'customer') {
        if (authData.user.role === 'super_admin') {
          router.push('/admin');
          return;
        } else if (authData.user.role === 'staff') {
          router.push('/staff');
          return;
        }
      }

      // Fetch customer complete details
      const custRes = await fetch(`/api/customers/${authData.user.id}`);
      const custData = await custRes.json();

      setCustomerData(custData.customer);
      setMetrics(custData.metrics);
      setOrders(custData.orders || []);
      setPayments(custData.payments || []);

      if (custData.orders && custData.orders.length > 0) {
        // Find active order or default to first
        const active = custData.orders.find(
          (o: any) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
        ) || custData.orders[0];
        setSelectedOrder(active);
        loadOrderFullDetails(active.id);
      }

      // Fetch customer notifications
      const notifRes = await fetch('/api/notifications');
      const notifData = await notifRes.json();
      setNotifications(notifData.notifications || []);
    } catch (err) {
      console.error('Portal load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderFullDetails = async (orderId: string) => {
    try {
      setLoadingOrderDetails(true);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      setSelectedOrderDetails(data);
    } catch (e) {
      console.error('Failed to load order details:', e);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    loadOrderFullDetails(order.id);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProductsList(data.products || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;
    try {
      setInquirySubmitting(true);
      const res = await fetch('/api/products/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductForInquiry?.id || null,
          productTitle: selectedProductForInquiry?.name || 'Bespoke Custom Furniture Commission',
          inquiryType: 'custom_order',
          message: inquiryMessage.trim(),
        }),
      });
      if (res.ok) {
        setInquirySuccess(true);
        setTimeout(() => {
          setSelectedProductForInquiry(null);
          setInquiryMessage('');
          setInquirySuccess(false);
        }, 1800);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInquirySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif tracking-widest text-[#c5a880] uppercase text-xs">
            Loading Saad Patron Sanctuary...
          </p>
        </div>
      </div>
    );
  }

  const stagesList = [
    { key: 'design_approval', label: 'Design & Blueprints', desc: 'Architectural schematics and timber selection approved' },
    { key: 'wood_cutting', label: 'Timber Cutting', desc: 'Sizing & Kiln-dried hardwood pre-cuts' },
    { key: 'carving_joinery', label: 'Carving & Joinery', desc: 'Artisan mortise & tenon joint crafting' },
    { key: 'polishing_finishing', label: 'French Polishing', desc: 'Multi-layer organic hand-rubbed wax finish' },
    { key: 'upholstery', label: 'Bespoke Upholstery', desc: 'Italian leather / velvet tailoring & filling' },
    { key: 'final_inspection', label: 'Master QA', desc: 'Quality assurance clearance & packaging' },
    { key: 'completed', label: 'Ready / Dispatched', desc: 'White-glove delivery to private residence' },
  ];

  const getStageIndex = (stageKey: string) => {
    const idx = stagesList.findIndex((s) => s.key === stageKey);
    return idx >= 0 ? idx : 0;
  };

  const activeOrders = orders.filter(
    (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  );

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col selection:bg-[#c5a880]/30 selection:text-white">
      {/* Top Luxury Navigation */}
      <header className="border-b border-white/5 bg-[#10131a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-serif tracking-[0.25em] text-lg font-bold text-white uppercase flex items-center gap-2">
                SAAD <span className="text-[#c5a880]">FURNITURE</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium">
                VIP Patron Portal & Workshop Tracker
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifModal(true)}
              className="relative p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-[#c5a880]/40 text-slate-300 hover:text-white transition-all"
            >
              <Bell className="w-4 h-4" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c5a880] ring-4 ring-[#0b0d11]" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-slate-300 hover:text-white transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12 w-full flex-1 space-y-8">
        {/* Customer Profile & Heritage Banner */}
        <section className="bg-gradient-to-r from-[#141822] via-[#161c29] to-[#121620] border border-[#c5a880]/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#c5a880]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img
                  src={customerData?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                  alt={customerData?.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-[#c5a880] shadow-lg shadow-black/60"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#121620]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                    {customerData?.name}
                  </h1>
                  <Badge variant="gold">VIP Patron</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                  <span>{customerData?.email}</span>
                  <span>•</span>
                  <span>{customerData?.phone}</span>
                  <span>•</span>
                  <span>{customerData?.city || customerData?.address || 'Private Patron Residence'}</span>
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-[#c5a880]">
                  <span className="flex items-center gap-1.5 bg-[#c5a880]/10 px-2.5 py-1 rounded-md border border-[#c5a880]/20">
                    <Calendar className="w-3.5 h-3.5" />
                    First started doing business:{' '}
                    <strong className="text-white ml-1">
                      {customerData?.firstBusinessDate
                        ? new Date(customerData.firstBusinessDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Valued Patron'}
                    </strong>
                  </span>
                  <span className="text-slate-500 hidden sm:inline">
                    Member since:{' '}
                    {new Date(customerData?.createdAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/?text=Hello%20Saad%20Furniture%20Concierge"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 transition-all text-xs font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp Concierge
              </a>
              <a
                href="tel:+18005557223"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 transition-all text-xs font-semibold"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Showroom
              </a>
            </div>
          </div>
        </section>

        {/* 7 Required Metrics Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {/* Total Orders */}
          <div className="bg-[#131720] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#c5a880]" /> Total Orders
            </span>
            <div className="text-2xl font-bold font-serif text-white mt-2">
              {metrics?.totalOrders || 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Lifetime commissions</span>
          </div>

          {/* Active Orders */}
          <div className="bg-[#131720] border border-amber-500/20 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Active Orders
            </span>
            <div className="text-2xl font-bold font-serif text-amber-400 mt-2">
              {metrics?.activeOrders || 0}
            </div>
            <span className="text-[10px] text-amber-500/80 mt-1">In workshop & transit</span>
          </div>

          {/* Completed Orders */}
          <div className="bg-[#131720] border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-medium flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Completed
            </span>
            <div className="text-2xl font-bold font-serif text-emerald-400 mt-2">
              {metrics?.completedOrders || 0}
            </div>
            <span className="text-[10px] text-emerald-500/80 mt-1">Delivered to residence</span>
          </div>

          {/* Cancelled Orders */}
          <div className="bg-[#131720] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" /> Cancelled
            </span>
            <div className="text-2xl font-bold font-serif text-slate-400 mt-2">
              {metrics?.cancelledOrders || 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Voided commissions</span>
          </div>

          {/* Total Business Amount */}
          <div className="bg-[#131720] border border-[#c5a880]/30 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-[#e5caa2] font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#c5a880]" /> Total Business
            </span>
            <div className="text-2xl font-bold font-serif text-white mt-2">
              ${(metrics?.totalBusinessAmount || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Cumulative volume</span>
          </div>

          {/* Total Payments Made */}
          <div className="bg-[#131720] border border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-medium flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Payments Made
            </span>
            <div className="text-2xl font-bold font-serif text-emerald-400 mt-2">
              ${(metrics?.totalPaymentsMade || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-500/80 mt-1">Settled & verified</span>
          </div>

          {/* Remaining Balance */}
          <div className={`rounded-xl p-4 flex flex-col justify-between border ${
            (metrics?.remainingBalance || 0) > 0
              ? 'bg-[#181315] border-rose-500/40 text-rose-300'
              : 'bg-[#111815] border-emerald-500/30 text-emerald-300'
          }`}>
            <span className="text-[11px] uppercase tracking-wider font-medium flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Remaining Balance
            </span>
            <div className={`text-2xl font-bold font-serif mt-2 ${
              (metrics?.remainingBalance || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              ${(metrics?.remainingBalance || 0).toLocaleString()}
            </div>
            <span className="text-[10px] opacity-80 mt-1">
              {(metrics?.remainingBalance || 0) > 0 ? 'Due upon dispatch' : 'Fully settled'}
            </span>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'active'
                ? 'bg-[#c5a880] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🔨 Active Order & Milestone Tracker ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'bg-[#c5a880] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📋 Complete Order History ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'payments'
                ? 'bg-[#c5a880] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            💳 Payment Ledger & Official Receipts ({payments.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('products');
              if (productsList.length === 0) loadProducts();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'bg-[#c5a880] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🛋️ Luxury Showroom Catalogue & Inquiries
          </button>
        </div>

        {/* TAB 1: ACTIVE ORDER TRACKER */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-[#131720] rounded-2xl border border-white/5 text-slate-400">
                <Package className="w-12 h-12 text-[#c5a880]/50 mx-auto mb-3" />
                <h3 className="text-lg font-serif text-white">No active orders found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your upcoming luxury furniture commissions will appear here with live workshop tracking.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Selector (if customer has multiple orders) */}
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Select Order To Track
                  </h3>
                  <div className="space-y-2.5">
                    {orders.map((ord) => {
                      const isSelected = selectedOrder?.id === ord.id;
                      return (
                        <div
                          key={ord.id}
                          onClick={() => handleSelectOrder(ord)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#191f2c] border-[#c5a880] shadow-lg shadow-[#c5a880]/10'
                              : 'bg-[#12151d] border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-white text-sm">
                              {ord.orderNumber}
                            </span>
                            <Badge
                              variant={
                                ord.orderStatus === 'delivered'
                                  ? 'green'
                                  : ord.orderStatus === 'in_production'
                                  ? 'gold'
                                  : 'blue'
                              }
                            >
                              {ord.orderStatus.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400 mt-2 flex justify-between">
                            <span>Total: ${ord.totalAmount?.toLocaleString()}</span>
                            <span>Progress: {ord.productionProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#c5a880] to-[#e5caa2] h-full rounded-full transition-all duration-500"
                              style={{ width: `${ord.productionProgress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Main Order Detail & Stage Tracker */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedOrder && (
                    <div className="bg-[#141822] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                              {selectedOrder.orderNumber}
                            </h2>
                            <Badge variant="gold">
                              {selectedOrder.productionProgress}% Completed
                            </Badge>
                            <Link
                              href={`/orders/${selectedOrder.id}`}
                              className="text-xs text-[#c5a880] hover:text-white underline font-semibold ml-2"
                            >
                              Open Full Order Dossier →
                            </Link>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Destination: {selectedOrder.deliveryAddress}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Balance Due</span>
                          <span className="text-lg font-bold text-[#c5a880]">
                            ${selectedOrder.remainingBalance?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Visual Multi-Stage Progress Tracker */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                            Manufacturing & Delivery Roadmap
                          </span>
                          <span className="text-xs font-bold text-[#c5a880]">
                            Stage: {selectedOrder.productionStage?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        {/* Stage Dots & Bar */}
                        <div className="relative my-6">
                          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0" />
                          <div
                            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#c5a880] to-[#e5caa2] -translate-y-1/2 z-0 transition-all duration-700"
                            style={{
                              width: `${(getStageIndex(selectedOrder.productionStage) / (stagesList.length - 1)) * 100}%`,
                            }}
                          />
                          <div className="flex justify-between relative z-10">
                            {stagesList.map((stage, idx) => {
                              const currentStageIdx = getStageIndex(selectedOrder.productionStage);
                              const isPast = idx < currentStageIdx;
                              const isCurrent = idx === currentStageIdx;
                              return (
                                <div key={stage.key} className="flex flex-col items-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                      isCurrent
                                        ? 'bg-[#c5a880] text-slate-950 border-white ring-4 ring-[#c5a880]/30 scale-110'
                                        : isPast
                                        ? 'bg-[#c5a880] text-slate-950 border-[#c5a880]'
                                        : 'bg-slate-900 text-slate-500 border-slate-700'
                                    }`}
                                  >
                                    {isPast ? '✓' : idx + 1}
                                  </div>
                                  <span
                                    className={`text-[10px] font-medium mt-2 max-w-[65px] text-center hidden sm:block ${
                                      isCurrent
                                        ? 'text-[#e5caa2] font-bold'
                                        : isPast
                                        ? 'text-slate-300'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    {stage.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Delivery Logistics Box */}
                      <div className="bg-[#181d28] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-wider text-slate-400 block font-medium">
                              White-Glove Delivery
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {selectedOrder.deliveryDriverName || 'Saad Dedicated Transport Fleet'}
                            </span>
                            {selectedOrder.deliveryDriverPhone && (
                              <span className="text-xs text-slate-400 block">
                                Direct Contact: {selectedOrder.deliveryDriverPhone}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Target Dispatch Date</span>
                          <span className="text-sm font-bold text-white">
                            {selectedOrder.estimatedDeliveryDate
                              ? new Date(selectedOrder.estimatedDeliveryDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Scheduling with White-Glove Dispatch'}
                          </span>
                        </div>
                      </div>

                      {/* Artisan Workshop Photographs & Videos Gallery */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-[#c5a880]" />
                            Live Artisan Workshop Media (Google Cloud 5TB Vault)
                          </h3>
                          <span className="text-xs text-slate-400">
                            {selectedOrderDetails?.media?.length || 0} files captured
                          </span>
                        </div>

                        {loadingOrderDetails ? (
                          <div className="py-8 text-center text-xs text-slate-500">Loading visual gallery...</div>
                        ) : selectedOrderDetails?.media?.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {selectedOrderDetails.media.map((med: any) => (
                              <div
                                key={med.id}
                                onClick={() => setActiveMediaModal(med)}
                                className="group relative rounded-xl overflow-hidden aspect-video bg-black cursor-pointer border border-white/10 hover:border-[#c5a880] transition-all"
                              >
                                {med.mediaType === 'video' ? (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-900 group-hover:bg-slate-800 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-[#c5a880]/90 text-slate-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                      <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={med.url}
                                    alt={med.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-end">
                                  <span className="text-[10px] font-semibold text-white truncate">
                                    {med.title}
                                  </span>
                                  <span className="text-[9px] text-[#c5a880] uppercase">
                                    {med.stage?.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 rounded-xl bg-slate-900/50 border border-white/5 text-center text-xs text-slate-500">
                            Workshop cameras currently capturing wood curing and pre-assembly. Photographs and video clips will appear automatically as milestones conclude.
                          </div>
                        )}
                      </div>

                      {/* Live Workshop Timeline Feed */}
                      <div>
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#c5a880]" />
                          Craftsmanship & Activity Feed
                        </h3>
                        <div className="space-y-3">
                          {selectedOrderDetails?.timeline?.map((evt: any) => (
                            <div
                              key={evt.id}
                              className="p-3.5 rounded-xl bg-[#121620] border border-white/5 flex items-start gap-3"
                            >
                              <div className="p-1.5 rounded-md bg-[#c5a880]/10 text-[#c5a880] mt-0.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-white">
                                    {evt.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(evt.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{evt.description}</p>
                                <span className="text-[10px] text-slate-500 block mt-1">
                                  Logged by: {evt.performedBy}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPLETE ORDER HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Complete Order Archive</h3>
                <p className="text-xs text-slate-400">All current and historical commissions placed with Saad Furniture</p>
              </div>
              <Badge variant="gold">{orders.length} Total Commissions</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Order Number</th>
                    <th className="p-4">Commission Date</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Paid Amount</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-semibold text-white font-serif">{ord.orderNumber}</td>
                      <td className="p-4 text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4 font-bold text-white">${ord.totalAmount?.toLocaleString()}</td>
                      <td className="p-4 text-emerald-400 font-semibold">${ord.paidAmount?.toLocaleString()}</td>
                      <td className="p-4 font-semibold">
                        <span className={ord.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          ${ord.remainingBalance?.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            ord.orderStatus === 'delivered'
                              ? 'green'
                              : ord.orderStatus === 'in_production'
                              ? 'gold'
                              : 'neutral'
                          }
                        >
                          {ord.orderStatus.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Link
                          href={`/orders/${ord.id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#c5a880]/20 hover:bg-[#c5a880] text-[#e5caa2] hover:text-slate-950 transition-all font-semibold inline-block"
                        >
                          View Full Dossier
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedOrder(ord);
                            loadOrderFullDetails(ord.id);
                            setActiveTab('active');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all font-semibold"
                        >
                          Quick Track
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENTS & OFFICIAL INVOICES */}
        {activeTab === 'payments' && (
          <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Settlement & Payment Ledger</h3>
                <p className="text-xs text-slate-400">
                  Official financial records and verified Saad receipts
                </p>
              </div>
              <span className="text-xs text-[#c5a880] font-semibold">
                Total Settled: ${(metrics?.totalPaymentsMade || 0).toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Receipt #</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Receipt / Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-mono font-bold text-white">{p.paymentNumber}</td>
                      <td className="p-4 text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="p-4">{p.paymentMethod}</td>
                      <td className="p-4">{p.paymentType}</td>
                      <td className="p-4 font-bold text-emerald-400 text-sm">
                        ${p.amount?.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <Badge variant="green">Verified & Cleared</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <a
                          href={`/api/receipts/${p.paymentNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c5a880]/15 hover:bg-[#c5a880] text-[#c5a880] hover:text-slate-950 transition-all font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Receipt
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SHOWROOM CATALOGUE & BESPOKE INQUIRIES (SECTION 9) */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#c5a880]" />
                  Saad Luxury Furniture Catalogue & Atelier Studio
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Explore mastercrafted showroom pieces or submit an inquiry for bespoke customization
                </p>
              </div>

              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setSelectedProductForInquiry({ name: 'Bespoke Architectural Commission' });
                  setInquiryMessage('');
                }}
                className="text-xs shrink-0"
              >
                + Request Custom Order / Quote
              </Button>
            </div>

            {/* Category Pills (All 8 Categories) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'All Collections' },
                { id: 'sofas', label: 'Sofas' },
                { id: 'double_beds', label: 'Double Beds' },
                { id: 'single_beds', label: 'Single Beds' },
                { id: 'wardrobes', label: 'Wardrobes' },
                { id: 'center_tables', label: 'Center Tables' },
                { id: 'mattresses', label: 'Mattresses' },
                { id: 'room_chairs', label: 'Room Chairs' },
                { id: 'custom_furniture', label: 'Custom Furniture' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#c5a880] text-slate-950 shadow-md font-bold'
                      : 'bg-[#141822] text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsList
                .filter((p) => {
                  if (selectedCategory === 'all') return true;
                  const catA = (p.category || '').toLowerCase().replace(/[\s-]/g, '_');
                  const catB = (p.categorySlug || '').toLowerCase().replace(/[\s-]/g, '_');
                  const target = selectedCategory.toLowerCase().replace(/[\s-]/g, '_');
                  return catA === target || catB === target;
                })
                .map((product) => {
                  let img = product.primaryImageUrl;
                  if (!img && product.images) {
                    try {
                      const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                      if (Array.isArray(parsed) && parsed.length > 0) img = parsed[0];
                    } catch {}
                  }
                  if (!img) img = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

                  const priceVal = product.price || product.basePrice || 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#c5a880]/60 transition-all shadow-xl"
                    >
                      <div>
                        <div className="relative aspect-video overflow-hidden bg-slate-950">
                          <img
                            src={img}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge variant="gold">${priceVal.toLocaleString()}</Badge>
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#c5a880]">
                              {product.category || product.categorySlug?.replace('_', ' ') || 'Masterpiece'}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {product.material || product.woodType || 'Solid Teak / Beechwood'}
                            </span>
                          </div>

                          <h3 className="text-base font-serif font-bold text-white group-hover:text-[#e5caa2] transition-colors">
                            {product.title}
                          </h3>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>

                          <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Dimensions</span>
                              <span className="text-slate-300 font-mono text-[10px]">
                                {product.dimensions || 'Bespoke Custom'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase">Lead Time</span>
                              <span className="text-slate-300 text-[10px]">
                                {product.estimatedLeadDays ? `${product.estimatedLeadDays} Days` : '18-24 Days'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProductForInquiry(product);
                            setInquiryMessage(`I would like to inquire regarding customized dimensions and fabric samples for "${product.title}".`);
                          }}
                          className="w-full text-xs"
                        >
                          Request Bespoke Custom Quote
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      {/* CUSTOM PRODUCT INQUIRY MODAL (SECTION 9) */}
      {selectedProductForInquiry && (
        <Modal
          isOpen={!!selectedProductForInquiry}
          onClose={() => setSelectedProductForInquiry(null)}
          title="Bespoke Commission & Quote Inquiry"
          subtitle={`Piece: ${selectedProductForInquiry.title || selectedProductForInquiry.name}`}
          maxWidth="md"
        >
          {inquirySuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg text-white">Inquiry Received</h4>
              <p className="text-xs text-slate-400">
                Our luxury design consultant will review your specifications and contact you shortly via email or phone.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitInquiry} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase text-slate-500 block">Selected Design</span>
                <span className="text-sm font-serif font-bold text-white block">
                  {selectedProductForInquiry.title || selectedProductForInquiry.name}
                </span>
                {selectedProductForInquiry.basePrice && (
                  <span className="text-xs text-[#c5a880] font-semibold block">
                    Starting from ${selectedProductForInquiry.basePrice.toLocaleString()}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Customization Details & Inquiry Specifications *
                </label>
                <textarea
                  rows={4}
                  required
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="Specify custom dimensions, preferred timber/polish finish, fabric type (Italian velvet, genuine leather), or special room placement requirements..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" type="button" onClick={() => setSelectedProductForInquiry(null)}>
                  Cancel
                </Button>
                <Button variant="gold" type="submit" disabled={inquirySubmitting}>
                  {inquirySubmitting ? 'Transmitting...' : 'Submit Custom Quote Inquiry'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (SECTION 11 & 12) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#121620]/95 backdrop-blur-lg border-t border-white/10 md:hidden flex justify-around items-center h-16 px-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'active' ? 'text-[#c5a880]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[10px] mt-1 font-medium">Tracking</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'history' ? 'text-[#c5a880]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-1 font-medium">My Orders</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('products');
            if (productsList.length === 0) loadProducts();
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'products' ? 'text-[#c5a880]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] mt-1 font-medium">Catalogue</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'payments' ? 'text-[#c5a880]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[10px] mt-1 font-medium">Ledger</span>
        </button>

        <button
          onClick={() => setShowNotifModal(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-200 relative"
        >
          <Bell className="w-4 h-4" />
          <span className="text-[10px] mt-1 font-medium">Alerts</span>
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <span className="absolute top-1.5 right-6 w-2 h-2 rounded-full bg-[#c5a880]" />
          )}
        </button>
      </nav>

      {/* Media Inspection Modal */}
      {activeMediaModal && (
        <Modal
          isOpen={!!activeMediaModal}
          onClose={() => setActiveMediaModal(null)}
          title={activeMediaModal.title}
          subtitle={`Milestone Stage: ${activeMediaModal.stage?.replace('_', ' ').toUpperCase()}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {activeMediaModal.mediaType === 'video' ? (
              <video
                src={activeMediaModal.url}
                controls
                autoPlay
                className="w-full rounded-xl max-h-[70vh] bg-black"
              />
            ) : (
              <img
                src={activeMediaModal.url}
                alt={activeMediaModal.title}
                className="w-full rounded-xl max-h-[70vh] object-contain bg-black"
              />
            )}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
              <span>Verified by Saad Quality Assurance</span>
              <span className="text-[#c5a880]">Google Drive 5TB Storage Synchronized</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Notifications Drawer Modal */}
      <Modal
        isOpen={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        title="Patron Concierge Notifications"
        subtitle="Live announcements and order milestone notifications"
        maxWidth="md"
      >
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">No new notifications.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  n.type === 'announcement'
                    ? 'bg-amber-950/20 border-[#c5a880]/30'
                    : 'bg-slate-900 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{n.title}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-300">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
