/**
 * Video Thumbnail Generator Utility
 * Extracts a lightweight (20–50 KB) WebP thumbnail from any video file in the browser
 * with zero server roundtrips, optimized for mobile cards and instant rendering.
 */

export const LUXURY_WORKSHOP_CATEGORY_THUMBNAILS: Record<string, string> = {
  furniture_manufacturing: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  wood_cutting_prep: 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=800&q=80',
  frame_making: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  sofa_manufacturing: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  foam_work: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  fabric_stitching: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  upholstery: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  polishing_finishing: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  quality_inspection: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  completed_furniture: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  behind_the_scenes: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  workshop_tour: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  sofa_frame: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  woodworking: 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=800&q=80',
  completed_products: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  general: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
};

/**
 * Captures an optimized WebP thumbnail from a video file.
 * Returns a File ready to append to FormData, or null if unsupported.
 */
export async function captureVideoThumbnail(
  videoFile: File,
  targetWidth = 640,
  quality = 0.82
): Promise<File | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;

      const objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          video.remove();
        } catch {}
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 6000); // 6 second safety timeout

      let hasSeeked = false;
      const doSeek = () => {
        if (hasSeeked) return;
        hasSeeked = true;
        const dur = video.duration && !isNaN(video.duration) ? video.duration : 2;
        const seekTime = Math.min(1.5, Math.max(0.5, dur * 0.15));
        video.currentTime = seekTime;
      };

      video.onloadedmetadata = doSeek;
      video.onloadeddata = doSeek;

      video.onseeked = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          const aspect = (video.videoWidth || 16) / (video.videoHeight || 9);
          canvas.width = targetWidth;
          canvas.height = Math.round(targetWidth / aspect);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            resolve(null);
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) {
                const cleanName = videoFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
                const thumbFile = new File([blob], `thumb_${cleanName}.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(thumbFile);
              } else {
                // Fallback to JPEG if WebP encoding unsupported
                canvas.toBlob((jpegBlob) => {
                  if (jpegBlob) {
                    const cleanName = videoFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
                    resolve(new File([jpegBlob], `thumb_${cleanName}.jpg`, { type: 'image/jpeg' }));
                  } else {
                    resolve(null);
                  }
                }, 'image/jpeg', 0.85);
              }
            },
            'image/webp',
            quality
          );
        } catch {
          cleanup();
          resolve(null);
        }
      };

      video.onerror = () => {
        clearTimeout(timer);
        cleanup();
        resolve(null);
      };

      video.load();
    } catch {
      resolve(null);
    }
  });
}

/**
 * Returns a guaranteed safe, non-video thumbnail URL for any media record.
 * Never returns an mp4 or streaming route.
 */
export function getSafeThumbnailUrl(
  item: {
    thumbnailUrl?: string | null;
    category?: string | null;
    mediaType?: string | null;
    googleDriveFileId?: string | null;
    id?: string;
  },
  defaultCategory = 'general'
): string {
  const raw = item.thumbnailUrl?.trim();

  // If raw points to a Google Drive web viewer or direct file link, transform to local authenticated image route
  if (raw && raw.includes('drive.google.com')) {
    const driveMatch = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      return `/api/media/image/${driveMatch[1]}`;
    }
  }

  // If already a valid safe image URL
  if (
    raw &&
    !raw.startsWith('data:video/') &&
    !raw.includes('/stream/') &&
    !raw.endsWith('.mp4') &&
    !raw.endsWith('.mov') &&
    !raw.endsWith('.avi')
  ) {
    return raw;
  }

  // Dedicated thumbnail route if item id is available
  if (item.id) {
    return `/api/media/thumbnail/${item.id}`;
  }

  // Fallback to luxury atelier category thumbnail
  const catKey = (item.category || defaultCategory).toLowerCase().replace(/\s+/g, '_');
  return LUXURY_WORKSHOP_CATEGORY_THUMBNAILS[catKey] || LUXURY_WORKSHOP_CATEGORY_THUMBNAILS.general;
}
