import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import {
  bankTransferReceipts,
  orders,
  payments,
  customerLedger,
  orderTimelineEvents,
  notifications,
  auditLogs,
} from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('accounts'))
    ) {
      return NextResponse.json({ error: 'Unauthorized: Permission to review payments required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, notes, rejectionReason, verifiedAmount } = body; // action: 'approve' | 'reject'

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Valid action (approve | reject) is required.' }, { status: 400 });
    }

    const [receipt] = await db
      .select()
      .from(bankTransferReceipts)
      .where(eq(bankTransferReceipts.id, id))
      .limit(1);

    if (!receipt) {
      return NextResponse.json({ error: 'Payment submission not found.' }, { status: 404 });
    }

    if (receipt.status === 'approved') {
      return NextResponse.json({ error: 'This payment submission has already been approved.' }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, receipt.orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Associated order not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'approve') {
      const creditAmount = verifiedAmount ? Number(verifiedAmount) : receipt.amountPaid;
      const currentPaid = Number(order.paidAmount || 0);
      const totalAmount = Number(order.totalAmount);
      const newPaidAmount = currentPaid + creditAmount;
      const newRemainingBalance = Math.max(0, totalAmount - newPaidAmount);
      const newPaymentStatus = newRemainingBalance <= 0 ? 'paid' : 'partially_paid';

      // 1. Update bank transfer receipt record
      await db
        .update(bankTransferReceipts)
        .set({
          status: 'approved',
          reviewNotes: notes?.trim() || 'Verified and approved by Saad Accounts Bureau.',
          rejectionReason: null,
          reviewedBy: sessionUser.name,
          reviewedAt: now,
        })
        .where(eq(bankTransferReceipts.id, receipt.id));

      // 2. Update order financial record
      await db
        .update(orders)
        .set({
          paidAmount: newPaidAmount,
          remainingBalance: newRemainingBalance,
          paymentStatus: newPaymentStatus,
          updatedAt: now,
        })
        .where(eq(orders.id, order.id));

      // 3. Record official payment in payments table
      const paymentNumber = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
      const paymentRecord = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        paymentNumber,
        orderId: order.id,
        customerId: order.customerId,
        amount: creditAmount,
        paymentMethod: 'Bank Transfer',
        paymentType: newRemainingBalance <= 0 ? 'Final Balance' : 'Progress Installment',
        transactionReference: receipt.transactionReference,
        receiptUrl: receipt.receiptImageUrl,
        notes: `Bank transfer approved by ${sessionUser.name}. Transferred via ${receipt.bankName}.`,
        receivedBy: sessionUser.name,
        isReversed: 0,
        reversalReason: null,
        createdAt: now,
      };
      await db.insert(payments).values(paymentRecord);

      // 4. Record credit entry in customerLedger
      await db.insert(customerLedger).values({
        id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        customerId: order.customerId,
        orderId: order.id,
        entryType: 'payment_credit',
        amount: creditAmount,
        balanceAfter: newRemainingBalance,
        description: `Verified Bank Transfer payment for Order #${order.orderNumber} (Ref: ${receipt.transactionReference})`,
        paymentMethod: 'Bank Transfer',
        reference: receipt.transactionReference,
        recordedBy: sessionUser.name,
        isReversed: 0,
        reversalReason: null,
        createdAt: now,
      });

      // 5. Order timeline event
      await db.insert(orderTimelineEvents).values({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.id,
        title: 'Bank Transfer Payment Verified',
        description: `₨${creditAmount.toLocaleString()} payment approved by ${sessionUser.name}. Remaining balance: ₨${newRemainingBalance.toLocaleString()}.`,
        stage: order.productionStage || 'order_confirmed',
        eventType: 'payment',
        performedBy: sessionUser.name,
        createdAt: now,
      });

      // 6. Notify Customer
      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: order.customerId,
        title: `Payment Confirmed: Order #${order.orderNumber}`,
        message: `Your bank transfer payment of ₨${creditAmount.toLocaleString()} has been verified. Remaining balance: ₨${newRemainingBalance.toLocaleString()}.`,
        type: 'payment_received',
        relatedOrderId: order.id,
        isRead: 0,
        createdAt: now,
      });

      // 7. Audit log
      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: 'APPROVE_BANK_TRANSFER',
        details: `Approved bank transfer submission [${receipt.id}] for Order #${order.orderNumber} (₨${creditAmount})`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: `Payment of ₨${creditAmount.toLocaleString()} verified and credited successfully.`,
        order: {
          id: order.id,
          paidAmount: newPaidAmount,
          remainingBalance: newRemainingBalance,
          paymentStatus: newPaymentStatus,
        },
      });
    } else {
      // REJECT
      const reasonText = rejectionReason?.trim() || notes?.trim() || 'Payment screenshot or reference could not be verified.';

      await db
        .update(bankTransferReceipts)
        .set({
          status: 'rejected',
          rejectionReason: reasonText,
          reviewNotes: notes?.trim() || null,
          reviewedBy: sessionUser.name,
          reviewedAt: now,
        })
        .where(eq(bankTransferReceipts.id, receipt.id));

      // Notify Customer with reason
      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: order.customerId,
        title: `Payment Verification Alert: Order #${order.orderNumber}`,
        message: `Your bank transfer submission could not be verified. Reason: "${reasonText}". Please submit a valid payment receipt.`,
        type: 'order_update',
        relatedOrderId: order.id,
        isRead: 0,
        createdAt: now,
      });

      // Audit log
      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: 'REJECT_BANK_TRANSFER',
        details: `Rejected bank transfer [${receipt.id}] for Order #${order.orderNumber}. Reason: ${reasonText}`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: now,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment submission marked as rejected and patron notified.',
      });
    }
  } catch (error: any) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to review submission' }, { status: 500 });
  }
}

