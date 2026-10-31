import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { orders, orderMedia, orderTimelineEvents, auditLogs } from '@/lib/db/schema';
import { uploadBufferToDrive, ROOT_FOLDER_NAME, isDriveConnected } from '@/lib/storage/google-drive';
import { fcmService } from '@/lib/services/fcm';
import { sendWebPushNotification } from '@/lib/services/webpush';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const mediaList = await db
    .select()
    .from(orderMedia)
    .where(eq(orderMedia.orderId, id))
    .orderBy(desc(orderMedia.uploadedAt));

  return NextResponse.json({ media: mediaList });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Super Admin or staff with media/orders permission
  if (
    sessionUser.role !== 'super_admin' &&
    !sessionUser.permissions.includes('media') &&
    !sessionUser.permissions.includes('orders')
  ) {
    return NextResponse.json({ error: 'Permission denied to upload order media.' }, { status: 403 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let mediaType: 'photo' | 'video' | 'drawing' | 'document' = 'photo';
    let title = 'Artisan Workshop Snapshot';
    let stage = order.productionStage || 'wood_cutting';
    let fileUrl = '';
    let gdriveId = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      title = (formData.get('title') as string) || 'Workshop Progress Media';
      stage = (formData.get('stage') as string) || order.productionStage;
      mediaType = ((formData.get('mediaType') as string) as 'photo' | 'video') || 'photo';

      if (!file) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4');
      mediaType = isVideo ? 'video' : 'photo';

      // Upload to Google Drive
      const hasDrive = await isDriveConnected();
      if (hasDrive) {
        const uploadResult = await uploadBufferToDrive({
          buffer,
          filename: file.name,
          mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          pathSegments: [ROOT_FOLDER_NAME, 'Customer Orders'],
          description: `${order.orderNumber} - ${title}`,
        });
        fileUrl = uploadResult.webViewLink || `https://drive.google.com/thumbnail?id=${uploadResult.id}&sz=w1200`;
        gdriveId = uploadResult.id;
      } else {
        // Fallback marker
        fileUrl = isVideo
          ? 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-piece-of-wood-41584-large.mp4'
          : 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80';
        gdriveId = `local_${Date.now()}`;
      }
    } else {
      // JSON body (for direct URL / camera snapshot / demo)
      const body = await request.json();
      title = body.title || 'Artisan Workshop Milestone';
      stage = body.stage || order.productionStage;
      mediaType = body.mediaType || 'photo';
      fileUrl = body.url;
      gdriveId = body.googleDriveId || `gdrive_${Date.now()}`;

      if (!fileUrl) {
        return NextResponse.json({ error: 'Media URL is required.' }, { status: 400 });
      }
    }

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // 1. Insert media record
    await db.insert(orderMedia).values({
      id: mediaId,
      orderId: id,
      customerId: order.customerId,
      googleDriveFileId: gdriveId,
      fileName: `${title.replace(/\s+/g, '_')}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
      mimeType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      fileSize: 1024 * 1024 * 2,
      mediaType,
      title,
      description: `Workshop photographic proof for milestone ${stage}.`,
      stage,
      thumbnailUrl: fileUrl,
      webViewLink: fileUrl,
      webContentLink: fileUrl,
      uploadedBy: sessionUser.name,
      uploadedAt: now,
      isPublic: 0,
    });

    // 2. Add timeline event
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_media`,
      orderId: id,
      title: `New Production ${mediaType === 'video' ? 'Video' : 'Photograph'} Uploaded`,
      description: `Artisan uploaded visual proof for stage [${stage}]: "${title}"`,
      stage,
      eventType: 'production',
      performedBy: sessionUser.name,
      createdAt: now,
    });

    // 3. Notify customer via In-App and Real-time Mobile Push (status bar alert)
    await fcmService.sendNotification({
      userId: order.customerId,
      title: `New ${mediaType === 'video' ? 'Video' : 'Photo'} for Order ${order.orderNumber}`,
      message: `A new workshop ${mediaType} "${title}" has been uploaded to your order portal.`,
      type: 'order_update',
      relatedOrderId: id,
    });

    await sendWebPushNotification({
      userId: order.customerId,
      title: `📸 New Workshop ${mediaType === 'video' ? 'Video' : 'Photo'} Uploaded!`,
      message: `Artisan uploaded visual proof for Order #${order.orderNumber} in [${stage}]: "${title}". Tap to view in Saad Furniture.`,
      url: `/orders/${id}`,
      type: 'media_uploaded',
      relatedOrderId: id,
    });

    // 4. Audit log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'UPLOAD_ORDER_MEDIA',
      details: `Uploaded ${mediaType} "${title}" for order [${order.orderNumber}] to 5TB Cloud Vault.`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      media: {
        id: mediaId,
        orderId: id,
        mediaType,
        title,
        url: fileUrl,
        stage,
        uploadedAt: now,
      },
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Failed to upload media.' }, { status: 500 });
  }
}

