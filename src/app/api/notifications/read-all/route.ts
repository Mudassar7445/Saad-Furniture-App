import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(
        sessionUser.role === 'super_admin'
          ? undefined
          : or(eq(notifications.userId, sessionUser.id), eq(notifications.userId, 'all'))
      );

    return NextResponse.json({ success: true, unreadCount: 0 });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to mark notifications read' }, { status: 500 });
  }
}

