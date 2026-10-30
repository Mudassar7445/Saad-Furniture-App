import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { users, customerLedger, notificationPreferences, auditLogs } from '@/lib/db/schema';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    if (!process.env.TURSO_DATABASE_URL && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error:
            'Turso Cloud Database credentials (TURSO_DATABASE_URL) are not configured in Vercel Environment Variables. Please add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel Project Settings and click Redeploy.',
        },
        { status: 500 }
      );
    }

    await initializeDatabase();

    const body = await request.json();
    const { name, email, password, phone, city, address } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Insert new customer account
    await db.insert(users).values({
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || null,
      passwordHash,
      role: 'customer',
      permissions: '[]',
      status: 'active',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop`,
      address: address?.trim() || null,
      city: city?.trim() || null,
      firstBusinessDate: now.split('T')[0],
      marketingOptIn: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Initialize notification preferences
    try {
      await db.insert(notificationPreferences).values({
        id: `pref_${userId}`,
        userId: userId,
        emailNotifications: 1,
        smsNotifications: 1,
        pushNotifications: 1,
        marketingOptIn: 1,
        updatedAt: now,
      });
    } catch (prefErr) {
      console.warn('Failed to insert default notification preferences:', prefErr);
    }

    // Initialize customer financial ledger record
    try {
      await db.insert(customerLedger).values({
        id: `led_${userId}`,
        customerId: userId,
        orderId: null,
        entryType: 'adjustment',
        amount: 0,
        balanceAfter: 0,
        description: 'New Patron Account Welcome Registration',
        paymentMethod: null,
        reference: 'INITIAL_REGISTRATION',
        recordedBy: 'system',
        isReversed: 0,
        reversalReason: null,
        createdAt: now,
      });
    } catch (ledErr) {
      console.warn('Failed to insert initial ledger:', ledErr);
    }

    // Audit log
    try {
      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: userId,
        userName: name.trim(),
        action: 'SIGN_UP',
        details: `Customer self-registered with email: ${normalizedEmail}`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: now,
      });
    } catch (auditErr) {
      console.warn('Audit log write skipped:', auditErr);
    }

    // Create session token
    const token = await signToken({
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      role: 'customer',
      permissions: [],
      status: 'active',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome to Saad Furniture.',
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: 'customer',
        permissions: [],
      },
      redirectUrl: '/portal',
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
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
