import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { wishlists, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ items: [] });
    }

    const items = await db
      .select({
        wishlistId: wishlists.id,
        productId: wishlists.productId,
        productTitle: products.title,
        price: products.price,
        discountPrice: products.discountPrice,
        category: products.category,
        images: products.images,
        status: products.status,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, sessionUser.id));

    const parsed = items.map((item) => {
      let imageList: string[] = [];
      try {
        imageList = JSON.parse(item.images || '[]');
      } catch {
        imageList = [];
      }
      return {
        ...item,
        images: imageList,
        primaryImage: imageList[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop',
      };
    });

    return NextResponse.json({ items: parsed });
  } catch (error: any) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Please sign in to save items to your wishlist' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, sessionUser.id), eq(wishlists.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
      return NextResponse.json({ wishlisted: false, message: 'Removed from wishlist' });
    } else {
      await db.insert(wishlists).values({
        id: `wsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        productId,
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ wishlisted: true, message: 'Added to wishlist' });
    }
  } catch (error: any) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update wishlist' }, { status: 500 });
  }
}

