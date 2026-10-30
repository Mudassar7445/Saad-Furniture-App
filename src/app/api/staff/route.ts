import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db } from '@/lib/db';
import { users, auditLogs } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can manage staff.' }, { status: 403 });
  }

  const staffMembers = await db
    .select()
    .from(users)
    .where(eq(users.role, 'staff'))
    .orderBy(desc(users.createdAt));

  const parsedStaff = staffMembers.map((s) => {
    let perms: string[] = [];
    try {
      perms = s.permissions ? JSON.parse(s.permissions) : [];
    } catch {
      perms = [];
    }
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      permissions: perms,
      status: s.status,
      avatarUrl: s.avatarUrl,
      createdAt: s.createdAt,
    };
  });

  return NextResponse.json({ staff: parsedStaff });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can create staff accounts.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, password, permissions, avatarUrl } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();
    const staffId = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Validate permissions array against allowed modules:
    // 'orders', 'media', 'delivery', 'accounts', 'products'
    const validPermissions = Array.isArray(permissions)
      ? permissions.filter((p: string) =>
          ['orders', 'media', 'delivery', 'accounts', 'products'].includes(p)
        )
      : [];

    await db.insert(users).values({
      id: staffId,
      name,
      email: normalizedEmail,
      phone: phone || null,
      passwordHash,
      role: 'staff',
      permissions: JSON.stringify(validPermissions),
      status: 'active',
      avatarUrl:
        avatarUrl ||
        `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80`,
      address: 'Saad Operations Center',
      city: 'New York',
      firstBusinessDate: now.split('T')[0],
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'CREATE_STAFF',
      details: `Created staff member ${name} with permissions: [${validPermissions.join(', ')}]`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: staffId,
        name,
        email: normalizedEmail,
        permissions: validPermissions,
        status: 'active',
      },
    });
  } catch (error) {
    console.error('Create staff error:', error);
    return NextResponse.json({ error: 'Failed to create staff account.' }, { status: 500 });
  }
}

