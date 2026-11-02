import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import {
  orders,
  orderItems,
  bankTransferReceipts,
  payments,
  customerLedger,
  orderTimelineEvents,
  notifications,
  auditLogs,
} from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const paymentStatus = url.searchParams.get('paymentStatus') || '';
    const orderStatus = url.searchParams.get('orderStatus') || '';

    // If Super Admin or staff with 'orders' permissions, fetch all; else fetch user's
    const isAdminOrStaff =
      sessionUser.role === 'super_admin' ||
      (sessionUser.role === 'staff' && sessionUser.permissions.includes('orders'));

    let allOrders = [];

    if (isAdminOrStaff) {
      allOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.orderType, 'online'))
        .orderBy(desc(orders.createdAt));
    } else {
      allOrders = await db
        .select()
        .from(orders)
        .where(and(eq(orders.customerId, sessionUser.id), eq(orders.orderType, 'online')))
        .orderBy(desc(orders.createdAt));
    }

    // Apply in-memory filters
    let filtered = allOrders;
    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(search) ||
          o.customerName.toLowerCase().includes(search) ||
          (o.customerPhone && o.customerPhone.includes(search)) ||
          (o.customerEmail && o.customerEmail.toLowerCase().includes(search))
      );
    }
    if (paymentStatus) {
      filtered = filtered.filter((o) => o.paymentStatus === paymentStatus);
    }
    if (orderStatus) {
      filtered = filtered.filter((o) => o.orderStatus === orderStatus);
    }

    // Fetch items and bank receipts for enriched orders
    const allItems = await db.select().from(orderItems);
    const allReceipts = await db.select().from(bankTransferReceipts);

    const enriched = filtered.map((o) => {
      const items = allItems.filter((i) => i.orderId === o.id);
      const receipt = allReceipts.find((r) => r.orderId === o.id);
      return {
        ...o,
        items,
        bankReceipt: receipt || null,
      };
    });

    return NextResponse.json({ orders: enriched, total: enriched.length });
  } catch (error: any) {
    console.error('Online Orders GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch online orders' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdminOrStaff =
      sessionUser.role === 'super_admin' ||
      (sessionUser.role === 'staff' && sessionUser.permissions.includes('orders'));

    if (!isAdminOrStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, action, notes, staffId, staffName, receiptAction, deliveryStatus } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const orderData = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (orderData.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = orderData[0];
    const now = new Date().toISOString();

    // 1. Bank Transfer Receipt Approval / Rejection
    if (receiptAction) {
      const [receipt] = await db
        .select()
        .from(bankTransferReceipts)
        .where(eq(bankTransferReceipts.orderId, orderId))
        .limit(1);

      if (receipt) {
        if (receiptAction === 'approve') {
          await db
            .update(bankTransferReceipts)
            .set({
              status: 'approved',
              reviewedBy: sessionUser.name,
              reviewedAt: now,
              reviewNotes: notes || 'Receipt verified and confirmed by Saad Accounts Bureau.',
            })
            .where(eq(bankTransferReceipts.id, receipt.id));

          // Mark order as paid
          await db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              paidAmount: order.totalAmount,
              remainingBalance: 0,
              updatedAt: now,
            })
            .where(eq(orders.id, orderId));

          // Record payment credit in payments & ledger
          const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.insert(payments).values({
            id: paymentId,
            paymentNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
            customerId: order.customerId,
            orderId: order.id,
            amount: order.totalAmount,
            paymentMethod: 'Bank Transfer',
            transactionReference: receipt.transactionReference,
            receiptUrl: receipt.receiptImageUrl,
            notes: `Bank transfer approved by ${sessionUser.name}.`,
            receivedBy: sessionUser.name,
            isReversed: 0,
            reversalReason: null,
            createdAt: now,
          });

          await db.insert(customerLedger).values({
            id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            customerId: order.customerId,
            orderId: order.id,
            entryType: 'payment_credit',
            amount: order.totalAmount,
            balanceAfter: 0,
            description: `Bank Transfer payment approved for Order #${order.orderNumber}`,
            paymentMethod: 'Bank Transfer',
            reference: receipt.transactionReference,
            recordedBy: sessionUser.name,
            isReversed: 0,
            reversalReason: null,
            createdAt: now,
          });

          // Notify customer
          await db.insert(notifications).values({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: order.customerId,
            title: `Payment Verified: Order #${order.orderNumber}`,
            message: `Your bank transfer receipt of ₨${Number(order.totalAmount).toLocaleString()} has been verified and officially approved.`,
            type: 'payment_received',
            relatedOrderId: order.id,
            isRead: 0,
            createdAt: now,
          });
        } else if (receiptAction === 'reject') {
          await db
            .update(bankTransferReceipts)
            .set({
              status: 'rejected',
              reviewedBy: sessionUser.name,
              reviewedAt: now,
              reviewNotes: notes || 'Receipt was unreadable or reference mismatched.',
            })
            .where(eq(bankTransferReceipts.id, receipt.id));

          await db
            .update(orders)
            .set({
              paymentStatus: 'failed',
              updatedAt: now,
            })
            .where(eq(orders.id, orderId));

          await db.insert(notifications).values({
            id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: order.customerId,
            title: `Bank Receipt Rejected: Order #${order.orderNumber}`,
            message: `Your uploaded bank transfer receipt could not be verified. Note: "${notes || 'Please upload a legible receipt.'}".`,
            type: 'order_update',
            relatedOrderId: order.id,
            isRead: 0,
            createdAt: now,
          });
        }
      }
    }

    // 2. Order Confirmation / Cancellation
    if (action === 'confirm') {
      await db
        .update(orders)
        .set({
          orderStatus: 'in_production',
          productionStage: 'manufacturing_started',
          productionProgress: 35,
          updatedAt: now,
        })
        .where(eq(orders.id, orderId));

      await db.insert(orderTimelineEvents).values({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId,
        title: 'Order Confirmed by Atelier Management',
        description: notes || 'Order has been approved for artisan scheduling and white-glove packaging.',
        stage: 'manufacturing_started',
        eventType: 'production',
        performedBy: sessionUser.name,
        createdAt: now,
      });

      await db.insert(notifications).values({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: order.customerId,
        title: `Order Accepted: #${order.orderNumber}`,
        message: 'Your order has been officially accepted by Saad Atelier and is in preparation.',
        type: 'order_update',
        relatedOrderId: order.id,
        isRead: 0,
        createdAt: now,
      });
    } else if (action === 'cancel') {
      await db
        .update(orders)
        .set({
          orderStatus: 'cancelled',
          delayReason: notes || 'Cancelled by administration',
          updatedAt: now,
        })
        .where(eq(orders.id, orderId));

      await db.insert(orderTimelineEvents).values({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId,
        title: 'Order Cancelled',
        description: notes || 'Order cancelled by administration.',
        stage: 'cancelled',
        eventType: 'note',
        performedBy: sessionUser.name,
        createdAt: now,
      });
    }

    // 3. Assign Staff
    if (staffId && staffName) {
      await db
        .update(orders)
        .set({
          assignedStaffId: staffId,
          assignedStaffName: staffName,
          updatedAt: now,
        })
        .where(eq(orders.id, orderId));
    }

    return NextResponse.json({ success: true, message: 'Order updated successfully' });
  } catch (error: any) {
    console.error('Online Orders PATCH error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update order' }, { status: 500 });
  }
}
