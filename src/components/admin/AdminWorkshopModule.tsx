'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { WORKSHOP_CATEGORIES } from '@/components/mobile/MobileWorkshopScreen';

export const AdminWorkshopModule: React.FC = () => {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'photo'>('all');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('video');
  const [category, setCategory] = useState('workshop_tour');
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
    setCategory('workshop_tour');
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
    setCategory(item.category || 'workshop_tour');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(`Uploading ${file.name} to Google Drive Workshop Vault...`);
      setErrorMsg(null);

      const isVideo = file.type.startsWith('video/');
      const detectedType = isVideo ? 'video' : 'photo';
      setMediaType(detectedType);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('title', title.trim() || file.name.replace(/\.[^/.]+$/, ''));
      formData.append('description', description);
      formData.append('mediaType', detectedType);
      formData.append('isFeatured', isFeatured ? '1' : '0');
      formData.append('displayOrder', displayOrder);
      if (videoDuration) formData.append('videoDuration', videoDuration);

      const res = await fetch('/api/workshop/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload media file');
      }

      const media = data.media;
      setEditingItem(media);
      setUrl(media.url || media.streamUrl || `/api/workshop/stream/${media.id}`);
      if (media.googleDriveFileId) setGoogleDriveFileId(media.googleDriveFileId);
      if (!title.trim()) setTitle(media.title);
      if (media.thumbnailUrl) setThumbnailUrl(media.thumbnailUrl);
      setUploadProgress('Successfully uploaded to Google Drive!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload error');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(''), 3000);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setErrorMsg('Title and media attachment/URL are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        mediaType,
        category,
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
      await fetchMedia();
    } catch (err: any) {
      setErrorMsg(err.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete workshop media "${itemTitle}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/workshop/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMedia();
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

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

  const filteredList = mediaList.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (typeFilter !== 'all' && item.mediaType !== typeFilter) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(term);
      const matchDesc = item.description?.toLowerCase().includes(term);
      const matchCat = item.category?.toLowerCase().includes(term);
      return matchTitle || matchDesc || matchCat;
    }
    return true;
  });

  const totalVideos = mediaList.filter((m) => m.mediaType === 'video').length;
  const totalPhotos = mediaList.filter((m) => m.mediaType === 'photo').length;
  const featuredItem = mediaList.find((m) => m.isFeatured);

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-[#B99A68]" /> Inside Our Workshop Media Manager
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Curate manufacturing videos, hardwood joinery photos, polishing tours, and home page showcases
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
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Featured Video</span>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description or category..."
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B99A68]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
          >
            <option value="all">All Media Types</option>
            <option value="video">Videos Only</option>
            <option value="photo">Photos Only</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
          >
            {WORKSHOP_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Workshop Media Grid */}
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
          {filteredList.map((item) => {
            const isVideo = item.mediaType === 'video';
            return (
              <div
                key={item.id}
                className="bg-[#141822] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group hover:border-[#B99A68]/50 transition-all"
              >
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.title}
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

                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.isFeatured ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#B99A68] text-slate-950 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                        <Star className="w-2.5 h-2.5 fill-current" /> Featured
                      </span>
                    ) : null}
                    <Badge variant={item.isPublished ? 'green' : 'neutral'}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant="gold">
                      {WORKSHOP_CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-white text-sm line-clamp-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(item)}
                        className={`p-1.5 rounded-lg border text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                          item.isFeatured
                            ? 'bg-[#B99A68]/20 border-[#B99A68] text-[#B99A68]'
                            : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                        }`}
                        title="Toggle Home Page Featured"
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

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewItem(item)}
                        className="h-7 w-7 p-0"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-300" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(item)}
                        className="h-7 w-7 p-0"
                        title="Edit Details"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-300" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id, item.title)}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                        title="Delete"
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

      {/* 5. Create / Edit Workshop Media Modal */}
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
            <label className="block text-slate-300 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sofa Frame Joinery & Hardwood Cutting"
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
              </select>
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

          {/* Media File Upload or Direct URL */}
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
              <span className="font-bold text-white block">Select File to Upload</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                MP4, WebM (Videos) or JPG, PNG (Photos)
              </span>
              <input
                type="file"
                accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Video Thumbnail Image URL</label>
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
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
                Featured Video (Mobile Home Page)
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

      {/* 6. Preview Modal */}
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

