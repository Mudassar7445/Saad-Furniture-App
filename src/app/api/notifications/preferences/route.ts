import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { notificationPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({
        preferences: {
          newProducts: 1,
          productUpdates: 1,
          workshopUpdates: 1,
          orderProgress: 1,
          announcements: 1,
        },
      });
    }

    const rows = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, sessionUser.id));

    if (rows.length === 0) {
      return NextResponse.json({
        preferences: {
          newProducts: 1,
          productUpdates: 1,
          workshopUpdates: 1,
          orderProgress: 1,
          announcements: 1,
        },
      });
    }

    return NextResponse.json({ preferences: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, sessionUser.id));

    if (existing.length === 0) {
      await db.insert(notificationPreferences).values({
        id: `pref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        newProducts: body.newProducts !== undefined ? (body.newProducts ? 1 : 0) : 1,
        productUpdates: body.productUpdates !== undefined ? (body.productUpdates ? 1 : 0) : 1,
        workshopUpdates: body.workshopUpdates !== undefined ? (body.workshopUpdates ? 1 : 0) : 1,
        orderProgress: body.orderProgress !== undefined ? (body.orderProgress ? 1 : 0) : 1,
        announcements: body.announcements !== undefined ? (body.announcements ? 1 : 0) : 1,
        updatedAt: now,
      });
    } else {
      await db
        .update(notificationPreferences)
        .set({
          newProducts: body.newProducts !== undefined ? (body.newProducts ? 1 : 0) : existing[0].newProducts,
          productUpdates: body.productUpdates !== undefined ? (body.productUpdates ? 1 : 0) : existing[0].productUpdates,
          workshopUpdates: body.workshopUpdates !== undefined ? (body.workshopUpdates ? 1 : 0) : existing[0].workshopUpdates,
          orderProgress: body.orderProgress !== undefined ? (body.orderProgress ? 1 : 0) : existing[0].orderProgress,
          announcements: body.announcements !== undefined ? (body.announcements ? 1 : 0) : existing[0].announcements,
          updatedAt: now,
        })
        .where(eq(notificationPreferences.userId, sessionUser.id));
    }

    return NextResponse.json({ success: true, message: 'Notification preferences updated successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

