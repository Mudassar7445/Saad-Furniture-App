import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { workshopMedia, auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { sendWebPushNotification } from '@/lib/services/webpush';
import { desc, asc, eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 60s ISR cache for blazing fast responses

const WORKSHOP_CATEGORY_THUMBNAILS: Record<string, string> = {
  workshop_tour: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  sofa_frame: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
  woodworking: 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=800&q=80',
  foam_work: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
  fabric_stitching: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  furniture_polishing: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  final_finishing: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  completed_products: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
};

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

    // Return lightweight metadata only - NEVER stream binaries in gallery responses
    const lightweightMedia = mediaList.map((item) => {
      const fallbackThumb = WORKSHOP_CATEGORY_THUMBNAILS[item.category] || WORKSHOP_CATEGORY_THUMBNAILS.workshop_tour;
      
      // Ensure thumbnailUrl is strictly a clean image URL, never a web viewer page or video stream
      let safeThumbnail = item.thumbnailUrl?.trim();

      // Transform Google Drive viewer URLs into local high-performance image route
      if (safeThumbnail) {
        const driveFileMatch = safeThumbnail.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
          safeThumbnail.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (driveFileMatch) {
          safeThumbnail = `/api/media/image/${driveFileMatch[1]}`;
        }
      }

      if (!safeThumbnail || safeThumbnail.includes('/stream/') || safeThumbnail.endsWith('.mp4')) {
        safeThumbnail = item.mediaType === 'photo' && item.url && !item.url.includes('/stream/')
          ? item.url
          : fallbackThumb;
      }

      const streamUrl = `/api/workshop/videos/${item.id}/stream`;

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        mediaType: item.mediaType,
        category: item.category,
        thumbnailUrl: safeThumbnail,
        videoDuration: item.videoDuration,
        isFeatured: item.isFeatured,
        displayOrder: item.displayOrder,
        isPublished: item.isPublished,
        googleDriveFileId: item.googleDriveFileId,
        createdAt: item.createdAt,
        // Stream URL provided separately, only invoked when user explicitly taps Play
        streamUrl: item.mediaType === 'video' ? streamUrl : undefined,
        url: item.mediaType === 'video' ? streamUrl : (item.url || safeThumbnail),
      };
    });

    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return NextResponse.json(
      {
        success: true,
        media: lightweightMedia,
        total: lightweightMedia.length,
      },
      { headers }
    );
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
      originalName: body.originalName || null,
      fileName: body.fileName || null,
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

    if (record.isPublished === 1) {
      try {
        await sendWebPushNotification({
          userId: 'all',
          title: '🎬 New Workshop Craftsmanship Media',
          message: `${record.title}: New master craftsmanship footage has been published in the atelier.`,
          url: `/workshop?video=${record.id}`,
          type: 'workshop_update',
          category: 'workshop',
        });
      } catch (pushErr) {
        console.warn('Push dispatch note:', pushErr);
      }
    }

    return NextResponse.json({ success: true, media: record });
  } catch (error: any) {
    console.error('Create workshop media error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save workshop media' },
      { status: 500 }
    );
  }
}

