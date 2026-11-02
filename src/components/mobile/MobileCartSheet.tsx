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
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full bg-[#F7F5F0] rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-[#B99A68]/30"
        style={{ color: '#292722' }}
      >
        {/* Drag handle & Header */}
        <div className="pt-3 pb-3 px-4 bg-white border-b border-[#EAE2D6] shrink-0">
          <div className="w-12 h-1 bg-[#EAE2D6] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#B99A68]" />
              <h2 className="text-base font-serif font-bold text-[#262421]">Shopping Bag</h2>
              <span className="text-xs bg-[#1C1A18] text-white px-2 py-0.5 rounded-full font-bold">
                {cart.totalCount}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F7F5F0] flex items-center justify-center text-[#89847C] hover:text-[#262421] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart Body */}
        {cart.items.length === 0 ? (
          <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EAE2D6]/50 flex items-center justify-center text-[#89847C] mb-3">
              <ShoppingBag className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-sm font-serif font-bold text-[#262421]">Your bag is currently empty</p>
            <p className="text-xs text-[#89847C] mt-1 max-w-xs">
              Explore our master-crafted luxury collections and add your desired pieces.
            </p>
            <Button
              variant="dark"
              onClick={onClose}
              className="mt-5 bg-[#1C1A18] hover:bg-black text-white text-xs font-bold rounded-xl h-10 px-6 font-serif shadow-md"
            >
              Browse Masterpieces
            </Button>
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
                    className="bg-white p-3 rounded-2xl border border-[#EAE2D6] flex gap-3 shadow-sm"
                  >
                    <div className="w-20 h-20 rounded-xl bg-[#F7F5F0] overflow-hidden border border-[#EAE2D6] shrink-0">
                      <img
                        src={itemImg}
                        alt={itemTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-serif font-bold text-[#262421] line-clamp-1">
                            {itemTitle}
                          </h4>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-[#89847C] hover:text-red-600 p-1 cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {(itemWood || itemColour) && (
                          <p className="text-[10px] text-[#89847C] truncate mt-0.5">
                            {itemWood} {itemColour ? `• ${itemColour}` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-[#262421]">
                          ₨{itemPrice.toLocaleString()}
                        </span>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-[#F7F5F0] p-1 rounded-xl border border-[#EAE2D6]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(item.id, Math.max(1, item.quantity - 1));
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1C1A18] hover:bg-[#EAE2D6] active:scale-90 transition-transform cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <span className="text-xs font-bold text-[#1C1A18] min-w-[24px] text-center select-none font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQuantity(item.id, item.quantity + 1);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1C1A18] hover:bg-[#EAE2D6] active:scale-90 transition-transform cursor-pointer"
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
            <div className="bg-white p-3.5 rounded-2xl border border-[#EAE2D6] space-y-2">
              <span className="text-xs font-bold text-[#262421] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#B99A68]" /> Have a Patron Promo Code?
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SAAD10"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs font-mono uppercase focus:outline-none focus:border-[#B99A68]"
                />
                <Button
                  variant="dark"
                  type="button"
                  onClick={handleApply}
                  disabled={applying || !couponInput.trim()}
                  className="bg-[#1C1A18] text-white hover:bg-black disabled:bg-stone-200 disabled:text-stone-400 text-xs font-bold rounded-xl h-8 px-4"
                >
                  <span className={couponInput.trim() ? "text-white font-bold" : "text-stone-500 font-bold"}>
                    {applying ? 'Applying...' : 'Apply'}
                  </span>
                </Button>
              </div>
              {couponError && <p className="text-[10px] text-red-600">{couponError}</p>}
              {appliedCoupon && (
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-mono font-bold">Code {appliedCoupon.code} applied!</span>
                  <span>-₨{appliedCoupon.discountAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-white p-4 rounded-2xl border border-[#EAE2D6] space-y-2 text-xs">
              <div className="flex justify-between text-[#89847C]">
                <span>Bag Subtotal</span>
                <span className="text-[#262421] font-semibold">₨{cart.subtotal.toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-700">
                  <span>Promotional Privilege</span>
                  <span>-₨{appliedCoupon.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[#89847C]">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#B99A68]" /> White-Glove Delivery
                </span>
                <span className="text-emerald-700 font-semibold">
                  {cart.deliveryFee === 0 ? 'Complimentary' : `₨${cart.deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="pt-2 border-t border-[#F7F5F0] flex justify-between text-sm font-bold text-[#262421]">
                <span>Total Amount</span>
                <span className="font-serif font-bold text-[#9E8050] text-base">₨{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Checkout Button */}
        {cart.items.length > 0 && (
          <div className="p-4 bg-white border-t border-[#EAE2D6] shrink-0">
            <Button
              variant="dark"
              onClick={onProceedToCheckout}
              className="w-full bg-[#1C1A18] hover:bg-black text-white font-serif font-bold text-sm h-12 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-all"
            >
              <span className="text-white font-bold tracking-wide">Proceed to Luxury Checkout</span>
              <ArrowRight className="w-4 h-4 text-[#E5CAA2]" />
            </Button>
            <p className="text-[10px] text-[#89847C] text-center mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#B99A68]" /> 100% Guaranteed Saad Furniture Atelier Authenticity
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
