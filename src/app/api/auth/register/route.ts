import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { users, customerLedger, notificationPreferences, auditLogs } from '@/lib/db/schema';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
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
    const cleanPhone = phone?.trim() || null;
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const now = new Date().toISOString();

    // Check if account already exists by email
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    let existingCustomer = existingByEmail.length > 0 ? existingByEmail[0] : null;

    // If not found by email, check if an admin-created customer has this phone number
    if (!existingCustomer && cleanPhone) {
      const existingByPhone = await db
        .select()
        .from(users)
        .where(eq(users.phone, cleanPhone))
        .limit(1);
      if (existingByPhone.length > 0 && existingByPhone[0].role === 'customer') {
        existingCustomer = existingByPhone[0];
      }
    }

    let finalUserId: string;
    let finalUserName = name.trim();

    if (existingCustomer) {
      // Disallow claiming admin or staff accounts
      if (existingCustomer.role !== 'customer') {
        return NextResponse.json(
          { error: 'This email is reserved for staff access. Please sign in instead.' },
          { status: 400 }
        );
      }

      // Safe linking: customer was previously created by admin or pre-registered
      finalUserId = existingCustomer.id;
      finalUserName = name.trim() || existingCustomer.name;

      await db
        .update(users)
        .set({
          name: finalUserName,
          email: normalizedEmail,
          phone: cleanPhone || existingCustomer.phone,
          city: city?.trim() || existingCustomer.city,
          address: address?.trim() || existingCustomer.address,
          passwordHash,
          status: 'active',
          updatedAt: now,
        })
        .where(eq(users.id, existingCustomer.id));
    } else {
      // Create fresh customer account
      finalUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await db.insert(users).values({
        id: finalUserId,
        name: finalUserName,
        email: normalizedEmail,
        phone: cleanPhone,
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
          id: `pref_${finalUserId}`,
          userId: finalUserId,
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
          id: `led_${finalUserId}`,
          customerId: finalUserId,
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
    }

    // Audit log
    try {
      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: finalUserId,
        userName: finalUserName,
        action: existingCustomer ? 'LINK_ACCOUNT' : 'SIGN_UP',
        details: `Customer registered/linked with email: ${normalizedEmail}`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: now,
      });
    } catch (auditErr) {
      console.warn('Audit log write skipped:', auditErr);
    }

    // Create session token
    const token = await signToken({
      id: finalUserId,
      name: finalUserName,
      email: normalizedEmail,
      role: 'customer',
      permissions: [],
      status: 'active',
    });

    const response = NextResponse.json({
      success: true,
      message: existingCustomer
        ? 'Account successfully linked! Welcome back to Saad Furniture.'
        : 'Account created successfully! Welcome to Saad Furniture.',
      user: {
        id: finalUserId,
        name: finalUserName,
        email: normalizedEmail,
        role: 'customer',
        permissions: [],
      },
      redirectUrl: null, // Keep customer inside the app without full page redirect
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
    const detail = error?.cause?.message || error?.message || 'Failed to create account. Please try again.';
    return NextResponse.json(
      { error: detail },
      { status: 500 }
    );
  }
}

