import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import {
  mediaFiles,
  mediaCustomerAccess,
  mediaOrderAccess,
  mediaProductAccess,
  mediaUploadLogs,
  auditLogs,
  notifications,
  users,
} from '@/lib/db/schema';
import { googleDriveService } from '@/lib/services/googleDrive';
import { fcmService } from '@/lib/services/fcm';
import { sendWebPushNotification } from '@/lib/services/webpush';
import { eq, desc, and, or, inArray, like } from 'drizzle-orm';

export async function GET(request: Request) {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const folderId = searchParams.get('folderId');
  const fileType = searchParams.get('fileType');
  const search = searchParams.get('search');
  const orderId = searchParams.get('orderId');
  const customerId = searchParams.get('customerId');
  const publishedOnly = searchParams.get('publishedOnly') === 'true';

  let queryConditions: any[] = [];

  // 1. Strict Role-Based Visibility Isolation
  if (sessionUser.role === 'customer') {
    // Only published files
    queryConditions.push(eq(mediaFiles.isPublished, 1));

    // Get files specifically granted to this customer
    const granted = await db
      .select({ mediaFileId: mediaCustomerAccess.mediaFileId })
      .from(mediaCustomerAccess)
      .where(eq(mediaCustomerAccess.customerId, sessionUser.id));
    const grantedFileIds = granted.map((g) => g.mediaFileId);

    const customerAccessCondition = or(
      eq(mediaFiles.visibility, 'public'),
      and(eq(mediaFiles.visibility, 'specific'), eq(mediaFiles.customerId, sessionUser.id)),
      grantedFileIds.length > 0 ? inArray(mediaFiles.id, grantedFileIds) : undefined
    );

    queryConditions.push(customerAccessCondition);
  } else {
    // Admin / Staff query filters
    if (publishedOnly) queryConditions.push(eq(mediaFiles.isPublished, 1));
    if (customerId) queryConditions.push(eq(mediaFiles.customerId, customerId));
  }

  // 2. Attribute Filters
  if (category && category !== 'all') {
    queryConditions.push(eq(mediaFiles.category, category));
  }
  if (folderId && folderId !== 'all') {
    queryConditions.push(eq(mediaFiles.folderId, folderId));
  }
  if (fileType && fileType !== 'all') {
    queryConditions.push(eq(mediaFiles.mediaType, fileType));
  }
  if (orderId) {
    queryConditions.push(eq(mediaFiles.orderId, orderId));
  }
  if (search && search.trim()) {
    queryConditions.push(
      or(
        like(mediaFiles.title, `%${search.trim()}%`),
        like(mediaFiles.fileName, `%${search.trim()}%`),
        like(mediaFiles.description, `%${search.trim()}%`)
      )
    );
  }

  const files = await db
    .select()
    .from(mediaFiles)
    .where(queryConditions.length > 0 ? and(...queryConditions) : undefined)
    .orderBy(desc(mediaFiles.uploadedAt));

  // Storage and Type Metrics for Dashboard
  const totalBytes = files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
  const totalPhotos = files.filter((f) => f.mediaType === 'photo' || f.mimeType?.startsWith('image')).length;
  const totalVideos = files.filter((f) => f.mediaType === 'video' || f.mimeType?.startsWith('video')).length;
  const totalPdfs = files.filter((f) => f.mediaType === 'pdf' || f.mimeType?.includes('pdf')).length;
  const totalDocs = files.filter(
    (f) =>
      f.mediaType === 'document' ||
      f.mimeType?.includes('word') ||
      f.mimeType?.includes('sheet') ||
      f.mimeType?.includes('presentation')
  ).length;

  return NextResponse.json({
    files,
    metrics: {
      totalFiles: files.length,
      totalPhotos,
      totalVideos,
      totalPdfs,
      totalDocs,
      totalBytes,
      formattedSize: `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`,
    },
  });
}

