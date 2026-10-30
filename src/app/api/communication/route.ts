import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { communicationLogs, users } from '@/lib/db/schema';
import { communicationService } from '@/lib/services/communication';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');

  let logs;
  if (sessionUser.role === 'customer') {
    logs = await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.customerId, sessionUser.id))
      .orderBy(desc(communicationLogs.sentAt))
      .limit(50);
  } else if (customerId) {
    logs = await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.customerId, customerId))
      .orderBy(desc(communicationLogs.sentAt))
      .limit(50);
  } else {
    logs = await db
      .select()
      .from(communicationLogs)
      .orderBy(desc(communicationLogs.sentAt))
      .limit(100);
  }

  return NextResponse.json({ logs });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('orders'))) {
    return NextResponse.json({ error: 'Unauthorized. Staff or Admin privileges required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, customerId, channel = 'email', title, message, orderId } = body;

    if (action === 'broadcast') {
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required for broadcasts.' }, { status: 400 });
      }

      const result = await communicationService.broadcastAnnouncement({
        title,
        message,
        channel,
      });

      return NextResponse.json({
        success: true,
        message: `Broadcast completed. Sent to ${result.sentCount} customers (${result.errors} skipped/errored).`,
        ...result,
      });
    }

    if (!customerId || !message) {
      return NextResponse.json({ error: 'Customer ID and message body are required.' }, { status: 400 });
    }

    const result = await communicationService.sendCommunication({
      customerId,
      channel,
      templateType: 'custom',
      subject: title || 'Saad Furniture Concierge Notice',
      customBody: message,
      relatedOrderId: orderId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to dispatch message.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, logId: result.logId });
  } catch (error) {
    console.error('Communication error:', error);
    return NextResponse.json({ error: 'Internal server error while processing communication.' }, { status: 500 });
  }
}

