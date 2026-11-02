import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import {
  deliveryRecords,
  deliveryStatusHistory,
  orders,
  users,
  orderTimelineEvents,
  auditLogs,
} from '@/lib/db/schema';
import { fcmService } from '@/lib/services/fcm';
import { communicationService } from '@/lib/services/communication';
import { eq, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const STAGE_TITLES: Record<string, string> = {
  preparing_for_dispatch: 'Preparing for Dispatch',
  packing_completed: 'Packing Completed',
  ready_for_dispatch: 'Ready for Dispatch',
  dispatched: 'Dispatched from Showroom Hub',
  out_for_delivery: 'Out for White-Glove Delivery',
  delivered_successfully: 'Delivered Successfully & Inspected',
};

export async function GET(request: Request, context: RouteParams) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await context.params;

  const [delivery] = await db
    .select()
    .from(deliveryRecords)
    .where(eq(deliveryRecords.id, id))
    .limit(1);

  if (!delivery) {
    return NextResponse.json({ error: 'Delivery record not found.' }, { status: 404 });
  }

  if (sessionUser.role === 'customer' && delivery.customerId !== sessionUser.id) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  const history = await db
    .select()
    .from(deliveryStatusHistory)
    .where(eq(deliveryStatusHistory.deliveryRecordId, id))
    .orderBy(desc(deliveryStatusHistory.createdAt));

  return NextResponse.json({ delivery, history });
}

export async function PATCH(request: Request, context: RouteParams) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('delivery'))) {
    return NextResponse.json({ error: 'Unauthorized. Staff or Admin delivery permissions required.' }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const {
      deliveryStage,
      notes,
      assignedDeliveryStaff,
      assignedDeliveryStaffPhone,
      deliveryTimeWindow,
      deliveryPhotographs,
      deliveryConfirmationSignature,
    } = body;

    const [delivery] = await db
      .select()
      .from(deliveryRecords)
      .where(eq(deliveryRecords.id, id))
      .limit(1);

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery record not found.' }, { status: 404 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, delivery.orderId))
      .limit(1);

    const now = new Date().toISOString();
    const isDispatch = deliveryStage === 'dispatched' || deliveryStage === 'out_for_delivery';
    const isDelivered = deliveryStage === 'delivered_successfully';

    const updatedData: Record<string, unknown> = {
      updatedAt: now,
    };

    if (deliveryStage) updatedData.deliveryStage = deliveryStage;
    if (notes !== undefined) updatedData.deliveryNotes = notes;
    if (assignedDeliveryStaff) updatedData.assignedDeliveryStaff = assignedDeliveryStaff;
    if (assignedDeliveryStaffPhone) updatedData.assignedDeliveryStaffPhone = assignedDeliveryStaffPhone;
    if (deliveryTimeWindow) updatedData.deliveryTimeWindow = deliveryTimeWindow;
    if (deliveryPhotographs) {
      updatedData.deliveryPhotographs = typeof deliveryPhotographs === 'string'
        ? deliveryPhotographs
        : JSON.stringify(deliveryPhotographs);
    }
    if (deliveryConfirmationSignature) {
      updatedData.deliveryConfirmationSignature = deliveryConfirmationSignature;
    }

    if (isDispatch && !delivery.dispatchDate) {
      updatedData.dispatchDate = now;
    }

    if (isDelivered) {
      updatedData.deliveredDate = now;
    }

    // 1. Update delivery record
    await db.update(deliveryRecords).set(updatedData).where(eq(deliveryRecords.id, id));

    // 2. Insert into deliveryStatusHistory
    if (deliveryStage) {
      await db.insert(deliveryStatusHistory).values({
        id: `dhist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        deliveryRecordId: id,
        orderId: delivery.orderId,
        stage: deliveryStage,
        notes: notes || `Status changed to ${STAGE_TITLES[deliveryStage] || deliveryStage}`,
        updatedBy: sessionUser.name,
        createdAt: now,
      });

      // 3. Update Order status
      await db
        .update(orders)
        .set({
          deliveryStatus: deliveryStage,
          orderStatus: isDelivered ? 'delivered' : orders.orderStatus,
          actualDeliveryDate: isDelivered ? now : orders.actualDeliveryDate,
          updatedAt: now,
        })
        .where(eq(orders.id, delivery.orderId));

      // 4. Order Timeline event
      const stageName = STAGE_TITLES[deliveryStage] || deliveryStage;
      await db.insert(orderTimelineEvents).values({
        id: `tl_${Date.now()}_del`,
        orderId: delivery.orderId,
        title: `Delivery Milestone: ${stageName}`,
        description: notes || `Shipment stage updated to ${stageName}. Staff: ${assignedDeliveryStaff || delivery.assignedDeliveryStaff || 'Saad Logistics'}.`,
        stage: deliveryStage,
        eventType: 'delivery',
        performedBy: sessionUser.name,
        createdAt: now,
      });

      // 5. Send Real-time Web Push & In-App Notification
      await fcmService.sendNotification({
        userId: delivery.customerId,
        title: `🚚 Delivery Milestone: ${stageName}`,
        message: `Your order #${order ? order.orderNumber : ''} has reached the stage: ${stageName}. Tap to track delivery live.`,
        type: 'delivery_update',
        relatedOrderId: delivery.orderId,
        url: `/orders/${delivery.orderId}`,
      });

      // 6. Send SMS/Email communication if Dispatched or Delivered
      if (isDispatch) {
        await communicationService.sendCommunication({
          customerId: delivery.customerId,
          channel: 'sms',
          templateType: 'delivery_dispatch',
          variables: {
            orderNumber: order?.orderNumber || '',
            deliveryAddress: delivery.deliveryAddress,
            driverName: (assignedDeliveryStaff || delivery.assignedDeliveryStaff) as string,
            driverPhone: (assignedDeliveryStaffPhone || delivery.assignedDeliveryStaffPhone) as string,
            deliveryTimeWindow: (deliveryTimeWindow || delivery.deliveryTimeWindow) as string,
          },
          relatedOrderId: delivery.orderId,
        });
      } else if (isDelivered) {
        await communicationService.sendCommunication({
          customerId: delivery.customerId,
          channel: 'email',
          templateType: 'custom',
          subject: `Saad Furniture: Delivery Complete #${order?.orderNumber}`,
          customBody: `Dear Patron,\n\nYour order #${order?.orderNumber} has been successfully delivered and assembled to luxury specifications.\n\nThank you for choosing Saad Furniture. It has been our privilege to craft this bespoke piece for your sanctuary.\n\nSaad Furniture Concierge`,
          relatedOrderId: delivery.orderId,
        });
      }
    }

    // 7. Audit log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'UPDATE_DELIVERY_RECORD',
      details: `Updated delivery ${id} stage to ${deliveryStage || 'details'} for order ${order?.orderNumber}.`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({ success: true, updated: updatedData });
  } catch (error) {
    console.error('Update delivery error:', error);
    return NextResponse.json({ error: 'Failed to update delivery record.' }, { status: 500 });
  }
}

