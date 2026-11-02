'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, User, Phone, MapPin, CheckCircle2, UserPlus, LogIn, AlertCircle, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  onSuccess?: (user: any) => void;
  intendedDestination?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
  onSuccess,
  intendedDestination,
}) => {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Switch tabs
  const handleTabSwitch = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
  };

  // Sign In submit
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      setSuccessMessage('Signed in successfully! Welcome back.');
      try {
        localStorage.setItem('saad_patron_profile', JSON.stringify(data.user));
      } catch {}

      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess(data.user);
        }
        // Only route to admin/staff consoles if an executive logs in
        if (data.redirectUrl && (data.user?.role === 'super_admin' || data.user?.role === 'staff')) {
          router.push(data.redirectUrl);
        }
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up submit
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      setLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: signupEmail.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim(),
          password: signupPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMessage(data.message || 'Account ready! Welcome to Saad Furniture.');
      try {
        localStorage.setItem('saad_patron_profile', JSON.stringify(data.user));
      } catch {}

      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess(data.user);
        }
        if (data.redirectUrl && (data.user?.role === 'super_admin' || data.user?.role === 'staff')) {
          router.push(data.redirectUrl);
        }
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#0B0B0D] border border-[#D6B36A]/40 rounded-3xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#171719] border border-[#2D2D30] text-[#C5C5C5] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Crest Header */}
        <div className="p-6 pb-2 text-center relative border-b border-[#2D2D30]">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#D6B36A]/40 shadow-xl bg-[#171719] p-1.5 mx-auto mb-2.5">
            <img src="/assets/branding/app-dp.svg" alt="Saad Furniture" className="w-full h-full object-contain" />
          </div>
          <span className="font-serif tracking-[0.2em] text-sm font-bold text-white uppercase block">
            SAAD <span className="text-[#D6B36A]">FURNITURE</span>
          </span>
          <span className="text-[10px] text-[#A5A5A5] tracking-widest uppercase block mt-0.5">
            Artisanal Bespoke Workshop • Since 2008
          </span>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#171719] p-1 rounded-2xl border border-[#2D2D30] mt-4">
            <button
              type="button"
              onClick={() => handleTabSwitch('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#D6B36A] text-[#0B0B0D] font-black shadow-md'
                  : 'text-[#C5C5C5] hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#D6B36A] text-[#0B0B0D] font-black shadow-md'
                  : 'text-[#C5C5C5] hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-200 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-black text-xs rounded-xl h-11 mt-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to Account'}
              </button>

              <div className="text-center pt-2 text-xs text-[#A5A5A5]">
                New patron to Saad Furniture?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  className="text-[#D6B36A] font-bold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Muhammad Saad"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
                  Complete Delivery Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Street / Sector / Area"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
                  City <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
                    Password (min 6) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C5C5C5] mb-1">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#A5A5A5]" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-xl text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-black text-xs rounded-xl h-11 mt-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {loading ? 'Registering...' : 'Create Customer Account'}
              </button>

              <div className="text-center pt-2 text-xs text-[#A5A5A5]">
                Already registered with Saad Furniture?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  className="text-[#D6B36A] font-bold hover:underline cursor-pointer"
                >
                  Sign In here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
