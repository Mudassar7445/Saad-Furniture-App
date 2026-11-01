import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { workshopMedia, auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { desc, asc, eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const mediaType = searchParams.get('mediaType');
    const isFeatured = searchParams.get('isFeatured');
    const includeUnpublished = searchParams.get('all') === 'true';

    let conditions: any[] = [];
    if (!includeUnpublished) {
      conditions.push(eq(workshopMedia.isPublished, 1));
    }
    if (category && category !== 'all') {
      conditions.push(eq(workshopMedia.category, category));
    }
    if (mediaType && (mediaType === 'video' || mediaType === 'photo')) {
      conditions.push(eq(workshopMedia.mediaType, mediaType));
    }
    if (isFeatured === '1' || isFeatured === 'true') {
      conditions.push(eq(workshopMedia.isFeatured, 1));
    }

    const mediaList = await db
      .select()
      .from(workshopMedia)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(workshopMedia.displayOrder), desc(workshopMedia.createdAt));

    const mappedList = mediaList.map((item) => {
      if (item.mediaType === 'video') {
        const streamUrl = `/api/workshop/stream/${item.id}`;
        return {
          ...item,
          rawUrl: item.url,
          streamUrl,
          url: streamUrl,
        };
      }
      return item;
    });

    return NextResponse.json({
      success: true,
      media: mappedList,
      total: mappedList.length,
    });
  } catch (error: any) {
    console.error('Workshop media fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch workshop media' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('media'))
    ) {
      return NextResponse.json({ error: 'Unauthorized: Media manager permission required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      mediaType = 'photo',
      category = 'workshop_tour',
      url,
      thumbnailUrl,
      videoDuration,
      isFeatured = 0,
      displayOrder = 0,
      isPublished = 1,
      googleDriveFileId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    }
    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'Media URL or file attachment is required.' }, { status: 400 });
    }

    const id = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // If marked featured, unset other featured if it's the main video
    if (isFeatured) {
      await db
        .update(workshopMedia)
        .set({ isFeatured: 0 })
        .where(eq(workshopMedia.isFeatured, 1));
    }

    const record = {
      id,
      title: title.trim(),
      description: description?.trim() || null,
      mediaType,
      category,
      url: url.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || (mediaType === 'photo' ? url.trim() : null),
      videoDuration: videoDuration ? Number(videoDuration) : null,
      isFeatured: isFeatured ? 1 : 0,
      displayOrder: Number(displayOrder) || 0,
      isPublished: isPublished ? 1 : 0,
      viewsCount: 0,
      googleDriveFileId: googleDriveFileId || null,
      uploadedBy: sessionUser.name,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(workshopMedia).values(record);

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'CREATE_WORKSHOP_MEDIA',
      details: `Added workshop media [${record.title}] (${category})`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({ success: true, media: record });
  } catch (error: any) {
    console.error('Create workshop media error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save workshop media' },
      { status: 500 }
    );
  }
}

