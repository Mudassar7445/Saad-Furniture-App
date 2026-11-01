import { NextRequest } from 'next/server';
import { GET as streamVideo } from '@/app/api/workshop/videos/[id]/stream/route';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return streamVideo(request, context);
}
