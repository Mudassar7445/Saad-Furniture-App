import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { bankAccounts, auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { asc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    let query = db.select().from(bankAccounts);
    let accounts;
    if (all) {
      accounts = await query.orderBy(asc(bankAccounts.displayOrder));
    } else {
      accounts = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.isActive, 1))
        .orderBy(asc(bankAccounts.displayOrder));
    }

    return NextResponse.json({ success: true, bankAccounts: accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch bank accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (
      !sessionUser ||
      (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('accounts'))
    ) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      bankName,
      accountTitle,
      accountNumber,
      iban,
      branchName,
      branchCode,
      instructions,
      qrCodeUrl,
      isActive = 1,
      displayOrder = 0,
    } = body;

    if (!bankName || !accountTitle || !accountNumber || !iban) {
      return NextResponse.json(
        { error: 'Bank name, account title, account number, and IBAN are required.' },
        { status: 400 }
      );
    }

    const id = `bank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newBank = {
      id,
      bankName: bankName.trim(),
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      iban: iban.trim().toUpperCase(),
      branchName: branchName?.trim() || null,
      branchCode: branchCode?.trim() || null,
      instructions: instructions?.trim() || null,
      qrCodeUrl: qrCodeUrl?.trim() || null,
      isActive: isActive ? 1 : 0,
      displayOrder: Number(displayOrder) || 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(bankAccounts).values(newBank);

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'CREATE_BANK_ACCOUNT',
      details: `Added bank account [${bankName}] - ${accountNumber}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({ success: true, bankAccount: newBank });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create bank account' }, { status: 500 });
  }
}

