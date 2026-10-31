import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, resolveGoogleOAuthConfig } from '@/lib/storage/google-drive';
import { db, client } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const cookieState = req.cookies.get('gdrive_oauth_state')?.value;
  const returnTo = req.cookies.get('gdrive_return_to')?.value || '/admin?tab=settings&subtab=cloud_storage';

  const origin = url.origin;

  if (error) {
    const errorMsg = errorDescription || error;
    return NextResponse.redirect(
      `${origin}${returnTo}${returnTo.includes('?') ? '&' : '?'}error=${encodeURIComponent(`Google authorization error: ${errorMsg}`)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}${returnTo}${returnTo.includes('?') ? '&' : '?'}error=${encodeURIComponent('Authorization code was missing from Google response.')}`
    );
  }

  if (state && cookieState && state !== cookieState) {
    return NextResponse.redirect(
      `${origin}${returnTo}${returnTo.includes('?') ? '&' : '?'}error=${encodeURIComponent(
        'OAuth state verification mismatch (CSRF protection). Please start the connection process again.'
      )}`
    );
  }

  try {
    const config = await resolveGoogleOAuthConfig();
    const redirectUri = config.redirectUri || `${origin}/api/admin/google-drive/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Sync legacy cloudStorageConnections table if exists
    try {
      const now = new Date().toISOString();
      await client.execute({
        sql: `INSERT OR REPLACE INTO cloud_storage_connections 
              (id, provider, is_connected, account_email, account_name, total_storage_bytes, used_storage_bytes, root_folder_id, updated_at)
              VALUES ('google_drive', 'google_drive', 1, ?, ?, 5497558138880, 0, ?, ?)`,
        args: [tokens.accountEmail, tokens.accountName || 'Saad Furniture Vault', tokens.rootFolderId || 'root', now],
      });
    } catch (syncErr) {
      console.warn('Sync cloud_storage_connections warning:', syncErr);
    }

    const sessionUser = await getSessionUser();
    if (sessionUser) {
      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: 'GOOGLE_DRIVE_CONNECTED',
        details: `Connected Google Drive storage account: ${tokens.accountEmail}`,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: new Date().toISOString(),
      });
    }

    const response = NextResponse.redirect(
      `${origin}${returnTo}${returnTo.includes('?') ? '&' : '?'}success=${encodeURIComponent(
        `Successfully connected Google Drive 5TB Account (${tokens.accountEmail})! Dedicated SAAD FURNITURE MASTER folder is ready.`
      )}`
    );

    response.cookies.delete('gdrive_oauth_state');
    response.cookies.delete('gdrive_return_to');
    return response;
  } catch (err: any) {
    console.error('Google OAuth Callback Error:', err);
    return NextResponse.redirect(
      `${origin}${returnTo}${returnTo.includes('?') ? '&' : '?'}error=${encodeURIComponent(
        err.message || 'Failed to exchange authorization tokens with Google'
      )}`
    );
  }
}

