import { db } from '@/lib/db';
import { communicationLogs, notificationPreferences, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface SendMessageOptions {
  customerId: string;
  channel: 'email' | 'sms' | 'whatsapp';
  templateType: 'order_confirmation' | 'stage_update' | 'delivery_dispatch' | 'payment_receipt' | 'announcement' | 'custom';
  subject?: string;
  recipient?: string;
  variables?: Record<string, string | number>;
  customBody?: string;
  relatedOrderId?: string;
}

export class CommunicationService {
  private formatTemplate(type: string, vars: Record<string, string | number> = {}): { subject: string; body: string } {
    const customerName = vars.customerName || 'Valued Patron';
    const orderNumber = vars.orderNumber || '';
    const currency = vars.currency || 'PKR ';

    switch (type) {
      case 'order_confirmation':
        return {
          subject: `Saad Furniture Order Confirmation #${orderNumber}`,
          body: `Dear ${customerName},\n\nThank you for choosing Saad Furniture. Your bespoke commission #${orderNumber} for "${vars.productTitle || 'Custom Furniture'}" has been officially confirmed.\n\nTotal Investment: ${currency}${vars.totalAmount || 0}\nAdvance Paid: ${currency}${vars.paidAmount || 0}\nRemaining Balance: ${currency}${vars.remainingBalance || 0}\nEstimated Completion: ${vars.expectedCompletionDate || 'To be scheduled'}\n\nYou can track live manufacturing progress, view exclusive HD artisan photos, and inspect delivery milestones anytime via your Saad Furniture portal.\n\nWarm regards,\nSaad Furniture Concierge Team`,
        };

      case 'stage_update':
        return {
          subject: `Manufacturing Milestone: Order #${orderNumber} is now ${vars.stageTitle}`,
          body: `Dear ${customerName},\n\nArtisan Progress Update on order #${orderNumber} (${vars.productTitle || 'Custom Piece'}):\n\nYour furniture has advanced to the "${vars.stageTitle}" stage (${vars.progress || 0}% completed).\n${vars.notes ? `Artisan Notes: "${vars.notes}"\n` : ''}\nPhotographs and progress footage have been logged to your private media vault in the portal.\n\nSaad Furniture Atelier`,
        };

      case 'delivery_dispatch':
        return {
          subject: `White-Glove Dispatch: Order #${orderNumber} is on the way`,
          body: `Dear ${customerName},\n\nYour handcrafted piece for order #${orderNumber} has passed rigorous white-glove quality inspection and is now dispatched!\n\nDelivery Address: ${vars.deliveryAddress || 'On file'}\nAssigned White-Glove Specialist: ${vars.driverName || 'Saad Logistics Staff'} (${vars.driverPhone || 'Contact Support'})\nEstimated Arrival Window: ${vars.deliveryTimeWindow || 'Scheduled today'}\n\nPlease ensure your space is ready for seamless installation.\n\nSaad Furniture Logistics`,
        };

      case 'payment_receipt':
        return {
          subject: `Payment Acknowledged: Receipt #${vars.paymentNumber} (${currency}${vars.amount})`,
          body: `Dear ${customerName},\n\nWe acknowledge receipt of payment for order #${orderNumber}.\n\nReceipt Number: #${vars.paymentNumber}\nAmount Credited: ${currency}${vars.amount}\nPayment Method: ${vars.paymentMethod || 'Bank Transfer'}\nTransaction Reference: ${vars.transactionReference || 'N/A'}\nRemaining Balance: ${currency}${vars.remainingBalance || 0}\n\nAn official electronic receipt has been generated and archived in your customer ledger.\n\nSaad Furniture Accounts Bureau`,
        };

      case 'announcement':
        return {
          subject: `Exclusive Saad Furniture Announcement: ${vars.announcementTitle || 'New Collection Showcase'}`,
          body: `Dear ${customerName},\n\n${vars.announcementMessage || 'We are excited to share new artisanal masterpieces now available in our luxury showroom.'}\n\nExplore our latest catalogue and bespoke offerings in your Saad Furniture portal.\n\nWarm regards,\nSaad Furniture Management`,
        };

      default:
        return {
          subject: vars.subject?.toString() || 'Saad Furniture Notification',
          body: vars.body?.toString() || '',
        };
    }
  }

  async sendCommunication(options: SendMessageOptions): Promise<{ success: boolean; logId: string; error?: string }> {
    const { customerId, channel, templateType, variables = {}, customBody, relatedOrderId } = options;

    try {
      // 1. Fetch user & notification preferences
      const [user] = await db.select().from(users).where(eq(users.id, customerId)).limit(1);
      if (!user) {
        throw new Error(`Customer with ID ${customerId} not found.`);
      }

      // Check opt-in preferences
      const [prefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, customerId))
        .limit(1);

      if (prefs) {
        if (channel === 'email' && prefs.emailNotifications === 0) {
          console.log(`[CommunicationService] Customer ${user.name} has opted out of Email.`);
        }
        if ((channel === 'sms' || channel === 'whatsapp') && prefs.smsNotifications === 0) {
          console.log(`[CommunicationService] Customer ${user.name} has opted out of SMS/WhatsApp.`);
        }
        if (templateType === 'announcement' && prefs.marketingOptIn === 0) {
          console.log(`[CommunicationService] Customer ${user.name} opted out of promotional announcements.`);
          return { success: false, logId: '', error: 'Customer has opted out of marketing communications.' };
        }
      }

      const recipient =
        options.recipient ||
        (channel === 'email' ? user.email : user.phone || user.email);

      const templateResult = this.formatTemplate(templateType, {
        customerName: user.name,
        ...variables,
      });

      const finalSubject = options.subject || templateResult.subject;
      const finalBody = customBody || templateResult.body;

      // Mock/Live Dispatcher (SMTP / Twilio / WhatsApp Business API)
      console.log(`\n========================================`);
      console.log(`[COMMUNICATION DISPATCH via ${channel.toUpperCase()}]`);
      console.log(`To: ${recipient}`);
      console.log(`Subject: ${finalSubject}`);
      console.log(`Message:\n${finalBody}`);
      console.log(`========================================\n`);

      // Store in communicationLogs table
      const logId = `commlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      await db.insert(communicationLogs).values({
        id: logId,
        customerId: user.id,
        channel,
        recipient,
        subject: finalSubject,
        messageBody: finalBody,
        status: 'sent',
        errorMessage: null,
        relatedOrderId: relatedOrderId || null,
        retryCount: 0,
        sentAt: now,
      });

      return { success: true, logId };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[CommunicationService] Error delivering message:', errorMessage);
      return { success: false, logId: '', error: errorMessage };
    }
  }

  async broadcastAnnouncement({
    title,
    message,
    channel = 'email',
  }: {
    title: string;
    message: string;
    channel: 'email' | 'sms' | 'whatsapp';
  }): Promise<{ sentCount: number; errors: number }> {
    const customers = await db.select().from(users).where(eq(users.role, 'customer'));
    let sentCount = 0;
    let errors = 0;

    for (const customer of customers) {
      const res = await this.sendCommunication({
        customerId: customer.id,
        channel,
        templateType: 'announcement',
        subject: title,
        variables: {
          announcementTitle: title,
          announcementMessage: message,
        },
      });

      if (res.success) {
        sentCount++;
      } else {
        errors++;
      }
    }

    return { sentCount, errors };
  }
}

export const communicationService = new CommunicationService();
