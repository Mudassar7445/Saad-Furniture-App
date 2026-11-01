import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';

// PUT /api/coupons/[id] - Update coupon details or active status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'super_admin' && sessionUser.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.code !== undefined) updateData.code = body.code.toUpperCase().trim();
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = Number(body.discountValue);
    if (body.minOrderAmount !== undefined) updateData.minOrderAmount = Number(body.minOrderAmount);
    if (body.maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    }
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil || null;
    if (body.usageLimit !== undefined) updateData.usageLimit = Number(body.usageLimit);
    if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;

    await db.update(coupons).set(updateData).where(eq(coupons.id, id));

    const [updated] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully.',
      coupon: updated,
    });
  } catch (error: any) {
    console.error('Failed to update coupon:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update coupon' },
      { status: 500 }
    );
  }
}

// DELETE /api/coupons/[id] - Delete coupon
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized. Super Admin only.' }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(coupons).where(eq(coupons.id, id));

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully.',
    });
  } catch (error: any) {
    console.error('Failed to delete coupon:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
