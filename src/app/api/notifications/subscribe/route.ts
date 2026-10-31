import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { VAPID_PUBLIC_KEY, sendWebPushNotification } from '@/lib/services/webpush';
import { eq, or } from 'drizzle-orm';

/**
 * GET /api/notifications/subscribe
 * Returns the VAPID Public Key for client PushManager registration
 */
export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY,
  });
}

/**
 * POST /api/notifications/subscribe
 * Saves or updates a client's PushSubscription object in Turso
 */
export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    const body = await req.json();

    const { subscription, deviceType = 'android', test = false } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Valid push subscription is required.' }, { status: 400 });
    }

    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys?.p256dh || '';
    const auth = subscription.keys?.auth || '';
    const userId = sessionUser?.id || body.userId || 'guest_patron';

    // Remove existing duplicate subscription for this endpoint
    try {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    } catch {}

    const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await db.insert(pushSubscriptions).values({
      id,
      userId,
      fcmToken: JSON.stringify(subscription),
      subscriptionJson: JSON.stringify(subscription),
      endpoint,
      p256dh,
      auth,
      deviceType,
      createdAt: now,
    });

    // If requested, send immediate confirmation notification
    if (test) {
      await sendWebPushNotification({
        userId,
        title: 'Saad Furniture Notifications Active 🔔',
        message: 'You will now receive instant craftsmanship milestones and media alerts even when browsing other apps.',
        url: '/',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Mobile push notifications successfully registered.',
      subscriptionId: id,
    });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: 'Failed to register push subscription.' }, { status: 500 });
  }
}

