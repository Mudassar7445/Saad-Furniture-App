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

    // Fallback: check mediaFiles table if not in workshopMedia
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
      return NextResponse.json({ error: 'Workshop video not found' }, { status: 404 });
    }

    let driveFileId = item?.googleDriveFileId || mediaFile?.googleDriveFileId || null;
    const mediaUrl = item?.url || mediaFile?.webViewLink || mediaFile?.webContentLink || '';
    const mimeType = item?.mediaType === 'photo' ? 'image/jpeg' : 'video/mp4';

    // Auto-extract Google Drive ID from URL if driveFileId not set explicitly
    if (!driveFileId && mediaUrl) {
      const match = mediaUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || mediaUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        driveFileId = match[1];
      }
    }

    const rangeHeader = request.headers.get('range');

    // 2. Stream from connected Google Drive if file ID is available
    if (driveFileId && !driveFileId.startsWith('local_')) {
      const connected = await isDriveConnected();
      if (connected) {
        try {
          const accessToken = await getValidAccessToken();

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
            
            // Explicitly set video streaming headers required by Android Chrome & Desktop Chrome
            responseHeaders.set('Content-Type', mimeType);
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
            console.warn(`[Workshop Stream] Google Drive returned status ${driveRes.status} for file ${driveFileId}`);
          }
        } catch (driveErr) {
          console.error('[Workshop Stream] Google Drive error:', driveErr);
        }
      }
    }

    // 3. Handle direct MP4 / WebM remote URL fallback (Proxy with Range header support)
    if (
      mediaUrl &&
      (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) &&
      !mediaUrl.includes('drive.google.com')
    ) {
      const fetchHeaders: HeadersInit = {};
      if (rangeHeader) {
        fetchHeaders['Range'] = rangeHeader;
      }

      const remoteRes = await fetch(mediaUrl, { headers: fetchHeaders });
      
      // Ensure we only stream if the upstream response is valid video/audio
      if (remoteRes.ok || remoteRes.status === 206) {
        const upstreamType = remoteRes.headers.get('content-type') || '';
        // If upstream returned error XML / HTML, do not send it as video!
        if (!upstreamType.includes('xml') && !upstreamType.includes('html')) {
          const responseHeaders = new Headers();
          responseHeaders.set('Content-Type', mimeType);
          responseHeaders.set('Accept-Ranges', 'bytes');
          
          const cl = remoteRes.headers.get('Content-Length');
          if (cl) responseHeaders.set('Content-Length', cl);
          
          const cr = remoteRes.headers.get('Content-Range');
          if (cr) responseHeaders.set('Content-Range', cr);
          
          responseHeaders.set('Cache-Control', 'public, max-age=86400');

          return new NextResponse(remoteRes.body, {
            status: remoteRes.status,
            headers: responseHeaders,
          });
        }
      }
    }

    // 4. Clean error when stream is not available
    return NextResponse.json(
      { error: 'Video stream is currently being prepared or unavailable.' },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('[Workshop Stream] Server error:', err);
    return NextResponse.json(
      { error: 'Error processing workshop video stream' },
      { status: 500 }
    );
  }
}

