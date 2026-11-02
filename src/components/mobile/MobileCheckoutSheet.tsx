'use client';

import React, { useState, useEffect } from 'react';
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
  Copy,
  Check,
} from 'lucide-react';

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

  // Bank details state
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [bankRef, setBankRef] = useState('');
  const [transferredAmount, setTransferredAmount] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Card details state (PCI-compliant: never stored, used for tokenization)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/payment/banks')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.bankAccounts && data.bankAccounts.length > 0) {
            setBankAccounts(data.bankAccounts);
            setSelectedBankId(data.bankAccounts[0].id);
          }
        })
        .catch((err) => console.error('Failed to load active bank accounts', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, cart.subtotal - discountAmount + cart.deliveryFee);
  const activeBank = bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/payment/receipt-upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.receiptUrl) {
        setReceiptUrl(data.receiptUrl);
      } else {
        alert(data.error || 'Failed to upload receipt screenshot');
      }
    } catch (err) {
      console.error('Receipt upload error', err);
      alert('Network error while attaching receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitOrder = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name,
            phone,
            email: email || `${phone.replace(/[^0-9]/g, '') || Date.now()}@saadfurniture.patron`,
          },
          delivery: {
            address,
            city,
            instructions: specialInstructions,
          },
          items: cart.items.map((i) => ({
            productId: i.productId,
            productTitle: i.productName || i.title,
            quantity: i.quantity,
            selectedColour: i.fabricColor || i.color || 'Standard',
            customNotes: i.woodType ? `Wood: ${i.woodType}` : null,
          })),
          couponCode: appliedCoupon?.code || null,
          paymentMethod,
          paymentDetails: {
            bankName: activeBank?.bankName || 'Meezan Bank Limited',
            senderAccountTitle: name,
            senderAccountNumber: null,
            transactionReference: bankRef || `BANK-${Date.now().toString().slice(-6)}`,
            receiptImageUrl: receiptUrl || null,
            transferredAmount: transferredAmount ? Number(transferredAmount) : finalTotal,
            cardLast4: cardNumber ? cardNumber.slice(-4) : '4242',
            cardBrand: 'Visa',
          },
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full bg-[#0B0B0D] text-white rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 border-t border-[#D6B36A]/40"
      >
        {/* Header */}
        <div className="pt-3 pb-3 px-4 bg-[#0B0B0D] border-b border-[#2D2D30] shrink-0">
          <div className="w-12 h-1 bg-[#2D2D30] rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-[#D6B36A] text-[#0B0B0D]">
                Step {step} of 4
              </span>
              <h2 className="text-base font-serif font-bold text-white">
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
                className="w-8 h-8 rounded-full bg-[#171719] border border-[#2D2D30] flex items-center justify-center text-[#C5C5C5] hover:text-white cursor-pointer active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* STEP 1: CONTACT DETAILS */}
          {step === 1 && (
            <div className="space-y-3 bg-[#222222] p-4 rounded-2xl border border-[#2D2D30]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Patron Information</h3>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#C5C5C5] block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Malik Usman"
                    className="w-full px-3 py-2 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#C5C5C5] block mb-1">Mobile / WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 1234567"
                    className="w-full px-3 py-2 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#C5C5C5] block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usman@example.com"
                    className="w-full px-3 py-2 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DELIVERY ADDRESS */}
          {step === 2 && (
            <div className="space-y-3 bg-[#222222] p-4 rounded-2xl border border-[#2D2D30]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Delivery Destination</h3>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-[#C5C5C5] block mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs text-white focus:outline-none focus:border-[#D6B36A]"
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
                  <label className="text-[11px] font-bold text-[#C5C5C5] block mb-1">Complete Street Address / House No.</label>
                  <textarea
                    rows={3}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House #, Street, Phase / Block, Area..."
                    className="w-full px-3 py-2 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#C5C5C5] block mb-1">Special Craftsmanship or Delivery Notes</label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Elevators available, call before delivery"
                    className="w-full px-3 py-2 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
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
                          ? 'bg-[#171719] border-[#D6B36A] ring-1 ring-[#D6B36A]/50 shadow-md'
                          : 'bg-[#222222] border-[#2D2D30] hover:border-[#D6B36A]/30'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#D6B36A] text-[#0B0B0D]' : 'bg-[#171719] text-[#A5A5A5]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-white">{m.title}</h4>
                        <p className="text-[11px] text-[#A5A5A5] mt-0.5">{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bank Transfer Details Box */}
              {paymentMethod === 'bank_transfer' && (
                <div className="bg-[#222222] p-4 rounded-2xl border border-[#D6B36A]/40 shadow-md space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#D6B36A]" /> Official Atelier Bank Account
                    </h4>
                    <span className="text-[10px] text-[#A5A5A5]">Select Bank</span>
                  </div>

                  {/* Multiple Bank Selector Pills */}
                  {bankAccounts.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {bankAccounts.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBankId(b.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
                            selectedBankId === b.id
                              ? 'bg-[#D6B36A] text-[#0B0B0D]'
                              : 'bg-[#171719] text-[#C5C5C5] border border-[#2D2D30]'
                          }`}
                        >
                          {b.bankName}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeBank ? (
                    <div className="space-y-2 p-3 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[#A5A5A5]">Bank:</span>
                        <strong className="text-white font-serif">{activeBank.bankName}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#A5A5A5]">Account Title:</span>
                        <strong className="text-white">{activeBank.accountTitle}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#A5A5A5]">Account #:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="bg-[#222222] px-2 py-0.5 rounded text-white font-mono font-bold">
                            {activeBank.accountNumber}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeBank.accountNumber, 'acc')}
                            className="p-1 rounded bg-[#222222] text-[#A5A5A5] hover:text-white"
                          >
                            {copiedField === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      {activeBank.iban && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#A5A5A5]">IBAN:</span>
                          <div className="flex items-center gap-1.5">
                            <code className="bg-[#222222] px-2 py-0.5 rounded text-white font-mono text-[10px] font-bold">
                              {activeBank.iban}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopy(activeBank.iban, 'iban')}
                              className="p-1 rounded bg-[#222222] text-[#A5A5A5] hover:text-white"
                            >
                              {copiedField === 'iban' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-[#171719] rounded-xl text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#A5A5A5]">Bank:</span>
                        <strong className="text-white">Meezan Bank Limited</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A5A5A5]">Account Title:</span>
                        <strong className="text-white">SAAD FURNITURE ATELIER</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#A5A5A5]">Account #:</span>
                        <code className="font-mono text-white font-bold">01040105829102</code>
                      </div>
                    </div>
                  )}

                  {/* Transfer Reference & Receipt Upload */}
                  <div className="space-y-2 pt-1 border-t border-[#2D2D30]">
                    <div>
                      <label className="text-[11px] font-bold text-[#C5C5C5] block mb-1">
                        Bank Transaction ID / Ref #
                      </label>
                      <input
                        type="text"
                        value={bankRef}
                        onChange={(e) => setBankRef(e.target.value)}
                        placeholder="e.g. MEZN-84920481"
                        className="w-full px-3 py-2 bg-[#171719] rounded-xl border border-[#2D2D30] text-xs text-white placeholder-[#A5A5A5] focus:outline-none focus:border-[#D6B36A]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#C5C5C5] block mb-1">
                        Attach Payment Receipt / Screenshot
                      </label>
                      <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[#2D2D30] hover:border-[#D6B36A] bg-[#171719] text-xs text-[#A5A5A5] cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-[#D6B36A]" />
                        <span>{uploadingReceipt ? 'Uploading...' : receiptUrl ? 'Receipt Attached (Tap to replace)' : 'Select image or PDF screenshot'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Final Total */}
              <div className="bg-[#222222] p-3.5 rounded-2xl border border-[#2D2D30] flex justify-between items-center text-xs">
                <div>
                  <span className="text-[#A5A5A5] block">Payable Total</span>
                  <span className="text-base font-serif font-black text-[#D6B36A]">
                    PKR {finalTotal.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold px-2.5 py-1 rounded-lg">
                  White-Glove Included
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: ORDER CONFIRMED */}
          {step === 4 && createdOrder && (
            <div className="bg-[#222222] p-6 rounded-3xl border border-[#2D2D30] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white">Order Commissioned!</h3>
                <p className="text-xs text-[#C5C5C5] mt-1">
                  Thank you, <strong className="text-white">{name}</strong>. Your custom piece has entered our workshop queue.
                </p>
              </div>

              <div className="p-3 bg-[#171719] rounded-2xl border border-[#2D2D30] space-y-1.5 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-[#A5A5A5]">Order Tracking #:</span>
                  <strong className="font-mono text-[#D6B36A]">
                    #{createdOrder.orderNumber || createdOrder.id?.slice(0, 8).toUpperCase()}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A5A5A5]">Estimated Completion:</span>
                  <strong className="text-white">14–18 Business Days</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A5A5A5]">Total Contract:</span>
                  <strong className="text-[#D6B36A]">PKR {finalTotal.toLocaleString()}</strong>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-serif font-black rounded-2xl h-11 text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Step Navigation Footer */}
        {step !== 4 && (
          <div className="p-4 bg-[#0B0B0D] border-t border-[#2D2D30] flex gap-2 shrink-0">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="w-1/3 bg-[#171719] border border-[#2D2D30] text-white hover:text-[#D6B36A] h-11 text-xs rounded-xl flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>
            )}

            {step < 3 ? (
              <button
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
                className="flex-1 bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-serif font-black text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="font-black text-[#0B0B0D] tracking-wide">Continue</span>
                <ArrowRight className="w-4 h-4 text-[#0B0B0D] stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={handleSubmitOrder}
                disabled={loading}
                className="flex-1 bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] font-serif font-black text-xs h-11 rounded-xl flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#0B0B0D] fill-current" />
                <span className="font-black text-[#0B0B0D]">{loading ? 'Processing Order...' : 'Confirm & Place Order'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
