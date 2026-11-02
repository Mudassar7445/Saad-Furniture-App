import { db } from '../db';
import { notifications } from '../db/schema';
import { queueNotificationEvent, NotificationCategory } from './webpush';

export interface PushNotificationPayload {
  userId: string; // Specific customer ID, email, or 'all' for announcements
  title: string;
  message: string;
  type: 'order_update' | 'payment_received' | 'stage_completed' | 'announcement' | 'system' | 'delivery_update' | 'media_uploaded' | 'product_update';
  relatedOrderId?: string;
  fcmToken?: string;
  url?: string;
}

export class FCMNotificationService {
  private serverKey: string;
  private isConfigured: boolean;

  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || '';
    this.isConfigured = !!this.serverKey;
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      gateway: 'Web Push (VAPID) & FCM Gateway',
      status: 'Active (Real Web Push & In-App Outbox)',
    };
  }

  /**
   * Dispatches push notification to customer devices and records into the in-app notification center database
   */
  public async sendNotification(payload: PushNotificationPayload) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 1. Save to in-app notification center database
    try {
      await db.insert(notifications).values({
        id,
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        relatedOrderId: payload.relatedOrderId || null,
        isRead: 0,
        createdAt: now,
      });
    } catch (dbErr) {
      console.warn('In-app notification save warning:', dbErr);
    }

    // 2. Queue and dispatch real Web Push Notification via Outbox
    try {
      let category: NotificationCategory = 'orders';
      if (payload.type === 'product_update') {
        category = 'products';
      } else if (payload.type === 'media_uploaded') {
        category = 'workshop';
      } else if (payload.type === 'announcement' || payload.type === 'system') {
        category = 'announcements';
      }

      const deepLinkUrl = payload.url || (payload.relatedOrderId ? `/orders/${payload.relatedOrderId}` : '/');

      await queueNotificationEvent({
        type:
          payload.type === 'product_update'
            ? 'product_update'
            : payload.type === 'media_uploaded'
            ? 'workshop_update'
            : payload.type === 'stage_completed'
            ? 'order_progress'
            : 'order_status',
        category,
        title: payload.title,
        message: payload.message,
        url: deepLinkUrl,
        targetUserId: payload.userId,
        relatedId: payload.relatedOrderId,
      });
    } catch (pushErr) {
      console.warn('Web push queuing warning:', pushErr);
    }

    // 3. If FCM server key is configured, push to Google Firebase FCM legacy endpoint
    if (this.isConfigured && payload.fcmToken) {
      try {
        await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${this.serverKey}`,
          },
          body: JSON.stringify({
            to: payload.fcmToken,
            notification: {
              title: payload.title,
              body: payload.message,
              sound: 'default',
            },
            data: {
              orderId: payload.relatedOrderId || '',
              type: payload.type,
            },
          }),
        });
      } catch (err) {
        console.error('FCM Dispatch error:', err);
      }
    }

    return { success: true, id };
  }
}

export const fcmService = new FCMNotificationService();
