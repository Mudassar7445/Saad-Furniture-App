import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { orders, payments, users, auditLogs, products } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can access sales reports.' }, { status: 403 });
  }

  const allOrders = await db.select().from(orders);
  const allPayments = await db.select().from(payments);
  const allCustomers = await db.select().from(users).where(eq(users.role, 'customer'));
  const recentLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(25);
  const allProducts = await db.select().from(products);

  const totalGrossRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalReceived = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalOutstanding = Math.max(0, totalGrossRevenue - totalReceived);

  // Group by status
  const ordersByStatus = {
    pending: allOrders.filter((o) => o.orderStatus === 'pending').length,
    in_production: allOrders.filter((o) => o.orderStatus === 'in_production').length,
    ready_for_dispatch: allOrders.filter((o) => o.orderStatus === 'ready_for_dispatch').length,
    out_for_delivery: allOrders.filter((o) => o.orderStatus === 'out_for_delivery').length,
    delivered: allOrders.filter((o) => o.orderStatus === 'delivered').length,
    cancelled: allOrders.filter((o) => o.orderStatus === 'cancelled').length,
  };

  // Group by production stage
  const ordersByStage = {
    design_approval: allOrders.filter((o) => o.productionStage === 'design_approval').length,
    wood_cutting: allOrders.filter((o) => o.productionStage === 'wood_cutting').length,
    carving_joinery: allOrders.filter((o) => o.productionStage === 'carving_joinery').length,
    polishing_finishing: allOrders.filter((o) => o.productionStage === 'polishing_finishing').length,
    upholstery: allOrders.filter((o) => o.productionStage === 'upholstery').length,
    final_inspection: allOrders.filter((o) => o.productionStage === 'final_inspection').length,
    completed: allOrders.filter((o) => o.productionStage === 'completed').length,
  };

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  allProducts.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  return NextResponse.json({
    metrics: {
      totalGrossRevenue,
      totalReceived,
      totalOutstanding,
      totalOrders: allOrders.length,
      totalCustomers: allCustomers.length,
      activeOrders: ordersByStatus.in_production + ordersByStatus.ready_for_dispatch + ordersByStatus.out_for_delivery,
      deliveredOrders: ordersByStatus.delivered,
    },
    ordersByStatus,
    ordersByStage,
    categoryCounts,
    recentActivity: recentLogs,
  });
}

