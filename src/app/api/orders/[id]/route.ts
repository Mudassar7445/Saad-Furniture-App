import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { orders, orderItems, orderMedia, orderTimelineEvents, payments, users, auditLogs } from '@/lib/db/schema';
import { fcmService } from '@/lib/services/fcm';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  // Customers can only see their own order
  if (sessionUser.role === 'customer' && order.customerId !== sessionUser.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const media = await db.select().from(orderMedia).where(eq(orderMedia.orderId, id)).orderBy(desc(orderMedia.uploadedAt));
  const timeline = await db.select().from(orderTimelineEvents).where(eq(orderTimelineEvents.orderId, id)).orderBy(desc(orderTimelineEvents.createdAt));
  const orderPayments = await db.select().from(payments).where(eq(payments.orderId, id)).orderBy(desc(payments.createdAt));

  return NextResponse.json({
    order,
    items,
    media,
    timeline,
    payments: orderPayments,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Check permissions: Super Admin or staff with orders/delivery permissions
  if (
    sessionUser.role !== 'super_admin' &&
    !sessionUser.permissions.includes('orders') &&
    !sessionUser.permissions.includes('delivery')
  ) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const body = await request.json();
  const {
    orderStatus,
    customStatus,
    productionStage,
    stageName,
    productionProgress,
    progressDescription,
    deliveryStatus,
    estimatedDeliveryDate,
    expectedCompletionDate,
    actualDeliveryDate,
    deliveryDriverName,
    deliveryDriverPhone,
    specialInstructions,
    isDelayed,
    delayReason,
    customStages,
    assignedStaffId,
    assignedStaffName,
    productName,
    productDescription,
    dimensions,
    fabricInfo,
    colourInfo,
    quantity,
    totalAmount,
  } = body;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: now };

  let statusChanged = false;
  let stageChanged = false;
  let progressChanged = false;
  let deliveryChanged = false;
  let delayChanged = false;

  if (orderStatus && orderStatus !== order.orderStatus) {
    updates.orderStatus = orderStatus;
    statusChanged = true;
  }
  if (customStatus !== undefined) updates.customStatus = customStatus;
  if (productionStage && productionStage !== order.productionStage) {
    updates.productionStage = productionStage;
    stageChanged = true;
  }
  if (productionProgress !== undefined && Number(productionProgress) !== order.productionProgress) {
    updates.productionProgress = Number(productionProgress);
    progressChanged = true;
  }
  if (deliveryStatus && deliveryStatus !== order.deliveryStatus) {
    updates.deliveryStatus = deliveryStatus;
    deliveryChanged = true;
  }
  if (isDelayed !== undefined && isDelayed !== order.isDelayed) {
    updates.isDelayed = isDelayed ? 1 : 0;
    delayChanged = true;
  }
  if (delayReason !== undefined) updates.delayReason = delayReason;
  if (estimatedDeliveryDate !== undefined) updates.estimatedDeliveryDate = estimatedDeliveryDate;
  if (expectedCompletionDate !== undefined) updates.expectedCompletionDate = expectedCompletionDate;
  if (actualDeliveryDate !== undefined) updates.actualDeliveryDate = actualDeliveryDate;
  if (deliveryDriverName !== undefined) updates.deliveryDriverName = deliveryDriverName;
  if (deliveryDriverPhone !== undefined) updates.deliveryDriverPhone = deliveryDriverPhone;
  if (specialInstructions !== undefined) updates.specialInstructions = specialInstructions;
  if (customStages !== undefined) updates.customStages = JSON.stringify(customStages);
  if (assignedStaffId !== undefined) updates.assignedStaffId = assignedStaffId;
  if (assignedStaffName !== undefined) updates.assignedStaffName = assignedStaffName;

  if (productName !== undefined) updates.productName = productName;
  if (productDescription !== undefined) updates.productDescription = productDescription;
  if (dimensions !== undefined) updates.dimensions = dimensions;
  if (fabricInfo !== undefined) updates.fabricInfo = fabricInfo;
  if (colourInfo !== undefined) updates.colourInfo = colourInfo;
  if (quantity !== undefined) updates.quantity = Number(quantity);
  if (totalAmount !== undefined) {
    updates.totalAmount = Number(totalAmount);
    updates.remainingBalance = Math.max(0, Number(totalAmount) - (order.paidAmount || 0));
  }

  await db.update(orders).set(updates).where(eq(orders.id, id));

  // Determine human-readable stage name
  const defaultStageLabels: Record<string, string> = {
    order_confirmed: 'Order Confirmed',
    design_measurements: 'Design & Measurements',
    material_selection: 'Material Selection',
    manufacturing_started: 'Manufacturing Started',
    frame_preparation: 'Frame Preparation',
    foam_upholstery: 'Foam & Upholstery',
    polishing_finishing: 'Polishing & Finishing',
    quality_inspection: 'Quality Inspection',
    ready_for_delivery: 'Ready for Delivery',
    out_for_delivery: 'Out for Delivery',
    successfully_delivered: 'Successfully Delivered',
  };

  const finalStageTitle = stageName || defaultStageLabels[productionStage || order.productionStage] || productionStage || 'Status Milestone';
  const finalDesc = progressDescription || `Stage progress updated to ${finalStageTitle}. Current progress: ${updates.productionProgress ?? order.productionProgress}%.`;

  if (stageChanged || progressChanged || progressDescription) {
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_stage`,
      orderId: id,
      title: `${finalStageTitle} (${updates.productionProgress ?? order.productionProgress}%)`,
      description: finalDesc,
      stage: (productionStage || order.productionStage) as string,
      eventType: 'production',
      performedBy: `${sessionUser.name} (${sessionUser.role})`,
      createdAt: now,
    });

    // Notify customer
    await fcmService.sendNotification({
      userId: order.customerId,
      title: `Order Update: ${order.orderNumber}`,
      message: `Your order has progressed to [${finalStageTitle}] (${updates.productionProgress ?? order.productionProgress}%). ${finalDesc}`,
      type: 'stage_completed',
      relatedOrderId: id,
    });
  }

  if (delayChanged && updates.isDelayed) {
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_delay`,
      orderId: id,
      title: 'Schedule Revision / Notice of Delay',
      description: delayReason || 'Workshop notice: schedule revision for meticulous artisanal curing.',
      stage: (productionStage || order.productionStage) as string,
      eventType: 'note',
      performedBy: `${sessionUser.name} (${sessionUser.role})`,
      createdAt: now,
    });

    await fcmService.sendNotification({
      userId: order.customerId,
      title: `Schedule Notice: ${order.orderNumber}`,
      message: `A timeline update has been recorded for your order: ${delayReason || 'Artisanal curing adjustments.'}`,
      type: 'order_update',
      relatedOrderId: id,
    });
  }

  if (statusChanged && orderStatus === 'cancelled') {
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_cancel`,
      orderId: id,
      title: 'Order Cancelled',
      description: progressDescription || 'Order has been officially cancelled by administration.',
      stage: 'cancelled',
      eventType: 'note',
      performedBy: `${sessionUser.name} (${sessionUser.role})`,
      createdAt: now,
    });

    await fcmService.sendNotification({
      userId: order.customerId,
      title: `Order Cancelled: ${order.orderNumber}`,
      message: `Your commission ${order.orderNumber} has been marked as cancelled. Please contact concierge with any queries.`,
      type: 'order_update',
      relatedOrderId: id,
    });
  }

  if (deliveryChanged) {
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_deliv`,
      orderId: id,
      title: `Delivery Status: ${deliveryStatus?.toUpperCase()}`,
      description: deliveryDriverName
        ? `Driver assigned: ${deliveryDriverName} (${deliveryDriverPhone || 'Direct Fleet'}). Estimated arrival: ${estimatedDeliveryDate || 'Prompt'}.`
        : `Delivery status updated to ${deliveryStatus}.`,
      stage: 'delivery',
      eventType: 'delivery',
      performedBy: sessionUser.name,
      createdAt: now,
    });

    await fcmService.sendNotification({
      userId: order.customerId,
      title: `Delivery Update: ${order.orderNumber}`,
      message: `Delivery status for ${order.orderNumber} is now marked as [${deliveryStatus}].`,
      type: 'order_update',
      relatedOrderId: id,
    });
  }

  // Audit log
  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'UPDATE_ORDER_PROGRESS',
    details: `Updated order ${order.orderNumber}: stage=${productionStage || order.productionStage}, progress=${updates.productionProgress || order.productionProgress}%`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: now,
  });

  return NextResponse.json({ success: true, message: 'Order updated successfully.' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can delete orders.' }, { status: 403 });
  }

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  // Delete child records
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orderMedia).where(eq(orderMedia.orderId, id));
  await db.delete(orderTimelineEvents).where(eq(orderTimelineEvents.orderId, id));
  await db.delete(payments).where(eq(payments.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));

  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'DELETE_ORDER',
    details: `Super Admin deleted order [${order.orderNumber}]`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: 'Order deleted successfully.' });
}

