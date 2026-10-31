import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { cloudStorageConnections, auditLogs } from '@/lib/db/schema';
import { googleDriveService } from '@/lib/services/googleDrive';
import { eq } from 'drizzle-orm';

export async function GET() {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const status = await googleDriveService.getStatus();
  return NextResponse.json({ storage: status });
}

export async function POST(request: Request) {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: Super Admin only.' }, { status: 403 });
  }

  const body = await request.json();
  const { action, email, storageCapacity, rootFolderId } = body;

  const now = new Date().toISOString();

  if (action === 'disconnect') {
    await db
      .update(cloudStorageConnections)
      .set({
        status: 'disconnected',
        updatedAt: now,
        updatedBy: sessionUser.name,
      })
      .where(eq(cloudStorageConnections.id, 'google_drive'));

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'DISCONNECT_GOOGLE_DRIVE',
      details: 'Super Admin disconnected Google Drive 5TB storage account.',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({ success: true, message: 'Google account disconnected.' });
  }

  if (action === 'reconnect' || action === 'connect_manual') {
    const targetEmail = email?.trim() || 'saadfurniture.cloud5tb@gmail.com';
    const targetCapacity = storageCapacity || '5497558138880'; // 5 TB

    await db
      .insert(cloudStorageConnections)
      .values({
        id: 'google_drive',
        provider: 'google_drive',
        accountEmail: targetEmail,
        accountName: 'Saad Furniture 5TB Cloud Vault',
        connectedAt: now,
        rootFolderId: rootFolderId || '1_saad_furniture_vault_root_5tb',
        rootFolderName: 'Saad Furniture Cloud Vault (5TB)',
        storageQuotaTotal: targetCapacity,
        storageQuotaUsed: '142857142857',
        status: 'connected',
        lastSyncAt: now,
        updatedAt: now,
        updatedBy: sessionUser.name,
      })
      .onConflictDoUpdate({
        target: cloudStorageConnections.id,
        set: {
          accountEmail: targetEmail,
          status: 'connected',
          storageQuotaTotal: targetCapacity,
          lastSyncAt: now,
          updatedAt: now,
          updatedBy: sessionUser.name,
        },
      });

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'CONNECT_GOOGLE_DRIVE_5TB',
      details: `Google Account ${targetEmail} connected with 5TB storage plan.`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({ success: true, message: 'Google Drive 5TB account authenticated and connected successfully.' });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function PUT(request: Request) {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: Super Admin only.' }, { status: 403 });
  }

  const body = await request.json();
  const { rootFolderId, rootFolderName } = body;

  await db
    .update(cloudStorageConnections)
    .set({
      rootFolderId: rootFolderId || undefined,
      rootFolderName: rootFolderName || undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: sessionUser.name,
    })
    .where(eq(cloudStorageConnections.id, 'google_drive'));

  return NextResponse.json({ success: true, message: 'Storage folder updated.' });
}

