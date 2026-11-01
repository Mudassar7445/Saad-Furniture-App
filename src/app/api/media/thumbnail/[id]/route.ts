import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { mediaFiles, workshopMedia } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { LUXURY_WORKSHOP_CATEGORY_THUMBNAILS } from '@/lib/media/videoThumbnail';

export const dynamic = 'force-dynamic';

interface CachedThumb {
  buffer: Buffer;
  mime: string;
  cachedAt: number;
}

const thumbnailMemoryCache = new Map<string, CachedThumb>();
const MAX_CACHE_SIZE = 150;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('Bad request', { status: 400 });
    }

    // 0. Check in-memory thumbnail cache
    const cached = thumbnailMemoryCache.get(id);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        headers: {
          'Content-Type': cached.mime,
          'Content-Length': cached.buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Thumbnail-Cache': 'HIT',
        },
      });
    }

    await initializeDatabase();

    // 1. Look up mediaFiles or workshopMedia
    const [media] = await db
      .select({
        id: mediaFiles.id,
        googleDriveFileId: mediaFiles.googleDriveFileId,
        thumbnailUrl: mediaFiles.thumbnailUrl,
        category: mediaFiles.category,
        mediaType: mediaFiles.mediaType,
      })
      .from(mediaFiles)
      .where(or(eq(mediaFiles.id, id), eq(mediaFiles.googleDriveFileId, id)))
      .limit(1);

    let driveId: string | null = media?.googleDriveFileId || null;
    let rawThumb: string | null = media?.thumbnailUrl || null;
    let category: string = media?.category || 'general';

    if (!media) {
      const [wsMedia] = await db
        .select({
          id: workshopMedia.id,
          googleDriveFileId: workshopMedia.googleDriveFileId,
          thumbnailUrl: workshopMedia.thumbnailUrl,
          category: workshopMedia.category,
          mediaType: workshopMedia.mediaType,
        })
        .from(workshopMedia)
        .where(eq(workshopMedia.id, id))
        .limit(1);

      if (wsMedia) {
        driveId = wsMedia.googleDriveFileId || null;
        rawThumb = wsMedia.thumbnailUrl || null;
        category = wsMedia.category || 'general';
      }
    }

    // 2. Data URL Base64 image
    if (rawThumb && rawThumb.startsWith('data:image/')) {
      const [metaPart, base64Part] = rawThumb.split(';base64,');
      const mime = metaPart.replace('data:', '') || 'image/webp';
      const buffer = Buffer.from(base64Part, 'base64');
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': mime,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const cacheAndReturn = (buffer: Buffer, mime: string) => {
      if (thumbnailMemoryCache.size >= MAX_CACHE_SIZE) {
        const first = thumbnailMemoryCache.keys().next().value;
        if (first) thumbnailMemoryCache.delete(first);
      }
      thumbnailMemoryCache.set(id, { buffer, mime, cachedAt: Date.now() });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': mime,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Thumbnail-Cache': 'MISS',
        },
      });
    };

    // 3. Google Drive Fast CDN Thumbnail
    if (driveId && !driveId.startsWith('local_') && !driveId.startsWith('gdrive_vault_')) {
      try {
        const cdnUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
        const cdnRes = await fetch(cdnUrl, { next: { revalidate: 86400 } });
        if (cdnRes.ok) {
          const buf = Buffer.from(await cdnRes.arrayBuffer());
          if (buf.length > 500) {
            return cacheAndReturn(buf, cdnRes.headers.get('content-type') || 'image/webp');
          }
        }
      } catch (cdnErr) {
        console.warn('Thumbnail CDN proxy error:', cdnErr);
      }
    }

    // 4. Remote URL if valid image
    if (rawThumb && (rawThumb.startsWith('http://') || rawThumb.startsWith('https://'))) {
      if (!rawThumb.includes('/stream/') && !rawThumb.endsWith('.mp4')) {
        return NextResponse.redirect(rawThumb, 307);
      }
    }

    // 5. Luxury category still fallback
    const fallbackUrl =
      LUXURY_WORKSHOP_CATEGORY_THUMBNAILS[category.toLowerCase().replace(/\s+/g, '_')] ||
      LUXURY_WORKSHOP_CATEGORY_THUMBNAILS.general;

    return NextResponse.redirect(fallbackUrl, 307);
  } catch (e: any) {
    console.error('Thumbnail route error:', e);
    return new NextResponse('Error loading thumbnail', { status: 500 });
  }
}
