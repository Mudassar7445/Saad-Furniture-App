import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { userAppLock, users, auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

export async function GET() {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [record] = await db
      .select()
      .from(userAppLock)
      .where(eq(userAppLock.userId, sessionUser.id))
      .limit(1);

    if (!record) {
      return NextResponse.json({
        enabled: false,
        pinLength: 4,
        biometricEnabled: false,
        autoLockMinutes: 1,
        hasPinConfigured: false,
        isLockedOut: false,
      });
    }

    const now = Date.now();
    let isLockedOut = false;
    let lockoutRemainingSeconds = 0;

    if (record.lockedUntil) {
      const lockUntilTime = new Date(record.lockedUntil).getTime();
      if (lockUntilTime > now) {
        isLockedOut = true;
        lockoutRemainingSeconds = Math.ceil((lockUntilTime - now) / 1000);
      }
    }

    return NextResponse.json({
      enabled: Boolean(record.isEnabled),
      pinLength: record.pinLength || 4,
      biometricEnabled: Boolean(record.biometricEnabled),
      autoLockMinutes: record.autoLockMinutes ?? 1,
      hasPinConfigured: Boolean(record.pinHash),
      isLockedOut,
      lockoutRemainingSeconds,
    });
  } catch (error: any) {
    console.error('Error fetching app lock settings:', error);
    return NextResponse.json({ error: 'Failed to fetch app lock settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, pin, password } = body;
    const nowIso = new Date().toISOString();
    const nowTime = Date.now();

    // 1. VERIFY PIN
    if (action === 'verify_pin') {
      if (!pin) {
        return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
      }

      const [record] = await db
        .select()
        .from(userAppLock)
        .where(eq(userAppLock.userId, sessionUser.id))
        .limit(1);

      if (!record || !record.pinHash) {
        return NextResponse.json({ error: 'No PIN configured for this account' }, { status: 400 });
      }

      // Check if locked out
      if (record.lockedUntil) {
        const lockUntilTime = new Date(record.lockedUntil).getTime();
        if (lockUntilTime > nowTime) {
          const remaining = Math.ceil((lockUntilTime - nowTime) / 1000);
          return NextResponse.json(
            {
              error: `Too many incorrect attempts. Please wait ${remaining}s before trying again.`,
              isLockedOut: true,
              lockoutRemainingSeconds: remaining,
            },
            { status: 429 }
          );
        }
      }

      const isMatch = await bcrypt.compare(String(pin), record.pinHash);

      if (!isMatch) {
        const failedCount = (record.failedAttempts || 0) + 1;
        let lockedUntil = record.lockedUntil;

        if (failedCount >= MAX_FAILED_ATTEMPTS) {
          lockedUntil = new Date(nowTime + LOCKOUT_DURATION_MS).toISOString();
        }

        await db
          .update(userAppLock)
          .set({
            failedAttempts: failedCount,
            lockedUntil,
            updatedAt: nowIso,
          })
          .where(eq(userAppLock.id, record.id));

        const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - failedCount);

        return NextResponse.json({
          valid: false,
          error:
            failedCount >= MAX_FAILED_ATTEMPTS
              ? 'Too many incorrect attempts. App lock is paused for 60 seconds.'
              : `Incorrect PIN. ${attemptsLeft} attempt(s) remaining.`,
          remainingAttempts: attemptsLeft,
          isLockedOut: failedCount >= MAX_FAILED_ATTEMPTS,
          lockoutRemainingSeconds: failedCount >= MAX_FAILED_ATTEMPTS ? 60 : 0,
        });
      }

      // Success: reset failures
      await db
        .update(userAppLock)
        .set({
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: nowIso,
        })
        .where(eq(userAppLock.id, record.id));

      return NextResponse.json({ valid: true });
    }

    // 2. VERIFY PASSWORD (FALLBACK FOR FORGOT PIN OR SENSITIVE CHANGES)
    if (action === 'verify_password') {
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, sessionUser.id))
        .limit(1);

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ valid: false, error: 'Incorrect account password' }, { status: 400 });
      }

      // Reset any lockout
      await db
        .update(userAppLock)
        .set({
          failedAttempts: 0,
          lockedUntil: null,
          updatedAt: nowIso,
        })
        .where(eq(userAppLock.userId, sessionUser.id));

      return NextResponse.json({ valid: true });
    }

    // 3. SET OR UPDATE PIN
    if (action === 'set_pin') {
      const pinStr = String(pin || '');
      if (pinStr.length !== 4 && pinStr.length !== 6) {
        return NextResponse.json({ error: 'PIN must be exactly 4 or 6 digits' }, { status: 400 });
      }

      const pinHash = await bcrypt.hash(pinStr, 10);
      const [existing] = await db
        .select()
        .from(userAppLock)
        .where(eq(userAppLock.userId, sessionUser.id))
        .limit(1);

      if (existing) {
        await db
          .update(userAppLock)
          .set({
            pinHash,
            pinLength: pinStr.length,
            isEnabled: 1,
            failedAttempts: 0,
            lockedUntil: null,
            updatedAt: nowIso,
          })
          .where(eq(userAppLock.id, existing.id));
      } else {
        await db.insert(userAppLock).values({
          id: `lock_${sessionUser.id}`,
          userId: sessionUser.id,
          isEnabled: 1,
          pinHash,
          pinLength: pinStr.length,
          biometricEnabled: 0,
          autoLockMinutes: 1,
          failedAttempts: 0,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: 'UPDATE_APP_LOCK_PIN',
        details: `Updated ${pinStr.length}-digit App Lock PIN`,
        createdAt: nowIso,
      });

      return NextResponse.json({
        success: true,
        message: 'Security PIN configured successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling app lock operation:', error);
    return NextResponse.json({ error: error?.message || 'Operation failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isEnabled, autoLockMinutes, biometricEnabled, biometricCredentialId } = body;
    const nowIso = new Date().toISOString();

    const [existing] = await db
      .select()
      .from(userAppLock)
      .where(eq(userAppLock.userId, sessionUser.id))
      .limit(1);

    const updateFields: Record<string, any> = {
      updatedAt: nowIso,
    };

    if (isEnabled !== undefined) updateFields.isEnabled = isEnabled ? 1 : 0;
    if (autoLockMinutes !== undefined) updateFields.autoLockMinutes = Number(autoLockMinutes);
    if (biometricEnabled !== undefined) updateFields.biometricEnabled = biometricEnabled ? 1 : 0;
    if (biometricCredentialId !== undefined) updateFields.biometricCredentialId = biometricCredentialId;

    if (existing) {
      await db.update(userAppLock).set(updateFields).where(eq(userAppLock.id, existing.id));
    } else {
      await db.insert(userAppLock).values({
        id: `lock_${sessionUser.id}`,
        userId: sessionUser.id,
        isEnabled: isEnabled ? 1 : 0,
        pinLength: 4,
        biometricEnabled: biometricEnabled ? 1 : 0,
        biometricCredentialId: biometricCredentialId || null,
        autoLockMinutes: autoLockMinutes ? Number(autoLockMinutes) : 1,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'App lock preferences updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating app lock settings:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
