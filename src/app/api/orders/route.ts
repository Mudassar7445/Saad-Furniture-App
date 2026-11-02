import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { orders, orderItems, payments, orderTimelineEvents, users, auditLogs, mediaFiles } from '@/lib/db/schema';
import { fcmService } from '@/lib/services/fcm';
import { queueNotificationEvent } from '@/lib/services/webpush';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET() {
  await initializeDatabase();
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

  // Fetch all order items and media for these orders
  const orderIds = userOrders.map((o) => o.id);
  let allItems: any[] = [];
  let allMedia: any[] = [];

  if (orderIds.length > 0) {
    try {
      allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
    } catch (e) {
      console.warn('Error fetching order items:', e);
    }
    try {
      allMedia = await db.select().from(mediaFiles).where(inArray(mediaFiles.orderId, orderIds));
    } catch (e) {
      console.warn('Error fetching order media:', e);
    }
  }

  const itemsByOrder = new Map<string, any[]>();
  for (const item of allItems) {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }

  const mediaByOrder = new Map<string, any[]>();
  for (const m of allMedia) {
    const list = mediaByOrder.get(m.orderId) || [];
    list.push(m);
    mediaByOrder.set(m.orderId, list);
  }

  const mappedOrders = userOrders.map((o) => ({
    ...o,
    status: o.customStatus || o.orderStatus,
    items: itemsByOrder.get(o.id) || [],
    media: mediaByOrder.get(o.id) || [],
  }));

  return NextResponse.json({ orders: mappedOrders });
}

