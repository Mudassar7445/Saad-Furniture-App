import { db } from '../db';
import { notifications } from '../db/schema';

export interface PushNotificationPayload {
  userId: string; // Specific user ID or 'all' for announcements
  title: string;
  message: string;
  type: 'order_update' | 'payment_received' | 'stage_completed' | 'announcement' | 'system' | 'delivery_update' | 'media_uploaded' | 'product_update';
  relatedOrderId?: string;
  fcmToken?: string;
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
      gateway: 'Firebase Cloud Messaging (FCM HTTP v1)',
      status: this.isConfigured ? 'Active' : 'Simulation Mode (In-App Delivery Active)',
    };
  }

  /**
   * Dispatches push notification and records into the in-app notifications database
   */
  public async sendNotification(payload: PushNotificationPayload) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // 1. Save to in-app notification center database
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

    // 2. If FCM server key is configured, push to Google Firebase FCM
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

