'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building2,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Upload,
  AlertCircle,
  Truck,
  Copy,
  Check,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: any[];
  subtotal: number;
  deliveryFee: number;
  appliedCoupon: { code: string; discountAmount: number } | null;
  currentUser?: any;
  onOrderSuccess: (orderData: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  deliveryFee,
  appliedCoupon,
  currentUser,
  onOrderSuccess,
}) => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Customer Info
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  // Step 2: Delivery Info
  const [address, setAddress] = useState(currentUser?.address || '');
  const [city, setCity] = useState(currentUser?.city || 'Lahore');
  const [area, setArea] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [instructions, setInstructions] = useState('');

  // Step 4: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'jazzcash' | 'bank_transfer' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const [jazzcashMobile, setJazzcashMobile] = useState('');
  const [jazzcashCnic, setJazzcashCnic] = useState('');

  // Bank transfer state
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [bankSenderTitle, setBankSenderTitle] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [transferredAmount, setTransferredAmount] = useState('');
  const [bankReceiptUrl, setBankReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/payment/banks')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.bankAccounts && data.bankAccounts.length > 0) {
            setBankAccounts(data.bankAccounts);
            setSelectedBankId(data.bankAccounts[0].id);
          }
        })
        .catch((err) => console.error('Failed to load banks', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);
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
        setBankReceiptUrl(data.receiptUrl);
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

  const handleNextFromCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please provide all customer contact information.');
      return;
    }
    setStep(2);
  };

  const handleNextFromDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!address.trim() || !city.trim()) {
      setError('Delivery address and city are mandatory.');
      return;
    }
    setStep(3);
  };

  const handleSubmitCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        customer: { name, email, phone },
        delivery: { address, city, area, postalCode, instructions },
        items: items.map((i) => ({
          productId: i.productId,
          productTitle: i.productTitle || i.title,
          quantity: i.quantity,
          selectedColour: i.selectedColour,
          selectedDesign: i.selectedDesign,
          customNotes: i.customNotes,
        })),
        couponCode: appliedCoupon?.code,
        paymentMethod,
        paymentDetails: {
          cardLast4: cardNumber ? cardNumber.slice(-4) : '4242',
          cardBrand: 'Visa',
          jazzcashMobile: jazzcashMobile || phone,
          jazzcashCnic,
          bankName: activeBank?.bankName || 'Meezan Bank Limited',
          senderAccountTitle: bankSenderTitle || name,
          transactionReference: bankRef || `BANK-${Date.now().toString().slice(-6)}`,
          transferredAmount: transferredAmount ? Number(transferredAmount) : grandTotal,
          receiptImageUrl: bankReceiptUrl || null,
        },
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete order checkout.');
      }

      setOrderConfirmed(data.order);
      onOrderSuccess(data.order);
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={orderConfirmed ? () => { onClose(); router.push(orderConfirmed.trackingUrl); } : onClose}
      title={orderConfirmed ? 'Order Confirmed!' : 'Saad Furniture Atelier Checkout'}
      subtitle={
        orderConfirmed
          ? `Official Order ID: #${orderConfirmed.orderNumber}`
          : `Step ${step} of 4: ${
              step === 1
                ? 'Customer Information'
                : step === 2
                ? 'Delivery Address'
                : step === 3
                ? 'Order Summary'
                : 'Payment Method'
            }`
      }
      maxWidth="2xl"
    >
      <div className="text-slate-100">
        {/* SUCCESS CONFIRMATION VIEW */}
        {orderConfirmed ? (
          <div className="py-4 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-white">
                Thank you for shopping with Saad Furniture.
              </h3>
              <p className="text-xs text-slate-400">
                Your bespoke commission has been officially confirmed and logged into the artisan production ledger.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-white/10 text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-[#e5caa2]">#{orderConfirmed.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Investment Total:</span>
                <span className="font-bold text-white">${orderConfirmed.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span
                  className={`font-semibold capitalize ${
                    orderConfirmed.paymentStatus === 'paid'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {orderConfirmed.paymentStatus?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Delivery:</span>
                <span className="text-slate-200">{orderConfirmed.expectedCompletionDate}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                variant="gold"
                size="md"
                onClick={() => {
                  onClose();
                  router.push(orderConfirmed.trackingUrl);
                }}
                className="font-bold flex items-center justify-center gap-2"
              >
                <span>Track My Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  onClose();
                  router.push('/portal');
                }}
              >
                View Patron Portal
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Steps breadcrumb */}
            <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold">
              <div
                className={`py-1.5 rounded-lg border transition-all ${
                  step === 1
                    ? 'bg-[#c5a880] text-slate-950 border-[#c5a880]'
                    : step > 1
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border-white/5'
                }`}
              >
                1. Customer
              </div>
              <div
                className={`py-1.5 rounded-lg border transition-all ${
                  step === 2
                    ? 'bg-[#c5a880] text-slate-950 border-[#c5a880]'
                    : step > 2
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border-white/5'
                }`}
              >
                2. Delivery
              </div>
              <div
                className={`py-1.5 rounded-lg border transition-all ${
                  step === 3
                    ? 'bg-[#c5a880] text-slate-950 border-[#c5a880]'
                    : step > 3
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border-white/5'
                }`}
              >
                3. Summary
              </div>
              <div
                className={`py-1.5 rounded-lg border transition-all ${
                  step === 4
                    ? 'bg-[#c5a880] text-slate-950 border-[#c5a880]'
                    : 'bg-slate-900 text-slate-500 border-white/5'
                }`}
              >
                4. Payment
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: CUSTOMER INFO */}
            {step === 1 && (
              <form onSubmit={handleNextFromCustomer} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alexander Vance"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vance@example.com"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Mobile Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <Button type="submit" variant="gold" size="md" className="flex items-center gap-2">
                    <span>Continue to Delivery</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 2: DELIVERY INFO */}
            {step === 2 && (
              <form onSubmit={handleNextFromDelivery} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Complete Street Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. House #45, Block C-2, Gulberg III"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lahore"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Area / Sector</label>
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Gulberg / DHA"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="54000"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    White-Glove Delivery Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Elevators available, second floor salon, call Marcus Vance before arrival."
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div className="pt-3 flex justify-between">
                  <Button type="button" variant="secondary" size="md" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" variant="gold" size="md" className="flex items-center gap-2">
                    <span>Review Order Summary</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 3: ORDER SUMMARY */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.primaryImage}
                          alt=""
                          className="w-12 h-12 rounded object-cover border border-white/10"
                        />
                        <div>
                          <h4 className="font-semibold text-white">{item.productTitle}</h4>
                          <span className="text-[11px] text-slate-400">
                            Qty: {item.quantity} • {item.selectedColour || 'Standard'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#e5caa2]">
                          ${item.totalItemPrice?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 text-xs space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span className="text-white font-medium">${subtotal.toLocaleString()}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promotional Discount ({appliedCoupon.code})</span>
                      <span>-${discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>White-Glove Delivery</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-400 font-bold">Complimentary (FREE)</span>
                      ) : (
                        `$${deliveryFee}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                    <span>Final Payable Amount</span>
                    <span className="text-base text-[#e5caa2] font-serif font-bold">
                      ${grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#c5a880]/10 border border-[#c5a880]/20 text-xs flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#c5a880] shrink-0" />
                  <span className="text-slate-300">
                    Deliver to: <strong>{address}, {city}</strong> ({phone})
                  </span>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button type="button" variant="secondary" size="md" onClick={() => setStep(2)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    type="button"
                    variant="gold"
                    size="md"
                    onClick={() => setStep(4)}
                    className="flex items-center gap-2"
                  >
                    <span>Choose Payment Method</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: PAYMENT METHOD */}
            {step === 4 && (
              <div className="space-y-4">
                {/* Method selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-[#c5a880]/15 border-[#c5a880] text-[#e5caa2] font-bold shadow-lg'
                        : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-[11px]">Card (Debit/Credit)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('jazzcash')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'jazzcash'
                        ? 'bg-[#c5a880]/15 border-[#c5a880] text-[#e5caa2] font-bold shadow-lg'
                        : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    <span className="text-[11px]">JazzCash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-[#c5a880]/15 border-[#c5a880] text-[#e5caa2] font-bold shadow-lg'
                        : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-[11px]">Bank Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'cod'
                        ? 'bg-[#c5a880]/15 border-[#c5a880] text-[#e5caa2] font-bold shadow-lg'
                        : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                    <span className="text-[11px]">Cash on Delivery</span>
                  </button>
                </div>

                {/* Sub-form based on selection */}
                {paymentMethod === 'card' && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                      <span className="text-slate-300 font-semibold">Instant Card Payment Gateway</span>
                      <div className="flex gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Visa</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Mastercard</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">UnionPay</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Name on card"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="12/28"
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-[#c5a880]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">CVC / Security Code</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="•••"
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-[#c5a880]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'jazzcash' && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                      <Smartphone className="w-4 h-4" />
                      <span>Official JazzCash Merchant Gateway</span>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">JazzCash Mobile Account Number</label>
                      <input
                        type="tel"
                        value={jazzcashMobile}
                        onChange={(e) => setJazzcashMobile(e.target.value)}
                        placeholder="0300 1234567"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">CNIC (Last 6 Digits)</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={jazzcashCnic}
                        onChange={(e) => setJazzcashCnic(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-[#c5a880]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Upon clicking Confirm, an authentication MPIN challenge will prompt on your mobile phone to approve the transaction.
                    </p>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3.5 text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#c5a880]" /> Official Atelier Bank Account
                      </span>
                      <span className="text-[10px] text-slate-400">Direct Bank Transfer</span>
                    </div>

                    {/* Bank selector pills */}
                    {bankAccounts.length > 1 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {bankAccounts.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBankId(b.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                              selectedBankId === b.id
                                ? 'bg-[#c5a880] text-slate-950 font-bold'
                                : 'bg-slate-950 text-slate-300 border border-white/10 hover:border-white/20'
                            }`}
                          >
                            {b.bankName}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeBank && (
                      <div className="p-3.5 rounded-xl bg-black/40 border border-[#c5a880]/30 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Bank Name:</span>
                          <span className="font-bold text-white">{activeBank.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Account Title:</span>
                          <span className="font-semibold text-[#e5caa2]">{activeBank.accountTitle}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Account Number:</span>
                            <span className="font-mono font-bold text-white text-xs select-all">
                              {activeBank.accountNumber}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeBank.accountNumber, 'acc')}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-slate-200 hover:text-white hover:border-[#c5a880] flex items-center gap-1"
                          >
                            {copiedField === 'acc' ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#c5a880]" /> Copy Account No
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                          <div className="overflow-hidden">
                            <span className="text-[10px] text-slate-400 block">IBAN / Raast:</span>
                            <span className="font-mono font-bold text-[#c5a880] text-[11px] select-all truncate block">
                              {activeBank.iban}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(activeBank.iban, 'iban')}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-[11px] text-slate-200 hover:text-white hover:border-[#c5a880] flex items-center gap-1 shrink-0"
                          >
                            {copiedField === 'iban' ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#c5a880]" /> Copy IBAN
                              </>
                            )}
                          </button>
                        </div>

                        {activeBank.instructions && (
                          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-white/5">
                            {activeBank.instructions}
                          </p>
                        )}

                        {activeBank.qrCodeUrl && (
                          <div className="flex flex-col items-center justify-center pt-2 pb-1 border-t border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 mb-1">
                              Scan to Pay (Raast / Banking App)
                            </span>
                            <img
                              src={activeBank.qrCodeUrl}
                              alt={`${activeBank.bankName} QR Code`}
                              className="w-28 h-28 object-contain rounded-xl bg-white p-1 border border-white/20 shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Sender Account Title</label>
                        <input
                          type="text"
                          value={bankSenderTitle}
                          onChange={(e) => setBankSenderTitle(e.target.value)}
                          placeholder="Your account title"
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#c5a880]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Transaction Ref / UTR *</label>
                        <input
                          type="text"
                          value={bankRef}
                          onChange={(e) => setBankRef(e.target.value)}
                          placeholder="e.g. MEZN-982341"
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#c5a880]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Transferred Amount (₨)</label>
                        <input
                          type="number"
                          value={transferredAmount}
                          onChange={(e) => setTransferredAmount(e.target.value)}
                          placeholder={grandTotal.toString()}
                          className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-[#c5a880]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Upload Transfer Screenshot / Receipt Proof
                      </label>
                      <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-white/20 bg-slate-950/60 hover:border-[#c5a880] cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-[#c5a880]" />
                        <span className="text-xs text-slate-300 font-medium">
                          {uploadingReceipt ? 'Attaching Receipt Screenshot...' : bankReceiptUrl ? 'Receipt Proof Attached ✓ (Click to change)' : 'Click to select receipt screenshot from device'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Super Admin Accounts Bureau audits all submitted bank receipts and confirms within 1-2 hours.
                      </span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-[#e5caa2] font-semibold">
                      <Banknote className="w-4 h-4" />
                      <span>White-Glove Cash on Delivery</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      You will pay <strong>${grandTotal.toLocaleString()}</strong> in cash directly to our assigned white-glove logistics specialist upon physical delivery and inspection at your premises.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <Button type="button" variant="secondary" size="md" onClick={() => setStep(3)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>

                  <Button
                    type="button"
                    variant="gold"
                    size="lg"
                    loading={loading}
                    onClick={handleSubmitCheckout}
                    className="font-bold shadow-xl shadow-[#c5a880]/20 flex items-center gap-2"
                  >
                    <span>Confirm & Place Order (${grandTotal.toLocaleString()})</span>
                    <ShieldCheck className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

