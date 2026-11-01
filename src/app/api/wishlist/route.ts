import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { wishlists, products } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ items: [], count: 0, productIds: [] });
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

    const productIds = Array.from(new Set(items.map((i) => i.productId)));

    return NextResponse.json({
      items: parsed,
      count: parsed.length,
      productIds,
    });
  } catch (error: any) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    const body = await request.json();

    // 1. GUEST SYNC ACTION (When customer signs in on any device)
    if (body.action === 'sync_guest' && Array.isArray(body.productIds) && sessionUser) {
      const now = new Date().toISOString();
      for (const pId of body.productIds) {
        if (!pId || typeof pId !== 'string') continue;
        const exists = await db
          .select({ id: wishlists.id })
          .from(wishlists)
          .where(and(eq(wishlists.userId, sessionUser.id), eq(wishlists.productId, pId)))
          .limit(1);

        if (exists.length === 0) {
          try {
            await db.insert(wishlists).values({
              id: `wsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              userId: sessionUser.id,
              productId: pId,
              createdAt: now,
            });
          } catch {}
        }
      }

      const allUserItems = await db
        .select({ productId: wishlists.productId })
        .from(wishlists)
        .where(eq(wishlists.userId, sessionUser.id));

      const updatedIds = Array.from(new Set(allUserItems.map((i) => i.productId)));
      return NextResponse.json({ success: true, count: updatedIds.length, productIds: updatedIds });
    }

    // 2. TOGGLE LIKE / UNLIKE
    const { productId } = body;
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // For unauthenticated guest visitors, acknowledge cleanly with local preference recommendation
    if (!sessionUser) {
      return NextResponse.json({
        success: true,
        guest: true,
        wishlisted: true,
        message: 'Saved to local favorites. Sign in to synchronize across all your devices.',
      });
    }

    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(and(eq(wishlists.userId, sessionUser.id), eq(wishlists.productId, productId)));

    if (existing.length > 0) {
      // Remove all duplicate instances safely
      await db
        .delete(wishlists)
        .where(and(eq(wishlists.userId, sessionUser.id), eq(wishlists.productId, productId)));

      const [countRes] = await db
        .select({ count: sql<number>`count(*)` })
        .from(wishlists)
        .where(eq(wishlists.productId, productId));

      const likeCount = Number(countRes?.count || 0);

      return NextResponse.json({
        success: true,
        wishlisted: false,
        likeCount,
        message: 'Removed from wishlist',
      });
    } else {
      await db.insert(wishlists).values({
        id: `wsh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        productId,
        createdAt: new Date().toISOString(),
      });

      const [countRes] = await db
        .select({ count: sql<number>`count(*)` })
        .from(wishlists)
        .where(eq(wishlists.productId, productId));

      const likeCount = Number(countRes?.count || 1);

      return NextResponse.json({
        success: true,
        wishlisted: true,
        likeCount,
        message: 'Added to wishlist',
      });
    }
  } catch (error: any) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update wishlist' }, { status: 500 });
  }
}

