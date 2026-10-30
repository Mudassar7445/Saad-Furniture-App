import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { products, auditLogs } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  await initializeDatabase();
  await seedDatabase();

  const allProducts = await db.select().from(products).orderBy(desc(products.featured), desc(products.createdAt));
  return NextResponse.json({ products: allProducts });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  if (sessionUser.role !== 'super_admin' && !sessionUser.permissions.includes('products')) {
    return NextResponse.json({ error: 'Permission denied to manage products.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title,
      category,
      description,
      price,
      discountPrice,
      material,
      dimensions,
      stockQuantity = 1,
      status = 'available',
      showroomLocation = 'Main Gallery Floor',
      featured = 0,
      images = [],
      specs = {},
    } = body;

    if (!title || !category || !price) {
      return NextResponse.json({ error: 'Title, category, and price are required.' }, { status: 400 });
    }

    const productId = `prod_${Date.now()}`;
    const sku = `SF-${category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    await db.insert(products).values({
      id: productId,
      title,
      sku,
      category,
      description: description || 'Handcrafted bespoke luxury furniture piece.',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      material: material || 'Solid Hardwood & Premium Finishing',
      dimensions: dimensions || 'Custom Bespoke Sizing',
      stockQuantity: Number(stockQuantity),
      status,
      showroomLocation,
      featured: featured ? 1 : 0,
      images: JSON.stringify(images),
      specs: JSON.stringify(specs),
      createdAt: now,
    });

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'CREATE_PRODUCT',
      details: `Added new product [${title}] (SKU: ${sku})`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({ success: true, productId, sku });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}

