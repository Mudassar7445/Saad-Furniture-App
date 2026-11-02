'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  CreditCard,
  Layers,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  FileText,
  UploadCloud,
  Edit,
  Plus,
  Settings,
  Shield,
  Activity,
  Play,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { DEFAULT_ORDER_STAGES, OrderStage } from '@/lib/constants/orderStages';
import { OrderCraftingGallery } from '@/components/orders/OrderCraftingGallery';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params?.id as string;
  const queryTab = searchParams?.get('tab');
  const queryFilter = searchParams?.get('filter');

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [galleryStageFilter, setGalleryStageFilter] = useState<string | null>(null);

  const galleryRef = useRef<HTMLDivElement>(null);
  const stagesRef = useRef<HTMLDivElement>(null);
  const specsRef = useRef<HTMLDivElement>(null);
  const financeRef = useRef<HTMLDivElement>(null);

  // Delivery & Reversal State
  const [deliveryRecord, setDeliveryRecord] = useState<any>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<any[]>([]);
  const [showUpdateDeliveryModal, setShowUpdateDeliveryModal] = useState(false);
  const [reversalPaymentTarget, setReversalPaymentTarget] = useState<any>(null);
  const [reversalReasonInput, setReversalReasonInput] = useState('');
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryStage: 'preparing_for_dispatch',
    notes: '',
    assignedDeliveryStaff: '',
    assignedDeliveryStaffPhone: '',
    deliveryTimeWindow: '',
    photographUrl: '',
    deliveryConfirmationSignature: '',
  });

  // Modals
  const [showUpdateStageModal, setShowUpdateStageModal] = useState(false);
  const [showCustomizeStagesModal, setShowCustomizeStagesModal] = useState(false);
  const [showUploadMediaModal, setShowUploadMediaModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [activeMediaPreview, setActiveMediaPreview] = useState<any>(null);

  // Forms
  const [stageForm, setStageForm] = useState({
    stageId: '',
    stageName: '',
    progressPercentage: 10,
    progressDescription: '',
    orderStatus: 'in_production',
    customStatus: '',
    isDelayed: false,
    delayReason: '',
    expectedCompletionDate: '',
  });

  const [customStagesList, setCustomStagesList] = useState<OrderStage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageDesc, setNewStageDesc] = useState('');
  const [newStagePercentage, setNewStagePercentage] = useState(50);

  const [mediaForm, setMediaForm] = useState({
    title: '',
    stage: 'frame_preparation',
    mediaType: 'photo',
    url: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer',
    paymentType: 'Progress Installment',
    notes: '',
  });

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (!loading && order && queryTab) {
      const timer = setTimeout(() => {
        if (queryTab === 'media' && galleryRef.current) {
          galleryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if ((queryTab === 'stages' || queryTab === 'timeline') && stagesRef.current) {
          stagesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if ((queryTab === 'specifications' || queryTab === 'details') && specsRef.current) {
          specsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if ((queryTab === 'finance' || queryTab === 'payments') && financeRef.current) {
          financeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, order, queryTab]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (!authRes.ok || !authData.user) {
        router.push('/');
        return;
      }
      setCurrentUser(authData.user);

      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        throw new Error('Order not found');
      }
      const data = await res.json();
      setOrder(data.order);
      setItems(data.items || []);
      setMedia(data.media || []);
      setTimeline(data.timeline || []);
      setPayments(data.payments || []);

      // Load custom stages or fallback to default
      let parsedCustomStages: OrderStage[] = [];
      try {
        parsedCustomStages = data.order.customStages ? JSON.parse(data.order.customStages) : [];
      } catch {
        parsedCustomStages = [];
      }
      const stagesToUse = parsedCustomStages.length > 0 ? parsedCustomStages : DEFAULT_ORDER_STAGES;
      setCustomStagesList(stagesToUse);

      // Pre-fill stage form
      setStageForm({
        stageId: data.order.productionStage || 'order_confirmed',
        stageName: stagesToUse.find((s) => s.id === data.order.productionStage)?.name || 'Order Confirmed',
        progressPercentage: data.order.productionProgress || 10,
        progressDescription: '',
        orderStatus: data.order.orderStatus || 'in_production',
        customStatus: data.order.customStatus || '',
        isDelayed: !!data.order.isDelayed,
        delayReason: data.order.delayReason || '',
        expectedCompletionDate: data.order.expectedCompletionDate || '',
      });

      // Load delivery dossier
      try {
        const delivRes = await fetch(`/api/delivery?orderId=${orderId}`);
        if (delivRes.ok) {
          const delivData = await delivRes.json();
          if (delivData.deliveries && delivData.deliveries.length > 0) {
            const currentDeliv = delivData.deliveries[0];
            setDeliveryRecord(currentDeliv);
            setDeliveryForm({
              deliveryStage: currentDeliv.deliveryStage || 'preparing_for_dispatch',
              notes: currentDeliv.deliveryNotes || '',
              assignedDeliveryStaff: currentDeliv.assignedDeliveryStaff || data.order.deliveryDriverName || 'Saad Logistics',
              assignedDeliveryStaffPhone: currentDeliv.assignedDeliveryStaffPhone || data.order.deliveryDriverPhone || '+1 (800) 555-SAAD',
              deliveryTimeWindow: currentDeliv.deliveryTimeWindow || '10:00 AM - 02:00 PM',
              photographUrl: '',
              deliveryConfirmationSignature: currentDeliv.deliveryConfirmationSignature || '',
            });

            const histRes = await fetch(`/api/delivery/${currentDeliv.id}`);
            if (histRes.ok) {
              const histData = await histRes.json();
              setDeliveryHistory(histData.history || []);
            }
          }
        }
      } catch (delivErr) {
        console.error('Error fetching delivery:', delivErr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedStageObj = customStagesList.find((s) => s.id === stageForm.stageId);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionStage: stageForm.stageId,
          stageName: selectedStageObj?.name || stageForm.stageName,
          productionProgress: Number(stageForm.progressPercentage),
          progressDescription: stageForm.progressDescription,
          orderStatus: stageForm.orderStatus,
          customStatus: stageForm.customStatus,
          isDelayed: stageForm.isDelayed,
          delayReason: stageForm.delayReason,
          expectedCompletionDate: stageForm.expectedCompletionDate,
        }),
      });

      if (res.ok) {
        setShowUpdateStageModal(false);
        loadOrderDetails();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update order stage');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCustomStages = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customStages: customStagesList,
        }),
      });
      if (res.ok) {
        setShowCustomizeStagesModal(false);
        alert('Customized stages saved for this commission.');
        loadOrderDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustomStage = () => {
    if (!newStageName.trim()) return;
    const newId = `stage_${Date.now()}`;
    const newStage: OrderStage = {
      id: newId,
      name: newStageName.trim(),
      description: newStageDesc.trim() || 'Custom manufacturing milestone.',
      defaultPercentage: Number(newStagePercentage),
    };
    const updated = [...customStagesList, newStage].sort((a, b) => a.defaultPercentage - b.defaultPercentage);
    setCustomStagesList(updated);
    setNewStageName('');
    setNewStageDesc('');
  };

  const handleRemoveCustomStage = (id: string) => {
    if (customStagesList.length <= 3) {
      alert('Order must have at least 3 stages.');
      return;
    }
    setCustomStagesList(customStagesList.filter((s) => s.id !== id));
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/orders/${orderId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mediaForm.title,
          stage: mediaForm.stage,
          mediaType: mediaForm.mediaType,
          url:
            mediaForm.url ||
            (mediaForm.mediaType === 'video'
              ? 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-piece-of-wood-41584-large.mp4'
              : 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80'),
        }),
      });
      if (res.ok) {
        setShowUploadMediaModal(false);
        setMediaForm({ title: '', stage: 'frame_preparation', mediaType: 'photo', url: '' });
        loadOrderDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: Number(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          paymentType: paymentForm.paymentType,
          notes: paymentForm.notes,
        }),
      });
      if (res.ok) {
        setShowRecordPaymentModal(false);
        setPaymentForm({ amount: '', paymentMethod: 'Bank Transfer', paymentType: 'Progress Installment', notes: '' });
        loadOrderDetails();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let photosArr: string[] = [];
      if (deliveryRecord?.deliveryPhotographs) {
        try {
          photosArr = JSON.parse(deliveryRecord.deliveryPhotographs);
        } catch {
          photosArr = [];
        }
      }
      if (deliveryForm.photographUrl.trim()) {
        photosArr.push(deliveryForm.photographUrl.trim());
      }

      if (deliveryRecord?.id) {
        const res = await fetch(`/api/delivery/${deliveryRecord.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryStage: deliveryForm.deliveryStage,
            notes: deliveryForm.notes,
            assignedDeliveryStaff: deliveryForm.assignedDeliveryStaff,
            assignedDeliveryStaffPhone: deliveryForm.assignedDeliveryStaffPhone,
            deliveryTimeWindow: deliveryForm.deliveryTimeWindow,
            deliveryPhotographs: photosArr,
            deliveryConfirmationSignature: deliveryForm.deliveryConfirmationSignature,
          }),
        });
        if (res.ok) {
          setShowUpdateDeliveryModal(false);
          loadOrderDetails();
        }
      } else {
        const res = await fetch('/api/delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            deliveryAddress: order.deliveryAddress,
            customerContactNumber: order.customerPhone || 'N/A',
            expectedDeliveryDate: order.expectedCompletionDate,
            deliveryTimeWindow: deliveryForm.deliveryTimeWindow || '10:00 AM - 02:00 PM',
            assignedDeliveryStaff: deliveryForm.assignedDeliveryStaff || 'Saad Logistics',
            assignedDeliveryStaffPhone: deliveryForm.assignedDeliveryStaffPhone || '+1 (800) 555-SAAD',
            deliveryNotes: deliveryForm.notes,
          }),
        });
        if (res.ok) {
          setShowUpdateDeliveryModal(false);
          loadOrderDetails();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReversePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalPaymentTarget || !reversalReasonInput.trim()) return;

    try {
      const res = await fetch(`/api/payments/${reversalPaymentTarget.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reversalReason: reversalReasonInput.trim() }),
      });
      if (res.ok) {
        setReversalPaymentTarget(null);
        setReversalReasonInput('');
        loadOrderDetails();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reverse payment');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif tracking-widest text-[#c5a880] uppercase text-xs">
            Retrieving Commission Dossier & Timeline...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 text-[#c5a880] mx-auto" />
          <h2 className="text-xl font-serif text-white">Order Not Found</h2>
          <Link href="/" className="text-xs text-[#c5a880] underline">
            Return to Saad Showroom
          </Link>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isStaff = currentUser?.role === 'staff';
  const canManageOrder = isSuperAdmin || (isStaff && currentUser?.permissions?.includes('orders'));
  const canUploadMedia = isSuperAdmin || (isStaff && currentUser?.permissions?.includes('media'));
  const canManageAccounts = isSuperAdmin || (isStaff && currentUser?.permissions?.includes('accounts'));
  const canManageDelivery = isSuperAdmin || (isStaff && currentUser?.permissions?.includes('delivery'));

  // Calculate current stage index
  const currentStageIndex = customStagesList.findIndex((s) => s.id === order.productionStage);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 selection:bg-[#c5a880]/30 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-[#121620] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isSuperAdmin) router.push('/admin');
                else if (isStaff) router.push('/staff');
                else router.push('/portal');
              }}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-[#c5a880] text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex flex-col">
              <span className="font-serif tracking-widest text-sm font-bold text-white uppercase flex items-center gap-2">
                SAAD <span className="text-[#c5a880]">COMMISSION DOSSIER</span>
              </span>
              <span className="text-[10px] tracking-wider text-slate-400">
                Official Order Tracking & Artisan Production Records
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={`/api/receipts/${payments[0]?.paymentNumber || 'SF-RECEIPT'}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-[#c5a880]" />
              Print Dossier / Receipt
            </a>

            {canManageOrder && (
              <Button
                variant="gold"
                size="sm"
                onClick={() => setShowUpdateStageModal(true)}
                className="text-xs font-bold"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Update Stage & Status
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        {/* Delayed Notice Banner */}
        {order.isDelayed === 1 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  Artisanal Curing Notice / Schedule Revision
                </span>
                <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                  {order.delayReason || 'Extended timber curing & finishing required to uphold Saad museum-grade standards.'}
                </p>
              </div>
            </div>
            {order.expectedCompletionDate && (
              <div className="text-right whitespace-nowrap">
                <span className="text-[10px] text-slate-400 block uppercase">Revised Target ETA</span>
                <span className="text-xs sm:text-sm font-bold text-amber-300">
                  {new Date(order.expectedCompletionDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Cancelled Notice Banner */}
        {order.orderStatus === 'cancelled' && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 shadow-xl">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">
                Order Cancelled
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                This commission has been cancelled. Please consult with the Saad showroom concierge for balance handling.
              </p>
            </div>
          </div>
        )}

        {/* Header Overview Card */}
        <section className="bg-gradient-to-r from-[#141822] via-[#161c29] to-[#121620] border border-[#c5a880]/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#c5a880]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-wide">
                  {order.orderNumber}
                </h1>
                <Badge
                  variant={
                    order.orderStatus === 'delivered'
                      ? 'green'
                      : order.orderStatus === 'cancelled'
                      ? 'red'
                      : order.isDelayed
                      ? 'amber'
                      : 'gold'
                  }
                  className="px-3 py-1 text-xs uppercase tracking-wider"
                >
                  {order.customStatus || order.orderStatus?.replace('_', ' ')}
                </Badge>
                {order.isDelayed === 1 && <Badge variant="amber">Delayed Notice</Badge>}
              </div>

              <p className="text-sm text-[#e5caa2] font-serif font-semibold mt-2">
                {order.productName || 'Bespoke Luxury Furniture Piece'}
              </p>

              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#c5a880]" />
                  Order Placed:{' '}
                  <strong className="text-white ml-1">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#c5a880]" />
                  Target Completion:{' '}
                  <strong className="text-white ml-1">
                    {order.expectedCompletionDate
                      ? new Date(order.expectedCompletionDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Scheduled per workshop stages'}
                  </strong>
                </span>
                {order.assignedStaffName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-blue-300">
                      <Shield className="w-3.5 h-3.5" />
                      Assigned Master Artisan:{' '}
                      <strong className="text-white ml-1">{order.assignedStaffName}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Circular Progress & Percentage Gauge */}
            <div className="flex items-center gap-6 bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-white/5">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#c5a880] transition-all duration-1000 ease-out"
                    strokeDasharray={`${order.productionProgress}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-bold font-serif text-white">
                    {order.productionProgress}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                  Current Stage
                </span>
                <span className="text-sm font-bold text-[#e5caa2] font-serif block">
                  {customStagesList[activeIndex]?.name || order.productionStage?.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Stage {activeIndex + 1} of {customStagesList.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* VISUAL ORDER TRACKING TIMELINE */}
        <section ref={stagesRef} className="bg-[#141822] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
                  Visual Order Tracking Timeline
                </h2>
                <Badge variant="gold">Real-Time Workshop Stream</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Live progression verified by Saad master artisans and workshop cameras
              </p>
            </div>

            {isSuperAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomizeStagesModal(true)}
                className="text-xs"
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Customize Order Stages ({customStagesList.length})
              </Button>
            )}
          </div>

          {/* Animated Horizontal / Vertical Stage Track */}
          <div className="py-4">
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-11 gap-2 relative">
              {customStagesList.map((stg, idx) => {
                const isPassed = idx < activeIndex;
                const isCurrent = idx === activeIndex;
                const isUpcoming = idx > activeIndex;

                return (
                  <div key={stg.id} className="flex lg:flex-col items-start lg:items-center gap-3 lg:gap-2 relative group">
                    {/* Connection line on desktop */}
                    {idx < customStagesList.length - 1 && (
                      <div
                        className={`hidden lg:block absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors duration-500 ${
                          isPassed ? 'bg-[#c5a880]' : 'bg-slate-800'
                        }`}
                      />
                    )}

                    {/* Step Node */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all relative z-10 shrink-0 ${
                        isCurrent
                          ? 'bg-gradient-to-br from-[#c5a880] to-[#b09065] text-slate-950 ring-4 ring-[#c5a880]/30 shadow-lg shadow-[#c5a880]/30 scale-110'
                          : isPassed
                          ? 'bg-[#c5a880] text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-700 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
                    </div>

                    {/* Label & Description */}
                    <div className="flex-1 lg:text-center">
                      <span
                        className={`text-xs font-semibold block leading-tight ${
                          isCurrent
                            ? 'text-[#e5caa2] font-bold'
                            : isPassed
                            ? 'text-slate-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {stg.name}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 hidden sm:block">
                        {stg.description}
                      </p>
                      {isCurrent && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#c5a880]/20 text-[#e5caa2] text-[9px] font-bold uppercase tracking-wider animate-pulse">
                          Active In Atelier
                        </span>
                      )}

                      {/* Stage Media Count & Gallery Link */}
                      {(() => {
                        const stgMedia = media.filter((m) => {
                          const ms = (m.stage || '').toLowerCase().replace(/[\s-]+/g, '_');
                          const ss = stg.id.toLowerCase().replace(/[\s-]+/g, '_');
                          return ms === ss || ms.includes(ss) || ss.includes(ms);
                        });
                        if (stgMedia.length === 0) return null;
                        const vCount = stgMedia.filter((m) => m.mediaType === 'video' || m.mimeType?.startsWith('video')).length;
                        const pCount = stgMedia.length - vCount;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setGalleryStageFilter(stg.id);
                              galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#c5a880]/20 hover:bg-[#c5a880] hover:text-slate-950 text-[#e5caa2] text-[9px] font-bold border border-[#c5a880]/40 transition-all shadow-sm"
                            title={`View ${stgMedia.length} visual proofs for this stage in gallery`}
                          >
                            <Camera className="w-2.5 h-2.5" />
                            {pCount > 0 ? `${pCount}P` : ''}
                            {vCount > 0 ? ` ${vCount}V` : ''}
                            <span>• View</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHITE-GLOVE DELIVERY TIMELINE (SECTION 5) */}
        <section className="bg-[#141822] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#c5a880]" />
                <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
                  White-Glove Logistics & Delivery Timeline
                </h2>
                <Badge variant="gold">
                  {deliveryRecord?.deliveryStage
                    ? deliveryRecord.deliveryStage.replace(/_/g, ' ').toUpperCase()
                    : 'PREPARING FOR DISPATCH'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitored climate-controlled transport and master assembly crew tracking
              </p>
            </div>

            {canManageDelivery && (
              <Button
                variant="gold"
                size="sm"
                onClick={() => setShowUpdateDeliveryModal(true)}
                className="text-xs"
              >
                <Truck className="w-3.5 h-3.5 mr-1.5" />
                Update Delivery Stage / Courier
              </Button>
            )}
          </div>

          {/* Delivery Track 6 Stages */}
          <div className="py-4">
            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-6 gap-3 relative">
              {[
                { id: 'preparing_for_dispatch', label: 'Preparing for Dispatch', desc: 'Moisture barrier & wrap' },
                { id: 'packing_completed', label: 'Packing Completed', desc: 'Crating secured' },
                { id: 'ready_for_dispatch', label: 'Ready for Dispatch', desc: 'Dock inspection passed' },
                { id: 'dispatched', label: 'Dispatched', desc: 'Aboard Saad transport' },
                { id: 'out_for_delivery', label: 'Out for Delivery', desc: 'Courier en route' },
                { id: 'delivered_successfully', label: 'Delivered Successfully', desc: 'Assembled & certified' },
              ].map((delivStage, idx) => {
                const currentStage = deliveryRecord?.deliveryStage || 'preparing_for_dispatch';
                const stageOrder = [
                  'preparing_for_dispatch',
                  'packing_completed',
                  'ready_for_dispatch',
                  'dispatched',
                  'out_for_delivery',
                  'delivered_successfully',
                ];
                const activeDelivIdx = stageOrder.indexOf(currentStage);
                const isPassed = idx < activeDelivIdx;
                const isCurrent = idx === activeDelivIdx;

                return (
                  <div key={delivStage.id} className="flex lg:flex-col items-start lg:items-center gap-3 lg:gap-2 relative group">
                    {idx < 5 && (
                      <div
                        className={`hidden lg:block absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors duration-500 ${
                          isPassed ? 'bg-[#c5a880]' : 'bg-slate-800'
                        }`}
                      />
                    )}

                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all relative z-10 shrink-0 ${
                        isCurrent
                          ? 'bg-gradient-to-br from-[#c5a880] to-[#b09065] text-slate-950 ring-4 ring-[#c5a880]/30 shadow-lg shadow-[#c5a880]/30 scale-110'
                          : isPassed
                          ? 'bg-[#c5a880] text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-700 text-slate-500'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
                    </div>

                    <div className="flex-1 lg:text-center">
                      <span
                        className={`text-xs font-semibold block leading-tight ${
                          isCurrent
                            ? 'text-[#e5caa2] font-bold'
                            : isPassed
                            ? 'text-slate-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {delivStage.label}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 hidden sm:block">
                        {delivStage.desc}
                      </p>
                      {isCurrent && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#c5a880]/20 text-[#e5caa2] text-[9px] font-bold uppercase tracking-wider animate-pulse">
                          Current Status
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Logistics Summary Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Destination</span>
              <span className="text-white font-medium block mt-0.5">
                {deliveryRecord?.deliveryAddress || order.deliveryAddress}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Assigned Specialist</span>
              <span className="text-white font-medium block mt-0.5">
                {deliveryRecord?.assignedDeliveryStaff || order.deliveryDriverName || 'Saad Logistics Staff'}
              </span>
              <span className="text-slate-400 font-mono text-[11px] block">
                {deliveryRecord?.assignedDeliveryStaffPhone || order.deliveryDriverPhone || '+1 (800) 555-SAAD'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Estimated Window</span>
              <span className="text-emerald-400 font-medium block mt-0.5">
                {deliveryRecord?.deliveryTimeWindow || '10:00 AM - 02:00 PM'}
              </span>
              <span className="text-slate-400 text-[11px] block">
                Target Date: {deliveryRecord?.expectedDeliveryDate || order.expectedCompletionDate || 'To be scheduled'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Delivery Instructions / Notes</span>
              <span className="text-slate-300 block mt-0.5 italic">
                {deliveryRecord?.deliveryNotes || 'Standard white-glove inside placement and cleanup included.'}
              </span>
            </div>
          </div>

          {/* Delivery Photo Proofs */}
          {deliveryRecord?.deliveryPhotographs && deliveryRecord.deliveryPhotographs !== '[]' && (
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#c5a880] block mb-2">
                Official Photographic Delivery Proof
              </span>
              <div className="flex flex-wrap gap-3">
                {(() => {
                  try {
                    const photos = JSON.parse(deliveryRecord.deliveryPhotographs);
                    return photos.map((photoUrl: string, pIdx: number) => (
                      <a
                        key={pIdx}
                        href={photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 hover:border-[#c5a880] block relative group"
                      >
                        <img src={photoUrl} alt="Delivery proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </a>
                    ));
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>
          )}
        </section>

        {/* MULTI-ITEM COMMISSION SPECIFICATION DOSSIER */}
        <section ref={specsRef} className="bg-[#141822] border border-[#c5a880]/20 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#c5a880]" />
                <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
                  Commissioned Furniture Items & Multi-Piece Specifications ({items.length || 1})
                </h2>
                <Badge variant="gold">Bespoke Suite</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Itemized specification of each bespoke piece manufactured in this commission
              </p>
            </div>
            <span className="text-xs text-[#c5a880] font-mono">
              Total Pieces: {items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || order.quantity || 1}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Product Piece & SKU</th>
                  <th className="p-3">Custom Details / Specifications</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(items.length > 0 ? items : [{
                  id: 'fallback_1',
                  productTitle: order.productName,
                  skuSnapshot: `SF-${order.productCategory?.substring(0, 3).toUpperCase()}-001`,
                  customDetails: order.customDesignDetails || order.productDescription,
                  specifications: order.dimensions ? `Dimensions: ${order.dimensions}` : null,
                  quantity: order.quantity || 1,
                  unit: 'pcs',
                  unitPrice: order.totalAmount,
                  discount: 0,
                  totalPrice: order.totalAmount,
                  lineTotal: order.totalAmount,
                }]).map((it: any, idx: number) => (
                  <tr key={it.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-bold text-white block text-sm">{it.productTitle || it.title}</span>
                      {it.skuSnapshot && (
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{it.skuSnapshot}</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">
                      {it.customDetails && <p className="italic">{it.customDetails}</p>}
                      {it.specifications && <p className="text-[11px] text-slate-400 mt-0.5">{it.specifications}</p>}
                    </td>
                    <td className="p-3 text-center font-bold text-white">
                      {it.quantity} <span className="text-[10px] font-normal text-slate-400">{it.unit || 'pcs'}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      ₨{Number(it.unitPrice || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400">
                      {Number(it.discount || 0) > 0 ? `-₨${Number(it.discount).toLocaleString()}` : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white text-sm">
                      ₨{Number(it.lineTotal || it.totalPrice || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Footer */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              {order.subtotal && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Subtotal</span>
                  <span className="font-mono text-white font-semibold">₨{Number(order.subtotal).toLocaleString()}</span>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Order Discount</span>
                  <span className="font-mono text-emerald-400 font-semibold">-₨{Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              {Number(order.deliveryCharges) > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Delivery Charges</span>
                  <span className="font-mono text-white font-semibold">+₨{Number(order.deliveryCharges).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Grand Total</span>
                <span className="font-mono text-white font-bold text-base">₨{Number(order.totalAmount).toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Advance Deposit</span>
                <span className="font-mono text-emerald-400 font-bold text-base">₨{Number(order.paidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="text-right pl-4 border-l border-white/10">
                <span className="text-[10px] text-slate-400 uppercase block">Remaining Balance</span>
                <span className={`font-mono font-bold text-base ${order.remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₨{Number(order.remainingBalance || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3-COLUMN SPECIFICATION & FINANCIAL DOSSIER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMN 1: PATRON INFORMATION */}
          <div className="bg-[#141822] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif flex items-center gap-2">
              <User className="w-4 h-4 text-[#c5a880]" /> Patron Dossier
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Patron Name</span>
                <span className="text-white font-bold text-sm">{order.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Phone</span>
                <span className="text-slate-300 font-mono">{order.customerPhone || 'Not recorded'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Email Address</span>
                <span className="text-slate-300">{order.customerEmail}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Delivery Destination</span>
                <span className="text-slate-300 leading-relaxed block">{order.deliveryAddress}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <span className="text-slate-500 text-[10px] block uppercase">White-Glove Courier Logistics</span>
              <span className="text-xs font-semibold text-white block mt-1">
                {order.deliveryDriverName || 'Saad Dedicated Transport Fleet'}
              </span>
              {order.deliveryDriverPhone && (
                <span className="text-[11px] text-slate-400 block font-mono">
                  Driver Tel: {order.deliveryDriverPhone}
                </span>
              )}
            </div>
          </div>

          {/* COLUMN 2: PRODUCT & CUSTOM SPECIFICATIONS */}
          <div className="bg-[#141822] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#c5a880]" /> Bespoke Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Product Name & Category</span>
                <span className="text-white font-bold">{order.productName}</span>
                <Badge variant="gold" className="ml-2 text-[10px]">{order.productCategory}</Badge>
              </div>

              <div>
                <span className="text-slate-500 block">Dimensions & Measurements</span>
                <span className="text-slate-200 font-medium font-mono">{order.dimensions || 'Custom Sizing per Architectural Drawing'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Fabric Information</span>
                  <span className="text-slate-200 font-medium">{order.fabricInfo || 'Italian Mohair Velvet'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Colour Specification</span>
                  <span className="text-slate-200 font-medium">{order.colourInfo || 'Deep Emerald / French Walnut'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Quantity</span>
                  <span className="text-white font-bold">{order.quantity || 1} Piece(s)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Assigned Artisan</span>
                  <span className="text-[#c5a880] font-medium">{order.assignedStaffName || 'Master Studio Joiner'}</span>
                </div>
              </div>

              {order.customDesignDetails && (
                <div>
                  <span className="text-slate-500 block">Custom Design Details</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{order.customDesignDetails}</p>
                </div>
              )}

              {order.specialInstructions && (
                <div>
                  <span className="text-slate-500 block">Special Instructions</span>
                  <p className="text-amber-300/90 mt-0.5 leading-relaxed">{order.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: FINANCIAL LEDGER & SETTLEMENTS */}
          <div ref={financeRef} className="bg-[#141822] border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-serif flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#c5a880]" /> Financial Breakdown
                </h3>
                {canManageAccounts && (
                  <button
                    onClick={() => setShowRecordPaymentModal(true)}
                    className="text-xs text-[#c5a880] hover:text-white font-semibold underline"
                  >
                    + Record Payment
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs mt-4">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Total Order Price:</span>
                  <span className="text-white font-serif font-bold text-base">
                    PKR {order.totalAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400">Advance Payment Paid:</span>
                  <span className="text-emerald-400 font-bold">
                    PKR {order.paidAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-400 font-medium">Remaining Outstanding Balance:</span>
                  <span
                    className={`font-serif font-bold text-base ${
                      order.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    PKR {order.remainingBalance?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payments History List */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Payment Ledger ({payments.length})
                </span>
                {payments.map((p) => {
                  const isRev = p.isReversed === 1;
                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                        isRev ? 'bg-rose-950/20 border-rose-900/40 opacity-70' : 'bg-slate-900 border-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold ${isRev ? 'line-through text-slate-400' : 'text-white'}`}>
                            {p.paymentNumber}
                          </span>
                          {isRev && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-rose-500/20 text-rose-300 uppercase">
                              Reversed
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {p.paymentType} • {p.paymentMethod}
                        </span>
                        {isRev && p.reversalReason && (
                          <span className="text-[9px] text-rose-300 italic block mt-0.5">
                            Reason: {p.reversalReason}
                          </span>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className={`font-bold block ${isRev ? 'line-through text-slate-500' : 'text-emerald-400'}`}>
                          PKR {p.amount?.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`/api/receipts/${p.paymentNumber}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#c5a880] underline hover:text-white"
                          >
                            Receipt →
                          </a>
                          {!isRev && canManageAccounts && (
                            <button
                              type="button"
                              onClick={() => {
                                setReversalPaymentTarget(p);
                                setReversalReasonInput('');
                              }}
                              className="text-[10px] text-rose-400 hover:text-rose-300 underline"
                            >
                              Reverse
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-white/5">
              <span className="text-[10px] text-slate-500 block">
                All transactions officially certified by Saad Furniture Finance Department.
              </span>
            </div>
          </div>
        </div>

        {/* ARTISAN WORKSHOP PHOTOGRAPHS & VIDEOS GALLERY */}
        <section ref={galleryRef} className="bg-[#141822] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <OrderCraftingGallery
            orderId={orderId}
            order={order}
            items={items}
            initialMedia={media}
            isAdmin={canUploadMedia}
            onMediaChange={(updated) => setMedia(updated)}
            initialMediaFilter={queryFilter === 'videos' ? 'videos' : queryFilter === 'photos' ? 'photos' : 'all'}
            selectedStageFilter={galleryStageFilter}
            onClearStageFilter={() => setGalleryStageFilter(null)}
          />
        </section>

        {/* CHRONOLOGICAL CRAFTSMANSHIP & AUDIT TIMELINE FEED */}
        <section className="bg-[#141822] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#c5a880]" />
            Complete Chronological Workshop Log & Activity History
          </h2>

          <div className="space-y-3">
            {timeline.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-xl bg-[#121620] border border-white/5 flex items-start gap-4 hover:border-white/10 transition-colors"
              >
                <div className="p-2 rounded-lg bg-[#c5a880]/15 text-[#c5a880] mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-sm font-bold text-white">{evt.title}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(evt.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{evt.description}</p>
                  <span className="text-[10px] text-[#c5a880] block mt-1.5 font-medium">
                    Recorded by: {evt.performedBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL 1: UPDATE STAGE & STATUS CONTROLLER */}
      <Modal
        isOpen={showUpdateStageModal}
        onClose={() => setShowUpdateStageModal(false)}
        title={`Update Milestone: ${order.orderNumber}`}
        subtitle="Saves new stage, records timestamp and author, logs progress description, and dispatches instant customer notification"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateStage} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Select Manufacturing Stage *
            </label>
            <select
              value={stageForm.stageId}
              onChange={(e) => {
                const selected = customStagesList.find((s) => s.id === e.target.value);
                setStageForm({
                  ...stageForm,
                  stageId: e.target.value,
                  stageName: selected?.name || '',
                  progressPercentage: selected?.defaultPercentage || stageForm.progressPercentage,
                });
              }}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              {customStagesList.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  {idx + 1}. {s.name} ({s.defaultPercentage}%)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">
                Progress Percentage: <strong className="text-[#c5a880]">{stageForm.progressPercentage}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={stageForm.progressPercentage}
                onChange={(e) => setStageForm({ ...stageForm, progressPercentage: Number(e.target.value) })}
                className="w-full accent-[#c5a880] mt-2"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Overall Order Status</label>
              <select
                value={stageForm.orderStatus}
                onChange={(e) => setStageForm({ ...stageForm, orderStatus: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="pending">Pending</option>
                <option value="in_production">In Production</option>
                <option value="quality_check">Quality Check</option>
                <option value="ready_for_delivery">Ready for Delivery</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Successfully Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Custom Status Label (Optional)</label>
            <input
              type="text"
              value={stageForm.customStatus}
              onChange={(e) => setStageForm({ ...stageForm, customStatus: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. VIP Inspection Reserved or Gold Leaf Detail Work"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold text-[#c5a880]">
              Progress Description (Logged to Timeline & Sent to Patron) *
            </label>
            <textarea
              rows={3}
              required
              value={stageForm.progressDescription}
              onChange={(e) => setStageForm({ ...stageForm, progressDescription: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Master carpenter has completed the hand-carved dovetail joints and applied primer. Scheduled for French polishing tomorrow."
            />
          </div>

          {/* Delayed Order Toggle */}
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stageForm.isDelayed}
                onChange={(e) => setStageForm({ ...stageForm, isDelayed: e.target.checked })}
                className="accent-amber-500 w-4 h-4"
              />
              <span className="font-bold text-amber-300 text-xs">Mark as Delayed / Schedule Revision</span>
            </label>

            {stageForm.isDelayed && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-slate-400 mb-1">Reason for Delay</label>
                  <input
                    type="text"
                    value={stageForm.delayReason}
                    onChange={(e) => setStageForm({ ...stageForm, delayReason: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    placeholder="e.g. Extended organic lacquer curing time required for museum finish."
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Revised Expected Completion Date</label>
                  <input
                    type="date"
                    value={stageForm.expectedCompletionDate}
                    onChange={(e) => setStageForm({ ...stageForm, expectedCompletionDate: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowUpdateStageModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Commit Stage Update & Notify Patron
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CUSTOMIZE STAGES (SUPER ADMIN ONLY) */}
      <Modal
        isOpen={showCustomizeStagesModal}
        onClose={() => setShowCustomizeStagesModal(false)}
        title="Customize Order Stages"
        subtitle="Super Admin can add, rename, or reorder manufacturing stages for this commission"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {customStagesList.map((stg, i) => (
              <div
                key={stg.id}
                className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white block">
                    {i + 1}. {stg.name} ({stg.defaultPercentage}%)
                  </span>
                  <span className="text-[11px] text-slate-400">{stg.description}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomStage(stg.id)}
                  className="text-rose-400 hover:text-rose-300 p-1 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Add New Custom Stage */}
          <div className="p-3 rounded-xl bg-slate-950 border border-white/10 space-y-2">
            <span className="font-bold text-[#c5a880] block text-xs">+ Add New Custom Stage</span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Stage Name (e.g. Gold Leaf Trim)"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="col-span-2 p-2 bg-slate-900 border border-slate-700 rounded text-white"
              />
              <input
                type="number"
                placeholder="Progress %"
                min="0"
                max="100"
                value={newStagePercentage}
                onChange={(e) => setNewStagePercentage(Number(e.target.value))}
                className="p-2 bg-slate-900 border border-slate-700 rounded text-white"
              />
            </div>
            <input
              type="text"
              placeholder="Stage description..."
              value={newStageDesc}
              onChange={(e) => setNewStageDesc(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-white"
            />
            <Button variant="secondary" size="sm" type="button" onClick={handleAddCustomStage} className="w-full">
              Add To Order Stages
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="ghost" onClick={() => setShowCustomizeStagesModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" onClick={handleSaveCustomStages}>
              Save Customized Stages
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: UPLOAD MEDIA */}
      <Modal
        isOpen={showUploadMediaModal}
        onClose={() => setShowUploadMediaModal(false)}
        title="Upload Workshop Photographic / Video Evidence"
        subtitle="Dispatches directly to patron order crafting gallery"
        maxWidth="md"
      >
        <form onSubmit={handleUploadMedia} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Media Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="photo"
                  checked={mediaForm.mediaType === 'photo'}
                  onChange={() => setMediaForm({ ...mediaForm, mediaType: 'photo' })}
                />
                <span className="text-white">Photograph</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={mediaForm.mediaType === 'video'}
                  onChange={() => setMediaForm({ ...mediaForm, mediaType: 'video' })}
                />
                <span className="text-white">Artisan Video Clip</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Caption / Headline *</label>
            <input
              type="text"
              required
              value={mediaForm.title}
              onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Master Wood Carver Finishing Central Pedestal"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Milestone Stage</label>
            <select
              value={mediaForm.stage}
              onChange={(e) => setMediaForm({ ...mediaForm, stage: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              {customStagesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Direct URL / Cloud Link (Optional)</label>
            <input
              type="text"
              value={mediaForm.url}
              onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Leave empty to use high-res workshop camera capture"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowUploadMediaModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Upload Media
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: RECORD PAYMENT */}
      <Modal
        isOpen={showRecordPaymentModal}
        onClose={() => setShowRecordPaymentModal(false)}
        title="Record Payment / Installment"
        subtitle={`Outstanding balance on this order: $${order.remainingBalance?.toLocaleString()}`}
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Payment Amount ($) *
            </label>
            <input
              type="number"
              required
              min={1}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-base"
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
                <option value="Cash">Cash (Showroom Desk)</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Other">Other Certified Channel</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Payment Classification</label>
              <select
                value={paymentForm.paymentType}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="Progress Installment">Progress Installment</option>
                <option value="Final Balance">Final Balance Settlement</option>
                <option value="Initial Deposit">Advance Deposit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Reference / Note</label>
            <input
              type="text"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Transaction ID / Bank Reference / Receipt memo"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowRecordPaymentModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Confirm & Issue Official Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: UPDATE DELIVERY STAGE & LOGISTICS */}
      <Modal
        isOpen={showUpdateDeliveryModal}
        onClose={() => setShowUpdateDeliveryModal(false)}
        title="Update White-Glove Delivery Milestone"
        subtitle="Saves delivery stage, updates tracking timeline, records audit logs, and dispatches patron notification"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateDelivery} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">Delivery Stage *</label>
            <select
              value={deliveryForm.deliveryStage}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryStage: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              <option value="preparing_for_dispatch">1. Preparing for Dispatch</option>
              <option value="packing_completed">2. Packing Completed (Custom Crating)</option>
              <option value="ready_for_dispatch">3. Ready for Dispatch (Dock Passed)</option>
              <option value="dispatched">4. Dispatched from Showroom Hub</option>
              <option value="out_for_delivery">5. Out for Delivery</option>
              <option value="delivered_successfully">6. Delivered Successfully & Certified</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Assigned Specialist / Driver</label>
              <input
                type="text"
                value={deliveryForm.assignedDeliveryStaff}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, assignedDeliveryStaff: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="Omar Farooq (Logistics Lead)"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Driver Contact Phone</label>
              <input
                type="text"
                value={deliveryForm.assignedDeliveryStaffPhone}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, assignedDeliveryStaffPhone: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="+1 (800) 555-SAAD"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Delivery Time Window</label>
            <input
              type="text"
              value={deliveryForm.deliveryTimeWindow}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryTimeWindow: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. 10:00 AM - 01:00 PM"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold text-[#c5a880]">
              Dispatch Notes & Instructions
            </label>
            <textarea
              rows={2}
              value={deliveryForm.notes}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. White glove team arriving in luxury climate van. Protective shoe covers required."
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Delivery Photographic Proof URL (Optional)</label>
            <input
              type="url"
              value={deliveryForm.photographUrl}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, photographUrl: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowUpdateDeliveryModal(false)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Commit Delivery Update & Notify Patron
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: REVERSE PAYMENT (SUPER ADMIN / ACCOUNTS ONLY) */}
      {reversalPaymentTarget && (
        <Modal
          isOpen={!!reversalPaymentTarget}
          onClose={() => setReversalPaymentTarget(null)}
          title="Reverse Payment Transaction"
          subtitle={`Reversing Receipt #${reversalPaymentTarget.paymentNumber} (PKR ${reversalPaymentTarget.amount?.toLocaleString()})`}
          maxWidth="md"
        >
          <form onSubmit={handleReversePayment} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs leading-relaxed">
              <strong>Caution:</strong> Reversing this transaction will restore the remaining balance on order{' '}
              <span className="font-mono">{order.orderNumber}</span>, debit the customer ledger, and log an immutable audit event.
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Audit Reversal Reason * (Required for financial compliance)
              </label>
              <textarea
                rows={3}
                required
                value={reversalReasonInput}
                onChange={(e) => setReversalReasonInput(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="e.g. Patron bank chargeback or duplicate entry corrected by finance."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setReversalPaymentTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" type="submit">
                Execute Reversal & Audit Log
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MEDIA PREVIEW LIGHTBOX */}
      {activeMediaPreview && (
        <Modal
          isOpen={!!activeMediaPreview}
          onClose={() => setActiveMediaPreview(null)}
          title={activeMediaPreview.title}
          subtitle={`Milestone: ${activeMediaPreview.stage?.replace('_', ' ').toUpperCase()}`}
          maxWidth="2xl"
        >
          <div className="space-y-3">
            {activeMediaPreview.mediaType === 'video' ? (
              <video
                src={activeMediaPreview.url}
                controls
                autoPlay
                className="w-full rounded-xl max-h-[70vh] bg-black"
              />
            ) : (
              <img
                src={activeMediaPreview.url}
                alt={activeMediaPreview.title}
                className="w-full rounded-xl max-h-[70vh] object-contain bg-black"
              />
            )}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
              <span>Saad Atelier Certification</span>
              <span className="text-[#c5a880]">Verified Atelier Media</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

