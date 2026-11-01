import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { payments, orders, orderTimelineEvents, auditLogs, customerLedger } from '@/lib/db/schema';
import { fcmService } from '@/lib/services/fcm';
import { communicationService } from '@/lib/services/communication';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let paymentList;
  if (sessionUser.role === 'customer') {
    paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.customerId, sessionUser.id))
      .orderBy(desc(payments.createdAt));
  } else {
    paymentList = await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  return NextResponse.json({ payments: paymentList });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Super Admin or staff with accounts permission
  if (sessionUser.role !== 'super_admin' && !sessionUser.permissions.includes('accounts')) {
    return NextResponse.json({ error: 'Permission denied to manage payments.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      paymentMethod = 'Bank Transfer',
      paymentType = 'Progress Installment',
      transactionReference,
      notes,
    } = body;

    const numericAmount = Number(amount);
    if (!orderId || !numericAmount || numericAmount <= 0) {
      return NextResponse.json({ error: 'Valid order ID and positive payment amount are required.' }, { status: 400 });
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const newPaidAmount = (order.paidAmount || 0) + numericAmount;
    const newRemainingBalance = Math.max(0, order.totalAmount - newPaidAmount);

    const now = new Date().toISOString();
    const paymentId = `pay_${Date.now()}`;
    const paymentNumber = `REC-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Insert payment record
    await db.insert(payments).values({
      id: paymentId,
      paymentNumber,
      orderId,
      customerId: order.customerId,
      amount: numericAmount,
      paymentMethod,
      paymentType,
      transactionReference: transactionReference || `TXN-${Date.now().toString().slice(-6)}`,
      receiptUrl: `/api/receipts/${paymentNumber}`,
      notes: notes || null,
      receivedBy: sessionUser.name,
      createdAt: now,
    });

    // 2. Update order paidAmount, remainingBalance, and paymentStatus
    const newPaymentStatus = newRemainingBalance <= 0 ? 'paid' : 'partially_paid';
    await db
      .update(orders)
      .set({
        paidAmount: newPaidAmount,
        remainingBalance: newRemainingBalance,
        paymentStatus: newPaymentStatus,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    // 2b. Record in Customer Ledger
    await db.insert(customerLedger).values({
      id: `ledg_${Date.now()}_cred`,
      customerId: order.customerId,
      orderId,
      entryType: 'payment_credit',
      amount: numericAmount,
      balanceAfter: newRemainingBalance,
      description: `Payment credited for order #${order.orderNumber} via ${paymentMethod} (${paymentType}). Receipt #${paymentNumber}`,
      paymentMethod,
      reference: paymentNumber,
      recordedBy: sessionUser.name,
      isReversed: 0,
      reversalReason: null,
      createdAt: now,
    });

    // 3. Add timeline event
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_pay`,
      orderId,
      title: `Payment Received: $${numericAmount.toLocaleString()} (${paymentType})`,
      description: `Payment receipt #${paymentNumber} generated via ${paymentMethod}. Remaining balance: $${newRemainingBalance.toLocaleString()}.`,
      stage: order.productionStage,
      eventType: 'payment',
      performedBy: sessionUser.name,
      createdAt: now,
    });

    // 4. Notify customer
    await fcmService.sendNotification({
      userId: order.customerId,
      title: `Payment Acknowledged: Receipt #${paymentNumber}`,
      message: `We have received your payment of $${numericAmount.toLocaleString()} for order ${order.orderNumber}. Remaining balance: $${newRemainingBalance.toLocaleString()}.`,
      type: 'payment_received',
      relatedOrderId: orderId,
    });

    // 4b. Dispatch electronic receipt via Email / SMS
    await communicationService.sendCommunication({
      customerId: order.customerId,
      channel: 'email',
      templateType: 'payment_receipt',
      variables: {
        orderNumber: order.orderNumber,
        paymentNumber,
        amount: numericAmount,
        paymentMethod,
        transactionReference: transactionReference || 'N/A',
        remainingBalance: newRemainingBalance,
      },
      relatedOrderId: orderId,
    });

    // 5. Audit log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'RECORD_PAYMENT',
      details: `Recorded $${numericAmount} payment [${paymentNumber}] for order ${order.orderNumber}.`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentId,
        paymentNumber,
        amount: numericAmount,
        remainingBalance: newRemainingBalance,
        paidAmount: newPaidAmount,
      },
    });
  } catch (error) {
    console.error('Record payment error:', error);
    return NextResponse.json({ error: 'Failed to record payment.' }, { status: 500 });
  }
}

