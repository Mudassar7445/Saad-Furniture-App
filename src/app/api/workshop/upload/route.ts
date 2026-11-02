import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { workshopMedia, auditLogs } from '@/lib/db/schema';
import {
  uploadBufferToDrive,
  isDriveConnected,
  deleteDriveFile,
} from '@/lib/storage/google-drive';
import { sendWebPushNotification } from '@/lib/services/webpush';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const user = await getSessionUser();
    if (
      !user ||
      (user.role !== 'super_admin' && !user.permissions?.includes('media'))
    ) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or Media manager privileges required.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const thumbnailFile = formData.get('thumbnail') as File | null;
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const category = (formData.get('category') as string) || 'workshop_tour';
    let mediaType = (formData.get('mediaType') as string) || 'video';
    const isFeatured = formData.get('isFeatured') === '1' || formData.get('isFeatured') === 'true';
    const displayOrder = parseInt((formData.get('displayOrder') as string) || '0', 10);
    const videoDuration = formData.get('videoDuration')
      ? parseInt(formData.get('videoDuration') as string, 10)
      : null;

    if (!file) {
      return NextResponse.json({ error: 'Please choose a media file to upload.' }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';

    // Auto-detect mediaType if video
    if (mimeType.startsWith('video/')) {
      mediaType = 'video';
    } else if (mimeType.startsWith('image/')) {
      mediaType = 'photo';
    }

    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const workshopId = `ws_${uniqueSuffix}`;
    const safeBaseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeFilename = `saad_workshop_${mediaType}_${uniqueSuffix}_${safeBaseName}`;

    const connected = await isDriveConnected();
    let driveFileId: string | null = null;
    let rawMediaUrl = '';
    let thumbnailDriveId: string | null = null;
    let finalThumbnailUrl: string | null = null;

    // Strict dedicated folder structure:
    // SAAD FURNITURE / WORKSHOP MEDIA / VIDEOS
    // SAAD FURNITURE / WORKSHOP MEDIA / PHOTOS
    const pathSegments = [
      'SAAD FURNITURE',
      'WORKSHOP MEDIA',
      mediaType === 'video' ? 'VIDEOS' : 'PHOTOS',
    ];

    if (connected) {
      // 1. Upload main media file directly to Google Drive
      const driveResult = await uploadBufferToDrive({
        buffer,
        filename: safeFilename,
        mimeType,
        pathSegments,
        description: `Saad Furniture Workshop - ${title}`,
      });

      driveFileId = driveResult.id;
      rawMediaUrl = driveResult.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;

      // 2. Upload thumbnail if provided (Stored separately in THUMBNAILS folder)
      if (thumbnailFile) {
        try {
          const thumbArrayBuffer = await thumbnailFile.arrayBuffer();
          const thumbBuffer = Buffer.from(thumbArrayBuffer);
          const thumbResult = await uploadBufferToDrive({
            buffer: thumbBuffer,
            filename: `thumb_${safeFilename}.webp`,
            mimeType: thumbnailFile.type || 'image/webp',
            pathSegments: ['SAAD FURNITURE', 'WORKSHOP MEDIA', 'THUMBNAILS'],
            description: `Thumbnail for ${title}`,
          });
          thumbnailDriveId = thumbResult.id;
          finalThumbnailUrl = `/api/media/image/${thumbResult.id}`;
        } catch (thumbErr) {
          console.warn('Failed to upload thumbnail to Google Drive:', thumbErr);
        }
      }
    } else {
      // Local / Offline fallback when Google Drive is disconnected
      driveFileId = `local_${uniqueSuffix}`;
      const base64Data = buffer.toString('base64');
      rawMediaUrl = `data:${mimeType};base64,${base64Data}`;

      if (thumbnailFile) {
        const thumbArrayBuffer = await thumbnailFile.arrayBuffer();
        finalThumbnailUrl = `data:${thumbnailFile.type || 'image/webp'};base64,${Buffer.from(thumbArrayBuffer).toString('base64')}`;
      }
    }

    // Default thumbnail for photos is the image itself, for videos use dedicated internal thumbnail endpoint
    if (mediaType === 'photo' && !finalThumbnailUrl) {
      finalThumbnailUrl = rawMediaUrl;
    } else if (mediaType === 'video' && !finalThumbnailUrl) {
      finalThumbnailUrl = `/api/media/thumbnail/${workshopId}`;
    }

    // Stream URL route for smooth 206 Partial Content video delivery
    const streamUrl = `/api/workshop/videos/${workshopId}/stream`;
    const publicUrl = mediaType === 'video' ? streamUrl : rawMediaUrl;

    // If setting as featured, unset other featured records
    if (isFeatured) {
      await db
        .update(workshopMedia)
        .set({ isFeatured: 0 })
        .where(eq(workshopMedia.isFeatured, 1));
    }

    const now = new Date().toISOString();
    const newRecord = {
      id: workshopId,
      title: title.trim(),
      description: description?.trim() || null,
      originalName: file.name,
      fileName: safeFilename,
      mediaType,
      category,
      url: publicUrl,
      thumbnailUrl: finalThumbnailUrl,
      videoDuration,
      isFeatured: isFeatured ? 1 : 0,
      displayOrder: isNaN(displayOrder) ? 0 : displayOrder,
      isPublished: 1,
      viewsCount: 0,
      googleDriveFileId: driveFileId,
      uploadedBy: user.name || 'Admin',
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(workshopMedia).values(newRecord);

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      action: 'UPLOAD_WORKSHOP_MEDIA',
      details: `Uploaded ${mediaType} "${title}" to cloud media vault`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    // Real Mobile Push Notification delivery to subscribed patrons
    try {
      await sendWebPushNotification({
        userId: 'all',
        title: '🎬 New Workshop Craftsmanship Media',
        message: `${title.trim()}: New master craftsmanship footage has been published in the atelier.`,
        url: '/workshop',
        type: 'workshop_update',
        category: 'workshop',
      });
    } catch (pushErr) {
      console.warn('Workshop Web Push notification note:', pushErr);
    }

    return NextResponse.json({
      success: true,
      media: {
        ...newRecord,
        streamUrl: mediaType === 'video' ? streamUrl : undefined,
        rawUrl: rawMediaUrl,
      },
    });
  } catch (error: any) {
    console.error('Workshop media upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload workshop media.' },
      { status: 500 }
    );
  }
}

