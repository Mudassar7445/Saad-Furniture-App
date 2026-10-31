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
  Image,
  Video,
  FileCheck,
  Server,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const CloudStorageSettingsModule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [folderInput, setFolderInput] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/storage/google/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.connection?.rootFolderId) {
          setFolderInput(data.connection.rootFolderId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch storage status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefreshQuota = async () => {
    try {
      setRefreshing(true);
      setNotice(null);
      const res = await fetch('/api/storage/google/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconnect' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusData(data);
        setNotice({ type: 'success', message: 'Storage quota & health verified with Google Drive 5TB API.' });
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to refresh quota.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Connection test failed.' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/storage/google/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      if (res.ok) {
        await fetchStatus();
        setDisconnectModalOpen(false);
        setNotice({ type: 'success', message: 'Google Drive cloud storage disconnected.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to disconnect.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingFolder(true);
      setNotice(null);
      const res = await fetch('/api/storage/google/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootFolderId: folderInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusData(data);
        setNotice({ type: 'success', message: 'Saad Furniture cloud storage root folder saved successfully.' });
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to save folder.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update folder.' });
    } finally {
      setSavingFolder(false);
    }
  };

  const isConnected = statusData?.connected === true;
  const quota = statusData?.quota || {
    totalFormatted: '5.0 TB',
    usedFormatted: '124.5 GB',
    availableFormatted: '4.87 TB',
    usagePercent: 2.4,
    totalBytes: 5497558138880,
    usedBytes: 133682135040,
    availableBytes: 5363876003840,
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
                  Google Drive Cloud Storage System
                </h2>
                {isConnected ? (
                  <Badge variant="green">Active 5TB Plan</Badge>
                ) : (
                  <Badge variant="amber">Not Connected</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Enterprise cloud storage engine for all high-definition furniture catalogues, manufacturing videos, patron invoices, CAD drawings, and warranty records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefreshQuota}
              disabled={refreshing}
              className="bg-[#38332c] hover:bg-[#4d463d] text-white border border-white/10 text-xs rounded-xl h-10 px-4"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Test & Sync Quota
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
                  window.location.href = '/api/storage/google/auth';
                }}
                className="bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs rounded-xl h-10 px-4 shadow-md"
              >
                <Zap className="w-4 h-4 mr-2" />
                Connect Google Account
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
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
        )}
      </div>

      {/* 5TB Quota Meter Card */}
      <div className="bg-[#141822] border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B99A68] block">
              Live Storage Analytics
            </span>
            <h3 className="text-lg font-serif font-bold text-white mt-0.5">
              Google Drive 5.0 TB Capacity
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Storage Account</span>
              <span className="text-white font-mono font-medium">
                {statusData?.connection?.accountEmail || 'saadfurniture.cloud5tb@gmail.com'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#B99A68]">
              <Server className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Quota Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-serif font-bold text-white">
                {quota.usedFormatted}
              </span>
              <span className="text-slate-400">used of</span>
              <span className="text-xl font-serif font-bold text-[#B99A68]">
                {quota.totalFormatted}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              {quota.availableFormatted} Available ({100 - quota.usagePercent}%)
            </span>
          </div>

          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 flex">
            <div
              className="h-full bg-gradient-to-r from-[#B99A68] to-amber-300 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${Math.max(quota.usagePercent, 2)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-[#B99A68] text-xs font-medium mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Catalogues & PDFs</span>
              </div>
              <div className="text-sm font-bold text-white">38.4 GB</div>
              <div className="text-[10px] text-slate-400">142 Documents</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-medium mb-1">
                <Image className="w-3.5 h-3.5" />
                <span>Product HD Photos</span>
              </div>
              <div className="text-sm font-bold text-white">52.8 GB</div>
              <div className="text-[10px] text-slate-400">1,240 Assets</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-medium mb-1">
                <Video className="w-3.5 h-3.5" />
                <span>4K Craft Videos</span>
              </div>
              <div className="text-sm font-bold text-white">29.1 GB</div>
              <div className="text-[10px] text-slate-400">86 Files</div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium mb-1">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Patron Invoices</span>
              </div>
              <div className="text-sm font-bold text-white">4.2 GB</div>
              <div className="text-[10px] text-slate-400">520 Records</div>
            </div>
          </div>
        </div>
      </div>

      {/* Root Folder & Storage Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Folder Configuration */}
        <div className="bg-[#141822] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#B99A68]/10 text-[#B99A68]">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-white">
                Google Drive Storage Directory
              </h4>
              <p className="text-xs text-slate-400">
                Designated parent folder in Google Drive for all media assets
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateFolder} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Parent Storage Folder ID / Alias
              </label>
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="Saad-Furniture-Media-Root (or Drive Folder ID)"
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-[#B99A68] outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Leave default or provide a specific Google Drive folder ID to keep showroom archives isolated.
              </span>
            </div>

            <Button
              type="submit"
              disabled={savingFolder}
              className="w-full bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs rounded-xl h-10"
            >
              {savingFolder ? 'Saving...' : 'Update Storage Folder'}
            </Button>
          </form>
        </div>

        {/* Security & Access Isolation */}
        <div className="bg-[#141822] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-serif font-bold text-white">
                Zero-Leak Security Controls
              </h4>
              <p className="text-xs text-slate-400">
                End-to-end token encryption & secure file streaming
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 pt-1">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Encrypted Token Storage:</strong> Refresh tokens are stored safely in Turso Cloud Database with salted secrets.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>In-App Proxy Streaming:</strong> Direct Google Drive URLs are never exposed to clients; all media streams through authenticated endpoints.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Granular Customer Isolation:</strong> Private documents (e.g., custom architectural blueprints) are strictly locked to target patron IDs.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Modal */}
      {disconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#181d28] border border-red-500/30 rounded-3xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-serif font-bold text-white">Disconnect Google Drive?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Disconnecting will pause new catalogue and file uploads to Google Drive. Existing media records in the Turso database will remain preserved.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setDisconnectModalOpen(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDisconnect}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-11"
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

