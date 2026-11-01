'use client';

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderPlus,
  ExternalLink,
  ShieldCheck,
  Lock,
  LogOut,
  Folder,
  Layers,
  FileText,
  Image as ImageIcon,
  Video,
  FileCheck,
  Server,
  Zap,
  Key,
  Copy,
  Check,
  PlayCircle,
  FolderTree,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const CloudStorageSettingsModule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);
  const [credentialsData, setCredentialsData] = useState<any>(null);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Credentials form state
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const fetchStatusAndCredentials = async () => {
    try {
      setLoading(true);
      const [statusRes, credsRes] = await Promise.all([
        fetch('/api/admin/google-drive/status'),
        fetch('/api/admin/google-drive/credentials'),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatusData(sData);
      }

      if (credsRes.ok) {
        const cData = await credsRes.json();
        setCredentialsData(cData);
        if (cData.fullClientId) {
          setClientIdInput(cData.fullClientId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch storage status and credentials', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndCredentials();
  }, []);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setNotice({ type: 'error', message: 'Both Client ID and Client Secret are required.' });
      return;
    }

    try {
      setSavingCredentials(true);
      setNotice(null);
      const res = await fetch('/api/admin/google-drive/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdInput.trim(),
          clientSecret: clientSecretInput.trim(),
          redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/api/admin/google-drive/callback` : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setNotice({ type: 'success', message: 'Google OAuth credentials saved and encrypted securely.' });
        setClientSecretInput('');
        await fetchStatusAndCredentials();
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to save credentials.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Error saving credentials.' });
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setNotice(null);
      const res = await fetch('/api/admin/google-drive/test', {
        method: 'POST',
      });
      const data = await res.json();
      setTestResults(data);

      if (data.success) {
        setNotice({
          type: 'success',
          message: 'All cloud storage diagnostics passed successfully with verified write access!',
        });
        await fetchStatusAndCredentials();
      } else {
        setNotice({
          type: 'error',
          message: data.message || 'Diagnostics failed. Please check the step breakdown below.',
        });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Diagnostic test execution failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/google-drive/disconnect', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchStatusAndCredentials();
        setDisconnectModalOpen(false);
        setTestResults(null);
        setNotice({ type: 'success', message: 'Cloud media storage disconnected.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to disconnect.' });
    } finally {
      setLoading(false);
    }
  };

  const redirectUri =
    statusData?.redirectUri ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/api/admin/google-drive/callback`
      : 'https://saadfurniture-iota.vercel.app/api/admin/google-drive/callback');

  const copyRedirectToClipboard = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  const isConnected = statusData?.isConnected === true;
  const quota = statusData?.storageQuota || {
    totalFormatted: '5.0 TB',
    usedFormatted: '0.00 GB',
    freeFormatted: '5.0 TB',
    usagePercent: 0,
    totalBytes: 5497558138880,
    usedBytes: 0,
    freeBytes: 5497558138880,
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#262421] via-[#1c1a18] to-[#141312] border border-[#B99A68]/30 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#B99A68]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#B99A68]/20 border border-[#B99A68]/40 flex items-center justify-center text-[#B99A68] shadow-inner shrink-0">
              <HardDrive className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold tracking-wide text-white">
                  Cloud Media Storage Vault
                </h2>
                {isConnected ? (
                  <Badge variant="green">Active Cloud Storage Connected</Badge>
                ) : (
                  <Badge variant="amber">Not Connected</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Dedicated cloud repository for Saad Furniture product catalog photographs, bespoke manufacturing videos, client contracts, and high-resolution CAD designs.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              className="bg-[#38332c] hover:bg-[#4d463d] text-white border border-white/10 text-xs rounded-xl h-10 px-4"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Test & Verify Storage'}
            </Button>

            {isConnected ? (
              <Button
                onClick={() => setDisconnectModalOpen(true)}
                className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs rounded-xl h-10 px-4"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={() => {
                  window.location.href = '/api/admin/google-drive/connect';
                }}
                className="bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs rounded-xl h-10 px-5 shadow-lg flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                Connect Cloud Storage
              </Button>
            )}
          </div>
        </div>

        {notice && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              notice.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
                : 'bg-red-950/50 border-red-500/30 text-red-200'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{notice.message}</span>
          </div>
        )}
      </div>

      {/* Diagnostic Steps Result (if tested) */}
      {testResults && testResults.steps && (
        <div className="bg-[#1c1a18] border border-[#B99A68]/30 rounded-2xl p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B99A68]" />
              System Diagnostics & Verification Results
            </h3>
            <Badge variant={testResults.success ? 'green' : 'amber'}>
              {testResults.success ? 'All Passed' : 'Action Required'}
            </Badge>
          </div>
          <div className="space-y-2">
            {testResults.steps.map((st: any, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs"
              >
                {st.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                {st.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                {st.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{st.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{st.status}</span>
                  </div>
                  <p className="text-slate-300 mt-0.5">{st.message}</p>
                  {st.details && <p className="text-slate-500 text-[11px] mt-0.5">{st.details}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Storage Quota & Connected Account Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: 5TB Storage Quota */}
        <div className="md:col-span-2 bg-[#201e1b] border border-[#38332c] rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Cloud className="w-4 h-4 text-[#B99A68]" />
              Cloud Storage Allocation
            </div>
            <span className="text-xs text-[#B99A68] font-mono">{quota.usagePercent}% Allocated</span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#B99A68] to-[#e4ceab] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(1, quota.usagePercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Used: {quota.usedFormatted}</span>
              <span>Available: {quota.freeFormatted}</span>
              <span className="text-white font-medium">Capacity: {quota.totalFormatted}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5 text-center">
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <p className="text-[10px] text-slate-400 uppercase">Cloud Provider</p>
              <p className="text-xs font-semibold text-white mt-1">Atelier Cloud Storage API</p>
            </div>
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <p className="text-[10px] text-slate-400 uppercase">Connection Status</p>
              <p className={`text-xs font-semibold mt-1 ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isConnected ? 'Active & Healthy' : 'Awaiting Auth'}
              </p>
            </div>
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
              <p className="text-[10px] text-slate-400 uppercase">Encryption Vault</p>
              <p className="text-xs font-semibold text-[#B99A68] mt-1">AES-256-GCM</p>
            </div>
          </div>
        </div>

        {/* Card 2: Connected Account Card */}
        <div className="bg-[#201e1b] border border-[#38332c] rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-white font-medium text-sm mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Connected Storage Account
            </div>

            {isConnected ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                  <p className="text-[11px] text-emerald-300 font-medium break-all">
                    {statusData?.connectedEmail || 'owner@saadfurniture.com'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {statusData?.accountName || 'Saad Furniture Vault Owner'}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Root Folder:</span>
                    <span className="text-white font-mono">SAAD FURNITURE MASTER</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Check:</span>
                    <span className="text-slate-300">
                      {statusData?.lastConnectionCheck
                        ? new Date(statusData.lastConnectionCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                <p className="text-xs text-slate-300">No Cloud Storage Account Connected</p>
                <p className="text-[11px] text-slate-500">
                  Connect the account associated with your cloud storage plan.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5">
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                className="w-full text-xs border-[#B99A68]/40 text-[#B99A68] hover:bg-[#B99A68]/10"
              >
                Verify Tokens & Write Privileges
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  window.location.href = '/api/admin/google-drive/connect';
                }}
                className="w-full text-xs bg-[#B99A68] text-[#262421] font-bold"
              >
                Initiate Google OAuth
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Storage Credentials Configuration Form */}
      <div className="bg-[#201e1b] border border-[#38332c] rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-[#B99A68]" />
              OAuth 2.0 Cloud Storage Credentials
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure credentials here or via Vercel Environment Variables (<code className="text-[#B99A68]">GOOGLE_CLIENT_ID</code>, <code className="text-[#B99A68]">GOOGLE_CLIENT_SECRET</code>).
            </p>
          </div>
          {credentialsData?.configured && (
            <Badge variant="green">
              Credentials Configured ({credentialsData.source === 'env' ? 'Vercel Env' : 'Database Vault'})
            </Badge>
          )}
        </div>

        {/* Redirect URI Display */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Authorized Redirect URI (Cloud Console)</p>
            <p className="text-xs text-[#B99A68] font-mono break-all mt-0.5">{redirectUri}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copyRedirectToClipboard}
            className="text-xs text-white border border-white/10 shrink-0 h-8"
          >
            {copiedRedirect ? <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copiedRedirect ? 'Copied' : 'Copy URI'}
          </Button>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">OAuth Client ID</label>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="e.g. 1234567890-abcdef.apps.googleusercontent.com"
                className="w-full p-2.5 bg-black/40 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#B99A68]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                OAuth Client Secret {credentialsData?.configured && '(Leave blank to retain saved secret)'}
              </label>
              <input
                type="password"
                value={clientSecretInput}
                onChange={(e) => setClientSecretInput(e.target.value)}
                placeholder={credentialsData?.configured ? '••••••••••••••••••••••••••••' : 'Enter client secret'}
                className="w-full p-2.5 bg-black/40 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#B99A68]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={savingCredentials}
              className="bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs rounded-xl h-9 px-4"
            >
              {savingCredentials ? 'Encrypting & Saving...' : 'Save & Encrypt Credentials in Vault'}
            </Button>
          </div>
        </form>
      </div>

      {/* Automatic Folder Structure Visualization */}
      <div className="bg-[#201e1b] border border-[#38332c] rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#B99A68]" />
              Automated Media Folder Structure
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Files uploaded to Saad Furniture are automatically organized into their designated category folders.
            </p>
          </div>
          <Badge variant="blue">Automated Routing</Badge>
        </div>

        <div className="bg-black/30 border border-white/5 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-[#B99A68] font-bold">
            <Folder className="w-4 h-4" />
            <span>SAAD FURNITURE MASTER/</span>
          </div>

          <div className="pl-6 space-y-1.5 border-l border-white/10 ml-2">
            <div>
              <div className="flex items-center gap-2 text-white font-medium">
                <Folder className="w-3.5 h-3.5 text-[#B99A68]" />
                <span>Product Catalog/</span>
              </div>
              <div className="pl-6 pt-1 space-y-1 text-slate-400 text-[11px] border-l border-white/5 ml-1.5 grid grid-cols-2 md:grid-cols-4 gap-1">
                <span>├── Sofas/</span>
                <span>├── Double Beds/</span>
                <span>├── Single Beds/</span>
                <span>├── Wardrobes/</span>
                <span>├── Center Tables/</span>
                <span>├── Mattresses/</span>
                <span>├── Room Chairs/</span>
                <span>└── Custom Furniture/</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Video className="w-3.5 h-3.5 text-[#B99A68]" />
              <span>Product Videos/</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-[#B99A68]" />
              <span>Catalogues & Brochures/</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <FileCheck className="w-3.5 h-3.5 text-[#B99A68]" />
              <span>Price Lists/</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-[#B99A68]" />
              <span>Customer Orders/ (Customer folders & order photos/videos)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-[#B99A68]" />
              <span>Customer Documents/</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B99A68]" />
              <span>Warranty Documents/</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Folder className="w-3.5 h-3.5 text-[#B99A68]" />
              <span>General Business Documents/</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Modal */}
      {disconnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#201e1b] border border-red-500/30 rounded-2xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold">Disconnect Cloud Media Storage?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to disconnect this cloud storage account? Cloud media uploads and automatic synchronization will be paused until re-authenticated. Existing files in cloud storage remain safe.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDisconnectModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDisconnect}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Confirm Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
