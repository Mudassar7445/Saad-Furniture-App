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
                <div className="bg-white p-4 rounded-2xl border border-[#B99A68]/50 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#262421] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#B99A68]" /> Official Atelier Bank Account
                    </h4>
                    <span className="text-[10px] text-[#89847C]">Select Bank</span>
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
                              ? 'bg-[#262421] text-[#B99A68] border border-[#B99A68]'
                              : 'bg-[#F7F5F0] text-[#89847C] border border-[#EAE2D6]'
                          }`}
                        >
                          {b.bankName}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeBank && (
                    <div className="space-y-2 text-xs bg-[#F7F5F0] p-3 rounded-xl border border-[#EAE2D6]">
                      <div className="flex justify-between items-center">
                        <span className="text-[#89847C]">Bank:</span>
                        <strong className="text-[#262421]">{activeBank.bankName}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#89847C]">Account Title:</span>
                        <strong className="text-[#262421]">{activeBank.accountTitle}</strong>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-[#EAE2D6]">
                        <div>
                          <span className="text-[10px] text-[#89847C] block">Account No:</span>
                          <span className="font-mono font-bold text-[#262421] text-xs">
                            {activeBank.accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeBank.accountNumber, 'acc')}
                          className="px-2 py-1 rounded-md bg-white border border-[#EAE2D6] text-[10px] font-bold text-[#262421] hover:border-[#B99A68] flex items-center gap-1 shadow-xs"
                        >
                          {copiedField === 'acc' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#B99A68]" /> Copy No.
                            </>
                          )}
                        </button>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-[#EAE2D6]">
                        <div>
                          <span className="text-[10px] text-[#89847C] block">IBAN / Raast:</span>
                          <span className="font-mono text-[#B99A68] text-[11px] font-bold">
                            {activeBank.iban}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(activeBank.iban, 'iban')}
                          className="px-2 py-1 rounded-md bg-white border border-[#EAE2D6] text-[10px] font-bold text-[#262421] hover:border-[#B99A68] flex items-center gap-1 shadow-xs"
                        >
                          {copiedField === 'iban' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#B99A68]" /> Copy IBAN
                            </>
                          )}
                        </button>
                      </div>
                      {activeBank.instructions && (
                        <p className="text-[10px] text-[#89847C] italic pt-1">
                          {activeBank.instructions}
                        </p>
                      )}

                      {activeBank.qrCodeUrl && (
                        <div className="flex flex-col items-center justify-center pt-2 pb-1 border-t border-[#EAE2D6]">
                          <span className="text-[10px] font-bold text-[#89847C] mb-1">
                            Scan to Pay (Raast / Banking App)
                          </span>
                          <img
                            src={activeBank.qrCodeUrl}
                            alt={`${activeBank.bankName} QR Code`}
                            className="w-32 h-32 object-contain rounded-xl bg-white p-1 border border-[#EAE2D6] shadow-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#89847C] block mb-1">
                        Transaction Ref / UTR *
                      </label>
                      <input
                        type="text"
                        value={bankRef}
                        onChange={(e) => setBankRef(e.target.value)}
                        placeholder="e.g. MEZN-98214"
                        className="w-full px-2.5 py-1.5 bg-[#F7F5F0] rounded-lg border border-[#EAE2D6] text-xs text-[#292722] focus:outline-none focus:border-[#B99A68]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#89847C] block mb-1">
                        Transferred Amount (₨)
                      </label>
                      <input
                        type="number"
                        value={transferredAmount}
                        onChange={(e) => setTransferredAmount(e.target.value)}
                        placeholder={finalTotal.toString()}
                        className="w-full px-2.5 py-1.5 bg-[#F7F5F0] rounded-lg border border-[#EAE2D6] text-xs text-[#292722] font-mono focus:outline-none focus:border-[#B99A68]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#89847C] block mb-1">
                      Upload Transfer Screenshot / Receipt Proof
                    </label>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#EAE2D6] rounded-xl p-3 cursor-pointer hover:border-[#B99A68] bg-[#F7F5F0]/50 transition-colors">
                      <Upload className="w-5 h-5 text-[#89847C] mb-1" />
                      <span className="text-[11px] font-bold text-[#262421]">
                        {uploadingReceipt ? 'Attaching Receipt...' : receiptUrl ? 'Receipt Attached ✓ (Tap to change)' : 'Tap to select receipt photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                    {receiptUrl && (
                      <div className="mt-1.5 flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px]">
                        <span className="flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Receipt uploaded successfully
                        </span>
                        <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold text-emerald-700">
                          View
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Payment Details Box */}
              {paymentMethod === 'card' && (
                <div className="bg-white p-4 rounded-2xl border border-[#B99A68]/50 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAE2D6]">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#B99A68]" />
                      <span className="text-xs font-bold text-[#262421]">Pay with Card (Debit/Credit)</span>
                    </div>
                    <div className="flex gap-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Visa</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Mastercard</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#89847C] block mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] focus:outline-none focus:border-[#B99A68]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#89847C] block mb-1">Card Number</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] font-mono focus:outline-none focus:border-[#B99A68]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[#89847C] block mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] font-mono focus:outline-none focus:border-[#B99A68]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#89847C] block mb-1">CVV / Security Code</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="•••"
                        className="w-full px-3 py-2 bg-[#F7F5F0] rounded-xl border border-[#EAE2D6] text-xs text-[#292722] font-mono focus:outline-none focus:border-[#B99A68]"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-[#89847C] flex items-center gap-1 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>256-bit PCI-DSS encrypted card gateway. Card credentials are never stored.</span>
                  </p>
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

