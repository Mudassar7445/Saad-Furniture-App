import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import {
  orders,
  orderItems,
  mediaFiles,
  mediaOrderAccess,
  orderTimelineEvents,
  auditLogs,
} from '@/lib/db/schema';
import {
  uploadBufferToDrive,
  ROOT_FOLDER_NAME,
  isDriveConnected,
} from '@/lib/storage/google-drive';
import { fcmService } from '@/lib/services/fcm';
import { sendWebPushNotification } from '@/lib/services/webpush';
import { eq, desc, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Customers can only see their own order
    if (sessionUser.role === 'customer' && order.customerId !== sessionUser.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // 1. Fetch direct order media records
    const directMedia = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.orderId, id));

    // 2. Fetch media linked through mediaOrderAccess junction
    let linkedMedia: any[] = [];
    try {
      const accessRecords = await db
        .select({ mediaFileId: mediaOrderAccess.mediaFileId })
        .from(mediaOrderAccess)
        .where(eq(mediaOrderAccess.orderId, id));

      const accessMediaIds = accessRecords
        .map((r) => r.mediaFileId)
        .filter((fileId): fileId is string => Boolean(fileId));

      if (accessMediaIds.length > 0) {
        linkedMedia = await db
          .select()
          .from(mediaFiles)
          .where(inArray(mediaFiles.id, accessMediaIds));
      }
    } catch (junctionErr) {
      console.warn('Error reading mediaOrderAccess junction in GET:', junctionErr);
    }

    // Deduplicate
    const mediaMap = new Map<string, any>();
    for (const m of directMedia) mediaMap.set(m.id, m);
    for (const m of linkedMedia) mediaMap.set(m.id, m);

    let combinedMedia = Array.from(mediaMap.values());

    // Customer privacy filtering
    if (sessionUser.role === 'customer') {
      combinedMedia = combinedMedia.filter(
        (m) =>
          m.visibility !== 'private' &&
          m.visibility !== 'admin_only' &&
          (m.isPublished === 1 || m.isPublished === undefined)
      );
    }

    // Sort newest first
    combinedMedia.sort(
      (a, b) =>
        new Date(b.uploadedAt || b.createdAt || 0).getTime() -
        new Date(a.uploadedAt || a.createdAt || 0).getTime()
    );

    return NextResponse.json({ media: combinedMedia });
  } catch (err: any) {
    console.error('Error in GET /api/orders/[id]/media:', err);
    return NextResponse.json({ error: 'Failed to fetch order media.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Staff or super admin check
    if (
      sessionUser.role !== 'super_admin' &&
      !sessionUser.permissions?.includes('media') &&
      !sessionUser.permissions?.includes('orders')
    ) {
      return NextResponse.json(
        { error: 'Permission denied to upload order crafting media.' },
        { status: 403 }
      );
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    const now = new Date().toISOString();
    const hasDrive = await isDriveConnected();
    const uploadedMediaList: any[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      // Collect files: can be multiple ('files') or single ('file')
      const filesFromForm = formData.getAll('files') as File[];
      const singleFile = formData.get('file') as File | null;
      const filesToProcess: File[] = [];

      if (filesFromForm && filesFromForm.length > 0) {
        for (const f of filesFromForm) {
          if (f && f.size > 0) filesToProcess.push(f);
        }
      }
      if (filesToProcess.length === 0 && singleFile && singleFile.size > 0) {
        filesToProcess.push(singleFile);
      }

      const thumbnailFile = formData.get('thumbnail') as File | null;
      const stage = (formData.get('stage') as string) || order.productionStage || 'frame_preparation';
      const productId = (formData.get('productId') as string) || null;
      const baseTitle = (formData.get('title') as string)?.trim() || '';
      const description = (formData.get('description') as string)?.trim() || null;
      const visibility = (formData.get('visibility') as string) || 'customer'; // 'customer' | 'public' | 'private'
      const isPublic = visibility === 'private' ? 0 : 1;

      // Also support progress update note without file if admin just wants to add a note
      if (filesToProcess.length === 0 && description) {
        const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const noteRecord = {
          id: noteId,
          orderId: id,
          customerId: order.customerId,
          productId,
          googleDriveFileId: `note_${Date.now()}`,
          fileName: `milestone_note_${stage}.txt`,
          originalName: 'Craftsmanship Note',
          mimeType: 'text/plain',
          fileSize: description.length,
          mediaType: 'document',
          category: 'progress_notes',
          title: baseTitle || `Craftsmanship Update — ${stage.replace(/_/g, ' ')}`,
          description,
          stage,
          visibility,
          isPublished: 1,
          downloadAllowed: 0,
          isPublic,
          uploadedBy: sessionUser.name,
          uploadedAt: now,
          updatedAt: now,
        };

        await db.insert(mediaFiles).values(noteRecord);
        await db.insert(mediaOrderAccess).values({
          id: `moa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          mediaFileId: noteId,
          orderId: id,
          createdAt: now,
        });

        // Add timeline event
        await db.insert(orderTimelineEvents).values({
          id: `tl_${Date.now()}_note`,
          orderId: id,
          title: `Artisan Progress Update [${stage.replace(/_/g, ' ')}]`,
          description: description,
          stage,
          eventType: 'production',
          performedBy: sessionUser.name,
          createdAt: now,
        });

        return NextResponse.json({
          success: true,
          uploaded: [noteRecord],
          message: 'Craftsmanship progress note recorded successfully.',
        });
      }

      if (filesToProcess.length === 0) {
        return NextResponse.json({ error: 'No files provided for upload.' }, { status: 400 });
      }

      for (let idx = 0; idx < filesToProcess.length; idx++) {
        const file = filesToProcess[idx];
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|avi|m4v|webm)$/i.test(file.name);
        const mediaType: 'photo' | 'video' | 'document' = isVideo ? 'video' : 'photo';

        let fileTitle = baseTitle;
        if (!fileTitle || filesToProcess.length > 1) {
          const itemNumber = filesToProcess.length > 1 ? ` (${idx + 1}/${filesToProcess.length})` : '';
          fileTitle = baseTitle
            ? `${baseTitle}${itemNumber}`
            : `Craftsmanship Proof — ${stage.replace(/_/g, ' ')}${itemNumber}`;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uniqueSuffix = `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        const mediaId = `media_${uniqueSuffix}`;
        const safeBaseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const safeFilename = `order_${order.orderNumber || id}_${stage}_${uniqueSuffix}_${safeBaseName}`;

        let driveFileId = `local_${uniqueSuffix}`;
        let fileUrl = '';
        let webViewLink = '';
        let webContentLink = '';
        let finalThumbnailUrl: string | null = null;

        if (hasDrive) {
          const driveResult = await uploadBufferToDrive({
            buffer,
            filename: safeFilename,
            mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
            pathSegments: [
              ROOT_FOLDER_NAME,
              'Customer Orders',
              order.orderNumber ? `Order #${order.orderNumber}` : id,
            ],
            description: `${order.orderNumber || id} - ${stage} - ${fileTitle}`,
          });

          driveFileId = driveResult.id;
          webViewLink = driveResult.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
          webContentLink = driveResult.webContentLink || `https://drive.google.com/uc?id=${driveFileId}&export=download`;
          fileUrl = isVideo ? `/api/media/${mediaId}/stream` : `/api/media/image/${mediaId}`;

          // Thumbnail for video if uploaded
          if (isVideo && thumbnailFile) {
            try {
              const thumbBytes = await thumbnailFile.arrayBuffer();
              const thumbBuf = Buffer.from(thumbBytes);
              const thumbUpload = await uploadBufferToDrive({
                buffer: thumbBuf,
                filename: `thumb_${safeFilename}.webp`,
                mimeType: thumbnailFile.type || 'image/webp',
                pathSegments: [ROOT_FOLDER_NAME, 'Customer Orders', 'Thumbnails'],
                description: `Thumbnail for ${fileTitle}`,
              });
              finalThumbnailUrl = `/api/media/image/${thumbUpload.id}`;
            } catch (tErr) {
              console.warn('Video thumbnail upload note:', tErr);
            }
          }

          if (!finalThumbnailUrl) {
            if (isVideo) {
              finalThumbnailUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w800`;
            } else {
              finalThumbnailUrl = `/api/media/image/${mediaId}`;
            }
          }
        } else {
          // Local dataUrl fallback
          const base64Data = buffer.toString('base64');
          const dataUrl = `data:${file.type || (isVideo ? 'video/mp4' : 'image/jpeg')};base64,${base64Data}`;
          fileUrl = dataUrl;
          webViewLink = dataUrl;
          webContentLink = dataUrl;
          finalThumbnailUrl = isVideo
            ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
            : dataUrl;
        }

        const mediaRecord = {
          id: mediaId,
          orderId: id,
          customerId: order.customerId,
          productId: productId || null,
          googleDriveFileId: driveFileId,
          fileName: safeFilename,
          originalName: file.name,
          mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          fileSize: buffer.length,
          mediaType,
          category: isVideo ? 'videos' : 'photographs',
          title: fileTitle,
          description: description || `Visual craftsmanship evidence for stage [${stage.replace(/_/g, ' ')}].`,
          stage,
          thumbnailUrl: finalThumbnailUrl,
          videoDuration: isVideo ? 60 : null,
          webViewLink,
          webContentLink,
          visibility,
          isPublished: 1,
          downloadAllowed: 1,
          isPublic,
          uploadedBy: sessionUser.name,
          uploadedAt: now,
          updatedAt: now,
        };

        // 1. Insert into mediaFiles
        await db.insert(mediaFiles).values(mediaRecord);

        // 2. Link into mediaOrderAccess junction
        await db.insert(mediaOrderAccess).values({
          id: `moa_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          mediaFileId: mediaId,
          orderId: id,
          createdAt: now,
        });

        uploadedMediaList.push(mediaRecord);
      }

      // Add timeline event for the upload batch
      const stageNameHuman = stage.replace(/_/g, ' ');
      const countText =
        uploadedMediaList.length === 1
          ? `1 new ${uploadedMediaList[0].mediaType}`
          : `${uploadedMediaList.length} new crafting media items`;

      await db.insert(orderTimelineEvents).values({
        id: `tl_${Date.now()}_media`,
        orderId: id,
        title: `Workshop Milestone Updated — ${stageNameHuman}`,
        description: `Artisan uploaded ${countText} for stage [${stageNameHuman}]: "${baseTitle || stageNameHuman}"`,
        stage,
        eventType: 'production',
        performedBy: sessionUser.name,
        createdAt: now,
      });

      // Dispatch Notifications to customer if visible
      if (visibility !== 'private') {
        try {
          await fcmService.sendNotification({
            userId: order.customerId,
            title: `📸 New Crafting Update for Order #${order.orderNumber}`,
            message: `Artisan uploaded ${countText} in stage [${stageNameHuman}]. Tap to view progress.`,
            type: 'order_update',
            relatedOrderId: id,
          });

          await sendWebPushNotification({
            userId: order.customerId,
            title: `📸 Craftsmanship Milestone — Order #${order.orderNumber}`,
            message: `New visual proof for [${stageNameHuman}] uploaded to your order portal.`,
            url: `/orders/${id}`,
            type: 'media_uploaded',
            relatedOrderId: id,
          });
        } catch (notifErr) {
          console.warn('Customer notification note:', notifErr);
        }
      }

      // Audit log
      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: 'UPLOAD_ORDER_MEDIA',
        details: `Uploaded ${uploadedMediaList.length} media items for Order #${order.orderNumber} in stage [${stageNameHuman}]. Visibility: ${visibility}`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        uploaded: uploadedMediaList,
        message: `Successfully uploaded ${uploadedMediaList.length} media file(s).`,
      });
    }

    // Direct JSON URL fallback
    const body = await request.json();
    const {
      title = 'Craftsmanship Snapshot',
      stage = order.productionStage || 'frame_preparation',
      mediaType = 'photo',
      url,
      productId = null,
      description = null,
      visibility = 'customer',
    } = body;

    if (!url) {
      return NextResponse.json({ error: 'Media URL is required.' }, { status: 400 });
    }

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isPublic = visibility === 'private' ? 0 : 1;

    const mediaRecord = {
      id: mediaId,
      orderId: id,
      customerId: order.customerId,
      productId: productId || null,
      googleDriveFileId: `ext_${Date.now()}`,
      fileName: `${title.replace(/\s+/g, '_')}.${mediaType === 'video' ? 'mp4' : 'jpg'}`,
      originalName: title,
      mimeType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
      fileSize: 1024 * 1024,
      mediaType,
      category: mediaType === 'video' ? 'videos' : 'photographs',
      title,
      description: description || `Visual proof for stage [${stage}].`,
      stage,
      thumbnailUrl: url,
      videoDuration: mediaType === 'video' ? 60 : null,
      webViewLink: url,
      webContentLink: url,
      visibility,
      isPublished: 1,
      downloadAllowed: 1,
      isPublic,
      uploadedBy: sessionUser.name,
      uploadedAt: now,
      updatedAt: now,
    };

    await db.insert(mediaFiles).values(mediaRecord);
    await db.insert(mediaOrderAccess).values({
      id: `moa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      mediaFileId: mediaId,
      orderId: id,
      createdAt: now,
    });

    // Notify customer
    if (visibility !== 'private') {
      try {
        await sendWebPushNotification({
          userId: order.customerId,
          title: `📸 New Crafting Update — Order #${order.orderNumber}`,
          message: `Artisan uploaded new ${mediaType} for stage [${stage}]. Tap to view.`,
          url: `/orders/${id}`,
          type: 'media_uploaded',
          relatedOrderId: id,
          category: 'orders',
        });
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      uploaded: [mediaRecord],
    });
  } catch (error: any) {
    console.error('Order media upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process order media upload.' },
      { status: 500 }
    );
  }
}
