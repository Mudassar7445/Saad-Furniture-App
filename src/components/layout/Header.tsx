'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShoppingBag,
  Heart,
  ChevronDown,
  LogOut,
  Package,
  Shield,
  Layers,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useShopSettings } from '@/lib/settings/useShopSettings';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  currentUser?: any;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart,
  onOpenAuth,
  currentUser: initialUser,
}) => {
  const router = useRouter();
  const { settings } = useShopSettings();
  const [user, setUser] = useState<any>(initialUser || null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync / fetch current user if not passed
  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
      return;
    }
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, [initialUser]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setProfileDropdownOpen(false);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="border-b border-white/5 bg-[#10131a]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#B99A68]/40 shadow-lg group-hover:scale-105 transition-transform shrink-0 bg-[#1c1a18]">
            <img
              src={settings.appIconUrl || '/assets/branding/app-dp.svg'}
              alt={settings.shopName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-serif tracking-[0.2em] text-base sm:text-lg font-bold text-white block uppercase">
              {settings.shopName.split(' ')[0]}{' '}
              <span className="text-[#B99A68]">
                {settings.shopName.split(' ').slice(1).join(' ') || 'FURNITURE'}
              </span>
            </span>
            <span className="text-[10px] tracking-widest uppercase text-slate-400 font-medium hidden sm:block">
              {settings.tagline || 'Luxury Atelier & Interior Architecture'}
            </span>
          </div>
        </Link>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/workshop"
            className="text-xs font-semibold text-[#B99A68] hover:text-[#d4b584] transition-colors hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#B99A68]/10 border border-[#B99A68]/30 hover:bg-[#B99A68]/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B99A68]" />
            <span>Workshop</span>
          </Link>
          <Link
            href="/about"
            className="text-xs font-semibold text-slate-300 hover:text-[#B99A68] transition-colors hidden md:block px-2.5 py-1.5 rounded-lg hover:bg-white/5"
          >
            About Atelier
          </Link>
          {/* Wishlist Button */}
          <Link
            href="/portal?tab=wishlist"
            className="relative p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            title="My Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-[#c5a880]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#c5a880] text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-lg shadow-[#c5a880]/30 animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* Track Order Direct Link */}
          <button
            onClick={() => {
              const el = document.getElementById('tracking-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                router.push('/portal?tab=orders');
              }
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-[#c5a880]" />
            <span>Track Order</span>
          </button>

          {/* Profile Menu Button */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <div>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-[#c5a880]/40 transition-all text-xs text-white"
                >
                  <div className="w-6 h-6 rounded-full bg-[#c5a880]/20 border border-[#c5a880]/40 flex items-center justify-center text-[#e5caa2] font-bold text-[11px]">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate font-medium hidden sm:inline">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#141824] border border-white/10 shadow-2xl py-2 text-xs text-slate-200 z-50">
                    <div className="px-4 py-2.5 border-b border-white/5">
                      <div className="font-semibold text-white truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#c5a880]/15 text-[#e5caa2] text-[10px] font-bold uppercase tracking-wider">
                        {user.role?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/portal"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 hover:text-[#c5a880] transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Patron Portal Overview</span>
                      </Link>

                      <Link
                        href="/portal?tab=online_orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 hover:text-[#c5a880] transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>My Online Orders</span>
                      </Link>

                      <Link
                        href="/portal?tab=orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 hover:text-[#c5a880] transition-colors"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Showroom Commissions</span>
                      </Link>

                      <Link
                        href="/portal?tab=wishlist"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 hover:text-[#c5a880] transition-colors"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>My Wishlist ({wishlistCount})</span>
                      </Link>

                      <Link
                        href="/portal?tab=addresses"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/5 hover:text-[#c5a880] transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>Saved Delivery Addresses</span>
                      </Link>

                      {/* Super Admin or Staff Link */}
                      {user.role === 'super_admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-amber-300 hover:bg-amber-500/10 transition-colors font-semibold border-t border-white/5 mt-1"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Super Admin Dashboard</span>
                        </Link>
                      )}

                      {user.role === 'staff' && (
                        <Link
                          href="/staff"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-blue-300 hover:bg-blue-500/10 transition-colors font-semibold border-t border-white/5 mt-1"
                        >
                          <Layers className="w-4 h-4" />
                          <span>Staff Operations Hub</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-white/5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="gold"
                size="sm"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-xs font-bold shadow-md shadow-[#c5a880]/15"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

