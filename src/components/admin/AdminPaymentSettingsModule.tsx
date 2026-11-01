'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Copy,
  Check,
  ExternalLink,
  Eye,
  RefreshCw,
  Lock,
  Shield,
  DollarSign,
  Filter,
  Search,
  FileText,
  Clock,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface BankAccount {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchName?: string | null;
  branchCode?: string | null;
  instructions?: string | null;
  qrCodeUrl?: string | null;
  isActive: number;
  displayOrder: number;
}

interface PaymentSubmission {
  id: string;
  submissionType: 'bank_transfer' | 'card';
  orderId: string;
  orderNumber: string;
  totalOrderAmount: number;
  paidOrderAmount: number;
  remainingBalance: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  bankName?: string;
  senderAccountTitle?: string;
  senderAccountNumber?: string;
  transactionReference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'success' | 'failed';
  receiptImageUrl?: string;
  rejectionReason?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export const AdminPaymentSettingsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bank_accounts' | 'submissions' | 'card_gateway'>('submissions');
  
  // Bank accounts state
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    branchName: '',
    branchCode: '',
    instructions: '',
    qrCodeUrl: '',
    isActive: true,
  });
  const [uploadingQr, setUploadingQr] = useState(false);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/payment/receipt-upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.receiptUrl) {
        setBankForm((prev) => ({ ...prev, qrCodeUrl: data.receiptUrl }));
      } else {
        alert(data.error || 'Failed to upload QR Code');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading QR Code image');
    } finally {
      setUploadingQr(false);
    }
  };

  // Gateway config state
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [loadingGateway, setLoadingGateway] = useState(false);
  const [gatewayForm, setGatewayForm] = useState({
    provider: 'stripe',
    mode: 'sandbox',
    isEnabled: true,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    merchantId: '',
    supportedCurrencies: '["PKR","USD"]',
  });
  const [gatewaySaving, setGatewaySaving] = useState(false);
  const [gatewaySuccessMsg, setGatewaySuccessMsg] = useState('');

  // Payment Submissions state
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentSubmission | null>(null);
  const [reviewActionModal, setReviewActionModal] = useState<{
    submission: PaymentSubmission;
    action: 'approve' | 'reject';
  } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [verifiedAmountInput, setVerifiedAmountInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch Banks
  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch('/api/payment/banks?all=true');
      const data = await res.json();
      if (res.ok && data.bankAccounts) {
        setBanks(data.bankAccounts);
      }
    } catch (err) {
      console.error('Failed to load banks', err);
    } finally {
      setLoadingBanks(false);
    }
  };

  // Fetch Gateway Config
  const fetchGatewayConfig = async () => {
    setLoadingGateway(true);
    try {
      const res = await fetch('/api/payment/settings');
      const data = await res.json();
      if (res.ok && data.cardGateway) {
        setGatewayConfig(data.cardGateway);
        setGatewayForm({
          provider: data.cardGateway.provider || 'stripe',
          mode: data.cardGateway.mode || 'sandbox',
          isEnabled: Boolean(data.cardGateway.isEnabled),
          publishableKey: data.cardGateway.publishableKey || '',
          secretKey: '', // never return secret key
          webhookSecret: '',
          merchantId: data.cardGateway.merchantId || '',
          supportedCurrencies: data.cardGateway.supportedCurrencies || '["PKR","USD"]',
        });
      }
    } catch (err) {
      console.error('Failed to load gateway config', err);
    } finally {
      setLoadingGateway(false);
    }
  };

  // Fetch Submissions
  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/payment/submissions?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchBanks();
    fetchGatewayConfig();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, searchQuery]);

  // Handle Bank Save
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingBank ? `/api/payment/banks/${editingBank.id}` : '/api/payment/banks';
      const method = editingBank ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bankForm,
          isActive: bankForm.isActive ? 1 : 0,
        }),
      });

      if (res.ok) {
        setBankModalOpen(false);
        setEditingBank(null);
        setBankForm({
          bankName: '',
          accountTitle: '',
          accountNumber: '',
          iban: '',
          branchName: '',
          branchCode: '',
          instructions: '',
          qrCodeUrl: '',
          isActive: true,
        });
        fetchBanks();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save bank account');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving bank account');
    }
  };

  // Handle Bank Delete
  const handleDeleteBank = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}? Customers will no longer see this bank option.`)) return;
    try {
      const res = await fetch(`/api/payment/banks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBanks();
      }
    } catch (err) {
      console.error('Delete bank error', err);
    }
  };

  // Handle Bank Toggle Active
  const handleToggleBank = async (bank: BankAccount) => {
    try {
      const res = await fetch(`/api/payment/banks/${bank.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: bank.isActive ? 0 : 1 }),
      });
      if (res.ok) {
        fetchBanks();
      }
    } catch (err) {
      console.error('Toggle bank error', err);
    }
  };

  // Handle Gateway Save
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewaySaving(true);
    setGatewaySuccessMsg('');
    try {
      const res = await fetch('/api/payment/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gatewayForm),
      });
      const data = await res.json();
      if (res.ok) {
        setGatewaySuccessMsg('Payment gateway configuration securely updated.');
        fetchGatewayConfig();
        setTimeout(() => setGatewaySuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to update gateway settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating gateway settings');
    } finally {
      setGatewaySaving(false);
    }
  };

  // Handle Review Submission (Approve / Reject)
  const handleExecuteReview = async () => {
    if (!reviewActionModal) return;
    setSubmittingReview(true);
    try {
      const { submission, action } = reviewActionModal;
      const res = await fetch(`/api/payment/submissions/${submission.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReasonInput : undefined,
          notes: reviewNotesInput,
          verifiedAmount: verifiedAmountInput ? Number(verifiedAmountInput) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewActionModal(null);
        setRejectionReasonInput('');
        setReviewNotesInput('');
        setVerifiedAmountInput('');
        fetchSubmissions();
      } else {
        alert(data.error || 'Failed to review payment submission');
      }
    } catch (err) {
      console.error('Review submission error', err);
      alert('Network error while processing review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="p-6 bg-gradient-to-r from-[#121620] via-[#171c28] to-[#121620] rounded-2xl border border-white/10 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#B99A68]/20 border border-[#B99A68]/40 text-[#B99A68]">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Payment Systems & Bank Accounts Management
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              Configure atelier bank accounts for customer direct transfers, manage secure PCI-compliant card gateway integration, audit customer payment receipts, and maintain an immutable financial ledger.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchBanks();
                fetchGatewayConfig();
                fetchSubmissions();
              }}
              className="text-xs text-slate-300 border-white/10 hover:bg-white/5"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            {activeTab === 'bank_accounts' && (
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setEditingBank(null);
                  setBankForm({
                    bankName: '',
                    accountTitle: '',
                    accountNumber: '',
                    iban: '',
                    branchName: '',
                    branchCode: '',
                    instructions: '',
                    qrCodeUrl: '',
                    isActive: true,
                  });
                  setBankModalOpen(true);
                }}
                className="text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Bank Account
              </Button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-6 border-b border-white/10 pt-2">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors relative ${
              activeTab === 'submissions'
                ? 'border-[#B99A68] text-[#B99A68]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Customer Submissions & Receipts</span>
            {pendingSubmissionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('bank_accounts')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'bank_accounts'
                ? 'border-[#B99A68] text-[#B99A68]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Atelier Bank Accounts ({banks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('card_gateway')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'card_gateway'
                ? 'border-[#B99A68] text-[#B99A68]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Card Gateway Config & Security</span>
            {gatewayConfig?.isConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: CUSTOMER SUBMISSIONS & RECEIPTS AUDIT */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#121620] rounded-xl border border-white/5">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search patron, order #, ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-white/10 text-xs">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize ${
                      statusFilter === st
                        ? 'bg-[#B99A68] text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submissions Table */}
          {loadingSubmissions ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-[#121620] rounded-xl border border-white/5">
              Loading payment submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-[#121620] rounded-xl border border-white/5">
              No customer payment submissions found matching your filters.
            </div>
          ) : (
            <div className="border border-white/10 rounded-2xl bg-[#121620] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                    <tr>
                      <th className="p-3.5">Submission Details</th>
                      <th className="p-3.5">Patron & Order</th>
                      <th className="p-3.5">Payment Method / Bank</th>
                      <th className="p-3.5 text-right">Amount Paid</th>
                      <th className="p-3.5 text-right">Order Bal.</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Receipt</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-white block">
                            {sub.transactionReference}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {new Date(sub.createdAt).toLocaleString()}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-bold text-white block">{sub.customerName}</span>
                          <span className="text-[11px] text-[#B99A68] font-mono block">
                            #{sub.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">{sub.customerPhone}</span>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            {sub.submissionType === 'bank_transfer' ? (
                              <Building2 className="w-3.5 h-3.5 text-[#B99A68]" />
                            ) : (
                              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            <span className="font-semibold text-white">
                              {sub.bankName || (sub.submissionType === 'card' ? 'Online Card' : 'Direct Transfer')}
                            </span>
                          </div>
                          {sub.senderAccountTitle && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Sender: {sub.senderAccountTitle}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                          ₨{sub.amount?.toLocaleString()}
                        </td>

                        <td className="p-3.5 text-right font-mono text-slate-400">
                          ₨{sub.remainingBalance?.toLocaleString()}
                        </td>

                        <td className="p-3.5 text-center">
                          {sub.status === 'pending' && (
                            <Badge variant="amber" className="uppercase text-[9px]">
                              Pending Review
                            </Badge>
                          )}
                          {sub.status === 'approved' && (
                            <Badge variant="green" className="uppercase text-[9px]">
                              Verified ✓
                            </Badge>
                          )}
                          {sub.status === 'rejected' && (
                            <Badge variant="red" className="uppercase text-[9px]">
                              Rejected ✕
                            </Badge>
                          )}
                          {sub.status === 'success' && (
                            <Badge variant="green" className="uppercase text-[9px]">
                              Success
                            </Badge>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          {sub.receiptImageUrl ? (
                            <button
                              onClick={() => setSelectedReceipt(sub)}
                              className="px-2 py-1 bg-slate-900 border border-white/10 rounded-lg text-[10px] text-[#B99A68] hover:border-[#B99A68] flex items-center gap-1 mx-auto"
                            >
                              <Eye className="w-3 h-3" /> View Receipt
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600">No Image</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          {sub.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="gold"
                                onClick={() => {
                                  setVerifiedAmountInput(sub.amount.toString());
                                  setReviewActionModal({ submission: sub, action: 'approve' });
                                }}
                                className="h-7 text-[10px] px-2.5 font-bold"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectionReasonInput('');
                                  setReviewActionModal({ submission: sub, action: 'reject' });
                                }}
                                className="h-7 text-[10px] px-2 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">
                              Reviewed by {sub.reviewedBy || 'Admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATELIER BANK ACCOUNTS */}
      {activeTab === 'bank_accounts' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#121620] rounded-xl border border-white/5 flex items-center justify-between">
            <div className="text-xs text-slate-300">
              <strong className="text-white">Active Payment Options:</strong> Customers placing online or custom orders can view and transfer funds directly to any enabled bank account below.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className={`p-5 rounded-2xl border transition-all ${
                  bank.isActive
                    ? 'bg-[#121620] border-[#B99A68]/40 shadow-lg'
                    : 'bg-[#10131a]/60 border-white/5 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#B99A68]/10 text-[#B99A68] border border-[#B99A68]/20">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-sm">{bank.bankName}</h3>
                      <span className="text-[10px] text-slate-400">{bank.branchName || 'Main Commercial Branch'}</span>
                    </div>
                  </div>

                  <Badge variant={bank.isActive ? 'green' : 'neutral'}>
                    {bank.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                <div className="py-3 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Account Title</span>
                    <span className="font-bold text-white block mt-0.5">{bank.accountTitle}</span>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Account Number</span>
                      <span className="font-mono font-bold text-[#B99A68] text-xs select-all">
                        {bank.accountNumber}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bank.accountNumber, `${bank.id}-acc`)}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Copy Account Number"
                    >
                      {copiedId === `${bank.id}-acc` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <div className="overflow-hidden">
                      <span className="text-[9px] text-slate-400 block uppercase">IBAN / Raast</span>
                      <span className="font-mono text-white text-[11px] truncate block select-all">
                        {bank.iban}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(bank.iban, `${bank.id}-iban`)}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                      title="Copy IBAN"
                    >
                      {copiedId === `${bank.id}-iban` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {bank.instructions && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-white/5">
                      {bank.instructions}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleBank(bank)}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    {bank.isActive ? 'Disable Account' : 'Enable Account'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingBank(bank);
                        setBankForm({
                          bankName: bank.bankName,
                          accountTitle: bank.accountTitle,
                          accountNumber: bank.accountNumber,
                          iban: bank.iban,
                          branchName: bank.branchName || '',
                          branchCode: bank.branchCode || '',
                          instructions: bank.instructions || '',
                          qrCodeUrl: bank.qrCodeUrl || '',
                          isActive: Boolean(bank.isActive),
                        });
                        setBankModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-[#B99A68]/20 text-slate-300 hover:text-[#B99A68] border border-white/5"
                      title="Edit Account Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteBank(bank.id, bank.bankName)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-white/5"
                      title="Delete Bank Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CARD GATEWAY CONFIGURATION */}
      {activeTab === 'card_gateway' && (
        <div className="space-y-6 max-w-4xl">
          {/* Status Alert */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-white/10 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#B99A68] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-white">PCI-DSS Compliant Security Standard</h4>
              <p className="text-slate-400 leading-relaxed">
                Card numbers, CVV security codes, and full credentials are authenticated directly through encrypted payment tokens and <strong>never stored</strong> in the Saad Furniture application database. 
                Gateway secret keys are encrypted with 256-bit AES storage on the server and are never delivered to the client browser.
              </p>
            </div>
          </div>

          {gatewaySuccessMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{gatewaySuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveGateway} className="p-6 bg-[#121620] rounded-2xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  Debit / Credit Card Gateway Settings
                </h3>
                <span className="text-[11px] text-slate-400">
                  Configure Stripe, Safepay (Pakistan), or custom merchant gateway
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Card Payments:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gatewayForm.isEnabled}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, isEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#B99A68]"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Payment Provider</label>
                <select
                  value={gatewayForm.provider}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, provider: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
                >
                  <option value="stripe">Stripe Payments (Global & Cards)</option>
                  <option value="safepay">Safepay Pakistan (Visa, Mastercard, PayPak)</option>
                  <option value="custom">Custom Bank Host Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Environment Mode</label>
                <select
                  value={gatewayForm.mode}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, mode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
                >
                  <option value="sandbox">Sandbox / Testing (Simulated Test Cards)</option>
                  <option value="live">Live Production (Real Financial Settlement)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Public / Publishable API Key
                </label>
                <input
                  type="text"
                  value={gatewayForm.publishableKey}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, publishableKey: e.target.value })}
                  placeholder="pk_test_... or pk_live_..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#B99A68]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Safe to load on client for card tokenization.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Secret API Key
                </label>
                <input
                  type="password"
                  value={gatewayForm.secretKey}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, secretKey: e.target.value })}
                  placeholder={gatewayConfig?.hasSecretKey ? '•••••••••••••••••••••••••••••••• (Encrypted in Vault)' : 'sk_test_... or sk_live_...'}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#B99A68]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {gatewayConfig?.hasSecretKey
                    ? 'Encrypted in server database. Leave blank to keep existing key, or enter a new key to update.'
                    : 'Required for server-side charge verification and webhook settlement.'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Webhook Signing Secret
                </label>
                <input
                  type="password"
                  value={gatewayForm.webhookSecret}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, webhookSecret: e.target.value })}
                  placeholder={gatewayConfig?.hasWebhookSecret ? '•••••••••••••••• (Encrypted)' : 'whsec_...'}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#B99A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Merchant ID / Account Identifier
                </label>
                <input
                  type="text"
                  value={gatewayForm.merchantId}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, merchantId: e.target.value })}
                  placeholder="acct_1... or safepay_merchant_..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#B99A68]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#B99A68]" />
                <span>Protected under Super Admin authority</span>
              </div>

              <Button
                type="submit"
                variant="gold"
                size="md"
                loading={gatewaySaving}
                className="font-bold text-xs"
              >
                Save Payment Settings
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT BANK ACCOUNT */}
      <Modal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        title={editingBank ? 'Edit Atelier Bank Account' : 'Add Atelier Bank Account'}
        subtitle="Manage official bank coordinates displayed to patrons during checkout"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveBank} className="space-y-4 text-xs text-white">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Bank Name *</label>
            <input
              type="text"
              required
              value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              placeholder="e.g. Meezan Bank Limited, Standard Chartered"
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Account Title *</label>
            <input
              type="text"
              required
              value={bankForm.accountTitle}
              onChange={(e) => setBankForm({ ...bankForm, accountTitle: e.target.value })}
              placeholder="e.g. Saad Furniture Atelier Ltd"
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Account Number *</label>
              <input
                type="text"
                required
                value={bankForm.accountNumber}
                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                placeholder="02840105829102"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#B99A68]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">IBAN / Raast ID *</label>
              <input
                type="text"
                required
                value={bankForm.iban}
                onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                placeholder="PK36MEZN0001234567890101"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#B99A68]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Branch Name</label>
              <input
                type="text"
                value={bankForm.branchName}
                onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                placeholder="Gulberg Main Boulevard, Lahore"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Branch Code</label>
              <input
                type="text"
                value={bankForm.branchCode}
                onChange={(e) => setBankForm({ ...bankForm, branchCode: e.target.value })}
                placeholder="0284"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#B99A68]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Transfer Instructions</label>
            <textarea
              rows={2}
              value={bankForm.instructions}
              onChange={(e) => setBankForm({ ...bankForm, instructions: e.target.value })}
              placeholder="e.g. Please use Order ID in transfer remarks for instant auto-matching."
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Payment QR Code (Raast / Banking App QR)
            </label>
            {bankForm.qrCodeUrl ? (
              <div className="flex items-center gap-3 p-3 bg-slate-950 border border-white/10 rounded-xl">
                <img
                  src={bankForm.qrCodeUrl}
                  alt="Bank QR Code"
                  className="w-16 h-16 object-contain rounded-lg bg-white p-1 border border-white/20"
                />
                <div className="space-y-1">
                  <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> QR Code Attached
                  </p>
                  <button
                    type="button"
                    onClick={() => setBankForm({ ...bankForm, qrCodeUrl: '' })}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline"
                  >
                    Remove QR Code
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="qrCodeFileInput"
                  accept="image/*"
                  onChange={handleQrUpload}
                  disabled={uploadingQr}
                  className="hidden"
                />
                <label
                  htmlFor="qrCodeFileInput"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs text-slate-200 cursor-pointer flex items-center gap-2 transition-colors"
                >
                  {uploadingQr ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B99A68]" />
                      <span>Uploading to Google Drive...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-[#B99A68]" />
                      <span>Upload Raast / Bank QR Image</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveBank"
              checked={bankForm.isActive}
              onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
              className="rounded bg-slate-900 border-white/10 text-[#B99A68] focus:ring-[#B99A68]"
            />
            <label htmlFor="isActiveBank" className="text-xs text-slate-300 cursor-pointer">
              Account is Active and visible to customers during checkout
            </label>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setBankModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" className="font-bold">
              {editingBank ? 'Save Changes' : 'Create Bank Account'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW RECEIPT SCREENSHOT */}
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt ? `Receipt: #${selectedReceipt.transactionReference}` : 'Receipt View'}
        subtitle={`Order #${selectedReceipt?.orderNumber} • ${selectedReceipt?.customerName}`}
        maxWidth="lg"
      >
        {selectedReceipt && (
          <div className="space-y-4 text-xs text-white">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center relative">
              <img
                src={selectedReceipt.receiptImageUrl}
                alt="Payment Receipt"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-white/5 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Amount Paid</span>
                <span className="font-mono font-bold text-emerald-400 block text-sm">
                  ₨{selectedReceipt.amount?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Bank Account</span>
                <span className="font-bold text-white block">
                  {selectedReceipt.bankName || 'Direct Transfer'}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="ghost" onClick={() => setSelectedReceipt(null)}>
                Close
              </Button>
              <a
                href={selectedReceipt.receiptImageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1.5"
              >
                <span>Open Original Image</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: APPROVE / REJECT SUBMISSION */}
      <Modal
        isOpen={Boolean(reviewActionModal)}
        onClose={() => setReviewActionModal(null)}
        title={
          reviewActionModal?.action === 'approve'
            ? 'Verify & Credit Customer Payment'
            : 'Reject Payment Submission'
        }
        subtitle={`Order #${reviewActionModal?.submission?.orderNumber} • ${reviewActionModal?.submission?.customerName}`}
        maxWidth="md"
      >
        {reviewActionModal && (
          <div className="space-y-4 text-xs text-white">
            {reviewActionModal.action === 'approve' ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                  Approving this submission will officially credit the customer's order, recalculate the outstanding remaining balance, record an immutable entry in the customer ledger, and notify the patron.
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Verified Amount (₨)
                  </label>
                  <input
                    type="number"
                    value={verifiedAmountInput}
                    onChange={(e) => setVerifiedAmountInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Default is customer submitted amount. Adjust if net received differed.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Internal Verification Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewNotesInput}
                    onChange={(e) => setReviewNotesInput(e.target.value)}
                    placeholder="e.g. Verified with Meezan Bank statement ref #8192"
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#B99A68]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  Rejecting this submission will preserve the record for audit, flag the receipt as rejected, and display the reason to the customer so they can re-submit a valid proof of transfer.
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    placeholder="e.g. Funds not received in account / Transaction reference invalid / Amount on screenshot does not match order amount."
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReviewActionModal(null)}>
                Cancel
              </Button>
              <Button
                variant={reviewActionModal.action === 'approve' ? 'gold' : 'danger'}
                loading={submittingReview}
                onClick={handleExecuteReview}
                className="font-bold"
              >
                {reviewActionModal.action === 'approve' ? 'Confirm & Credit Payment' : 'Reject Submission'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

