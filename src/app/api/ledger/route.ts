import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users, orders, payments } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (sessionUser.role === 'customer') {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  // 1. Fetch all customers
  const customers = await db.select().from(users).where(eq(users.role, 'customer'));

  // 2. Fetch all orders and payments
  const allOrders = await db.select().from(orders);
  const allPayments = await db.select().from(payments);

  const customerLedgers = customers.map((c) => {
    const custOrders = allOrders.filter((o) => o.customerId === c.id);
    const validOrders = custOrders.filter((o) => o.orderStatus !== 'cancelled');
    const custPayments = allPayments.filter((p) => p.customerId === c.id && p.isReversed === 0);

    const totalBusiness = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalPaid = custPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstandingBalance = Math.max(0, totalBusiness - totalPaid);

    const firstDate = custOrders.length > 0
      ? custOrders[custOrders.length - 1].createdAt
      : c.createdAt;

    return {
      customerId: c.id,
      customerName: c.name,
      customerEmail: c.email,
      customerPhone: c.phone,
      firstBusinessDate: firstDate,
      totalOrders: custOrders.length,
      activeOrders: custOrders.filter((o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled').length,
      totalBusiness,
      totalPaid,
      outstandingBalance,
      status: c.status,
    };
  });

  const grandTotalBusiness = customerLedgers.reduce((acc, c) => acc + c.totalBusiness, 0);
  const grandTotalCollected = customerLedgers.reduce((acc, c) => acc + c.totalPaid, 0);
  const grandTotalOutstanding = customerLedgers.reduce((acc, c) => acc + c.outstandingBalance, 0);

  return NextResponse.json({
    summary: {
      totalCustomers: customerLedgers.length,
      grandTotalBusiness,
      grandTotalCollected,
      grandTotalOutstanding,
    },
    customers: customerLedgers,
  });
}
