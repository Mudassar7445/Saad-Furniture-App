import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { mediaFiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [media] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
  if (!media) {
    return new NextResponse('Media not found', { status: 404 });
  }

  // Security check: Only require authentication for private customer media
  const isPublicMedia = media.isPublic === 1 || media.visibility === 'public' || media.productId != null;
  if (!isPublicMedia) {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    if (sessionUser.role === 'customer' && media.customerId !== sessionUser.id) {
      return new NextResponse('Forbidden: Access to private patron media denied', { status: 403 });
    }
  }

  // If media is a data URL (local fallback):
  if (media.webContentLink?.startsWith('data:')) {
    const [metaPart, base64Part] = media.webContentLink.split(';base64,');
    const mime = metaPart.replace('data:', '');
    const buffer = Buffer.from(base64Part, 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        'Accept-Ranges': 'bytes',
      },
    });
  }

  // If remote URL (e.g. video sample or Google Drive stream)
  const remoteUrl = media.webContentLink || media.webViewLink;
  if (!remoteUrl) {
    return new NextResponse('Media stream unavailable', { status: 500 });
  }

  try {
    const rangeHeader = request.headers.get('range');
    const fetchHeaders: HeadersInit = {};
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(remoteUrl, { headers: fetchHeaders });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Cache-Control', 'public, max-age=86400');
    responseHeaders.set('Content-Type', media.mimeType || 'video/mp4');

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Media proxy stream error:', error);
    return new NextResponse('Error streaming media', { status: 500 });
  }
}

