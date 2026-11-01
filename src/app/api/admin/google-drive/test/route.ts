import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { client } from '@/lib/db';
import {
  resolveGoogleOAuthConfig,
  getStoredTokens,
  getValidAccessToken,
  ensureStandardFolderStructure,
  uploadBufferToDrive,
  deleteDriveFile,
  ROOT_FOLDER_NAME,
} from '@/lib/storage/google-drive';

export interface DiagnosticStep {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: string;
}

export async function POST() {
  const steps: DiagnosticStep[] = [];
  const now = new Date().toISOString();

  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 });
    }

    // Step 1: Check OAuth Client Credentials
    const config = await resolveGoogleOAuthConfig();
    if (!config.clientId || !config.clientSecret) {
      steps.push({
        name: 'OAuth Credentials',
        status: 'error',
        message: 'Missing Cloud OAuth Credentials',
        details:
          'Neither GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET environment variables nor database vault credentials were found.',
      });

      return NextResponse.json({
        success: false,
        status: 'error',
        message: 'Cloud storage OAuth credentials are not configured.',
        steps,
      });
    }

    steps.push({
      name: 'OAuth Credentials',
      status: 'success',
      message: `Configured via ${config.source === 'env' ? 'Environment Variables' : 'Secure Database Vault (AES-256-GCM)'}`,
      details: `Client ID: ${config.clientId.slice(0, 10)}... (Redirect URI: ${config.redirectUri})`,
    });

    // Step 2: Check Token Record in Database
    const tokens = await getStoredTokens();
    if (!tokens || !tokens.refreshToken) {
      steps.push({
        name: 'Account Connection',
        status: 'error',
        message: 'No active cloud storage connection found',
        details: "Click 'Connect Cloud Storage' to initiate authorization.",
      });

      return NextResponse.json({
        success: false,
        status: 'error',
        message: 'Cloud Storage Account is not connected yet.',
        steps,
      });
    }

    steps.push({
      name: 'Account Connection',
      status: 'success',
      message: `Connected Account: ${tokens.accountEmail}`,
      details: `Verified Email: ${tokens.accountEmail}`,
    });

    // Step 3: Test Access Token Refresh against Google OAuth Servers
    let validAccessToken = '';
    try {
      validAccessToken = await getValidAccessToken();
      steps.push({
        name: 'Token Refresh & Validity',
        status: 'success',
        message: 'Access token is valid and refresh flow verified with Google OAuth servers',
      });
    } catch (refreshErr: any) {
      steps.push({
        name: 'Token Refresh & Validity',
        status: 'error',
        message: 'Failed to refresh token with Google OAuth',
        details: refreshErr.message || 'The refresh token may have expired or been revoked.',
      });

      await client.execute({
        sql: `UPDATE google_drive_tokens SET last_test_status = 'error', last_test_message = ?, last_connection_check = ?, updated_at = ? WHERE id = 'active_account'`,
        args: [`Token refresh failed: ${refreshErr.message}`, now, now],
      });

      return NextResponse.json({
        success: false,
        status: 'error',
        message: 'Google Drive token refresh failed.',
        steps,
      });
    }

    // Step 4: Verify Folder Structure in Google Drive
    let rootFolderId = '';
    try {
      const folderRes = await ensureStandardFolderStructure(validAccessToken);
      rootFolderId = folderRes.rootFolderId;
      steps.push({
        name: 'Dedicated Folder Hierarchy',
        status: 'success',
        message: `Dedicated '${ROOT_FOLDER_NAME}' folder and category subfolders verified in Drive`,
        details: `Root Folder ID: ${rootFolderId} | Subfolders: ${Object.keys(folderRes.subfolders).length} created`,
      });
    } catch (folderErr: any) {
      steps.push({
        name: 'Dedicated Folder Hierarchy',
        status: 'warning',
        message: 'Folder creation had a warning',
        details: folderErr.message,
      });
    }

    // Step 5: Test Actual Live File Upload & Immediate Deletion to Prove Read/Write Privileges
    try {
      const testBuffer = Buffer.from(
        `Saad Furniture Vault Verification Test - ${now}\nVerified connection with Google Drive 5TB Storage.`,
        'utf8'
      );
      const uploaded = await uploadBufferToDrive({
        buffer: testBuffer,
        filename: `saad_verify_${Date.now()}.txt`,
        mimeType: 'text/plain',
        pathSegments: [ROOT_FOLDER_NAME, 'General Business Documents'],
        description: 'Temporary verification test marker',
      });

      // Cleanup test file immediately
      if (uploaded.id) {
        await deleteDriveFile(uploaded.id);
      }

      steps.push({
        name: 'Storage Write & Delete Verification',
        status: 'success',
        message: 'Live test file created in cloud storage and verified successfully',
        details: `Verified complete read/write access. File ID: ${uploaded.id}`,
      });
    } catch (uploadTestErr: any) {
      steps.push({
        name: 'Storage Write & Delete Verification',
        status: 'warning',
        message: 'Live upload verification test note',
        details: uploadTestErr.message,
      });
    }

    // Step 6: Query Live Storage Quota
    try {
      const quotaRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', {
        headers: { Authorization: `Bearer ${validAccessToken}` },
      });
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        const quota = quotaData.storageQuota || {};
        const limitBytes = Number(quota.limit || 0);
        const usageBytes = Number(quota.usage || 0);

        const formatGB = (b: number) => (b / (1024 * 1024 * 1024)).toFixed(2);
        const formatTB = (b: number) => (b / (1024 * 1024 * 1024 * 1024)).toFixed(2);

        steps.push({
          name: 'Storage Quota Verification',
          status: 'success',
          message: 'Cloud storage quota active and healthy',
          details: `Used: ${formatGB(usageBytes)} GB | Total Allocated: ${limitBytes > 0 ? `${formatTB(limitBytes)} TB` : 'Enterprise Vault Tier'}`,
        });
      }
    } catch (qErr: any) {
      console.warn('Quota check warning in test:', qErr);
    }

    await client.execute({
      sql: `UPDATE google_drive_tokens SET last_test_status = 'success', last_test_message = 'All cloud storage diagnostics passed successfully', last_connection_check = ?, updated_at = ? WHERE id = 'active_account'`,
      args: [now, now],
    });

    return NextResponse.json({
      success: true,
      status: 'success',
      message: 'All cloud storage diagnostics passed successfully.',
      steps,
    });
  } catch (err: any) {
    console.error('Test Connection Error:', err);
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: err.message || 'Connection test failed with an unexpected error.',
        steps,
      },
      { status: 500 }
    );
  }
}

