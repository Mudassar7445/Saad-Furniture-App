import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { code, orderTotal = 0 } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const normalizedCode = code.toUpperCase().trim();
    const found = await db.select().from(coupons).where(eq(coupons.code, normalizedCode)).limit(1);

    if (found.length === 0 || !found[0].isActive) {
      return NextResponse.json({ error: 'Invalid or inactive promotional code.' }, { status: 404 });
    }

    const c = found[0];

    // Check expiry
    if (c.validUntil && new Date(c.validUntil) < new Date()) {
      return NextResponse.json({ error: 'This promotional code has expired.' }, { status: 400 });
    }

    // Check minimum order amount
    if (orderTotal < c.minOrderAmount) {
      return NextResponse.json(
        { error: `This code requires a minimum order investment of $${c.minOrderAmount}.` },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (c.discountType === 'percentage') {
      discountAmount = (orderTotal * c.discountValue) / 100;
      if (c.maxDiscountAmount && discountAmount > c.maxDiscountAmount) {
        discountAmount = c.maxDiscountAmount;
      }
    } else {
      discountAmount = c.discountValue;
    }

    return NextResponse.json({
      valid: true,
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      discountAmount: Math.round(discountAmount * 100) / 100,
      message: `Coupon "${c.code}" applied successfully!`,
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to validate coupon' }, { status: 500 });
  }
}
