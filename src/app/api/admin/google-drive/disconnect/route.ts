import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { disconnectGoogleDrive } from '@/lib/storage/google-drive';
import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 });
    }

    await disconnectGoogleDrive();

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      action: 'GOOGLE_DRIVE_DISCONNECTED',
      details: 'Super Admin disconnected Google Drive storage integration.',
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Google Drive 5TB storage has been disconnected successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to disconnect Google Drive' },
      { status: 500 }
    );
  }
}
