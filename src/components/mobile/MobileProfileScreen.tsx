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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customer/profile');
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.profile || {});
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="space-y-6 pb-20">
        <div className="p-6 bg-white rounded-3xl border border-[#EAE2D6] text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#262421] text-[#B99A68] flex items-center justify-center mx-auto mb-3 font-serif font-bold text-2xl shadow-inner">
            SF
          </div>
          <h2 className="text-lg font-serif font-bold text-[#262421]">Welcome to Saad Furniture</h2>
          <p className="text-xs text-[#89847C] mt-1 max-w-xs mx-auto leading-relaxed">
            Create an account or sign in to track your bespoke furniture orders, manage delivery addresses, and view your exclusive patron ledger.
          </p>

          <div className="mt-5 space-y-2">
            <Button
              onClick={onOpenAuth}
              className="w-full bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-serif font-bold rounded-xl h-11 text-xs"
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
              <span>Direct HD photo & video updates from the master carvers</span>
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

  return (
    <div className="space-y-4 pb-24">
      {/* Patron Hero Card */}
      <div className="bg-gradient-to-br from-[#262421] to-[#1c1a18] p-5 rounded-3xl text-white shadow-lg border border-[#B99A68]/30 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-[#B99A68]/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-[#B99A68]/20 border border-[#B99A68]/40 flex items-center justify-center font-serif font-bold text-xl text-[#B99A68] shrink-0">
            {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SF'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-white truncate">{currentUser.name}</h2>
              {isSuperAdmin ? (
                <Badge className="bg-[#B99A68] text-[#262421] text-[9px] font-bold uppercase">
                  Super Admin
                </Badge>
              ) : isStaff ? (
                <Badge className="bg-amber-600 text-white text-[9px] font-bold uppercase">
                  Staff
                </Badge>
              ) : (
                <Badge className="bg-[#B99A68]/20 text-[#B99A68] border border-[#B99A68]/40 text-[9px] font-bold uppercase">
                  VIP Patron
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-[#89847C] truncate mt-0.5">{currentUser.email}</p>
            <p className="text-[10px] text-[#B99A68] mt-1 font-mono">
              Patron ID: #{currentUser.id ? currentUser.id.slice(0, 8).toUpperCase() : 'VIP'}
            </p>
          </div>
        </div>

        {/* Patron Financials Summary */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center relative z-10">
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[9px] text-[#89847C] block uppercase font-bold">Total Orders</span>
            <span className="text-xs font-bold text-white font-serif">{profileData?.totalOrders || 0}</span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[9px] text-[#89847C] block uppercase font-bold">Total Spent</span>
            <span className="text-xs font-bold text-[#B99A68] font-serif">
              ₨{((profileData?.totalSpent || 0) / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="bg-white/5 p-2 rounded-xl">
            <span className="text-[9px] text-[#89847C] block uppercase font-bold">Balance Due</span>
            <span className="text-xs font-bold text-amber-400 font-serif">
              ₨{((profileData?.remainingBalance || 0) / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </div>

      {/* Super Admin Quick Launch (if Super Admin or Staff) */}
      {(isSuperAdmin || isStaff) && (
        <div
          onClick={() => router.push('/admin')}
          className="bg-white p-4 rounded-2xl border-2 border-[#B99A68] shadow-sm flex items-center justify-between cursor-pointer hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#262421] text-[#B99A68] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#262421] font-serif">Super Admin Dashboard</h3>
              <p className="text-[11px] text-[#89847C]">Open executive manufacturing & operations console</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#B99A68]" />
        </div>
      )}

      {/* Menu Options */}
      <div className="bg-white rounded-2xl border border-[#EAE2D6] divide-y divide-[#F7F5F0] shadow-sm overflow-hidden">
        <button
          onClick={onNavigateToOrders}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Package className="w-4 h-4 text-[#B99A68]" />
            <span className="text-xs font-bold text-[#262421]">My Orders & Live Tracking</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>

        <button
          onClick={onNavigateToWishlist}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-[#B99A68]" />
            <span className="text-xs font-bold text-[#262421]">Saved Wishlist</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>

        {onNavigateToDocuments && (
          <button
            onClick={onNavigateToDocuments}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#B99A68]" />
              <div>
                <span className="text-xs font-bold text-[#262421] block">Showroom Catalogues & Documents</span>
                <span className="text-[10px] text-[#89847C] block">Browse official 2026 furniture collections & warranty cards</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#89847C]" />
          </button>
        )}

        <button
          onClick={() => alert('Delivery address management: ' + (currentUser.address || 'Default Lahore Address'))}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#B99A68]" />
            <div>
              <span className="text-xs font-bold text-[#262421] block">Delivery Address</span>
              <span className="text-[10px] text-[#89847C] block truncate max-w-[200px]">
                {currentUser.address || 'Add delivery location'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>

        <button
          onClick={() => router.push('/about')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-[#B99A68]" />
            <span className="text-xs font-bold text-[#262421]">About Saad Furniture Atelier</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>

        <button
          onClick={() => window.open('https://wa.me/923000000000?text=Saad%20Furniture%20Concierge%20Inquiry', '_blank')}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[#F7F5F0] transition-colors"
        >
          <div className="flex items-center gap-3">
            <PhoneCall className="w-4 h-4 text-[#B99A68]" />
            <span className="text-xs font-bold text-[#262421]">VIP Concierge & Custom Designs</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#89847C]" />
        </button>
      </div>

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className="w-full p-3 bg-white rounded-2xl border border-red-200 text-red-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        Sign Out of Account
      </button>

      {/* App Version Stamp */}
      <p className="text-center text-[10px] text-[#89847C] font-mono">
        Saad Furniture Native App v2.4 • Turso Cloud Synced
      </p>
    </div>
  );
};

