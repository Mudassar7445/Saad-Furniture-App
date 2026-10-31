import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { orders, orderItems, payments, orderTimelineEvents, users, auditLogs } from '@/lib/db/schema';
import { fcmService } from '@/lib/services/fcm';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let userOrders;
  if (sessionUser.role === 'customer') {
    // Customers MUST only see their own orders!
    userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, sessionUser.id))
      .orderBy(desc(orders.createdAt));
  } else {
    // Super Admin or Staff
    userOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  const mappedOrders = userOrders.map((o) => ({
    ...o,
    status: o.customStatus || o.orderStatus,
  }));

  return NextResponse.json({ orders: mappedOrders });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Super Admin can always create orders. Staff needs 'orders' permission.
  if (sessionUser.role !== 'super_admin' && !sessionUser.permissions.includes('orders')) {
    return NextResponse.json({ error: 'Permission denied to create orders.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      customerId,
      deliveryAddress,
      productName,
      productCategory,
      productDescription,
      customDesignDetails,
      dimensions,
      fabricInfo,
      colourInfo,
      quantity = 1,
      expectedCompletionDate,
      assignedStaffId,
      assignedStaffName,
      totalAmount,
      paidAmount = 0,
      specialInstructions,
      customStages = [],
      customSpecifications = {},
      items = [],
    } = body;

    if (!customerId || !totalAmount) {
      return NextResponse.json(
        { error: 'Customer ID and total amount are required.' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const [customer] = await db
      .select()
      .from(users)
      .where(eq(users.id, customerId))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: 'Selected customer not found.' }, { status: 404 });
    }

    const orderId = `ord_sf_${Date.now()}`;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `SF-${new Date().getFullYear()}-${randomSuffix}`;
    const now = new Date().toISOString();

    const numericTotal = Number(totalAmount);
    const numericPaid = Number(paidAmount);
    const remainingBalance = Math.max(0, numericTotal - numericPaid);

    const initialStatus = numericPaid > 0 ? 'in_production' : 'pending';
    const initialStage = 'order_confirmed';
    const initialProgress = 10;

    // 1. Insert Order
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      deliveryAddress: deliveryAddress || customer.address || 'Showroom Collection',

      productName: productName || 'Handcrafted Bespoke Furniture Commission',
      productCategory: productCategory || 'Living Room',
      productDescription: productDescription || null,
      customDesignDetails: customDesignDetails || null,
      dimensions: dimensions || null,
      fabricInfo: fabricInfo || null,
      colourInfo: colourInfo || null,
      quantity: Number(quantity) || 1,

      expectedCompletionDate: expectedCompletionDate || null,
      assignedStaffId: assignedStaffId || null,
      assignedStaffName: assignedStaffName || null,

      totalAmount: numericTotal,
      paidAmount: numericPaid,
      remainingBalance,
      currency: 'USD',
      orderStatus: initialStatus,
      productionStage: initialStage,
      productionProgress: initialProgress,
      customStages: JSON.stringify(customStages),

      deliveryStatus: 'pending',
      estimatedDeliveryDate: expectedCompletionDate || null,
      specialInstructions: specialInstructions || null,
      customSpecifications: JSON.stringify(customSpecifications),
      createdAt: now,
      updatedAt: now,
    });

    // 2. Insert Order Items
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await db.insert(orderItems).values({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          orderId,
          productId: item.productId || null,
          productTitle: item.title || item.productTitle || productName || 'Custom Bespoke Furniture Piece',
          customDetails: item.customDetails || customDesignDetails || null,
          quantity: item.quantity || 1,
          unitPrice: Number(item.unitPrice || item.price || numericTotal),
          totalPrice: Number(item.totalPrice || item.price || numericTotal),
        });
      }
    } else {
      await db.insert(orderItems).values({
        id: `item_${Date.now()}_1`,
        orderId,
        productId: null,
        productTitle: productName || 'Handcrafted Bespoke Furniture Commission',
        customDetails: customDesignDetails || 'Custom crafted per client specifications',
        quantity: Number(quantity) || 1,
        unitPrice: numericTotal,
        totalPrice: numericTotal,
      });
    }

    // 3. Insert Initial Timeline Event
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_1`,
      orderId,
      title: 'Order Confirmed',
      description: `Bespoke commission for "${productName || 'Custom Furniture'}" verified, client contract and initial advance deposit secured.`,
      stage: initialStage,
      eventType: 'production',
      performedBy: `${sessionUser.name} (${sessionUser.role})`,
      createdAt: now,
    });

    // 4. If deposit paid, create payment record
    if (numericPaid > 0) {
      const paymentNumber = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.insert(payments).values({
        id: `pay_${Date.now()}`,
        paymentNumber,
        orderId,
        customerId,
        amount: numericPaid,
        paymentMethod: body.paymentMethod || 'Bank Transfer',
        paymentType: numericPaid >= numericTotal ? 'Full Payment' : 'Initial Deposit',
        transactionReference: body.transactionReference || `INIT-${orderNumber}`,
        receiptUrl: `/api/receipts/${paymentNumber}`,
        notes: 'Initial commitment deposit recorded at order creation.',
        receivedBy: sessionUser.name,
        createdAt: now,
      });

      await db.insert(orderTimelineEvents).values({
        id: `tl_${Date.now()}_2`,
        orderId,
        title: `Initial Deposit Received ($${numericPaid.toLocaleString()})`,
        description: `Receipt #${paymentNumber} generated. Remaining balance: $${remainingBalance.toLocaleString()}`,
        stage: initialStage,
        eventType: 'payment',
        performedBy: sessionUser.name,
        createdAt: now,
      });
    }

    // 5. Send Notification to Customer
    await fcmService.sendNotification({
      userId: customerId,
      title: `Order Confirmed: ${orderNumber}`,
      message: `Your bespoke furniture commission (${orderNumber}) has been approved and entered production. You can track live workshop progress on your customer dashboard.`,
      type: 'order_update',
      relatedOrderId: orderId,
    });

    // 6. Audit log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'CREATE_ORDER',
      details: `Created order [${orderNumber}] for customer ${customer.name} ($${numericTotal})`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        customerId,
        totalAmount: numericTotal,
        paidAmount: numericPaid,
        remainingBalance,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}

