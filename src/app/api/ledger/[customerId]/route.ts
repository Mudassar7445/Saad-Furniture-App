import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users, orders, payments, customerLedger } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ customerId: string }>;
}

export async function GET(request: Request, context: RouteParams) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { customerId } = await context.params;

  // Customers can only view their own ledger
  if (sessionUser.role === 'customer' && sessionUser.id !== customerId) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  // Super admin or staff with accounts/orders permission
  if (
    sessionUser.role !== 'super_admin' &&
    sessionUser.role !== 'customer' &&
    !sessionUser.permissions?.includes('accounts') &&
    !sessionUser.permissions?.includes('orders')
  ) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  // 1. Fetch Customer info
  const [customer] = await db.select().from(users).where(eq(users.id, customerId)).limit(1);
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
  }

  // 2. Fetch all orders for customer
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  // 3. Fetch all payments for customer
  const customerPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.customerId, customerId))
    .orderBy(desc(payments.createdAt));

  // 4. Fetch ledger entries
  const rawLedgerEntries = await db
    .select()
    .from(customerLedger)
    .where(eq(customerLedger.customerId, customerId))
    .orderBy(desc(customerLedger.createdAt));

  // 5. Compute server-side financial metrics
  const totalOrdersCount = customerOrders.length;
  const activeOrdersCount = customerOrders.filter(
    (o) => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled'
  ).length;
  const completedOrdersCount = customerOrders.filter((o) => o.orderStatus === 'delivered').length;
  const cancelledOrdersCount = customerOrders.filter((o) => o.orderStatus === 'cancelled').length;

  // Total Business (Sum of non-cancelled order totals)
  const validOrders = customerOrders.filter((o) => o.orderStatus !== 'cancelled');
  const totalBusinessAmount = validOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Payments calculations (excluding reversed)
  const nonReversedPayments = customerPayments.filter((p) => p.isReversed === 0);
  const totalPaymentsMade = nonReversedPayments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalAdvancePayments = nonReversedPayments
    .filter((p) => p.paymentType === 'Initial Deposit')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalAdditionalPayments = nonReversedPayments
    .filter((p) => p.paymentType !== 'Initial Deposit')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const remainingBalance = Math.max(0, totalBusinessAmount - totalPaymentsMade);

  // First business date
  const firstBusinessDate = customerOrders.length > 0
    ? customerOrders[customerOrders.length - 1].createdAt
    : customer.createdAt;

  // Breakdown by payment method
  const paymentMethodsBreakdown: Record<string, number> = {
    Cash: 0,
    'Bank Transfer': 0,
    JazzCash: 0,
    EasyPaisa: 0,
    Other: 0,
  };

  for (const pay of nonReversedPayments) {
    const method = pay.paymentMethod || 'Other';
    paymentMethodsBreakdown[method] = (paymentMethodsBreakdown[method] || 0) + pay.amount;
  }

  // Order-wise financial details
  const orderFinancials = customerOrders.map((o) => {
    const orderPays = customerPayments.filter((p) => p.orderId === o.id && p.isReversed === 0);
    const orderPaidSum = orderPays.reduce((sum, p) => sum + p.amount, 0);
    const orderRemaining = Math.max(0, o.totalAmount - orderPaidSum);

    return {
      orderId: o.id,
      orderNumber: o.orderNumber,
      productTitle: o.productName,
      orderStatus: o.orderStatus,
      totalAmount: o.totalAmount,
      advancePayment: o.paidAmount,
      totalPaid: orderPaidSum,
      remainingBalance: orderRemaining,
      createdAt: o.createdAt,
      paymentsCount: orderPays.length,
    };
  });

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      createdAt: customer.createdAt,
      status: customer.status,
    },
    metrics: {
      firstBusinessDate,
      totalOrdersCount,
      activeOrdersCount,
      completedOrdersCount,
      cancelledOrdersCount,
      totalBusinessAmount,
      totalPaymentsMade,
      totalAdvancePayments,
      totalAdditionalPayments,
      remainingBalance,
      paymentMethodsBreakdown,
    },
    orderFinancials,
    payments: customerPayments,
    ledgerEntries: rawLedgerEntries,
  });
}
