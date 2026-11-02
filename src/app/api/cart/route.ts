import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { shoppingCarts, cartItems, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function getOrCreateCart(userId?: string, sessionToken?: string) {
  let cart = null;

  if (userId) {
    const existing = await db
      .select()
      .from(shoppingCarts)
      .where(eq(shoppingCarts.userId, userId))
      .limit(1);
    if (existing.length > 0) cart = existing[0];
  } else if (sessionToken) {
    const existing = await db
      .select()
      .from(shoppingCarts)
      .where(eq(shoppingCarts.sessionToken, sessionToken))
      .limit(1);
    if (existing.length > 0) cart = existing[0];
  }

  if (!cart) {
    const cartId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    await db.insert(shoppingCarts).values({
      id: cartId,
      userId: userId || null,
      sessionToken: sessionToken || `sess_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    });
    const created = await db.select().from(shoppingCarts).where(eq(shoppingCarts.id, cartId)).limit(1);
    cart = created[0];
  }

  return cart;
}

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    const url = new URL(request.url);
    const sessionToken = url.searchParams.get('sessionToken') || request.headers.get('x-cart-session') || undefined;

    const cart = await getOrCreateCart(sessionUser?.id, sessionToken);

    // Fetch items with product details
    const items = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        selectedColour: cartItems.selectedColour,
        selectedDesign: cartItems.selectedDesign,
        customNotes: cartItems.customNotes,
        productTitle: products.title,
        productPrice: products.price,
        discountPrice: products.discountPrice,
        sku: products.sku,
        category: products.category,
        images: products.images,
        stockQuantity: products.stockQuantity,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    const parsedItems = items.map((item) => {
      let imageList: string[] = [];
      try {
        imageList = JSON.parse(item.images || '[]');
      } catch {
        imageList = [];
      }
      const unitPrice = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.productPrice;
      return {
        ...item,
        images: imageList,
        primaryImage: imageList[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop',
        effectivePrice: unitPrice,
        totalItemPrice: unitPrice * item.quantity,
      };
    });

    const subtotal = parsedItems.reduce((sum, item) => sum + item.totalItemPrice, 0);
    const totalCount = parsedItems.reduce((sum, item) => sum + item.quantity, 0);
    const deliveryFee = subtotal > 50000 || subtotal === 0 ? 0 : 3000; // Complimentary white-glove delivery on orders > PKR 50,000

    return NextResponse.json({
      cartId: cart.id,
      sessionToken: cart.sessionToken,
      items: parsedItems,
      totalCount,
      subtotal,
      deliveryFee,
      grandTotal: subtotal + deliveryFee,
    });
  } catch (error: any) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    const body = await request.json();
    const { productId, quantity = 1, selectedColour, selectedDesign, customNotes, sessionToken } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const prod = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (prod.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const cart = await getOrCreateCart(sessionUser?.id, sessionToken);

    // Check if item already in cart with same color and design
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .limit(1);

    const now = new Date().toISOString();

    if (existing.length > 0) {
      const updatedQty = existing[0].quantity + Number(quantity);
      await db
        .update(cartItems)
        .set({
          quantity: updatedQty,
          selectedColour: selectedColour || existing[0].selectedColour,
          selectedDesign: selectedDesign || existing[0].selectedDesign,
          customNotes: customNotes || existing[0].customNotes,
          updatedAt: now,
        })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        cartId: cart.id,
        productId,
        quantity: Math.max(1, Number(quantity)),
        selectedColour: selectedColour || null,
        selectedDesign: selectedDesign || null,
        customNotes: customNotes || null,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ success: true, message: 'Added to cart successfully' });
  } catch (error: any) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add item to cart' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await initializeDatabase();
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: 'Item ID and quantity required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (Number(quantity) <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
    } else {
      await db
        .update(cartItems)
        .set({ quantity: Number(quantity), updatedAt: now })
        .where(eq(cartItems.id, itemId));
    }

    return NextResponse.json({ success: true, message: 'Cart updated' });
  } catch (error: any) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');
    const clear = url.searchParams.get('clear');
    const sessionToken = url.searchParams.get('sessionToken') || undefined;

    const cart = await getOrCreateCart(sessionUser?.id, sessionToken);

    if (clear === 'true') {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      return NextResponse.json({ success: true, message: 'Cart cleared' });
    }

    if (itemId) {
      await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
      return NextResponse.json({ success: true, message: 'Item removed from cart' });
    }

    return NextResponse.json({ error: 'Item ID or clear flag required' }, { status: 400 });
  } catch (error: any) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to remove from cart' }, { status: 500 });
  }
}

