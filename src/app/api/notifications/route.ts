import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { notifications, auditLogs } from '@/lib/db/schema';
import { fcmService } from '@/lib/services/fcm';
import { eq, or, desc } from 'drizzle-orm';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let list;
  if (sessionUser.role === 'super_admin') {
    list = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(50);
  } else {
    // Current user's notifications or announcements to 'all'
    list = await db
      .select()
      .from(notifications)
      .where(or(eq(notifications.userId, sessionUser.id), eq(notifications.userId, 'all')))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  return NextResponse.json({ notifications: list });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can send broadcast notifications.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { targetUserId = 'all', title, message, type = 'announcement', relatedOrderId } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
    }

    const result = await fcmService.sendNotification({
      userId: targetUserId,
      title,
      message,
      type,
      relatedOrderId,
    });

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'DISPATCH_NOTIFICATION',
      details: `Dispatched notification "${title}" to target [${targetUserId}]`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, notificationId: result.id });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json({ error: 'Failed to dispatch notification.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (id) {
    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, id));
  } else {
    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, sessionUser.id));
  }

  return NextResponse.json({ success: true });
}

