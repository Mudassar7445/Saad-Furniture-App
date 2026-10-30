import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users, orders, payments, orderItems, orderMedia, auditLogs } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
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

  // Customer can only view their own account; Super Admin or staff can view
  if (sessionUser.role === 'customer' && sessionUser.id !== id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const [customer] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt));

  const customerPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.customerId, id))
    .orderBy(desc(payments.createdAt));

  const totalOrders = customerOrders.length;
  const activeOrders = customerOrders.filter(
    (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  ).length;
  const completedOrders = customerOrders.filter((o) => o.orderStatus === 'delivered').length;
  const cancelledOrders = customerOrders.filter((o) => o.orderStatus === 'cancelled').length;

  const totalBusinessAmount = customerOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalPaymentsMade = customerOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  const remainingBalance = customerOrders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      avatarUrl: customer.avatarUrl,
      address: customer.address,
      city: customer.city,
      firstBusinessDate: customer.firstBusinessDate || customer.createdAt,
      createdAt: customer.createdAt,
    },
    metrics: {
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      totalBusinessAmount,
      totalPaymentsMade,
      remainingBalance,
    },
    orders: customerOrders,
    payments: customerPayments,
  });
}

// Super Admin edits customer profile
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can edit customer profiles.' }, { status: 403 });
  }

  const body = await request.json();
  const { name, phone, address, city, firstBusinessDate, status } = body;

  await db
    .update(users)
    .set({
      name: name ?? undefined,
      phone: phone ?? undefined,
      address: address ?? undefined,
      city: city ?? undefined,
      firstBusinessDate: firstBusinessDate ?? undefined,
      status: status ?? undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id));

  // Audit log
  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'UPDATE_CUSTOMER_PROFILE',
    details: `Updated profile details for customer ${id}`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: 'Customer updated successfully.' });
}

// Super Admin resets password or toggles suspend/activate status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can perform this action.' }, { status: 403 });
  }

  const body = await request.json();
  const { action, newPassword, status } = body;

  if (action === 'RESET_PASSWORD') {
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id));

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'RESET_CUSTOMER_PASSWORD',
      details: `Super Admin reset password for customer ${id}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Password reset successfully.' });
  }

  if (action === 'TOGGLE_STATUS') {
    const nextStatus = status === 'suspended' ? 'suspended' : 'active';
    await db
      .update(users)
      .set({
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id));

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'TOGGLE_CUSTOMER_STATUS',
      details: `Super Admin set customer ${id} status to ${nextStatus}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, status: nextStatus });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}

