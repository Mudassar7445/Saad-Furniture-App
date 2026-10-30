import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users, orders, auditLogs } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Super Admin or Staff with order/accounts permission can view customers
  if (
    sessionUser.role !== 'super_admin' &&
    !sessionUser.permissions.includes('orders') &&
    !sessionUser.permissions.includes('accounts')
  ) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const allCustomers = await db
    .select()
    .from(users)
    .where(eq(users.role, 'customer'))
    .orderBy(desc(users.createdAt));

  const allOrders = await db.select().from(orders);

  // Compute aggregate stats per customer
  const enrichedCustomers = allCustomers.map((cust) => {
    const custOrders = allOrders.filter((o) => o.customerId === cust.id);
    const totalOrders = custOrders.length;
    const activeOrders = custOrders.filter(
      (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
    ).length;
    const completedOrders = custOrders.filter((o) => o.orderStatus === 'delivered').length;
    const cancelledOrders = custOrders.filter((o) => o.orderStatus === 'cancelled').length;

    const totalBusinessAmount = custOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalPaymentsMade = custOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const remainingBalance = custOrders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);

    return {
      id: cust.id,
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      status: cust.status,
      avatarUrl: cust.avatarUrl,
      address: cust.address,
      city: cust.city,
      firstBusinessDate: cust.firstBusinessDate || cust.createdAt,
      createdAt: cust.createdAt,
      stats: {
        totalOrders,
        activeOrders,
        completedOrders,
        cancelledOrders,
        totalBusinessAmount,
        totalPaymentsMade,
        remainingBalance,
      },
    };
  });

  return NextResponse.json({ customers: enrichedCustomers });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Only Super Admin can create customer accounts.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, phone, password, address, city, firstBusinessDate } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and initial password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newCustomer = {
      id: customerId,
      name,
      email: normalizedEmail,
      phone: phone || null,
      passwordHash,
      role: 'customer',
      permissions: '[]',
      status: 'active',
      avatarUrl:
        body.avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
      address: address || null,
      city: city || null,
      firstBusinessDate: firstBusinessDate || now.split('T')[0],
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(users).values(newCustomer);

    // Audit log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'CREATE_CUSTOMER',
      details: `Created customer account for ${name} (${normalizedEmail})`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: customerId,
        name,
        email: normalizedEmail,
        phone,
        status: 'active',
        firstBusinessDate: newCustomer.firstBusinessDate,
      },
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer account.' },
      { status: 500 }
    );
  }
}

