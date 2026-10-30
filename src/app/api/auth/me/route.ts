import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';
import { eq } from 'drizzle-orm';

export async function GET() {
  await initializeDatabase();
  await seedDatabase();

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (!dbUser || dbUser.status === 'suspended') {
    return NextResponse.json({ user: null, suspended: true }, { status: 403 });
  }

  let permissions: string[] = [];
  try {
    permissions = dbUser.permissions ? JSON.parse(dbUser.permissions) : [];
  } catch {
    permissions = [];
  }

  return NextResponse.json({
    user: {
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
    },
  });
}

