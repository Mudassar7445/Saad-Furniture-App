'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Layers,
  CreditCard,
  Truck,
  Image as ImageIcon,
  Clock,
  UploadCloud,
  LogOut,
  RefreshCw,
  Plus,
  Shield,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

const FURNITURE_PRODUCTION_STAGES = [
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

export default function StaffOperationsDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');

  // Data
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Modals
  const [showEditOrder, setShowEditOrder] = useState<any>(null);
  const [showUploadMedia, setShowUploadMedia] = useState<any>(null);
  const [showRecordPayment, setShowRecordPayment] = useState<any>(null);

  const [mediaForm, setMediaForm] = useState({
    title: '',
    stage: 'wood_cutting',
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
    checkStaffAuth();
  }, []);

  const checkStaffAuth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!res.ok || !data.user) {
        router.push('/');
        return;
      }

      if (data.user.role === 'customer') {
        router.push('/portal');
        return;
      } else if (data.user.role === 'super_admin') {
        router.push('/admin');
        return;
      }

      setCurrentUser(data.user);
      const userPerms: string[] = data.user.permissions || [];
      if (userPerms.length > 0) {
        setActiveTab(userPerms[0]);
      }

      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [ordRes, prodRes, payRes, custRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/payments'),
        fetch('/api/customers'),
      ]);

      if (ordRes.ok) setOrders((await ordRes.json()).orders || []);
      if (prodRes.ok) setProducts((await prodRes.json()).products || []);
      if (payRes.ok) setPayments((await payRes.json()).payments || []);
      if (custRes.ok) setCustomers((await custRes.json()).customers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditOrder) return;
    await fetch(`/api/orders/${showEditOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productionStage: showEditOrder.productionStage,
        productionProgress: Number(showEditOrder.productionProgress),
        progressDescription: showEditOrder.progressDescription,
        orderStatus: showEditOrder.orderStatus,
        deliveryStatus: showEditOrder.deliveryStatus,
        estimatedDeliveryDate: showEditOrder.estimatedDeliveryDate,
        deliveryDriverName: showEditOrder.deliveryDriverName,
        deliveryDriverPhone: showEditOrder.deliveryDriverPhone,
      }),
    });
    setShowEditOrder(null);
    loadData();
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUploadMedia) return;
    const res = await fetch(`/api/orders/${showUploadMedia.id}/media`, {
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
      setShowUploadMedia(null);
      setMediaForm({ title: '', stage: 'wood_cutting', mediaType: 'photo', url: '' });
      alert('Workshop media successfully uploaded to patron dashboard!');
      loadData();
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
      setPaymentForm({ amount: '', paymentMethod: 'Bank Transfer', paymentType: 'Progress Installment', notes: '' });
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif tracking-widest text-[#c5a880] uppercase text-xs">
            Verifying Staff Permissions...
          </p>
        </div>
      </div>
    );
  }

  const permissions: string[] = currentUser?.permissions || [];

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col">
      {/* Staff Header */}
      <header className="border-b border-white/5 bg-[#121620] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif tracking-[0.2em] text-base font-bold text-white uppercase">
              SAAD <span className="text-[#c5a880]">STAFF OPERATIONS</span>
            </span>
            <Badge variant="blue">Staff Operator</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">{currentUser?.name}</span>
              <span className="text-[10px] text-slate-400">
                Authorized for: {permissions.join(', ')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        {/* Module Permissions Banner */}
        <div className="bg-[#141822] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#c5a880]" />
              Staff Operational Station
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Super Admin has delegated access to the following operational departments:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.map((p) => (
              <span
                key={p}
                className="px-3 py-1 rounded-lg bg-[#c5a880]/15 border border-[#c5a880]/30 text-[#e5caa2] text-xs font-semibold capitalize"
              >
                ✓ {p} Manager
              </span>
            ))}
          </div>
        </div>

        {/* Tab navigation matching staff's assigned permissions */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {permissions.includes('orders') && (
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#c5a880] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              📦 Order Workshop Manager ({orders.length})
            </button>
          )}

          {permissions.includes('media') && (
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'media'
                  ? 'bg-[#c5a880] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              📷 Media & Workshop Camera Uploader
            </button>
          )}

          {permissions.includes('delivery') && (
            <button
              onClick={() => setActiveTab('delivery')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'delivery'
                  ? 'bg-[#c5a880] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🚚 Delivery Logistics
            </button>
          )}

          {permissions.includes('accounts') && (
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'accounts'
                  ? 'bg-[#c5a880] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              💳 Accounts & Payment Recording ({payments.length})
            </button>
          )}

          {permissions.includes('products') && (
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'products'
                  ? 'bg-[#c5a880] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🛋️ Product Catalog Manager ({products.length})
            </button>
          )}
        </div>

        {/* 1. ORDER MANAGER VIEW */}
        {activeTab === 'orders' && permissions.includes('orders') && (
          <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-white">Active Commissions In Production</h3>
                <p className="text-xs text-slate-400">Update stages and progress percentages</p>
              </div>
              <button
                onClick={loadData}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Patron</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-white font-serif">{ord.orderNumber}</td>
                      <td className="p-4 font-semibold text-white">{ord.customerName}</td>
                      <td className="p-4 capitalize text-[#e5caa2]">{ord.productionStage?.replace('_', ' ')}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{ord.productionProgress}%</span>
                          <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#c5a880] h-full rounded-full"
                              style={{ width: `${ord.productionProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="gold">{ord.orderStatus}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setShowEditOrder(ord)}
                          className="px-3 py-1.5 rounded-lg bg-[#c5a880] text-slate-950 font-bold hover:bg-[#d5b991] transition-all"
                        >
                          Update Progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. MEDIA MANAGER VIEW */}
        {activeTab === 'media' && permissions.includes('media') && (
          <div className="space-y-6">
            <div className="bg-[#141822] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-serif font-bold text-white mb-2">
                Workshop Media Dispatcher
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Select any active order below to upload verified workshop photos or video recordings directly into the patron's personal dashboard and cloud archive.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl bg-slate-900 border border-white/5 hover:border-[#c5a880] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white font-serif">{ord.orderNumber}</span>
                        <Badge variant="gold">{ord.productionStage?.replace('_', ' ')}</Badge>
                      </div>
                      <span className="text-xs text-slate-300 block mt-1">{ord.customerName}</span>
                    </div>

                    <button
                      onClick={() => setShowUploadMedia(ord)}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#c5a880] text-slate-950 text-xs font-bold hover:bg-[#d5b991] transition-all"
                    >
                      <UploadCloud className="w-4 h-4" /> Upload Media
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. DELIVERY MANAGER VIEW */}
        {activeTab === 'delivery' && permissions.includes('delivery') && (
          <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-base font-serif font-bold text-white">White-Glove Fleet Logistics</h3>
              <p className="text-xs text-slate-400">Assign drivers, update ETAs and dispatch orders</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181d28] text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Patron & Destination</th>
                    <th className="p-4">Delivery Status</th>
                    <th className="p-4">Target ETA</th>
                    <th className="p-4">Assigned Driver</th>
                    <th className="p-4 text-right">Dispatch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-white font-serif">{ord.orderNumber}</td>
                      <td className="p-4">
                        <span className="font-bold text-white block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-500">{ord.deliveryAddress}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="blue">{ord.deliveryStatus}</Badge>
                      </td>
                      <td className="p-4 text-slate-300">
                        {ord.estimatedDeliveryDate
                          ? new Date(ord.estimatedDeliveryDate).toLocaleDateString()
                          : 'Pending'}
                      </td>
                      <td className="p-4 font-medium text-white">
                        {ord.deliveryDriverName || 'Unassigned'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setShowEditOrder(ord)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
                        >
                          Assign / Dispatch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. ACCOUNTS MANAGER VIEW */}
        {activeTab === 'accounts' && permissions.includes('accounts') && (
          <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-white">Accounts & Settlements Ledger</h3>
                <p className="text-xs text-slate-400">Record customer payments and print official receipts</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-xl bg-slate-900 border border-white/5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-serif">{ord.orderNumber}</span>
                      <span className="text-xs text-rose-400 font-bold">
                        Bal: ${ord.remainingBalance?.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 block mt-1">{ord.customerName}</span>
                    <span className="text-[11px] text-slate-500">Total: ${ord.totalAmount?.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => setShowRecordPayment(ord)}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                  >
                    <CreditCard className="w-4 h-4" /> Record Settlement
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PRODUCT MANAGER VIEW */}
        {activeTab === 'products' && permissions.includes('products') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div key={prod.id} className="bg-[#141822] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{prod.sku}</span>
                  <Badge variant="gold">{prod.category}</Badge>
                </div>
                <h4 className="font-bold text-white text-base font-serif">{prod.title}</h4>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Floor: <span className="text-white font-medium">{prod.showroomLocation}</span></div>
                  <div>Stock: <span className="text-emerald-400 font-bold">{prod.stockQuantity} units</span></div>
                </div>
                <div className="text-base font-bold text-[#c5a880] pt-2 border-t border-white/5">
                  ${prod.price?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: UPDATE ORDER */}
      <Modal
        isOpen={!!showEditOrder}
        onClose={() => setShowEditOrder(null)}
        title={`Update Order: ${showEditOrder?.orderNumber}`}
        subtitle="Manage workshop stage & logistics"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateOrder} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Furniture Production Stage (16-Stage Master Flow)</label>
            <select
              value={showEditOrder?.productionStage || 'order_placed'}
              onChange={(e) => {
                const newStage = e.target.value;
                const found = FURNITURE_PRODUCTION_STAGES.find((s) => s.id === newStage);
                setShowEditOrder({
                  ...showEditOrder,
                  productionStage: newStage,
                  productionProgress: found ? found.pct : showEditOrder.productionProgress,
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
              Progress Percentage ({showEditOrder?.productionProgress || 0}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={showEditOrder?.productionProgress || 0}
              onChange={(e) =>
                setShowEditOrder({ ...showEditOrder, productionProgress: e.target.value })
              }
              className="w-full accent-[#c5a880]"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">
              Artisan Progress Description / Timeline Milestone Note
            </label>
            <textarea
              rows={2}
              value={showEditOrder?.progressDescription || ''}
              onChange={(e) =>
                setShowEditOrder({ ...showEditOrder, progressDescription: e.target.value })
              }
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500"
              placeholder="e.g. Mortise and tenon joint assembly completed; moving to frame inspection..."
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Delivery Status</label>
            <select
              value={showEditOrder?.deliveryStatus || ''}
              onChange={(e) =>
                setShowEditOrder({ ...showEditOrder, deliveryStatus: e.target.value })
              }
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Delivery Driver</label>
            <input
              type="text"
              value={showEditOrder?.deliveryDriverName || ''}
              onChange={(e) =>
                setShowEditOrder({ ...showEditOrder, deliveryDriverName: e.target.value })
              }
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowEditOrder(null)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Save Progress
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: UPLOAD MEDIA */}
      <Modal
        isOpen={!!showUploadMedia}
        onClose={() => setShowUploadMedia(null)}
        title={`Upload Media: ${showUploadMedia?.orderNumber}`}
        subtitle="Dispatches directly to patron dashboard"
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
                <span className="text-white">Photo</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={mediaForm.mediaType === 'video'}
                  onChange={() => setMediaForm({ ...mediaForm, mediaType: 'video' })}
                />
                <span className="text-white">Artisan Video</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Caption *</label>
            <input
              type="text"
              required
              value={mediaForm.title}
              onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. Master Carpenter Joinery Alignment"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Stage</label>
            <select
              value={mediaForm.stage}
              onChange={(e) => setMediaForm({ ...mediaForm, stage: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              {FURNITURE_PRODUCTION_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowUploadMedia(null)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Upload Media
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECORD PAYMENT */}
      <Modal
        isOpen={!!showRecordPayment}
        onClose={() => setShowRecordPayment(null)}
        title={`Record Payment: ${showRecordPayment?.orderNumber}`}
        subtitle="Applies to customer ledger & generates official receipt"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">
              Amount ($) * (Outstanding: ${showRecordPayment?.remainingBalance?.toLocaleString()})
            </label>
            <input
              type="number"
              required
              min={1}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-base"
              placeholder="2500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Method</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash at Showroom</option>
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
                <option value="Final Balance">Final Balance</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowRecordPayment(null)}>
              Cancel
            </Button>
            <Button variant="gold" type="submit">
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
