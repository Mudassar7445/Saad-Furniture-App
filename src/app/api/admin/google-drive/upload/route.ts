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
    if (!connected) {
      return NextResponse.json(
        {
          error:
            'Google Drive is not connected. Please connect your Google account in Settings > Google Drive Storage before uploading.',
        },
        { status: 400 }
      );
    }

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

    // Get path segments in Google Drive
    const pathSegments = getFolderPathSegments(category, mimeType);

    // Upload directly to Google Drive
    const driveResult = await uploadBufferToDrive({
      buffer,
      filename,
      mimeType,
      pathSegments,
      description: title || `${category} luxury furniture media asset`,
    });

    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // High reliability direct Google Drive thumbnail / preview URL
    const directUrl = `https://drive.google.com/thumbnail?id=${driveResult.id}&sz=w1200`;
    const viewUrl = driveResult.webViewLink || `https://drive.google.com/file/d/${driveResult.id}/view`;
    const downloadUrl = driveResult.webContentLink || `https://drive.google.com/uc?id=${driveResult.id}&export=download`;

    await db.insert(mediaFiles).values({
      id: mediaId,
      googleDriveFileId: driveResult.id,
      fileName: filename,
      originalName: filename,
      mimeType,
      fileSize: driveResult.size,
      mediaType,
      category,
      title: title || filename,
      description: description || null,
      stage,
      productId: productId || null,
      orderId: orderId || null,
      customerId: customerId || null,
      thumbnailUrl: directUrl,
      webViewLink: viewUrl,
      webContentLink: downloadUrl,
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
      details: `Uploaded ${filename} (${(driveResult.size / 1024 / 1024).toFixed(2)} MB) to Google Drive folder [${pathSegments.join('/')}]`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      media: {
        id: mediaId,
        driveFileId: driveResult.id,
        fileName: filename,
        url: directUrl,
        viewUrl,
        downloadUrl,
        mimeType,
        size: driveResult.size,
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
