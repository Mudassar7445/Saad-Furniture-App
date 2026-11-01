'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Camera,
  Video,
  FileText,
  UploadCloud,
  Play,
  Eye,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
  Lock,
  Globe,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Package,
  Share2,
  Download,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { getSafeThumbnailUrl, captureVideoThumbnail } from '@/lib/media/videoThumbnail';

export interface OrderCraftingGalleryProps {
  orderId: string;
  order: any;
  items?: any[];
  initialMedia?: any[];
  isAdmin?: boolean;
  onMediaChange?: (updatedMedia: any[]) => void;
  selectedStageFilter?: string | null;
  onClearStageFilter?: () => void;
  theme?: 'dark' | 'light';
}

// Master Craftsmanship Stages
export const CRAFTING_STAGES = [
  { id: 'all', name: 'All Stages' },
  { id: 'order_confirmed', name: 'Order Confirmed' },
  { id: 'design_measurements', name: 'Design & Measurements' },
  { id: 'material_preparation', name: 'Material Preparation' },
  { id: 'frame_cutting', name: 'Frame Cutting & Planing' },
  { id: 'frame_preparation', name: 'Frame Preparation' },
  { id: 'frame_assembly', name: 'Frame Assembly' },
  { id: 'frame_inspection', name: 'Frame Structural Inspection' },
  { id: 'foam_work', name: 'Foam Work & Cushioning' },
  { id: 'fabric_cutting_stitching', name: 'Fabric Cutting & Stitching' },
  { id: 'upholstery_work', name: 'Upholstery & Tufting' },
  { id: 'polishing_finishing', name: 'Polishing & Finishing' },
  { id: 'quality_inspection', name: 'Quality Inspection (28-Point Audit)' },
  { id: 'ready_for_delivery', name: 'Ready for Delivery & Packing' },
  { id: 'dispatched', name: 'Dispatched & Transit' },
  { id: 'delivered', name: 'Delivered & Handover' },
];

