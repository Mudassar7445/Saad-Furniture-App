'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Package,
  Layers,
  CreditCard,
  DollarSign,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  Plus,
  Trash2,
  Edit,
  UploadCloud,
  CheckCircle2,
  Clock,
  Truck,
  Image as ImageIcon,
  Play,
  FileText,
  Search,
  Filter,
  Shield,
  Key,
  Lock,
  Menu,
  X,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Send,
  Eye,
  Activity,
  ShoppingBag,
  Store,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { OnlineOrdersModule } from '@/components/admin/OnlineOrdersModule';
import { ShopProfileSettingsModule } from '@/components/admin/ShopProfileSettingsModule';
import { AdminMediaLibraryModule } from '@/components/admin/AdminMediaLibraryModule';
import { CloudStorageSettingsModule } from '@/components/admin/CloudStorageSettingsModule';
import { AdminWorkshopModule } from '@/components/admin/AdminWorkshopModule';
import { AdminPaymentSettingsModule } from '@/components/admin/AdminPaymentSettingsModule';
import { MultiItemOrderBuilderModal } from '@/components/admin/MultiItemOrderBuilderModal';
import { ProductMediaUploadModal } from '@/components/admin/ProductMediaUploadModal';
import { AdminOrderDetailsModal } from '@/components/admin/AdminOrderDetailsModal';

