import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { mediaFiles, mediaCustomerAccess, mediaAccessLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initializeDatabase();
  const { id } = await params;
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return new NextResponse('Unauthorized: Sign in to access document.', { status: 401 });
  }

  const [file] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id)).limit(1);
  if (!file) {
    return new NextResponse('Document not found in cloud library.', { status: 404 });
  }

  // 1. Strict Visibility & Authorization Guard
  if (sessionUser.role === 'customer') {
    if (file.isPublished === 0) {
      return new NextResponse('Document is currently unpublished.', { status: 403 });
    }

    if (file.visibility === 'private') {
      return new NextResponse('Forbidden: Super Admin private document.', { status: 403 });
    }

    if (file.visibility === 'specific' && file.customerId !== sessionUser.id) {
      return new NextResponse('Forbidden: This document is assigned to another patron.', { status: 403 });
    }

    if (file.visibility === 'selected') {
      const [hasAccess] = await db
        .select()
        .from(mediaCustomerAccess)
        .where(
          and(
            eq(mediaCustomerAccess.mediaFileId, id),
            eq(mediaCustomerAccess.customerId, sessionUser.id)
          )
        )
        .limit(1);

      if (!hasAccess && file.customerId !== sessionUser.id) {
        return new NextResponse('Forbidden: You have not been granted access to this document.', { status: 403 });
      }
    }
  }

  // 2. Log Access Event
  try {
    await db.insert(mediaAccessLogs).values({
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mediaFileId: id,
      userId: sessionUser.id,
      userName: sessionUser.name,
      userRole: sessionUser.role,
      action: request.headers.get('range') ? 'stream' : 'view',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: request.headers.get('user-agent') || 'SaadApp',
      accessedAt: new Date().toISOString(),
    });
  } catch {}

  // 3. Serve Data URI Buffer (Instant High Performance)
  const sourceUrl = file.webContentLink || file.webViewLink;

  if (sourceUrl?.startsWith('data:')) {
    const [metaPart, base64Part] = sourceUrl.split(';base64,');
    const mime = metaPart.replace('data:', '') || file.mimeType || 'application/octet-stream';
    const buffer = Buffer.from(base64Part, 'base64');
    const fileSize = buffer.length;

    const rangeHeader = request.headers.get('range');
    if (rangeHeader && file.mediaType === 'video') {
      // Parse Range: bytes=start-end
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const sliced = buffer.subarray(start, end + 1);

      return new NextResponse(sliced, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': mime,
        },
      });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'Content-Disposition': `inline; filename="${file.fileName}"`,
      },
    });
  }

  // 4. Remote URL Stream (Google Drive or External Stream)
  if (sourceUrl) {
    try {
      const rangeHeader = request.headers.get('range');
      const fetchHeaders: HeadersInit = {};
      if (rangeHeader) {
        fetchHeaders['Range'] = rangeHeader;
      }

      const remoteRes = await fetch(sourceUrl, { headers: fetchHeaders });
      const responseHeaders = new Headers(remoteRes.headers);
      responseHeaders.set('Content-Type', file.mimeType || 'application/pdf');
      responseHeaders.set('Content-Disposition', `inline; filename="${file.fileName}"`);

      return new NextResponse(remoteRes.body, {
        status: remoteRes.status,
        headers: responseHeaders,
      });
    } catch (e) {
      console.error('Remote proxy streaming error:', e);
    }
  }

  return new NextResponse('File stream content unavailable', { status: 404 });
}
