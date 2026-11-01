import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { desc, eq } from 'drizzle-orm';

// GET /api/coupons
// If admin/staff: returns all coupons
// If public query ?featured=true or public call: returns active featured coupon(s)
export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';

    if (isPublic) {
      const activeCoupons = await db
        .select()
        .from(coupons)
        .where(eq(coupons.isActive, 1))
        .orderBy(desc(coupons.createdAt))
        .limit(5);

      // Filter out expired ones
      const now = new Date();
      const validActive = activeCoupons.filter((c) => {
        if (!c.validUntil) return true;
        return new Date(c.validUntil) >= now;
      });

      return NextResponse.json({
        coupons: validActive.map((c) => ({
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minOrderAmount: c.minOrderAmount,
          maxDiscountAmount: c.maxDiscountAmount,
        })),
      });
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'super_admin' && sessionUser.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allCoupons = await db
      .select()
      .from(coupons)
      .orderBy(desc(coupons.createdAt));

    return NextResponse.json({ coupons: allCoupons });
  } catch (error: any) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

// POST /api/coupons - Create a new coupon (Admin only)
export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'super_admin' && sessionUser.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      discountType = 'percentage',
      discountValue,
      minOrderAmount = 0,
      maxDiscountAmount = null,
      validUntil = null,
      usageLimit = 100,
      isActive = 1,
    } = body;

    if (!code || !discountValue) {
      return NextResponse.json(
        { error: 'Code and discount value are required.' },
        { status: 400 }
      );
    }

    const cleanCode = code.toUpperCase().trim();

    // Check duplicate
    const existing = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, cleanCode))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Coupon code "${cleanCode}" already exists.` },
        { status: 409 }
      );
    }

    const newCouponId = `coupon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await db.insert(coupons).values({
      id: newCouponId,
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      validUntil: validUntil || null,
      usageLimit: Number(usageLimit) || 100,
      usedCount: 0,
      isActive: isActive ? 1 : 0,
      createdAt: now,
    });

    const [created] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, newCouponId))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully.`,
      coupon: created,
    });
  } catch (error: any) {
    console.error('Failed to create coupon:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
