import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import {
  getDriveStorageQuota,
  resolveGoogleOAuthConfig,
  getStoredTokens,
  STANDARD_DRIVE_SECTIONS,
  PRODUCT_CATALOG_CATEGORIES,
  ROOT_FOLDER_NAME,
  disconnectGoogleDrive,
} from '@/lib/storage/google-drive';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'super_admin' && user.role !== 'staff')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const config = await resolveGoogleOAuthConfig();
    const quota = await getDriveStorageQuota();
    const tokens = await getStoredTokens();

    const isConnected = Boolean(quota.isConnected && (tokens?.refreshToken || tokens?.accessToken));

    const formatBytes = (bytes: number) => {
      if (!bytes || bytes <= 0) return '0.00 GB';
      const tb = bytes / (1024 * 1024 * 1024 * 1024);
      if (tb >= 1) return `${tb.toFixed(2)} TB`;
      const gb = bytes / (1024 * 1024 * 1024);
      if (gb >= 1) return `${gb.toFixed(2)} GB`;
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(2)} MB`;
    };

    // If quota limit returned from Drive is 0 or unmetered, display 5.0 TB tier
    const effectiveLimit = quota.limitBytes > 0 ? quota.limitBytes : 5 * 1024 * 1024 * 1024 * 1024;
    const effectiveUsage = quota.usageBytes || 0;
    const effectiveFree = Math.max(0, effectiveLimit - effectiveUsage);
    const effectivePercent = effectiveLimit > 0 ? Math.round((effectiveUsage / effectiveLimit) * 100) : 0;

    return NextResponse.json({
      success: true,
      isConfigured: isConnected,
      isConnected,
      configReady: Boolean(config.clientId && config.clientSecret),
      credentialsSource: config.source,
      clientId: config.clientId ? `${config.clientId.slice(0, 10)}...${config.clientId.slice(-12)}` : null,
      fullClientId: config.clientId || null,
      redirectUri: config.redirectUri,
      connectedEmail: quota.connectedEmail || tokens?.accountEmail || null,
      intendedEmail: quota.intendedEmail || tokens?.intendedEmail || null,
      accountName: quota.connectedName || tokens?.accountName || 'Saad Furniture Vault Owner',
      rootFolderId: quota.rootFolderId || tokens?.rootFolderId || null,
      rootFolderName: ROOT_FOLDER_NAME,
      standardFolders: STANDARD_DRIVE_SECTIONS,
      productCategories: PRODUCT_CATALOG_CATEGORIES,
      hasRefreshToken: Boolean(tokens?.refreshToken),
      lastConnectionCheck: quota.lastConnectionCheck || tokens?.lastConnectionCheck || null,
      lastTestStatus: quota.lastTestStatus || tokens?.lastTestStatus || (isConnected ? 'success' : 'warning'),
      lastTestMessage:
        quota.lastTestMessage ||
        tokens?.lastTestMessage ||
        (isConnected ? 'Connected to Google Drive 5TB Storage' : 'Not Connected'),
      storageQuota: {
        totalBytes: effectiveLimit,
        usedBytes: effectiveUsage,
        usedInDriveBytes: quota.usageInDriveBytes || 0,
        freeBytes: effectiveFree,
        totalFormatted: formatBytes(effectiveLimit),
        usedFormatted: formatBytes(effectiveUsage),
        freeFormatted: formatBytes(effectiveFree),
        usagePercent: effectivePercent,
      },
    });
  } catch (err: any) {
    console.error('Google Drive Status API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to load Google Drive status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'refresh';

    if (action === 'disconnect') {
      await disconnectGoogleDrive();
      return NextResponse.json({ success: true, message: 'Google Drive disconnected successfully.' });
    }

    // Refresh quota & status
    const quota = await getDriveStorageQuota();
    return NextResponse.json({ success: true, quota });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Action failed' }, { status: 500 });
  }
}

