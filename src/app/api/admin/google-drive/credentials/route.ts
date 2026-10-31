import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { resolveGoogleOAuthConfig, saveGoogleOAuthCredentials } from '@/lib/storage/google-drive';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 });
    }

    const config = await resolveGoogleOAuthConfig();

    return NextResponse.json({
      configured: Boolean(config.clientId && config.clientSecret),
      clientId: config.clientId ? `${config.clientId.slice(0, 10)}...${config.clientId.slice(-12)}` : '',
      fullClientId: config.clientId || '',
      redirectUri: config.redirectUri,
      source: config.source,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to load OAuth credentials' },
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

    const body = await req.json();
    const { clientId, clientSecret, redirectUri } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Both Client ID and Client Secret are required.' },
        { status: 400 }
      );
    }

    await saveGoogleOAuthCredentials(clientId, clientSecret, redirectUri);

    return NextResponse.json({
      success: true,
      message: 'Google OAuth credentials saved securely in database vault with AES-256-GCM encryption.',
    });
  } catch (err: any) {
    console.error('Save credentials error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save credentials' },
      { status: 500 }
    );
  }
}
