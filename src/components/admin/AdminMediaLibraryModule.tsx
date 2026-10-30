'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  UploadCloud,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Trash2,
  Share2,
  Download,
  Lock,
  Globe,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  FileCode,
  HardDrive,
  RefreshCw,
  MoreVertical,
  Bell,
  ArrowUpDown,
  Tag,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InAppDocumentViewer, DocumentItem } from '@/components/media/InAppDocumentViewer';

const SYSTEM_CATEGORIES = [
  { id: 'all', label: 'All Files', icon: HardDrive },
  { id: 'catalogues', label: 'Furniture Catalogues', icon: FileText },
  { id: 'photos', label: 'Product Photographs', icon: ImageIcon },
  { id: 'videos', label: 'Product Videos', icon: Video },
  { id: 'pdfs', label: 'PDF Documents', icon: FileText },
  { id: 'pricelists', label: 'Price Lists', icon: FileSpreadsheet },
  { id: 'brochures', label: 'Brochures', icon: FileText },
  { id: 'warranty', label: 'Warranty Documents', icon: Lock },
  { id: 'customer_docs', label: 'Customer Documents', icon: Users },
  { id: 'general', label: 'General Files', icon: Folder },
];

export const AdminMediaLibraryModule: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Data states
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<DocumentItem | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<any | null>(null);

  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState('catalogues');
  const [uploadFolderId, setUploadFolderId] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState('public');
  const [uploadCustomerId, setUploadCustomerId] = useState('');
  const [uploadProductId, setUploadProductId] = useState('');
  const [uploadOrderId, setUploadOrderId] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [notifyCustomers, setNotifyCustomers] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');

  // New folder state
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState('catalogues');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [filesRes, foldersRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/library/files'),
        fetch('/api/library/folders'),
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);

      if (filesRes.ok) {
        const data = await filesRes.json();
        setFiles(data.files || []);
      }
      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders || []);
      }
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data.customers || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load media library data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered files
  const filteredFiles = files.filter((file) => {
    // Category match
    if (activeCategory !== 'all' && file.category !== activeCategory) {
      return false;
    }
    // Folder match
    if (selectedFolderId && file.folderId !== selectedFolderId) {
      return false;
    }
    // Visibility filter
    if (visibilityFilter !== 'all' && file.visibility !== visibilityFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = file.name?.toLowerCase().includes(q);
      const matchDesc = file.description?.toLowerCase().includes(q);
      const matchCat = file.category?.toLowerCase().includes(q);
      return matchName || matchDesc || matchCat;
    }
    return true;
  });

  // Handle Multi-file Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      alert('Please select at least one file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);
      setUploadStatusText(`Preparing ${uploadFiles.length} file(s) for Google Drive 5TB storage...`);

      for (let i = 0; i < uploadFiles.length; i++) {
        const currentFile = uploadFiles[i];
        setUploadStatusText(`Uploading ${i + 1}/${uploadFiles.length}: "${currentFile.name}"...`);
        setUploadProgress(Math.round(((i + 0.3) / uploadFiles.length) * 100));

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('category', uploadCategory);
        if (uploadFolderId) formData.append('folderId', uploadFolderId);
        formData.append('visibility', uploadVisibility);
        if (uploadCustomerId) formData.append('customerId', uploadCustomerId);
        if (uploadProductId) formData.append('productId', uploadProductId);
        if (uploadOrderId) formData.append('orderId', uploadOrderId);
        if (uploadDescription) formData.append('description', uploadDescription);
        formData.append('notifyCustomers', notifyCustomers ? 'true' : 'false');

        const res = await fetch('/api/library/files', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Upload failed for ${currentFile.name}`);
        }

        setUploadProgress(Math.round(((i + 1) / uploadFiles.length) * 100));
      }

      setUploadStatusText('Complete! File records saved and indexed in Turso Cloud.');
      showToast(`Successfully uploaded ${uploadFiles.length} file(s) to Google Drive!`);
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadDescription('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatusText('');
    }
  };

  // Handle Create Custom Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setCreatingFolder(true);
      const res = await fetch('/api/library/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          category: newFolderCategory,
        }),
      });

      if (res.ok) {
        showToast(`Folder "${newFolderName}" created successfully.`);
        setNewFolderName('');
        setShowCreateFolderModal(false);
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create folder');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Handle Toggle Publish
  const handleTogglePublish = async (file: any) => {
    try {
      const newStatus = file.isPublished ? 0 : 1;
      const res = await fetch('/api/library/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: file.id,
          isPublished: newStatus,
        }),
      });

      if (res.ok) {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, isPublished: newStatus } : f))
        );
        showToast(
          newStatus ? `"${file.name}" is now published to customers.` : `"${file.name}" unpublished.`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete File
  const handleDeleteFile = async () => {
    if (!confirmDeleteFile) return;
    try {
      const res = await fetch(`/api/library/files?id=${confirmDeleteFile.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== confirmDeleteFile.id));
        showToast(`"${confirmDeleteFile.name}" deleted from library & Google Drive.`);
        setConfirmDeleteFile(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete file');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const getFileIcon = (mime?: string, name?: string) => {
    if (mime?.includes('pdf') || name?.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-400" />;
    }
    if (mime?.startsWith('image/') || /\.(jpg|png|webp)$/i.test(name || '')) {
      return <ImageIcon className="w-5 h-5 text-sky-400" />;
    }
    if (mime?.startsWith('video/') || /\.(mp4|mov)$/i.test(name || '')) {
      return <Video className="w-5 h-5 text-purple-400" />;
    }
    if (mime?.includes('sheet') || /\.(xlsx|xls)$/i.test(name || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    }
    return <FileText className="w-5 h-5 text-[#B99A68]" />;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#262421] border border-[#B99A68] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#B99A68]" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-[#141822] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-white tracking-wide">
              Central Media & Documents Library
            </h2>
            <Badge variant="gold">Google Drive 5TB Synced</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise repository for showroom catalogues, 4K production videos, wholesale price sheets, and patron documents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => setShowCreateFolderModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white border border-white/10 text-xs rounded-xl h-10 px-3.5"
          >
            <FolderPlus className="w-4 h-4 mr-2 text-[#B99A68]" />
            New Folder
          </Button>

          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs rounded-xl h-10 px-4 shadow-md"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload Files
          </Button>

          <Button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Refresh Library"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Category Pills Bar (9 Main Categories) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SYSTEM_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count =
            cat.id === 'all'
              ? files.length
              : files.filter((f) => f.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? 'bg-[#B99A68] text-[#262421] border-[#B99A68] font-bold shadow-md'
                  : 'bg-[#141822] text-slate-300 border-white/5 hover:border-white/20'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-[#262421]/20 text-[#262421]' : 'bg-white/10 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Subfolders Bar */}
      {folders.length > 0 && (
        <div className="bg-[#141822] border border-white/5 rounded-2xl p-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
            Folders:
          </span>
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
              selectedFolderId === null
                ? 'bg-[#B99A68]/20 text-[#B99A68] font-bold border border-[#B99A68]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Folders
          </button>
          {folders
            .filter((folder) => activeCategory === 'all' || folder.category === activeCategory)
            .map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors border ${
                  selectedFolderId === f.id
                    ? 'bg-[#B99A68]/20 text-[#B99A68] font-bold border-[#B99A68]/30'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-[#B99A68]" />
                <span>{f.name}</span>
                <span className="text-[10px] text-slate-400">({f.fileCount || 0})</span>
              </button>
            ))}
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-[#141822] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name, keyword, or category..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#B99A68] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Visibility selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public to Customers</option>
              <option value="selected">Selected Customers</option>
              <option value="specific">Specific Customer</option>
              <option value="private">Private (Admin Only)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[#B99A68] text-[#262421]' : 'text-slate-400'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-[#B99A68] text-[#262421]' : 'text-slate-400'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display Section */}
      {filteredFiles.length === 0 ? (
        <div className="bg-[#141822] border border-white/5 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#B99A68] mx-auto">
            <Folder className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-white">No documents found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Upload your first furniture catalogue, HD photographs, or wholesale price lists to Google Drive 5TB storage.
            </p>
          </div>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold text-xs rounded-xl h-10 px-5 shadow-md"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload File Now
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group bg-[#141822] border border-white/10 rounded-2xl overflow-hidden hover:border-[#B99A68]/50 transition-all duration-300 shadow-lg flex flex-col justify-between"
            >
              {/* Preview header */}
              <div
                onClick={() => setViewerDoc(file)}
                className="h-36 bg-gradient-to-br from-slate-900 to-black relative flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {file.thumbnailUrl || file.mimeType?.startsWith('image/') ? (
                  <img
                    src={`/api/library/stream/${file.id}`}
                    alt={file.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getFileIcon(file.mimeType, file.name)}
                  </div>
                )}

                {/* Badges on top */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      file.visibility === 'public'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : file.visibility === 'private'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {file.visibility}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      file.isPublished
                        ? 'bg-emerald-500 text-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {file.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Hover overlay with eye */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="px-3 py-1.5 bg-[#B99A68] text-[#262421] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View in App</span>
                  </div>
                </div>
              </div>

              {/* Info body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4
                    onClick={() => setViewerDoc(file)}
                    className="text-xs font-bold text-white tracking-wide truncate cursor-pointer hover:text-[#B99A68] transition-colors"
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  {/* Publish Toggle Button */}
                  <button
                    onClick={() => handleTogglePublish(file)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      file.isPublished
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/20 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/20'
                        : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-emerald-950/40 hover:text-emerald-300'
                    }`}
                  >
                    {file.isPublished ? 'Unpublish' : 'Publish'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewerDoc(file)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Quick Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`/api/library/stream/${file.id}`}
                      download={file.name}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#B99A68] hover:bg-white/10"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => setConfirmDeleteFile(file)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                      title="Delete File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-white/5 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3.5">Document Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Size</th>
                <th className="p-3.5">Visibility</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3.5">
                    <div
                      onClick={() => setViewerDoc(file)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                        {getFileIcon(file.mimeType, file.name)}
                      </div>
                      <span className="font-medium text-white group-hover:text-[#B99A68] transition-colors truncate max-w-xs">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-300 capitalize">{file.category}</td>
                  <td className="p-3.5 text-slate-400 font-mono">{formatFileSize(file.fileSize)}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        file.visibility === 'public'
                          ? 'bg-emerald-950/60 text-emerald-300'
                          : 'bg-amber-950/60 text-amber-300'
                      }`}
                    >
                      {file.visibility}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <button
                      onClick={() => handleTogglePublish(file)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        file.isPublished
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {file.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewerDoc(file)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={`/api/library/stream/${file.id}`}
                        download={file.name}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-[#B99A68] hover:bg-white/10"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setConfirmDeleteFile(file)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-rose-950/40"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MULTI-FILE UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#181d28] border border-[#B99A68]/30 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#B99A68]/20 text-[#B99A68] flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white">
                    Upload Documents & Media to Google Drive 5TB
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Resumable high-bandwidth binary storage with Turso indexing
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Dropzone */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Files (PDF, Images, 4K Videos, Word, Excel, PPT)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full p-3 bg-slate-900 border border-dashed border-slate-700 rounded-2xl text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#B99A68] file:text-[#262421] cursor-pointer"
                />
                {uploadFiles.length > 0 && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{uploadFiles.length} file(s) selected for upload</span>
                  </div>
                )}
              </div>

              {/* Category & Folder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    System Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    {SYSTEM_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Custom Folder (Optional)
                  </label>
                  <select
                    value={uploadFolderId}
                    onChange={(e) => setUploadFolderId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="">Root / Category Default</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visibility Setting */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Access Visibility Control
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'public', label: 'Public to Customers', desc: 'Appears in Mobile App' },
                    { id: 'specific', label: 'Target Customer', desc: 'Direct Patron Lock' },
                    { id: 'private', label: 'Admin Confidential', desc: 'Only Super Admin' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setUploadVisibility(v.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        uploadVisibility === v.id
                          ? 'bg-[#B99A68]/20 border-[#B99A68] text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{v.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Customer (if specific) */}
              {uploadVisibility === 'specific' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Assign to Specific Customer
                  </label>
                  <select
                    value={uploadCustomerId}
                    onChange={(e) => setUploadCustomerId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="">Select Patron Account...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email || c.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product Association */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Link to Showroom Product (Optional)
                  </label>
                  <select
                    value={uploadProductId}
                    onChange={(e) => setUploadProductId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="">None / Standalone</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Link to Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadOrderId}
                    onChange={(e) => setUploadOrderId(e.target.value)}
                    placeholder="e.g. ord_abc123"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Description / Specification Notes
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. 2026 Spring Solid Teak & Chinioti Master Collection Catalog"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              {/* Notification Toggle */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  id="notifyToggle"
                  checked={notifyCustomers}
                  onChange={(e) => setNotifyCustomers(e.target.checked)}
                  className="w-4 h-4 accent-[#B99A68] rounded cursor-pointer"
                />
                <label htmlFor="notifyToggle" className="text-xs text-slate-300 cursor-pointer">
                  Send push notification alert to target customers about this new document
                </label>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2 p-3 bg-slate-900 rounded-xl border border-[#B99A68]/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#B99A68] font-medium">{uploadStatusText}</span>
                    <span className="font-mono text-white">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#B99A68] to-amber-300 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || uploadFiles.length === 0}
                  className="flex-1 bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold rounded-xl text-xs h-11 shadow-md"
                >
                  {isUploading ? 'Uploading to 5TB...' : `Upload ${uploadFiles.length} File(s)`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM FOLDER MODAL */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#181d28] border border-white/10 rounded-3xl max-w-md w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#B99A68]/20 text-[#B99A68]">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">Create Custom Folder</h3>
                <p className="text-xs text-slate-400">Organize documents under a specific category</p>
              </div>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Royal Maharaja Bed Series 2026"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-[#B99A68]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={newFolderCategory}
                  onChange={(e) => setNewFolderCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none"
                >
                  {SYSTEM_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="flex-1 bg-[#B99A68] hover:bg-[#a68856] text-[#262421] font-bold rounded-xl text-xs h-10 shadow-md"
                >
                  {creatingFolder ? 'Creating...' : 'Create Folder'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#181d28] border border-rose-500/30 rounded-3xl max-w-sm w-full p-6 text-white space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-serif font-bold text-white">Delete Document?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Permanently delete <strong>"{confirmDeleteFile.name}"</strong> from both Google Drive 5TB storage and the system catalog.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setConfirmDeleteFile(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteFile}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs h-10"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* INTEGRATED IN-APP DOCUMENT VIEWER */}
      <InAppDocumentViewer
        document={viewerDoc}
        isOpen={!!viewerDoc}
        onClose={() => setViewerDoc(null)}
      />
    </div>
  );
};
