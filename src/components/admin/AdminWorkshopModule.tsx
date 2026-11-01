'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Play,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  RefreshCw,
  Sparkles,
  Search,
  Filter,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Star,
  Check,
  X,
  Repeat,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { WORKSHOP_CATEGORIES } from '@/components/mobile/MobileWorkshopScreen';
import { captureVideoThumbnail, getSafeThumbnailUrl } from '@/lib/media/videoThumbnail';

export const AdminWorkshopModule: React.FC = () => {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Dedicated Replace Media Modal
  const [replacingItem, setReplacingItem] = useState<any | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replaceProgress, setReplaceProgress] = useState('');
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Dedicated Delete Confirmation Modal
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State for Create / Edit
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('video');
  const [category, setCategory] = useState('furniture_manufacturing');
  const [customCategory, setCustomCategory] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isPublished, setIsPublished] = useState(true);
  const [googleDriveFileId, setGoogleDriveFileId] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workshop?all=true');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
      }
    } catch (e) {
      console.error('Failed to load workshop media:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setMediaType('video');
    setCategory('furniture_manufacturing');
    setCustomCategory('');
    setThumbnailFile(null);
    setUrl('');
    setThumbnailUrl('');
    setVideoDuration('60');
    setIsFeatured(false);
    setDisplayOrder('0');
    setIsPublished(true);
    setGoogleDriveFileId('');
    setErrorMsg(null);
    setShowUploadModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setMediaType(item.mediaType || 'photo');
    setCategory(item.category || 'furniture_manufacturing');
    setCustomCategory('');
    setThumbnailFile(null);
    setUrl(item.url || '');
    setThumbnailUrl(item.thumbnailUrl || '');
    setVideoDuration(item.videoDuration ? String(item.videoDuration) : '');
    setIsFeatured(Boolean(item.isFeatured));
    setDisplayOrder(String(item.displayOrder || 0));
    setIsPublished(Boolean(item.isPublished));
    setGoogleDriveFileId(item.googleDriveFileId || '');
    setErrorMsg(null);
    setShowUploadModal(true);
  };

  // Upload or Batch Upload during Create
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    try {
      setUploading(true);
      setErrorMsg(null);

      const targetCategory =
        category === 'custom' && customCategory.trim()
          ? customCategory.trim().toLowerCase().replace(/\s+/g, '_')
          : category;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1}/${files.length}: "${file.name}" to Google Drive...`);

        const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4');
        const detectedType = isVideo ? 'video' : 'photo';
        setMediaType(detectedType);

        let uploadTitle = title.trim();
        if (!uploadTitle || uploadTitle.toLowerCase().includes('whatsapp')) {
          uploadTitle =
            files.length > 1
              ? `${targetCategory.replace(/_/g, ' ')} Showcase ${i + 1}`
              : 'Bespoke Atelier Production Milestone';
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', targetCategory);
        formData.append('title', uploadTitle);
        formData.append('description', description);
        formData.append('mediaType', detectedType);
        formData.append('isFeatured', isFeatured ? '1' : '0');
        formData.append('displayOrder', displayOrder);
        if (videoDuration) formData.append('videoDuration', videoDuration);

        if (thumbnailFile) {
          formData.append('thumbnail', thumbnailFile);
        } else if (isVideo) {
          try {
            setUploadProgress(`Capturing instant WebP video thumbnail for "${file.name}"...`);
            const autoThumb = await captureVideoThumbnail(file);
            if (autoThumb) formData.append('thumbnail', autoThumb);
          } catch {}
        }

        const res = await fetch('/api/workshop/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload media file to Google Drive');
        }

        const media = data.media;
        setEditingItem(media);
        setUrl(media.url || media.streamUrl || `/api/workshop/videos/${media.id}/stream`);
        if (media.googleDriveFileId) setGoogleDriveFileId(media.googleDriveFileId);
        setTitle(media.title);
        if (media.thumbnailUrl) setThumbnailUrl(media.thumbnailUrl);
      }

      setUploadProgress('Successfully uploaded and synced with Google Drive!');
      await fetchMedia();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload error');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
      e.target.value = '';
    }
  };

  // Submit Edit or Create form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory =
      category === 'custom' && customCategory.trim()
        ? customCategory.trim().toLowerCase().replace(/\s+/g, '_')
        : category;

    if (!title.trim() || title.toLowerCase().includes('whatsapp')) {
      setErrorMsg('Please enter a descriptive customer-facing title.');
      return;
    }
    if (!url.trim()) {
      setErrorMsg('Media attachment or file upload is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        mediaType,
        category: finalCategory,
        url: url.trim(),
        thumbnailUrl: thumbnailUrl.trim() || (mediaType === 'photo' ? url.trim() : null),
        videoDuration: videoDuration ? Number(videoDuration) : null,
        isFeatured: isFeatured ? 1 : 0,
        displayOrder: Number(displayOrder) || 0,
        isPublished: isPublished ? 1 : 0,
        googleDriveFileId: googleDriveFileId || undefined,
      };

      const endpoint = editingItem ? `/api/workshop/${editingItem.id}` : '/api/workshop';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save workshop media');
      }

      setShowUploadModal(false);
      showToast('success', editingItem ? 'Workshop media updated!' : 'Published to workshop gallery!');
      await fetchMedia();
    } catch (err: any) {
      setErrorMsg(err.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Dedicated Replace Media Handler
  const openReplaceModal = (item: any) => {
    setReplacingItem(item);
    setReplaceFile(null);
    setReplaceProgress('');
  };

  const handleConfirmReplace = async () => {
    if (!replacingItem || !replaceFile) return;

    try {
      setReplacing(true);
      setReplaceProgress(`Uploading new replacement file to Google Drive...`);

      const isVideo = replaceFile.type.startsWith('video/') || replaceFile.name.endsWith('.mp4');
      const detectedType = isVideo ? 'video' : 'photo';

      const formData = new FormData();
      formData.append('file', replaceFile);
      formData.append('category', replacingItem.category);
      formData.append('title', replacingItem.title);
      formData.append('description', replacingItem.description || '');
      formData.append('mediaType', detectedType);

      // Auto-extract thumbnail if replacement is video
      if (isVideo) {
        try {
          setReplaceProgress('Capturing WebP thumbnail from replacement video...');
          const thumb = await captureVideoThumbnail(replaceFile);
          if (thumb) formData.append('thumbnail', thumb);
        } catch {}
      }

      // Upload new file
      const uploadRes = await fetch('/api/workshop/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Replacement file upload failed');
      }

      const newMedia = uploadData.media;

      // Update existing record with new media URL and Drive ID
      setReplaceProgress('Updating workshop showcase record...');
      const updateRes = await fetch(`/api/workshop/${replacingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newMedia.url || newMedia.streamUrl,
          thumbnailUrl: newMedia.thumbnailUrl || (detectedType === 'photo' ? newMedia.url : null),
          googleDriveFileId: newMedia.googleDriveFileId,
          mediaType: detectedType,
          videoDuration: detectedType === 'video' ? 60 : null,
        }),
      });

      if (!updateRes.ok) {
        throw new Error('Failed to update showcase record');
      }

      setReplacingItem(null);
      setReplaceFile(null);
      showToast('success', `Media for "${replacingItem.title}" replaced successfully!`);
      await fetchMedia();
    } catch (err: any) {
      showToast('error', err.message || 'Media replacement failed');
    } finally {
      setReplacing(false);
      setReplaceProgress('');
    }
  };

  // Dedicated Safe Delete Handlers
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/workshop/${deletingItem.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', `Workshop media "${deletingItem.title}" deleted.`);
        setDeletingItem(null);
        await fetchMedia();
      } else {
        const d = await res.json();
        showToast('error', d.error || 'Failed to delete');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error deleting media');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle Publish & Featured
  const handleTogglePublish = async (item: any) => {
    try {
      const res = await fetch(`/api/workshop/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: item.isPublished ? 0 : 1 }),
      });
      if (res.ok) {
        await fetchMedia();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFeatured = async (item: any) => {
    try {
      const res = await fetch(`/api/workshop/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: item.isFeatured ? 0 : 1 }),
      });
      if (res.ok) {
        await fetchMedia();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Operations
  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map((m) => m.id));
    }
  };

  const handleBulkPublish = async (publish: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      const res = await fetch('/api/workshop/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: publish ? 'publish' : 'unpublish',
          ids: selectedIds,
        }),
      });

      if (res.ok) {
        showToast(
          'success',
          `Successfully ${publish ? 'published' : 'unpublished'} ${selectedIds.length} items.`
        );
        setSelectedIds([]);
        await fetchMedia();
      }
    } catch (err) {
      showToast('error', 'Bulk status update failed.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    try {
      setBulkActionLoading(true);
      const res = await fetch('/api/workshop/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          ids: selectedIds,
        }),
      });

      if (res.ok) {
        showToast('success', `Deleted ${selectedIds.length} workshop media item(s).`);
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
        await fetchMedia();
      }
    } catch (err) {
      showToast('error', 'Bulk deletion failed.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Filtered List
  const filteredList = mediaList.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (typeFilter !== 'all' && item.mediaType !== typeFilter) return false;
    if (statusFilter !== 'all') {
      if (statusFilter === 'published' && !item.isPublished) return false;
      if (statusFilter === 'draft' && item.isPublished) return false;
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(term);
      const matchDesc = item.description?.toLowerCase().includes(term);
      const matchCat = item.category?.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalVideos = mediaList.filter((m) => m.mediaType === 'video').length;
  const totalPhotos = mediaList.filter((m) => m.mediaType === 'photo').length;
  const featuredItem = mediaList.find((m) => m.isFeatured);

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {feedbackToast && (
        <div
          className={`fixed top-4 right-4 left-4 z-50 p-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs border animate-in fade-in duration-300 max-w-md mx-auto ${
            feedbackToast.type === 'success'
              ? 'bg-[#262421] text-[#B99A68] border-[#B99A68]'
              : 'bg-rose-950 text-rose-200 border-rose-500/50'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#B99A68] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{feedbackToast.message}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-[#B99A68]" /> Workshop Media Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete management, replacement & safe deletion of workshop videos and photographs
          </p>
        </div>

        <Button variant="gold" size="sm" onClick={openCreateModal} className="font-bold">
          <Plus className="w-4 h-4 mr-1.5" /> Add Workshop Media
        </Button>
      </div>

      {/* 2. Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-black/40 border border-white/5 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Pieces</span>
          <span className="text-xl font-bold font-mono text-white mt-0.5 block">{mediaList.length}</span>
        </div>
        <div className="p-3.5 bg-black/40 border border-white/5 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Workshop Videos</span>
          <span className="text-xl font-bold font-mono text-[#B99A68] mt-0.5 block">{totalVideos}</span>
        </div>
        <div className="p-3.5 bg-black/40 border border-white/5 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">High-Res Photos</span>
          <span className="text-xl font-bold font-mono text-sky-400 mt-0.5 block">{totalPhotos}</span>
        </div>
        <div className="p-3.5 bg-black/40 border border-white/5 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Featured Showcase</span>
          <span className="text-xs font-bold text-amber-300 mt-1 block truncate">
            {featuredItem?.title || 'None Set'}
          </span>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, description or category..."
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
          >
            <option value="all">All Media Types</option>
            <option value="video">Videos Only</option>
            <option value="photo">Photos Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
          >
            {WORKSHOP_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft / Unpublished</option>
          </select>
        </div>
      </div>

      {/* 4. Bulk Action Toolbar (When items are selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-[#B99A68]/15 border border-[#B99A68]/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-white font-bold">
            <CheckSquare className="w-4 h-4 text-[#B99A68]" />
            <span>{selectedIds.length} item(s) selected</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[10px] text-[#B99A68] hover:underline font-normal ml-2"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={bulkActionLoading}
              onClick={() => handleBulkPublish(true)}
              className="h-7 text-[11px] px-2.5 font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              Bulk Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkActionLoading}
              onClick={() => handleBulkPublish(false)}
              className="h-7 text-[11px] px-2.5 font-bold border-slate-500/40 text-slate-300 hover:bg-slate-500/10"
            >
              Bulk Unpublish
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkActionLoading}
              onClick={() => setShowBulkDeleteModal(true)}
              className="h-7 text-[11px] px-2.5 font-bold border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Bulk Delete ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* 5. Select All Checkbox Row */}
      {filteredList.length > 0 && (
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedIds.length === filteredList.length && filteredList.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 accent-[#B99A68] rounded"
            />
            <span className="font-semibold text-white">Select All ({filteredList.length})</span>
          </label>

          <span className="font-mono text-[11px]">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredList.length)} of {filteredList.length}
          </span>
        </div>
      )}

      {/* 6. Workshop Media Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading workshop archives...</div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center bg-black/30 border border-dashed border-white/10 rounded-2xl space-y-3">
          <Film className="w-10 h-10 mx-auto text-[#B99A68]/50" />
          <h3 className="font-bold text-white text-sm">No Workshop Media Matches Current Filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload artisan videos, frame assembly footage, or furniture polishing photos directly to the media vault.
          </p>
          <Button variant="gold" size="sm" onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-1" /> Add First Workshop Media
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedList.map((item) => {
            const isVideo = item.mediaType === 'video';
            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-[#141822] border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all relative ${
                  isSelected
                    ? 'border-[#B99A68] ring-1 ring-[#B99A68]/50'
                    : 'border-white/10 hover:border-[#B99A68]/40'
                }`}
              >
                {/* Visual Header */}
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={getSafeThumbnailUrl(item)}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {isVideo && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div
                        onClick={() => setPreviewItem(item)}
                        className="w-10 h-10 rounded-full bg-[#B99A68] text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 cursor-pointer transition-transform"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Top-Left Selection Checkbox & Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectId(item.id)}
                      className="w-4 h-4 accent-[#B99A68] rounded shadow-md cursor-pointer"
                    />

                    {item.isFeatured ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#B99A68] text-slate-950 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                        <Star className="w-2.5 h-2.5 fill-current" /> Featured
                      </span>
                    ) : null}

                    <Badge variant={item.isPublished ? 'green' : 'neutral'}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  {/* Top-Right Category */}
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant="gold">
                      {WORKSHOP_CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                    </Badge>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-white text-sm line-clamp-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs gap-1">
                    {/* Status Toggles */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(item)}
                        className={`p-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                          item.isFeatured
                            ? 'bg-[#B99A68]/20 border-[#B99A68] text-[#B99A68]'
                            : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                        }`}
                        title="Toggle Featured Showcase"
                      >
                        <Star className={`w-3 h-3 ${item.isFeatured ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition-colors ${
                          item.isPublished
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900 border-white/10 text-slate-400'
                        }`}
                      >
                        {item.isPublished ? 'Live' : 'Draft'}
                      </button>
                    </div>

                    {/* Manage Buttons: Preview, Replace, Edit, Delete */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewItem(item)}
                        className="h-7 w-7 p-0"
                        title="Preview Media"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-300" />
                      </Button>

                      {/* Replace Media Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openReplaceModal(item)}
                        className="h-7 w-7 p-0 text-[#B99A68] hover:bg-[#B99A68]/15"
                        title="Replace Media File"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(item)}
                        className="h-7 w-7 p-0 text-slate-300"
                        title="Edit Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingItem(item)}
                        className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300"
                        title="Delete Media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-8 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>

          <span className="font-mono">
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 text-xs font-bold"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: REPLACE MEDIA DIALOG */}
      {/* ========================================== */}
      {replacingItem && (
        <Modal
          isOpen={Boolean(replacingItem)}
          onClose={() => {
            if (!replacing) setReplacingItem(null);
          }}
          title={`Replace Media: "${replacingItem.title}"`}
          subtitle="Upload a new video or photo to update this showcase without duplicate records"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-white">
            <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex items-center gap-3">
              <img
                src={getSafeThumbnailUrl(replacingItem)}
                alt={replacingItem.title}
                className="w-14 h-14 rounded-lg object-cover shrink-0 border border-white/10"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#B99A68] block">Current Media</span>
                <span className="font-bold text-white block truncate">{replacingItem.title}</span>
                <span className="text-[10px] text-slate-400 block capitalize">
                  {replacingItem.mediaType} • {replacingItem.category.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Select New Replacement File *
              </label>

              <input
                ref={replaceInputRef}
                type="file"
                accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setReplaceFile(f);
                }}
                className="hidden"
              />

              <div
                onClick={() => replaceInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-[#B99A68]/40 hover:border-[#B99A68] rounded-xl bg-black/30 hover:bg-black/50 text-center cursor-pointer transition-all space-y-1.5"
              >
                <UploadCloud className="w-6 h-6 mx-auto text-[#B99A68]" />
                <span className="font-bold text-white block">
                  {replaceFile ? replaceFile.name : 'Click to select new replacement file'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {replaceFile
                    ? `Size: ${(replaceFile.size / 1024 / 1024).toFixed(1)} MB`
                    : 'MP4, WebM video or JPG, PNG photograph'}
                </span>
              </div>
            </div>

            {replacing && (
              <div className="p-3 bg-slate-900 rounded-xl border border-[#B99A68]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#B99A68] font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{replaceProgress || 'Replacing media in Google Drive...'}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#B99A68] h-1.5 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                variant="ghost"
                disabled={replacing}
                onClick={() => setReplacingItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                disabled={replacing || !replaceFile}
                onClick={handleConfirmReplace}
                className="font-bold"
              >
                {replacing ? 'Uploading...' : 'Confirm Replacement'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================== */}
      {/* MODAL 2: SAFE DELETE CONFIRMATION */}
      {/* ========================================== */}
      {deletingItem && (
        <Modal
          isOpen={Boolean(deletingItem)}
          onClose={() => {
            if (!deleting) setDeletingItem(null);
          }}
          title="Delete Workshop Media"
          subtitle="Confirm permanent deletion from workshop showcase"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-white">
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-200 block text-xs">Permanent Deletion Warning</span>
                <span className="text-[11px] text-rose-300/80 block mt-0.5">
                  Are you sure you want to delete <strong className="text-white">"{deletingItem.title}"</strong>?
                  This will remove the media from the public Workshop gallery immediately.
                </span>
              </div>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-[11px] text-slate-300 space-y-1">
              <span className="font-semibold text-white block">Safe Google Drive Storage Guard:</span>
              <p>
                The system will automatically verify whether this file is referenced in another customer order or product catalogue before removing original Drive binaries.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                variant="ghost"
                disabled={deleting}
                onClick={() => setDeletingItem(null)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10 font-bold"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================== */}
      {/* MODAL 3: BULK DELETE CONFIRMATION */}
      {/* ========================================== */}
      {showBulkDeleteModal && (
        <Modal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          title="Confirm Bulk Media Deletion"
          subtitle={`Are you sure you want to permanently delete ${selectedIds.length} media items?`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-white">
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold text-rose-200 block text-xs">Irreversible Action</span>
                <span className="text-[11px] text-rose-300/80 block mt-0.5">
                  You are about to delete <strong className="text-white">{selectedIds.length}</strong> workshop media records.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                variant="ghost"
                disabled={bulkActionLoading}
                onClick={() => setShowBulkDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                disabled={bulkActionLoading}
                onClick={handleBulkDeleteConfirm}
                className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10 font-bold"
              >
                {bulkActionLoading ? 'Deleting...' : `Delete ${selectedIds.length} Items`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================== */}
      {/* MODAL 4: CREATE / EDIT WORKSHOP MEDIA */}
      {/* ========================================== */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={editingItem ? `Edit Workshop Media: ${editingItem.title}` : 'Add Workshop Showcase Media'}
        subtitle="Manage live workshop photography, production tour videos, and manufacturing stages"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-white">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 mb-1">Customer-Facing Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Sofa Frame Manufacturing & Joinery"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Craftsmanship Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              >
                {WORKSHOP_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
                <option value="custom">+ Create Custom Category...</option>
              </select>
              {category === 'custom' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type new category name..."
                  className="w-full p-2 mt-2 bg-slate-950 border border-[#B99A68] rounded-xl text-white text-xs"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Media Type *</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              >
                <option value="video">Video (4K / MP4 / Tour)</option>
                <option value="photo">Photograph (JPG / PNG)</option>
              </select>
            </div>
          </div>

          {/* Cloud Storage Attachment */}
          <div className="p-4 bg-black/40 border border-[#B99A68]/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#B99A68] uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4" /> Cloud Storage Attachment (Google Drive 5TB)
              </span>
            </div>

            {uploading && (
              <div className="p-3 bg-[#B99A68]/20 border border-[#B99A68]/40 rounded-xl text-white text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#B99A68] animate-spin shrink-0" />
                <span>{uploadProgress || 'Uploading media file...'}</span>
              </div>
            )}

            <label className="cursor-pointer block p-4 rounded-xl border border-dashed border-[#B99A68]/50 hover:bg-[#B99A68]/10 text-center transition-all">
              <UploadCloud className="w-6 h-6 mx-auto text-[#B99A68] mb-1" />
              <span className="font-bold text-white block">
                {editingItem ? 'Replace Media: Select New File' : mediaType === 'photo' ? 'Select One or Multiple Photos' : 'Select Video File'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {mediaType === 'video' ? 'MP4, WebM (Stored in SAAD FURNITURE/WORKSHOP MEDIA/VIDEOS)' : 'JPG, PNG, WebP (Stored in SAAD FURNITURE/WORKSHOP MEDIA/PHOTOS)'}
              </span>
              <input
                type="file"
                multiple={mediaType === 'photo'}
                accept={mediaType === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <div>
              <label className="block text-slate-300 mb-1">Or Direct Media Stream URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://... or /api/media/image/..."
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#B99A68]"
              />
            </div>

            {mediaType === 'video' && (
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">Upload Custom Thumbnail (JPG/PNG)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const tf = e.target.files?.[0];
                        if (tf) setThumbnailFile(tf);
                      }}
                      className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-[#B99A68] file:text-[#262421] cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Or Thumbnail Image URL</label>
                    <input
                      type="text"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs max-w-xs"
                  />
                </div>
              </div>
            )}

            {/* Live In-Modal Preview */}
            {url && (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 block">Attachment Preview</span>
                <div className="aspect-video bg-black rounded-xl overflow-hidden max-w-sm mx-auto border border-white/10">
                  {mediaType === 'video' ? (
                    <video src={url} controls playsInline preload="metadata" className="w-full h-full object-contain" />
                  ) : (
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Description / Craftsmanship Details</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of the technique, timber species, or carving tools used..."
              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featMedia"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#B99A68] focus:ring-0 bg-slate-900 border-slate-700"
              />
              <label htmlFor="featMedia" className="text-xs text-slate-300 cursor-pointer">
                Featured Video
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pubMedia"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-[#B99A68] focus:ring-0 bg-slate-900 border-slate-700"
              />
              <label htmlFor="pubMedia" className="text-xs text-slate-300 cursor-pointer">
                Published to Showroom App
              </label>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setShowUploadModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="gold" type="submit" disabled={submitting} className="font-bold px-6">
              {submitting ? 'Saving...' : editingItem ? 'Update Workshop Media' : 'Publish to Workshop'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================== */}
      {/* MODAL 5: FULL PREVIEW */}
      {/* ========================================== */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div className="flex items-center justify-between text-white" onClick={(e) => e.stopPropagation()}>
            <div>
              <Badge variant="gold">
                {WORKSHOP_CATEGORIES.find((c) => c.id === previewItem.category)?.label || previewItem.category}
              </Badge>
              <h3 className="text-sm font-bold text-white mt-1">{previewItem.title}</h3>
            </div>
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center my-4" onClick={(e) => e.stopPropagation()}>
            {previewItem.mediaType === 'video' ? (
              <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="max-w-2xl max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl">
                <img src={previewItem.url} alt={previewItem.title} className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          <div className="max-w-2xl mx-auto w-full text-center text-xs text-slate-400">
            {previewItem.description}
          </div>
        </div>
      )}
    </div>
  );
};
