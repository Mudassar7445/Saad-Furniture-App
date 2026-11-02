'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Package,
  ShoppingBag,
  Film,
  Tag,
  CreditCard,
  Folder,
  HardDrive,
  Truck,
  Send,
  Users,
  Shield,
  Bell,
  Activity,
  Store,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminOrderManagementModule } from '@/components/admin/AdminOrderManagementModule';

export default function DedicatedAdminOrdersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Data Lists
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      setLoading(true);
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();

      if (!authRes.ok || !authData.user) {
        router.push('/');
        return;
      }

      if (
        authData.user.role !== 'super_admin' &&
        !authData.user.permissions?.includes('orders')
      ) {
        if (authData.user.role === 'staff') {
          router.push('/staff');
        } else {
          router.push('/portal');
        }
        return;
      }

      setCurrentUser(authData.user);
      await refreshAllData();
    } catch (err) {
      console.error('Admin Orders Page Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    try {
      const [ordRes, custRes, prodRes, stfRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/products'),
        fetch('/api/staff'),
      ]);

      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrdersList(d.orders || []);
      }
      if (custRes.ok) {
        const d = await custRes.json();
        setCustomersList(d.customers || []);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        setProductsList(d.products || []);
      }
      if (stfRes.ok) {
        const d = await stfRes.json();
        setStaffList(d.staff || []);
      }
    } catch (err) {
      console.error('Failed to load orders center data:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/');
  };

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: Layers, href: '/admin?tab=overview' },
    { id: 'orders', label: 'Order Management', icon: Package, href: '/admin/orders', active: true, count: ordersList.length },
    { id: 'online_orders', label: 'Online Store Orders', icon: ShoppingBag, href: '/admin?tab=online_orders', count: ordersList.filter((o) => o.orderType === 'online').length },
    { id: 'workshop', label: 'Workshop Media Manager', icon: Film, href: '/admin?tab=workshop' },
    { id: 'sale_codes', label: 'Sale Code Management', icon: Tag, href: '/admin?tab=sale_codes' },
    { id: 'payment_settings', label: 'Payment & Bank Accounts', icon: CreditCard, href: '/admin?tab=payment_settings' },
    { id: 'media_library', label: 'Media & Documents Library', icon: Folder, href: '/admin?tab=media_library' },
    { id: 'cloud_storage', label: 'Cloud Media Storage', icon: HardDrive, href: '/admin?tab=cloud_storage' },
    { id: 'deliveries', label: 'Logistics & Deliveries', icon: Truck, href: '/admin?tab=deliveries' },
    { id: 'customers', label: 'Patron Accounts', icon: Users, href: '/admin?tab=customers', count: customersList.length },
    { id: 'staff', label: 'Staff & Roles', icon: Shield, href: '/admin?tab=staff', count: staffList.length },
    { id: 'products', label: 'Showroom Catalog', icon: Layers, href: '/admin?tab=products', count: productsList.length },
    { id: 'notifications', label: 'Broadcast & Comms', icon: Bell, href: '/admin?tab=notifications' },
    { id: 'activity', label: 'Audit & Activity', icon: Activity, href: '/admin?tab=activity' },
    { id: 'shop_profile', label: 'Showroom & App Branding', icon: Store, href: '/admin?tab=shop_profile' },
    { id: 'settings', label: 'Protected Settings', icon: SettingsIcon, href: '/admin?tab=settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#c5a880] border-t-transparent animate-spin" />
          <p className="font-serif tracking-widest text-[#c5a880] uppercase text-xs">
            Authenticating Order Management Command Center...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#121620] border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-white tracking-widest text-sm uppercase">
            SAAD <span className="text-[#c5a880]">ADMIN</span>
          </span>
          <Badge variant="gold">Order Management</Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-[#121620] border-r border-white/5 flex flex-col z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#c5a880] to-[#e5caa2] p-0.5 shadow-lg shadow-[#c5a880]/20">
              <div className="w-full h-full bg-[#121620] rounded-[10px] flex items-center justify-center">
                <span className="font-serif font-black text-[#c5a880] text-lg">SF</span>
              </div>
            </div>
            <div>
              <span className="font-serif font-bold text-white tracking-wider text-sm block">
                SAAD FURNITURE
              </span>
              <span className="text-[10px] text-[#c5a880] font-sans tracking-widest uppercase block">
                Command Center
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info & Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Current Admin user pill */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={currentUser?.name}
              className="w-10 h-10 rounded-lg object-cover border border-[#c5a880]"
            />
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">{currentUser?.name}</span>
              <span className="text-[10px] text-emerald-400 block font-medium">Order Administrator</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#c5a880] text-slate-950 shadow-md shadow-[#c5a880]/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            href="/admin"
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-xs font-semibold text-slate-300 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#c5a880]" />
            Return to Main Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 border border-white/5 text-xs font-semibold text-slate-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Command Center
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto">
        <AdminOrderManagementModule
          orders={ordersList}
          customers={customersList}
          products={productsList}
          staff={staffList}
          onRefresh={refreshAllData}
        />
      </main>
    </div>
  );
}

