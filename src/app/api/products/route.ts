import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { products, auditLogs, wishlists } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';
import { desc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 60s ISR / Edge cache

// High-speed in-memory server cache (45s TTL) for fast catalog loading on 4G and low-end mobile devices
interface ProductsCacheEntry {
  data: any;
  cachedAt: number;
}
const productsCache = new Map<string, ProductsCacheEntry>();
const CACHE_TTL_MS = 45 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = searchParams.has('limit') ? Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10))) : 0;

    const cacheKey = `${category || 'all'}_${page}_${limit}`;
    const cached = productsCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      const headers = new Headers();
      headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      headers.set('X-Catalog-Cache', 'HIT');
      return NextResponse.json(cached.data, { headers });
    }

    await initializeDatabase();

    let query = db
      .select({
        id: products.id,
        title: products.title,
        sku: products.sku,
        category: products.category,
        description: products.description,
        price: products.price,
        discountPrice: products.discountPrice,
        material: products.material,
        dimensions: products.dimensions,
        stockQuantity: products.stockQuantity,
        status: products.status,
        showroomLocation: products.showroomLocation,
        featured: products.featured,
        featuredImage: products.featuredImage,
        images: products.images,
        warrantyDetails: products.warrantyDetails,
        isPublished: products.isPublished,
        createdAt: products.createdAt,
      })
      .from(products);

    let allProducts;
    if (category && category.toLowerCase() !== 'all') {
      allProducts = await query
        .where(eq(products.category, category))
        .orderBy(desc(products.createdAt));
    } else {
      allProducts = await query.orderBy(desc(products.createdAt));
    }

    const total = allProducts.length;
    const paginatedProducts = limit > 0 ? allProducts.slice((page - 1) * limit, page * limit) : allProducts;

    // Attach real live like counts aggregated from wishlists table
    let likeCountsMap = new Map<string, number>();
    try {
      const counts = await db
        .select({
          productId: wishlists.productId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(wishlists)
        .groupBy(wishlists.productId);
      counts.forEach((c) => likeCountsMap.set(c.productId, Number(c.count) || 0));
    } catch {}

    const productsWithLikes = paginatedProducts.map((p) => ({
      ...p,
      likeCount: likeCountsMap.get(p.id) || 0,
    }));

    const responseData = {
      products: productsWithLikes,
      total,
      page,
      limit: limit || total,
    };

    // Store in memory cache
    productsCache.set(cacheKey, {
      data: responseData,
      cachedAt: Date.now(),
    });

    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    headers.set('X-Catalog-Cache', 'MISS');

    return NextResponse.json(responseData, { headers });
  } catch (err: any) {
    console.error('Products fetch error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
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
      featuredImage = null,
      images = [],
      videos = [],
      documents = [],
      warrantyDetails = '',
      isPublished = 1,
      specs = {},
    } = body;

    if (!title || !category || !price) {
      return NextResponse.json({ error: 'Title, category, and price are required.' }, { status: 400 });
    }

    const productId = `prod_${Date.now()}`;
    const sku = body.sku || `SF-${category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const normalizedImages = Array.isArray(images) ? images : [];
    const mainImg = featuredImage || (normalizedImages.length > 0 ? normalizedImages[0] : null);

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
      featuredImage: mainImg,
      images: JSON.stringify(normalizedImages),
      videos: JSON.stringify(Array.isArray(videos) ? videos : []),
      documents: JSON.stringify(Array.isArray(documents) ? documents : []),
      warrantyDetails: warrantyDetails || '5 Years Architectural Hardwood Warranty',
      isPublished: isPublished ? 1 : 0,
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

    productsCache.clear();
    return NextResponse.json({ success: true, productId, sku });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}

