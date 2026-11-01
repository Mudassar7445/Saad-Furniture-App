'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  Fingerprint,
  Delete,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { authenticateWithBiometric } from '@/lib/auth/biometrics';

interface AppLockContextType {
  isLocked: boolean;
  lockAppNow: () => void;
  unlockApp: () => void;
  appLockConfig: {
    enabled: boolean;
    pinLength: number;
    biometricEnabled: boolean;
    biometricCredentialId: string | null;
    autoLockMinutes: number;
    hasPinConfigured: boolean;
    isLockedOut: boolean;
    lockoutRemainingSeconds: number;
  };
  refreshAppLockConfig: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType>({
  isLocked: false,
  lockAppNow: () => {},
  unlockApp: () => {},
  appLockConfig: {
    enabled: false,
    pinLength: 4,
    biometricEnabled: false,
    biometricCredentialId: null,
    autoLockMinutes: 1,
    hasPinConfigured: false,
    isLockedOut: false,
    lockoutRemainingSeconds: 0,
  },
  refreshAppLockConfig: async () => {},
});

export const useAppLock = () => useContext(AppLockContext);

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClientReady, setIsClientReady] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [appLockConfig, setAppLockConfig] = useState({
    enabled: false,
    pinLength: 4,
    biometricEnabled: false,
    biometricCredentialId: null as string | null,
    autoLockMinutes: 1,
    hasPinConfigured: false,
    isLockedOut: false,
    lockoutRemainingSeconds: 0,
  });

  const lastHiddenTimeRef = useRef<number | null>(null);

  // Synchronous Frame-0 check on client mount
  useEffect(() => {
    setIsClientReady(true);
    let lockEnabledLocally = false;
    let unlockedThisSession = false;
    let localPinLength = 4;
    let localBiometric = false;
    let localCredId: string | null = null;
    let localAutoLock = 1;

    try {
      lockEnabledLocally = localStorage.getItem('saad_app_lock_enabled') === 'true';
      unlockedThisSession = sessionStorage.getItem('saad_app_unlocked') === 'true';
      localPinLength = localStorage.getItem('saad_app_lock_pin_length') === '6' ? 6 : 4;
      localBiometric = localStorage.getItem('saad_app_lock_biometric') === 'true';
      localCredId = localStorage.getItem('saad_app_lock_cred_id');
      const storedAutoLock = localStorage.getItem('saad_app_lock_autolock');
      if (storedAutoLock !== null) localAutoLock = Number(storedAutoLock);
    } catch {}

    if (lockEnabledLocally && !unlockedThisSession) {
      setIsLocked(true);
      setAppLockConfig((prev) => ({
        ...prev,
        enabled: true,
        pinLength: localPinLength,
        biometricEnabled: localBiometric,
        biometricCredentialId: localCredId,
        autoLockMinutes: localAutoLock,
        hasPinConfigured: true,
      }));
    }
  }, []);

  // Fetch lock config from API and sync to local storage
  const refreshAppLockConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/app-lock');
      if (res.ok) {
        const data = await res.json();
        setAppLockConfig(data);

        try {
          localStorage.setItem('saad_app_lock_enabled', data.enabled ? 'true' : 'false');
          localStorage.setItem('saad_app_lock_pin_length', String(data.pinLength || 4));
          localStorage.setItem('saad_app_lock_biometric', data.biometricEnabled ? 'true' : 'false');
          if (data.biometricCredentialId) {
            localStorage.setItem('saad_app_lock_cred_id', data.biometricCredentialId);
          }
          if (data.autoLockMinutes !== undefined) {
            localStorage.setItem('saad_app_lock_autolock', String(data.autoLockMinutes));
          }
        } catch {}

        let unlockedThisSession = false;
        try {
          unlockedThisSession = sessionStorage.getItem('saad_app_unlocked') === 'true';
        } catch {}

        if (data.enabled && data.hasPinConfigured && !unlockedThisSession) {
          setIsLocked(true);
        } else if (!data.enabled) {
          setIsLocked(false);
        }
      }
    } catch (err) {
      console.warn('App lock config fetch note:', err);
    }
  }, []);

  useEffect(() => {
    refreshAppLockConfig();
  }, [refreshAppLockConfig]);

  // Handle visibility change (backgrounding and foregrounding)
  useEffect(() => {
    if (!appLockConfig.enabled || !appLockConfig.hasPinConfigured) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastHiddenTimeRef.current = Date.now();
      } else {
        if (lastHiddenTimeRef.current !== null) {
          const elapsedMs = Date.now() - lastHiddenTimeRef.current;
          const autoLockMs = (appLockConfig.autoLockMinutes ?? 1) * 60 * 1000;

          if (appLockConfig.autoLockMinutes === 0 || elapsedMs >= autoLockMs) {
            try {
              sessionStorage.removeItem('saad_app_unlocked');
            } catch {}
            setIsLocked(true);
          }
          lastHiddenTimeRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [appLockConfig.enabled, appLockConfig.hasPinConfigured, appLockConfig.autoLockMinutes]);

  const lockAppNow = useCallback(() => {
    if (appLockConfig.enabled && appLockConfig.hasPinConfigured) {
      try {
        sessionStorage.removeItem('saad_app_unlocked');
      } catch {}
      setIsLocked(true);
    }
  }, [appLockConfig.enabled, appLockConfig.hasPinConfigured]);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    try {
      sessionStorage.setItem('saad_app_unlocked', 'true');
    } catch {}
    lastHiddenTimeRef.current = null;
  }, []);

  // 1. Initial Frame-0 Security Splash Gate:
  // While client hydrates or checks status, children is NEVER rendered to eliminate content flash
  if (!isClientReady) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#0b0d11] flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="w-20 h-20 rounded-3xl bg-[#161411] border border-[#B99A68]/50 shadow-2xl flex items-center justify-center p-3 text-[#B99A68] mb-4 shadow-[0_0_35px_rgba(185,154,104,0.2)] animate-pulse">
          <img src="/assets/branding/app-dp.svg?v=3" alt="Saad Furniture" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-serif font-black text-xl text-white tracking-wider">Saad Furniture</h1>
        <p className="text-[11px] text-[#B99A68] tracking-widest uppercase mt-1.5 font-semibold">Securing Private Atelier Session...</p>
      </div>
    );
  }

  // 2. Security Lock Active:
  // Render ONLY the lock screen. Children is completely unmounted, preventing data fetching or DOM leaks
  if (isLocked) {
    return (
      <AppLockContext.Provider
        value={{
          isLocked,
          lockAppNow,
          unlockApp,
          appLockConfig,
          refreshAppLockConfig,
        }}
      >
        <AppLockScreen
          config={appLockConfig}
          onSuccess={unlockApp}
          onRefreshConfig={refreshAppLockConfig}
        />
      </AppLockContext.Provider>
    );
  }

  // 3. Authenticated: Mount and render application children
  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        lockAppNow,
        unlockApp,
        appLockConfig,
        refreshAppLockConfig,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
};

