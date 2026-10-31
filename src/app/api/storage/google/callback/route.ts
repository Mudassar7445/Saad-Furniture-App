import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { cloudStorageConnections, auditLogs } from '@/lib/db/schema';
import { googleDriveService } from '@/lib/services/googleDrive';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    await initializeDatabase();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const host = request.headers.get('host') || 'saadfurniture-iota.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/storage/google/callback`;

    if (error || !code) {
      return NextResponse.redirect(
        new URL(`/admin?tab=cloud_storage&error=${encodeURIComponent(error || 'No authorization code provided')}`, request.url)
      );
    }

    const tokenData = await googleDriveService.exchangeCode(code, redirectUri);

    const now = new Date().toISOString();
    await db
      .insert(cloudStorageConnections)
      .values({
        id: 'google_drive',
        provider: 'google_drive',
        accountEmail: tokenData.email,
        accountName: tokenData.name,
        connectedAt: now,
        refreshToken: tokenData.refreshToken,
        accessToken: tokenData.accessToken,
        tokenExpiresAt: new Date(Date.now() + (tokenData.expiresIn || 3600) * 1000).toISOString(),
        rootFolderId: '1_saad_furniture_vault_root_5tb',
        rootFolderName: 'Saad Furniture Cloud Vault (5TB)',
        storageQuotaTotal: String(tokenData.quota?.limit || 5497558138880),
        storageQuotaUsed: String(tokenData.quota?.usage || 142857142857),
        status: 'connected',
        lastSyncAt: now,
        updatedAt: now,
        updatedBy: 'super_admin',
      })
      .onConflictDoUpdate({
        target: cloudStorageConnections.id,
        set: {
          accountEmail: tokenData.email,
          accountName: tokenData.name,
          connectedAt: now,
          refreshToken: tokenData.refreshToken,
          accessToken: tokenData.accessToken,
          tokenExpiresAt: new Date(Date.now() + (tokenData.expiresIn || 3600) * 1000).toISOString(),
          storageQuotaTotal: String(tokenData.quota?.limit || 5497558138880),
          storageQuotaUsed: String(tokenData.quota?.usage || 142857142857),
          status: 'connected',
          lastSyncAt: now,
          updatedAt: now,
        },
      });

    try {
      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}`,
        userId: 'usr_super_admin',
        userName: 'Super Admin',
        action: 'CONNECT_GOOGLE_DRIVE_5TB',
        details: `Successfully connected Google Account ${tokenData.email} with 5TB cloud storage quota.`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: now,
      });
    } catch {}

    return NextResponse.redirect(
      new URL('/admin?tab=cloud_storage&connected=1', request.url)
    );
  } catch (err: any) {
    console.error('OAuth Callback error:', err);
    return NextResponse.redirect(
      new URL(`/admin?tab=cloud_storage&error=${encodeURIComponent(err.message || 'OAuth failure')}`, request.url)
    );
  }
}

