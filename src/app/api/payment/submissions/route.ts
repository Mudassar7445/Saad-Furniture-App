import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { bankTransferReceipts, paymentTransactions, orders, users } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('accounts') && !sessionUser.permissions?.includes('orders'))
    ) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // 'pending' | 'approved' | 'rejected' | 'all'
    const typeFilter = searchParams.get('type'); // 'bank_transfer' | 'card' | 'all'
    const search = searchParams.get('search')?.toLowerCase().trim() || '';

    // 1. Fetch bank transfer receipts
    const allBankReceipts = await db
      .select()
      .from(bankTransferReceipts)
      .orderBy(desc(bankTransferReceipts.createdAt));

    // 2. Fetch payment transactions (Card, etc.)
    const allTransactions = await db
      .select()
      .from(paymentTransactions)
      .orderBy(desc(paymentTransactions.createdAt));

    // 3. Fetch orders & customers for reference
    const allOrders = await db.select().from(orders);
    const allCustomers = await db.select().from(users);

    const orderMap = new Map(allOrders.map((o) => [o.id, o]));
    const customerMap = new Map(allCustomers.map((c) => [c.id, c]));

    // Format Bank Receipts
    const formattedReceipts = allBankReceipts.map((r) => {
      const ord = orderMap.get(r.orderId);
      const cust = customerMap.get(r.userId) || (ord ? customerMap.get(ord.customerId) : null);
      return {
        id: r.id,
        submissionType: 'bank_transfer',
        orderId: r.orderId,
        orderNumber: ord?.orderNumber || 'N/A',
        totalOrderAmount: ord?.totalAmount || 0,
        paidOrderAmount: ord?.paidAmount || 0,
        remainingBalance: ord?.remainingBalance || 0,
        customerId: r.userId,
        customerName: r.senderAccountTitle || cust?.name || ord?.customerName || 'Customer',
        customerPhone: cust?.phone || ord?.customerPhone || '',
        bankName: r.bankName,
        senderAccountTitle: r.senderAccountTitle,
        senderAccountNumber: r.senderAccountNumber,
        transactionReference: r.transactionReference,
        amountPaid: r.amountPaid,
        receiptImageUrl: r.receiptImageUrl,
        status: r.status,
        reviewNotes: r.reviewNotes,
        rejectionReason: r.rejectionReason,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
      };
    });

    // Format Card Transactions
    const formattedTransactions = allTransactions.map((t) => {
      const ord = orderMap.get(t.orderId);
      const cust = customerMap.get(t.userId) || (ord ? customerMap.get(ord.customerId) : null);
      let details: any = {};
      try {
        details = JSON.parse(t.gatewayResponse || '{}');
      } catch {}

      return {
        id: t.id,
        submissionType: 'card',
        orderId: t.orderId,
        orderNumber: ord?.orderNumber || 'N/A',
        totalOrderAmount: ord?.totalAmount || 0,
        paidOrderAmount: ord?.paidAmount || 0,
        remainingBalance: ord?.remainingBalance || 0,
        customerId: t.userId,
        customerName: cust?.name || ord?.customerName || 'Customer',
        customerPhone: cust?.phone || ord?.customerPhone || '',
        bankName: details.brand ? `${details.brand} via ${t.gateway}` : t.gateway,
        senderAccountTitle: details.cardName || cust?.name || '',
        senderAccountNumber: details.cardLast4 ? `•••• ${details.cardLast4}` : null,
        transactionReference: t.gatewayTransactionRef || t.id,
        amountPaid: t.amount,
        receiptImageUrl: null,
        status: t.status === 'success' ? 'approved' : t.status === 'failed' ? 'rejected' : 'pending',
        reviewNotes: details.statusMessage || `Gateway: ${t.gateway}`,
        rejectionReason: t.status === 'failed' ? 'Gateway decline or authorization error' : null,
        reviewedBy: 'Payment Gateway',
        reviewedAt: t.verifiedAt,
        createdAt: t.createdAt,
      };
    });

    let combined = [...formattedReceipts, ...formattedTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (typeFilter && typeFilter !== 'all') {
      combined = combined.filter((i) => i.submissionType === typeFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      combined = combined.filter((i) => i.status === statusFilter);
    }

    if (search) {
      combined = combined.filter(
        (i) =>
          i.orderNumber?.toLowerCase().includes(search) ||
          i.customerName?.toLowerCase().includes(search) ||
          i.transactionReference?.toLowerCase().includes(search) ||
          i.bankName?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      submissions: combined,
      total: combined.length,
      pendingCount: combined.filter((i) => i.status === 'pending').length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error fetching submissions' }, { status: 500 });
  }
}

