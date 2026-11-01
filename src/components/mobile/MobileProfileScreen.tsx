'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Lock,
  LogOut,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Settings,
  FileText,
  Edit,
  Mail,
  Phone,
  AlertCircle,
  X,
  Plus,
  Trash2,
  MessageCircle,
  HelpCircle,
  Check,
  DollarSign,
  ArrowUpRight,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useShopSettings } from '@/lib/settings/useShopSettings';
import { PremiumSettingsView } from '@/components/settings/PremiumSettingsView';

interface MobileProfileScreenProps {
  currentUser: any | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onNavigateToOrders: () => void;
  onNavigateToWishlist: () => void;
  onNavigateToDocuments?: () => void;
}

export const MobileProfileScreen: React.FC<MobileProfileScreenProps> = ({
  currentUser,
  onOpenAuth,
  onLogout,
  onNavigateToOrders,
  onNavigateToWishlist,
  onNavigateToDocuments,
}) => {
  const router = useRouter();
  const { settings } = useShopSettings();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [profileView, setProfileView] = useState<'profile' | 'settings'>('profile');
  const [activeSection, setActiveSection] = useState<
    'overview' | 'personal' | 'balance' | 'payments' | 'addresses' | 'support' | 'password'
  >('overview');

  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Edit profile form
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Address form
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressStreet, setNewAddressStreet] = useState('');
  const [newAddressCity, setNewAddressCity] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Alerts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleTestPushNotification = async () => {
    try {
      setTestingPush(true);
      if (typeof window === 'undefined' || !('Notification' in window)) {
        showToast('error', 'Push notifications are not supported on this browser.');
        return;
      }

      let perm = Notification.permission;
      if (perm !== 'granted') {
        perm = await Notification.requestPermission();
      }

      if (perm !== 'granted') {
        showToast('error', 'Notification permission was denied. Please allow notifications in site settings.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const keyRes = await fetch('/api/notifications/subscribe');
        const { publicKey } = await keyRes.json();
        const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
        const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const converted = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) converted[i] = rawData.charCodeAt(i);

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: converted,
        });
      }

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userId: currentUser?.id || 'patron_guest',
          deviceType: /Android/i.test(navigator.userAgent) ? 'android' : 'mobile_web',
          test: true,
        }),
      });

      if (res.ok) {
        showToast('success', '🔔 Live Test Push Sent! Check your mobile status bar.');
      } else {
        showToast('error', 'Failed to dispatch test notification.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error triggering push notification.');
    } finally {
      setTestingPush(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customer/profile');
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        if (data.user) {
          setEditName(data.user.name || '');
          setEditPhone(data.user.phone || '');
          setEditCity(data.user.city || '');
          setEditAddress(data.user.address || '');
        }
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          city: editCity.trim(),
          address: editAddress.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Profile details updated successfully!');
        setShowEditProfile(false);
        await fetchProfile();
      } else {
        showToast('error', data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showToast('error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Password changed securely!');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        showToast('error', data.error || 'Failed to update password.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error updating password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressStreet.trim()) return;

    try {
      setSavingAddress(true);
      const res = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newAddressLabel,
          addressLine: newAddressStreet.trim(),
          city: newAddressCity.trim() || 'Lahore',
          phone: editPhone || currentUser?.phone || '',
          isDefault: false,
        }),
      });

      if (res.ok) {
        showToast('success', 'New delivery address saved.');
        setShowAddAddress(false);
        setNewAddressStreet('');
        await fetchProfile();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to save address.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add address.');
    } finally {
      setSavingAddress(false);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await fetch(`/api/customer/addresses?id=${addressId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('success', 'Address removed.');
        await fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If user is not signed in
  if (!currentUser) {
    return (
      <div className="space-y-6 pb-20 select-none animate-fadeIn">
        <div className="p-6 bg-white rounded-3xl border border-[#EAE2D6] text-center shadow-sm">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border border-[#B99A68]/50 shadow-md mx-auto mb-3 bg-[#1C1A18] p-2 flex items-center justify-center">
            <img
              src={settings.appIconUrl || '/assets/branding/app-dp.svg'}
              alt="Saad Furniture DP"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#262421]">
            {settings.displayName || 'Saad Furniture & Interior Studio'}
          </h2>
          <p className="text-xs text-[#89847C] mt-1 max-w-xs mx-auto leading-relaxed">
            Sign in or create your patron account to track bespoke craftsmanship progress, view verified payment receipts, and manage delivery addresses.
          </p>

          <div className="mt-5 space-y-2">
            <Button
              onClick={onOpenAuth}
              className="w-full bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-serif font-bold rounded-xl h-11 text-xs shadow-md"
            >
              Sign In / Create Account
            </Button>
          </div>
        </div>

        {/* Benefits of account */}
        <div className="bg-white p-5 rounded-3xl border border-[#EAE2D6] space-y-3 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">Patron Privileges</h3>
          <div className="space-y-2.5 text-xs text-[#89847C]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B99A68]" />
              <span>Real-time 11-stage workshop craftsmanship tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#B99A68]" />
              <span>Direct HD photo & video updates from master carvers</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#B99A68]" />
              <span>Digital accounting ledger and verified receipts</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isStaff = currentUser.role === 'staff';
  const overview = profileData?.overview || {
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalOrderAmount: 0,
    totalPaid: 0,
    advancePayments: 0,
    remainingBalance: 0,
    pendingAmount: 0,
    isFullyPaid: true,
  };
  const payments = profileData?.payments || [];
  const addresses = profileData?.addresses || [];
  const notifications = profileData?.notifications || [];

  return (
    <div className="space-y-4 pb-24 select-none animate-fadeIn">
      {/* Toast Alert */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 left-4 z-50 p-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs border animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-[#262421] text-[#B99A68] border-[#B99A68]'
              : 'bg-red-950 text-red-200 border-red-500/50'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#B99A68] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. PROFILE HEADER CARD */}
      <div className="bg-[#262421] p-5 rounded-3xl text-white shadow-md border border-[#B99A68]/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-44 h-44 bg-[#B99A68]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#1C1A18] border border-[#B99A68]/50 flex items-center justify-center shrink-0 shadow-inner p-1">
              {currentUser.avatarUrl && !currentUser.avatarUrl.includes('placeholder') ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <img
                  src={settings.appIconUrl || '/assets/branding/app-dp.svg'}
                  alt="DP"
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white truncate">{currentUser.name}</h2>
                <Badge className="bg-[#B99A68]/20 text-[#B99A68] border border-[#B99A68]/40 text-[9px] font-bold uppercase shrink-0">
                  {isSuperAdmin ? 'Super Admin' : isStaff ? 'Staff' : 'Patron'}
                </Badge>
              </div>
              <p className="text-[11px] text-[#89847C] truncate mt-0.5">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-[#B99A68] font-mono">
                <span>ID: #{currentUser.id ? currentUser.id.slice(0, 8).toUpperCase() : 'VIP'}</span>
                <span>•</span>
                <span>Since {new Date(currentUser.createdAt || Date.now()).getFullYear()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowEditProfile(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-[#B99A68] hover:text-[#262421] text-white transition-colors shrink-0"
            title="Edit Profile"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>

        {/* 2. ACCOUNT OVERVIEW NUMBERS */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center relative z-10">
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[8px] text-[#89847C] block uppercase font-bold">Total Orders</span>
            <span className="text-xs font-bold text-white font-serif">{overview.totalOrders}</span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[8px] text-[#89847C] block uppercase font-bold">Active</span>
            <span className="text-xs font-bold text-[#B99A68] font-serif">{overview.activeOrders}</span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[8px] text-[#89847C] block uppercase font-bold">Total Spent</span>
            <span className="text-xs font-bold text-white font-serif">
              ₨{((overview.totalPaid || 0) / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[8px] text-[#89847C] block uppercase font-bold">Balance</span>
            <span
              className={`text-xs font-bold font-serif ${
                overview.remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {overview.remainingBalance > 0
                ? `₨${((overview.remainingBalance || 0) / 1000).toFixed(0)}k`
                : 'Paid'}
            </span>
          </div>
        </div>
      </div>

      {/* Super Admin Quick Launch (if Super Admin or Staff) */}
      {(isSuperAdmin || isStaff) && (
        <div
          onClick={() => router.push('/admin')}
          className="bg-white p-3.5 rounded-2xl border-2 border-[#B99A68] shadow-sm flex items-center justify-between cursor-pointer hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#262421] text-[#B99A68] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#262421] font-serif">Super Admin Dashboard</h3>
              <p className="text-[10px] text-[#89847C]">Open executive command center</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#B99A68]" />
        </div>
      )}

      {/* 2.5 TAB SWITCHER: PROFILE & BALANCE vs ADVANCED SETTINGS */}
      <div className="flex bg-[#EAE2D6]/60 p-1 rounded-2xl border border-[#EAE2D6] shadow-sm">
        <button
          type="button"
          onClick={() => setProfileView('profile')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            profileView === 'profile'
              ? 'bg-[#262421] text-[#F7F5F0] shadow-sm'
              : 'text-[#89847C] hover:text-[#262421]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Balance</span>
        </button>
        <button
          type="button"
          onClick={() => setProfileView('settings')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            profileView === 'settings'
              ? 'bg-[#262421] text-[#F7F5F0] shadow-sm'
              : 'text-[#89847C] hover:text-[#262421]'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings & App Lock 🔒</span>
        </button>
      </div>

      {profileView === 'settings' ? (
        <PremiumSettingsView
          currentUser={currentUser}
          onLogout={onLogout}
          onProfileUpdated={fetchProfile}
          theme="light"
        />
      ) : (
        <>
      {/* 3. CUSTOMER BALANCE & FINANCIAL DETAILS CARD */}
      <div className="bg-white rounded-3xl border border-[#EAE2D6] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#F7F5F0] text-[#B99A68]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#262421] uppercase tracking-wider font-serif">
                Account Balance & Ledger
              </h3>
              <span className="text-[10px] text-[#89847C]">Verified Financial Statement</span>
            </div>
          </div>
          {overview.remainingBalance === 0 ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
              All Orders Paid
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-bold">
              Outstanding Balance
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#EAE2D6]">
            <span className="text-[10px] text-[#89847C] block font-medium">Total Orders Value</span>
            <span className="text-sm font-bold text-[#262421] font-serif mt-0.5 block">
              ₨{(overview.totalOrderAmount || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#EAE2D6]">
            <span className="text-[10px] text-[#89847C] block font-medium">Total Verified Payments</span>
            <span className="text-sm font-bold text-emerald-700 font-serif mt-0.5 block">
              ₨{(overview.totalPaid || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#EAE2D6]">
            <span className="text-[10px] text-[#89847C] block font-medium">Advance Deposits</span>
            <span className="text-sm font-bold text-[#B99A68] font-serif mt-0.5 block">
              ₨{(overview.advancePayments || 0).toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#EAE2D6]">
            <span className="text-[10px] text-[#89847C] block font-medium">Remaining Due</span>
            <span
              className={`text-sm font-bold font-serif mt-0.5 block ${
                overview.remainingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {overview.remainingBalance > 0
                ? `₨${overview.remainingBalance.toLocaleString()}`
                : '₨0 (Clear)'}
            </span>
          </div>
        </div>

        {/* Payment History Accordion */}
        {payments.length > 0 && (
          <div className="pt-2 border-t border-[#F7F5F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#262421]">Recent Verified Receipts</span>
              <span className="text-[10px] text-[#89847C]">{payments.length} Transaction(s)</span>
            </div>
            <div className="space-y-2">
              {payments.slice(0, 3).map((p: any) => (
                <div
                  key={p.id}
                  className="p-2.5 bg-[#F7F5F0] rounded-xl flex items-center justify-between text-xs border border-[#EAE2D6]"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#262421]">{p.paymentNumber}</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                        {p.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#89847C] block mt-0.5">
                      {p.paymentMethod} • {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="font-bold text-[#262421] font-serif">
                    ₨{(p.amount || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. COMPLETE PROFILE DASHBOARD SECTIONS */}
      <div className="bg-white rounded-3xl border border-[#EAE2D6] divide-y divide-[#F7F5F0] shadow-sm overflow-hidden">
        {/* Section 1: Personal Information */}
        <button
          onClick={() => setShowEditProfile(true)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-[#B99A68]" />
            <div>
              <span className="text-xs font-bold text-[#262421] block">Personal Information</span>
              <span className="text-[10px] text-[#89847C] block">
                {currentUser.name} • {currentUser.phone || 'Add phone'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>

        {/* Section 2: My Orders */}
        <button
          onClick={onNavigateToOrders}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-[#B99A68]" />
            <div>
              <span className="text-xs font-bold text-[#262421] block">My Orders & Live Tracking</span>
              <span className="text-[10px] text-[#89847C] block">
                {overview.activeOrders} active commission(s) in workshop
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>

        {/* Section 3: Saved Delivery Addresses */}
        <div className="p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#B99A68]" />
              <span className="text-xs font-bold text-[#262421]">Saved Delivery Addresses</span>
            </div>
            <button
              onClick={() => setShowAddAddress(true)}
              className="text-[11px] font-bold text-[#B99A68] flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New</span>
            </button>
          </div>
          <div className="pl-7 space-y-1.5">
            <div className="p-2.5 bg-[#F7F5F0] rounded-xl text-xs flex items-center justify-between border border-[#EAE2D6]">
              <div className="min-w-0 pr-2">
                <span className="font-bold text-[#262421] block text-[11px]">Primary Address</span>
                <span className="text-[10px] text-[#89847C] block truncate">
                  {currentUser.address || 'No primary address configured'}
                  {currentUser.city ? `, ${currentUser.city}` : ''}
                </span>
              </div>
              <button
                onClick={() => setShowEditProfile(true)}
                className="text-[10px] font-bold text-[#B99A68] shrink-0"
              >
                Edit
              </button>
            </div>
            {addresses.map((addr: any) => (
              <div
                key={addr.id}
                className="p-2.5 bg-[#F7F5F0] rounded-xl text-xs flex items-center justify-between border border-[#EAE2D6]"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-bold text-[#262421] block text-[11px]">{addr.label || 'Address'}</span>
                  <span className="text-[10px] text-[#89847C] block truncate">
                    {addr.addressLine}, {addr.city}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Saved Wishlist */}
        <button
          onClick={onNavigateToWishlist}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-[#B99A68]" />
            <div>
              <span className="text-xs font-bold text-[#262421] block">Saved Wishlist</span>
              <span className="text-[10px] text-[#89847C] block">
                {overview.wishlistCount || 0} saved masterpiece(s)
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>

        {/* Section 5: Showroom Catalogues & Documents */}
        {onNavigateToDocuments && (
          <button
            onClick={onNavigateToDocuments}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#B99A68]" />
              <div>
                <span className="text-xs font-bold text-[#262421] block">
                  Catalogues & Digital Library
                </span>
                <span className="text-[10px] text-[#89847C] block">
                  Official 2026 furniture collections & warranty cards
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#89847C]" />
          </button>
        )}

        {/* Section 6: Change Password / Settings */}
        <button
          onClick={() => setProfileView('settings')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-[#B99A68]" />
            <div>
              <span className="text-xs font-bold text-[#262421] block">Security, PIN & App Lock</span>
              <span className="text-[10px] text-[#89847C] block">Configure Biometrics, PIN & Password</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>

        {/* Mobile Background Push Notifications Alert Card */}
        <div className="p-3.5 m-2 rounded-2xl bg-gradient-to-r from-[#262421] via-[#262421] to-[#1C1A18] text-white border border-[#B99A68]/40 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#B99A68]/20 border border-[#B99A68]/40 flex items-center justify-center text-[#B99A68]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Mobile Push Notifications</span>
                <span className="text-[10px] text-[#EAE2D6]/80 block">Receive alerts even when in other apps</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestPushNotification}
              disabled={testingPush}
              className="px-2.5 py-1.5 rounded-xl bg-[#B99A68] text-[#262421] text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm flex items-center gap-1"
            >
              {testingPush ? 'Testing...' : 'Test Alert 🔔'}
            </button>
          </div>
          <p className="text-[10px] text-stone-300 leading-tight">
            When our artisans update your furniture carving stage or upload workshop photos, your phone will ring and show status alerts immediately.
          </p>
        </div>

        {/* Section 7: Showroom Concierge & Support */}
        <div className="p-3.5 space-y-2 border-t border-[#EAE2D6]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#262421] text-[#B99A68] flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#262421] block truncate">
                {settings.displayName || 'Saad Showroom & Workshop Concierge'}
              </span>
              <span className="text-[10px] text-[#89847C] block truncate">
                {settings.completeAddress || 'Sheikh-U-Pura Road Near Imtiaz Mega Mall, Faisalabad'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`https://wa.me/${(settings.whatsappNumber || '+923130207445').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl bg-[#128C7E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="truncate">WhatsApp: {settings.whatsappNumber || '+92 313-0207445'}</span>
            </a>
            <a
              href={`tel:${(settings.primaryPhone || '+923007207445').replace(/\s+/g, '')}`}
              className="p-2.5 rounded-xl bg-[#262421] text-[#B99A68] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="truncate">Call: {settings.primaryPhone || '+92 300 7207445'}</span>
            </a>
          </div>
        </div>

        {/* Section 8: Sign Out */}
        <button
          onClick={onLogout}
          className="w-full p-3.5 flex items-center justify-between text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold">Sign Out from Patron Account</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </button>
      </div>
      </>
      )}

      {/* EDIT PROFILE MODAL */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#EAE2D6] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE2D6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F7F5F0] text-[#B99A68]">
                  <Edit className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#262421]">Edit Patron Profile</h3>
              </div>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-1 rounded-full text-[#89847C] hover:text-[#262421]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  Phone / Mobile
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  City / Location
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="e.g. Lahore"
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  Primary Delivery Address
                </label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="House, Street, Area"
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 bg-[#F7F5F0] text-[#89847C] hover:text-[#262421] text-xs rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-bold text-xs rounded-xl h-10 shadow-md"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#EAE2D6] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE2D6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F7F5F0] text-[#B99A68]">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#262421]">Change Password</h3>
              </div>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-1 rounded-full text-[#89847C] hover:text-[#262421]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 bg-[#F7F5F0] text-[#89847C] hover:text-[#262421] text-xs rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="flex-1 bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-bold text-xs rounded-xl h-10 shadow-md"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ADDRESS MODAL */}
      {showAddAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#EAE2D6] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE2D6]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F7F5F0] text-[#B99A68]">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-serif font-bold text-[#262421]">Add Delivery Address</h3>
              </div>
              <button
                onClick={() => setShowAddAddress(false)}
                className="p-1 rounded-full text-[#89847C] hover:text-[#262421]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  Address Label
                </label>
                <select
                  value={newAddressLabel}
                  onChange={(e) => setNewAddressLabel(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] outline-none"
                >
                  <option value="Home">Home Residence</option>
                  <option value="Office">Office / Workplace</option>
                  <option value="Villa">Villa / Farmhouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  Complete Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={newAddressStreet}
                  onChange={(e) => setNewAddressStreet(e.target.value)}
                  placeholder="House number, Street, Phase / Block, Area"
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#89847C] mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={newAddressCity}
                  onChange={(e) => setNewAddressCity(e.target.value)}
                  placeholder="e.g. Lahore"
                  className="w-full p-2.5 bg-[#F7F5F0] border border-[#EAE2D6] rounded-xl text-xs text-[#292722] focus:border-[#B99A68] outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowAddAddress(false)}
                  className="flex-1 bg-[#F7F5F0] text-[#89847C] hover:text-[#262421] text-xs rounded-xl h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingAddress}
                  className="flex-1 bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-bold text-xs rounded-xl h-10 shadow-md"
                >
                  {savingAddress ? 'Saving...' : 'Add Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
