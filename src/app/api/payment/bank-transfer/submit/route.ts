import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { bankTransferReceipts, orders, notifications } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    const body = await request.json();

    const {
      orderId,
      bankName,
      senderAccountTitle,
      senderAccountNumber,
      transactionReference,
      amountPaid,
      receiptImageUrl,
    } = body;

    if (!orderId || !bankName || !senderAccountTitle || !transactionReference || !amountPaid || !receiptImageUrl) {
      return NextResponse.json(
        { error: 'Order ID, bank name, account title, transaction reference, amount, and receipt image are required.' },
        { status: 400 }
      );
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Determine user ID
    const userId = sessionUser?.id || order.customerId;
    const now = new Date().toISOString();
    const submissionId = `btr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.insert(bankTransferReceipts).values({
      id: submissionId,
      orderId: order.id,
      userId,
      bankName: bankName.trim(),
      senderAccountTitle: senderAccountTitle.trim(),
      senderAccountNumber: senderAccountNumber?.trim() || null,
      transactionReference: transactionReference.trim(),
      amountPaid: Number(amountPaid),
      receiptImageUrl: receiptImageUrl.trim(),
      status: 'pending',
      reviewNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: now,
    });

    // Update order payment status to pending_verification if not already paid
    if (order.paymentStatus !== 'paid') {
      await db
        .update(orders)
        .set({
          paymentStatus: 'pending_verification',
          paymentMethod: 'bank_transfer',
          updatedAt: now,
        })
        .where(eq(orders.id, order.id));
    }

    // Notify Admins
    try {
      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: 'usr_super_admin',
        title: `New Bank Transfer Submitted: Order #${order.orderNumber}`,
        message: `${senderAccountTitle} uploaded a receipt for ₨${Number(amountPaid).toLocaleString()} (Ref: ${transactionReference}) via ${bankName}.`,
        type: 'payment_received',
        relatedOrderId: order.id,
        isRead: 0,
        createdAt: now,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Bank transfer receipt submitted successfully. Pending atelier accounts verification.',
      submissionId,
    });
  } catch (error: any) {
    console.error('Submit bank transfer error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to submit payment' }, { status: 500 });
  }
}

