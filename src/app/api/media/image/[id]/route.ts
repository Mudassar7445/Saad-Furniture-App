import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { mediaFiles } from '@/lib/db/schema';
import { getValidAccessToken, isDriveConnected } from '@/lib/storage/google-drive';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface CachedImage {
  buffer: Buffer;
  mime: string;
  cachedAt: number;
}

// In-memory LRU-style image buffer cache for ultra-fast CDN/serverless delivery (<1ms)
const imageMemoryCache = new Map<string, CachedImage>();
const MAX_CACHE_SIZE = 120;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('Bad request', { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const isFull = searchParams.get('full') === 'true';
    const cacheKey = `${id}_${isFull ? 'full' : 'thumb'}`;

    // 0. Check in-memory buffer cache
    const cached = imageMemoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        headers: {
          'Content-Type': cached.mime,
          'Content-Length': cached.buffer.length.toString(),
          'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400',
          'X-Image-Cache': 'HIT',
        },
      });
    }

    await initializeDatabase();

    // Look up by media id or google_drive_file_id
    const [media] = await db
      .select()
      .from(mediaFiles)
      .where(or(eq(mediaFiles.id, id), eq(mediaFiles.googleDriveFileId, id)))
      .limit(1);

    if (!media) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // 1. Data URL / Base64 binary
    const dataCandidate = media.thumbnailUrl?.startsWith('data:')
      ? media.thumbnailUrl
      : media.webContentLink?.startsWith('data:')
      ? media.webContentLink
      : null;

    if (dataCandidate) {
      const [metaPart, base64Part] = dataCandidate.split(';base64,');
      const mime = metaPart.replace('data:', '') || media.mimeType || 'image/jpeg';
      const buffer = Buffer.from(base64Part, 'base64');

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': mime,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Helper to store into memory cache safely
    const cacheAndReturn = (buffer: Buffer, mime: string) => {
      if (imageMemoryCache.size >= MAX_CACHE_SIZE) {
        const firstKey = imageMemoryCache.keys().next().value;
        if (firstKey) imageMemoryCache.delete(firstKey);
      }
      imageMemoryCache.set(cacheKey, {
        buffer,
        mime,
        cachedAt: Date.now(),
      });

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': mime,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=2592000, stale-while-revalidate=86400',
          'X-Image-Cache': 'MISS',
        },
      });
    };

    // 2. Google Drive File ID — Ultra-fast thumbnail vs High-res binary
    if (media.googleDriveFileId && !media.googleDriveFileId.startsWith('local_')) {
      try {
        // FAST THUMBNAIL PATH: When ?full is not requested, fetch Google's optimized compressed thumbnail (sz=w800)
        // This drops network payload from 15MB down to ~80KB, loading in <50ms instead of 4 seconds
        if (!isFull) {
          try {
            const thumbUrl = `https://drive.google.com/thumbnail?id=${media.googleDriveFileId}&sz=w800`;
            const thumbRes = await fetch(thumbUrl, { next: { revalidate: 86400 } });
            if (thumbRes.ok) {
              const arrayBuffer = await thumbRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              if (buffer.length > 500) {
                return cacheAndReturn(buffer, thumbRes.headers.get('content-type') || 'image/jpeg');
              }
            }
          } catch (thumbErr) {
            console.warn('Fast Google Drive thumbnail fetch fallback:', thumbErr);
          }
        }

        // FULL IMAGE PATH OR AUTHENTICATED DIRECT DOWNLOAD
        const driveConnected = await isDriveConnected();
        if (driveConnected) {
          const token = await getValidAccessToken();
          const driveRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${media.googleDriveFileId}?alt=media`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (driveRes.ok) {
            const arrayBuffer = await driveRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return cacheAndReturn(buffer, media.mimeType || 'image/jpeg');
          }
        }
      } catch (driveErr) {
        console.warn('Google Drive direct fetch error, falling back:', driveErr);
      }
    }

    // 3. Remote URL Redirect or Proxy
    const remoteUrl = media.thumbnailUrl || media.webContentLink || media.webViewLink;
    if (remoteUrl && (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))) {
      try {
        const upstream = await fetch(remoteUrl);
        if (upstream.ok) {
          const upstreamBuffer = Buffer.from(await upstream.arrayBuffer());
          const mime = upstream.headers.get('content-type') || media.mimeType || 'image/jpeg';
          return cacheAndReturn(upstreamBuffer, mime);
        }
      } catch {
        return NextResponse.redirect(remoteUrl, 307);
      }
    }

    return new NextResponse('Media content unavailable', { status: 404 });
  } catch (err: any) {
    console.error('Image proxy route error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
