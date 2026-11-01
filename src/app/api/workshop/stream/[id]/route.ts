import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { workshopMedia, mediaFiles } from '@/lib/db/schema';
import { getValidAccessToken, isDriveConnected } from '@/lib/storage/google-drive';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;

    // 1. Find workshop media record
    let [item] = await db
      .select()
      .from(workshopMedia)
      .where(eq(workshopMedia.id, id))
      .limit(1);

    // Fallback: check mediaFiles if not in workshopMedia
    let mediaFile: any = null;
    if (!item) {
      const [mf] = await db
        .select()
        .from(mediaFiles)
        .where(eq(mediaFiles.id, id))
        .limit(1);
      if (mf) {
        mediaFile = mf;
      }
    }

    if (!item && !mediaFile) {
      return new NextResponse('Workshop video not found', { status: 404 });
    }

    let driveFileId = item?.googleDriveFileId || mediaFile?.googleDriveFileId || null;
    const mediaUrl = item?.url || mediaFile?.webViewLink || mediaFile?.webContentLink || '';
    const mimeType = item?.mediaType === 'photo' ? 'image/jpeg' : 'video/mp4';

    // Auto-extract Google Drive file ID if not explicitly saved
    if (!driveFileId && mediaUrl) {
      const match = mediaUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || mediaUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        driveFileId = match[1];
      }
    }

    // 2. Stream from connected Google Drive if file ID is available
    if (driveFileId && !driveFileId.startsWith('local_')) {
      const connected = await isDriveConnected();
      if (connected) {
        try {
          const accessToken = await getValidAccessToken();
          const rangeHeader = request.headers.get('range');

          const fetchHeaders: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
          };
          if (rangeHeader) {
            fetchHeaders['Range'] = rangeHeader;
          }

          const driveRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
            { headers: fetchHeaders }
          );

          if (driveRes.ok || driveRes.status === 206) {
            const responseHeaders = new Headers();
            
            // Forward essential streaming headers
            responseHeaders.set('Content-Type', driveRes.headers.get('Content-Type') || mimeType);
            responseHeaders.set('Accept-Ranges', 'bytes');
            
            const contentLength = driveRes.headers.get('Content-Length');
            if (contentLength) {
              responseHeaders.set('Content-Length', contentLength);
            }

            const contentRange = driveRes.headers.get('Content-Range');
            if (contentRange) {
              responseHeaders.set('Content-Range', contentRange);
            }

            responseHeaders.set('Cache-Control', 'private, max-age=3600');

            return new NextResponse(driveRes.body, {
              status: driveRes.status,
              headers: responseHeaders,
            });
          } else {
            console.warn(`Google Drive stream status ${driveRes.status}, falling back to remote URL`);
          }
        } catch (driveErr) {
          console.error('Google Drive streaming error, attempting fallback:', driveErr);
        }
      }
    }

    // 3. Handle base64 / data URL fallback
    if (mediaUrl.startsWith('data:')) {
      const [metaPart, base64Part] = mediaUrl.split(';base64,');
      const detectedMime = metaPart.replace('data:', '') || mimeType;
      const buffer = Buffer.from(base64Part, 'base64');
      const totalSize = buffer.length;

      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
        const chunkSize = end - start + 1;
        const chunk = buffer.subarray(start, end + 1);

        return new NextResponse(chunk, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': detectedMime,
          },
        });
      }

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': detectedMime,
          'Content-Length': totalSize.toString(),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 4. Remote URL Stream (Proxy with Range header support)
    if (mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'))) {
      const rangeHeader = request.headers.get('range');
      const fetchHeaders: HeadersInit = {};
      if (rangeHeader) {
        fetchHeaders['Range'] = rangeHeader;
      }

      const remoteRes = await fetch(mediaUrl, { headers: fetchHeaders });
      const responseHeaders = new Headers(remoteRes.headers);
      responseHeaders.set('Content-Type', mimeType);
      responseHeaders.set('Accept-Ranges', 'bytes');
      responseHeaders.set('Cache-Control', 'public, max-age=86400');

      return new NextResponse(remoteRes.body, {
        status: remoteRes.status,
        headers: responseHeaders,
      });
    }

    return new NextResponse('Workshop media stream source unavailable', { status: 404 });
  } catch (err: any) {
    console.error('Workshop video streaming endpoint error:', err);
    return new NextResponse('Error streaming workshop video', { status: 500 });
  }
}
