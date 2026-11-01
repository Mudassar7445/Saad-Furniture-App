import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { bankAccounts, auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('accounts'))
    ) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.bankName !== undefined) updateData.bankName = body.bankName.trim();
    if (body.accountTitle !== undefined) updateData.accountTitle = body.accountTitle.trim();
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber.trim();
    if (body.iban !== undefined) updateData.iban = body.iban.trim().toUpperCase();
    if (body.branchName !== undefined) updateData.branchName = body.branchName?.trim() || null;
    if (body.branchCode !== undefined) updateData.branchCode = body.branchCode?.trim() || null;
    if (body.instructions !== undefined) updateData.instructions = body.instructions?.trim() || null;
    if (body.qrCodeUrl !== undefined) updateData.qrCodeUrl = body.qrCodeUrl?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive ? 1 : 0;
    if (body.displayOrder !== undefined) updateData.displayOrder = Number(body.displayOrder) || 0;

    await db.update(bankAccounts).set(updateData).where(eq(bankAccounts.id, id));

    return NextResponse.json({ success: true, message: 'Bank account updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('accounts'))
    ) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { id } = await params;
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'DELETE_BANK_ACCOUNT',
      details: `Removed bank account [${id}]`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Bank account deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Delete failed' }, { status: 500 });
  }
}

