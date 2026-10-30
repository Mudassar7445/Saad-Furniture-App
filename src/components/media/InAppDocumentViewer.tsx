'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCw,
  ExternalLink,
  Shield,
  Clock,
  HardDrive,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface DocumentItem {
  id: string;
  name: string;
  originalName?: string;
  mimeType: string;
  fileSize?: number;
  category?: string;
  googleDriveUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  createdAt?: string;
  downloadAllowed?: boolean;
}

interface InAppDocumentViewerProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InAppDocumentViewer: React.FC<InAppDocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Reset state on document change
    setZoomLevel(100);
    setRotation(0);
    setActivePage(1);
    setIsPlaying(true);
  }, [document]);

  if (!isOpen || !document) return null;

  const isPDF = document.mimeType?.includes('pdf') || document.name?.toLowerCase().endsWith('.pdf');
  const isImage =
    document.mimeType?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(document.name);
  const isVideo =
    document.mimeType?.startsWith('video/') ||
    /\.(mp4|webm|mov|mkv)$/i.test(document.name);
  const isOffice =
    document.mimeType?.includes('word') ||
    document.mimeType?.includes('officedocument') ||
    document.mimeType?.includes('spreadsheet') ||
    document.mimeType?.includes('presentation') ||
    /\.(docx|doc|xlsx|xls|pptx|ppt)$/i.test(document.name);

  // Streaming endpoint for in-app secure viewing
  const streamUrl = `/api/library/stream/${document.id}`;
  const directUrl = document.googleDriveUrl || streamUrl;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = streamUrl;
    link.download = document.name || 'saad-furniture-document';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#141312]/95 backdrop-blur-xl select-none animate-fadeIn">
      {/* Top Luxury App Bar */}
      <div className="h-16 px-4 md:px-6 bg-[#262421] border-b border-[#3d3833] flex items-center justify-between text-white shadow-lg">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#B99A68]/20 text-[#B99A68] border border-[#B99A68]/30 flex items-center justify-center shrink-0">
            {isPDF && <FileText className="w-5 h-5" />}
            {isImage && <Eye className="w-5 h-5" />}
            {isVideo && <Play className="w-5 h-5" />}
            {isOffice && <FileText className="w-5 h-5" />}
          </div>
          <div className="truncate">
            <h2 className="text-sm md:text-base font-serif font-bold text-white tracking-wide truncate">
              {document.name}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-[#89847C]">
              <span>{document.category || 'General File'}</span>
              <span>•</span>
              <span>{formatFileSize(document.fileSize)}</span>
              {document.createdAt && (
                <>
                  <span>•</span>
                  <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom controls for Image/PDF */}
          {(isPDF || isImage) && (
            <div className="hidden sm:flex items-center bg-[#1c1a18] rounded-xl border border-white/10 px-2 py-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 px-2 min-w-[48px] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Rotate for images */}
          {isImage && (
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 rounded-xl bg-[#1c1a18] border border-white/10 text-slate-300 hover:text-[#B99A68] transition-colors"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {/* Print for PDF */}
          {isPDF && (
            <button
              onClick={handlePrint}
              className="hidden sm:flex p-2 rounded-xl bg-[#1c1a18] border border-white/10 text-slate-300 hover:text-[#B99A68] transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {/* Download Button */}
          {document.downloadAllowed !== false && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#B99A68] text-[#262421] font-bold text-xs hover:bg-[#cbb185] transition-all shadow-md"
              title="Download File"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Save Copy</span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors ml-1"
            title="Close Viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Viewer Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 md:p-6 relative">
        {/* 1. PDF VIEWER */}
        {isPDF && (
          <div
            className="w-full h-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-transform duration-200"
            style={{
              transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
              transformOrigin: 'top center',
            }}
          >
            {/* Embedded PDF rendering via native object and fallback iframe */}
            <object
              data={`${streamUrl}#toolbar=1&navpanes=1`}
              type="application/pdf"
              className="w-full h-full min-h-[500px]"
            >
              <iframe
                src={`${streamUrl}#toolbar=1`}
                className="w-full h-full min-h-[500px] border-0"
                title={document.name}
              />
            </object>
          </div>
        )}

        {/* 2. IMAGE VIEWER */}
        {isImage && (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
            <img
              src={streamUrl}
              alt={document.name}
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            />
          </div>
        )}

        {/* 3. VIDEO STREAMING PLAYER */}
        {isVideo && (
          <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <video
              src={streamUrl}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[75vh] object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* 4. OFFICE / OTHER DOCUMENTS */}
        {isOffice && (
          <div className="w-full h-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-[#F7F5F0] border border-[#EAE2D6] flex items-center justify-center text-[#B99A68] shadow-inner">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#262421]">{document.name}</h3>
            <p className="text-xs text-[#89847C] max-w-md">
              Office documents (Word, Excel, PowerPoint) are securely protected. You can preview them via Google Docs or download directly to edit on your device.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <Button
                onClick={handleDownload}
                className="bg-[#262421] text-[#B99A68] hover:bg-[#B99A68] hover:text-white rounded-xl text-xs font-bold"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Document
              </Button>
              {document.googleDriveUrl && (
                <a
                  href={document.googleDriveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#262421] text-[#262421] font-bold text-xs hover:bg-[#F7F5F0] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Google Drive
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding Bar */}
      <div className="h-10 px-6 bg-[#1a1816] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#B99A68]" />
          <span>Saad Furniture Encrypted Cloud Library</span>
        </div>
        <div className="font-mono text-[10px] text-slate-500">
          Powered by Google Drive Enterprise (5TB)
        </div>
      </div>
    </div>
  );
};
