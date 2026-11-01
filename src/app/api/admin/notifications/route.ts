import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { pushSubscriptions, notificationEvents, users } from '@/lib/db/schema';
import { queueNotificationEvent, processPendingNotificationEvents } from '@/lib/services/webpush';
import { desc, eq, count, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'super_admin' && sessionUser.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Registered devices count
    const deviceCountResult = await db
      .select({ count: count() })
      .from(pushSubscriptions);
    const registeredDevicesCount = deviceCountResult[0]?.count || 0;

    // 2. Subscribed customers count (distinct userIds)
    const distinctUsersResult = await db
      .select({ distinctUsers: sql`count(distinct ${pushSubscriptions.userId})` })
      .from(pushSubscriptions);
    const subscribedCustomersCount = Number(distinctUsersResult[0]?.distinctUsers || 0);

    // 3. Outbox events list
    const events = await db
      .select()
      .from(notificationEvents)
      .orderBy(desc(notificationEvents.createdAt))
      .limit(50);

    return NextResponse.json({
      registeredDevicesCount,
      subscribedCustomersCount,
      events,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'super_admin' && sessionUser.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'send_announcement') {
      const { title, message, url, category = 'announcements', targetUserId = 'all' } = body;
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
      }

      const res = await queueNotificationEvent({
        type: 'announcement',
        category,
        title,
        message,
        url: url || '/',
        targetUserId,
      });

      return NextResponse.json({ ...res });
    }

    if (action === 'send_test') {
      const { targetUserId = 'all' } = body;
      const res = await queueNotificationEvent({
        type: 'announcement',
        category: 'announcements',
        title: 'Saad Furniture Test Alert 🔔',
        message: 'This is a verified test push notification confirming background delivery to your device.',
        url: '/',
        targetUserId,
      });

      return NextResponse.json({ message: 'Test notification queued and dispatched.', ...res });
    }

    if (action === 'retry_event') {
      const { eventId } = body;
      if (!eventId) {
        return NextResponse.json({ error: 'Event ID required.' }, { status: 400 });
      }

      await db
        .update(notificationEvents)
        .set({
          status: 'pending',
          attempts: 0,
          scheduledAt: new Date().toISOString(),
          lastError: null,
        })
        .where(eq(notificationEvents.id, eventId));

      const processRes = await processPendingNotificationEvents();
      return NextResponse.json({ success: true, message: 'Event rescheduled and processed.', ...processRes });
    }

    if (action === 'process_queue') {
      const processRes = await processPendingNotificationEvents();
      return NextResponse.json({ success: true, ...processRes });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