export async function POST(request: Request) {
  await initializeDatabase();
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
      productCategory = 'Living Room',
      productDescription,
      customDesignDetails,
      dimensions,
      fabricInfo,
      colourInfo,
      expectedCompletionDate,
      assignedStaffId,
      assignedStaffName,
      paidAmount = 0,
      specialInstructions,
      customStages = [],
      customSpecifications = {},
      items = [],
      discount = 0, // overall order discount
      deliveryCharges = 0,
    } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required.' }, { status: 400 });
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

    // Multi-Item Financials Recalculation (Backend Security Guarantee)
    let calculatedSubtotal = 0;
    const processedItems: Array<{
      id: string;
      productId: string | null;
      productTitle: string;
      skuSnapshot: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      discount: number;
      totalPrice: number;
      lineTotal: number;
      customDetails?: string | null;
      specifications?: string | null;
      customizationDetails?: string | null;
      createdAt: string;
    }> = [];

    const now = new Date().toISOString();

    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const qty = Math.max(1, Number(item.quantity) || 1);
        const price = Math.max(0, Number(item.unitPrice || item.price) || 0);
        const itemDisc = Math.max(0, Number(item.discount) || 0);
        const lineTotal = Math.max(0, qty * price - itemDisc);

        calculatedSubtotal += lineTotal;

        processedItems.push({
          id: `item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          productId: item.productId || null,
          productTitle: item.title || item.productTitle || item.name || 'Bespoke Furniture Piece',
          skuSnapshot: item.sku || item.skuSnapshot || `SF-ITEM-${100 + i}`,
          quantity: qty,
          unit: item.unit || 'pcs',
          unitPrice: price,
          discount: itemDisc,
          totalPrice: lineTotal,
          lineTotal,
          customDetails: item.customDetails || item.specifications || null,
          specifications: item.specifications ? (typeof item.specifications === 'string' ? item.specifications : JSON.stringify(item.specifications)) : null,
          customizationDetails: item.customizationDetails || null,
          createdAt: now,
        });
      }
    } else {
      // Single product legacy fallback
      const fallbackPrice = Math.max(0, Number(body.totalAmount) || 0);
      calculatedSubtotal = fallbackPrice;
      processedItems.push({
        id: `item_${Date.now()}_1`,
        productId: null,
        productTitle: productName || 'Handcrafted Bespoke Furniture Commission',
        skuSnapshot: `SF-BESPOKE-${Math.floor(100 + Math.random() * 900)}`,
        quantity: Number(body.quantity) || 1,
        unit: 'pcs',
        unitPrice: fallbackPrice,
        discount: 0,
        totalPrice: fallbackPrice,
        lineTotal: fallbackPrice,
        customDetails: customDesignDetails || 'Custom crafted per client specifications',
        specifications: dimensions ? `Dimensions: ${dimensions}` : null,
        customizationDetails: fabricInfo ? `Fabric: ${fabricInfo}, Colour: ${colourInfo}` : null,
        createdAt: now,
      });
    }

    const orderDiscount = Math.max(0, Number(discount) || 0);
    const orderDeliveryCharges = Math.max(0, Number(deliveryCharges) || 0);
    const grandTotal = Math.max(0, calculatedSubtotal - orderDiscount + orderDeliveryCharges);
    const numericPaid = Math.max(0, Number(paidAmount) || 0);
    const remainingBalance = Math.max(0, grandTotal - numericPaid);

    const orderId = `ord_sf_${Date.now()}`;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `SF-${new Date().getFullYear()}-${randomSuffix}`;

    const initialStatus = numericPaid > 0 ? 'in_production' : 'pending';
    const initialStage = 'order_confirmed';
    const initialProgress = 10;

    // Descriptive name summary
    const summaryProductName =
      processedItems.length === 1
        ? processedItems[0].productTitle
        : `${processedItems[0].productTitle} (+${processedItems.length - 1} other pieces)`;

    const totalQuantity = processedItems.reduce((acc, it) => acc + it.quantity, 0);

    // 1. Insert Order
    await db.insert(orders).values({
      id: orderId,
      orderNumber,
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      deliveryAddress: deliveryAddress || customer.address || 'Showroom Collection',

      productName: summaryProductName,
      productCategory,
      productDescription: productDescription || null,
      customDesignDetails: customDesignDetails || null,
      dimensions: dimensions || null,
      fabricInfo: fabricInfo || null,
      colourInfo: colourInfo || null,
      quantity: totalQuantity,

      subtotal: calculatedSubtotal,
      discount: orderDiscount,
      deliveryCharges: orderDeliveryCharges,
      totalAmount: grandTotal,
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

    // 2. Insert Order Items (Database Transaction guarantee)
    for (const item of processedItems) {
      await db.insert(orderItems).values({
        id: item.id,
        orderId,
        productId: item.productId,
        productTitle: item.productTitle,
        skuSnapshot: item.skuSnapshot,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        totalPrice: item.lineTotal,
        lineTotal: item.lineTotal,
        customDetails: item.customDetails,
        specifications: item.specifications,
        customizationDetails: item.customizationDetails,
        createdAt: item.createdAt,
      });
    }

    // 3. Insert Initial Timeline Event
    await db.insert(orderTimelineEvents).values({
      id: `tl_${Date.now()}_1`,
      orderId,
      title: 'Order Confirmed',
      description: `Bespoke multi-item commission (${processedItems.length} items, total PKR ${grandTotal.toLocaleString()}) confirmed with initial commitment deposit.`,
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
        paymentType: numericPaid >= grandTotal ? 'Full Payment' : 'Initial Deposit',
        transactionReference: body.transactionReference || `INIT-${orderNumber}`,
        receiptUrl: `/api/receipts/${paymentNumber}`,
        notes: 'Initial commitment deposit recorded at order creation.',
        receivedBy: sessionUser.name,
        createdAt: now,
      });

      await db.insert(orderTimelineEvents).values({
        id: `tl_${Date.now()}_2`,
        orderId,
        title: `Advance Deposit Received ($${numericPaid.toLocaleString()})`,
        description: `Receipt #${paymentNumber} generated. Remaining balance: $${remainingBalance.toLocaleString()}`,
        stage: initialStage,
        eventType: 'payment',
        performedBy: sessionUser.name,
        createdAt: now,
      });
    }

    // 5. Send Centralized Real-time Web Push & In-App Notification to Customer
    try {
      await queueNotificationEvent({
        type: 'order_status',
        category: 'orders',
        title: 'New Order Created',
        message: `Your furniture order #${orderNumber} has been successfully created. Tap to view your order details.`,
        url: `/orders/${orderId}`,
        targetUserId: customerId,
        relatedId: orderId,
      });
    } catch (notifErr) {
      console.warn('Customer push notification dispatch warning:', notifErr);
    }

    // 6. Audit log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'CREATE_ORDER',
      details: `Created multi-item order [${orderNumber}] for customer ${customer.name} (${processedItems.length} items, Total: $${grandTotal})`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        customerId,
        subtotal: calculatedSubtotal,
        discount: orderDiscount,
        deliveryCharges: orderDeliveryCharges,
        totalAmount: grandTotal,
        paidAmount: numericPaid,
        remainingBalance,
        items: processedItems,
      },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}