export async function POST(request: Request) {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser || (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('media'))) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    const now = new Date().toISOString();

    // Case A: Multipart form upload (Direct file binaries)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const thumbnailFile = formData.get('thumbnail') as File | null;
      let rawTitle = (formData.get('title') as string)?.trim() || '';
      // Strip WhatsApp filename patterns and technical file extensions from customer title
      if (!rawTitle || rawTitle.toLowerCase().includes('whatsapp') || /\.(mp4|mov|avi|jpg|jpeg|png|webp|pdf)$/i.test(rawTitle)) {
        if (rawTitle) {
          rawTitle = rawTitle
            .replace(/\.[^/.]+$/, '')
            .replace(/whatsapp\s*video\s*at\s*[\d.-]+/i, 'Bespoke Production Milestone')
            .replace(/whatsapp\s*video\s*/i, 'Workshop Milestone Video')
            .replace(/whatsapp\s*image\s*/i, 'Workshop Progress Photograph')
            .replace(/[-_]/g, ' ')
            .trim();
        } else {
          rawTitle = 'Artisan Craftsmanship Milestone';
        }
      }
      const title = rawTitle;
      const category = (formData.get('category') as string) || 'general';
      const folderId = (formData.get('folderId') as string) || null;
      const visibility = (formData.get('visibility') as string) || 'public';
      const orderId = (formData.get('orderId') as string) || null;
      const customerId = (formData.get('customerId') as string) || null;
      const productId = (formData.get('productId') as string) || null;
      const description = (formData.get('description') as string) || null;
      const isPublished = formData.get('isPublished') === 'false' ? 0 : 1;
      const downloadAllowed = formData.get('downloadAllowed') === 'false' ? 0 : 1;
      const notifyCustomers = formData.get('notifyCustomers') === 'true';

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Determine media type
      const mime = file.type || 'application/octet-stream';
      let mediaType = 'document';
      if (mime.includes('pdf')) mediaType = 'pdf';
      else if (mime.startsWith('image')) mediaType = 'photo';
      else if (mime.startsWith('video')) mediaType = 'video';
      else if (mime.includes('sheet') || mime.includes('excel')) mediaType = 'spreadsheet';
      else if (mime.includes('presentation') || mime.includes('powerpoint')) mediaType = 'presentation';

      // 1. Upload to Google Drive 5TB Storage
      let driveUpload: any = null;
      try {
        driveUpload = await googleDriveService.uploadBuffer(buffer, file.name, mime, folderId || undefined);
      } catch (uploadErr: any) {
        console.error('Google Drive storage upload error:', uploadErr);
        throw new Error('Google Drive upload failed: ' + (uploadErr?.message || 'Storage error'));
      }

      const fileId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 1B. Handle Optimized Thumbnail (stored in Google Drive once or Google CDN)
      let finalThumbnailUrl: string | null = null;
      if (thumbnailFile) {
        try {
          const thumbBytes = await thumbnailFile.arrayBuffer();
          const thumbBuffer = Buffer.from(thumbBytes);
          const thumbMime = thumbnailFile.type || 'image/webp';
          const thumbUpload = await googleDriveService.uploadBuffer(
            thumbBuffer,
            `thumb_${file.name.replace(/\.[^/.]+$/, '')}.webp`,
            thumbMime,
            folderId || undefined
          );
          finalThumbnailUrl = thumbUpload.id
            ? `/api/media/image/${thumbUpload.id}`
            : (thumbUpload.webViewLink || null);
        } catch (thumbErr) {
          console.warn('Google Drive thumbnail upload fallback:', thumbErr);
        }
      }

      if (!finalThumbnailUrl) {
        if (mediaType === 'video') {
          if (driveUpload.id && !driveUpload.id.startsWith('gdrive_vault_')) {
            finalThumbnailUrl = `https://drive.google.com/thumbnail?id=${driveUpload.id}&sz=w800`;
          } else {
            finalThumbnailUrl = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
          }
        } else if (mediaType === 'photo') {
          finalThumbnailUrl = driveUpload.id
            ? `/api/media/image/${driveUpload.id}`
            : (driveUpload.thumbnailLink || driveUpload.webViewLink);
        } else {
          finalThumbnailUrl = driveUpload.thumbnailLink || null;
        }
      }

      // 2. Save metadata in Turso with duplicate-check and orphan cleanup
      try {
        const mediaRecord = {
          id: fileId,
          folderId,
          orderId,
          customerId,
          productId,
          productCategory: null,
          googleDriveFileId: driveUpload.id,
          fileName: file.name,
          originalName: file.name,
          mimeType: mime,
          fileSize: buffer.length,
          mediaType,
          category,
          title: title.trim(),
          description,
          stage: 'final_inspection',
          thumbnailUrl: finalThumbnailUrl,
          webViewLink: driveUpload.webViewLink,
          webContentLink: driveUpload.webContentLink,
          visibility,
          isPublished,
          downloadAllowed,
          isPublic: visibility === 'public' ? 1 : 0,
          uploadedBy: sessionUser.name,
          uploadedAt: now,
          updatedAt: now,
        };

        const existing = await db
          .select()
          .from(mediaFiles)
          .where(eq(mediaFiles.googleDriveFileId, driveUpload.id))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(mediaFiles)
            .set(mediaRecord)
            .where(eq(mediaFiles.id, existing[0].id));
        } else {
          await db.insert(mediaFiles).values(mediaRecord);
        }
      } catch (dbErr: any) {
        console.error('Database insert into media_files failed:', dbErr);
        // Clean up orphaned Drive file
        if (driveUpload?.id) {
          console.warn(`Cleaning up orphaned Drive file: ${driveUpload.id}`);
          await googleDriveService.deleteFile(driveUpload.id).catch(console.error);
        }
        throw new Error('Failed to save file metadata in database.');
      }

      // 3. Log Upload
      try {
        await db.insert(mediaUploadLogs).values({
          id: `upl_${Date.now()}`,
          mediaFileId: fileId,
          fileName: file.name,
          fileSize: buffer.length,
          status: 'completed',
          uploadSpeed: '12.4 MB/s',
          uploadedBy: sessionUser.name,
          startedAt: now,
          completedAt: now,
        });
      } catch {}

      // 4. Handle Customer Notifications if published
      if (isPublished === 1 && notifyCustomers) {
        try {
          const targetUserId = visibility === 'specific' && customerId ? customerId : 'all';
          await db.insert(notifications).values({
            id: `notif_${Date.now()}`,
            userId: targetUserId,
            title: `New ${title} Published!`,
            message: `A new ${category.replace(/_/g, ' ')} document has been added to your Saad Furniture library. Tap to view.`,
            type: 'media_uploaded',
            relatedOrderId: orderId,
            isRead: 0,
            createdAt: now,
          });

          await fcmService.sendNotification({
            userId: targetUserId,
            title: `New ${title} Published!`,
            message: `Explore our newly released ${title} inside the Saad Furniture app.`,
            type: 'announcement',
            relatedOrderId: orderId || undefined,
          });

          // Dispatch real Mobile/Web Push notification to user's device status tray
          try {
            await sendWebPushNotification({
              userId: targetUserId,
              title: `Saad Furniture — New ${mediaType === 'video' ? 'Workshop Video' : 'Milestone'}`,
              message: `${title}: A new ${mediaType === 'video' ? 'workshop video' : 'craftsmanship update'} has been published.`,
              relatedOrderId: orderId || undefined,
              url: orderId ? `/orders/${orderId}` : '/workshop',
              type: 'media_uploaded',
            });
          } catch (pushErr) {
            console.warn('Web Push dispatch note:', pushErr);
          }
        } catch (notifErr) {
          console.warn('Notification dispatch note:', notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'File successfully uploaded to cloud library and catalogued.',
        fileId,
      });
    }

    // Case B: JSON Upload (for direct URLs, digital catalogues, or embedded links)
    const body = await request.json();
    const {
      title,
      fileName,
      mimeType = 'application/pdf',
      category = 'general',
      folderId = null,
      visibility = 'public',
      orderId = null,
      customerId = null,
      productId = null,
      description = null,
      url,
      fileSize = 4500000,
      isPublished = 1,
      downloadAllowed = 1,
      notifyCustomers = false,
    } = body;

    const fileId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let mediaType = 'document';
    if (mimeType.includes('pdf')) mediaType = 'pdf';
    else if (mimeType.startsWith('image')) mediaType = 'photo';
    else if (mimeType.startsWith('video')) mediaType = 'video';

    await db.insert(mediaFiles).values({
      id: fileId,
      folderId,
      orderId,
      customerId,
      productId,
      googleDriveFileId: `gdrive_ext_${Date.now()}`,
      fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      originalName: fileName || title,
      mimeType,
      fileSize,
      mediaType,
      category,
      title: title.trim(),
      description,
      stage: 'final_inspection',
      thumbnailUrl: url,
      webViewLink: url,
      webContentLink: url,
      visibility,
      isPublished: isPublished ? 1 : 0,
      downloadAllowed: downloadAllowed ? 1 : 0,
      isPublic: visibility === 'public' ? 1 : 0,
      uploadedBy: sessionUser.name,
      uploadedAt: now,
      updatedAt: now,
    });

    if (isPublished && notifyCustomers) {
      try {
        const targetUserId = visibility === 'specific' && customerId ? customerId : 'all';
        await db.insert(notifications).values({
          id: `notif_${Date.now()}`,
          userId: targetUserId,
          title: `New ${title} Catalogue Available`,
          message: `Explore our newly published catalogue inside the Saad Furniture App.`,
          type: 'media_uploaded',
          isRead: 0,
          createdAt: now,
        });
      } catch {}
    }

    return NextResponse.json({ success: true, fileId });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: Super Admin only.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { fileIds, action, value } = body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs array is required.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'publish') {
      await db
        .update(mediaFiles)
        .set({ isPublished: 1, updatedAt: now })
        .where(inArray(mediaFiles.id, fileIds));
      return NextResponse.json({ success: true, message: `${fileIds.length} file(s) published.` });
    }

    if (action === 'unpublish') {
      await db
        .update(mediaFiles)
        .set({ isPublished: 0, updatedAt: now })
        .where(inArray(mediaFiles.id, fileIds));
      return NextResponse.json({ success: true, message: `${fileIds.length} file(s) unpublished.` });
    }

    if (action === 'move') {
      await db
        .update(mediaFiles)
        .set({ folderId: value || null, updatedAt: now })
        .where(inArray(mediaFiles.id, fileIds));
      return NextResponse.json({ success: true, message: `${fileIds.length} file(s) moved.` });
    }

    if (action === 'visibility') {
      await db
        .update(mediaFiles)
        .set({ visibility: value, isPublic: value === 'public' ? 1 : 0, updatedAt: now })
        .where(inArray(mediaFiles.id, fileIds));
      return NextResponse.json({ success: true, message: `Visibility set to ${value}.` });
    }

    if (action === 'rename' && fileIds.length === 1) {
      await db
        .update(mediaFiles)
        .set({ title: value.trim(), updatedAt: now })
        .where(eq(mediaFiles.id, fileIds[0]));
      return NextResponse.json({ success: true, message: 'File renamed successfully.' });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: Super Admin only.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json({ error: 'File ID is required.' }, { status: 400 });
  }

  const [file] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, fileId)).limit(1);
  if (!file) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }

  // Delete from Google Drive
  if (file.googleDriveFileId) {
    await googleDriveService.deleteFile(file.googleDriveFileId);
  }

  // Delete records
  await db.delete(mediaCustomerAccess).where(eq(mediaCustomerAccess.mediaFileId, fileId));
  await db.delete(mediaFiles).where(eq(mediaFiles.id, fileId));

  return NextResponse.json({ success: true, message: 'File deleted permanently from Drive and Database.' });
}
