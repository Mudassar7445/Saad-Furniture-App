import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { productInquiries, notifications, auditLogs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let list;
  if (sessionUser.role === 'customer') {
    list = await db
      .select()
      .from(productInquiries)
      .where(eq(productInquiries.customerId, sessionUser.id))
      .orderBy(desc(productInquiries.createdAt));
  } else {
    list = await db
      .select()
      .from(productInquiries)
      .orderBy(desc(productInquiries.createdAt));
  }

  return NextResponse.json({ inquiries: list });
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    const body = await request.json();
    const {
      productId,
      productTitle = 'Bespoke Custom Furniture Commission',
      customerName,
      customerPhone,
      customerEmail,
      inquiryType = 'quotation',
      message,
    } = body;

    const finalName = sessionUser?.name || customerName;
    const finalEmail = sessionUser?.email || customerEmail;
    const finalPhone = customerPhone || 'Not provided';
    const customerId = sessionUser?.id || null;

    if (!finalName || !message) {
      return NextResponse.json({ error: 'Name and inquiry message are required.' }, { status: 400 });
    }

    const inquiryId = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    await db.insert(productInquiries).values({
      id: inquiryId,
      productId: productId || null,
      productTitle,
      customerId,
      customerName: finalName,
      customerPhone: finalPhone || 'Not provided',
      customerEmail: finalEmail || 'Not provided',
      inquiryType,
      message,
      status: 'pending',
      createdAt: now,
    });

    // Notify Super Admin
    await db.insert(notifications).values({
      id: `notif_${Date.now()}_inq`,
      userId: 'all',
      title: `New Showroom Inquiry: ${productTitle}`,
      message: `${finalName} submitted a ${inquiryType.replace('_', ' ')} inquiry: "${message.substring(0, 80)}..."`,
      type: 'product_update',
      relatedOrderId: null,
      isRead: 0,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      inquiryId,
      message: 'Your custom inquiry has been received. Our luxury design consultant will contact you shortly.',
    });
  } catch (err) {
    console.error('Create inquiry error:', err);
    return NextResponse.json({ error: 'Failed to submit inquiry.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('products'))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { inquiryId, status } = body;

    if (!inquiryId || !status) {
      return NextResponse.json({ error: 'Inquiry ID and new status are required.' }, { status: 400 });
    }

    await db
      .update(productInquiries)
      .set({ status })
      .where(eq(productInquiries.id, inquiryId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update inquiry status error:', err);
    return NextResponse.json({ error: 'Failed to update inquiry status.' }, { status: 500 });
  }
}
