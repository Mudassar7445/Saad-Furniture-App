import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL('/api/admin/google-drive/callback', req.url);
  req.nextUrl.searchParams.forEach((val, key) => url.searchParams.set(key, val));
  return NextResponse.redirect(url);
}
