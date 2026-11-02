'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  Layers,
  Truck,
  CreditCard,
  UploadCloud,
  RefreshCw,
  Sparkles,
  Download,
  ArrowUpDown,
  ShieldAlert,
  FileText,
  User,
  ShoppingBag,
  ExternalLink,
  Sliders,
  Check,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AdminOrderDetailsModal } from '@/components/admin/AdminOrderDetailsModal';
import { MultiItemOrderBuilderModal } from '@/components/admin/MultiItemOrderBuilderModal';

export interface ProductionStageItem {
  id: string;
  label: string;
  pct: number;
}

export const FURNITURE_STAGES: ProductionStageItem[] = [
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

export const STAGE_LABEL_MAP: Record<string, string> = {
  order_placed: 'Order Placed',
  order_confirmed: 'Order Confirmed',
  design_measurements: 'Design & Measurements',
  material_preparation: 'Material Preparation',
  frame_cutting: 'Frame Cutting & Prep',
  frame_assembly: 'Frame Assembly',
  frame_inspection: 'Frame Inspection',
  foam_work: 'Foam Work',
  fabric_cutting_stitching: 'Fabric Cutting & Stitching',
  upholstery_work: 'Upholstery Work',
  polishing_finishing: 'Polishing & Finishing',
  quality_inspection: 'Quality Inspection',
  ready_for_delivery: 'Ready for Delivery',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  // Legacy aliases
  wood_cutting: 'Precision Timber Cutting',
  carving_joinery: 'Hand Carving & Joinery',
  upholstery: 'Bespoke Upholstery',
  final_inspection: 'Master QA Inspection',
  completed: 'Completed & Certified',
  material_selection: 'Material Selection',
  manufacturing_started: 'Manufacturing Started',
  frame_preparation: 'Frame Preparation',
  foam_upholstery: 'Foam & Upholstery',
};

interface AdminOrderManagementModuleProps {
  orders: any[];
  customers: any[];
  products: any[];
  staff: any[];
  onRefresh: () => void;
}

export function AdminOrderManagementModule({
  orders,
  customers,
  products,
  staff,
  onRefresh,
}: AdminOrderManagementModuleProps) {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'showroom' | 'online'>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'total_desc' | 'balance_desc' | 'progress_desc'>('date_desc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<any | null>(null);
  const [manageStagesOrder, setManageStagesOrder] = useState<any | null>(null);
  const [uploadMediaOrder, setUploadMediaOrder] = useState<any | null>(null);
  const [recordPaymentOrder, setRecordPaymentOrder] = useState<any | null>(null);
  const [deleteCancelOrder, setDeleteCancelOrder] = useState<any | null>(null);

  // Stage Management form state
  const [stageForm, setStageForm] = useState({
    stage: 'order_confirmed',
    progress: 12,
    description: '',
    orderStatus: 'in_production',
    deliveryStatus: 'pending',
    estimatedDeliveryDate: '',
    deliveryDriverName: '',
    deliveryDriverPhone: '',
    isDelayed: false,
    delayReason: '',
  });

  // Media Upload form state
  const [mediaForm, setMediaForm] = useState({
    title: '',
    description: '',
    stage: 'order_confirmed',
    mediaType: 'photo',
    productId: '',
    files: [] as File[],
    isUploading: false,
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Bank Transfer',
    type: 'Progress Installment',
    reference: '',
    notes: '',
    isSubmitting: false,
  });

  // Cancellation form state
  const [cancelReason, setCancelReason] = useState('');
  const [cancelAction, setCancelAction] = useState<'cancel' | 'delete'>('cancel');
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Dashboard Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    let newOrders = 0;
    let pending = 0;
    let manufacturing = 0;
    let readyForDelivery = 0;
    let dispatched = 0;
    let completed = 0;
    let cancelled = 0;
    let totalRevenue = 0;
    let totalOutstanding = 0;

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const ord of orders) {
      totalRevenue += Number(ord.totalAmount) || 0;
      totalOutstanding += Number(ord.remainingBalance) || 0;

      const st = (ord.orderStatus || '').toLowerCase();
      const stage = (ord.productionStage || '').toLowerCase();
      const ordDate = new Date(ord.createdAt || 0).getTime();

      if (st === 'cancelled') {
        cancelled++;
      } else if (st === 'delivered' || stage === 'delivered') {
        completed++;
      } else if (st === 'out_for_delivery' || stage === 'out_for_delivery' || stage === 'dispatched' || ord.deliveryStatus === 'dispatched') {
        dispatched++;
      } else if (st === 'ready_for_delivery' || st === 'ready_for_dispatch' || stage === 'ready_for_delivery') {
        readyForDelivery++;
      } else if (st === 'in_production' || (stage && stage !== 'order_placed' && stage !== 'order_confirmed')) {
        manufacturing++;
      } else if (st === 'pending' || (ord.paidAmount || 0) === 0) {
        pending++;
      }

      if (ordDate >= sevenDaysAgo && st !== 'cancelled') {
        newOrders++;
      }
    }

    return {
      total,
      newOrders,
      pending,
      manufacturing,
      readyForDelivery,
      dispatched,
      completed,
      cancelled,
      totalRevenue,
      totalOutstanding,
    };
  }, [orders]);

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cleanDigits = q.replace(/[^0-9]/g, '');
        const num = (ord.orderNumber || '').toLowerCase();
        const custName = (ord.customerName || '').toLowerCase();
        const custPhone = (ord.customerPhone || '').toLowerCase();
        const cleanPhone = custPhone.replace(/[^0-9]/g, '');
        const phoneDigitsMatch = cleanDigits.length >= 2 && cleanPhone.includes(cleanDigits);
        const custEmail = (ord.customerEmail || '').toLowerCase();
        const prod = (ord.productName || '').toLowerCase();

        const matchesSearch =
          num.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          phoneDigitsMatch ||
          custEmail.includes(q) ||
          prod.includes(q);

        if (!matchesSearch) return false;
      }

      // 2. Channel Filter
      if (channelFilter === 'showroom' && ord.orderType === 'online') return false;
      if (channelFilter === 'online' && ord.orderType !== 'online') return false;

      // 3. Status Filter
      if (statusFilter !== 'all') {
        const st = (ord.orderStatus || '').toLowerCase();
        const stage = (ord.productionStage || '').toLowerCase();

        if (statusFilter === 'new') {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          if (new Date(ord.createdAt || 0).getTime() < sevenDaysAgo || st === 'cancelled') return false;
        } else if (statusFilter === 'pending') {
          if (st !== 'pending' && (ord.paidAmount || 0) > 0) return false;
        } else if (statusFilter === 'manufacturing') {
          if (st !== 'in_production' && (!stage || stage === 'order_placed' || stage === 'delivered' || st === 'cancelled')) {
            return false;
          }
        } else if (statusFilter === 'ready_for_delivery') {
          if (st !== 'ready_for_delivery' && st !== 'ready_for_dispatch' && stage !== 'ready_for_delivery') return false;
        } else if (statusFilter === 'dispatched') {
          if (st !== 'out_for_delivery' && stage !== 'out_for_delivery' && stage !== 'dispatched' && ord.deliveryStatus !== 'dispatched') {
            return false;
          }
        } else if (statusFilter === 'delivered') {
          if (st !== 'delivered' && stage !== 'delivered') return false;
        } else if (statusFilter === 'cancelled') {
          if (st !== 'cancelled') return false;
        }
      }

      // 4. Stage Filter
      if (stageFilter !== 'all' && ord.productionStage !== stageFilter) {
        return false;
      }

      // 5. Date Filter
      if (dateFilter !== 'all') {
        const ordTime = new Date(ord.createdAt || 0).getTime();
        const now = Date.now();
        if (dateFilter === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (ordTime < startOfToday) return false;
        } else if (dateFilter === '7days') {
          if (ordTime < now - 7 * 24 * 60 * 60 * 1000) return false;
        } else if (dateFilter === '30days') {
          if (ordTime < now - 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'total_desc') {
        return (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0);
      }
      if (sortBy === 'balance_desc') {
        return (Number(b.remainingBalance) || 0) - (Number(a.remainingBalance) || 0);
      }
      if (sortBy === 'progress_desc') {
        return (Number(b.productionProgress) || 0) - (Number(a.productionProgress) || 0);
      }
      return 0;
    });
  }, [orders, searchQuery, statusFilter, channelFilter, stageFilter, dateFilter, sortBy]);

  // Open Stage Modal
  const openManageStages = (ord: any) => {
    setManageStagesOrder(ord);
    const stageObj = FURNITURE_STAGES.find((s) => s.id === ord.productionStage);
    setStageForm({
      stage: ord.productionStage || 'order_confirmed',
      progress: ord.productionProgress ?? (stageObj ? stageObj.pct : 10),
      description: '',
      orderStatus: ord.orderStatus || 'in_production',
      deliveryStatus: ord.deliveryStatus || 'pending',
      estimatedDeliveryDate: ord.estimatedDeliveryDate ? ord.estimatedDeliveryDate.substring(0, 10) : '',
      deliveryDriverName: ord.deliveryDriverName || '',
      deliveryDriverPhone: ord.deliveryDriverPhone || '',
      isDelayed: Boolean(ord.isDelayed),
      delayReason: ord.delayReason || '',
    });
  };

  // Submit Stage Modal
  const handleSaveStageProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageStagesOrder) return;

    try {
      const res = await fetch(`/api/orders/${manageStagesOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionStage: stageForm.stage,
          productionProgress: Number(stageForm.progress),
          progressDescription: stageForm.description || undefined,
          orderStatus: stageForm.orderStatus,
          deliveryStatus: stageForm.deliveryStatus,
          estimatedDeliveryDate: stageForm.estimatedDeliveryDate || undefined,
          deliveryDriverName: stageForm.deliveryDriverName || undefined,
          deliveryDriverPhone: stageForm.deliveryDriverPhone || undefined,
          isDelayed: stageForm.isDelayed,
          delayReason: stageForm.isDelayed ? stageForm.delayReason : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update order stage.');
      }

      setManageStagesOrder(null);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating order progress.');
    }
  };

  // Open Media Modal
  const openUploadMedia = (ord: any) => {
    setUploadMediaOrder(ord);
    setMediaForm({
      title: `${ord.orderNumber} Workshop Milestone`,
      description: '',
      stage: ord.productionStage || 'order_confirmed',
      mediaType: 'photo',
      productId: '',
      files: [],
      isUploading: false,
    });
  };

  // Submit Media Upload
  const handleSaveMediaUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadMediaOrder) return;
    if (mediaForm.files.length === 0 && !mediaForm.description) {
      alert('Please select at least one photo/video file or enter an update note.');
      return;
    }

    setMediaForm((prev) => ({ ...prev, isUploading: true }));

    try {
      const fd = new FormData();
      for (const file of mediaForm.files) {
        fd.append('files', file);
      }
      fd.append('title', mediaForm.title);
      if (mediaForm.description) fd.append('description', mediaForm.description);
      fd.append('stage', mediaForm.stage);
      if (mediaForm.productId) fd.append('productId', mediaForm.productId);
      fd.append('visibility', 'customer');

      const res = await fetch(`/api/orders/${uploadMediaOrder.id}/media`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload media.');
      }

      alert('Workshop media successfully uploaded to Google Drive & patron notified!');
      setUploadMediaOrder(null);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error uploading media.');
    } finally {
      setMediaForm((prev) => ({ ...prev, isUploading: false }));
    }
  };

  // Open Record Payment Modal
  const openRecordPayment = (ord: any) => {
    setRecordPaymentOrder(ord);
    setPaymentForm({
      amount: ord.remainingBalance > 0 ? String(ord.remainingBalance) : '',
      method: 'Bank Transfer',
      type: ord.paidAmount === 0 ? 'Initial Deposit' : ord.remainingBalance > 0 ? 'Progress Installment' : 'Final Balance Settlement',
      reference: `PAY-${Date.now().toString().slice(-6)}`,
      notes: '',
      isSubmitting: false,
    });
  };

  // Submit Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordPaymentOrder) return;
    const num = Number(paymentForm.amount);
    if (!num || num <= 0) {
      alert('Please enter a valid positive payment amount.');
      return;
    }

    setPaymentForm((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: recordPaymentOrder.id,
          amount: num,
          paymentMethod: paymentForm.method,
          paymentType: paymentForm.type,
          transactionReference: paymentForm.reference,
          notes: paymentForm.notes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment.');
      }

      alert('Payment successfully logged and official receipt generated!');
      setRecordPaymentOrder(null);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error recording payment.');
    } finally {
      setPaymentForm((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Open Cancel / Delete Modal
  const openDeleteCancel = (ord: any) => {
    setDeleteCancelOrder(ord);
    setCancelReason('');
    setCancelAction('cancel');
    setIsDeleting(false);
  };

  // Submit Cancel / Delete
  const handleSaveCancelDelete = async () => {
    if (!deleteCancelOrder) return;
    setIsDeleting(true);

    try {
      if (cancelAction === 'delete') {
        const res = await fetch(`/api/orders/${deleteCancelOrder.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to delete order.');
        }
        alert(`Order ${deleteCancelOrder.orderNumber} permanently deleted.`);
      } else {
        const res = await fetch(`/api/orders/${deleteCancelOrder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderStatus: 'cancelled',
            progressDescription: cancelReason || 'Order officially cancelled by administration.',
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to cancel order.');
        }
        alert(`Order ${deleteCancelOrder.orderNumber} marked as cancelled and patron notified.`);
      }

      setDeleteCancelOrder(null);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error processing request.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Status Transition
  const handleQuickStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update status.');
      }
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error updating status.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = [
      'Order Number',
      'Order Date',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Delivery Address',
      'Product / Commission',
      'Items Count',
      'Total Amount (PKR)',
      'Paid Amount (PKR)',
      'Remaining Balance (PKR)',
      'Manufacturing Stage',
      'Progress %',
      'Order Status',
      'Delivery Status',
      'Order Type',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleDateString()}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.customerPhone || '').replace(/"/g, '""')}"`,
      `"${(o.customerEmail || '').replace(/"/g, '""')}"`,
      `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
      `"${(o.productName || '').replace(/"/g, '""')}"`,
      o.items ? o.items.length : 1,
      o.totalAmount || 0,
      o.paidAmount || 0,
      o.remainingBalance || 0,
      `"${STAGE_LABEL_MAP[o.productionStage] || o.productionStage || 'Confirmed'}"`,
      `${o.productionProgress || 0}%`,
      `"${o.orderStatus || 'in_production'}"`,
      `"${o.deliveryStatus || 'pending'}"`,
      `"${o.orderType || 'showroom'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Saad_Furniture_Orders_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#141822] via-[#1a202c] to-[#141822] p-5 rounded-2xl border border-white/10 shadow-2xl">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide">
              Order Management Center
            </h1>
            <Badge variant="gold">Master Control</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Real-time management for all bespoke commissions, showroom orders, and online store sales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-slate-300 hover:text-white border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-[#c5a880]' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportCSV}
            className="text-slate-300 hover:text-white border border-white/10"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="shadow-lg shadow-[#c5a880]/20 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create New Order
          </Button>
        </div>
      </div>

      {/* 2. Dashboard Metrics Summary Grid (8 Interactive Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Orders */}
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
            statusFilter === 'all'
              ? 'bg-[#c5a880]/15 border-[#c5a880] ring-1 ring-[#c5a880]'
              : 'bg-[#141822] border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Orders</span>
            <Layers className="w-3.5 h-3.5 text-[#c5a880]" />
          </div>
          <div className="text-xl font-bold font-serif text-white">{metrics.total}</div>
          <div className="text-[10px] text-[#c5a880] mt-0.5 truncate font-medium">
            PKR {metrics.totalRevenue.toLocaleString()}
          </div>
        </button>

        {/* New Orders */}
        <button
          type="button"
          onClick={() => setStatusFilter('new')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'new'
              ? 'bg-blue-500/15 border-blue-400 ring-1 ring-blue-400'
              : 'bg-[#141822] border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">New</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-serif text-white">{metrics.newOrders}</div>
          <div className="text-[10px] text-blue-300/80 mt-0.5">Last 7 days</div>
        </button>

        {/* Pending Orders */}
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400'
              : 'bg-[#141822] border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Pending</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-serif text-white">{metrics.pending}</div>
          <div className="text-[10px] text-amber-300/80 mt-0.5">Awaiting Start</div>
        </button>

        {/* In Manufacturing */}
        <button
          type="button"
          onClick={() => setStatusFilter('manufacturing')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'manufacturing'
              ? 'bg-purple-500/15 border-purple-400 ring-1 ring-purple-400'
              : 'bg-[#141822] border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Workshop</span>
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-serif text-white">{metrics.manufacturing}</div>
          <div className="text-[10px] text-purple-300/80 mt-0.5">In Production</div>
        </button>

        {/* Ready for Delivery */}
        <button
          type="button"
          onClick={() => setStatusFilter('ready_for_delivery')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'ready_for_delivery'
              ? 'bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400'
              : 'bg-[#141822] border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Ready</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-serif text-white">{metrics.readyForDelivery}</div>
          <div className="text-[10px] text-cyan-300/80 mt-0.5">Passed QA</div>
        </button>

        {/* Dispatched */}
        <button
          type="button"
          onClick={() => setStatusFilter('dispatched')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'dispatched'
              ? 'bg-indigo-500/15 border-indigo-400 ring-1 ring-indigo-400'
              : 'bg-[#141822] border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Dispatched</span>
            <Truck className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-serif text-white">{metrics.dispatched}</div>
          <div className="text-[10px] text-indigo-300/80 mt-0.5">In Transit</div>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setStatusFilter('delivered')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'delivered'
              ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400'
              : 'bg-[#141822] border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Delivered</span>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-serif text-white">{metrics.completed}</div>
          <div className="text-[10px] text-emerald-300/80 mt-0.5">Completed</div>
        </button>

        {/* Cancelled */}
        <button
          type="button"
          onClick={() => setStatusFilter('cancelled')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'cancelled'
              ? 'bg-rose-500/15 border-rose-400 ring-1 ring-rose-400'
              : 'bg-[#141822] border-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Cancelled</span>
            <X className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-serif text-white">{metrics.cancelled}</div>
          <div className="text-[10px] text-rose-300/80 mt-0.5">Archived</div>
        </button>
      </div>

      {/* 3. Search and Multi-Filter Bar */}
      <div className="bg-[#141822] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Universal Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer name, mobile digits (e.g. last 4-5 digits), email, product..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Channel Selector */}
          <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setChannelFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                channelFilter === 'all' ? 'bg-[#c5a880] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Channels
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter('showroom')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                channelFilter === 'showroom' ? 'bg-[#c5a880] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Showroom
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter('online')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                channelFilter === 'online' ? 'bg-[#c5a880] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Online Store
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="date_desc" className="bg-slate-900">Newest First</option>
              <option value="date_asc" className="bg-slate-900">Oldest First</option>
              <option value="total_desc" className="bg-slate-900">Highest Total Amount</option>
              <option value="balance_desc" className="bg-slate-900">Highest Unpaid Balance</option>
              <option value="progress_desc" className="bg-slate-900">Highest Progress %</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mr-1">
              Filter By:
            </span>

            {/* Stage Selector */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-[#c5a880]"
            >
              <option value="all">All 16 Manufacturing Stages</option>
              {FURNITURE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.pct}%)
                </option>
              ))}
            </select>

            {/* Date Preset */}
            <select
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-[#c5a880]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(searchQuery || statusFilter !== 'all' || channelFilter !== 'all' || stageFilter !== 'all' || dateFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setChannelFilter('all');
                  setStageFilter('all');
                  setDateFilter('all');
                }}
                className="text-[11px] text-rose-400 hover:text-rose-300 underline font-medium"
              >
                Clear All Filters
              </button>
            )}
            <span className="text-slate-400 text-xs">
              Showing <strong className="text-white">{filteredOrders.length}</strong> of{' '}
              <strong className="text-white">{orders.length}</strong> orders
            </span>
          </div>
        </div>
      </div>

      {/* 4. Orders Table / Cards */}
      <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-white/10">
              <Layers className="w-6 h-6 text-[#c5a880]" />
            </div>
            <h3 className="text-base font-serif font-bold text-white mb-1">No Orders Match Your Criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Try adjusting your search terms, changing the status filter, or create a new bespoke commission.
            </p>
            <Button variant="gold" size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create New Order
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181d28] text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-white/10">
                <tr>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items / Product</th>
                  <th className="p-4">Financials</th>
                  <th className="p-4">Manufacturing Stage</th>
                  <th className="p-4">Delivery & Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredOrders.map((ord) => {
                  const stageObj = FURNITURE_STAGES.find((s) => s.id === ord.productionStage);
                  const stageLabel = STAGE_LABEL_MAP[ord.productionStage] || ord.productionStage?.replace(/_/g, ' ') || 'Order Confirmed';
                  const progressPct = ord.productionProgress ?? (stageObj ? stageObj.pct : 10);
                  const isPaidInFull = (ord.remainingBalance || 0) <= 0;

                  return (
                    <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* 1. Order Ref */}
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-1.5 mb-1">
                          <button
                            type="button"
                            onClick={() => setViewOrderId(ord.id)}
                            className="font-bold text-white font-serif text-sm hover:text-[#c5a880] underline transition-colors"
                          >
                            {ord.orderNumber}
                          </button>
                          {ord.orderType === 'online' ? (
                            <Badge variant="blue">Online</Badge>
                          ) : (
                            <Badge variant="neutral">Showroom</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        {ord.isDelayed === 1 && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            DELAY NOTICE
                          </div>
                        )}
                      </td>

                      {/* 2. Customer */}
                      <td className="p-4 align-top">
                        <div className="font-semibold text-white text-xs">{ord.customerName}</div>
                        {ord.customerPhone && (
                          <a
                            href={`tel:${ord.customerPhone}`}
                            className="text-[11px] text-slate-400 hover:text-[#c5a880] flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            {ord.customerPhone}
                          </a>
                        )}
                        {ord.customerEmail && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                            {ord.customerEmail}
                          </div>
                        )}
                        {ord.deliveryAddress && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            {ord.deliveryAddress}
                          </div>
                        )}
                      </td>

                      {/* 3. Items / Product */}
                      <td className="p-4 align-top max-w-[220px]">
                        <div className="font-medium text-white truncate" title={ord.productName}>
                          {ord.productName || 'Bespoke Furniture Piece'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {ord.items && ord.items.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[#e5caa2]">
                              <Layers className="w-3 h-3" />
                              {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'} (Qty:{' '}
                              {ord.items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0)})
                            </span>
                          ) : (
                            <span>Qty: {ord.quantity || 1}</span>
                          )}
                        </div>
                        {ord.dimensions && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Dim: {ord.dimensions}
                          </div>
                        )}
                      </td>

                      {/* 4. Financials */}
                      <td className="p-4 align-top whitespace-nowrap">
                        <div className="font-bold text-white font-serif text-sm">
                          PKR {(ord.totalAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Paid: PKR {(ord.paidAmount || 0).toLocaleString()}
                        </div>
                        <div className="mt-1">
                          {isPaidInFull ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                              <Check className="w-2.5 h-2.5" /> Paid in Full
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                              Bal: PKR {(ord.remainingBalance || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Manufacturing Stage */}
                      <td className="p-4 align-top min-w-[170px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-[#e5caa2] truncate">{stageLabel}</span>
                          <span className="font-bold text-white font-mono">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPct === 100
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-[#c5a880] to-[#e5caa2]'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        {ord.expectedCompletionDate && (
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            Target:{' '}
                            {new Date(ord.expectedCompletionDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </td>

                      {/* 6. Delivery & Status */}
                      <td className="p-4 align-top whitespace-nowrap">
                        <div className="mb-1">
                          <Badge
                            variant={
                              ord.orderStatus === 'delivered'
                                ? 'green'
                                : ord.orderStatus === 'cancelled'
                                ? 'red'
                                : ord.orderStatus === 'ready_for_delivery' || ord.orderStatus === 'ready_for_dispatch'
                                ? 'amber'
                                : ord.orderStatus === 'out_for_delivery' || ord.deliveryStatus === 'dispatched'
                                ? 'blue'
                                : 'gold'
                            }
                          >
                            {ord.orderStatus?.replace(/_/g, ' ') || 'In Production'}
                          </Badge>
                        </div>
                        {ord.estimatedDeliveryDate && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Truck className="w-2.5 h-2.5 text-slate-500" />
                            ETA: {new Date(ord.estimatedDeliveryDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="p-4 align-top text-right space-x-1 whitespace-nowrap">
                        {/* Dossier Modal */}
                        <button
                          type="button"
                          onClick={() => setViewOrderId(ord.id)}
                          className="p-1.5 rounded-lg bg-[#c5a880]/20 hover:bg-[#c5a880] text-[#e5caa2] hover:text-slate-950 transition-colors inline-block"
                          title="View Full Order Dossier & Timeline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Order Modal */}
                        <button
                          type="button"
                          onClick={() => setEditOrder(ord)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#c5a880] hover:text-slate-950 text-slate-200 transition-colors inline-block"
                          title="Edit Customer, Line Items, & Pricing"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Manage Stages Modal */}
                        <button
                          type="button"
                          onClick={() => openManageStages(ord)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#c5a880] hover:text-slate-950 text-slate-200 transition-colors inline-block"
                          title="Manage 16 Manufacturing Stages & Delivery"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>

                        {/* Upload Progress Media Modal */}
                        <button
                          type="button"
                          onClick={() => openUploadMedia(ord)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 transition-colors inline-block"
                          title="Upload Workshop Photos / Videos to Google Drive"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                        </button>

                        {/* Record Payment */}
                        <button
                          type="button"
                          onClick={() => openRecordPayment(ord)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 transition-colors inline-block"
                          title="Record Payment / Official Receipt"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel / Delete */}
                        <button
                          type="button"
                          onClick={() => openDeleteCancel(ord)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 transition-colors inline-block"
                          title="Cancel or Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL: CREATE MULTI-ITEM ORDER */}
      <MultiItemOrderBuilderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={async () => {
          setShowCreateModal(false);
          await onRefresh();
        }}
        customersList={customers}
        productsList={products}
        staffList={staff}
      />

      {/* 6. MODAL: VIEW DOSSIER (AdminOrderDetailsModal) */}
      <AdminOrderDetailsModal
        orderId={viewOrderId}
        isOpen={Boolean(viewOrderId)}
        onClose={() => setViewOrderId(null)}
        onRefresh={onRefresh}
      />

      {/* 7. MODAL: MANAGE MANUFACTURING STAGES & WHITE-GLOVE LOGISTICS */}
      <Modal
        isOpen={Boolean(manageStagesOrder)}
        onClose={() => setManageStagesOrder(null)}
        title={`Manufacturing & Logistics: ${manageStagesOrder?.orderNumber}`}
        subtitle="Manage the 16-stage furniture workflow, milestone notes, and white-glove fleet"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveStageProgress} className="space-y-4 text-xs">
          {/* 16-Stage Visual Timeline Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Select Active Manufacturing Stage (16-Stage Master Flow)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-white/10">
              {FURNITURE_STAGES.map((s) => {
                const isSelected = stageForm.stage === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStageForm((prev) => ({
                        ...prev,
                        stage: s.id,
                        progress: s.pct,
                      }));
                    }}
                    className={`p-2 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-[#c5a880]/20 border-[#c5a880] text-white ring-1 ring-[#c5a880]'
                        : 'bg-slate-900/80 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold truncate text-[11px]">{s.label}</div>
                    <div className="text-[10px] text-[#c5a880] font-mono mt-0.5">{s.pct}% completed</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Progress Slider */}
          <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-medium">
                Fine-Tune Progress Percentage
              </label>
              <span className="font-mono font-bold text-white text-sm bg-slate-800 px-2 py-0.5 rounded border border-white/10">
                {stageForm.progress}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={stageForm.progress}
              onChange={(e) => setStageForm({ ...stageForm, progress: Number(e.target.value) })}
              className="w-full accent-[#c5a880] cursor-pointer"
            />
          </div>

          {/* Milestone Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Craftsman Progress Note / Milestone Description
            </label>
            <textarea
              rows={2}
              value={stageForm.description}
              onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
              placeholder="e.g. Master joinery completed and verified against CAD blueprints; transferring to French Polish salon..."
            />
          </div>

          {/* Status Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Overall Order Status</label>
              <select
                value={stageForm.orderStatus}
                onChange={(e) => setStageForm({ ...stageForm, orderStatus: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              >
                <option value="pending">Pending</option>
                <option value="in_production">In Production</option>
                <option value="quality_check">Quality Check</option>
                <option value="ready_for_delivery">Ready for Delivery</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Logistics / Delivery Status</label>
              <select
                value={stageForm.deliveryStatus}
                onChange={(e) => setStageForm({ ...stageForm, deliveryStatus: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              >
                <option value="pending">Pending Dispatch</option>
                <option value="scheduled">Scheduled</option>
                <option value="dispatched">Dispatched</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered to Patron</option>
              </select>
            </div>
          </div>

          {/* Logistics & Driver */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Delivery Date</label>
              <input
                type="date"
                value={stageForm.estimatedDeliveryDate}
                onChange={(e) => setStageForm({ ...stageForm, estimatedDeliveryDate: e.target.value })}
                className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Assigned Driver Name</label>
              <input
                type="text"
                value={stageForm.deliveryDriverName}
                onChange={(e) => setStageForm({ ...stageForm, deliveryDriverName: e.target.value })}
                placeholder="Direct Fleet Driver"
                className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Driver Phone Number</label>
              <input
                type="text"
                value={stageForm.deliveryDriverPhone}
                onChange={(e) => setStageForm({ ...stageForm, deliveryDriverPhone: e.target.value })}
                placeholder="+92 300 0000000"
                className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          {/* Delay Notice Toggle */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stageForm.isDelayed}
                onChange={(e) => setStageForm({ ...stageForm, isDelayed: e.target.checked })}
                className="rounded accent-amber-500 w-4 h-4"
              />
              <span className="font-semibold text-amber-300">
                Issue Official Schedule Revision / Delay Notice
              </span>
            </label>

            {stageForm.isDelayed && (
              <div>
                <input
                  type="text"
                  value={stageForm.delayReason}
                  onChange={(e) => setStageForm({ ...stageForm, delayReason: e.target.value })}
                  placeholder="Reason for delay (e.g. Extended wood curing cycle for maximum longevity)..."
                  className="w-full p-2 bg-slate-900 border border-amber-500/30 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setManageStagesOrder(null)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Save Progress & Notify Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. MODAL: UPLOAD WORKSHOP PROGRESS MEDIA TO GOOGLE DRIVE */}
      <Modal
        isOpen={Boolean(uploadMediaOrder)}
        onClose={() => setUploadMediaOrder(null)}
        title={`Workshop Media Upload: ${uploadMediaOrder?.orderNumber}`}
        subtitle="Upload high-resolution photographs & video clips directly to patron's gallery"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveMediaUpload} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Media Title / Caption *</label>
            <input
              type="text"
              required
              value={mediaForm.title}
              onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
              placeholder="e.g. Master Polishing & Hand-Rubbed Finish"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Production Stage</label>
              <select
                value={mediaForm.stage}
                onChange={(e) => setMediaForm({ ...mediaForm, stage: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              >
                {FURNITURE_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Associated Piece / Item</label>
              <select
                value={mediaForm.productId}
                onChange={(e) => setMediaForm({ ...mediaForm, productId: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              >
                <option value="">Entire Commission (All Items)</option>
                {uploadMediaOrder?.items?.map((it: any) => (
                  <option key={it.id} value={it.productId || it.id}>
                    {it.productTitle} ({it.skuSnapshot || 'Piece'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Select Photos or Video Clips
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/mp4,video/quicktime,video/webm"
              onChange={(e) => {
                if (e.target.files) {
                  setMediaForm({ ...mediaForm, files: Array.from(e.target.files) });
                }
              }}
              className="w-full p-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-[#c5a880] file:text-slate-950 file:font-bold hover:file:bg-[#b0936b] cursor-pointer"
            />
            {mediaForm.files.length > 0 && (
              <div className="mt-2 text-[11px] text-[#e5caa2] font-medium">
                {mediaForm.files.length} {mediaForm.files.length === 1 ? 'file' : 'files'} selected for cloud upload
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">Artisan Milestone Notes (Optional)</label>
            <textarea
              rows={2}
              value={mediaForm.description}
              onChange={(e) => setMediaForm({ ...mediaForm, description: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
              placeholder="Provide craft context to the patron regarding techniques, joinery, or curing..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              variant="ghost"
              type="button"
              disabled={mediaForm.isUploading}
              onClick={() => setUploadMediaOrder(null)}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              type="submit"
              disabled={mediaForm.isUploading}
            >
              {mediaForm.isUploading ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading to Drive...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" /> Upload & Notify Customer
                </span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 9. MODAL: RECORD PAYMENT & RECEIPT */}
      <Modal
        isOpen={Boolean(recordPaymentOrder)}
        onClose={() => setRecordPaymentOrder(null)}
        title={`Record Payment: ${recordPaymentOrder?.orderNumber}`}
        subtitle="Issues official receipt and updates remaining balance in real time"
        maxWidth="md"
      >
        <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
          {/* Outstanding Balance Banner */}
          <div className="bg-slate-900/80 border border-white/10 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Commission Total</div>
              <div className="text-sm font-bold text-white font-serif">
                PKR {(recordPaymentOrder?.totalAmount || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Paid So Far</div>
              <div className="text-sm font-bold text-emerald-400 font-serif">
                PKR {(recordPaymentOrder?.paidAmount || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Remaining Due</div>
              <div className="text-sm font-bold text-rose-400 font-serif">
                PKR {(recordPaymentOrder?.remainingBalance || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">Payment Amount (PKR) *</label>
              {recordPaymentOrder?.remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentForm({ ...paymentForm, amount: String(recordPaymentOrder.remainingBalance) })}
                  className="text-[10px] text-[#c5a880] hover:underline"
                >
                  Pay Full Balance
                </button>
              )}
            </div>
            <input
              type="number"
              required
              min={1}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-base font-bold focus:outline-none focus:border-[#c5a880]"
              placeholder="e.g. 50000"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              >
                <option value="Bank Transfer">Bank Wire / Transfer</option>
                <option value="Cash">Cash at Showroom</option>
                <option value="JazzCash">JazzCash Mobile Wallet</option>
                <option value="EasyPaisa">EasyPaisa Mobile Wallet</option>
                <option value="PayFast Card">Card via PayFast</option>
                <option value="Cheque">Banker's Cheque</option>
                <option value="Other">Other Certified Channel</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Payment Type</label>
              <select
                value={paymentForm.type}
                onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#c5a880]"
              >
                <option value="Initial Deposit">Initial Deposit (Advance)</option>
                <option value="Progress Installment">Progress Milestone Installment</option>
                <option value="Final Balance">Final Balance Settlement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Transaction Reference / Cheque #</label>
            <input
              type="text"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
              placeholder="e.g. HBL-FT-998811"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Official Notes / Remarks</label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
              placeholder="e.g. Received at Gulberg boutique showroom"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              variant="ghost"
              type="button"
              disabled={paymentForm.isSubmitting}
              onClick={() => setRecordPaymentOrder(null)}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              type="submit"
              disabled={paymentForm.isSubmitting}
            >
              {paymentForm.isSubmitting ? 'Recording...' : 'Record Payment & Issue Receipt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 10. MODAL: EDIT ORDER (Full Editing with Recalculation) */}
      {editOrder && (
        <EditOrderModal
          order={editOrder}
          isOpen={Boolean(editOrder)}
          onClose={() => setEditOrder(null)}
          onSuccess={async () => {
            setEditOrder(null);
            await onRefresh();
          }}
          productsList={products}
          staffList={staff}
        />
      )}

      {/* 11. MODAL: CANCEL / DELETE ORDER */}
      <Modal
        isOpen={Boolean(deleteCancelOrder)}
        onClose={() => setDeleteCancelOrder(null)}
        title={`Cancel or Delete: ${deleteCancelOrder?.orderNumber}`}
        subtitle="Manage commission termination or permanent record deletion"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-300">Choose Action</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Marking as <strong>Cancelled</strong> preserves audit history, accounting ledgers, and notifies the patron.
                <strong>Permanent Deletion</strong> completely removes all items, media links, and database records.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-white/10 hover:border-white/20 bg-slate-900/60">
              <input
                type="radio"
                name="cancelAction"
                value="cancel"
                checked={cancelAction === 'cancel'}
                onChange={() => setCancelAction('cancel')}
                className="accent-[#c5a880]"
              />
              <div>
                <span className="font-semibold text-white block">Mark as Cancelled (Recommended)</span>
                <span className="text-[10px] text-slate-400">Preserves order records and logs cancellation note in patron timeline</span>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-white/10 hover:border-rose-500/40 bg-slate-900/60">
              <input
                type="radio"
                name="cancelAction"
                value="delete"
                checked={cancelAction === 'delete'}
                onChange={() => setCancelAction('delete')}
                className="accent-rose-500"
              />
              <div>
                <span className="font-semibold text-rose-400 block">Permanently Delete from Database</span>
                <span className="text-[10px] text-slate-400">Irreversible action; completely wipes order and associated line items</span>
              </div>
            </label>
          </div>

          {cancelAction === 'cancel' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Cancellation Reason *</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Patron requested cancellation prior to timber cutting..."
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              variant="ghost"
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteCancelOrder(null)}
            >
              Back
            </Button>
            <Button
              variant={cancelAction === 'delete' ? 'danger' : 'gold'}
              type="button"
              disabled={isDeleting}
              onClick={handleSaveCancelDelete}
            >
              {isDeleting
                ? 'Processing...'
                : cancelAction === 'delete'
                ? 'Permanently Delete'
                : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// -------------------------------------------------------------
// SUBCOMPONENT: FULL EDIT ORDER MODAL
// -------------------------------------------------------------
interface EditOrderModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productsList: any[];
  staffList: any[];
}

function EditOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
  productsList,
  staffList,
}: EditOrderModalProps) {
  // Customer details
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(order.customerEmail || '');
  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress || '');

  // Dates and Staff
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(
    order.expectedCompletionDate ? order.expectedCompletionDate.substring(0, 10) : ''
  );
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(
    order.estimatedDeliveryDate ? order.estimatedDeliveryDate.substring(0, 10) : ''
  );
  const [assignedStaffId, setAssignedStaffId] = useState(order.assignedStaffId || '');
  const [specialInstructions, setSpecialInstructions] = useState(order.specialInstructions || '');

  // Multi-items state
  const initialItems = useMemo(() => {
    if (order.items && order.items.length > 0) {
      return order.items.map((it: any) => ({
        id: it.id,
        productId: it.productId || '',
        productTitle: it.productTitle || it.title || 'Bespoke Piece',
        skuSnapshot: it.skuSnapshot || it.sku || 'SF-ITEM',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        discount: it.discount || 0,
        customDetails: it.customDetails || '',
        specifications: it.specifications || '',
      }));
    }
    return [
      {
        id: `temp_${Date.now()}`,
        productId: '',
        productTitle: order.productName || 'Bespoke Furniture Commission',
        skuSnapshot: 'SF-BESPOKE',
        quantity: order.quantity || 1,
        unitPrice: order.totalAmount || 0,
        discount: 0,
        customDetails: order.customDesignDetails || '',
        specifications: order.dimensions || '',
      },
    ];
  }, [order]);

  const [items, setItems] = useState<any[]>(initialItems);
  const [orderDiscount, setOrderDiscount] = useState(Number(order.discount) || 0);
  const [deliveryCharges, setDeliveryCharges] = useState(Number(order.deliveryCharges) || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Calculations
  const calculatedSubtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const q = Math.max(1, Number(it.quantity) || 1);
      const p = Math.max(0, Number(it.unitPrice) || 0);
      const d = Math.max(0, Number(it.discount) || 0);
      return acc + Math.max(0, q * p - d);
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    return Math.max(0, calculatedSubtotal - orderDiscount + deliveryCharges);
  }, [calculatedSubtotal, orderDiscount, deliveryCharges]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, grandTotal - (order.paidAmount || 0));
  }, [grandTotal, order.paidAmount]);

  // Add Item Row
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item_new_${Date.now()}`,
        productId: '',
        productTitle: 'Custom Handcrafted Piece',
        skuSnapshot: `SF-ITEM-${Math.floor(100 + Math.random() * 900)}`,
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        customDetails: '',
        specifications: '',
      },
    ]);
  };

  // Remove Item Row
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('An order must have at least one piece.');
      return;
    }
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Update Item Field
  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // If selecting a product from catalogue
    if (field === 'productId') {
      const found = productsList.find((p) => p.id === value);
      if (found) {
        updated[index].productTitle = found.title;
        updated[index].unitPrice = found.price || 0;
        updated[index].skuSnapshot = found.sku || `SF-${found.id.slice(0, 6).toUpperCase()}`;
        if (found.dimensions) updated[index].specifications = `Dimensions: ${found.dimensions}`;
      }
    }

    setItems(updated);
  };

  // Submit Edit Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const staffObj = staffList.find((s) => s.id === assignedStaffId);

      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress,
          expectedCompletionDate: expectedCompletionDate || undefined,
          estimatedDeliveryDate: estimatedDeliveryDate || undefined,
          assignedStaffId: assignedStaffId || undefined,
          assignedStaffName: staffObj ? staffObj.name : undefined,
          specialInstructions,
          discount: orderDiscount,
          deliveryCharges,
          items,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update order.');
      }

      alert('Order specifications and line items updated successfully!');
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Error updating order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Order: ${order.orderNumber}`}
      subtitle="Modify line items, quantities, bespoke specifications, and customer details"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Customer Information Section */}
        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-3.5 space-y-3">
          <div className="font-semibold text-white text-xs flex items-center gap-1.5 border-b border-white/5 pb-1.5">
            <User className="w-3.5 h-3.5 text-[#c5a880]" />
            Customer & Delivery Destination
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Customer Phone Number *</label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Delivery Address</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>
        </div>

        {/* Multi-Item Line Items Editor */}
        <div className="bg-slate-900/60 border border-white/10 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <div className="font-semibold text-white text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#c5a880]" />
              Commission Line Items ({items.length})
            </div>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={handleAddItem}
              className="py-1 px-2.5 text-[11px]"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Another Piece
            </Button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((it, idx) => {
              const lineTotal = Math.max(0, (it.quantity || 1) * (it.unitPrice || 0) - (it.discount || 0));

              return (
                <div
                  key={it.id || idx}
                  className="bg-slate-950 p-3 rounded-xl border border-white/10 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#c5a880]">
                      Piece #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                        title="Remove piece"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 text-[10px] mb-0.5">Title / Description</label>
                      <input
                        type="text"
                        required
                        value={it.productTitle}
                        onChange={(e) => handleItemChange(idx, 'productTitle', e.target.value)}
                        placeholder="e.g. Master Chesterfield 3-Seater Sofa"
                        className="w-full p-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] mb-0.5">Catalogue Link</label>
                      <select
                        value={it.productId || ''}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#c5a880]"
                      >
                        <option value="">(Custom Piece)</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-0.5">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs text-center font-bold focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] mb-0.5">Unit Price (PKR)</label>
                      <input
                        type="number"
                        min={0}
                        value={it.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs text-right font-mono focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] mb-0.5">Discount (PKR)</label>
                      <input
                        type="number"
                        min={0}
                        value={it.discount}
                        onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                        className="w-full p-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs text-right font-mono focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] mb-0.5">Line Total</label>
                      <div className="p-1.5 bg-slate-900/60 border border-white/5 rounded-lg text-[#e5caa2] font-mono font-bold text-right text-xs">
                        PKR {lineTotal.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={it.specifications || ''}
                      onChange={(e) => handleItemChange(idx, 'specifications', e.target.value)}
                      placeholder="Dimensions / Specs (e.g. 84W x 36D x 34H in)"
                      className="p-1.5 bg-slate-900 border border-white/10 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-[#c5a880]"
                    />
                    <input
                      type="text"
                      value={it.customDetails || ''}
                      onChange={(e) => handleItemChange(idx, 'customDetails', e.target.value)}
                      placeholder="Fabric / Polish / Custom details"
                      className="p-1.5 bg-slate-900 border border-white/10 rounded-lg text-slate-300 text-[11px] focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Breakdown & Live Recalculation */}
        <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3.5 space-y-2">
          <div className="font-semibold text-white text-xs border-b border-white/5 pb-1 flex items-center justify-between">
            <span>Financial Recalculation</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Subtotal: PKR {calculatedSubtotal.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[10px] mb-0.5">Overall Order Discount (PKR)</label>
              <input
                type="number"
                min={0}
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#c5a880]"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] mb-0.5">Delivery Charges (PKR)</label>
              <input
                type="number"
                min={0}
                value={deliveryCharges}
                onChange={(e) => setDeliveryCharges(Math.max(0, Number(e.target.value) || 0))}
                className="w-full p-2 bg-slate-950 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#c5a880]"
              />
            </div>
          </div>

          {/* Grand Total & Balances Bar */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Grand Total</span>
              <span className="text-sm font-bold text-white font-serif">
                PKR {grandTotal.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Advance Paid</span>
              <span className="text-sm font-bold text-emerald-400 font-serif">
                PKR {(order.paidAmount || 0).toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Remaining Balance</span>
              <span className={`text-sm font-bold font-serif ${remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                PKR {remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Dates & Staff */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Target Completion Date</label>
            <input
              type="date"
              value={expectedCompletionDate}
              onChange={(e) => setExpectedCompletionDate(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Estimated Delivery Date</label>
            <input
              type="date"
              value={estimatedDeliveryDate}
              onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#c5a880]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Assigned Staff Artisan</label>
            <select
              value={assignedStaffId}
              onChange={(e) => setAssignedStaffId(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-[#c5a880]"
            >
              <option value="">(None assigned)</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">Special Workshop Instructions</label>
          <textarea
            rows={2}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Artisanal specifications, bespoke customer requests, wood curing notes..."
            className="w-full p-2 bg-slate-900 border border-white/10 rounded-lg text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#c5a880]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <Button variant="ghost" type="button" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving Changes...' : 'Save & Recalculate Order'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
