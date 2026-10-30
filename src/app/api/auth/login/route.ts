import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { users, auditLogs } from '@/lib/db/schema';
import { seedDatabase } from '@/lib/db/seed';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    await seedDatabase();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = foundUsers[0];

    // Check account status
    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact Saad Furniture administration.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    let parsedPermissions: string[] = [];
    try {
      parsedPermissions = user.permissions ? JSON.parse(user.permissions) : [];
    } catch {
      parsedPermissions = [];
    }

    // Sign JWT
    const token = await signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'super_admin' | 'staff' | 'customer',
      permissions: parsedPermissions,
      status: user.status,
    });

    // Record audit log
    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      userName: user.name,
      action: 'LOGIN',
      details: `User logged in with role [${user.role}].`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    // Determine redirect destination
    let redirectUrl = '/portal';
    if (user.role === 'super_admin') {
      redirectUrl = '/admin';
    } else if (user.role === 'staff') {
      redirectUrl = '/staff';
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: parsedPermissions,
        avatarUrl: user.avatarUrl,
      },
      redirectUrl,
    });

    // Set cookie
    response.cookies.set('saad_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred.' },
      { status: 500 }
    );
  }
}

