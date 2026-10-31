import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions, notifications } from '../db/schema';
import { eq } from 'drizzle-orm';

// Production VAPID Keys for Saad Furniture PWA & Mobile Web Push
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BCKPk6OVb4LU1-LP6M_rvU8WpFu5y8Xa4_5spVYBu48tzXggZ2DUeIspuCXaYXTJXXk9C7pLcsz1WFXr8OQ4hbE';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'psXBe-WgES_UNtTo9PgagDzYVjvY4reFRgrWP0Fz8AA';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:saadfurniture360@gmail.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('VAPID initialization note:', e);
}

export interface WebPushPayload {
  userId?: string; // Target specific user ID or 'all'
  title: string;
  message: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  relatedOrderId?: string;
  type?: 'stage_completed' | 'order_update' | 'media_uploaded' | 'payment_received' | 'announcement';
}

/**
 * Dispatches a real Android/Mobile Push Notification to the user's phone status tray.
 * Works even when the app is closed or the user is using other apps.
 */
export async function sendWebPushNotification(payload: WebPushPayload) {
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // 1. Store in internal notifications table so in-app bell icon reflects it
  if (payload.userId && payload.userId !== 'all') {
    try {
      await db.insert(notifications).values({
        id: notifId,
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'order_update',
        relatedOrderId: payload.relatedOrderId || null,
        isRead: 0,
        createdAt: now,
      });
    } catch (dbErr) {
      console.warn('Failed to insert in-app notification:', dbErr);
    }
  }

  // 2. Query push subscriptions from Turso
  try {
    let subs: any[] = [];
    if (!payload.userId || payload.userId === 'all') {
      subs = await db.select().from(pushSubscriptions);
    } else {
      subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, payload.userId));
    }

    if (subs.length === 0) {
      return { success: true, count: 0, note: 'No push subscriptions registered for this recipient.' };
    }

    const pushContent = JSON.stringify({
      title: payload.title,
      body: payload.message,
      message: payload.message,
      url: payload.url || (payload.relatedOrderId ? `/orders/${payload.relatedOrderId}` : '/'),
      icon: payload.icon || '/assets/branding/app-dp.png',
      badge: payload.badge || '/assets/branding/notification-icon.svg',
      tag: payload.tag || `order-${payload.relatedOrderId || 'general'}`,
      timestamp: Date.now(),
    });

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          let pushSubObj: any = null;
          if (sub.subscriptionJson) {
            pushSubObj = JSON.parse(sub.subscriptionJson);
          } else if (sub.endpoint && sub.p256dh && sub.auth) {
            pushSubObj = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };
          } else if (sub.fcmToken && sub.fcmToken.startsWith('{')) {
            pushSubObj = JSON.parse(sub.fcmToken);
          }

          if (!pushSubObj || !pushSubObj.endpoint) {
            return false;
          }

          await webpush.sendNotification(pushSubObj, pushContent, {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: 'high',
          });
          return true;
        } catch (err: any) {
          // If 404 or 410 Gone, subscription expired on user's device
          if (err.statusCode === 404 || err.statusCode === 410) {
            try {
              await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
            } catch {}
          }
          throw err;
        }
      })
    );

    const sentCount = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
    return { success: true, count: sentCount };
  } catch (err) {
    console.error('Web Push delivery error:', err);
    return { success: false, error: String(err) };
  }
}

