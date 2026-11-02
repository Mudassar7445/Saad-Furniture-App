import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { payments, orders, customerLedger, orderTimelineEvents, auditLogs } from '@/lib/db/schema';
import { fcmService } from '@/lib/services/fcm';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteParams) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Only Super Admin or accounts staff
  if (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('accounts')) {
    return NextResponse.json({ error: 'Permission denied. Super Admin or Accounts Manager role required.' }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { reversalReason } = body;

    if (!reversalReason || typeof reversalReason !== 'string' || reversalReason.trim().length < 5) {
      return NextResponse.json(
        { error: 'A clear reversal reason (at least 5 characters) is required for financial auditing.' },
        { status: 400 }
      );
    }

    const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
    }

    if (payment.isReversed === 1) {
      return NextResponse.json({ error: 'This payment transaction has already been reversed.' }, { status: 400 });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, payment.orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Associated order not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // 1. Mark payment as reversed
    await db
      .update(payments)
      .set({
        isReversed: 1,
        reversalReason: reversalReason.trim(),
      })
      .where(eq(payments.id, id));

    // 2. Recalculate order financial balances
    const newPaidAmount = Math.max(0, (order.paidAmount || 0) - payment.amount);
    const newRemainingBalance = Math.max(0, order.totalAmount - newPaidAmount);

    await db
      .update(orders)
      .set({
        paidAmount: newPaidAmount,
        remainingBalance: newRemainingBalance,
        updatedAt: now,
      })
      .where(eq(orders.id, order.id));

    // 3. Insert into customerLedger as reversal entry
    await db.insert(customerLedger).values({
      id: `ledg_${Date.now()}_rev`,
      customerId: payment.customerId,
      orderId: payment.orderId,
      entryType: 'reversal',
      amount: -payment.amount,
      balanceAfter: newRemainingBalance,
      description: `Reversal of payment #${payment.paymentNumber}. Reason: "${reversalReason.trim()}"`,
      paymentMethod: payment.paymentMethod,
      reference: payment.paymentNumber,
      recordedBy: sessionUser.name,
      isReversed: 0,
      reversalReason: null,
      createdAt: now,
    });

    // 4. Timeline Event
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_rev`,
      orderId: payment.orderId,
      title: `Payment Reversal: Receipt #${payment.paymentNumber}`,
      description: `Payment of PKR ${payment.amount.toLocaleString()} was reversed by ${sessionUser.name}. Reason: ${reversalReason.trim()}. Updated balance: PKR ${newRemainingBalance.toLocaleString()}.`,
      stage: order.productionStage,
      eventType: 'payment',
      performedBy: sessionUser.name,
      createdAt: now,
    });

    // 5. Audit Log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_rev`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'PAYMENT_REVERSAL',
      details: `Reversed payment #${payment.paymentNumber} (PKR ${payment.amount}) on order ${order.orderNumber}. Reason: ${reversalReason.trim()}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    // 6. Notify Customer
    await fcmService.sendNotification({
      userId: payment.customerId,
      title: `Financial Adjustment: Receipt #${payment.paymentNumber}`,
      message: `A payment reversal of PKR ${payment.amount.toLocaleString()} was processed. Reason: ${reversalReason.trim()}. Outstanding balance is now PKR ${newRemainingBalance.toLocaleString()}.`,
      type: 'payment_received',
      relatedOrderId: order.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment has been successfully reversed with complete audit trail.',
      reversal: {
        paymentId: id,
        amountReversed: payment.amount,
        newPaidAmount,
        newRemainingBalance,
      },
    });
  } catch (error) {
    console.error('Reversal error:', error);
    return NextResponse.json({ error: 'Failed to process payment reversal.' }, { status: 500 });
  }
}

