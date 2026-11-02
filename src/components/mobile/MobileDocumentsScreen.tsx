'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Sparkles,
  Play,
  Film,
  Image as ImageIcon,
  FolderOpen,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InAppDocumentViewer, DocumentItem } from '@/components/media/InAppDocumentViewer';
import { getSafeThumbnailUrl } from '@/lib/media/videoThumbnail';

const CUSTOMER_CATEGORIES = [
  { id: 'all', label: 'All Library' },
  { id: 'videos', label: 'Craft Videos' },
  { id: 'catalogues', label: 'Catalogues' },
  { id: 'photos', label: 'Photos' },
  { id: 'brochures', label: 'Brochures' },
  { id: 'pricelists', label: 'Price Lists' },
  { id: 'warranty', label: 'Warranty' },
];

let documentsScreenCache: any[] | null = null;
let documentsScreenCacheTime = 0;

export const MobileDocumentsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<any[]>(documentsScreenCache || []);
  const [loading, setLoading] = useState(documentsScreenCache ? false : true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const fetchDocuments = async (force = false) => {
    const isCacheFresh = documentsScreenCache && Date.now() - documentsScreenCacheTime < 180000;
    if (!force && isCacheFresh && documentsScreenCache) {
      setDocuments(documentsScreenCache);
      setLoading(false);
      return;
    }

    try {
      if (!documentsScreenCache) setLoading(true);
      const res = await fetch('/api/library/files');
      if (res.ok) {
        const data = await res.json();
        const files = data.files || [];
        documentsScreenCache = files;
        documentsScreenCacheTime = Date.now();
        setDocuments(files);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter((doc) => {
    if (activeCategory === 'videos') {
      const isVid = doc.mediaType === 'video' || doc.mimeType?.startsWith('video/') || doc.category === 'videos';
      if (!isVid) return false;
    } else if (activeCategory === 'photos') {
      const isPhoto = doc.mediaType === 'photo' || doc.mimeType?.startsWith('image/') || doc.category === 'photographs';
      if (!isPhoto) return false;
    } else if (activeCategory !== 'all') {
      if (doc.category !== activeCategory) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name?.toLowerCase().includes(q) || doc.title?.toLowerCase().includes(q);
      const matchDesc = doc.description?.toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  return (
    <div className="space-y-4 pb-20 select-none animate-fadeIn text-white">
      {/* Luxury Header Banner */}
      <div className="bg-[#171719] border border-[#2D2D30] rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-[#D6B36A]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D6B36A] flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" />
              Saad Furniture Cloud Library
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-white tracking-wide">
            Catalogues & Craft Media
          </h2>
          <p className="text-xs text-[#C5C5C5] mt-1 leading-relaxed">
            Instant access to bespoke craftsmanship videos, 2026 furniture collections, and verified certificates.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5A5A5]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos, catalogues, or blueprints..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#171719] border border-[#2D2D30] rounded-2xl text-xs text-white placeholder-[#A5A5A5] focus:border-[#D6B36A] outline-none shadow-sm"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CUSTOMER_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? 'bg-[#D6B36A] text-[#0B0B0D] border-[#D6B36A] shadow-sm font-black'
                  : 'bg-[#171719] text-[#C5C5C5] border-[#2D2D30] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Content Gallery / List */}
      {loading ? (
        <div className="py-12 text-center text-[#A5A5A5] space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D6B36A]" />
          <p className="text-xs">Opening cloud library...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-[#222222] rounded-3xl border border-[#2D2D30] p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#171719] text-[#D6B36A] flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-serif font-bold text-white">No documents or media found</h3>
          <p className="text-xs text-[#A5A5A5] max-w-xs mx-auto">
            Craftsmanship videos and luxury catalogues will appear here once published by the showroom manager.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const isVideo = doc.mediaType === 'video' || doc.mimeType?.startsWith('video/');
            const isPhoto = doc.mediaType === 'photo' || doc.mimeType?.startsWith('image/');
            const displayName = doc.title || doc.name || 'Artisan Milestone';

            // High-Performance Video Card with Instant Thumbnail
            if (isVideo) {
              const safeThumb = getSafeThumbnailUrl(doc);
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-[#222222] rounded-2xl border border-[#2D2D30] overflow-hidden shadow-md hover:border-[#D6B36A]/60 transition-all cursor-pointer group"
                >
                  <div className="relative aspect-video bg-[#171719] overflow-hidden">
                    <img
                      src={safeThumb}
                      alt={displayName}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D6B36A] text-[#0B0B0D] shadow">
                          Craft Video
                        </span>
                        {doc.videoDuration && (
                          <span className="text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#D6B36A]" />
                            {Math.round(doc.videoDuration)}s
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#D6B36A] text-[#0B0B0D] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white truncate drop-shadow">
                          {displayName}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-[#C5C5C5] mt-0.5">
                          <span>{doc.description || 'Tap to stream 4K atelier craftsmanship video'}</span>
                          <span className="font-mono text-[#D6B36A] font-bold">
                            {formatFileSize(doc.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Standard Document & Photo Rows
            return (
              <div
                key={doc.id}
                className="bg-[#222222] rounded-2xl border border-[#2D2D30] p-3.5 shadow-sm hover:border-[#D6B36A]/50 transition-all flex items-center justify-between gap-3 group"
              >
                <div
                  onClick={() => setSelectedDoc(doc)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#171719] text-[#D6B36A] border border-[#2D2D30] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden relative">
                    {isPhoto ? (
                      <img
                        src={doc.thumbnailUrl || `/api/media/image/${doc.id}`}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#D6B36A] bg-[#171719] border border-[#2D2D30] px-1.5 py-0.5 rounded">
                        {doc.category || 'Catalogue'}
                      </span>
                      <span className="text-[10px] text-[#A5A5A5]">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate font-serif">
                      {displayName}
                    </h4>
                    {doc.description && (
                      <p className="text-[10px] text-[#C5C5C5] truncate mt-0.5">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="bg-[#D6B36A] hover:bg-[#c4a159] text-[#0B0B0D] rounded-xl text-xs font-black px-3 py-1.5 h-8 flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  {doc.downloadAllowed !== false && (
                    <a
                      href={`/api/library/stream/${doc.id}`}
                      download={doc.fileName || doc.name}
                      className="p-1.5 rounded-xl border border-[#2D2D30] bg-[#171719] text-[#C5C5C5] hover:text-white hover:border-[#D6B36A] transition-colors"
                      title="Download Copy"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* IN-APP DOCUMENT & VIDEO VIEWER */}
      <InAppDocumentViewer
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
};
