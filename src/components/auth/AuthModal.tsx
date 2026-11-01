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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-[#1C1A18] border border-[#B99A68]/30 rounded-3xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Crest Header */}
        <div className="p-6 pb-2 text-center relative border-b border-white/5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#B99A68]/40 shadow-xl bg-[#262421] p-1.5 mx-auto mb-2.5">
            <img src="/assets/branding/app-dp.svg" alt="Saad Furniture" className="w-full h-full object-contain" />
          </div>
          <span className="font-serif tracking-[0.2em] text-sm font-bold text-white uppercase block">
            SAAD <span className="text-[#B99A68]">FURNITURE</span>
          </span>
          <span className="text-[10px] text-[#89847C] tracking-widest uppercase block mt-0.5">
            Artisanal Bespoke Workshop • Since 2008
          </span>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#262421] p-1 rounded-2xl border border-white/5 mt-4">
            <button
              type="button"
              onClick={() => handleTabSwitch('signin')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-[#B99A68] text-[#262421] shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-[#B99A68] text-[#262421] shadow-md'
                  : 'text-slate-400 hover:text-white'
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
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs rounded-xl h-11 mt-2 shadow-md"
              >
                {loading ? 'Authenticating...' : 'Sign In to Account'}
              </Button>

              <div className="text-center pt-2 text-xs text-slate-400">
                New patron to Saad Furniture?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  className="text-[#B99A68] font-bold hover:underline"
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Muhammad Saad"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Complete Delivery Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Street / Sector / Area"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  City <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Password (min 6) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#262421] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs rounded-xl h-11 mt-2 shadow-md"
              >
                {loading ? 'Registering...' : 'Create Customer Account'}
              </Button>

              <div className="text-center pt-2 text-xs text-slate-400">
                Already registered with Saad Furniture?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  className="text-[#B99A68] font-bold hover:underline"
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