export const FURNITURE_PRODUCTION_STAGES = [
  { id: 'order_placed', label: '1. Order Placed', pct: 6 },
  { id: 'order_confirmed', label: '2. Order Confirmed', pct: 12 },
  { id: 'design_measurements', label: '3. Design & Measurements', pct: 18 },
  { id: 'material_preparation', label: '4. Material Preparation', pct: 25 },
  { id: 'frame_cutting', label: '5. Frame Cutting & Preparation', pct: 31 },
  { id: 'frame_assembly', label: '6. Frame Assembly', pct: 38 },
  { id: 'frame_inspection', label: '7. Frame Inspection', pct: 44 },
  { id: 'foam_work', label: '8. Foam Work', pct: 50 },
  { id: 'fabric_cutting_stitching', label: '9. Fabric Cutting & Stitching', pct: 56 },
  { id: 'upholstery_work', label: '10. Upholstery Work', pct: 65 },
  { id: 'polishing_finishing', label: '11. Polishing & Finishing', pct: 75 },
  { id: 'quality_inspection', label: '12. Quality Inspection', pct: 82 },
  { id: 'ready_for_delivery', label: '13. Ready for Delivery', pct: 88 },
  { id: 'dispatched', label: '14. Dispatched', pct: 93 },
  { id: 'out_for_delivery', label: '15. Out for Delivery', pct: 97 },
  { id: 'delivered', label: '16. Delivered', pct: 100 },
];

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<
    'overview' | 'online_orders' | 'orders' | 'deliveries' | 'ledger' | 'inquiries' | 'customers' | 'staff' | 'products' | 'notifications' | 'settings' | 'activity' | 'shop_profile' | 'media_library' | 'cloud_storage' | 'workshop' | 'payment_settings'
  >('overview');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'cloud_storage'>('general');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [reports, setReports] = useState<any>(null);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [deliveriesList, setDeliveriesList] = useState<any[]>([]);
  const [ledgersData, setLedgersData] = useState<any>(null);
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [settingsData, setSettingsData] = useState<any>(null);
  const [integrationsData, setIntegrationsData] = useState<any>(null);

  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delivery & Reversal Modals
  const [showUpdateDeliveryModal, setShowUpdateDeliveryModal] = useState<any>(null);
  const [showReversalModal, setShowReversalModal] = useState<any>(null);
  const [reversalReasonInput, setReversalReasonInput] = useState('');

  // Modals
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState<any>(null);
  const [showResetPassword, setShowResetPassword] = useState<any>(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showEditOrderProgress, setShowEditOrderProgress] = useState<any>(null);
  const [showUploadMedia, setShowUploadMedia] = useState<any>(null);
  const [showRecordPayment, setShowRecordPayment] = useState<any>(null);
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState<any>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedOrderForView, setSelectedOrderForView] = useState<string | null>(null);
  const [showSendNotification, setShowSendNotification] = useState(false);
  const [targetCustomerForNotif, setTargetCustomerForNotif] = useState<string>('all');

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    firstBusinessDate: '',
  });

  const [orderForm, setOrderForm] = useState({
    customerId: '',
    productName: '',
    productCategory: 'Living Room',
    productDescription: '',
    customDesignDetails: '',
    dimensions: '',
    fabricInfo: '',
    colourInfo: '',
    quantity: '1',
    totalAmount: '',
    paidAmount: '',
    deliveryAddress: '',
    expectedCompletionDate: '',
    assignedStaffId: '',
    assignedStaffName: '',
    specialInstructions: '',
  });

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    permissions: ['orders'],
  });

  const [productForm, setProductForm] = useState({
    title: '',
    category: 'Living Room',
    price: '',
    material: '',
    dimensions: '',
    stockQuantity: '1',
    status: 'available',
    showroomLocation: 'Main Floor A-1',
    description: '',
  });

  const [notifForm, setNotifForm] = useState({
    targetUserId: 'all',
    title: '',
    message: '',
    type: 'announcement',
  });

  const [mediaUploadForm, setMediaUploadForm] = useState({
    title: '',
    stage: 'wood_cutting',
    mediaType: 'photo',
    url: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    orderId: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    paymentType: 'Progress Installment',
    notes: '',
  });

  const [newPasswordVal, setNewPasswordVal] = useState('');

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

      if (authData.user.role !== 'super_admin') {
        if (authData.user.role === 'staff') {
          router.push('/staff');
          return;
        } else {
          router.push('/portal');
          return;
        }
      }

      setCurrentUser(authData.user);
      await refreshAllData();
    } catch (err) {
      console.error('Super Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    try {
      const [repRes, ordRes, custRes, stfRes, prodRes, setRes, delivRes, ledgRes, inqRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/staff'),
        fetch('/api/products'),
        fetch('/api/settings'),
        fetch('/api/delivery'),
        fetch('/api/ledger'),
        fetch('/api/products/inquiries'),
      ]);

      if (repRes.ok) setReports(await repRes.json());
      if (ordRes.ok) {
        const o = await ordRes.json();
        setOrdersList(o.orders || []);
      }
      if (custRes.ok) {
        const c = await custRes.json();
        setCustomersList(c.customers || []);
      }
      if (stfRes.ok) {
        const s = await stfRes.json();
        setStaffList(s.staff || []);
      }
      if (prodRes.ok) {
        const p = await prodRes.json();
        setProductsList(p.products || []);
      }
      if (setRes.ok) {
        const sett = await setRes.json();
        setSettingsData(sett.settings);
        setIntegrationsData(sett.integrations);
      }
      if (delivRes.ok) {
        const d = await delivRes.json();
        setDeliveriesList(d.deliveries || []);
      }
      if (ledgRes.ok) {
        const l = await ledgRes.json();
        setLedgersData(l);
      }
      if (inqRes.ok) {
        const inq = await inqRes.json();
        setInquiriesList(inq.inquiries || []);
      }
    } catch (e) {
      console.error('Data refresh error:', e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  // Customer Management Handlers
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerForm),
      });
      if (res.ok) {
        setShowCreateCustomer(false);
        setCustomerForm({
          name: '',
          email: '',
          phone: '',
          password: '',
          address: '',
          city: '',
          firstBusinessDate: '',
        });
        refreshAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create customer');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCustomerStatus = async (customer: any) => {
    const nextStatus = customer.status === 'active' ? 'suspended' : 'active';
    await fetch(`/api/customers/${customer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_STATUS', status: nextStatus }),
    });
    refreshAllData();
  };

  const handleResetCustomerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPassword) return;
    const res = await fetch(`/api/customers/${showResetPassword.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESET_PASSWORD', newPassword: newPasswordVal }),
    });
    if (res.ok) {
      alert(`Password successfully reset for ${showResetPassword.name}`);
      setShowResetPassword(null);
      setNewPasswordVal('');
    }
  };

  // Order Management Handlers
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: orderForm.customerId,
          productName: orderForm.productName,
          productCategory: orderForm.productCategory,
          productDescription: orderForm.productDescription,
          customDesignDetails: orderForm.customDesignDetails,
          dimensions: orderForm.dimensions,
          fabricInfo: orderForm.fabricInfo,
          colourInfo: orderForm.colourInfo,
          quantity: Number(orderForm.quantity) || 1,
          totalAmount: Number(orderForm.totalAmount),
          paidAmount: Number(orderForm.paidAmount || 0),
          deliveryAddress: orderForm.deliveryAddress,
          expectedCompletionDate: orderForm.expectedCompletionDate,
          assignedStaffId: orderForm.assignedStaffId,
          assignedStaffName: orderForm.assignedStaffName,
          specialInstructions: orderForm.specialInstructions,
        }),
      });

      if (res.ok) {
        setShowCreateOrder(false);
        setOrderForm({
          customerId: '',
          productName: '',
          productCategory: 'Living Room',
          productDescription: '',
          customDesignDetails: '',
          dimensions: '',
          fabricInfo: '',
          colourInfo: '',
          quantity: '1',
          totalAmount: '',
          paidAmount: '',
          deliveryAddress: '',
          expectedCompletionDate: '',
          assignedStaffId: '',
          assignedStaffName: '',
          specialInstructions: '',
        });
        refreshAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create order');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to permanently delete order ${orderNumber}? This will remove all items, media, and records.`)) {
      return;
    }
    await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    refreshAllData();
  };

  const handleUpdateOrderProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditOrderProgress) return;
    await fetch(`/api/orders/${showEditOrderProgress.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productionStage: showEditOrderProgress.productionStage,
        productionProgress: Number(showEditOrderProgress.productionProgress),
        progressDescription: showEditOrderProgress.progressDescription,
        orderStatus: showEditOrderProgress.orderStatus,
        deliveryStatus: showEditOrderProgress.deliveryStatus,
        estimatedDeliveryDate: showEditOrderProgress.estimatedDeliveryDate,
        deliveryDriverName: showEditOrderProgress.deliveryDriverName,
        deliveryDriverPhone: showEditOrderProgress.deliveryDriverPhone,
      }),
    });
    setShowEditOrderProgress(null);
    refreshAllData();
  };

  const handleUploadOrderMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUploadMedia) return;
    const res = await fetch(`/api/orders/${showUploadMedia.id}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: mediaUploadForm.title || 'Artisan Workshop Milestone',
        stage: mediaUploadForm.stage || showUploadMedia.productionStage,
        mediaType: mediaUploadForm.mediaType,
        url:
          mediaUploadForm.url ||
          (mediaUploadForm.mediaType === 'video'
            ? 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-piece-of-wood-41584-large.mp4'
            : 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'),
      }),
    });
    if (res.ok) {
      setShowUploadMedia(null);
      setMediaUploadForm({ title: '', stage: 'wood_cutting', mediaType: 'photo', url: '' });
      alert('Workshop media successfully uploaded and dispatched to patron.');
      refreshAllData();
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRecordPayment) return;
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: showRecordPayment.id,
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        notes: paymentForm.notes,
      }),
    });
    if (res.ok) {
      setShowRecordPayment(null);
      setPaymentForm({ orderId: '', amount: '', paymentMethod: 'Bank Transfer', paymentType: 'Progress Installment', notes: '' });
      refreshAllData();
    }
  };

  // Staff Management Handlers
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffForm),
    });
    if (res.ok) {
      setShowCreateStaff(false);
      setStaffForm({ name: '', email: '', phone: '', password: '', permissions: ['orders'] });
      refreshAllData();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to create staff');
    }
  };

  const handleToggleStaffPermission = (perm: string) => {
    const current = staffForm.permissions;
    if (current.includes(perm)) {
      setStaffForm({ ...staffForm, permissions: current.filter((p) => p !== perm) });
    } else {
      setStaffForm({ ...staffForm, permissions: [...current, perm] });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff account?')) return;
    await fetch(`/api/staff/${staffId}`, { method: 'DELETE' });
    refreshAllData();
  };

  // Product Catalogue Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...productForm,
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
        ],
      }),
    });
    if (res.ok) {
      setShowCreateProduct(false);
      setProductForm({
        title: '',
        category: 'Living Room',
        price: '',
        material: '',
        dimensions: '',
        stockQuantity: '1',
        status: 'available',
        showroomLocation: 'Main Floor A-1',
        description: '',
      });
      refreshAllData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product from catalog?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    refreshAllData();
  };

  // Notification Dispatcher
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifForm),
    });
    if (res.ok) {
      setShowSendNotification(false);
      setNotifForm({ targetUserId: 'all', title: '', message: '', type: 'announcement' });
      alert('Notification / Announcement dispatched successfully.');
      refreshAllData();
    }
  };

  // Settings Handlers
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData),
    });
    if (res.ok) {
      alert('System settings and cloud storage configurations saved successfully.');
      refreshAllData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif tracking-widest text-[#c5a880] uppercase text-xs">
            Authenticating Super Admin Command Center...
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Executive Overview', icon: Layers },
    { id: 'online_orders', label: 'Online Store Orders', icon: ShoppingBag, count: ordersList.filter((o) => o.orderType === 'online').length },
    { id: 'workshop', label: 'Workshop Showcase', icon: Play },
    { id: 'payment_settings', label: 'Payment & Bank Accounts', icon: CreditCard },
    { id: 'media_library', label: 'Media & Documents Library', icon: Folder },
    { id: 'cloud_storage', label: 'Google Drive 5TB Storage', icon: HardDrive },
    { id: 'orders', label: 'Showroom Commissions', icon: Package, count: ordersList.filter((o) => o.orderType !== 'online').length },
    { id: 'deliveries', label: 'Logistics & Deliveries', icon: Truck, count: deliveriesList.length },
    { id: 'ledger', label: 'Financial Ledgers', icon: CreditCard, count: ledgersData?.customers?.length || 0 },
    { id: 'inquiries', label: 'Custom Inquiries', icon: Send, count: inquiriesList.filter((i) => i.status === 'pending').length },
    { id: 'customers', label: 'Patron Accounts', icon: Users, count: customersList.length },
    { id: 'staff', label: 'Staff & Roles', icon: Shield, count: staffList.length },
    { id: 'products', label: 'Showroom Catalog', icon: Layers, count: productsList.length },
    { id: 'notifications', label: 'Broadcast & Comms', icon: Bell },
    { id: 'activity', label: 'Audit & Activity', icon: Activity },
    { id: 'shop_profile', label: 'Showroom & App Branding', icon: Store },
    { id: 'settings', label: 'Protected Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#121620] border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-white tracking-widest text-sm uppercase">
            SAAD <span className="text-[#c5a880]">ADMIN</span>
          </span>
          <Badge variant="gold">Super Admin</Badge>
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

      {/* Sidebar for Desktop & Tablets (and drawer on mobile) */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-72 bg-[#10131a] border-r border-white/5 z-50 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#B99A68]/40 shadow-lg shrink-0 bg-[#141210]">
              <img src="/assets/branding/app-dp.svg" alt="Saad Furniture" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-serif tracking-[0.15em] text-sm font-bold text-white block uppercase">
                SAAD FURNITURE
              </span>
              <span className="text-[10px] tracking-wider uppercase text-[#B99A68] font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Super Admin Portal
              </span>
            </div>
          </div>

          {/* Current Admin user pill */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center gap-3">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
              alt={currentUser?.name}
              className="w-10 h-10 rounded-lg object-cover border border-[#c5a880]"
            />
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">{currentUser?.name}</span>
              <span className="text-[10px] text-emerald-400 block">Total Unrestricted Control</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#c5a880] text-slate-950 shadow-md shadow-[#c5a880]/20'
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <div className="p-2.5 rounded-lg bg-[#141822] border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-white">
              <HardDrive className="w-3.5 h-3.5 text-[#c5a880]" /> 5TB Google Vault
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">SYNCHRONIZED</span>
          </div>
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
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
                {navItems.find((n) => n.id === activeModule)?.label}
              </h1>
              <Badge variant="gold">Saad Control</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Session: Full administrative, manufacturing, delivery, financial & catalog authority
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={refreshAllData}
              className="p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-[#c5a880] text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5"
              title="Refresh all real-time tables"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync Live</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNotifForm({ ...notifForm, targetUserId: 'all' });
                setShowSendNotification(true);
              }}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Broadcast Notice
            </Button>

            <Button
              variant="gold"
              size="sm"
              onClick={() => setShowCreateOrder(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Order
            </Button>
          </div>
        </div>

        {/* 0. MODULE: ONLINE E-COMMERCE ORDERS */}
        {activeModule === 'online_orders' && <OnlineOrdersModule />}

        {/* 1. MODULE: EXECUTIVE OVERVIEW */}
        {activeModule === 'overview' && (() => {
          const nowMs = Date.now();
          const filteredOrders = ordersList.filter((o) => {
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const matchNum = o.orderNumber?.toLowerCase().includes(q);
              const matchCust = o.customerName?.toLowerCase().includes(q);
              const matchPhone = o.customerPhone?.toLowerCase().includes(q);
              const matchProd = o.productName?.toLowerCase().includes(q);
              if (!matchNum && !matchCust && !matchPhone && !matchProd) return false;
            }

            if (dateFilter === 'all') return true;
            const orderTime = new Date(o.createdAt).getTime();

            if (dateFilter === 'today') {
              const startOfDay = new Date();
              startOfDay.setHours(0, 0, 0, 0);
              return orderTime >= startOfDay.getTime();
            }
            if (dateFilter === 'this_week') {
              return orderTime >= nowMs - 7 * 24 * 60 * 60 * 1000;
            }
            if (dateFilter === 'this_month') {
              return orderTime >= nowMs - 30 * 24 * 60 * 60 * 1000;
            }
            if (dateFilter === 'this_year') {
              const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
              return orderTime >= startOfYear;
            }
            if (dateFilter === 'custom') {
              if (customStartDate && orderTime < new Date(customStartDate).getTime()) return false;
              if (customEndDate && orderTime > new Date(customEndDate).getTime() + 86400000) return false;
              return true;
            }
            return true;
          });

          const totalFilteredGross = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          const totalFilteredCollected = filteredOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
          const totalFilteredOutstanding = filteredOrders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);
          const activeFilteredCount = filteredOrders.filter((o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length;

          return (
            <div className="space-y-6">
              {/* DATE RANGE FILTERS & SEARCH TOOLBAR (SECTION 10) */}
              <div className="p-4 rounded-2xl bg-[#141822] border border-white/5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase flex items-center gap-1 shrink-0 mr-1">
                    <Filter className="w-3.5 h-3.5 text-[#c5a880]" /> Sales Horizon:
                  </span>
                  {[
                    { id: 'all', label: 'All Records' },
                    { id: 'today', label: 'Today' },
                    { id: 'this_week', label: 'This Week' },
                    { id: 'this_month', label: 'This Month' },
                    { id: 'this_year', label: 'This Year' },
                    { id: 'custom', label: 'Custom Range' },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      onClick={() => setDateFilter(filterTab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        dateFilter === filterTab.id
                          ? 'bg-[#c5a880] text-slate-950 shadow-md font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                  )}

                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search orders, clients, phones..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-[#c5a880] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#141822] border border-[#c5a880]/30 rounded-2xl p-5 shadow-xl">
                  <span className="text-xs uppercase tracking-wider text-[#c5a880] font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Gross Revenue
                  </span>
                  <div className="text-3xl font-bold font-serif text-white mt-3">
                    ${totalFilteredGross.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Across {filteredOrders.length} commissions ({dateFilter.replace('_', ' ')})
                  </span>
                </div>

                <div className="bg-[#141822] border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Settled Collections
                  </span>
                  <div className="text-3xl font-bold font-serif text-emerald-400 mt-3">
                    ${totalFilteredCollected.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-500/80 mt-1 block">
                    Deposits & verified installments
                  </span>
                </div>

                <div className="bg-[#141822] border border-rose-500/30 rounded-2xl p-5 shadow-xl">
                  <span className="text-xs uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Outstanding Receivables
                  </span>
                  <div className="text-3xl font-bold font-serif text-rose-400 mt-3">
                    ${totalFilteredOutstanding.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-rose-500/80 mt-1 block">
                    Balance due prior to dispatch
                  </span>
                </div>

                <div className="bg-[#141822] border border-blue-500/30 rounded-2xl p-5 shadow-xl">
                  <span className="text-xs uppercase tracking-wider text-blue-400 font-semibold flex items-center gap-2">
                    <Package className="w-4 h-4" /> Active Workshop Orders
                  </span>
                  <div className="text-3xl font-bold font-serif text-blue-400 mt-3">
                    {activeFilteredCount}
                  </div>
                  <span className="text-[11px] text-blue-500/80 mt-1 block">
                    In cutting, joinery & upholstery
                  </span>
                </div>
              </div>

            {/* Quick Status Stage Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#141822] border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-serif">
                  <Clock className="w-4 h-4 text-[#c5a880]" />
                  Workshop Stage Breakdown
                </h3>
                <div className="space-y-3">
                  {Object.entries(reports?.ordersByStage || {}).map(([stg, count]: any) => (
                    <div key={stg} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 capitalize">{stg.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#c5a880] h-full rounded-full"
                            style={{
                              width: `${Math.min(100, ((count as number) / Math.max(1, ordersList.length)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-bold text-white w-6 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#141822] border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-serif">
                  <Activity className="w-4 h-4 text-[#c5a880]" />
                  Live Operational Audit Stream
                </h3>
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {reports?.recentActivity?.map((act: any) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white block">{act.action}</span>
                        <span className="text-slate-400 text-[11px]">{act.details}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          );
        })()}

        {/* 2. MODULE: ORDER MANAGEMENT */}
        {activeModule === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-white">All Showroom & Custom Commissions</h2>
              <Button variant="gold" size="sm" onClick={() => setShowCreateOrder(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create New Order
              </Button>
            </div>

            <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order #</th>
                      <th className="p-4">Patron</th>
                      <th className="p-4">Stage & Progress</th>
                      <th className="p-4">Delivery Status</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Balance</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {ordersList.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-white font-serif">
                          <Link href={`/orders/${ord.id}`} className="hover:text-[#c5a880] underline transition-colors">
                            {ord.orderNumber}
                          </Link>
                          {ord.isDelayed === 1 && (
                            <span className="block text-[9px] text-amber-400 font-sans font-bold">⚠️ DELAY NOTICE</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-white block">{ord.customerName}</span>
                          <span className="text-[11px] text-slate-500">{ord.productName || ord.customerEmail}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize text-[#e5caa2]">
                              {ord.productionStage?.replace('_', ' ')}
                            </span>
                            <span className="font-bold text-white">({ord.productionProgress}%)</span>
                          </div>
                          <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#c5a880] to-[#e5caa2] h-full rounded-full"
                              style={{ width: `${ord.productionProgress}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              ord.deliveryStatus === 'delivered'
                                ? 'green'
                                : ord.deliveryStatus === 'dispatched'
                                ? 'blue'
                                : 'neutral'
                            }
                          >
                            {ord.deliveryStatus}
                          </Badge>
                          {ord.estimatedDeliveryDate && (
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              ETA: {new Date(ord.estimatedDeliveryDate).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-white">${ord.totalAmount?.toLocaleString()}</td>
                        <td className="p-4 font-semibold">
                          <span className={ord.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            ${ord.remainingBalance?.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Quick Multi-Item Dossier Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForView(ord.id)}
                            className="p-1.5 rounded-lg bg-[#c5a880]/20 hover:bg-[#c5a880] text-[#e5caa2] hover:text-slate-950 transition-colors inline-block"
                            title="Quick Multi-Item Commission Modal"
                          >
                            <Layers className="w-4 h-4" />
                          </button>

                          {/* Dedicated Order Details Page */}
                          <Link
                            href={`/orders/${ord.id}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#c5a880] text-slate-300 hover:text-slate-950 transition-colors inline-block"
                            title="Open Separate Order Details Page & Visual Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Update progress */}
                          <button
                            onClick={() => setShowEditOrderProgress(ord)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#c5a880] hover:text-slate-950 text-slate-200 transition-colors"
                            title="Update Manufacturing & Delivery Progress"
                          >
                            <Clock className="w-4 h-4" />
                          </button>

                          {/* Upload Media (Photo/Video) */}
                          <button
                            onClick={() => setShowUploadMedia(ord)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 transition-colors"
                            title="Upload Workshop Photograph or Video"
                          >
                            <UploadCloud className="w-4 h-4" />
                          </button>

                          {/* Record Payment */}
                          <button
                            onClick={() => setShowRecordPayment(ord)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 transition-colors"
                            title="Record Payment / Installment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Delete Order */}
                          <button
                            onClick={() => handleDeleteOrder(ord.id, ord.orderNumber)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2b. MODULE: LOGISTICS & DELIVERIES (SECTION 5) */}
        {activeModule === 'deliveries' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#c5a880]" />
                  White-Glove Logistics & Dispatch Fleet ({deliveriesList.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage climate-controlled transit, stage transitions, and driver assignments
                </p>
              </div>
            </div>

            <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order Ref</th>
                      <th className="p-4">Delivery Stage</th>
                      <th className="p-4">Destination</th>
                      <th className="p-4">Patron Contact</th>
                      <th className="p-4">Assigned Specialist</th>
                      <th className="p-4">Time Window</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {deliveriesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No deliveries logged yet. Create an order to initiate dispatch tracking.
                        </td>
                      </tr>
                    ) : (
                      deliveriesList.map((deliv) => {
                        const relatedOrder = ordersList.find((o) => o.id === deliv.orderId);
                        return (
                          <tr key={deliv.id} className="hover:bg-white/[0.02]">
                            <td className="p-4 font-bold text-white font-serif">
                              <Link href={`/orders/${deliv.orderId}`} className="hover:text-[#c5a880] underline">
                                {relatedOrder?.orderNumber || deliv.orderId}
                              </Link>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={
                                  deliv.deliveryStage === 'delivered_successfully'
                                    ? 'green'
                                    : deliv.deliveryStage === 'dispatched' || deliv.deliveryStage === 'out_for_delivery'
                                    ? 'gold'
                                    : 'blue'
                                }
                              >
                                {deliv.deliveryStage?.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td className="p-4 text-slate-300 max-w-xs truncate" title={deliv.deliveryAddress}>
                              {deliv.deliveryAddress}
                            </td>
                            <td className="p-4 font-mono text-slate-300">
                              {deliv.customerContactNumber}
                            </td>
                            <td className="p-4 text-white">
                              <span className="font-semibold block">{deliv.assignedDeliveryStaff || 'Saad Logistics'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{deliv.assignedDeliveryStaffPhone || '+1 (800) 555-SAAD'}</span>
                            </td>
                            <td className="p-4 text-emerald-400 font-medium">
                              {deliv.deliveryTimeWindow || '10:00 AM - 02:00 PM'}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowUpdateDeliveryModal(deliv)}
                                className="text-xs"
                              >
                                Update Stage & Driver
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2c. MODULE: FINANCIAL LEDGERS (SECTION 6) */}
        {activeModule === 'ledger' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#c5a880]" />
                  Patron Financial Ledgers & Settlement Accounts
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Server-calculated financial balances, multi-channel payment entries, and certified audit trails
                </p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#141822] border border-[#c5a880]/30 rounded-2xl p-5 shadow-xl">
                <span className="text-xs uppercase tracking-wider text-[#c5a880] font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Lifetime Patron Business
                </span>
                <div className="text-3xl font-bold font-serif text-white mt-2">
                  ${(ledgersData?.summary?.grandTotalBusiness || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Sum of verified luxury furniture orders
                </span>
              </div>

              <div className="bg-[#141822] border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Total Payments Cleared
                </span>
                <div className="text-3xl font-bold font-serif text-emerald-400 mt-2">
                  ${(ledgersData?.summary?.grandTotalCollected || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-500/80 mt-1 block">
                  Via Bank Wire, Cash, JazzCash & EasyPaisa
                </span>
              </div>

              <div className="bg-[#141822] border border-rose-500/30 rounded-2xl p-5 shadow-xl">
                <span className="text-xs uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Total Outstanding Receivables
                </span>
                <div className="text-3xl font-bold font-serif text-rose-400 mt-2">
                  ${(ledgersData?.summary?.grandTotalOutstanding || 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-rose-500/80 mt-1 block">
                  Remaining patron balance prior to delivery
                </span>
              </div>
            </div>

            {/* Ledgers Table */}
            <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Patron Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">First Business Date</th>
                      <th className="p-4">Commissions</th>
                      <th className="p-4">Total Business</th>
                      <th className="p-4">Total Paid</th>
                      <th className="p-4">Outstanding Balance</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {(ledgersData?.customers || []).map((cLedger: any) => (
                      <tr key={cLedger.customerId} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-bold text-white font-serif">
                          {cLedger.customerName}
                          <Badge variant="gold" className="ml-2 text-[9px]">Patron</Badge>
                        </td>
                        <td className="p-4">
                          <span className="block text-slate-300">{cLedger.customerEmail}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{cLedger.customerPhone || 'N/A'}</span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(cLedger.firstBusinessDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-semibold text-white">
                          {cLedger.totalOrders} ({cLedger.activeOrders} active)
                        </td>
                        <td className="p-4 font-bold text-white font-serif text-sm">
                          ${cLedger.totalBusiness.toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-emerald-400 font-serif text-sm">
                          ${cLedger.totalPaid.toLocaleString()}
                        </td>
                        <td className={`p-4 font-bold font-serif text-sm ${
                          cLedger.outstandingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          ${cLedger.outstandingBalance.toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={() => {
                                const customerOrders = ordersList.filter((o) => o.customerId === cLedger.customerId);
                                if (customerOrders.length > 0) {
                                  setShowRecordPayment(customerOrders[0]);
                                } else {
                                  alert('Customer has no existing orders.');
                                }
                              }}
                              className="text-xs"
                            >
                              + Record Payment
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2d. MODULE: SHOWROOM CUSTOM INQUIRIES (SECTION 9) */}
        {activeModule === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#c5a880]" />
                  Patron Custom Quotes & Showroom Inquiries ({inquiriesList.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct customization requests submitted from the showroom catalogue
                </p>
              </div>
            </div>

            <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Client Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Piece / Design</th>
                      <th className="p-4">Inquiry Details</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {inquiriesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No pending inquiries. Clients browsing the catalogue can submit requests here.
                        </td>
                      </tr>
                    ) : (
                      inquiriesList.map((inq) => (
                        <tr key={inq.id} className="hover:bg-white/[0.02]">
                          <td className="p-4 text-slate-500 whitespace-nowrap">
                            {new Date(inq.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 font-bold text-white font-serif">
                            {inq.customerName}
                          </td>
                          <td className="p-4">
                            <span className="block text-slate-300">{inq.customerEmail}</span>
                            <span className="text-slate-500 font-mono text-[11px]">{inq.customerPhone}</span>
                          </td>
                          <td className="p-4 text-[#c5a880] font-semibold">
                            {inq.productTitle}
                          </td>
                          <td className="p-4 text-slate-300 max-w-sm leading-relaxed">
                            {inq.message}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                inq.status === 'responded'
                                  ? 'green'
                                  : inq.status === 'closed'
                                  ? 'neutral'
                                  : 'gold'
                              }
                            >
                              {inq.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <select
                              value={inq.status}
                              onChange={async (e) => {
                                await fetch('/api/products/inquiries', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ inquiryId: inq.id, status: e.target.value }),
                                });
                                refreshAllData();
                              }}
                              className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="responded">Responded</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. MODULE: PATRON ACCOUNTS */}
        {activeModule === 'customers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-white">Registered Patron Accounts</h2>
              <Button variant="gold" size="sm" onClick={() => setShowCreateCustomer(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Customer Account
              </Button>
            </div>

            <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">First Business Date</th>
                      <th className="p-4">Orders (Active/Total)</th>
                      <th className="p-4">Lifetime Business</th>
                      <th className="p-4">Outstanding</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Admin Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {customersList.map((cust) => (
                      <tr key={cust.id} className="hover:bg-white/[0.02]">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={cust.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                              alt={cust.name}
                              className="w-9 h-9 rounded-lg object-cover border border-[#c5a880]"
                            />
                            <div>
                              <span className="font-bold text-white block">{cust.name}</span>
                              <span className="text-[11px] text-slate-500">{cust.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300">
                          {cust.firstBusinessDate
                            ? new Date(cust.firstBusinessDate).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-amber-400">{cust.stats?.activeOrders || 0}</span>
                          <span className="text-slate-500"> / {cust.stats?.totalOrders || 0} total</span>
                        </td>
                        <td className="p-4 font-bold text-white">
                          ${(cust.stats?.totalBusinessAmount || 0).toLocaleString()}
                        </td>
                        <td className="p-4 font-semibold">
                          <span className={(cust.stats?.remainingBalance || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            ${(cust.stats?.remainingBalance || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant={cust.status === 'active' ? 'green' : 'red'}>
                            {cust.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Direct message notification */}
                          <button
                            onClick={() => {
                              setNotifForm({ ...notifForm, targetUserId: cust.id });
                              setShowSendNotification(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-200"
                            title="Send direct notification"
                          >
                            <Bell className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => setShowResetPassword(cust)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Toggle Active/Suspend */}
                          <button
                            onClick={() => handleToggleCustomerStatus(cust)}
                            className={`p-1.5 rounded-lg text-slate-200 ${
                              cust.status === 'active'
                                ? 'bg-slate-800 hover:bg-rose-900 text-rose-300'
                                : 'bg-slate-800 hover:bg-emerald-900 text-emerald-300'
                            }`}
                            title={cust.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          >
                            {cust.status === 'active' ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* 4. MODULE: STAFF & PERMISSIONS */}
        {activeModule === 'staff' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-white">Staff Management & Permission Control</h2>
                <p className="text-xs text-slate-400">
                  Granular role delegation: Order Manager, Media Manager, Delivery Manager, Accounts Manager, Product Manager
                </p>
              </div>
              <Button variant="gold" size="sm" onClick={() => setShowCreateStaff(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Staff Member
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffList.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#141822] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={s.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
                        alt={s.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#c5a880]"
                      />
                      <div>
                        <h3 className="font-bold text-white text-sm">{s.name}</h3>
                        <span className="text-[11px] text-slate-400 block">{s.email}</span>
                        <span className="text-[10px] text-slate-500 block">{s.phone}</span>
                      </div>
                    </div>
                    <Badge variant={s.status === 'active' ? 'green' : 'red'}>
                      {s.status}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-2 font-semibold">
                      Assigned Module Permissions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {s.permissions?.map((p: string) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded-md bg-[#c5a880]/15 text-[#e5caa2] text-[11px] font-medium border border-[#c5a880]/30 capitalize"
                        >
                          {p} Manager
                        </span>
                      ))}
                      {(!s.permissions || s.permissions.length === 0) && (
                        <span className="text-[11px] text-slate-500 italic">No permissions granted</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">
                      Added {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteStaff(s.id)}
                      className="text-rose-400 hover:text-rose-300 font-medium text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* 5. MODULE: SHOWROOM CATALOG */}
        {activeModule === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-white">Showroom Catalog & Prices</h2>
                <p className="text-xs text-slate-400">
                  Manage product catalogue, pricing, availability, and floor locations
                </p>
              </div>
              <Button variant="gold" size="sm" onClick={() => setShowCreateProduct(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Furniture Piece
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsList.map((prod) => {
                let imgs: string[] = [];
                try {
                  imgs = Array.isArray(prod.images) ? prod.images : JSON.parse(prod.images || '[]');
                } catch {
                  imgs = [];
                }
                const displayImg = prod.featuredImage || (imgs.length > 0 ? imgs[0] : null) || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80';
                return (
                  <div
                    key={prod.id}
                    className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-black">
                      <img
                        src={displayImg}
                        alt={prod.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Badge variant="gold">{prod.category}</Badge>
                        <Badge variant={prod.status === 'available' ? 'green' : 'neutral'}>
                          {prod.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono">{prod.sku}</span>
                        <h3 className="font-serif font-bold text-white text-base mt-0.5">{prod.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prod.description}</p>
                      </div>

                      <div className="text-xs text-slate-300 space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                        <div>Material: <span className="text-white font-medium">{prod.material}</span></div>
                        <div>Floor Location: <span className="text-[#c5a880] font-medium">{prod.showroomLocation}</span></div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div>
                          <span className="text-xs text-slate-500 block">Retail Price</span>
                          <span className="text-lg font-bold text-[#c5a880]">
                            ${prod.price?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingProduct(prod)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-[#c5a880]/20 text-slate-300 hover:text-[#c5a880] transition-colors"
                            title="Edit Piece & Upload Google Drive Media"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition-colors"
                            title="Delete Piece"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* 6. MODULE: NOTIFICATION & ANNOUNCEMENTS */}
        {activeModule === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-white">Client Notifications & Broadcast Announcements</h2>
                <p className="text-xs text-slate-400">
                  Send targeted push notifications to individual patrons or blast announcements to all customers
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setNotifForm({ targetUserId: 'all', title: '', message: '', type: 'announcement' });
                  setShowSendNotification(true);
                }}
              >
                <Send className="w-4 h-4 mr-1.5" />
                New Announcement
              </Button>
            </div>

            <div className="bg-[#141822] border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white font-serif">Notification Dispatch Rules</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When an announcement is dispatched, it is automatically synchronized across the customer dashboard, in-app notification center, and dispatched via Google Firebase Cloud Messaging (FCM) to subscribed patrons.
              </p>
            </div>
          </div>
        )}


        {/* DEDICATED SHOWROOM & APP BRANDING MODULE */}
        {activeModule === 'shop_profile' && (
          <ShopProfileSettingsModule />
        )}

        {/* MEDIA & DOCUMENTS LIBRARY MODULE */}
        {activeModule === 'media_library' && (
          <AdminMediaLibraryModule />
        )}

        {/* DIRECT GOOGLE DRIVE CLOUD STORAGE MODULE */}
        {activeModule === 'cloud_storage' && (
          <CloudStorageSettingsModule />
        )}

        {/* WORKSHOP SHOWCASE MANAGEMENT MODULE */}
        {activeModule === 'workshop' && (
          <AdminWorkshopModule />
        )}

        {/* ADVANCED PAYMENT & BANK ACCOUNTS SETTINGS MODULE */}
        {activeModule === 'payment_settings' && (
          <AdminPaymentSettingsModule />
        )}

        {/* 7. MODULE: PROTECTED SUPER ADMIN SETTINGS AREA */}
        {activeModule === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-950/40 via-[#181d28] to-amber-950/20 border border-[#c5a880]/30 rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#c5a880]/20 text-[#c5a880]">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-white">
                    Protected Super Admin Settings Area
                  </h2>
                  <p className="text-xs text-slate-400">
                    High-security configuration for Google Drive 5TB Storage, Firebase Push, and Luxury Showroom Identity.
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Sub-navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setSettingsSubTab('general')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  settingsSubTab === 'general'
                    ? 'bg-[#c5a880] text-black shadow-md'
                    : 'bg-[#141822] text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                General Settings & Concierge
              </button>
              <button
                type="button"
                onClick={() => setSettingsSubTab('cloud_storage')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  settingsSubTab === 'cloud_storage'
                    ? 'bg-[#c5a880] text-black shadow-md'
                    : 'bg-[#141822] text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Cloud Storage (Google Drive 5TB)</span>
              </button>
            </div>

            {settingsSubTab === 'cloud_storage' ? (
              <CloudStorageSettingsModule />
            ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Google Drive 5TB Storage Box */}
              <div className="bg-[#141822] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[#c5a880]" />
                    Google Drive 5TB Enterprise Storage API
                  </h3>
                  <Badge variant="green">5.0 TB Storage Quota Connected</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Service Account Email</label>
                    <input
                      type="text"
                      value={settingsData?.googleDriveServiceAccountEmail || ''}
                      onChange={(e) =>
                        setSettingsData({ ...settingsData, googleDriveServiceAccountEmail: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Storage Root Folder ID</label>
                    <input
                      type="text"
                      value={settingsData?.googleDriveFolderId || ''}
                      onChange={(e) =>
                        setSettingsData({ ...settingsData, googleDriveFolderId: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Showroom & Concierge Branding */}
              <div className="bg-[#141822] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Showroom & Concierge Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Company Display Name</label>
                    <input
                      type="text"
                      value={settingsData?.companyName || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, companyName: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={settingsData?.currencySymbol || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, currencySymbol: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 mb-1">Showroom Address</label>
                    <input
                      type="text"
                      value={settingsData?.showroomAddress || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, showroomAddress: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Concierge Telephone</label>
                    <input
                      type="text"
                      value={settingsData?.supportPhone || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, supportPhone: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Concierge Email</label>
                    <input
                      type="text"
                      value={settingsData?.supportEmail || ''}
                      onChange={(e) => setSettingsData({ ...settingsData, supportEmail: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 mb-1">Website Top Announcement Banner</label>
                    <input
                      type="text"
                      value={settingsData?.websiteAnnouncementBanner || ''}
                      onChange={(e) =>
                        setSettingsData({ ...settingsData, websiteAnnouncementBanner: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="gold" size="lg" type="submit">
                  Save All Configurations
                </Button>
              </div>
            </form>
            )}
          </div>
        )}


        {/* 8. MODULE: AUDIT LOGS */}
        {activeModule === 'activity' && (
          <div className="space-y-6">
            <h2 className="text-lg font-serif font-bold text-white">Full Security & Activity Audit Trail</h2>
            <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">User</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {reports?.recentActivity?.map((act: any) => (
                      <tr key={act.id} className="hover:bg-white/[0.02]">
                        <td className="p-4 text-slate-400">
                          {new Date(act.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4 font-bold text-white">{act.userName}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[#c5a880] font-mono">
                            {act.action}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300">{act.details}</td>
                        <td className="p-4 text-slate-500 font-mono">{act.ipAddress || '127.0.0.1'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: CREATE CUSTOMER */}
      <Modal
        isOpen={showCreateCustomer}
        onClose={() => setShowCreateCustomer(false)}
        title="Create Customer Account"
        subtitle="Super Admin provisions credentials and shares with patron"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Full Patron Name *</label>
            <input
              type="text"
              required
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Lord Julian Sterling"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Email (Login ID) *</label>
              <input
                type="email"
                required
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="patron@example.com"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Initial Password *</label>
              <input
                type="text"
                required
                value={customerForm.password}
                onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="SecurePassword2026"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Telephone</label>
              <input
                type="text"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">First Started Business Date *</label>
              <input
                type="date"
                required
                value={customerForm.firstBusinessDate}
                onChange={(e) => setCustomerForm({ ...customerForm, firstBusinessDate: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Residence Address</label>
            <input
              type="text"
              value={customerForm.address}
              onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Private Estate, 100 Royal Crescent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowCreateCustomer(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Create Patron Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESET CUSTOMER PASSWORD */}
      <Modal
        isOpen={!!showResetPassword}
        onClose={() => setShowResetPassword(null)}
        title={`Reset Password: ${showResetPassword?.name}`}
        subtitle="Directly issue a new password for this patron"
        maxWidth="md"
      >
        <form onSubmit={handleResetCustomerPassword} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">New Password (at least 6 characters)</label>
            <input
              type="text"
              required
              minLength={6}
              value={newPasswordVal}
              onChange={(e) => setNewPasswordVal(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. NewSecret@2026"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowResetPassword(null)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Save New Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE MULTI-ITEM ORDER */}
      <MultiItemOrderBuilderModal
        isOpen={showCreateOrder}
        onClose={() => setShowCreateOrder(false)}
        onSuccess={refreshAllData}
        customersList={customersList}
        productsList={productsList}
        staffList={staffList}
      />

      {/* MODAL: UPDATE ORDER PROGRESS */}
      <Modal
        isOpen={!!showEditOrderProgress}
        onClose={() => setShowEditOrderProgress(null)}
        title={`Update Order: ${showEditOrderProgress?.orderNumber}`}
        subtitle="Manage manufacturing stages, completion percentage, and delivery status"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateOrderProgress} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Furniture Production Stage (16-Stage Master Flow)</label>
              <select
                value={showEditOrderProgress?.productionStage || 'order_placed'}
                onChange={(e) => {
                  const newStage = e.target.value;
                  const found = FURNITURE_PRODUCTION_STAGES.find((s) => s.id === newStage);
                  setShowEditOrderProgress({
                    ...showEditOrderProgress,
                    productionStage: newStage,
                    productionProgress: found ? found.pct : showEditOrderProgress.productionProgress,
                  });
                }}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium"
              >
                {FURNITURE_PRODUCTION_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">
                Progress Percentage ({showEditOrderProgress?.productionProgress || 0}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={showEditOrderProgress?.productionProgress || 0}
                onChange={(e) =>
                  setShowEditOrderProgress({ ...showEditOrderProgress, productionProgress: e.target.value })
                }
                className="w-full accent-[#c5a880] mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">
              Artisan Progress Description / Timeline Milestone Note
            </label>
            <textarea
              rows={2}
              value={showEditOrderProgress?.progressDescription || ''}
              onChange={(e) =>
                setShowEditOrderProgress({ ...showEditOrderProgress, progressDescription: e.target.value })
              }
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500"
              placeholder="e.g. Master carpenter has completed joinery; moving to 28-point frame inspection..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Overall Order Status</label>
              <select
                value={showEditOrderProgress?.orderStatus || ''}
                onChange={(e) =>
                  setShowEditOrderProgress({ ...showEditOrderProgress, orderStatus: e.target.value })
                }
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="pending">Pending</option>
                <option value="in_production">In Production</option>
                <option value="quality_check">Quality Check</option>
                <option value="ready_for_dispatch">Ready for Dispatch</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Delivery Status</label>
              <select
                value={showEditOrderProgress?.deliveryStatus || ''}
                onChange={(e) =>
                  setShowEditOrderProgress({ ...showEditOrderProgress, deliveryStatus: e.target.value })
                }
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">White-Glove Driver Name</label>
              <input
                type="text"
                value={showEditOrderProgress?.deliveryDriverName || ''}
                onChange={(e) =>
                  setShowEditOrderProgress({ ...showEditOrderProgress, deliveryDriverName: e.target.value })
                }
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="Marcus Vance Transport"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Driver Phone</label>
              <input
                type="text"
                value={showEditOrderProgress?.deliveryDriverPhone || ''}
                onChange={(e) =>
                  setShowEditOrderProgress({ ...showEditOrderProgress, deliveryDriverPhone: e.target.value })
                }
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowEditOrderProgress(null)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Save Order Updates
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: UPLOAD ORDER MEDIA (PHOTOS & VIDEOS) */}
      <Modal
        isOpen={!!showUploadMedia}
        onClose={() => setShowUploadMedia(null)}
        title={`Upload Workshop Media: ${showUploadMedia?.orderNumber}`}
        subtitle="Dispatches directly to patron's gallery and syncs with 5TB Cloud Vault"
        maxWidth="md"
      >
        <form onSubmit={handleUploadOrderMedia} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Media Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="photo"
                  checked={mediaUploadForm.mediaType === 'photo'}
                  onChange={() => setMediaUploadForm({ ...mediaUploadForm, mediaType: 'photo' })}
                />
                <span className="text-white">Photograph</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={mediaUploadForm.mediaType === 'video'}
                  onChange={() => setMediaUploadForm({ ...mediaUploadForm, mediaType: 'video' })}
                />
                <span className="text-white">Artisan Video Clip</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Caption / Title *</label>
            <input
              type="text"
              required
              value={mediaUploadForm.title}
              onChange={(e) => setMediaUploadForm({ ...mediaUploadForm, title: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Multi-layer French Polish Hand-Rubbed Finish"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Production Stage</label>
            <select
              value={mediaUploadForm.stage}
              onChange={(e) => setMediaUploadForm({ ...mediaUploadForm, stage: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              {FURNITURE_PRODUCTION_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Upload Photo or Video to Google Drive (5TB Cloud Storage)</label>
            <input
              type="file"
              accept="image/*,video/mp4"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !showUploadMedia) return;
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  fd.append('orderId', showUploadMedia.id);
                  fd.append('category', 'Customer Orders');
                  fd.append('title', mediaUploadForm.title || `${showUploadMedia.orderNumber} Workshop Milestone`);
                  const res = await fetch('/api/admin/google-drive/upload', {
                    method: 'POST',
                    body: fd,
                  });
                  const json = await res.json();
                  if (res.ok && json.media) {
                    setMediaUploadForm((prev) => ({
                      ...prev,
                      url: json.media.url || json.media.viewUrl,
                      mediaType: json.media.mediaType,
                    }));
                    alert(`Uploaded ${file.name} directly to Google Drive!`);
                  } else {
                    alert(json.error || 'Upload failed');
                  }
                } catch (err: any) {
                  alert(err.message || 'Error uploading file');
                }
              }}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-[#B99A68] file:text-slate-950 file:font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Media URL or Google Drive Link</label>
            <input
              type="text"
              value={mediaUploadForm.url}
              onChange={(e) => setMediaUploadForm({ ...mediaUploadForm, url: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Auto-filled from upload above or enter external link"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowUploadMedia(null)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Upload & Sync to Cloud
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECORD PAYMENT */}
      <Modal
        isOpen={!!showRecordPayment}
        onClose={() => setShowRecordPayment(null)}
        title={`Record Payment: ${showRecordPayment?.orderNumber}`}
        subtitle="Generates verified official receipt and updates remaining balance"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">
              Payment Amount ($) * (Remaining: ${showRecordPayment?.remainingBalance?.toLocaleString()})
            </label>
            <input
              type="number"
              required
              min={1}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-base font-bold"
              placeholder="3500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="Bank Transfer">Bank Transfer (Wire)</option>
                <option value="Cash">Cash at Showroom</option>
                <option value="JazzCash">JazzCash Mobile Wallet</option>
                <option value="EasyPaisa">EasyPaisa Mobile Wallet</option>
                <option value="Other">Other Certified Channel</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Payment Type</label>
              <select
                value={paymentForm.paymentType}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="Progress Installment">Progress Installment</option>
                <option value="Final Balance">Final Balance Settlement</option>
                <option value="Initial Deposit">Initial Deposit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Notes / Transaction Reference</label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Wire transfer ref WIRE-998811"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowRecordPayment(null)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Confirm & Issue Official Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE STAFF */}
      <Modal
        isOpen={showCreateStaff}
        onClose={() => setShowCreateStaff(false)}
        title="Create Staff Account"
        subtitle="Super Admin delegates granular module permissions"
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Staff Member Name *</label>
            <input
              type="text"
              required
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Tariq Mansour"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="staff@saadfurniture.com"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Password *</label>
              <input
                type="text"
                required
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="StaffSecret2026"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 font-bold text-[#c5a880]">
              Assign Authorized Modules (Super Admin decides access):
            </label>
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-white/5">
              {[
                { id: 'orders', label: 'Order Manager (Create & update orders, stages)' },
                { id: 'media', label: 'Media Manager (Upload workshop photos & videos)' },
                { id: 'delivery', label: 'Delivery Manager (Logistics, dispatch, drivers)' },
                { id: 'accounts', label: 'Accounts Manager (Record payments & receipts)' },
                { id: 'products', label: 'Product Manager (Catalog, stock & prices)' },
              ].map((m) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffForm.permissions.includes(m.id)}
                    onChange={() => handleToggleStaffPermission(m.id)}
                    className="accent-[#c5a880] w-4 h-4"
                  />
                  <span className="text-white text-xs">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowCreateStaff(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Provision Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE / EDIT PRODUCT WITH GOOGLE DRIVE MEDIA */}
      <ProductMediaUploadModal
        isOpen={showCreateProduct || !!editingProduct}
        existingProduct={editingProduct}
        onClose={() => {
          setShowCreateProduct(false);
          setEditingProduct(null);
        }}
        onSuccess={refreshAllData}
      />

      {/* MODAL: VIEW DETAILED ORDER DOSSIER & MULTI-ITEM SPECIFICATIONS */}
      <AdminOrderDetailsModal
        orderId={selectedOrderForView}
        isOpen={!!selectedOrderForView}
        onClose={() => setSelectedOrderForView(null)}
        onRefresh={refreshAllData}
      />

      {/* MODAL: BROADCAST / INDIVIDUAL NOTIFICATION */}
      <Modal
        isOpen={showSendNotification}
        onClose={() => setShowSendNotification(false)}
        title={
          notifForm.targetUserId === 'all'
            ? 'Broadcast Announcement to All Patrons'
            : 'Send Direct Notification to Patron'
        }
        subtitle="Dispatches in-app alert & Firebase Cloud Messaging (FCM) push"
        maxWidth="md"
      >
        <form onSubmit={handleSendNotification} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Recipient</label>
            <select
              value={notifForm.targetUserId}
              onChange={(e) => setNotifForm({ ...notifForm, targetUserId: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              <option value="all">📢 All Customers (Broadcast Announcement)</option>
              {customersList.map((c) => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Subject / Headline *</label>
            <input
              type="text"
              required
              value={notifForm.title}
              onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Private Showroom Exhibition: Italian Marble Arrival"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Notification Message *</label>
            <textarea
              rows={3}
              required
              value={notifForm.message}
              onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Enter message text..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowSendNotification(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Send Notification
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: UPDATE DELIVERY STAGE */}
      {showUpdateDeliveryModal && (
        <Modal
          isOpen={!!showUpdateDeliveryModal}
          onClose={() => setShowUpdateDeliveryModal(null)}
          title="Update White-Glove Delivery Milestone"
          subtitle={`Destination: ${showUpdateDeliveryModal.deliveryAddress}`}
          maxWidth="md"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch(`/api/delivery/${showUpdateDeliveryModal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  deliveryStage: showUpdateDeliveryModal.deliveryStage,
                  assignedDeliveryStaff: showUpdateDeliveryModal.assignedDeliveryStaff,
                  assignedDeliveryStaffPhone: showUpdateDeliveryModal.assignedDeliveryStaffPhone,
                  deliveryTimeWindow: showUpdateDeliveryModal.deliveryTimeWindow,
                  notes: showUpdateDeliveryModal.deliveryNotes,
                }),
              });
              setShowUpdateDeliveryModal(null);
              refreshAllData();
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Delivery Milestone Stage</label>
              <select
                value={showUpdateDeliveryModal.deliveryStage}
                onChange={(e) =>
                  setShowUpdateDeliveryModal({ ...showUpdateDeliveryModal, deliveryStage: e.target.value })
                }
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="preparing_for_dispatch">1. Preparing for Dispatch</option>
                <option value="packing_completed">2. Packing Completed (Crated)</option>
                <option value="ready_for_dispatch">3. Ready for Dispatch (Staging Passed)</option>
                <option value="dispatched">4. Dispatched from Hub</option>
                <option value="out_for_delivery">5. Out for White-Glove Delivery</option>
                <option value="delivered_successfully">6. Delivered Successfully & Inspected</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Driver / Specialist Name</label>
                <input
                  type="text"
                  value={showUpdateDeliveryModal.assignedDeliveryStaff || ''}
                  onChange={(e) =>
                    setShowUpdateDeliveryModal({ ...showUpdateDeliveryModal, assignedDeliveryStaff: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="Omar Farooq"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Driver Phone</label>
                <input
                  type="text"
                  value={showUpdateDeliveryModal.assignedDeliveryStaffPhone || ''}
                  onChange={(e) =>
                    setShowUpdateDeliveryModal({ ...showUpdateDeliveryModal, assignedDeliveryStaffPhone: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="+1 (800) 555-SAAD"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Time Window</label>
              <input
                type="text"
                value={showUpdateDeliveryModal.deliveryTimeWindow || ''}
                onChange={(e) =>
                  setShowUpdateDeliveryModal({ ...showUpdateDeliveryModal, deliveryTimeWindow: e.target.value })
                }
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="10:00 AM - 02:00 PM"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Dispatch / Assembly Notes</label>
              <textarea
                rows={2}
                value={showUpdateDeliveryModal.deliveryNotes || ''}
                onChange={(e) =>
                  setShowUpdateDeliveryModal({ ...showUpdateDeliveryModal, deliveryNotes: e.target.value })
                }
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="Assembly team equipped with leveling tools..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setShowUpdateDeliveryModal(null)}>
                Cancel
              </Button>
              <Button variant="gold" type="submit">
                Commit Delivery Update
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