export const OrderCraftingGallery: React.FC<OrderCraftingGalleryProps> = ({
  orderId,
  order,
  items = [],
  initialMedia = [],
  isAdmin = false,
  onMediaChange,
  selectedStageFilter = null,
  onClearStageFilter,
  theme = 'dark',
}) => {
  const [mediaList, setMediaList] = useState<any[]>(initialMedia);
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos' | 'notes'>('all');
  const [stageFilter, setStageFilter] = useState<string>(selectedStageFilter || 'all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Viewer States
  const [activePhotoViewerIndex, setActivePhotoViewerIndex] = useState<number | null>(null);
  const [activeVideoItem, setActiveVideoItem] = useState<any | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPresetType, setUploadPresetType] = useState<'photo' | 'video' | 'note'>('photo');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadStage, setUploadStage] = useState(order?.productionStage || 'frame_preparation');
  const [uploadProductId, setUploadProductId] = useState<string>('all');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<'customer' | 'private'>('customer');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when initialMedia updates from parent
  useEffect(() => {
    if (initialMedia && initialMedia.length > 0) {
      setMediaList(initialMedia);
    }
  }, [initialMedia]);

  // Sync when selectedStageFilter changes from timeline click
  useEffect(() => {
    if (selectedStageFilter) {
      setStageFilter(selectedStageFilter);
    }
  }, [selectedStageFilter]);

  // Build product options lookup
  const productOptions = useMemo(() => {
    const list: { id: string; title: string }[] = [];
    if (items && items.length > 0) {
      items.forEach((it) => {
        list.push({
          id: it.productId || it.id,
          title: it.productTitle || it.title || `Item #${it.id?.slice(-4)}`,
        });
      });
    } else if (order?.productName) {
      list.push({
        id: 'primary',
        title: order.productName,
      });
    }
    return list;
  }, [items, order]);

  // Filter & Sort media
  const filteredMedia = useMemo(() => {
    return mediaList
      .filter((m) => {
        // Tab filter
        const isVid = m.mediaType === 'video' || m.mimeType?.startsWith('video');
        const isDocOrNote =
          m.mediaType === 'document' ||
          m.category === 'progress_notes' ||
          m.mimeType === 'text/plain';
        const isImg = !isVid && !isDocOrNote;

        if (activeTab === 'photos' && !isImg) return false;
        if (activeTab === 'videos' && !isVid) return false;
        if (activeTab === 'notes' && !isDocOrNote) return false;

        // Stage filter
        if (stageFilter && stageFilter !== 'all') {
          const mStage = (m.stage || '').toLowerCase().replace(/[\s-]+/g, '_');
          const fStage = stageFilter.toLowerCase().replace(/[\s-]+/g, '_');
          if (!mStage.includes(fStage) && !fStage.includes(mStage)) return false;
        }

        // Product filter
        if (productFilter && productFilter !== 'all') {
          if (m.productId && m.productId !== productFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.uploadedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.uploadedAt || b.createdAt || 0).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [mediaList, activeTab, stageFilter, productFilter, sortOrder]);

  // All photos for full-screen lightbox navigation
  const allPhotosInFiltered = useMemo(() => {
    return filteredMedia.filter(
      (m) =>
        m.mediaType !== 'video' &&
        !m.mimeType?.startsWith('video') &&
        m.category !== 'progress_notes' &&
        m.mimeType !== 'text/plain'
    );
  }, [filteredMedia]);

  // Counts
  const counts = useMemo(() => {
    let p = 0;
    let v = 0;
    let n = 0;
    mediaList.forEach((m) => {
      if (m.mediaType === 'video' || m.mimeType?.startsWith('video')) v++;
      else if (
        m.mediaType === 'document' ||
        m.category === 'progress_notes' ||
        m.mimeType === 'text/plain'
      )
        n++;
      else p++;
    });
    return { photos: p, videos: v, notes: n, total: mediaList.length };
  }, [mediaList]);

  // Open upload modal with appropriate preset
  const handleOpenUpload = (type: 'photo' | 'video' | 'note') => {
    setUploadPresetType(type);
    setSelectedFiles([]);
    setUploadTitle('');
    setUploadDescription('');
    setUploadVisibility('customer');
    setUploadError(null);
    setUploadStage(order?.productionStage || 'frame_preparation');
    setShowUploadModal(true);

    if (type !== 'note') {
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }, 100);
    }
  };

  // Handle file selection
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const arr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...arr]);
      if (!uploadTitle) {
        const first = arr[0];
        const cleanName = first.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setUploadTitle(cleanName);
      }
    }
  };

  const handleRemoveSelectedFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Upload to Order Media Endpoint
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadPresetType !== 'note' && selectedFiles.length === 0) {
      setUploadError('Please choose at least one photo or video file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('stage', uploadStage);
      formData.append('title', uploadTitle || `Craftsmanship Milestone — ${uploadStage.replace(/_/g, ' ')}`);
      formData.append('description', uploadDescription);
      formData.append('visibility', uploadVisibility);

      if (uploadProductId && uploadProductId !== 'all') {
        formData.append('productId', uploadProductId);
      }

      // Append all files
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          formData.append('files', file);

          // If video, try generating client-side lightweight thumbnail
          if (file.type.startsWith('video/') && i === 0) {
            setUploadProgressText(`Generating optimized preview for ${file.name}...`);
            try {
              const thumb = await captureVideoThumbnail(file);
              if (thumb) {
                formData.append('thumbnail', thumb);
              }
            } catch (tErr) {
              console.warn('Thumbnail generation skipped:', tErr);
            }
          }
        }
      }

      setUploadProgressText(
        selectedFiles.length > 0
          ? `Transmitting ${selectedFiles.length} file(s) to 5TB Cloud Storage...`
          : 'Saving craftsmanship progress note...'
      );

      const res = await fetch(`/api/orders/${orderId}/media`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload media.');
      }

      // Success: instantly append newly uploaded media without page refresh
      const newItems = data.uploaded || [];
      const updatedList = [...newItems, ...mediaList];
      setMediaList(updatedList);
      if (onMediaChange) {
        onMediaChange(updatedList);
      }

      setShowUploadModal(false);
      setSelectedFiles([]);
      setUploadTitle('');
      setUploadDescription('');
      setUploadSuccessToast(
        newItems.length === 1
          ? `Successfully published ${newItems[0].title || 'craftsmanship media'}!`
          : `Successfully published ${newItems.length} craftsmanship media items!`
      );
      setTimeout(() => setUploadSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'An error occurred during upload. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  // Keyboard navigation for full-screen photo viewer
  useEffect(() => {
    if (activePhotoViewerIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePhotoViewerIndex(null);
      if (e.key === 'ArrowRight') {
        setActivePhotoViewerIndex((prev) =>
          prev !== null && prev < allPhotosInFiltered.length - 1 ? prev + 1 : 0
        );
      }
      if (e.key === 'ArrowLeft') {
        setActivePhotoViewerIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : allPhotosInFiltered.length - 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoViewerIndex, allPhotosInFiltered]);

  const activePhoto =
    activePhotoViewerIndex !== null ? allPhotosInFiltered[activePhotoViewerIndex] : null;

  // Resolve media preview/thumbnail URL
  const getMediaUrl = (m: any) => {
    if (m.mediaType === 'video') {
      return `/api/media/${m.id}/stream`;
    }
    return m.thumbnailUrl || `/api/media/image/${m.id}` || m.webViewLink || m.url;
  };

  // Get human product label
  const getProductLabel = (productId?: string) => {
    if (!productId) return null;
    const match = productOptions.find((p) => p.id === productId);
    return match ? match.title : null;
  };

  // Color styles based on theme
  const isLight = theme === 'light';
  const cardBg = isLight ? 'bg-white border-[#EAE2D6]' : 'bg-slate-900/90 border-white/10';
  const textMuted = isLight ? 'text-[#89847C]' : 'text-slate-400';
  const textHeading = isLight ? 'text-[#262421]' : 'text-white';
  const tabActiveBg = isLight ? 'bg-[#262421] text-[#B99A68]' : 'bg-[#B99A68] text-slate-950 font-bold';
  const tabInactiveBg = isLight ? 'bg-[#F7F5F0] text-[#89847C] hover:text-[#262421]' : 'bg-slate-800/80 text-slate-300 hover:text-white';

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {uploadSuccessToast && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center justify-between shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{uploadSuccessToast}</span>
          </div>
          <button
            onClick={() => setUploadSuccessToast(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION: Title & Direct Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`text-sm sm:text-base font-serif font-bold ${textHeading} flex items-center gap-2`}>
              <Camera className="w-4 h-4 text-[#B99A68]" />
              Order Crafting Gallery
            </h3>
            <Badge variant="gold" className="text-[10px] font-bold px-2 py-0.5">
              {mediaList.length} Total Proofs
            </Badge>
          </div>
          <p className={`text-[11px] ${textMuted} mt-0.5`}>
            All high-definition crafting photos, 4K artisan video clips & progress updates for Order #{order?.orderNumber || orderId.slice(0, 8).toUpperCase()}.
          </p>
        </div>

        {/* Admin Action Buttons */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleOpenUpload('photo')}
              className="h-8 text-xs px-2.5 font-semibold border-[#B99A68]/40 hover:border-[#B99A68] hover:bg-[#B99A68]/10 text-white"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5 text-[#B99A68]" />
              Upload Photos
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleOpenUpload('video')}
              className="h-8 text-xs px-2.5 font-semibold border-[#B99A68]/40 hover:border-[#B99A68] hover:bg-[#B99A68]/10 text-white"
            >
              <Video className="w-3.5 h-3.5 mr-1.5 text-[#B99A68]" />
              Upload Videos
            </Button>

            <Button
              type="button"
              size="sm"
              variant="gold"
              onClick={() => handleOpenUpload('note')}
              className="h-8 text-xs px-2.5 font-bold shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Add Progress Update
            </Button>
          </div>
        )}
      </div>

      {/* FILTER & ORGANIZATION CONTROLS */}
      <div className="space-y-2.5 bg-black/20 p-3 rounded-2xl border border-white/5">
        {/* Row 1: Media Type Tabs & Sorter */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'all' ? tabActiveBg : tabInactiveBg
              }`}
            >
              All ({counts.total})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('photos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'photos' ? tabActiveBg : tabInactiveBg
              }`}
            >
              <Camera className="w-3 h-3" />
              Photos ({counts.photos})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'videos' ? tabActiveBg : tabInactiveBg
              }`}
            >
              <Video className="w-3 h-3" />
              Videos ({counts.videos})
            </button>

            {counts.notes > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'notes' ? tabActiveBg : tabInactiveBg
                }`}
              >
                <FileText className="w-3 h-3" />
                Notes ({counts.notes})
              </button>
            )}
          </div>

          {/* Sort Toggle */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Sort:</span>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-mono flex items-center gap-1 border border-white/10 transition-colors"
            >
              <Clock className="w-3 h-3 text-[#B99A68]" />
              {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>

        {/* Row 2: Stage & Multi-Product Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          {/* Stage Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`text-[11px] ${textMuted} flex items-center gap-1`}>
              <Layers className="w-3 h-3 text-[#B99A68]" /> Stage:
            </span>
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                if (e.target.value === 'all' && onClearStageFilter) {
                  onClearStageFilter();
                }
              }}
              className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#B99A68]"
            >
              {CRAFTING_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter (Shown for Multi-Item Orders) */}
          {productOptions.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`text-[11px] ${textMuted} flex items-center gap-1`}>
                <Package className="w-3 h-3 text-[#B99A68]" /> Product:
              </span>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white max-w-[200px] truncate focus:outline-none focus:border-[#B99A68]"
              >
                <option value="all">All Products ({productOptions.length})</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Filter Clear Pill */}
          {(stageFilter !== 'all' || productFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setStageFilter('all');
                setProductFilter('all');
                if (onClearStageFilter) onClearStageFilter();
              }}
              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 ml-auto underline"
            >
              <X className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* MEDIA GRID / LIST */}
      {filteredMedia.length === 0 ? (
        <div className={`p-8 text-center rounded-2xl border border-dashed ${cardBg} space-y-3`}>
          <div className="w-12 h-12 rounded-2xl bg-[#B99A68]/10 text-[#B99A68] flex items-center justify-center mx-auto">
            {activeTab === 'videos' ? (
              <Video className="w-6 h-6" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </div>
          <div>
            <h4 className={`text-xs sm:text-sm font-bold ${textHeading}`}>
              No Crafting Media Found for this View
            </h4>
            <p className={`text-[11px] ${textMuted} mt-1 max-w-sm mx-auto`}>
              {isAdmin
                ? 'Use the buttons above to upload the first set of workshop photos, 4K videos, or milestone notes for this customer order.'
                : 'Master artisan updates and high-resolution visual proofs will be published here as each crafting milestone is reached.'}
            </p>
          </div>
          {isAdmin && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="gold"
                onClick={() => handleOpenUpload('photo')}
                className="text-xs h-8 px-3 font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Upload First Media
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredMedia.map((m, mIdx) => {
            const isVid = m.mediaType === 'video' || m.mimeType?.startsWith('video');
            const isNote =
              m.mediaType === 'document' ||
              m.category === 'progress_notes' ||
              m.mimeType === 'text/plain';
            const productLabel = getProductLabel(m.productId);
            const stageLabel = (m.stage || '').replace(/_/g, ' ');
            const isPrivate = m.visibility === 'private' || m.visibility === 'admin_only';
            const thumbUrl = isVid
              ? getSafeThumbnailUrl(m)
              : m.thumbnailUrl || `/api/media/image/${m.id}` || m.webViewLink || m.url;

            // Handle card click
            const handleCardClick = () => {
              if (isVid) {
                setActiveVideoItem(m);
              } else if (!isNote) {
                const photoIdx = allPhotosInFiltered.findIndex((p) => p.id === m.id);
                if (photoIdx >= 0) {
                  setActivePhotoViewerIndex(photoIdx);
                }
              }
            };

            return (
              <div
                key={m.id || mIdx}
                onClick={handleCardClick}
                className={`group relative rounded-2xl overflow-hidden border ${cardBg} flex flex-col justify-between shadow-md cursor-pointer transition-all hover:border-[#B99A68] hover:shadow-xl`}
              >
                {/* Visual Area */}
                {isNote ? (
                  <div className="aspect-square bg-slate-950/80 p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-amber-400">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[9px] uppercase font-bold tracking-wider">
                        Artisan Note
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-4 italic">
                      "{m.description || m.title}"
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(m.uploadedAt || m.createdAt || 0).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <div className="aspect-square relative bg-black/60 overflow-hidden">
                    <img
                      src={thumbUrl}
                      alt={m.title || 'Crafting milestone'}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = isVid
                          ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
                          : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Video Center Play Button */}
                    {isVid && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-[#B99A68] text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Photo Hover Zoom Icon */}
                    {!isVid && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center shadow-lg">
                          <Eye className="w-4 h-4 text-[#B99A68]" />
                        </div>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-white shadow">
                        {stageLabel}
                      </span>

                      {/* Admin Visibility Tag */}
                      {isAdmin && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow flex items-center gap-1 ${
                            isPrivate
                              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                          {isPrivate ? 'Admin Only' : 'Customer'}
                        </span>
                      )}
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                      {productLabel && (
                        <span className="text-[9px] text-amber-300 font-semibold block truncate">
                          {productLabel}
                        </span>
                      )}
                      <h5 className="text-[11px] font-bold text-white truncate drop-shadow">
                        {m.title || m.fileName}
                      </h5>
                      <span className="text-[9px] text-slate-300 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5 text-[#B99A68]" />
                        {new Date(m.uploadedAt || m.createdAt || 0).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-SCREEN HIGH-RES PHOTO LIGHTBOX */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200"
          onClick={() => setActivePhotoViewerIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between z-10 shrink-0 text-white pb-3 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-xs font-mono text-[#B99A68] uppercase font-bold">
                Photo {activePhotoViewerIndex! + 1} of {allPhotosInFiltered.length}
              </span>
              <h4 className="text-sm font-bold truncate max-w-sm sm:max-w-lg">
                {activePhoto.title || 'Artisan Workshop Milestone Photo'}
              </h4>
              <span className="text-[10px] text-slate-400">
                Stage: <strong className="text-white capitalize">{activePhoto.stage?.replace(/_/g, ' ')}</strong>
                {activePhoto.productId && getProductLabel(activePhoto.productId) && (
                  <> • Product: <strong className="text-white">{getProductLabel(activePhoto.productId)}</strong></>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activePhoto.webViewLink || activePhoto.thumbnailUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 transition-colors"
                title="Open HD Link"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setActivePhotoViewerIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-rose-500/80 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Photo Center */}
          <div
            className="flex-1 flex items-center justify-center relative my-2 overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {allPhotosInFiltered.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActivePhotoViewerIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : allPhotosInFiltered.length - 1
                  )
                }
                className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              src={activePhoto.thumbnailUrl || `/api/media/image/${activePhoto.id}?full=true` || activePhoto.webViewLink || activePhoto.url}
              alt={activePhoto.title}
              className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
            />

            {/* Next Button */}
            {allPhotosInFiltered.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setActivePhotoViewerIndex((prev) =>
                    prev !== null && prev < allPhotosInFiltered.length - 1 ? prev + 1 : 0
                  )
                }
                className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition-all"
                aria-label="Next photo"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Note & Date */}
          {activePhoto.description && (
            <div
              className="p-3 bg-white/5 border border-white/10 rounded-xl text-center text-xs text-slate-300 max-w-xl mx-auto z-10 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="italic">"{activePhoto.description}"</p>
            </div>
          )}
        </div>
      )}

      {/* DIRECT IN-APP VIDEO PLAYBACK MODAL */}
      {activeVideoItem && (
        <Modal
          isOpen={Boolean(activeVideoItem)}
          onClose={() => setActiveVideoItem(null)}
          title={activeVideoItem.title || 'Craftsmanship Video Playback'}
          subtitle={`Stage: ${activeVideoItem.stage?.replace(/_/g, ' ').toUpperCase() || 'MANUFACTURING'}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <video
                src={`/api/media/${activeVideoItem.id}/stream`}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Your browser does not support high-definition video playback.
              </video>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/80 p-4 rounded-xl border border-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-white text-sm">
                  {activeVideoItem.title || 'Artisan Workshop Milestone'}
                </span>
                <span className="text-[11px] font-mono text-[#B99A68]">
                  Uploaded: {new Date(activeVideoItem.uploadedAt || activeVideoItem.createdAt || 0).toLocaleString()}
                </span>
              </div>

              {activeVideoItem.description && (
                <p className="text-slate-300 leading-relaxed italic border-t border-white/5 pt-2">
                  "{activeVideoItem.description}"
                </p>
              )}

              {activeVideoItem.productId && getProductLabel(activeVideoItem.productId) && (
                <p className="text-[11px] text-slate-400">
                  Associated Item: <strong className="text-white">{getProductLabel(activeVideoItem.productId)}</strong>
                </p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="ghost" onClick={() => setActiveVideoItem(null)}>
                Close Player
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* IN-PAGE MULTI-FILE UPLOAD MODAL (ADMIN ONLY) */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          if (!isUploading) setShowUploadModal(false);
        }}
        title={
          uploadPresetType === 'video'
            ? 'Upload Workshop Crafting Videos'
            : uploadPresetType === 'note'
            ? 'Publish Artisan Milestone Progress Update'
            : 'Upload High-Definition Crafting Photos'
        }
        subtitle={`Order #${order?.orderNumber || orderId.slice(0, 8).toUpperCase()} • Dispatches directly to 5TB Cloud Storage`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitUpload} className="space-y-4 text-xs">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Multi-File Chooser / Drop Zone */}
          {uploadPresetType !== 'note' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Select Photo / Video Files (Multiple Supported) *
              </label>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={uploadPresetType === 'video' ? 'video/*' : 'image/*,video/*'}
                onChange={handleFilesSelected}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-white/15 hover:border-[#B99A68] rounded-2xl bg-black/30 hover:bg-black/50 text-center cursor-pointer transition-all space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#B99A68]/15 text-[#B99A68] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-white font-bold block text-xs">
                    Click to browse or drop {uploadPresetType === 'video' ? 'videos' : 'photos & videos'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Supports multiple files together (MP4, MOV, JPG, PNG, WEBP)
                  </span>
                </div>
              </div>

              {/* Selected Files List Preview */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
                  <span className="text-[11px] font-bold text-[#B99A68] block">
                    Selected Files ({selectedFiles.length}):
                  </span>
                  {selectedFiles.map((f, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {f.type.startsWith('video/') ? (
                          <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="text-white truncate font-medium">{f.name}</span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          ({(f.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedFile(i)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Milestone Title */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Milestone Title / Headline
            </label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. Master Wood Carver Finishing Headboard Joinery"
              className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          {/* Manufacturing Stage & Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Manufacturing Stage *
              </label>
              <select
                value={uploadStage}
                onChange={(e) => setUploadStage(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              >
                {CRAFTING_STAGES.filter((s) => s.id !== 'all').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Related Product for Multi-Item Orders */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Related Product
              </label>
              <select
                value={uploadProductId}
                onChange={(e) => setUploadProductId(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
              >
                <option value="all">Entire Order / All Products</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description / Progress Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Artisan Progress Note / Craftsmanship Details
            </label>
            <textarea
              rows={3}
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Describe the structural joinery, foam density, Italian lacquer coat, or audit notes..."
              className="w-full p-2.5 bg-slate-900 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#B99A68]"
            />
          </div>

          {/* Customer Visibility Toggle */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/10 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 block">
              Audience & Customer Visibility:
            </span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="customer"
                  checked={uploadVisibility === 'customer'}
                  onChange={() => setUploadVisibility('customer')}
                  className="accent-[#B99A68]"
                />
                <span className="text-white font-medium flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  Visible to Customer (Published to App & Portal)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={uploadVisibility === 'private'}
                  onChange={() => setUploadVisibility('private')}
                  className="accent-[#B99A68]"
                />
                <span className="text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Admin Only (Internal Workshop Audit)
                </span>
              </label>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="p-3 bg-slate-900 rounded-xl border border-[#B99A68]/40 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#B99A68]">
                <span className="flex items-center gap-1.5 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {uploadProgressText || 'Uploading to 5TB Cloud Storage...'}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#B99A68] to-amber-200 h-2 rounded-full animate-pulse w-full" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              disabled={isUploading}
              onClick={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="gold"
              disabled={isUploading}
              className="font-bold min-w-[140px]"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  Publish to Gallery
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

