import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import {
  getGoogleOAuthUrl,
  resolveGoogleOAuthConfig,
  setIntendedGoogleEmail,
} from '@/lib/storage/google-drive';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get('email');
    const returnTo = searchParams.get('returnTo') || '/admin?tab=settings&subtab=cloud_storage';

    const origin = req.nextUrl.origin;
    const config = await resolveGoogleOAuthConfig();

    if (!config.clientId || !config.clientSecret) {
      return NextResponse.redirect(
        `${origin}${returnTo}&error=${encodeURIComponent(
          'Google OAuth credentials (Client ID and Secret) are missing. Please enter them in the Google Cloud Credentials card in Admin Settings.'
        )}`
      );
    }

    if (emailParam && emailParam.trim()) {
      await setIntendedGoogleEmail(emailParam.trim());
    }

    const state = crypto.randomUUID();
    const redirectUri = config.redirectUri || `${origin}/api/admin/google-drive/callback`;
    const authUrl = await getGoogleOAuthUrl(state, redirectUri, emailParam || undefined);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set('gdrive_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    response.cookies.set('gdrive_return_to', returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });

    return response;
  } catch (err: any) {
    console.error('Failed to initiate Google OAuth:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initiate Google authorization' },
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
    const emailParam = body.email;
    const origin = req.nextUrl.origin;
    const config = await resolveGoogleOAuthConfig();

    if (!config.clientId || !config.clientSecret) {
      return NextResponse.json(
        {
          error:
            'Google OAuth credentials are missing. Please configure Client ID and Secret in settings.',
        },
        { status: 400 }
      );
    }

    if (emailParam && emailParam.trim()) {
      await setIntendedGoogleEmail(emailParam.trim());
    }

    const state = crypto.randomUUID();
    const redirectUri = config.redirectUri || `${origin}/api/admin/google-drive/callback`;
    const authUrl = await getGoogleOAuthUrl(state, redirectUri, emailParam || undefined);

    const response = NextResponse.json({ success: true, authUrl });
    response.cookies.set('gdrive_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to generate OAuth URL' }, { status: 500 });
  }
}
