import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { workshopMedia, auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;

    const [media] = await db
      .select()
      .from(workshopMedia)
      .where(eq(workshopMedia.id, id))
      .limit(1);

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Increment view count
    try {
      await db
        .update(workshopMedia)
        .set({ viewsCount: (media.viewsCount || 0) + 1 })
        .where(eq(workshopMedia.id, id));
    } catch {}

    return NextResponse.json({ success: true, media });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('media'))
    ) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.mediaType !== undefined) updateData.mediaType = body.mediaType;
    if (body.url !== undefined) updateData.url = body.url.trim();
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl?.trim() || null;
    if (body.videoDuration !== undefined) updateData.videoDuration = body.videoDuration ? Number(body.videoDuration) : null;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished ? 1 : 0;
    if (body.displayOrder !== undefined) updateData.displayOrder = Number(body.displayOrder) || 0;
    if (body.googleDriveFileId !== undefined) updateData.googleDriveFileId = body.googleDriveFileId;

    if (body.isFeatured !== undefined) {
      updateData.isFeatured = body.isFeatured ? 1 : 0;
      if (body.isFeatured) {
        await db.update(workshopMedia).set({ isFeatured: 0 }).where(eq(workshopMedia.isFeatured, 1));
      }
    }

    await db.update(workshopMedia).set(updateData).where(eq(workshopMedia.id, id));

    return NextResponse.json({ success: true, message: 'Workshop media updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('media'))
    ) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    await db.delete(workshopMedia).where(eq(workshopMedia.id, id));

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'DELETE_WORKSHOP_MEDIA',
      details: `Deleted workshop media piece [${id}]`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Media removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Delete failed' }, { status: 500 });
  }
}

