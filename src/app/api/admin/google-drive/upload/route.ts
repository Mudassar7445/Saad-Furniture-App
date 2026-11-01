import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { mediaFiles, auditLogs } from '@/lib/db/schema';
import {
  uploadBufferToDrive,
  getFolderPathSegments,
  isDriveConnected,
} from '@/lib/storage/google-drive';

export async function POST(req: NextRequest) {
  try {
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
    const stage = (formData.get('stage') as string) || 'final_inspection';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
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
      fileSize = driveResult.size;
      // Use authorized server proxy for guaranteed cross-origin delivery and instant caching
      directUrl = `/api/media/image/${mediaId}`;
      viewUrl = driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.id}/view`;
      downloadUrl = driveResult.webContentLink || `https://drive.google.com/uc?id=${driveResult.id}&export=download`;
    } else {
      // High-reliability local fallback so uploads never fail if Google Drive is not connected yet
      const base64Data = buffer.toString('base64');
      const base64Url = `data:${mimeType};base64,${base64Data}`;
      directUrl = `/api/media/image/${mediaId}`;
      viewUrl = base64Url;
      downloadUrl = base64Url;
    }

    const now = new Date().toISOString();

    await db.insert(mediaFiles).values({
      id: mediaId,
      googleDriveFileId: driveFileId,
      fileName: safeFilename,
      originalName: file.name,
      mimeType,
      fileSize,
      mediaType,
      category,
      title: title || file.name,
      description: description || null,
      stage,
      productId: productId || null,
      orderId: orderId || null,
      customerId: customerId || null,
      thumbnailUrl: connected ? `/api/media/image/${mediaId}` : viewUrl,
      webViewLink: viewUrl,
      webContentLink: connected ? downloadUrl : viewUrl,
      visibility: 'public',
      isPublished: 1,
      downloadAllowed: 1,
      isPublic: 1,
      uploadedBy: user.name,
      uploadedAt: now,
      updatedAt: now,
    });

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
      },
    });
  } catch (err: any) {
    console.error('Upload to Google Drive Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to upload file to Google Drive' },
      { status: 500 }
    );
  }
}

