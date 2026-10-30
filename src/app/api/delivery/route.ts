import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { deliveryRecords, deliveryStatusHistory, orders, users, orderTimelineEvents, auditLogs } from '@/lib/db/schema';
import { fcmService } from '@/lib/services/fcm';
import { communicationService } from '@/lib/services/communication';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  let list;
  if (sessionUser.role === 'customer') {
    if (orderId) {
      list = await db
        .select()
        .from(deliveryRecords)
        .where(eq(deliveryRecords.orderId, orderId));
      list = list.filter((d) => d.customerId === sessionUser.id);
    } else {
      list = await db
        .select()
        .from(deliveryRecords)
        .where(eq(deliveryRecords.customerId, sessionUser.id))
        .orderBy(desc(deliveryRecords.createdAt));
    }
  } else {
    if (orderId) {
      list = await db
        .select()
        .from(deliveryRecords)
        .where(eq(deliveryRecords.orderId, orderId));
    } else {
      list = await db
        .select()
        .from(deliveryRecords)
        .orderBy(desc(deliveryRecords.createdAt));
    }
  }

  return NextResponse.json({ deliveries: list });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('delivery'))) {
    return NextResponse.json({ error: 'Forbidden. Delivery staff or Super Admin permission required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      orderId,
      deliveryAddress,
      customerContactNumber,
      expectedDeliveryDate,
      deliveryTimeWindow,
      deliveryCharges = 0,
      assignedDeliveryStaff,
      assignedDeliveryStaffPhone,
      deliveryNotes,
    } = body;

    if (!orderId || !deliveryAddress || !customerContactNumber) {
      return NextResponse.json(
        { error: 'Order ID, delivery address, and contact number are required.' },
        { status: 400 }
      );
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Check if delivery record already exists for this order
    const [existing] = await db.select().from(deliveryRecords).where(eq(deliveryRecords.orderId, orderId)).limit(1);

    const now = new Date().toISOString();

    if (existing) {
      // Update existing record
      await db
        .update(deliveryRecords)
        .set({
          deliveryAddress,
          customerContactNumber,
          expectedDeliveryDate: expectedDeliveryDate || existing.expectedDeliveryDate,
          deliveryTimeWindow: deliveryTimeWindow || existing.deliveryTimeWindow,
          deliveryCharges: Number(deliveryCharges) || existing.deliveryCharges,
          assignedDeliveryStaff: assignedDeliveryStaff || existing.assignedDeliveryStaff,
          assignedDeliveryStaffPhone: assignedDeliveryStaffPhone || existing.assignedDeliveryStaffPhone,
          deliveryNotes: deliveryNotes || existing.deliveryNotes,
          updatedAt: now,
        })
        .where(eq(deliveryRecords.id, existing.id));

      return NextResponse.json({ success: true, delivery: { ...existing, deliveryAddress, updatedAt: now } });
    }

    const deliveryId = `deliv_${Date.now()}`;
    await db.insert(deliveryRecords).values({
      id: deliveryId,
      orderId,
      customerId: order.customerId,
      deliveryAddress,
      customerContactNumber,
      expectedDeliveryDate: expectedDeliveryDate || null,
      deliveryTimeWindow: deliveryTimeWindow || '10:00 AM - 02:00 PM',
      deliveryCharges: Number(deliveryCharges) || 0,
      assignedDeliveryStaff: assignedDeliveryStaff || 'Saad White-Glove Logistics Team',
      assignedDeliveryStaffPhone: assignedDeliveryStaffPhone || '+1 (800) 555-SAAD',
      deliveryNotes: deliveryNotes || null,
      deliveryStage: 'preparing_for_dispatch',
      dispatchDate: null,
      deliveredDate: null,
      deliveryPhotographs: '[]',
      deliveryConfirmationSignature: null,
      createdAt: now,
      updatedAt: now,
    });

    // Record initial stage history
    await db.insert(deliveryStatusHistory).values({
      id: `dhist_${Date.now()}`,
      deliveryRecordId: deliveryId,
      orderId,
      stage: 'preparing_for_dispatch',
      notes: 'Delivery dossier initiated.',
      updatedBy: sessionUser.name,
      createdAt: now,
    });

    return NextResponse.json({ success: true, deliveryId });
  } catch (err) {
    console.error('Create delivery record error:', err);
    return NextResponse.json({ error: 'Failed to create delivery record.' }, { status: 500 });
  }
}

