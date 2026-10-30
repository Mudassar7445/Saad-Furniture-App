import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { googleDriveService } from '@/lib/services/googleDrive';

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized: Super Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const host = request.headers.get('host') || 'saadfurniture-iota.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/storage/google/callback`;

  const authUrl = googleDriveService.getAuthUrl(redirectUri);

  return NextResponse.json({ authUrl, redirectUri });
}
