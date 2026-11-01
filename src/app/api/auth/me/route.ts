import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// In-memory user profile cache (60s TTL) to prevent repeated database hits on hot navigations
interface CachedUser {
  data: any;
  cachedAt: number;
}
const userProfileCache = new Map<string, CachedUser>();
const CACHE_TTL_MS = 60 * 1000;

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ user: null }, { 
      status: 401,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }

  // Check in-memory cache
  const cached = userProfileCache.get(sessionUser.id);
  const now = Date.now();
  if (cached && (now - cached.cachedAt) < CACHE_TTL_MS) {
    return NextResponse.json(
      { user: cached.data },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
          'X-Auth-Cache': 'HIT',
        },
      }
    );
  }

  await initializeDatabase();

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (!dbUser || dbUser.status === 'suspended') {
    userProfileCache.delete(sessionUser.id);
    return NextResponse.json({ user: null, suspended: true }, { status: 403 });
  }

  let permissions: string[] = [];
  try {
    permissions = dbUser.permissions ? JSON.parse(dbUser.permissions) : [];
  } catch {
    permissions = [];
  }

  const userPayload = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    phone: dbUser.phone,
    role: dbUser.role,
    permissions,
    status: dbUser.status,
    avatarUrl: dbUser.avatarUrl,
    address: dbUser.address,
    city: dbUser.city,
    firstBusinessDate: dbUser.firstBusinessDate,
    createdAt: dbUser.createdAt,
  };

  userProfileCache.set(sessionUser.id, {
    data: userPayload,
    cachedAt: now,
  });

  return NextResponse.json(
    { user: userPayload },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        'X-Auth-Cache': 'MISS',
      },
    }
  );
}

