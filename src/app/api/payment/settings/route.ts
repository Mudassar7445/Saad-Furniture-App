import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { paymentGatewaysConfig, auditLogs } from '@/lib/db/schema';
import { getSessionUser } from '@/lib/auth/jwt';
import { encryptText } from '@/lib/crypto';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'super_admin' && !sessionUser.permissions?.includes('accounts'))) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const configs = await db.select().from(paymentGatewaysConfig);
    const cardConfig = configs.find((c) => c.id === 'card_gateway');

    // Never send plain secret keys to frontend
    return NextResponse.json({
      success: true,
      cardGateway: {
        id: cardConfig?.id || 'card_gateway',
        provider: cardConfig?.provider || 'stripe',
        mode: cardConfig?.mode || 'sandbox',
        isEnabled: cardConfig ? Boolean(cardConfig.isEnabled) : true,
        publishableKey: cardConfig?.publishableKey || '',
        hasSecretKey: Boolean(cardConfig?.secretKeyEncrypted),
        hasWebhookSecret: Boolean(cardConfig?.webhookSecretEncrypted),
        merchantId: cardConfig?.merchantId || '',
        supportedCurrencies: cardConfig?.supportedCurrencies || '["PKR","USD"]',
        isConfigured: Boolean(cardConfig?.publishableKey && cardConfig?.secretKeyEncrypted),
      },
      paymentMethods: {
        card: cardConfig ? Boolean(cardConfig.isEnabled) : true,
        bankTransfer: true,
        jazzcash: true,
        cod: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch payment settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admin can update payment gateway configuration.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      provider = 'stripe',
      mode = 'sandbox',
      isEnabled = 1,
      publishableKey,
      secretKey,
      webhookSecret,
      merchantId,
      supportedCurrencies,
    } = body;

    const [existing] = await db
      .select()
      .from(paymentGatewaysConfig)
      .where(eq(paymentGatewaysConfig.id, 'card_gateway'))
      .limit(1);

    const now = new Date().toISOString();
    const updateData: Record<string, any> = {
      provider,
      mode,
      isEnabled: isEnabled ? 1 : 0,
      updatedAt: now,
      updatedBy: sessionUser.name,
    };

    if (publishableKey !== undefined) updateData.publishableKey = publishableKey.trim();
    if (merchantId !== undefined) updateData.merchantId = merchantId.trim();
    if (supportedCurrencies !== undefined) {
      updateData.supportedCurrencies = typeof supportedCurrencies === 'string'
        ? supportedCurrencies
        : JSON.stringify(supportedCurrencies);
    }

    // Encrypt secret key if newly provided
    if (secretKey && secretKey.trim()) {
      updateData.secretKeyEncrypted = encryptText(secretKey.trim());
    }

    // Encrypt webhook secret if newly provided
    if (webhookSecret && webhookSecret.trim()) {
      updateData.webhookSecretEncrypted = encryptText(webhookSecret.trim());
    }

    if (existing) {
      await db.update(paymentGatewaysConfig).set(updateData).where(eq(paymentGatewaysConfig.id, 'card_gateway'));
    } else {
      await db.insert(paymentGatewaysConfig).values({
        id: 'card_gateway',
        provider,
        mode,
        isEnabled: isEnabled ? 1 : 0,
        publishableKey: updateData.publishableKey || null,
        secretKeyEncrypted: updateData.secretKeyEncrypted || null,
        webhookSecretEncrypted: updateData.webhookSecretEncrypted || null,
        merchantId: updateData.merchantId || null,
        supportedCurrencies: updateData.supportedCurrencies || '["PKR","USD"]',
        settingsJson: '{}',
        updatedAt: now,
        updatedBy: sessionUser.name,
      });
    }

    await db.insert(auditLogs).values({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: sessionUser.id,
      userName: sessionUser.name,
      action: 'UPDATE_PAYMENT_GATEWAY',
      details: `Updated Card Payment Gateway settings (Provider: ${provider}, Mode: ${mode}, Enabled: ${Boolean(isEnabled)})`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment gateway configuration updated securely.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update payment settings' }, { status: 500 });
  }
}

