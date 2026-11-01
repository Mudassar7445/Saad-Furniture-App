import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users, orders, auditLogs } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase().trim() || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
  const isCompact = searchParams.get('compact') === 'true';

  const allCustomers = await db
    .select()
    .from(users)
    .where(eq(users.role, 'customer'))
    .orderBy(desc(users.createdAt));

  let filtered = allCustomers;
  if (search) {
    filtered = allCustomers.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(search);
      const phoneMatch = c.phone?.toLowerCase().includes(search);
      const emailMatch = c.email?.toLowerCase().includes(search);
      const cityMatch = c.city?.toLowerCase().includes(search);
      const addressMatch = c.address?.toLowerCase().includes(search);
      return nameMatch || phoneMatch || emailMatch || cityMatch || addressMatch;
    });
  }

  // If compact search is requested (e.g. New Order customer selector), skip heavy orders aggregation
  if (isCompact) {
    const compactList = filtered.slice((page - 1) * limit, page * limit).map((cust) => ({
      id: cust.id,
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      address: cust.address,
      city: cust.city,
      status: cust.status,
      customerType: cust.passwordHash && !cust.email?.endsWith('@saadpatron.com') ? 'Registered App Patron' : 'Showroom Patron',
      isRegistered: Boolean(cust.passwordHash && !cust.email?.endsWith('@saadpatron.com')),
      createdAt: cust.createdAt,
    }));

    return NextResponse.json({
      customers: compactList,
      total: filtered.length,
      page,
      limit,
    });
  }

  const allOrders = await db.select().from(orders);

  // Compute aggregate stats per customer
  const enrichedCustomers = filtered.map((cust) => {
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
      customerType: cust.passwordHash && !cust.email?.endsWith('@saadpatron.com') ? 'Registered App Patron' : 'Showroom Patron',
      isRegistered: Boolean(cust.passwordHash && !cust.email?.endsWith('@saadpatron.com')),
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

  const total = enrichedCustomers.length;
  const paginated = enrichedCustomers.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    customers: searchParams.has('limit') ? paginated : enrichedCustomers,
    total,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (
    !sessionUser ||
    (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('orders'))
  ) {
    return NextResponse.json(
      { error: 'Unauthorized: Permission to manage customers required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, phone, password, address, city, firstBusinessDate, notes, whatsappNumber } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Customer full name is required.' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Mobile / contact number is required.' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanName = name.trim();

    // Check if customer with this exact phone already exists to avoid duplicate accounts
    const existingByPhone = await db
      .select()
      .from(users)
      .where(eq(users.phone, cleanPhone))
      .limit(1);

    if (existingByPhone.length > 0) {
      const existing = existingByPhone[0];
      return NextResponse.json({
        success: true,
        customer: existing,
        message: 'Existing customer account matched and loaded.',
        isExisting: true,
      });
    }

    // Auto-generate unique email if optional email is not provided
    const cleanEmail = email && email.trim()
      ? email.toLowerCase().trim()
      : `patron_${cleanPhone.replace(/[^0-9]/g, '') || Date.now()}@saadpatron.com`;

    // Check if email is already taken
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existingByEmail.length > 0) {
      const existing = existingByEmail[0];
      return NextResponse.json({
        success: true,
        customer: existing,
        message: 'Existing customer account matched and loaded.',
        isExisting: true,
      });
    }

    const defaultPassword = password || `Saad@${Math.floor(1000 + Math.random() * 9000)}`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);
    const now = new Date().toISOString();
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newCustomer = {
      id: customerId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      role: 'customer',
      permissions: JSON.stringify({ notes: notes || null, whatsapp: whatsappNumber || cleanPhone }),
      status: 'active',
      avatarUrl:
        body.avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
      address: address?.trim() || null,
      city: city?.trim() || 'Lahore',
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
      details: `Created customer account for [${cleanName}] (${cleanPhone})`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      customer: newCustomer,
      message: 'New customer account created successfully.',
    });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: 'Failed to create customer account.' },
      { status: 500 }
    );
  }
}

