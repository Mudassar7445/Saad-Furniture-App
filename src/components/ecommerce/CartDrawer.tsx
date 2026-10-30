'use client';

import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck, Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onRemoveItem: (itemId: string) => void;
  appliedCoupon: { code: string; discountAmount: number } | null;
  onApplyCoupon: (code: string) => Promise<string | null>;
  onRemoveCoupon: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  items,
  subtotal,
  deliveryFee,
  grandTotal,
  onUpdateQuantity,
  onRemoveItem,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    const err = await onApplyCoupon(couponInput.trim());
    if (err) {
      setCouponError(err);
    } else {
      setCouponInput('');
    }
    setCouponLoading(false);
  };

  const freeDeliveryThreshold = 3000;
  const awayFromFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const finalPayable = Math.max(0, grandTotal - (appliedCoupon?.discountAmount || 0));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#111622] border-l border-white/10 flex flex-col shadow-2xl text-slate-100">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#c5a880]/15 border border-[#c5a880]/30 flex items-center justify-center text-[#e5caa2]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold tracking-wide text-white">Your Shopping Cart</h2>
                <p className="text-xs text-slate-400">
                  {items.length} unique {items.length === 1 ? 'masterpiece' : 'masterpieces'} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          {subtotal > 0 && (
            <div className="bg-[#182030] px-5 py-2.5 border-b border-white/5 text-xs">
              {awayFromFreeDelivery > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Add <strong className="text-[#e5caa2]">${awayFromFreeDelivery}</strong> more for Complimentary Delivery</span>
                    <span>${subtotal} / $3000</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-[#c5a880] rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (subtotal / 3000) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>You have unlocked Complimentary White-Glove Delivery ($150 Value)!</span>
                </div>
              )}
            </div>
          )}

          {/* Item List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="font-serif text-lg text-slate-200">Your Cart is Empty</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Discover our bespoke collection of handcrafted sofas, bedroom suites, and luxury living room centerpieces.
                </p>
                <Button variant="gold" size="sm" onClick={onClose} className="mt-2">
                  Browse Product Catalogue
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3.5 rounded-xl bg-slate-900/70 border border-white/5 hover:border-[#c5a880]/30 transition-all"
                >
                  <img
                    src={item.primaryImage}
                    alt={item.productTitle}
                    className="w-20 h-20 rounded-lg object-cover bg-slate-950 shrink-0 border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white truncate">{item.productTitle}</h4>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {item.category} • SKU: {item.sku}
                    </div>

                    {(item.selectedColour || item.selectedDesign) && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {item.selectedColour && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#e5caa2] border border-white/5">
                            {item.selectedColour}
                          </span>
                        )}
                        {item.selectedDesign && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5">
                            {item.selectedDesign}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-white">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-[#e5caa2]">
                          ${item.totalItemPrice?.toLocaleString()}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-slate-500">
                            ${item.effectivePrice?.toLocaleString()} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {items.length > 0 && (
            <div className="p-5 border-t border-white/10 bg-slate-900/90 space-y-3.5">
              {/* Coupon Code Box */}
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Promo code (e.g. SAAD10)"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <Button type="submit" variant="secondary" size="sm" loading={couponLoading}>
                      Apply
                    </Button>
                  </div>
                  {couponError && <p className="text-[11px] text-red-400 pl-1">{couponError}</p>}
                </form>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#c5a880]/10 border border-[#c5a880]/30 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-white">Promo: {appliedCoupon.code}</span>
                      <span className="text-slate-400 ml-1.5">(-${appliedCoupon.discountAmount})</span>
                    </div>
                  </div>
                  <button
                    onClick={onRemoveCoupon}
                    className="text-xs text-red-400 hover:text-red-300 underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">${subtotal.toLocaleString()}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-${appliedCoupon.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>White-Glove Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-semibold">FREE</span>
                    ) : (
                      `$${deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                  <span>Total Investment</span>
                  <span className="text-base text-[#e5caa2] font-serif font-bold">
                    ${finalPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                variant="gold"
                size="lg"
                className="w-full flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-[#c5a880]/10"
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c5a880]" />
                <span>100% Encrypted & Authenticated Saad Luxury Atelier Guarantee</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
