import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { mediaFiles, workshopMedia } from '@/lib/db/schema';
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

    await initializeDatabase();

    // 1. Look up by media id or google_drive_file_id in mediaFiles
    const [media] = await db
      .select()
      .from(mediaFiles)
      .where(or(eq(mediaFiles.id, id), eq(mediaFiles.googleDriveFileId, id)))
      .limit(1);

    if (media) {
      // Data URL / Base64 binary
      const dataCandidate = media.thumbnailUrl?.startsWith('data:')
        ? media.thumbnailUrl
        : media.webContentLink?.startsWith('data:')
        ? media.webContentLink
        : null;

      if (dataCandidate) {
        const [metaPart, base64Part] = dataCandidate.split(';base64,');
        const mime = metaPart.replace('data:', '') || media.mimeType || 'image/jpeg';
        const buffer = Buffer.from(base64Part, 'base64');
        return cacheAndReturn(buffer, mime);
      }

      // Google Drive file ID
      if (media.googleDriveFileId && !media.googleDriveFileId.startsWith('local_')) {
        // High-speed CDN thumbnail path for mobile galleries and responsive cards (95% bandwidth reduction)
        if (!isFull) {
          try {
            const cdnUrl = `https://drive.google.com/thumbnail?id=${media.googleDriveFileId}&sz=w800`;
            const cdnRes = await fetch(cdnUrl, { next: { revalidate: 86400 } });
            if (cdnRes.ok) {
              const buf = Buffer.from(await cdnRes.arrayBuffer());
              if (buf.length > 500) {
                return cacheAndReturn(buf, cdnRes.headers.get('content-type') || 'image/webp');
              }
            }
          } catch (cdnErr) {
            console.warn('Fast Drive thumbnail CDN warning:', cdnErr);
          }
        }

        const driveConnected = await isDriveConnected();
        if (driveConnected) {
          try {
            const token = await getValidAccessToken();
            const driveRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${media.googleDriveFileId}?alt=media`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (driveRes.ok) {
              const arrayBuffer = await driveRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              return cacheAndReturn(buffer, driveRes.headers.get('content-type') || media.mimeType || 'image/jpeg');
            }
          } catch (e) {
            console.warn('Media file drive fetch warning:', e);
          }
        }
      }

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
    }

    // 2. Look up in workshopMedia
    const [wsMedia] = await db
      .select()
      .from(workshopMedia)
      .where(or(eq(workshopMedia.id, id), eq(workshopMedia.googleDriveFileId, id)))
      .limit(1);

    if (wsMedia) {
      if (wsMedia.thumbnailUrl && wsMedia.thumbnailUrl.startsWith('data:image/')) {
        const [metaPart, base64Part] = wsMedia.thumbnailUrl.split(';base64,');
        const mime = metaPart.replace('data:', '') || 'image/webp';
        const buffer = Buffer.from(base64Part, 'base64');
        return cacheAndReturn(buffer, mime);
      }

      // Check if workshop media has an extracted thumbnail drive ID
      const thumbDriveMatch = wsMedia.thumbnailUrl?.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const targetDriveId = thumbDriveMatch ? thumbDriveMatch[1] : wsMedia.googleDriveFileId;

      if (targetDriveId && !targetDriveId.startsWith('local_')) {
        if (!isFull) {
          try {
            const cdnUrl = `https://drive.google.com/thumbnail?id=${targetDriveId}&sz=w800`;
            const cdnRes = await fetch(cdnUrl, { next: { revalidate: 86400 } });
            if (cdnRes.ok) {
              const buf = Buffer.from(await cdnRes.arrayBuffer());
              if (buf.length > 500) {
                return cacheAndReturn(buf, cdnRes.headers.get('content-type') || 'image/webp');
              }
            }
          } catch {}
        }
        const driveConnected = await isDriveConnected();
        if (driveConnected) {
          try {
            const token = await getValidAccessToken();
            const driveRes = await fetch(
              `https://www.googleapis.com/drive/v3/files/${targetDriveId}?alt=media`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (driveRes.ok) {
              const arrayBuffer = await driveRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              return cacheAndReturn(buffer, driveRes.headers.get('content-type') || 'image/webp');
            }
          } catch (e) {
            console.warn('Workshop drive image fetch warning:', e);
          }
        }
      }
    }

    // 3. Direct Google Drive File ID (e.g. thumb_... Drive ID passed directly)
    if (/^[a-zA-Z0-9_-]{20,}$/.test(id)) {
      if (!isFull) {
        try {
          const cdnUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
          const cdnRes = await fetch(cdnUrl, { next: { revalidate: 86400 } });
          if (cdnRes.ok) {
            const buf = Buffer.from(await cdnRes.arrayBuffer());
            if (buf.length > 500) {
              return cacheAndReturn(buf, cdnRes.headers.get('content-type') || 'image/webp');
            }
          }
        } catch {}
      }
      const driveConnected = await isDriveConnected();
      if (driveConnected) {
        try {
          const token = await getValidAccessToken();
          const driveRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (driveRes.ok) {
            const arrayBuffer = await driveRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return cacheAndReturn(buffer, driveRes.headers.get('content-type') || 'image/webp');
          }
        } catch (e) {
          console.warn('Direct Google Drive file ID fetch error:', e);
        }
      }
    }

    return new NextResponse('Image not found', { status: 404 });
  } catch (err: any) {
    console.error('Image proxy route error:', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
