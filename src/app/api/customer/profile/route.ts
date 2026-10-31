import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { users, orders, payments, customerLedger, notifications, customerAddresses, wishlists } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
    if (userData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userData[0];

    // Customer orders
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, sessionUser.id))
      .orderBy(desc(orders.createdAt));

    const onlineOrders = userOrders.filter((o) => o.orderType === 'online');
    const showroomOrders = userOrders.filter((o) => o.orderType !== 'online');

    // Customer payments (only confirmed and not reversed)
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.customerId, sessionUser.id))
      .orderBy(desc(payments.createdAt));

    const orderNumberMap = new Map(userOrders.map((o) => [o.id, o.orderNumber]));
    const paymentsWithOrderInfo = userPayments.map((p) => ({
      ...p,
      orderNumber: orderNumberMap.get(p.orderId) || p.orderId,
      status: p.isReversed ? 'Reversed' : 'Verified & Confirmed',
    }));

    // Financial calculations:
    // Remaining Balance = Total Confirmed Order Amount - Total Confirmed Payments
    const confirmedOrders = userOrders.filter(
      (o) => !o.orderStatus?.toLowerCase().includes('cancel')
    );
    const totalOrderAmount = confirmedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const verifiedPayments = userPayments.filter((p) => !p.isReversed);
    const paymentsTableSum = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    // In case orders were recorded with paidAmount directly without a payments row:
    const ordersPaidSum = confirmedOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const totalPaid = Math.max(paymentsTableSum, ordersPaidSum);

    const advancePayments = verifiedPayments
      .filter((p) => p.paymentType === 'Initial Deposit')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const remainingBalance = Math.max(0, totalOrderAmount - totalPaid);
    const isFullyPaid = remainingBalance === 0 && totalOrderAmount > 0;

    // Order status counts
    const activeOrders = userOrders.filter(
      (o) =>
        !o.orderStatus?.toLowerCase().includes('delivered') &&
        !o.orderStatus?.toLowerCase().includes('cancel')
    ).length;
    const completedOrders = userOrders.filter((o) =>
      o.orderStatus?.toLowerCase().includes('delivered')
    ).length;
    const cancelledOrders = userOrders.filter((o) =>
      o.orderStatus?.toLowerCase().includes('cancel')
    ).length;

    // Attach convenience 'status' field to each order object for frontend consistency
    const ordersWithStatus = userOrders.map((o) => ({
      ...o,
      status: o.customStatus || o.orderStatus,
    }));

    // Ledger entries
    const ledger = await db
      .select()
      .from(customerLedger)
      .where(eq(customerLedger.customerId, sessionUser.id))
      .orderBy(desc(customerLedger.createdAt));

    // Addresses
    const addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, sessionUser.id));

    // Wishlist count
    const userWishlist = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, sessionUser.id));

    // Notifications
    const userNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, sessionUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        avatarUrl: user.avatarUrl,
        firstBusinessDate: user.firstBusinessDate,
        createdAt: user.createdAt,
      },
      overview: {
        totalOrders: userOrders.length,
        activeOrders,
        completedOrders,
        cancelledOrders,
        totalOrderAmount,
        totalPaid,
        advancePayments,
        remainingBalance,
        pendingAmount: remainingBalance,
        isFullyPaid,
        onlineOrdersCount: onlineOrders.length,
        showroomOrdersCount: showroomOrders.length,
        savedAddressesCount: addresses.length,
        wishlistCount: userWishlist.length,
      },
      stats: {
        totalOrders: userOrders.length,
        totalSpent: totalPaid,
        remainingBalance,
      },
      orders: ordersWithStatus,
      payments: paymentsWithOrderInfo,
      addresses,
      notifications: userNotifs,
      ledger,
    });
  } catch (error: any) {
    console.error('Customer Profile GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch customer profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address, city, currentPassword, newPassword } = body;

    const user = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (address !== undefined) updates.address = address.trim();
    if (city !== undefined) updates.city = city.trim();

    // Password change verification
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user[0].passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await db.update(users).set(updates).where(eq(users.id, sessionUser.id));

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('Customer Profile PUT error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status: 500 });
  }
}

