'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Tag,
  Filter,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InAppDocumentViewer, DocumentItem } from '@/components/media/InAppDocumentViewer';

const CUSTOMER_CATEGORIES = [
  { id: 'all', label: 'All Library' },
  { id: 'catalogues', label: 'Catalogues' },
  { id: 'brochures', label: 'Brochures' },
  { id: 'pricelists', label: 'Price Lists' },
  { id: 'warranty', label: 'Warranty' },
  { id: 'photos', label: 'Photos' },
  { id: 'videos', label: 'Craft Videos' },
];

export const MobileDocumentsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/library/files');
      if (res.ok) {
        const data = await res.json();
        // Regular customers only see published public or permitted files
        setDocuments(data.files || []);
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
    if (activeCategory !== 'all' && doc.category !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name?.toLowerCase().includes(q);
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
    <div className="space-y-4 pb-20 select-none animate-fadeIn">
      {/* Luxury Header Banner */}
      <div className="bg-[#262421] rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-[#B99A68]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#B99A68] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Saad Furniture Cloud Library
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-white tracking-wide">
            Catalogues & Documents
          </h2>
          <p className="text-xs text-[#89847C] mt-1 leading-relaxed">
            Browse official 2026 furniture collections, wholesale price schedules, and warranty certificates.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89847C]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search catalogues, brochures, or price sheets..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE2D6] rounded-2xl text-xs text-[#292722] placeholder-[#89847C] focus:border-[#B99A68] outline-none shadow-sm"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CUSTOMER_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-[#262421] text-[#B99A68] border-[#262421] font-bold shadow-sm'
                  : 'bg-white text-[#89847C] border-[#EAE2D6] hover:text-[#262421]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Document List */}
      {loading ? (
        <div className="py-12 text-center text-[#89847C] space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#B99A68]" />
          <p className="text-xs">Loading showroom catalogues...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EAE2D6] p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#F7F5F0] text-[#B99A68] flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-serif font-bold text-[#262421]">No documents found</h3>
          <p className="text-xs text-[#89847C] max-w-xs mx-auto">
            Our luxury catalogues and wholesale price lists will appear here once published by the showroom manager.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-[#EAE2D6] p-3.5 shadow-sm hover:border-[#B99A68]/50 transition-all flex items-center justify-between gap-3 group"
            >
              <div
                onClick={() => setSelectedDoc(doc)}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-[#262421] text-[#B99A68] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#B99A68] bg-[#F7F5F0] px-1.5 py-0.5 rounded">
                      {doc.category || 'Catalogue'}
                    </span>
                    <span className="text-[10px] text-[#89847C]">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#262421] truncate font-serif">
                    {doc.name}
                  </h4>
                  {doc.description && (
                    <p className="text-[10px] text-[#89847C] truncate mt-0.5">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white rounded-xl text-xs font-bold px-3 py-1.5 h-8 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </Button>
                {doc.downloadAllowed !== false && (
                  <a
                    href={`/api/library/stream/${doc.id}`}
                    download={doc.name}
                    className="p-1.5 rounded-xl border border-[#EAE2D6] text-[#89847C] hover:text-[#262421] hover:bg-[#F7F5F0] transition-colors"
                    title="Download Copy"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* IN-APP DOCUMENT VIEWER */}
      <InAppDocumentViewer
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  );
};
