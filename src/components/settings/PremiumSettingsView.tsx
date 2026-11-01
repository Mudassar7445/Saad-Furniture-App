'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Lock,
  Fingerprint,
  Bell,
  Sliders,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Sparkles,
  Smartphone,
  Info,
  ExternalLink,
  Save,
  Moon,
  Sun,
  Volume2,
  Trash2,
  FileText,
  Shield,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAppLock } from '@/components/auth/AppLockProvider';
import { isBiometricSupported, registerDeviceBiometric } from '@/lib/auth/biometrics';
import { useShopSettings } from '@/lib/settings/useShopSettings';

interface PremiumSettingsViewProps {
  currentUser: any;
  onLogout: () => void;
  onProfileUpdated?: () => void;
  theme?: 'dark' | 'light';
}

type Subpage =
  | 'home'
  | 'personal_info'
  | 'change_password'
  | 'account_info'
  | 'app_lock'
  | 'auto_lock'
  | 'active_sessions'
  | 'notifications'
  | 'appearance'
  | 'support'
  | 'about';

export const PremiumSettingsView: React.FC<PremiumSettingsViewProps> = ({
  currentUser,
  onLogout,
  onProfileUpdated,
  theme = 'light',
}) => {
  const { settings } = useShopSettings();
  const { isLocked, lockAppNow, appLockConfig, refreshAppLockConfig } = useAppLock();

  const [activeSubpage, setActiveSubpage] = useState<Subpage>('home');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Personal Info Form ---
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [whatsapp, setWhatsapp] = useState(currentUser?.phone || '');
  const [email] = useState(currentUser?.email || '');
  const [city, setCity] = useState(currentUser?.city || 'Lahore');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // --- Password Form ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // --- App Lock Settings State ---
  const [lockEnabled, setLockEnabled] = useState(appLockConfig.enabled);
  const [pinLength, setPinLength] = useState<4 | 6>((appLockConfig.pinLength === 6 ? 6 : 4));
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(appLockConfig.biometricEnabled);
  const [autoLockMinutes, setAutoLockMinutes] = useState(appLockConfig.autoLockMinutes ?? 1);
  const [updatingLock, setUpdatingLock] = useState(false);

  // --- Notification Toggles ---
  const [notifOrderProgress, setNotifOrderProgress] = useState(true);
  const [notifWorkshopVideos, setNotifWorkshopVideos] = useState(true);
  const [notifNewProducts, setNotifNewProducts] = useState(true);
  const [notifPayments, setNotifPayments] = useState(true);
  const [testingPush, setTestingPush] = useState(false);

  // --- Preferences ---
  const [appTheme, setAppTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ur' | 'bi'>('en');

  // Sync state with lock config
  useEffect(() => {
    setLockEnabled(appLockConfig.enabled);
    setBiometricEnabled(appLockConfig.biometricEnabled);
    setAutoLockMinutes(appLockConfig.autoLockMinutes ?? 1);
    setPinLength(appLockConfig.pinLength === 6 ? 6 : 4);
  }, [appLockConfig]);

  // Check hardware biometric capability
  useEffect(() => {
    isBiometricSupported().then((supported) => setBiometricAvailable(supported));
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // 1. Save Personal Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Full name is required');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Profile information updated successfully!');
        if (onProfileUpdated) onProfileUpdated();
        setActiveSubpage('home');
      } else {
        showToast('error', data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Save Password Change
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match');
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
        showToast('success', 'Account password changed securely!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setActiveSubpage('home');
      } else {
        showToast('error', data.error || 'Failed to update password');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error changing password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // 3. Handle App Lock Master Toggle
  const handleToggleAppLock = async () => {
    if (!lockEnabled) {
      // Prompt user to set up a PIN first if not configured
      if (!appLockConfig.hasPinConfigured) {
        setNewPin('');
        setConfirmPin('');
        setShowPinModal(true);
        return;
      }

      // Enable existing lock
      await updateLockPreferences({ isEnabled: true });
      setLockEnabled(true);
      showToast('success', 'App Lock enabled! Your atelier is now password protected.');
    } else {
      // Disable lock
      await updateLockPreferences({ isEnabled: false });
      setLockEnabled(false);
      showToast('success', 'App Lock disabled.');
    }
  };

  // 4. Save New PIN
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== pinLength) {
      showToast('error', `PIN must be exactly ${pinLength} digits`);
      return;
    }
    if (newPin !== confirmPin) {
      showToast('error', 'Entered PINs do not match');
      return;
    }

    try {
      setSavingPin(true);
      const res = await fetch('/api/auth/app-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_pin',
          pin: newPin,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', `Security ${pinLength}-digit PIN configured successfully!`);
        setShowPinModal(false);
        setNewPin('');
        setConfirmPin('');
        setLockEnabled(true);
        await refreshAppLockConfig();
      } else {
        showToast('error', data.error || 'Failed to configure PIN');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error saving PIN');
    } finally {
      setSavingPin(false);
    }
  };

  // 5. Toggle Biometric Authentication
  const handleToggleBiometric = async () => {
    if (!biometricEnabled) {
      if (!biometricAvailable) {
        showToast('error', 'Device biometric scanner (Fingerprint/Face ID) not detected in this browser.');
        return;
      }

      try {
        const reg = await registerDeviceBiometric(currentUser?.id, currentUser?.name);
        if (reg.success) {
          await updateLockPreferences({
            biometricEnabled: true,
            biometricCredentialId: reg.credentialId,
          });
          setBiometricEnabled(true);
          showToast('success', 'Fingerprint & Face ID unlock registered on this device!');
        } else {
          showToast('error', reg.error || 'Biometric authorization was cancelled.');
        }
      } catch (err: any) {
        showToast('error', err.message || 'Could not register biometric authentication.');
      }
    } else {
      await updateLockPreferences({ biometricEnabled: false });
      setBiometricEnabled(false);
      showToast('success', 'Biometric unlock disabled.');
    }
  };

  // 6. Update Auto-Lock Duration
  const handleChangeAutoLock = async (minutes: number) => {
    setAutoLockMinutes(minutes);
    await updateLockPreferences({ autoLockMinutes: minutes });
    showToast('success', `Auto-lock updated to ${minutes === 0 ? 'Immediately' : `${minutes} minute(s)`}`);
  };

  // Helper: Call PUT /api/auth/app-lock
  const updateLockPreferences = async (fields: Record<string, any>) => {
    try {
      setUpdatingLock(true);
      const res = await fetch('/api/auth/app-lock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        await refreshAppLockConfig();
      }
    } catch (err) {
      console.warn('Update lock error:', err);
    } finally {
      setUpdatingLock(false);
    }
  };

  // 7. Test Push Notification
  const handleTestPush = async () => {
    try {
      setTestingPush(true);
      if (typeof window === 'undefined' || !('Notification' in window)) {
        showToast('error', 'Push notifications not supported on this device/browser.');
        return;
      }

      let perm = Notification.permission;
      if (perm !== 'granted') perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        showToast('error', 'Notification permission was denied.');
        return;
      }

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'patron_guest',
          deviceType: /Android/i.test(navigator.userAgent) ? 'android' : 'mobile_web',
          test: true,
        }),
      });

      if (res.ok) {
        showToast('success', '🔔 Live Test Alert Sent! Check status bar.');
      } else {
        showToast('error', 'Notification dispatch note.');
      }
    } catch {
      showToast('error', 'Push test failed.');
    } finally {
      setTestingPush(false);
    }
  };

  // Color & Card helpers
  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white border-[#EAE2D6]' : 'bg-slate-900/90 border-white/10';
  const textHeading = isLight ? 'text-[#262421]' : 'text-white';
  const textMuted = isLight ? 'text-[#89847C]' : 'text-slate-400';
  const dividerColor = isLight ? 'divide-[#F7F5F0]' : 'divide-white/5';
  const itemHover = isLight ? 'hover:bg-[#F7F5F0]' : 'hover:bg-white/5';

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-10">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 left-4 z-50 p-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs border animate-in fade-in duration-300 max-w-md mx-auto ${
            feedback.type === 'success'
              ? 'bg-[#262421] text-[#B99A68] border-[#B99A68]'
              : 'bg-rose-950 text-rose-200 border-rose-500/50'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#B99A68] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* HOME VIEW: GROUPED CARDS WITH MODERN ICONS */}
      {/* ======================================================== */}
      {activeSubpage === 'home' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Title */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className={`text-base sm:text-lg font-serif font-bold ${textHeading}`}>
                Atelier Settings & Security
              </h2>
              <p className={`text-[11px] ${textMuted}`}>
                Manage your credentials, biometric app lock, notifications & preferences
              </p>
            </div>
            <Badge variant="gold" className="text-[10px] font-bold">
              {currentUser?.role === 'super_admin' ? 'Super Admin' : 'VIP Patron'}
            </Badge>
          </div>

          {/* GROUP 1: ACCOUNT */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} px-3`}>
              Account
            </span>
            <div className={`rounded-3xl border ${cardBg} divide-y ${dividerColor} shadow-sm overflow-hidden`}>
              <button
                type="button"
                onClick={() => setActiveSubpage('personal_info')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${textHeading} block`}>Personal Information</span>
                    <span className={`text-[10px] ${textMuted} block`}>
                      {name || currentUser?.name} • {phone || currentUser?.phone || 'Add phone number'}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveSubpage('change_password')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${textHeading} block`}>Change Password</span>
                    <span className={`text-[10px] ${textMuted} block`}>Update account access secret</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveSubpage('account_info')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${textHeading} block`}>Account Information</span>
                    <span className={`text-[10px] ${textMuted} block`}>
                      ID: #{currentUser?.id?.slice(0, 8).toUpperCase()} • Member Since {new Date(currentUser?.createdAt || Date.now()).getFullYear()}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>
            </div>
          </div>

          {/* GROUP 2: SECURITY & PRIVACY (APP LOCK & BIOMETRICS) */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} px-3`}>
              Security & Privacy
            </span>
            <div className={`rounded-3xl border ${cardBg} divide-y ${dividerColor} shadow-sm overflow-hidden`}>
              {/* App Lock Master Item */}
              <button
                type="button"
                onClick={() => setActiveSubpage('app_lock')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${textHeading}`}>App Lock</span>
                      {lockEnabled ? (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-slate-500/20 text-slate-400 text-[9px] font-bold uppercase">
                          Off
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] ${textMuted} block`}>
                      PIN & Fingerprint/Face ID lock screen
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>

              {/* Quick Lock Now Action (if enabled) */}
              {lockEnabled && (
                <div className="p-3.5 flex items-center justify-between bg-black/5">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-[#B99A68]" />
                    <span className={`text-xs font-semibold ${textHeading}`}>Lock App Now</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={lockAppNow}
                    className="h-7 text-[10px] px-2.5 font-bold border-[#B99A68]/40 text-[#B99A68]"
                  >
                    Lock Now
                  </Button>
                </div>
              )}

              {/* Active Sessions */}
              <button
                type="button"
                onClick={() => setActiveSubpage('active_sessions')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${textHeading} block`}>Login Sessions</span>
                    <span className={`text-[10px] ${textMuted} block`}>Current authenticated browser session</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>
            </div>
          </div>

          {/* GROUP 3: NOTIFICATIONS */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} px-3`}>
              Notifications
            </span>
            <div className={`rounded-3xl border ${cardBg} divide-y ${dividerColor} shadow-sm overflow-hidden`}>
              <button
                type="button"
                onClick={() => setActiveSubpage('notifications')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${textHeading} block`}>Notification Preferences</span>
                    <span className={`text-[10px] ${textMuted} block`}>
                      Push alerts, workshop milestones, & receipts
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>
            </div>
          </div>

          {/* GROUP 4: PREFERENCES & APPEARANCE */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} px-3`}>
              App Preferences
            </span>
            <div className={`rounded-3xl border ${cardBg} divide-y ${dividerColor} shadow-sm overflow-hidden`}>
              <button
                type="button"
                onClick={() => setActiveSubpage('appearance')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${textHeading} block`}>Appearance & Language</span>
                    <span className={`text-[10px] ${textMuted} block`}>
                      Theme, sound effects, and multilingual options
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>
            </div>
          </div>

          {/* GROUP 5: SUPPORT & INFORMATION */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMuted} px-3`}>
              Support & Information
            </span>
            <div className={`rounded-3xl border ${cardBg} divide-y ${dividerColor} shadow-sm overflow-hidden`}>
              <button
                type="button"
                onClick={() => setActiveSubpage('support')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${textHeading} block`}>Help Center & Concierge</span>
                    <span className={`text-[10px] ${textMuted} block`}>Direct WhatsApp & VIP showroom support</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveSubpage('about')}
                className={`w-full p-3.5 flex items-center justify-between text-left ${itemHover} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${textHeading} block`}>About Saad Furniture</span>
                    <span className={`text-[10px] ${textMuted} block`}>Version 2.4.0 • Terms & Privacy Policy</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${textMuted}`} />
              </button>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="w-full p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/20 transition-all active:scale-95 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of Patron Account
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: PERSONAL INFORMATION */}
      {/* ======================================================== */}
      {activeSubpage === 'personal_info' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>Personal Information</h3>
          </div>

          <form onSubmit={handleSaveProfile} className={`p-4 rounded-3xl border ${cardBg} space-y-3.5 shadow-sm`}>
            <div>
              <label className={`block text-xs font-semibold ${textHeading} mb-1`}>Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold ${textHeading} mb-1`}>Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full p-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold ${textHeading} mb-1`}>Primary Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold ${textHeading} mb-1`}>WhatsApp Number</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold ${textHeading} mb-1`}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lahore"
                  className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#B99A68]"
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold ${textHeading} mb-1`}>Country</label>
                <input
                  type="text"
                  disabled
                  value="Pakistan"
                  className="w-full p-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 text-xs cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold ${textHeading} mb-1`}>Delivery Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, house/suite number, area..."
                className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="gold" disabled={savingProfile} className="w-full font-bold h-10 text-xs">
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: CHANGE PASSWORD */}
      {/* ======================================================== */}
      {activeSubpage === 'change_password' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>Change Password</h3>
          </div>

          <form onSubmit={handleSavePassword} className={`p-4 rounded-3xl border ${cardBg} space-y-3.5 shadow-sm`}>
            <div>
              <label className={`block text-xs font-semibold ${textHeading} mb-1`}>Current Password *</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#B99A68]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold ${textHeading} mb-1`}>New Password *</label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full p-2.5 pr-10 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#B99A68]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold ${textHeading} mb-1`}>Confirm New Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="gold" disabled={savingPassword} className="w-full font-bold h-10 text-xs">
                {savingPassword ? 'Updating Password...' : 'Update Account Password'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: APP LOCK & BIOMETRIC SETTINGS */}
      {/* ======================================================== */}
      {activeSubpage === 'app_lock' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>App Lock & Biometrics</h3>
          </div>

          <div className={`rounded-3xl border ${cardBg} divide-y ${dividerColor} shadow-sm overflow-hidden`}>
            {/* 1. Master App Lock Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#B99A68]/20 text-[#B99A68] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-xs font-bold ${textHeading} block`}>Enable App Lock</span>
                  <span className={`text-[10px] ${textMuted} block`}>
                    Require PIN or biometric check when app is opened
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleAppLock}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  lockEnabled ? 'bg-[#B99A68]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    lockEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. Configure / Change PIN */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#B99A68]/20 text-[#B99A68] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <span className={`text-xs font-bold ${textHeading} block`}>
                    {appLockConfig.hasPinConfigured ? 'Change Security PIN' : 'Set Up Security PIN'}
                  </span>
                  <span className={`text-[10px] ${textMuted} block`}>
                    Currently {pinLength}-digit PIN
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewPin('');
                  setConfirmPin('');
                  setShowPinModal(true);
                }}
                className="h-8 text-xs font-bold border-[#B99A68]/40 text-[#B99A68]"
              >
                {appLockConfig.hasPinConfigured ? 'Change PIN' : 'Set PIN'}
              </Button>
            </div>

            {/* 3. Real Device Biometric Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#B99A68]/20 text-[#B99A68] flex items-center justify-center">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${textHeading}`}>Biometric Unlock</span>
                    {biometricAvailable === false && (
                      <span className="text-[9px] text-amber-400 font-bold px-1.5 py-0.2 bg-amber-950/60 rounded">
                        Not Supported
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${textMuted} block`}>
                    Unlock with Fingerprint or Face ID via device sensor
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!lockEnabled || biometricAvailable === false}
                onClick={handleToggleBiometric}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 disabled:opacity-40 ${
                  biometricEnabled ? 'bg-[#B99A68]' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    biometricEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 4. Auto-Lock Duration Options */}
            <div className="p-4 space-y-2">
              <span className={`text-xs font-bold ${textHeading} block`}>Auto-Lock Timeout</span>
              <p className={`text-[10px] ${textMuted}`}>
                Lock app automatically after backgrounding or inactivity
              </p>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: 'Immediate', value: 0 },
                  { label: '30s', value: 0.5 },
                  { label: '1m', value: 1 },
                  { label: '5m', value: 5 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!lockEnabled}
                    onClick={() => handleChangeAutoLock(opt.value)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      autoLockMinutes === opt.value
                        ? 'bg-[#B99A68] text-slate-950 border-[#B99A68] shadow-sm'
                        : 'bg-black/10 text-slate-300 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Immediate Manual Lock */}
            {lockEnabled && (
              <div className="p-4 flex items-center justify-between">
                <div>
                  <span className={`text-xs font-bold ${textHeading} block`}>Immediate Lock</span>
                  <span className={`text-[10px] ${textMuted} block`}>
                    Trigger lock screen now without backgrounding
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="gold"
                  onClick={lockAppNow}
                  className="h-8 text-xs font-bold"
                >
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  Lock App Now
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: NOTIFICATIONS */}
      {/* ======================================================== */}
      {activeSubpage === 'notifications' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>Notification Preferences</h3>
          </div>

          <div className={`rounded-3xl border ${cardBg} divide-y ${dividerColor} shadow-sm overflow-hidden`}>
            {/* Order Progress */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold ${textHeading} block`}>Order Progress Milestones</span>
                <span className={`text-[10px] ${textMuted} block`}>Alerts when your piece moves between 11 stages</span>
              </div>
              <input
                type="checkbox"
                checked={notifOrderProgress}
                onChange={() => setNotifOrderProgress(!notifOrderProgress)}
                className="w-4 h-4 accent-[#B99A68]"
              />
            </div>

            {/* Workshop Videos */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold ${textHeading} block`}>Workshop Crafting Videos</span>
                <span className={`text-[10px] ${textMuted} block`}>Alerts when master carvers upload HD footage</span>
              </div>
              <input
                type="checkbox"
                checked={notifWorkshopVideos}
                onChange={() => setNotifWorkshopVideos(!notifWorkshopVideos)}
                className="w-4 h-4 accent-[#B99A68]"
              />
            </div>

            {/* New Products */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold ${textHeading} block`}>New Furniture Catalogues</span>
                <span className={`text-[10px] ${textMuted} block`}>Exclusive architectural showcases</span>
              </div>
              <input
                type="checkbox"
                checked={notifNewProducts}
                onChange={() => setNotifNewProducts(!notifNewProducts)}
                className="w-4 h-4 accent-[#B99A68]"
              />
            </div>

            {/* Payments */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold ${textHeading} block`}>Verified Payment Receipts</span>
                <span className={`text-[10px] ${textMuted} block`}>Instant confirmations of bank transfers and advances</span>
              </div>
              <input
                type="checkbox"
                checked={notifPayments}
                onChange={() => setNotifPayments(!notifPayments)}
                className="w-4 h-4 accent-[#B99A68]"
              />
            </div>

            {/* Live Test Alert Button */}
            <div className="p-4 bg-black/5 flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold ${textHeading} block`}>Live Notification Test</span>
                <span className={`text-[10px] ${textMuted} block`}>Dispatch a real test alert to device status tray</span>
              </div>
              <Button
                size="sm"
                variant="gold"
                disabled={testingPush}
                onClick={handleTestPush}
                className="h-8 text-xs font-bold"
              >
                {testingPush ? 'Testing...' : 'Test Alert 🔔'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: APPEARANCE & APP PREFERENCES */}
      {/* ======================================================== */}
      {activeSubpage === 'appearance' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>Appearance & Preferences</h3>
          </div>

          <div className={`p-4 rounded-3xl border ${cardBg} space-y-4 shadow-sm`}>
            {/* Theme Selector */}
            <div>
              <span className={`text-xs font-bold ${textHeading} block mb-1.5`}>Theme & Atmosphere</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark', label: 'Obsidian Gold', icon: Moon },
                  { id: 'light', label: 'Warm Ivory', icon: Sun },
                  { id: 'system', label: 'System Default', icon: Sliders },
                ].map((th) => {
                  const Icon = th.icon;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        setAppTheme(th.id as any);
                        showToast('success', `Theme switched to ${th.label}`);
                      }}
                      className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 text-xs font-bold border transition-all ${
                        appTheme === th.id
                          ? 'bg-[#B99A68] text-slate-950 border-[#B99A68] shadow-md'
                          : 'bg-black/10 text-stone-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{th.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Selector */}
            <div className="pt-2 border-t border-white/5">
              <span className={`text-xs font-bold ${textHeading} block mb-1.5`}>Display Language</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'en', label: 'English (US)' },
                  { id: 'ur', label: 'اردو (Urdu)' },
                  { id: 'bi', label: 'Bilingual' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLanguage(l.id as any);
                      showToast('success', `Language set to ${l.label}`);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      language === l.id
                        ? 'bg-[#B99A68] text-slate-950 border-[#B99A68]'
                        : 'bg-black/10 text-stone-300 border-white/10'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound & Haptic Feedback */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className={`text-xs font-bold ${textHeading} block`}>Sound & Haptic Feedback</span>
                <span className={`text-[10px] ${textMuted} block`}>Button taps and order completion chimes</span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={() => setSoundEnabled(!soundEnabled)}
                className="w-4 h-4 accent-[#B99A68]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: HELP & SUPPORT */}
      {/* ======================================================== */}
      {activeSubpage === 'support' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>Showroom Concierge & VIP Support</h3>
          </div>

          <div className={`p-4 rounded-3xl border ${cardBg} space-y-3 shadow-sm`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#B99A68]/20 text-[#B99A68] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-xs font-bold ${textHeading}`}>Private Atelier Concierge</h4>
                <p className={`text-[10px] ${textMuted}`}>Available 10:00 AM – 9:00 PM PST</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/${(settings.whatsappNumber || '+923130207445').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-[#128C7E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Connect via WhatsApp Concierge
              </a>

              <a
                href={`tel:${settings.primaryPhone || '+923001234567'}`}
                className="p-3 rounded-2xl bg-[#262421] text-[#B99A68] border border-[#B99A68]/40 font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Phone className="w-4 h-4" />
                Call Atelier Hotline
              </a>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${textMuted} block`}>
                Showroom & Workshop Location:
              </span>
              <p className={`text-xs ${textHeading} leading-relaxed`}>
                {settings.completeAddress || 'Sheikh-U-Pura Road Near Imtiaz Mega Mall, Faisalabad, Pakistan'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: ABOUT APP */}
      {/* ======================================================== */}
      {activeSubpage === 'about' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>About Saad Furniture App</h3>
          </div>

          <div className={`p-5 rounded-3xl border ${cardBg} text-center space-y-3 shadow-sm`}>
            <div className="w-16 h-16 rounded-3xl bg-[#262421] border border-[#B99A68]/40 mx-auto flex items-center justify-center text-[#B99A68]">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <h4 className={`text-sm font-serif font-bold ${textHeading}`}>
                {settings.displayName || 'Saad Furniture & Interior Studio'}
              </h4>
              <p className="text-[10px] text-[#B99A68] font-mono mt-0.5">Version 2.4.0 (Turbopack Engine)</p>
            </div>
            <p className={`text-xs ${textMuted} leading-relaxed max-w-sm mx-auto`}>
              Bespoke luxury furniture manufacturing platform with real-time workshop tracking, seamless order management, premium furniture collections, and secure account protection.
            </p>
            <div className="pt-3 border-t border-white/5 flex justify-center gap-4 text-xs text-[#B99A68]">
              <span className="hover:underline cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:underline cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: ACCOUNT INFO */}
      {/* ======================================================== */}
      {activeSubpage === 'account_info' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>Account Information</h3>
          </div>

          <div className={`p-4 rounded-3xl border ${cardBg} space-y-3 shadow-sm text-xs`}>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className={textMuted}>Account ID:</span>
              <span className="font-mono font-bold text-[#B99A68]">#{currentUser?.id}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className={textMuted}>Registered Email:</span>
              <span className={`font-semibold ${textHeading}`}>{currentUser?.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className={textMuted}>Patron Role:</span>
              <span className="capitalize font-bold text-amber-300">{currentUser?.role}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className={textMuted}>Member Since:</span>
              <span className={textHeading}>
                {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className={textMuted}>Account Status:</span>
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Active & Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBPAGE: ACTIVE SESSIONS */}
      {/* ======================================================== */}
      {activeSubpage === 'active_sessions' && (
        <div className="space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <button
              type="button"
              onClick={() => setActiveSubpage('home')}
              className="p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className={`text-sm font-bold ${textHeading}`}>Login Sessions & Devices</h3>
          </div>

          <div className={`p-4 rounded-3xl border ${cardBg} space-y-3 shadow-sm text-xs`}>
            <div className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block">Current Device Session</span>
                  <span className="text-[10px] text-emerald-300 block">Active Now • HttpOnly Secure JWT</span>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] uppercase font-bold">
                Online
              </Badge>
            </div>

            <p className={`text-[11px] ${textMuted} leading-relaxed`}>
              Your session is protected with cryptographically signed HttpOnly JWT tokens that automatically expire and resist cross-site script extraction.
            </p>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={onLogout}
                className="w-full text-xs font-bold border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Logout from All Devices
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SET / CHANGE PIN MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        title={appLockConfig.hasPinConfigured ? 'Change Security PIN' : 'Configure Security PIN'}
        subtitle="Used to unlock your Saad Furniture application"
        maxWidth="md"
      >
        <form onSubmit={handleSavePin} className="space-y-4 text-xs">
          {/* PIN Length Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">PIN Length</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPinLength(4);
                  setNewPin('');
                  setConfirmPin('');
                }}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  pinLength === 4
                    ? 'bg-[#B99A68] text-slate-950 border-[#B99A68]'
                    : 'bg-slate-900 text-slate-400 border-white/10'
                }`}
              >
                4 Digits
              </button>
              <button
                type="button"
                onClick={() => {
                  setPinLength(6);
                  setNewPin('');
                  setConfirmPin('');
                }}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  pinLength === 6
                    ? 'bg-[#B99A68] text-slate-950 border-[#B99A68]'
                    : 'bg-slate-900 text-slate-400 border-white/10'
                }`}
              >
                6 Digits
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Enter New {pinLength}-Digit PIN *
            </label>
            <input
              type="password"
              maxLength={pinLength}
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={`${'•'.repeat(pinLength)}`}
              className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Confirm New {pinLength}-Digit PIN *
            </label>
            <input
              type="password"
              maxLength={pinLength}
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={`${'•'.repeat(pinLength)}`}
              className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-center text-lg font-mono tracking-widest focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setShowPinModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              disabled={savingPin || newPin.length !== pinLength || newPin !== confirmPin}
              className="font-bold"
            >
              {savingPin ? 'Saving PIN...' : 'Save Security PIN'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
