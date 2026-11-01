'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Calculator,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  Search,
  UserPlus,
  Phone,
  Mail,
  ChevronDown,
  X,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';

export interface OrderItemRow {
  id: string;
  productId: string;
  isCustom: boolean;
  title: string;
  sku: string;
  thumbnail: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  lineTotal: number;
  customDetails: string;
  dimensions: string;
  fabricInfo: string;
  colourInfo: string;
}

interface MultiItemOrderBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customersList: any[];
  productsList: any[];
  staffList: any[];
  initialCustomerId?: string;
}

export const MultiItemOrderBuilderModal: React.FC<MultiItemOrderBuilderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customersList,
  productsList,
  staffList,
  initialCustomerId,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState<string>('');
  const [assignedStaffId, setAssignedStaffId] = useState<string>('');
  const [assignedStaffName, setAssignedStaffName] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  // Customer Search & Quick Creation States
  const [localCustomers, setLocalCustomers] = useState<any[]>(customersList || []);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState<boolean>(false);
  const [customerSearchLoading, setCustomerSearchLoading] = useState<boolean>(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);

  // New Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustWhatsapp, setNewCustWhatsapp] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCity, setNewCustCity] = useState('Lahore');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [newCustSubmitting, setNewCustSubmitting] = useState(false);
  const [newCustError, setNewCustError] = useState<string | null>(null);

  // Sync customersList to localCustomers
  useEffect(() => {
    if (customersList && customersList.length > 0) {
      setLocalCustomers(customersList);
    }
  }, [customersList]);

  // Debounced server-side search across all customers & registered app accounts
  useEffect(() => {
    if (!customerSearchTerm.trim()) return;
    const timer = setTimeout(async () => {
      try {
        setCustomerSearchLoading(true);
        const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearchTerm.trim())}&compact=true&limit=25`);
        if (res.ok) {
          const data = await res.json();
          if (data.customers && Array.isArray(data.customers)) {
            setLocalCustomers((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const newItems = data.customers.filter((c: any) => !existingIds.has(c.id));
              return [...prev, ...newItems];
            });
          }
        }
      } catch (err) {
        console.error('Customer live search failed:', err);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [customerSearchTerm]);

  // Selected customer object
  const selectedCustomer = localCustomers.find((c) => c.id === selectedCustomerId);

  // Filter customers by name, phone, or email
  const filteredCustomers = localCustomers.filter((c) => {
    if (!customerSearchTerm.trim()) return true;
    const term = customerSearchTerm.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(term);
    const phoneMatch = c.phone?.toLowerCase().includes(term);
    const emailMatch = c.email?.toLowerCase().includes(term);
    const cityMatch = c.city?.toLowerCase().includes(term);
    return nameMatch || phoneMatch || emailMatch || cityMatch;
  });

  // Handle Quick Create Customer
  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewCustError(null);

    if (!newCustName.trim()) {
      setNewCustError('Customer full name is required.');
      return;
    }
    if (!newCustPhone.trim()) {
      setNewCustError('Customer mobile number is required.');
      return;
    }

    try {
      setNewCustSubmitting(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: newCustPhone.trim(),
          whatsappNumber: newCustWhatsapp.trim() || undefined,
          address: newCustAddress.trim() || undefined,
          city: newCustCity.trim() || 'Lahore',
          email: newCustEmail.trim() || undefined,
          notes: newCustNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create customer account');
      }

      const created = data.customer;
      // Add to local list if not already present
      setLocalCustomers((prev) => {
        const exists = prev.some((c) => c.id === created.id);
        return exists ? prev : [created, ...prev];
      });

      // Auto-select this customer in current order!
      setSelectedCustomerId(created.id);
      if (created.address) {
        setDeliveryAddress(created.address);
      }
      setCustomerSearchTerm('');
      setCustomerDropdownOpen(false);

      // Reset form & close quick-create modal
      setNewCustName('');
      setNewCustPhone('');
      setNewCustWhatsapp('');
      setNewCustAddress('');
      setNewCustCity('Lahore');
      setNewCustEmail('');
      setNewCustNotes('');
      setShowAddCustomerModal(false);
    } catch (err: any) {
      setNewCustError(err.message || 'Error saving customer');
    } finally {
      setNewCustSubmitting(false);
    }
  };

  // Items State
  const [items, setItems] = useState<OrderItemRow[]>([
    {
      id: 'item_1',
      productId: '',
      isCustom: true,
      title: '',
      sku: '',
      thumbnail: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      discount: 0,
      lineTotal: 0,
      customDetails: '',
      dimensions: '',
      fabricInfo: '',
      colourInfo: '',
    },
  ]);

  // Financial adjustments
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [deliveryCharges, setDeliveryCharges] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial customer
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
      const cust = customersList.find((c) => c.id === initialCustomerId);
      if (cust) {
        setDeliveryAddress(cust.address || '');
      }
    }
  }, [initialCustomerId, customersList]);

  // Recalculate line total helper
  const calcLineTotal = (qty: number, price: number, disc: number) => {
    const q = Math.max(1, Number(qty) || 1);
    const p = Math.max(0, Number(price) || 0);
    const d = Math.max(0, Number(disc) || 0);
    return Math.max(0, q * p - d);
  };

  // Add another product row
  const handleAddProductRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: '',
        isCustom: false,
        title: '',
        sku: '',
        thumbnail: '',
        quantity: 1,
        unit: 'pcs',
        unitPrice: 0,
        discount: 0,
        lineTotal: 0,
        customDetails: '',
        dimensions: '',
        fabricInfo: '',
        colourInfo: '',
      },
    ]);
  };

  // Remove a product row
  const handleRemoveProductRow = (index: number) => {
    if (items.length <= 1) {
      alert('An order must contain at least one product item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Update item field
  const handleItemChange = (index: number, updates: Partial<OrderItemRow>) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], ...updates };
      target.lineTotal = calcLineTotal(target.quantity, target.unitPrice, target.discount);
      copy[index] = target;
      return copy;
    });
  };

  // Select catalog product
  const handleSelectCatalogProduct = (index: number, prodId: string) => {
    if (!prodId) {
      handleItemChange(index, {
        productId: '',
        isCustom: true,
        title: '',
        sku: '',
        unitPrice: 0,
        thumbnail: '',
      });
      return;
    }

    const prod = productsList.find((p) => p.id === prodId);
    if (prod) {
      let thumb = '';
      try {
        const imgs = Array.isArray(prod.images) ? prod.images : JSON.parse(prod.images || '[]');
        thumb = prod.featuredImage || imgs[0] || '';
      } catch {
        thumb = prod.featuredImage || '';
      }

      handleItemChange(index, {
        productId: prod.id,
        isCustom: false,
        title: prod.title,
        sku: prod.sku,
        thumbnail: thumb,
        unitPrice: Number(prod.price) || 0,
        dimensions: prod.dimensions || '',
        customDetails: prod.description || '',
      });
    }
  };

  // Financial calculations
  const orderSubtotal = items.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
  const grandTotal = Math.max(0, orderSubtotal - (orderDiscount || 0) + (deliveryCharges || 0));
  const remainingBalance = Math.max(0, grandTotal - (advancePayment || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMsg('Please select a customer patron.');
      return;
    }

    if (items.some((it) => !it.title.trim())) {
      setErrorMsg('All product rows must have a product name or selected catalogue piece.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        customerId: selectedCustomerId,
        deliveryAddress: deliveryAddress.trim() || 'Showroom Collection',
        expectedCompletionDate: expectedCompletionDate || null,
        assignedStaffId: assignedStaffId || null,
        assignedStaffName: assignedStaffName || null,
        specialInstructions: specialInstructions.trim() || null,
        discount: orderDiscount,
        deliveryCharges,
        paidAmount: advancePayment,
        paymentMethod,
        transactionReference: transactionRef || undefined,
        items: items.map((it) => ({
          productId: it.productId || null,
          title: it.title,
          sku: it.sku || `SF-CUSTOM-${Math.floor(100 + Math.random() * 900)}`,
          quantity: it.quantity,
          unit: it.unit || 'pcs',
          unitPrice: it.unitPrice,
          discount: it.discount,
          lineTotal: it.lineTotal,
          customDetails: it.customDetails || null,
          specifications: it.dimensions ? `Dimensions: ${it.dimensions}` : null,
          customizationDetails: it.fabricInfo ? `Fabric: ${it.fabricInfo}, Colour: ${it.colourInfo}` : null,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'Failed to create multi-item order.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating the order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Multi-Item Customer Commission"
      subtitle="Assemble bespoke or showroom furniture suites with itemized pricing, discounts & advance ledger"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-white">
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SECTION 1: CUSTOMER & LOGISTICS */}
        <div className="p-4 bg-black/30 border border-white/5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-[#B99A68] font-bold uppercase tracking-wider text-[11px]">
            <User className="w-4 h-4" /> Patron & Delivery Information
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-300">Select Patron *</label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="text-[11px] text-[#B99A68] hover:text-[#d4b584] font-bold flex items-center gap-1 transition-colors hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add New Customer</span>
                </button>
              </div>

              {selectedCustomer ? (
                /* Selected Customer Summary Card */
                <div className="p-3.5 bg-slate-900 border border-[#B99A68]/60 rounded-xl flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#B99A68]/20 border border-[#B99A68] flex items-center justify-center shrink-0 text-[#B99A68] font-bold text-xs">
                      {selectedCustomer.name?.charAt(0) || 'P'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate flex items-center gap-2">
                        <span>{selectedCustomer.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                          selectedCustomer.customerType?.includes('Registered') || selectedCustomer.isRegistered
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#B99A68]/20 text-[#B99A68] border border-[#B99A68]/40'
                        }`}>
                          {selectedCustomer.customerType || 'Showroom Patron'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 truncate flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 font-mono text-slate-200">
                          <Phone className="w-3 h-3 text-[#B99A68]" /> {selectedCustomer.phone || 'No mobile'}
                        </span>
                        {selectedCustomer.email && (
                          <span className="text-slate-400 truncate">
                            ✉️ {selectedCustomer.email}
                          </span>
                        )}
                        {selectedCustomer.city && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" /> {selectedCustomer.city}
                          </span>
                        )}
                      </div>
                      {selectedCustomer.address && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          📍 {selectedCustomer.address}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerSearchTerm('');
                      setCustomerDropdownOpen(true);
                    }}
                    className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold shrink-0 transition-colors border border-white/5"
                  >
                    Change
                  </button>
                </div>
              ) : (
                /* Searchable Patron Selector Combobox */
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={customerSearchTerm}
                      onChange={(e) => {
                        setCustomerSearchTerm(e.target.value);
                        setCustomerDropdownOpen(true);
                      }}
                      onFocus={() => setCustomerDropdownOpen(true)}
                      placeholder="Search customer by name, phone or email..."
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                    />
                    {customerSearchLoading && (
                      <div className="absolute right-8 top-3 text-[#B99A68] animate-spin text-xs">
                        ⟳
                      </div>
                    )}
                    {customerSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSearchTerm('');
                          setCustomerDropdownOpen(false);
                        }}
                        className="absolute right-2.5 top-3 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {customerDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#141822] border border-[#B99A68]/40 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-white/5">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.slice(0, 20).map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              if (cust.address) {
                                setDeliveryAddress(cust.address);
                              }
                              setCustomerDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-white/5 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs truncate">{cust.name}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold tracking-wider uppercase ${
                                  cust.customerType?.includes('Registered') || cust.isRegistered
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {cust.customerType || (cust.isRegistered ? 'Registered App Patron' : 'Showroom Patron')}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 font-mono">
                                <span>📱 {cust.phone || 'N/A'}</span>
                                {cust.email && <span className="text-slate-500">✉️ {cust.email}</span>}
                                {cust.city && <span className="text-slate-500">📍 {cust.city}</span>}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="text-[10px] h-7 px-2.5 border-slate-700 shrink-0">
                              Select
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-3.5 text-center text-slate-400 text-xs">
                          {customerSearchLoading ? 'Searching customer records...' : `No matching customers found for "${customerSearchTerm}"`}
                        </div>
                      )}

                      <div
                        onClick={() => {
                          setCustomerDropdownOpen(false);
                          setShowAddCustomerModal(true);
                        }}
                        className="p-3 bg-[#B99A68]/15 hover:bg-[#B99A68]/25 cursor-pointer flex items-center justify-center gap-2 text-[#B99A68] font-bold text-xs transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>+ Add New Customer "{customerSearchTerm || ''}"</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Delivery Destination Address *</label>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. House #14, Canal Road, Faisalabad"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Expected Completion / Delivery Target</label>
              <input
                type="date"
                value={expectedCompletionDate}
                onChange={(e) => setExpectedCompletionDate(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Assigned Master Artisan / Staff</label>
              <select
                value={assignedStaffId}
                onChange={(e) => {
                  const st = staffList.find((s) => s.id === e.target.value);
                  setAssignedStaffId(e.target.value);
                  setAssignedStaffName(st ? st.name : '');
                }}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              >
                <option value="">-- Select Workshop Artisan --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: MULTI-ITEM ORDER BUILDER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#B99A68] font-bold uppercase tracking-wider text-[11px]">
              <Package className="w-4 h-4" /> Order Line Items ({items.length})
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProductRow}
              className="border-[#B99A68]/50 text-[#B99A68] hover:bg-[#B99A68]/10 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              ADD ANOTHER PRODUCT
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl relative space-y-3 transition-all hover:border-[#B99A68]/30"
              >
                {/* Header of Item Row */}
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#B99A68]/20 text-[#B99A68] font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white">
                      {item.title || `Item #${idx + 1}`}
                    </span>
                    {item.isCustom ? (
                      <Badge variant="blue">Custom Piece</Badge>
                    ) : (
                      <Badge variant="gold">Catalogue Item</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleItemChange(idx, {
                          isCustom: !item.isCustom,
                          productId: '',
                          title: item.isCustom ? '' : item.title,
                        })
                      }
                      className="text-[11px] text-slate-400 hover:text-white underline"
                    >
                      {item.isCustom ? 'Pick from Catalogue' : 'Switch to Custom Piece'}
                    </button>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProductRow(idx)}
                        className="p-1.5 rounded-lg bg-red-950/30 text-red-400 hover:bg-red-900/50 hover:text-red-200 transition-colors ml-2"
                        title="Remove product item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Product Selector / Title */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {!item.isCustom ? (
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 mb-1">Select from Catalogue *</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleSelectCatalogProduct(idx, e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
                      >
                        <option value="">-- Choose Catalogue Piece --</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} (₨{Number(p.price).toLocaleString()} - SKU: {p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 mb-1">Custom Product Name *</label>
                      <input
                        type="text"
                        required
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, { title: e.target.value })}
                        placeholder="e.g. Royal Emerald 4-Piece Chesterfield Set"
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 mb-1">SKU / Item Code</label>
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => handleItemChange(idx, { sku: e.target.value })}
                      placeholder="e.g. SF-SOF-101"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
                    />
                  </div>
                </div>

                {/* Pricing, Quantity, Discount, Line Total */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div>
                    <label className="block text-slate-300 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, { quantity: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Unit</label>
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, { unit: e.target.value })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="sets">Complete Set</option>
                      <option value="pairs">Pair</option>
                      <option value="chairs">Chairs</option>
                      <option value="tables">Tables</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Unit Price (PKR) *</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, { unitPrice: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Item Discount (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.discount}
                      onChange={(e) => handleItemChange(idx, { discount: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-slate-400 mb-1 font-semibold uppercase text-[10px]">Line Total</label>
                    <div className="p-2 bg-slate-950 border border-[#B99A68]/30 rounded-lg text-[#B99A68] font-bold font-mono text-center">
                      ₨{item.lineTotal.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Custom Specifications (Dimensions, Fabric, Custom Notes) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-0.5">Dimensions & Scale</label>
                    <input
                      type="text"
                      value={item.dimensions}
                      onChange={(e) => handleItemChange(idx, { dimensions: e.target.value })}
                      placeholder="e.g. 7ft x 3.5ft x 2.8ft"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-0.5">Fabric & Colour Scheme</label>
                    <input
                      type="text"
                      value={item.fabricInfo}
                      onChange={(e) => handleItemChange(idx, { fabricInfo: e.target.value })}
                      placeholder="e.g. Turkish Velvet / Emerald Green"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-0.5">Wood & Custom Carving Notes</label>
                    <input
                      type="text"
                      value={item.customDetails}
                      onChange={(e) => handleItemChange(idx, { customDetails: e.target.value })}
                      placeholder="e.g. Pure seasoned Sheesham with brass inlay"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProductRow}
              className="w-full border-dashed border-[#B99A68]/50 text-[#B99A68] hover:bg-[#B99A68]/10 h-10 font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              ADD ANOTHER PRODUCT ROW
            </Button>
          </div>
        </div>

        {/* SECTION 3: AUTOMATIC FINANCIAL CALCULATIONS & ADVANCE LEDGER */}
        <div className="p-5 bg-gradient-to-br from-[#1c1a18] to-[#141312] border border-[#B99A68]/40 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-[#B99A68] font-bold uppercase tracking-wider text-[11px]">
            <Calculator className="w-4 h-4" /> Instant Financial Calculation Summary
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 mb-1">Additional Order Discount (PKR)</label>
              <input
                type="number"
                min={0}
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-mono focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">White-Glove Delivery Charges (PKR)</label>
              <input
                type="number"
                min={0}
                value={deliveryCharges}
                onChange={(e) => setDeliveryCharges(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Advance Payment Received (PKR) *</label>
              <input
                type="number"
                min={0}
                value={advancePayment}
                onChange={(e) => setAdvancePayment(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold font-mono focus:outline-none focus:border-[#B99A68]"
              />
            </div>
          </div>

          {advancePayment > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <label className="block text-slate-300 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash at Showroom</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Payment Reference / Transaction ID</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. TXN-984321 / Cash Slip #41"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>
          )}

          {/* Totals Summary Banner */}
          <div className="bg-black/50 p-4 rounded-xl border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Subtotal</span>
              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                ₨{orderSubtotal.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Grand Total</span>
              <span className="text-base font-bold text-[#B99A68] font-mono mt-0.5 block">
                ₨{grandTotal.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Advance Paid</span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                ₨{advancePayment.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Remaining Balance</span>
              <span className={`text-base font-bold font-mono mt-0.5 block ${remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ₨{remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <label className="block text-slate-300 mb-1">Special Instructions & White-Glove Notes</label>
          <textarea
            rows={2}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="e.g. Master bedroom suite. Fragile brass trims require extra padded packaging."
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="gold" type="submit" disabled={isSubmitting} className="font-bold px-6">
            {isSubmitting ? 'Registering Commission...' : 'Place Multi-Item Commission'}
          </Button>
        </div>
      </form>
    </Modal>

    {/* ADD NEW CUSTOMER MODAL (SECTION 2) */}
    <Modal
      isOpen={showAddCustomerModal}
      onClose={() => setShowAddCustomerModal(false)}
      title="Add New Patron Account"
      subtitle="Register a new customer profile. Will automatically be selected for this order."
      maxWidth="md"
    >
      <form onSubmit={handleQuickCreateCustomer} className="space-y-4 text-xs text-white">
        {newCustError && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{newCustError}</span>
          </div>
        )}

        <div>
          <label className="block text-slate-300 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={newCustName}
            onChange={(e) => setNewCustName(e.target.value)}
            placeholder="e.g. Mian Tariq Mahmood"
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 mb-1">Mobile / Phone Number *</label>
            <input
              type="text"
              required
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              placeholder="e.g. 0300 1234567"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">WhatsApp Number (Optional)</label>
            <input
              type="text"
              value={newCustWhatsapp}
              onChange={(e) => setNewCustWhatsapp(e.target.value)}
              placeholder="e.g. +92 300 1234567"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-slate-300 mb-1">Delivery Destination Address *</label>
            <input
              type="text"
              required
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              placeholder="e.g. House #42, Street 7, Phase 6 DHA"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">City *</label>
            <input
              type="text"
              required
              value={newCustCity}
              onChange={(e) => setNewCustCity(e.target.value)}
              placeholder="e.g. Lahore"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 mb-1">Email Address (Optional)</label>
          <input
            type="email"
            value={newCustEmail}
            onChange={(e) => setNewCustEmail(e.target.value)}
            placeholder="patron@gmail.com (Auto-generated if empty)"
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
          />
        </div>

        <div>
          <label className="block text-slate-300 mb-1">Patron Notes / Preferences (Optional)</label>
          <textarea
            rows={2}
            value={newCustNotes}
            onChange={(e) => setNewCustNotes(e.target.value)}
            placeholder="e.g. VIP client, prefers dark walnut finish and high-firmness seating"
            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setShowAddCustomerModal(false)}
            disabled={newCustSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="gold"
            type="submit"
            disabled={newCustSubmitting}
            className="font-bold px-5"
          >
            {newCustSubmitting ? 'Saving Patron...' : 'Save & Select For Order'}
          </Button>
        </div>
      </form>
    </Modal>
  </>
  );
};

