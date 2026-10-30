import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { users, orders, customerLedger, notifications, customerAddresses, wishlists } from '@/lib/db/schema';
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
    const userOrders = await db.select().from(orders).where(eq(orders.customerId, sessionUser.id)).orderBy(desc(orders.createdAt));
    const onlineOrders = userOrders.filter((o) => o.orderType === 'online');
    const showroomOrders = userOrders.filter((o) => o.orderType !== 'online');

    const totalBusiness = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalPaid = userOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
    const remainingBalance = userOrders.reduce((sum, o) => sum + (o.remainingBalance || 0), 0);

    // Ledger entries
    const ledger = await db.select().from(customerLedger).where(eq(customerLedger.customerId, sessionUser.id)).orderBy(desc(customerLedger.createdAt));

    // Addresses
    const addresses = await db.select().from(customerAddresses).where(eq(customerAddresses.userId, sessionUser.id));

    // Wishlist count
    const userWishlist = await db.select().from(wishlists).where(eq(wishlists.userId, sessionUser.id));

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
      stats: {
        totalOrders: userOrders.length,
        onlineOrdersCount: onlineOrders.length,
        showroomOrdersCount: showroomOrders.length,
        totalBusiness,
        totalPaid,
        remainingBalance,
        savedAddressesCount: addresses.length,
        wishlistCount: userWishlist.length,
      },
      orders: userOrders,
      ledger,
    });
  } catch (error: any) {
    console.error('Customer Profile GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch customer profile' }, { status: 500 });
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

