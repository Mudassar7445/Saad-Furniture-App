'use client';

import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: {
    items: any[];
    subtotal: number;
    deliveryFee: number;
    grandTotal: number;
    totalCount: number;
  };
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onApplyCoupon: (code: string) => Promise<boolean>;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onProceedToCheckout: () => void;
}

export const MobileCartSheet: React.FC<MobileCartSheetProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  appliedCoupon,
  onProceedToCheckout,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponError(null);
    const ok = await onApplyCoupon(couponInput.trim().toUpperCase());
    setApplying(false);
    if (!ok) {
      setCouponError('Invalid or expired promotional code');
    } else {
      setCouponInput('');
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, cart.subtotal - discountAmount + cart.deliveryFee);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full bg-[#0B0B0D] text-white rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-[#D6B36A]/40"
      >
        {/* Drag handle & Header */}
        <div className="pt-3 pb-3 px-4 bg-[#0B0B0D] border-b border-[#2D2D30] shrink-0">
          <div className="w-12 h-1 bg-[#2D2D30] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#D6B36A] rounded-full inline-block" />
              <ShoppingBag className="w-4 h-4 text-[#D6B36A]" />
              <h2 className="text-base font-serif font-bold text-white">Shopping Bag</h2>
              <span className="text-xs bg-[#D6B36A] text-[#0B0B0D] px-2 py-0.5 rounded-full font-black">
                {cart.totalCount}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#171719] border border-[#2D2D30] flex items-center justify-center text-[#C5C5C5] hover:text-white cursor-pointer active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart Body */}
        {cart.items.length === 0 ? (
          <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#171719] border border-[#2D2D30] flex items-center justify-center text-[#D6B36A] mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <p className="text-sm font-serif font-bold text-white">Your bag is currently empty</p>
            <p className="text-xs text-[#A5A5A5] mt-1 max-w-xs">
              Explore our master-crafted luxury collections and add your desired pieces.
            </p>
            <button
              onClick={onClose}
              className="mt-5 bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] text-xs font-black rounded-xl h-10 px-6 font-serif shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Browse Showroom Pieces
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.items.map((item) => {
                const itemImg =
                  item.productImageUrl ||
                  item.primaryImage ||
                  item.image ||
                  (item.images && item.images[0]) ||
                  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80';
                const itemTitle = item.productName || item.productTitle || item.title || 'Handcrafted Luxury Piece';
                const itemPrice = item.unitPrice ?? item.effectivePrice ?? item.price ?? 0;
                const itemWood = item.woodType || item.selectedDesign || '';
                const itemColour = item.fabricColor || item.selectedColour || '';

                return (
                  <div
                    key={item.id}
                    className="bg-[#222222] p-3 rounded-2xl border border-[#2D2D30] flex gap-3 shadow-md"
                  >
                    <div className="w-20 h-20 rounded-xl bg-[#171719] overflow-hidden border border-[#2D2D30] shrink-0">
                      <img
                        src={itemImg}
                        alt={itemTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-serif font-bold text-white line-clamp-1">
                            {itemTitle}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-[#A5A5A5] hover:text-rose-400 p-1 cursor-pointer transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {(itemWood || itemColour) && (
                          <p className="text-[10px] text-[#A5A5A5] truncate mt-0.5">
                            {itemWood} {itemColour ? `• ${itemColour}` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-serif font-black text-[#D6B36A]">
                          PKR {itemPrice.toLocaleString()}
                        </span>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-[#171719] p-1 rounded-xl border border-[#2D2D30]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onUpdateQuantity(item.id, Math.max(1, item.quantity - 1));
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-transform cursor-pointer touch-manipulation"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="text-xs font-bold text-white min-w-[24px] text-center select-none font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onUpdateQuantity(item.id, item.quantity + 1);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-transform cursor-pointer touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo Coupon Code */}
            <div className="bg-[#222222] p-3.5 rounded-2xl border border-[#2D2D30] space-y-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#D6B36A]" /> Have a Patron Promo Code?
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SAAD10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs font-mono uppercase text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                />
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying || !couponInput.trim()}
                  className="bg-[#D6B36A] hover:bg-[#c4a159] disabled:opacity-40 text-[#0B0B0D] font-black text-xs rounded-xl h-8 px-4 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
                >
                  <span>{applying ? 'Applying...' : 'Apply'}</span>
                </button>
              </div>
              {couponError && <p className="text-[10px] text-rose-400">{couponError}</p>}
              {appliedCoupon && (
                <div className="p-2 bg-emerald-950/50 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                  <span className="font-mono font-bold">Code {appliedCoupon.code} applied!</span>
                  <span>-PKR {appliedCoupon.discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-[#222222] p-4 rounded-2xl border border-[#2D2D30] space-y-2 text-xs">
              <div className="flex justify-between text-[#C5C5C5]">
                <span>Bag Subtotal</span>
                <span className="text-white font-semibold">PKR {cart.subtotal.toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promotional Privilege</span>
                  <span>-PKR {appliedCoupon.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[#C5C5C5]">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#D6B36A]" /> White-Glove Delivery
                </span>
                <span className="text-emerald-400 font-semibold">
                  {cart.deliveryFee === 0 ? 'Complimentary' : `PKR ${cart.deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="pt-2 border-t border-[#2D2D30] flex justify-between text-sm font-bold text-white">
                <span>Total Amount</span>
                <span className="font-serif font-black text-[#D6B36A] text-base">PKR {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Checkout Button */}
        {cart.items.length > 0 && (
          <div className="p-4 bg-[#0B0B0D] border-t border-[#2D2D30] shrink-0">
            <button
              onClick={onProceedToCheckout}
              className="w-full bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-serif font-black text-sm h-12 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="font-black text-[#0B0B0D] tracking-wide">Proceed to Luxury Checkout</span>
              <ArrowRight className="w-4 h-4 text-[#0B0B0D] stroke-[2.5]" />
            </button>
            <p className="text-[10px] text-[#A5A5A5] text-center mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#D6B36A]" /> 100% Guaranteed Saad Furniture Atelier Authenticity
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
