import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { workshopMedia, mediaFiles, products, auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { deleteDriveFile } from '@/lib/storage/google-drive';
import { eq, inArray, and, or, like, ne } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('media'))
    ) {
      return NextResponse.json(
        { error: 'Unauthorized: Media manager permission required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No media IDs provided.' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // 1. BULK PUBLISH
    if (action === 'publish') {
      await db
        .update(workshopMedia)
        .set({ isPublished: 1, updatedAt: now })
        .where(inArray(workshopMedia.id, ids));

      return NextResponse.json({
        success: true,
        message: `Successfully published ${ids.length} workshop media item(s).`,
      });
    }

    // 2. BULK UNPUBLISH
    if (action === 'unpublish') {
      await db
        .update(workshopMedia)
        .set({ isPublished: 0, updatedAt: now })
        .where(inArray(workshopMedia.id, ids));

      return NextResponse.json({
        success: true,
        message: `Successfully unpublished ${ids.length} workshop media item(s).`,
      });
    }

    // 3. BULK DELETE
    if (action === 'delete') {
      // Find files to delete
      const itemsToDelete = await db
        .select()
        .from(workshopMedia)
        .where(inArray(workshopMedia.id, ids));

      for (const item of itemsToDelete) {
        if (item.googleDriveFileId) {
          const driveId = item.googleDriveFileId;

          // Safe reference checking: verify not used in another workshop item outside this batch,
          // nor in media_files catalog, nor in products
          const otherWorkshop = await db
            .select({ id: workshopMedia.id })
            .from(workshopMedia)
            .where(
              and(
                eq(workshopMedia.googleDriveFileId, driveId),
                ne(workshopMedia.id, item.id)
              )
            )
            .limit(1);

          const mediaUsage = await db
            .select({ id: mediaFiles.id })
            .from(mediaFiles)
            .where(eq(mediaFiles.googleDriveFileId, driveId))
            .limit(1);

          const productUsage = await db
            .select({ id: products.id })
            .from(products)
            .where(
              or(
                like(products.featuredImage, `%${driveId}%`),
                like(products.images, `%${driveId}%`)
              )
            )
            .limit(1);

          const isReferencedElsewhere =
            otherWorkshop.length > 0 || mediaUsage.length > 0 || productUsage.length > 0;

          if (!isReferencedElsewhere) {
            try {
              await deleteDriveFile(driveId);
            } catch (dErr) {
              console.warn('Could not delete Drive file during bulk deletion:', dErr);
            }
          }
        }
      }

      await db.delete(workshopMedia).where(inArray(workshopMedia.id, ids));

      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: 'BULK_DELETE_WORKSHOP_MEDIA',
        details: `Deleted ${ids.length} workshop media item(s)`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${ids.length} workshop media item(s).`,
      });
    }

    return NextResponse.json({ error: 'Invalid bulk action specified.' }, { status: 400 });
  } catch (error: any) {
    console.error('Bulk workshop media error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process bulk operation.' },
      { status: 500 }
    );
  }
}

