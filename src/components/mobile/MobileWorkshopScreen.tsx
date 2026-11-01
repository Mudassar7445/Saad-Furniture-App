'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  Film,
  Image as ImageIcon,
  ChevronRight,
  Sparkles,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  Clock,
  Layers,
  Wrench,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const WORKSHOP_CATEGORIES = [
  { id: 'all', label: 'All Craftsmanship' },
  { id: 'workshop_tour', label: 'Master Tour' },
  { id: 'sofa_frame', label: 'Sofa Frame' },
  { id: 'woodworking', label: 'Woodworking' },
  { id: 'foam_work', label: 'Foam Work' },
  { id: 'fabric_stitching', label: 'Fabric Stitching' },
  { id: 'furniture_polishing', label: 'Polishing' },
  { id: 'final_finishing', label: 'Finishing' },
  { id: 'completed_products', label: 'Completed Suites' },
];

interface MobileWorkshopScreenProps {
  onBackToHome?: () => void;
  onExploreShop?: () => void;
}

let workshopScreenCache: any[] | null = null;
let workshopScreenCacheTime = 0;

export const MobileWorkshopScreen: React.FC<MobileWorkshopScreenProps> = ({
  onBackToHome,
  onExploreShop,
}) => {
  const [mediaList, setMediaList] = useState<any[]>(workshopScreenCache || []);
  const [loading, setLoading] = useState(workshopScreenCache ? false : true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeMediaItem, setActiveMediaItem] = useState<any | null>(null);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);
  const [videoIsBuffering, setVideoIsBuffering] = useState(true);

  const fetchMedia = async () => {
    const isCacheFresh = workshopScreenCache && Date.now() - workshopScreenCacheTime < 180000;
    if (isCacheFresh && workshopScreenCache) {
      setMediaList(workshopScreenCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/workshop');
      if (res.ok) {
        const data = await res.json();
        const media = data.media || [];
        workshopScreenCache = media;
        workshopScreenCacheTime = Date.now();
        setMediaList(media);
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

  const featuredVideo = mediaList.find((m) => m.isFeatured && m.mediaType === 'video') ||
    mediaList.find((m) => m.mediaType === 'video') ||
    mediaList[0];

  const filteredItems = mediaList.filter((m) => {
    if (selectedCategory === 'all') return true;
    return m.category === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-[#1A1816] text-[#F7F5F0] p-6 border border-[#B99A68]/30 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#141210] via-[#1A1816]/95 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80"
          alt="Workshop background"
          className="absolute right-0 top-0 bottom-0 w-1/2 object-cover opacity-20"
        />

        <div className="relative z-20 space-y-2 max-w-[280px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B99A68] text-[#1A1816] text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3 h-3 fill-current" /> Live Master Atelier
          </span>
          <h1 className="text-xl font-serif font-black leading-tight tracking-tight text-white">
            Inside Our Workshop
          </h1>
          <p className="text-xs text-[#EAE2D6]/80 leading-relaxed">
            Every piece is crafted with passion, precision, and attention to detail. Experience our master artisans at work.
          </p>
        </div>
      </div>

      {/* 2. Featured Manufacturing Video Card */}
      {featuredVideo && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B99A68] flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" /> Featured Production Tour
            </span>
            <span className="text-[10px] text-[#89847C] font-mono">
              {featuredVideo.videoDuration ? `${featuredVideo.videoDuration}s 4K HD` : 'High Definition'}
            </span>
          </div>

          <div
            onClick={() => {
              setVideoPlaybackError(false);
              setVideoIsBuffering(true);
              setActiveMediaItem(featuredVideo);
            }}
            className="group relative rounded-2xl overflow-hidden aspect-video bg-black border border-[#EAE2D6] shadow-md cursor-pointer active:scale-[0.99] transition-transform"
          >
            <img
              src={featuredVideo.thumbnailUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'}
              alt={featuredVideo.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4">
              <div className="self-end">
                <Badge variant="gold">
                  {WORKSHOP_CATEGORIES.find((c) => c.id === featuredVideo.category)?.label || 'Masterwork'}
                </Badge>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#B99A68] text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-serif font-bold text-white drop-shadow-md line-clamp-1">
                  {featuredVideo.title}
                </h3>
                <p className="text-[11px] text-[#EAE2D6] line-clamp-1 mt-0.5">
                  {featuredVideo.description || 'Tap to play high-definition craftsmanship tour inside the app'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Craftsmanship Category Selector Pills */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#89847C] block">
          Craftsmanship Stages
        </span>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {WORKSHOP_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#262421] text-[#F7F5F0] shadow-sm'
                    : 'bg-white border border-[#EAE2D6] text-[#89847C] hover:text-[#262421]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Filtered Media Gallery */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#89847C]">
          Loading workshop craftsmanship archives...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#EAE2D6] space-y-2">
          <Wrench className="w-8 h-8 mx-auto text-[#B99A68]/60" />
          <h4 className="text-sm font-bold text-[#262421]">No Media in this Category Yet</h4>
          <p className="text-xs text-[#89847C]">
            Our master artisans are actively working on new furniture pieces. Check back soon or view all craftsmanship stages.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isVideo = item.mediaType === 'video';
            return (
              <div
                key={item.id}
                onClick={() => {
                  setVideoPlaybackError(false);
                  setVideoIsBuffering(true);
                  setActiveMediaItem(item);
                }}
                className="bg-white rounded-2xl border border-[#EAE2D6] overflow-hidden shadow-sm flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform"
              >
                <div className="relative aspect-video bg-[#1A1816] overflow-hidden">
                  <img
                    src={item.thumbnailUrl || (item.mediaType === 'photo' ? item.url : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80')}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {isVideo ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-[#B99A68] text-slate-950 flex items-center justify-center shadow">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white">
                      <ImageIcon className="w-3 h-3" />
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-[#B99A68] uppercase tracking-wider backdrop-blur-sm">
                      {WORKSHOP_CATEGORIES.find((c) => c.id === item.category)?.label || 'Craft'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 space-y-1">
                  <h4 className="font-serif font-bold text-xs text-[#262421] line-clamp-1">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-[10px] text-[#89847C] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Workshop Guarantee Note */}
      <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE2D6] flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#B99A68] shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs">
          <strong className="text-[#262421] block font-bold">10-Year Structural Integrity Guarantee</strong>
          <p className="text-[11px] text-[#89847C] leading-relaxed">
            All pieces displayed in our workshop utilize seasoned, kilned hardwoods and premium mortise & tenon joints built to last generations.
          </p>
        </div>
      </div>

      {/* 6. In-App Video & Photo Lightbox Modal */}
      {activeMediaItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4"
          onClick={() => {
            setActiveMediaItem(null);
            setVideoPlaybackError(false);
          }}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between z-10 text-white" onClick={(e) => e.stopPropagation()}>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#B99A68] font-bold block">
                Saad Master Atelier Archive
              </span>
              <h3 className="text-sm font-bold text-white truncate max-w-[260px]">
                {activeMediaItem.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveMediaItem(null);
                setVideoPlaybackError(false);
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Media Viewport */}
          <div
            className="flex-1 flex items-center justify-center my-4"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMediaItem.mediaType === 'video' ? (
              <div className="w-full max-w-md aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">
                {videoIsBuffering && !videoPlaybackError && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 pointer-events-none gap-2">
                    <div className="w-7 h-7 border-2 border-[#B99A68] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-[#EAE2D6] font-mono">Connecting to Workshop Stream...</span>
                  </div>
                )}

                {videoPlaybackError ? (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
                    <span className="text-xs text-[#EAE2D6]">Craftsmanship video is currently syncing from Google Drive vault.</span>
                    <button
                      type="button"
                      onClick={() => setVideoPlaybackError(false)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#B99A68] text-slate-950 text-xs font-bold hover:bg-[#a68856] transition-colors"
                    >
                      Retry Stream
                    </button>
                  </div>
                ) : (
                  <video
                    key={activeMediaItem.id}
                    src={`/api/workshop/videos/${activeMediaItem.id}/stream`}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    onWaiting={() => setVideoIsBuffering(true)}
                    onCanPlay={() => setVideoIsBuffering(false)}
                    onError={() => {
                      setVideoIsBuffering(false);
                      setVideoPlaybackError(true);
                    }}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="max-w-md max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={activeMediaItem.url || activeMediaItem.thumbnailUrl}
                  alt={activeMediaItem.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Bottom Details */}
          <div
            className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl text-xs text-white space-y-2 max-w-md mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Badge variant="gold">
                {WORKSHOP_CATEGORIES.find((c) => c.id === activeMediaItem.category)?.label || 'Craftsmanship'}
              </Badge>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeMediaItem.createdAt ? new Date(activeMediaItem.createdAt).toLocaleDateString() : 'Active Production'}
              </span>
            </div>
            {activeMediaItem.description && (
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {activeMediaItem.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

