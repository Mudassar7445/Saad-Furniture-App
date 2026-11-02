import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { products, mediaFiles, auditLogs } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { queueNotificationEvent } from '@/lib/services/webpush';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initializeDatabase();
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(or(eq(products.id, id), eq(products.sku, id)))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  let media: any[] = [];
  try {
    media = await db.select().from(mediaFiles).where(eq(mediaFiles.productId, product.id));
  } catch (e) {
    console.warn('Error fetching media for product:', e);
  }

  return NextResponse.json({ product, media });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initializeDatabase();
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

  if (body.title !== undefined) updateData.title = body.title;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.price !== undefined) updateData.price = Number(body.price);
  if (body.discountPrice !== undefined) updateData.discountPrice = body.discountPrice ? Number(body.discountPrice) : null;
  if (body.material !== undefined) updateData.material = body.material;
  if (body.dimensions !== undefined) updateData.dimensions = body.dimensions;
  if (body.stockQuantity !== undefined) updateData.stockQuantity = Number(body.stockQuantity);
  if (body.status !== undefined) updateData.status = body.status;
  if (body.showroomLocation !== undefined) updateData.showroomLocation = body.showroomLocation;
  if (body.featured !== undefined) updateData.featured = body.featured ? 1 : 0;
  if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage;
  if (body.warrantyDetails !== undefined) updateData.warrantyDetails = body.warrantyDetails;
  if (body.isPublished !== undefined) updateData.isPublished = body.isPublished ? 1 : 0;
  if (body.images !== undefined) {
    updateData.images = typeof body.images === 'string' ? body.images : JSON.stringify(body.images);
  }
  if (body.videos !== undefined) {
    updateData.videos = typeof body.videos === 'string' ? body.videos : JSON.stringify(body.videos);
  }
  if (body.documents !== undefined) {
    updateData.documents = typeof body.documents === 'string' ? body.documents : JSON.stringify(body.documents);
  }
  if (body.specs !== undefined) {
    updateData.specs = typeof body.specs === 'string' ? body.specs : JSON.stringify(body.specs);
  }

  await db.update(products).set(updateData).where(eq(products.id, id));

  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'UPDATE_PRODUCT',
    details: `Updated product [${id}] details / media / pricing`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  if (body.title || body.price || body.discountPrice || body.featuredImage || body.images || body.category) {
    queueNotificationEvent({
      type: 'product_update',
      title: '🏷️ Catalog Update: ' + (body.title || 'Collection Update'),
      message: body.discountPrice
        ? `Special promotional pricing now available for ${body.title || 'this piece'}.`
        : `Details or media have been updated for ${body.title || 'this handcrafted piece'}.`,
      category: 'products',
      targetUserId: 'all',
      url: `/?product=${id}`,
      relatedId: id,
    }).catch((err) => console.error('Failed to queue product update notification:', err));
  }

  return NextResponse.json({ success: true, message: 'Product updated.' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initializeDatabase();
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super Admin only.' }, { status: 403 });
  }

  await db.delete(products).where(eq(products.id, id));

  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'DELETE_PRODUCT',
    details: `Deleted product [${id}]`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: 'Product deleted.' });
}
