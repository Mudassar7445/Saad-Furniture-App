import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { customerAddresses } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, sessionUser.id))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));

    return NextResponse.json({ addresses });
  } catch (error: any) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title = 'Home', recipientName, phone, address, city, area, postalCode, isDefault = 0 } = body;

    if (!recipientName || !phone || !address || !city) {
      return NextResponse.json(
        { error: 'Recipient name, phone, address, and city are required' },
        { status: 400 }
      );
    }

    const id = `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    if (isDefault) {
      // Unset previous defaults
      await db
        .update(customerAddresses)
        .set({ isDefault: 0 })
        .where(eq(customerAddresses.userId, sessionUser.id));
    }

    await db.insert(customerAddresses).values({
      id,
      userId: sessionUser.id,
      title,
      recipientName,
      phone,
      address,
      city,
      area: area || null,
      postalCode: postalCode || null,
      isDefault: isDefault ? 1 : 0,
      createdAt: now,
    });

    return NextResponse.json({ success: true, message: 'Address saved successfully', addressId: id });
  } catch (error: any) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to save address' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const addressId = url.searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 });
    }

    await db
      .delete(customerAddresses)
      .where(and(eq(customerAddresses.id, addressId), eq(customerAddresses.userId, sessionUser.id)));

    return NextResponse.json({ success: true, message: 'Address removed' });
  } catch (error: any) {
    console.error('Addresses DELETE error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete address' }, { status: 500 });
  }
}