// ==========================================
// FULL-SCREEN LUXURY APP LOCK SCREEN
// ==========================================
interface AppLockScreenProps {
  config: {
    pinLength: number;
    biometricEnabled: boolean;
    biometricCredentialId?: string | null;
    isLockedOut: boolean;
    lockoutRemainingSeconds: number;
  };
  onSuccess: () => void;
  onRefreshConfig: () => Promise<void>;
}

const AppLockScreen: React.FC<AppLockScreenProps> = ({
  config,
  onSuccess,
  onRefreshConfig,
}) => {
  const pinLength = config.pinLength === 6 ? 6 : 4;
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(config.lockoutRemainingSeconds || 0);

  // Forgot PIN fallback state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onRefreshConfig();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer, onRefreshConfig]);

  // Biometric trigger handler (called directly by user gesture button or keypad)
  const triggerBiometricUnlock = useCallback(async () => {
    if (lockoutTimer > 0) return;
    try {
      setVerifying(true);
      setErrorMessage(null);

      const result = await authenticateWithBiometric(config.biometricCredentialId || undefined);
      if (result.success) {
        onSuccess();
      } else if (result.error && !result.error.includes('cancel')) {
        setErrorMessage(result.error);
      }
    } catch (err: any) {
      console.warn('Biometric unlock attempt note:', err);
    } finally {
      setVerifying(false);
    }
  }, [lockoutTimer, onSuccess, config.biometricCredentialId]);

  // Gentle auto-prompt for supported biometrics on initial mount
  useEffect(() => {
    if (config.biometricEnabled && lockoutTimer === 0) {
      const timer = setTimeout(() => {
        triggerBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [config.biometricEnabled, lockoutTimer, triggerBiometricUnlock]);

  // Keypad letters mapping like iOS/Android banking apps
  const keypadData = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
  ];

  // Handle PIN digit press
  const handleDigitPress = (digit: string) => {
    if (verifying || lockoutTimer > 0) return;
    setErrorMessage(null);

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    setPin((prev) => {
      if (prev.length >= pinLength) return prev;
      const next = prev + digit;
      if (next.length === pinLength) {
        verifyPinSubmission(next);
      }
      return next;
    });
  };

  const handleBackspace = () => {
    if (verifying || lockoutTimer > 0) return;
    setErrorMessage(null);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
    setPin((prev) => prev.slice(0, -1));
  };

  // Submit PIN for server verification
  const verifyPinSubmission = async (fullPin: string) => {
    try {
      setVerifying(true);
      setErrorMessage(null);

      const res = await fetch('/api/auth/app-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_pin',
          pin: fullPin,
        }),
      });

      const data = await res.json();

      if (res.ok && data.valid) {
        onSuccess();
      } else {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);

        setPin('');
        setErrorMessage(data.error || 'Incorrect security PIN');

        if (data.isLockedOut) {
          setLockoutTimer(data.lockoutRemainingSeconds || 60);
        }
      }
    } catch (err: any) {
      setErrorMessage('Network connection error. Please try again.');
      setPin('');
    } finally {
      setVerifying(false);
    }
  };

  // Handle password unlock fallback
  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountPassword) return;

    try {
      setVerifyingPassword(true);
      setPasswordError(null);

      const res = await fetch('/api/auth/app-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_password',
          password: accountPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setShowPasswordModal(false);
        setAccountPassword('');
        onSuccess();
      } else {
        setPasswordError(data.error || 'Invalid account password');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Verification failed');
    } finally {
      setVerifyingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0b0d11] text-white flex flex-col justify-between px-6 py-8 select-none animate-in fade-in duration-300">
      {/* Background Subtle Luxury Furniture Ambience */}
      <div className="absolute inset-0 bg-radial from-[#181613] via-[#0e1014] to-[#07080b] pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-[#B99A68]/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#B99A68]/8 rounded-full blur-[90px] pointer-events-none" />

      {/* 1. Top Header: Saad Furniture Crest + Welcome Back + Subtitle */}
      <div className="text-center pt-2 relative z-10">
        <div className="w-16 h-16 mx-auto mb-3 drop-shadow-[0_8px_24px_rgba(212,175,55,0.35)]">
          <img
            src="/assets/branding/app-dp.svg?v=3"
            alt="Saad Furniture"
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-2xl font-serif font-black text-white tracking-tight">
          Welcome Back
        </h1>

        <p className="text-[11px] text-[#B99A68] font-semibold tracking-widest uppercase mt-1">
          Your privacy is protected
        </p>
      </div>

      {/* 2. Center: Large Biometric Unlock Area + PIN Indicators */}
      <div className="my-auto text-center space-y-5 relative z-10">
        {/* Large Elegant Biometric Fingerprint Area */}
        {config.biometricEnabled && lockoutTimer === 0 && (
          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={triggerBiometricUnlock}
              disabled={verifying}
              className="relative p-5 rounded-full bg-[#161411] border-2 border-[#B99A68]/50 hover:border-[#B99A68] active:scale-95 shadow-[0_0_30px_rgba(185,154,104,0.25)] transition-all touch-manipulation cursor-pointer group"
              aria-label="Unlock with Fingerprint or Face ID"
            >
              {/* Concentric subtle pulsing rings */}
              <div className="absolute inset-0 rounded-full border border-[#B99A68]/30 animate-ping opacity-20 pointer-events-none" />
              <Fingerprint className="w-11 h-11 text-[#B99A68] group-hover:scale-105 transition-transform stroke-[1.8]" />
            </button>
            <span className="text-[10px] font-semibold text-[#B99A68]/80 tracking-widest uppercase mt-2.5">
              Touch Sensor to Unlock
            </span>
          </div>
        )}

        {/* Security Lockout Notice */}
        {lockoutTimer > 0 ? (
          <div className="p-3.5 bg-amber-950/80 border border-amber-500/40 rounded-2xl max-w-xs mx-auto text-amber-200 text-xs space-y-1 shadow-xl">
            <AlertCircle className="w-5 h-5 mx-auto text-amber-400" />
            <p className="font-bold">Security Lockout Active</p>
            <p className="text-[11px] text-amber-300/80">
              Please wait {lockoutTimer} seconds before entering your PIN again.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* PIN Dots Indicator */}
            <div
              className={`flex justify-center items-center gap-4 transition-transform ${
                isShaking ? 'animate-bounce text-red-500' : ''
              }`}
            >
              {Array.from({ length: pinLength }).map((_, idx) => {
                const isFilled = idx < pin.length;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-gradient-to-tr from-[#B99A68] via-[#E5C278] to-[#FFFFFF] scale-125 shadow-[0_0_14px_rgba(212,175,55,0.8)] ring-2 ring-[#B99A68]/60'
                        : 'bg-white/5 border-2 border-[#B99A68]/30'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <p className="text-xs font-semibold text-rose-400 animate-in fade-in duration-200">
                {errorMessage}
              </p>
            )}

            {verifying && (
              <p className="text-xs text-[#B99A68] flex items-center justify-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Credentials...
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom: Premium Numeric Keypad (Banking Style) */}
      <div className="pb-2 max-w-xs w-full mx-auto relative z-10 space-y-3.5">
        <div className="grid grid-cols-3 gap-3.5 justify-items-center">
          {keypadData.map((item) => (
            <button
              key={item.num}
              type="button"
              disabled={verifying || lockoutTimer > 0}
              onClick={() => handleDigitPress(item.num)}
              className="w-18 h-18 rounded-full bg-white/5 hover:bg-white/10 active:bg-[#B99A68] active:text-[#0B0D11] border border-white/10 active:border-[#B99A68] transition-all flex flex-col items-center justify-center active:scale-95 shadow-sm disabled:opacity-40 touch-manipulation cursor-pointer group"
            >
              <span className="text-2xl font-bold font-mono group-active:text-[#0B0D11] transition-colors">
                {item.num}
              </span>
              {item.letters ? (
                <span className="text-[9px] font-semibold tracking-widest text-[#B99A68]/80 group-active:text-[#0B0D11]/70 transition-colors -mt-0.5">
                  {item.letters}
                </span>
              ) : (
                <span className="h-[9px]" />
              )}
            </button>
          ))}

          {/* Biometric Button on Keypad (if enabled) */}
          {config.biometricEnabled ? (
            <button
              type="button"
              disabled={lockoutTimer > 0 || verifying}
              onClick={triggerBiometricUnlock}
              className="w-18 h-18 rounded-full bg-[#B99A68]/15 hover:bg-[#B99A68]/25 active:scale-95 text-[#B99A68] flex items-center justify-center border border-[#B99A68]/40 transition-all shadow-sm disabled:opacity-30 touch-manipulation cursor-pointer"
              title="Authenticate with Fingerprint / Face ID"
              aria-label="Biometric sensor"
            >
              <Fingerprint className="w-7 h-7 stroke-[2]" />
            </button>
          ) : (
            <div className="w-18 h-18" />
          )}

          {/* Digit 0 */}
          <button
            type="button"
            disabled={verifying || lockoutTimer > 0}
            onClick={() => handleDigitPress('0')}
            className="w-18 h-18 rounded-full bg-white/5 hover:bg-white/10 active:bg-[#B99A68] active:text-[#0B0D11] border border-white/10 active:border-[#B99A68] transition-all flex flex-col items-center justify-center active:scale-95 shadow-sm disabled:opacity-40 touch-manipulation cursor-pointer group"
          >
            <span className="text-2xl font-bold font-mono group-active:text-[#0B0D11] transition-colors">
              0
            </span>
            <span className="h-[9px]" />
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            disabled={verifying || lockoutTimer > 0 || pin.length === 0}
            onClick={handleBackspace}
            className="w-18 h-18 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 active:text-white flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-sm disabled:opacity-20 touch-manipulation cursor-pointer"
            aria-label="Delete last digit"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Fallback Option */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="text-xs text-[#B99A68] hover:text-[#FFF5DF] hover:underline font-medium transition-colors"
          >
            Forgot PIN? Unlock with password
          </button>
        </div>
      </div>

      {/* PASSWORD FALLBACK MODAL */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Unlock with Account Password"
        subtitle="Authenticate with your Saad Furniture login password"
        maxWidth="md"
      >
        <form onSubmit={handlePasswordUnlock} className="space-y-4 text-xs">
          {passwordError && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 text-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Account Login Password
            </label>
            <div className="relative">
              <input
                type={showPasswordText ? 'text' : 'password'}
                required
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full p-2.5 pr-10 bg-slate-900 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              />
              <button
                type="button"
                onClick={() => setShowPasswordText(!showPasswordText)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              disabled={verifyingPassword || !accountPassword}
              className="font-bold"
            >
              {verifyingPassword ? 'Verifying...' : 'Unlock Atelier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
