import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { settings, shopSettings, auditLogs } from '@/lib/db/schema';
import { googleDriveService } from '@/lib/services/googleDrive';
import { fcmService } from '@/lib/services/fcm';
import { eq } from 'drizzle-orm';

export async function GET() {
  await initializeDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const [currentSettings] = await db.select().from(settings).where(eq(settings.id, 'system_settings')).limit(1);

  const driveStatus = googleDriveService.getStatus();
  const fcmStatus = fcmService.getStatus();

  return NextResponse.json({
    settings: currentSettings || {},
    integrations: {
      googleDrive: driveStatus,
      fcm: fcmStatus,
    },
  });
}

export async function PUT(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Protected Area: Only Super Admin can modify system settings.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      companyName,
      currencySymbol,
      showroomAddress,
      supportPhone,
      supportEmail,
      websiteAnnouncementBanner,
      googleDriveFolderId,
      googleDriveServiceAccountEmail,
    } = body;

    await db
      .update(settings)
      .set({
        companyName: companyName ?? undefined,
        currencySymbol: currencySymbol ?? undefined,
        showroomAddress: showroomAddress ?? undefined,
        supportPhone: supportPhone ?? undefined,
        supportEmail: supportEmail ?? undefined,
        websiteAnnouncementBanner: websiteAnnouncementBanner ?? undefined,
        googleDriveFolderId: googleDriveFolderId ?? undefined,
        googleDriveServiceAccountEmail: googleDriveServiceAccountEmail ?? undefined,
      })
      .where(eq(settings.id, 'system_settings'));

    // Synchronize into shopSettings so customer frontend reflects showroom numbers immediately
    try {
      await db
        .update(shopSettings)
        .set({
          shopName: companyName ?? undefined,
          completeAddress: showroomAddress ?? undefined,
          primaryPhone: supportPhone ?? undefined,
          supportEmail: supportEmail ?? undefined,
          updatedAt: new Date().toISOString(),
          updatedBy: sessionUser.name,
        })
        .where(eq(shopSettings.id, 'default'));
    } catch (syncErr) {
      console.warn('Sync to shopSettings note:', syncErr);
    }

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'UPDATE_SYSTEM_SETTINGS',
      details: 'Super Admin updated global company branding & cloud storage credentials.',
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Settings saved successfully.' });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}

