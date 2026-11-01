'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock,
  ShieldCheck,
  Fingerprint,
  Delete,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { authenticateWithBiometric, isBiometricSupported } from '@/lib/auth/biometrics';

interface AppLockContextType {
  isLocked: boolean;
  lockAppNow: () => void;
  unlockApp: () => void;
  appLockConfig: {
    enabled: boolean;
    pinLength: number;
    biometricEnabled: boolean;
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
    autoLockMinutes: 1,
    hasPinConfigured: false,
    isLockedOut: false,
    lockoutRemainingSeconds: 0,
  },
  refreshAppLockConfig: async () => {},
});

export const useAppLock = () => useContext(AppLockContext);

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [appLockConfig, setAppLockConfig] = useState({
    enabled: false,
    pinLength: 4,
    biometricEnabled: false,
    autoLockMinutes: 1,
    hasPinConfigured: false,
    isLockedOut: false,
    lockoutRemainingSeconds: 0,
  });

  const lastHiddenTimeRef = useRef<number | null>(null);
  const isUnlockedThisSession = useRef<boolean>(false);

  // Fetch lock config from API
  const refreshAppLockConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/app-lock');
      if (res.ok) {
        const data = await res.json();
        setAppLockConfig(data);

        // If enabled and user hasn't unlocked this session yet, lock immediately
        if (data.enabled && data.hasPinConfigured && !isUnlockedThisSession.current) {
          setIsLocked(true);
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

          // If autoLockMinutes === 0 (immediate) or elapsed exceeds duration
          if (appLockConfig.autoLockMinutes === 0 || elapsedMs >= autoLockMs) {
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
      setIsLocked(true);
    }
  }, [appLockConfig.enabled, appLockConfig.hasPinConfigured]);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
    isUnlockedThisSession.current = true;
    lastHiddenTimeRef.current = null;
  }, []);

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
      {isLocked && appLockConfig.enabled && appLockConfig.hasPinConfigured && (
        <AppLockScreen
          config={appLockConfig}
          onSuccess={unlockApp}
          onRefreshConfig={refreshAppLockConfig}
        />
      )}
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

  // Attempt biometric on mount if enabled
  const triggerBiometricUnlock = useCallback(async () => {
    if (lockoutTimer > 0) return;
    try {
      const result = await authenticateWithBiometric();
      if (result.success) {
        onSuccess();
      } else if (result.error && !result.error.includes('cancel')) {
        setErrorMessage(result.error);
      }
    } catch (err: any) {
      console.warn('Biometric unlock attempt note:', err);
    }
  }, [lockoutTimer, onSuccess]);

  useEffect(() => {
    if (config.biometricEnabled && lockoutTimer === 0) {
      // Auto prompt after slight mount delay
      const timer = setTimeout(() => {
        triggerBiometricUnlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [config.biometricEnabled, lockoutTimer, triggerBiometricUnlock]);

  // Handle PIN digit press
  const handleDigitPress = (digit: string) => {
    if (verifying || lockoutTimer > 0) return;
    setErrorMessage(null);

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
        // Trigger shake animation
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
    <div className="fixed inset-0 z-[9999] bg-[#141822] text-white flex flex-col justify-between p-6 select-none animate-in fade-in duration-300">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#B99A68]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#B99A68]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="text-center pt-8 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-[#262421] border border-[#B99A68]/40 shadow-2xl mx-auto flex items-center justify-center p-3 text-[#B99A68] mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-serif font-bold text-white tracking-wide">
          Saad Furniture Private Atelier
        </h2>
        <p className="text-xs text-[#B99A68] font-medium tracking-wider uppercase mt-1">
          {lockoutTimer > 0 ? 'Authentication Paused' : 'Enter Security PIN to Unlock'}
        </p>
      </div>

      {/* Center: PIN Dots & Errors */}
      <div className="my-auto text-center space-y-4 relative z-10">
        {/* Lockout Notice */}
        {lockoutTimer > 0 ? (
          <div className="p-3 bg-amber-950/80 border border-amber-500/40 rounded-2xl max-w-xs mx-auto text-amber-200 text-xs space-y-1 shadow-lg">
            <AlertCircle className="w-5 h-5 mx-auto text-amber-400" />
            <p className="font-bold">Security Lockout Active</p>
            <p className="text-[11px] text-amber-300/80">
              Please wait {lockoutTimer} seconds before entering your PIN again.
            </p>
          </div>
        ) : (
          <>
            {/* PIN Dots Indicator */}
            <div
              className={`flex justify-center items-center gap-3.5 transition-transform ${
                isShaking ? 'animate-bounce text-red-500' : ''
              }`}
            >
              {Array.from({ length: pinLength }).map((_, idx) => {
                const isFilled = idx < pin.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-[#B99A68] scale-125 shadow-lg shadow-[#B99A68]/50 ring-2 ring-[#B99A68]/40'
                        : 'bg-white/20 border border-white/20'
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
          </>
        )}
      </div>

      {/* Bottom: Numeric Keypad */}
      <div className="pb-4 max-w-xs w-full mx-auto relative z-10 space-y-4">
        <div className="grid grid-cols-3 gap-3.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={verifying || lockoutTimer > 0}
              onClick={() => handleDigitPress(num)}
              className="w-full aspect-square rounded-full bg-white/5 hover:bg-white/15 active:bg-[#B99A68] active:text-slate-950 text-xl font-bold font-mono transition-all flex items-center justify-center border border-white/10 active:scale-95 shadow-sm disabled:opacity-40"
            >
              {num}
            </button>
          ))}

          {/* Biometric Button or Empty */}
          {config.biometricEnabled ? (
            <button
              type="button"
              disabled={lockoutTimer > 0}
              onClick={triggerBiometricUnlock}
              className="w-full aspect-square rounded-full bg-[#B99A68]/15 hover:bg-[#B99A68]/30 active:scale-95 text-[#B99A68] flex items-center justify-center border border-[#B99A68]/40 transition-all shadow-sm disabled:opacity-40"
              title="Authenticate with Fingerprint / Face ID"
            >
              <Fingerprint className="w-7 h-7" />
            </button>
          ) : (
            <div />
          )}

          {/* Digit 0 */}
          <button
            type="button"
            disabled={verifying || lockoutTimer > 0}
            onClick={() => handleDigitPress('0')}
            className="w-full aspect-square rounded-full bg-white/5 hover:bg-white/15 active:bg-[#B99A68] active:text-slate-950 text-xl font-bold font-mono transition-all flex items-center justify-center border border-white/10 active:scale-95 shadow-sm disabled:opacity-40"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            disabled={verifying || lockoutTimer > 0 || pin.length === 0}
            onClick={handleBackspace}
            className="w-full aspect-square rounded-full bg-white/5 hover:bg-white/15 text-slate-300 flex items-center justify-center border border-white/10 active:scale-95 transition-all shadow-sm disabled:opacity-30"
            aria-label="Delete last digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Fallback Option */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="text-xs text-[#B99A68] hover:underline font-medium"
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
