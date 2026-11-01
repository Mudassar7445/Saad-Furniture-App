import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { mediaFiles, orders, auditLogs } from '@/lib/db/schema';
import {
  uploadBufferToDrive,
  getFolderPathSegments,
  isDriveConnected,
  deleteDriveFile,
} from '@/lib/storage/google-drive';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  let uploadedDriveId: string | null = null;
  try {
    await initializeDatabase();
    const user = await getSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const connected = await isDriveConnected();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'Sofas';
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const productId = (formData.get('productId') as string) || null;
    const orderId = (formData.get('orderId') as string) || null;
    const customerId = (formData.get('customerId') as string) || null;
    const folderId = (formData.get('folderId') as string) || null;
    const stage = (formData.get('stage') as string) || 'final_inspection';
    const visibility = (formData.get('visibility') as string) || 'public';
    const videoDuration = formData.get('videoDuration') ? parseFloat(formData.get('videoDuration') as string) : null;
    const pageCount = formData.get('pageCount') ? parseInt(formData.get('pageCount') as string, 10) : null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // Auto-resolve customer ID from order if customerId was not passed
    let resolvedCustomerId = customerId;
    if (orderId && !resolvedCustomerId) {
      try {
        const [ord] = await db.select({ customerId: orders.customerId }).from(orders).where(eq(orders.id, orderId)).limit(1);
        if (ord) {
          resolvedCustomerId = ord.customerId;
        }
      } catch (ordErr) {
        console.warn('Could not auto-lookup customer for order:', ordErr);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'application/octet-stream';
    const filename = file.name;

    // Determine media type
    let mediaType: 'photo' | 'video' | 'pdf' | 'document' | 'other' = 'photo';
    if (mimeType.startsWith('video/')) mediaType = 'video';
    else if (mimeType === 'application/pdf') mediaType = 'pdf';
    else if (mimeType.includes('document') || mimeType.includes('text')) mediaType = 'document';

    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const mediaId = `media_${uniqueSuffix}`;
    const safeBaseName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeFilename = `sf_${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${uniqueSuffix}_${safeBaseName}`;

    let directUrl = '';
    let viewUrl = '';
    let downloadUrl = '';
    let driveFileId = `local_${uniqueSuffix}`;
    let fileSize = buffer.length;

    if (connected) {
      // Get path segments in Google Drive
      const pathSegments = getFolderPathSegments(category, mimeType);

      // Upload directly to Google Drive
      const driveResult = await uploadBufferToDrive({
        buffer,
        filename: safeFilename,
        mimeType,
        pathSegments,
        description: title || `${category} luxury furniture media asset`,
      });

      driveFileId = driveResult.id;
      uploadedDriveId = driveResult.id;
      fileSize = driveResult.size || buffer.length;
      
      // Use authorized server streaming/proxy routes for guaranteed playback & cross-origin delivery
      directUrl = mediaType === 'video' ? `/api/media/${mediaId}/stream` : `/api/media/image/${mediaId}`;
      viewUrl = driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.id}/view`;
      downloadUrl = driveResult.webContentLink || `https://drive.google.com/uc?id=${driveResult.id}&export=download`;
    } else {
      // High-reliability local fallback so uploads never fail if Google Drive is not connected yet
      const base64Data = buffer.toString('base64');
      const base64Url = `data:${mimeType};base64,${base64Data}`;
      directUrl = mediaType === 'video' ? `/api/media/${mediaId}/stream` : `/api/media/image/${mediaId}`;
      viewUrl = base64Url;
      downloadUrl = base64Url;
    }

    const now = new Date().toISOString();
    const mediaRecord = {
      id: mediaId,
      folderId: folderId || null,
      orderId: orderId || null,
      customerId: resolvedCustomerId || null,
      productId: productId || null,
      productCategory: category || null,
      googleDriveFileId: driveFileId,
      fileName: safeFilename,
      originalName: file.name,
      mimeType,
      fileSize: Math.round(fileSize),
      mediaType,
      category,
      title: (title || file.name).trim(),
      description: description?.trim() || null,
      stage,
      thumbnailUrl: mediaType === 'video' ? directUrl : (connected ? `/api/media/image/${mediaId}` : viewUrl),
      videoDuration: videoDuration || (mediaType === 'video' ? 60 : null),
      pageCount: pageCount || null,
      webViewLink: viewUrl,
      webContentLink: connected ? downloadUrl : viewUrl,
      visibility,
      isPublished: 1,
      downloadAllowed: 1,
      isPublic: visibility === 'public' ? 1 : 0,
      uploadedBy: user.name || 'Admin',
      uploadedAt: now,
      updatedAt: now,
    };

    // Retry protection: Check if record with this googleDriveFileId already exists
    const existing = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.googleDriveFileId, driveFileId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(mediaFiles)
        .set(mediaRecord)
        .where(eq(mediaFiles.id, existing[0].id));
    } else {
      await db.insert(mediaFiles).values(mediaRecord);
    }

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      action: 'UPLOAD_MEDIA_DRIVE',
      details: connected
        ? `Uploaded ${filename} (${(fileSize / 1024 / 1024).toFixed(2)} MB) to Google Drive 5TB storage`
        : `Uploaded ${filename} (${(fileSize / 1024).toFixed(1)} KB) directly (local storage active)`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      media: {
        id: mediaId,
        driveFileId,
        fileName: filename,
        url: directUrl,
        viewUrl,
        downloadUrl,
        mimeType,
        size: fileSize,
        category,
        mediaType,
        thumbnailUrl: mediaRecord.thumbnailUrl,
      },
    });
  } catch (err: any) {
    console.error('Upload to Google Drive Error details:', err);
    // Cleanup orphaned Drive file if database insert failed
    if (uploadedDriveId) {
      console.warn(`Cleaning up orphaned Google Drive file: ${uploadedDriveId}`);
      try {
        await deleteDriveFile(uploadedDriveId);
      } catch (cleanupErr) {
        console.error('Failed to cleanup orphaned Google Drive file:', cleanupErr);
      }
    }

    // Extract real underlying error for server logs
    const underlyingMessage = err?.cause?.message || err?.message || 'Database insert failed.';
    console.error('Underlying DB error:', underlyingMessage);

    return NextResponse.json(
      { error: 'Failed to process media upload. The database operation could not be completed.' },
      { status: 500 }
    );
  }
}

