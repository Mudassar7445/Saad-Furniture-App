import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { mediaFiles } from '@/lib/db/schema';
import { getValidAccessToken, isDriveConnected } from '@/lib/storage/google-drive';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    if (!id) {
      return new NextResponse('Bad request', { status: 400 });
    }

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

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mime,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Google Drive File ID — Server-side Authorized Stream
    if (media.googleDriveFileId && !media.googleDriveFileId.startsWith('local_')) {
      try {
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
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': media.mimeType || 'image/jpeg',
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
              },
            });
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
          return new NextResponse(upstreamBuffer, {
            headers: {
              'Content-Type': upstream.headers.get('content-type') || media.mimeType || 'image/jpeg',
              'Content-Length': upstreamBuffer.length.toString(),
              'Cache-Control': 'public, max-age=86400',
            },
          });
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

