'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Truck,
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  Upload,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  User,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MobileCheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: {
    items: any[];
    subtotal: number;
    deliveryFee: number;
    grandTotal: number;
  };
  appliedCoupon: { code: string; discountAmount: number } | null;
  currentUser: any | null;
  onOrderSuccess: (order: any) => void;
}

export const MobileCheckoutSheet: React.FC<MobileCheckoutSheetProps> = ({
  isOpen,
  onClose,
  cart,
  appliedCoupon,
  currentUser,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || 'Lahore');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer' | 'jazzcash' | 'card'>('bank_transfer');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  if (!isOpen) return null;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, cart.subtotal - discountAmount + cart.deliveryFee);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    // Simulating instant receipt attachment
    setTimeout(() => {
      setReceiptUrl(URL.createObjectURL(file));
      setUploadingReceipt(false);
    }, 1000);
  };

  const handleSubmitOrder = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          deliveryAddress: address,
          city,
          specialInstructions,
          paymentMethod,
          bankReceiptUrl: receiptUrl || null,
          items: cart.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            price: i.unitPrice || i.price,
            quantity: i.quantity,
            woodType: i.woodType,
            fabricColor: i.fabricColor,
          })),
          subtotal: cart.subtotal,
          discountAmount,
          couponCode: appliedCoupon?.code || null,
          deliveryFee: cart.deliveryFee,
          grandTotal: finalTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setCreatedOrder(data.order);
      setStep(4); // Order Confirmed
      onOrderSuccess(data.order);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full bg-[#F7F5F0] rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-[#B99A68]/30"
        style={{ color: '#292722' }}
      >
        {/* Header */}
        <div className="pt-3 pb-3 px-4 bg-white border-b border-[#EAE2D6] shrink-0">
          <div className="w-12 h-1 bg-[#EAE2D6] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#262421] text-[#B99A68]">
                Step {step} of 4
              </span>
              <h2 className="text-base font-serif font-bold text-[#262421]">
                {step === 1
                  ? 'Contact Details'
                  : step === 2
                  ? 'Delivery Address'
                  : step === 3
                  ? 'Payment Selection'
                  : 'Order Confirmed!'}
              </h2>
            </div>
            {step !== 4 && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F7F5F0] flex items-center justify-center text-[#89847C] hover:text-[#262421]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
              {error}
            </div>
          )}

          {/* STEP 1: CONTACT DETAILS */}
          {step === 1 && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EAE2D6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">Patron Information</h3>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#89847C] block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Malik Usman"
                    className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#89847C] block mb-1">Mobile / WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#89847C] block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usman@example.com"
                    className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY ADDRESS */}
          {step === 2 && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#EAE2D6]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#262421]">Delivery Destination</h3>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#89847C] block mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] focus:outline-none focus:border-[#B99A68]"
                  >
                    <option value="Lahore">Lahore (Complimentary Express)</option>
                    <option value="Islamabad">Islamabad / Rawalpindi</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Faisalabad">Faisalabad</option>
                    <option value="Multan">Multan</option>
                    <option value="Sialkot">Sialkot / Gujranwala</option>
                    <option value="Peshawar">Peshawar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#89847C] block mb-1">Complete Street Address / House No.</label>
                  <textarea
                    rows={3}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House #, Street, Phase / Block, Area..."
                    className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#89847C] block mb-1">Special Craftsmanship or Delivery Notes</label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Elevators available, call before delivery"
                    className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  {
                    id: 'bank_transfer',
                    title: 'Direct Bank Transfer / Raast (Recommended)',
                    desc: 'Meezan Bank Luxury Account with instant verification',
                    icon: Building2,
                  },
                  {
                    id: 'jazzcash',
                    title: 'JazzCash / Easypaisa Mobile Account',
                    desc: 'Fast digital mobile wallet transfer',
                    icon: Smartphone,
                  },
                  {
                    id: 'card',
                    title: 'Visa / Mastercard / UnionPay',
                    desc: 'Secured via 256-bit bank encrypted gateway',
                    icon: CreditCard,
                  },
                  {
                    id: 'cod',
                    title: 'Cash on Delivery (Standard)',
                    desc: '20% advance confirmation, balance upon white-glove setup',
                    icon: Banknote,
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-white border-[#B99A68] ring-2 ring-[#B99A68]/20 shadow-sm'
                          : 'bg-white border-[#EAE2D6]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#262421] text-[#B99A68]' : 'bg-[#F7F5F0] text-[#89847C]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-[#262421]">{m.title}</h4>
                        <p className="text-[11px] text-[#89847C] mt-0.5">{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bank Transfer Details Box */}
              {paymentMethod === 'bank_transfer' && (
                <div className="bg-white p-4 rounded-2xl border border-[#B99A68]/50 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#262421] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#B99A68]" /> Official Atelier Bank Account
                  </h4>
                  <div className="space-y-1.5 text-xs bg-[#F7F5F0] p-3 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-[#89847C]">Bank:</span>
                      <strong className="text-[#262421]">Meezan Bank Limited</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#89847C]">Account Title:</span>
                      <strong className="text-[#262421]">Saad Furniture Industry</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#89847C]">Account No:</span>
                      <strong className="font-mono text-[#262421]">02840105829102</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#89847C]">Raast ID:</span>
                      <strong className="font-mono text-[#B99A68]">03009482811</strong>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#89847C] block mb-1">
                      Upload Transfer Screenshot / Receipt (Optional)
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#EAE2D6] rounded-xl p-3 cursor-pointer hover:border-[#B99A68] bg-[#F7F5F0]/50">
                      <Upload className="w-5 h-5 text-[#89847C] mb-1" />
                      <span className="text-[11px] font-bold text-[#262421]">
                        {uploadingReceipt ? 'Attaching Receipt...' : receiptUrl ? 'Receipt Attached ✓' : 'Tap to select receipt photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Order Final Total */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#EAE2D6] flex justify-between items-center text-xs">
                <div>
                  <span className="text-[#89847C] block">Payable Total</span>
                  <span className="text-base font-serif font-bold text-[#262421]">
                    ₨{finalTotal.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded">
                  White-Glove Included
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: ORDER CONFIRMED */}
          {step === 4 && createdOrder && (
            <div className="bg-white p-6 rounded-3xl border border-[#EAE2D6] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-[#262421]">Order Commissioned!</h3>
                <p className="text-xs text-[#89847C] mt-1">
                  Thank you, <strong className="text-[#262421]">{name}</strong>. Your custom piece has entered our workshop queue.
                </p>
              </div>

              <div className="p-3 bg-[#F7F5F0] rounded-2xl border border-[#EAE2D6] space-y-1.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-[#89847C]">Order Tracking #:</span>
                  <strong className="font-mono text-[#B99A68]">
                    #{createdOrder.orderNumber || createdOrder.id?.slice(0, 8).toUpperCase()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#89847C]">Estimated Completion:</span>
                  <strong className="text-[#262421]">14–18 Business Days</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#89847C]">Total Contract:</span>
                  <strong className="text-[#262421]">₨{finalTotal.toLocaleString()}</strong>
                </div>
              </div>

              <Button
                onClick={onClose}
                className="w-full bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-serif font-bold rounded-2xl h-11 text-xs"
              >
                Done
              </Button>
            </div>
          )}
        </div>

        {/* Step Navigation Footer */}
        {step !== 4 && (
          <div className="p-4 bg-white border-t border-[#EAE2D6] flex gap-2 shrink-0">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="w-1/3 border-[#EAE2D6] text-[#262421] h-11 text-xs rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                onClick={() => {
                  if (step === 1 && (!name.trim() || !phone.trim() || !email.trim())) {
                    setError('Please complete all contact fields');
                    return;
                  }
                  if (step === 2 && !address.trim()) {
                    setError('Please enter your delivery street address');
                    return;
                  }
                  setError(null);
                  setStep((s) => (s + 1) as any);
                }}
                className="flex-1 bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-serif font-bold text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="flex-1 bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white font-serif font-bold text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Processing Order...' : 'Confirm & Place Order'}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
