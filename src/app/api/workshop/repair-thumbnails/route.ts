import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { workshopMedia } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getValidAccessToken, isDriveConnected } from '@/lib/storage/google-drive';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await initializeDatabase();
    const records = await db.select().from(workshopMedia);
    let repairedCount = 0;
    const details: any[] = [];

    const driveConnected = await isDriveConnected();
    let token = '';
    if (driveConnected) {
      token = await getValidAccessToken();
    }

    for (const item of records) {
      let needsUpdate = false;
      let newThumbUrl = item.thumbnailUrl;

      // 1. Check if thumbnailUrl is a Google Drive web viewer link
      if (item.thumbnailUrl && item.thumbnailUrl.includes('drive.google.com')) {
        const driveMatch = item.thumbnailUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
          item.thumbnailUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (driveMatch) {
          const thumbDriveId = driveMatch[1];
          newThumbUrl = `/api/media/image/${thumbDriveId}`;
          needsUpdate = true;
        }
      }

      // 2. Check if video has no thumbnail at all or broken placeholder
      if (
        item.mediaType === 'video' &&
        (!newThumbUrl || newThumbUrl.includes('/stream/') || newThumbUrl.endsWith('.mp4'))
      ) {
        newThumbUrl = `/api/media/thumbnail/${item.id}`;
        needsUpdate = true;
      }

      if (needsUpdate && newThumbUrl) {
        await db
          .update(workshopMedia)
          .set({
            thumbnailUrl: newThumbUrl,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(workshopMedia.id, item.id));

        repairedCount++;
        details.push({ id: item.id, title: item.title, oldThumb: item.thumbnailUrl, newThumb: newThumbUrl });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Repaired ${repairedCount} workshop media thumbnail reference(s).`,
      repairedCount,
      details,
    });
  } catch (error: any) {
    console.error('Repair thumbnails error:', error);
    return NextResponse.json({ error: error.message || 'Repair operation failed' }, { status: 500 });
  }
}

export async function GET() {
  return POST({} as any);
}

