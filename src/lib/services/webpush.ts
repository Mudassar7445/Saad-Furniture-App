import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions, notifications, notificationEvents, notificationPreferences, users } from '../db/schema';
import { eq, and, lte, or, inArray } from 'drizzle-orm';

// Production VAPID Keys for Saad Furniture PWA & Mobile Web Push
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
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

export type NotificationCategory = 'products' | 'workshop' | 'orders' | 'announcements';

export interface QueueEventPayload {
  type: 'new_product' | 'product_update' | 'workshop_update' | 'order_progress' | 'order_status' | 'announcement';
  category: NotificationCategory;
  title: string;
  message: string;
  url?: string;
  icon?: string;
  badge?: string;
  targetUserId?: string; // Specific customer ID, email, phone or 'all'
  relatedId?: string;
}

/**
 * 1. Safely queues a notification event into the database Outbox.
 * Dispatches asynchronously to subscribed devices with zero frontend blocking.
 */
export async function queueNotificationEvent(payload: QueueEventPayload) {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const targetUser = payload.targetUserId || 'all';

  try {
    // 1. Insert into persistent Outbox
    await db.insert(notificationEvents).values({
      id: eventId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      url: payload.url || '/',
      icon: payload.icon || '/assets/branding/app-dp.png',
      badge: payload.badge || '/assets/branding/notification-icon.svg',
      targetUserId: targetUser,
      category: payload.category || 'announcements',
      relatedId: payload.relatedId || null,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      sentCount: 0,
      failedCount: 0,
      scheduledAt: now,
      createdAt: now,
    });

    // 2. Insert into in-app notifications table so in-app bell displays the update
    try {
      const inAppNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.insert(notifications).values({
        id: inAppNotifId,
        userId: targetUser,
        title: payload.title,
        message: payload.message,
        type:
          payload.type === 'new_product' || payload.type === 'product_update'
            ? 'product_update'
            : payload.type === 'workshop_update'
            ? 'media_uploaded'
            : 'order_update',
        relatedOrderId: payload.relatedId || null,
        isRead: 0,
        createdAt: now,
      });
    } catch {}

    // 3. Trigger Outbox Processing non-blocking for instant sub-second delivery
    // Safe for Vercel Serverless execution
    processPendingNotificationEvents().catch((err) => {
      console.warn('Background outbox dispatch note:', err);
    });

    return { success: true, eventId };
  } catch (err: any) {
    console.error('Failed to queue notification event:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. Processes pending notification events from the outbox with retry & exponential backoff.
 */
export async function processPendingNotificationEvents(): Promise<{ processed: number; sent: number; failed: number }> {
  const now = new Date().toISOString();
  let totalProcessed = 0;
  let totalSent = 0;
  let totalFailed = 0;

  try {
    // Select up to 10 pending events scheduled for now or earlier
    const pendingEvents = await db
      .select()
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.status, 'pending'),
          lte(notificationEvents.scheduledAt, now)
        )
      )
      .limit(10);

    if (pendingEvents.length === 0) {
      return { processed: 0, sent: 0, failed: 0 };
    }

    for (const evt of pendingEvents) {
      totalProcessed++;
      const currentAttempts = (evt.attempts || 0) + 1;

      // Mark as processing
      try {
        await db
          .update(notificationEvents)
          .set({ status: 'processing', attempts: currentAttempts })
          .where(eq(notificationEvents.id, evt.id));
      } catch {}

      try {
        // Query eligible push subscriptions
        let subs: any[] = [];
        if (evt.targetUserId !== 'all') {
          // Robust Customer Identity Lookup: Match by ID, Email, or Phone
          const targetIds: string[] = [evt.targetUserId];
          try {
            const [matchedUser] = await db
              .select({ id: users.id, email: users.email, phone: users.phone })
              .from(users)
              .where(
                or(
                  eq(users.id, evt.targetUserId),
                  eq(users.email, evt.targetUserId),
                  eq(users.phone, evt.targetUserId)
                )
              )
              .limit(1);

            if (matchedUser) {
              if (matchedUser.id) targetIds.push(matchedUser.id);
              if (matchedUser.email) targetIds.push(matchedUser.email);
              if (matchedUser.phone) targetIds.push(matchedUser.phone);
            }
          } catch {}

          const uniqueTargetIds = Array.from(new Set(targetIds.filter(Boolean)));

          subs = await db
            .select()
            .from(pushSubscriptions)
            .where(inArray(pushSubscriptions.userId, uniqueTargetIds));
        } else {
          // All subscribers: Filter by category preference if customer opted out
          subs = await db.select().from(pushSubscriptions);

          try {
            const prefs = await db.select().from(notificationPreferences);
            const optOutUserIds = new Set<string>();

            for (const p of prefs) {
              if (evt.category === 'products' && p.newProducts === 0 && p.productUpdates === 0) {
                optOutUserIds.add(p.userId);
              } else if (evt.category === 'workshop' && p.workshopUpdates === 0) {
                optOutUserIds.add(p.userId);
              } else if (evt.category === 'orders' && p.orderProgress === 0) {
                optOutUserIds.add(p.userId);
              } else if (evt.category === 'announcements' && p.announcements === 0) {
                optOutUserIds.add(p.userId);
              }
            }

            if (optOutUserIds.size > 0) {
              subs = subs.filter((s) => !optOutUserIds.has(s.userId));
            }
          } catch {}
        }

        if (subs.length === 0) {
          // No active subscribers for this event
          await db
            .update(notificationEvents)
            .set({
              status: 'completed',
              completedAt: new Date().toISOString(),
              sentCount: 0,
              failedCount: 0,
              lastError: evt.targetUserId !== 'all'
                ? `Customer (${evt.targetUserId}) has no active registered push devices.`
                : 'No active push subscriptions found in database.',
            })
            .where(eq(notificationEvents.id, evt.id));
          continue;
        }

        const pushPayload = JSON.stringify({
          title: evt.title,
          body: evt.message,
          message: evt.message,
          url: evt.url || '/',
          icon: evt.icon || '/assets/branding/app-dp.png',
          badge: evt.badge || '/assets/branding/notification-icon.svg',
          tag: `saad-${evt.type}-${evt.relatedId || 'update'}`,
          timestamp: Date.now(),
        });

        // Concurrently dispatch to all target devices
        const results = await Promise.allSettled(
          subs.map(async (sub) => {
            let subObj: any = null;
            try {
              if (sub.subscriptionJson) {
                subObj = JSON.parse(sub.subscriptionJson);
              } else if (sub.endpoint && sub.p256dh && sub.auth) {
                subObj = {
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                };
              } else if (sub.fcmToken && sub.fcmToken.startsWith('{')) {
                subObj = JSON.parse(sub.fcmToken);
              }
            } catch {}

            if (!subObj || !subObj.endpoint) return false;

            try {
              await webpush.sendNotification(subObj, pushPayload, {
                TTL: 86400, // 24 hours
                urgency: 'high',
              });
              return true;
            } catch (pushErr: any) {
              // Auto-prune dead/expired subscriptions (404 / 410)
              if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                try {
                  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
                } catch {}
              }
              throw pushErr;
            }
          })
        );

        const sent = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
        const failed = results.length - sent;

        totalSent += sent;
        totalFailed += failed;

        // Mark completed or schedule retry with exponential backoff
        if (sent > 0 || currentAttempts >= (evt.maxAttempts || 3)) {
          await db
            .update(notificationEvents)
            .set({
              status: sent > 0 ? 'completed' : 'failed',
              sentCount: sent,
              failedCount: failed,
              completedAt: new Date().toISOString(),
              lastError: failed > 0 ? `${failed} subscriptions failed delivery` : null,
            })
            .where(eq(notificationEvents.id, evt.id));
        } else {
          // Exponential backoff: 30s * (2 ^ attempts)
          const backoffSec = 30 * Math.pow(2, currentAttempts);
          const nextTry = new Date(Date.now() + backoffSec * 1000).toISOString();
          await db
            .update(notificationEvents)
            .set({
              status: 'pending',
              scheduledAt: nextTry,
              sentCount: sent,
              failedCount: failed,
              lastError: `${failed} delivery attempts failed. Rescheduled for retry.`,
            })
            .where(eq(notificationEvents.id, evt.id));
        }
      } catch (evtErr: any) {
        console.error('Error processing notification event:', evtErr);
        await db
          .update(notificationEvents)
          .set({
            status: currentAttempts >= (evt.maxAttempts || 3) ? 'failed' : 'pending',
            lastError: evtErr.message || 'Unknown processing error',
          })
          .where(eq(notificationEvents.id, evt.id));
      }
    }
  } catch (err) {
    console.error('Outbox processor error:', err);
  }

  return { processed: totalProcessed, sent: totalSent, failed: totalFailed };
}

/**
 * Direct compatibility helper for immediate sends
 */
export async function sendWebPushNotification(payload: {
  userId?: string;
  title: string;
  message: string;
  url?: string;
  category?: NotificationCategory;
  relatedOrderId?: string;
  type?: any;
}) {
  return queueNotificationEvent({
    type: payload.type || 'announcement',
    category: payload.category || (payload.relatedOrderId ? 'orders' : 'announcements'),
    title: payload.title,
    message: payload.message,
    url: payload.url || (payload.relatedOrderId ? `/orders/${payload.relatedOrderId}` : '/'),
    targetUserId: payload.userId || 'all',
    relatedId: payload.relatedOrderId,
  });
}
