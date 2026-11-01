import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { mediaFiles, orders, orderTimelineEvents, auditLogs } from '@/lib/db/schema';
import { googleDriveService } from '@/lib/services/googleDrive';
import { fcmService } from '@/lib/services/fcm';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const customerId = searchParams.get('customerId');

  let queryConditions: any[] = [];

  if (sessionUser.role === 'customer') {
    // Strictly isolate customer data
    queryConditions.push(eq(mediaFiles.customerId, sessionUser.id));
  } else {
    // Admin / Staff filters
    if (orderId) queryConditions.push(eq(mediaFiles.orderId, orderId));
    if (customerId) queryConditions.push(eq(mediaFiles.customerId, customerId));
  }

  const files = await db
    .select()
    .from(mediaFiles)
    .where(queryConditions.length > 0 ? and(...queryConditions) : undefined)
    .orderBy(desc(mediaFiles.uploadedAt));

  // Calculate storage usage
  const totalBytes = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
  const totalPhotos = files.filter((f) => f.mediaType === 'photo').length;
  const totalVideos = files.filter((f) => f.mediaType === 'video').length;

  return NextResponse.json({
    files,
    metrics: {
      totalFiles: files.length,
      totalPhotos,
      totalVideos,
      totalBytes,
      formattedSize: `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`,
      driveCapacity: 'Cloud Storage Tier (High-Capacity)',
    },
  });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (sessionUser.role !== 'super_admin' && !sessionUser.permissions.includes('media')) {
    return NextResponse.json({ error: 'Permission denied to upload media.' }, { status: 403 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      // JSON upload (for direct links / camera capture)
      const body = await request.json();
      const { orderId, title, description, stage, mediaType = 'photo', url, duration } = body;

      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

      const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      await db.insert(mediaFiles).values({
        id,
        orderId,
        customerId: order.customerId,
        googleDriveFileId: `gdrive_ext_${Date.now()}`,
        fileName: `${title.replace(/\s+/g, '_')}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
        mimeType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        fileSize: mediaType === 'video' ? 25000000 : 3500000,
        mediaType,
        title,
        description: description || null,
        stage: stage || order.productionStage,
        thumbnailUrl: url,
        videoDuration: duration || (mediaType === 'video' ? 35 : null),
        webViewLink: url,
        webContentLink: url,
        uploadedBy: sessionUser.name,
        uploadedAt: now,
      });

      return NextResponse.json({ success: true, fileId: id });
    }

    // Multipart/form-data upload (supporting multiple files)
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const stage = (formData.get('stage') as string) || 'frame_preparation';
    const description = (formData.get('description') as string) || '';
    const title = (formData.get('title') as string) || 'Artisan Workshop Milestone';

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload.' }, { status: 400 });
    }

    const uploadedRecords = [];
    const now = new Date().toISOString();

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4');
      const mediaType: 'photo' | 'video' = isVideo ? 'video' : 'photo';

      // Upload to Google Drive 5TB Storage provider
      const driveFile = await googleDriveService.uploadBuffer(buffer, file.name, file.type);
      const fileId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await db.insert(mediaFiles).values({
        id: fileId,
        orderId,
        customerId: order.customerId,
        googleDriveFileId: driveFile.id,
        fileName: driveFile.name,
        mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        fileSize: file.size,
        mediaType,
        title: title || file.name,
        description: description || null,
        stage,
        thumbnailUrl: isVideo
          ? driveFile.id && !driveFile.id.startsWith('gdrive_vault_')
            ? `https://drive.google.com/thumbnail?id=${driveFile.id}&sz=w800`
            : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
          : driveFile.webViewLink,
        videoDuration: isVideo ? 30.0 : null,
        webViewLink: driveFile.webViewLink,
        webContentLink: driveFile.webContentLink,
        uploadedBy: sessionUser.name,
        uploadedAt: now,
      });

      uploadedRecords.push({ id: fileId, name: driveFile.name, type: mediaType });
    }

    // Add order timeline event
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_media`,
      orderId,
      title: `${files.length} New Workshop Media Uploaded`,
      description: `${files.length} verified photographic/video records added for stage [${stage}].`,
      stage,
      eventType: 'production',
      performedBy: sessionUser.name,
      createdAt: now,
    });

    // Notify customer
    await fcmService.sendNotification({
      userId: order.customerId,
      title: `New Workshop Media: ${order.orderNumber}`,
      message: `${files.length} new photos and artisan videos have been uploaded to your personal vault for order ${order.orderNumber}.`,
      type: 'media_uploaded',
      relatedOrderId: orderId,
    });

    // Audit log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'UPLOAD_MEDIA_FILES',
      details: `Uploaded ${files.length} media files for order [${order.orderNumber}]`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      count: uploadedRecords.length,
      files: uploadedRecords,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Failed to process media upload.' }, { status: 500 });
  }
}

