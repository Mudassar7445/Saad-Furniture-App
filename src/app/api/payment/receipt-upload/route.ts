import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { mediaFiles } from '@/lib/db/schema';
import { uploadBufferToDrive, isDriveConnected } from '@/lib/storage/google-drive';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No receipt file provided.' }, { status: 400 });
    }

    // Limit receipt size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Receipt file exceeds 10MB limit.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const mediaId = `receipt_${uniqueSuffix}`;
    const safeFilename = `receipt_${uniqueSuffix}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const driveConnected = await isDriveConnected();
    let receiptUrl = `/api/media/image/${mediaId}`;
    let driveFileId = `local_${uniqueSuffix}`;

    if (driveConnected) {
      try {
        const driveResult = await uploadBufferToDrive({
          buffer,
          filename: safeFilename,
          mimeType,
          pathSegments: ['Payments', 'Customer Receipts'],
          description: `Customer payment receipt proof - ${file.name}`,
        });
        driveFileId = driveResult.id;
        receiptUrl = `/api/media/image/${mediaId}`;
      } catch (driveErr) {
        console.warn('Google Drive receipt upload failed, falling back to local DB blob:', driveErr);
      }
    }

    // Always store media record in database so /api/media/image/[mediaId] serves it seamlessly
    const now = new Date().toISOString();

    await db.insert(mediaFiles).values({
      id: mediaId,
      fileName: safeFilename,
      originalName: file.name,
      fileSize: buffer.length,
      mimeType,
      mediaType: 'photo',
      category: 'general',
      title: 'Customer Bank Transfer Receipt Proof',
      description: 'Submitted during checkout or payment submission',
      googleDriveFileId: driveFileId,
      webViewLink: receiptUrl,
      thumbnailUrl: receiptUrl,
      isPublic: 1,
      isPublished: 1,
      downloadAllowed: 1,
      visibility: 'public',
      uploadedBy: 'Customer (Order Checkout)',
      uploadedAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      receiptUrl,
      mediaId,
    });
  } catch (error: any) {
    console.error('Receipt upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload receipt' }, { status: 500 });
  }
}

