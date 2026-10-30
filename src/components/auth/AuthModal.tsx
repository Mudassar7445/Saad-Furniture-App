'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, Shield, User, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'customer' | 'staff' | 'super_admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'customer',
}) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onClose();
      router.push(data.redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: 'super_admin' | 'staff_orders' | 'staff_finance' | 'customer') => {
    setError(null);
    if (role === 'super_admin') {
      setEmail('admin@saadfurniture.com');
      setPassword('Admin@Saad2026');
    } else if (role === 'staff_orders') {
      setEmail('tariq.orders@saadfurniture.com');
      setPassword('Staff@Saad2026');
    } else if (role === 'staff_finance') {
      setEmail('zayn.finance@saadfurniture.com');
      setPassword('Staff@Saad2026');
    } else {
      setEmail('alexander.vance@example.com');
      setPassword('Customer@2026');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saad Furniture Secure Access"
      subtitle="Sign in to your patron portal, staff operations, or executive dashboard"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Quick Demo Account Selector */}
        <div className="bg-[#1a202c]/70 border border-[#c5a880]/20 rounded-xl p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#e5caa2] mb-2">
            <Sparkles className="w-4 h-4 text-[#c5a880]" />
            <span>Fast Switcher (Click to auto-fill credentials):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('super_admin')}
              className="text-left px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-[#c5a880]/20 border border-white/5 hover:border-[#c5a880]/40 transition-all text-slate-300 hover:text-white"
            >
              <span className="font-semibold text-amber-300 block">👑 Super Admin</span>
              <span className="text-[10px] text-slate-400">Saad Al-Khatib</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('customer')}
              className="text-left px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/40 transition-all text-slate-300 hover:text-white"
            >
              <span className="font-semibold text-emerald-400 block">👤 VIP Patron</span>
              <span className="text-[10px] text-slate-400">Alexander Vance</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('staff_orders')}
              className="text-left px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/40 transition-all text-slate-300 hover:text-white"
            >
              <span className="font-semibold text-blue-400 block">📦 Order Manager</span>
              <span className="text-[10px] text-slate-400">Tariq Mansour</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('staff_finance')}
              className="text-left px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/40 transition-all text-slate-300 hover:text-white"
            >
              <span className="font-semibold text-purple-400 block">💳 Accounts Staff</span>
              <span className="text-[10px] text-slate-400">Zayn Kassam</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]"
              />
            </div>
          </div>

          <Button type="submit" variant="gold" size="lg" className="w-full mt-2" loading={loading}>
            Sign In to Account
          </Button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500">
          Super Admin securely provisions and manages all client & staff credentials.
        </div>
      </div>
    </Modal>
  );
};

