import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { db, initializeDatabase } from '@/lib/db';
import { shopSettings, auditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// In-memory cached settings to prevent excessive DB queries while invalidating on PUT
let cachedShopSettings: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache, invalidated immediately on update

export async function GET() {
  try {
    await initializeDatabase();

    const now = Date.now();
    if (cachedShopSettings && now - lastCacheTime < CACHE_TTL_MS) {
      return NextResponse.json({ settings: cachedShopSettings });
    }

    const [settingsRow] = await db
      .select()
      .from(shopSettings)
      .where(eq(shopSettings.id, 'default'))
      .limit(1);

    if (!settingsRow) {
      // Fallback defaults
      const fallback = {
        id: 'default',
        shopName: 'SAAD FURNITURE',
        displayName: 'Saad Furniture & Interior Studio',
        logoUrl: '/assets/branding/logo.svg',
        appIconUrl: '/assets/branding/app-dp.svg',
        splashLogoUrl: '/assets/branding/splash-logo.svg',
        description:
          'Premium handcrafted furniture atelier creating bespoke architectural woodcraft, royal bedroom suites, executive sofas, and master living room furniture built for generations.',
        tagline: 'Handcrafted Luxury Built For Generations',
        primaryPhone: '+92 300 0000000',
        secondaryPhone: '+92 321 0000000',
        whatsappNumber: '+92 300 0000000',
        officialEmail: 'info@saadfurniture.com',
        supportEmail: 'concierge@saadfurniture.com',
        completeAddress: 'Main Boulevard, Gulberg III / Defense Phase 6, Lahore, Pakistan',
        city: 'Lahore',
        socialLinks: JSON.stringify({
          facebook: { url: 'https://facebook.com/saadfurniture', enabled: true },
          instagram: { url: 'https://instagram.com/saadfurniture', enabled: true },
          tiktok: { url: 'https://tiktok.com/@saadfurniture', enabled: true },
          youtube: { url: 'https://youtube.com/@saadfurniture', enabled: true },
          whatsapp: { url: 'https://wa.me/923000000000', enabled: true },
          website: { url: 'https://saadfurniture-iota.vercel.app', enabled: true },
        }),
        openingHours: 'Mon - Sat: 10:00 AM - 10:00 PM | Sunday: 02:00 PM - 10:00 PM',
        currency: 'PKR',
        warrantyInformation:
          '10-Year Lifetime Structural Warranty on Seasoned Teak & Sheesham Timber with 5-Year High-Density Foam Assurance.',
        deliveryInformation:
          'White-Glove Nationwide Secure Transport with Protective Double-Corrugated Foam Packing and Complimentary In-Room Assembly in Lahore, Islamabad, & Karachi.',
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      };
      cachedShopSettings = fallback;
      lastCacheTime = now;
      return NextResponse.json({ settings: fallback });
    }

    cachedShopSettings = settingsRow;
    lastCacheTime = now;
    return NextResponse.json({ settings: settingsRow });
  } catch (error) {
    console.error('Failed to load shop settings:', error);
    return NextResponse.json({ error: 'Failed to retrieve shop settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();

    // 1. Strict Super Admin Check (Backend Security Enforcement)
    if (!sessionUser || sessionUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only Super Admin has permission to modify Shop Profile Settings & Branding.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      shopName,
      displayName,
      logoUrl,
      appIconUrl,
      splashLogoUrl,
      description,
      tagline,
      primaryPhone,
      secondaryPhone,
      whatsappNumber,
      officialEmail,
      supportEmail,
      completeAddress,
      city,
      socialLinks,
      openingHours,
      currency,
      warrantyInformation,
      deliveryInformation,
    } = body;

    if (!shopName || !shopName.trim()) {
      return NextResponse.json({ error: 'Shop Name is required.' }, { status: 400 });
    }

    const updatedData = {
      shopName: shopName.trim(),
      displayName: displayName?.trim() || shopName.trim(),
      logoUrl: logoUrl || '/assets/branding/logo.svg',
      appIconUrl: appIconUrl || '/assets/branding/app-dp.svg',
      splashLogoUrl: splashLogoUrl || '/assets/branding/splash-logo.svg',
      description: description || '',
      tagline: tagline || '',
      primaryPhone: primaryPhone || '',
      secondaryPhone: secondaryPhone || '',
      whatsappNumber: whatsappNumber || '',
      officialEmail: officialEmail || '',
      supportEmail: supportEmail || '',
      completeAddress: completeAddress || '',
      city: city || 'Lahore',
      socialLinks: typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks || {}),
      openingHours: openingHours || '',
      currency: currency || 'PKR',
      warrantyInformation: warrantyInformation || '',
      deliveryInformation: deliveryInformation || '',
      updatedAt: new Date().toISOString(),
      updatedBy: sessionUser.name || sessionUser.email || 'super_admin',
    };

    // Update in database
    await db
      .update(shopSettings)
      .set(updatedData)
      .where(eq(shopSettings.id, 'default'));

    // Invalidate local cache immediately
    cachedShopSettings = { id: 'default', ...updatedData };
    lastCacheTime = Date.now();

    // Record in Admin Activity Audit Log
    try {
      await db.insert(auditLogs).values({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: 'UPDATE_SHOP_PROFILE',
        details: `Super Admin updated shop identity, branding, and contact details for "${shopName.trim()}".`,
        ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Audit log write error:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Shop Profile Settings saved and applied across application successfully!',
      settings: cachedShopSettings,
    });
  } catch (error: any) {
    console.error('Update shop profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update shop settings' },
      { status: 500 }
    );
  }
}

