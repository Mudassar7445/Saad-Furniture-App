import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users, auditLogs } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can update staff.' }, { status: 403 });
  }

  const body = await request.json();
  const { name, phone, permissions, status, newPassword } = body;

  const updateData: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (status) updateData.status = status;

  if (Array.isArray(permissions)) {
    const valid = permissions.filter((p: string) =>
      ['orders', 'media', 'delivery', 'accounts', 'products'].includes(p)
    );
    updateData.permissions = JSON.stringify(valid);
  }

  if (newPassword && newPassword.length >= 6) {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(newPassword, salt);
  }

  await db.update(users).set(updateData).where(eq(users.id, id));

  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'UPDATE_STAFF',
    details: `Super Admin modified staff user [${id}] permissions / status.`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: 'Staff member updated successfully.' });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can delete staff.' }, { status: 403 });
  }

  await db.delete(users).where(eq(users.id, id));

  await db.insert(auditLogs).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: sessionUser.id,
    userName: sessionUser.name,
    action: 'DELETE_STAFF',
    details: `Super Admin removed staff member [${id}]`,
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, message: 'Staff account removed.' });
}

