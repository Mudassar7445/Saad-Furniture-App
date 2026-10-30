import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { products, auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (sessionUser.role !== 'super_admin' && !sessionUser.permissions.includes('products')) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.title) updateData.title = body.title;
  if (body.category) updateData.category = body.category;
  if (body.description) updateData.description = body.description;
  if (body.price !== undefined) updateData.price = Number(body.price);
  if (body.discountPrice !== undefined) updateData.discountPrice = body.discountPrice ? Number(body.discountPrice) : null;
  if (body.material) updateData.material = body.material;
  if (body.dimensions) updateData.dimensions = body.dimensions;
  if (body.stockQuantity !== undefined) updateData.stockQuantity = Number(body.stockQuantity);
  if (body.status) updateData.status = body.status;
  if (body.showroomLocation !== undefined) updateData.showroomLocation = body.showroomLocation;
  if (body.featured !== undefined) updateData.featured = body.featured ? 1 : 0;
  if (body.images) updateData.images = JSON.stringify(body.images);
  if (body.specs) updateData.specs = JSON.stringify(body.specs);

  await db.update(products).set(updateData).where(eq(products.id, id));

  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'UPDATE_PRODUCT',
    details: `Updated product [${id}] details / pricing`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: 'Product updated.' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can delete catalogue items.' }, { status: 403 });
  }

  await db.delete(products).where(eq(products.id, id));

  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'DELETE_PRODUCT',
    details: `Super Admin deleted product [${id}]`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: 'Product deleted.' });
}

