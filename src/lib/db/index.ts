import { createClient } from '@libsql/client/http';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Turso Cloud Database Credentials (Provided directly by Owner)
const DEFAULT_TURSO_URL = 'https://saad-furniture-mudassar7445.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMzNzk1OTIsImlkIjoiMDFhMThkYmEtZWMwMS03OTE5LTk2ZTktYmI0OTBiNDNjY2U3Iiwia2lkIjoiZG5HdHlvcVQtUTVCenVnLU95eHhmU3JHZ0E2LXhqOUUzc0I2Y0JmMUxJZyIsInJpZCI6IjA4NTM0ZDJkLTJmYmYtNDIxZC05OTRjLTJiOGM4ZDM5ZWJmZiJ9.dLmD0n5QMyGMtcAEnzEg84qcvwTICFxJizc6mo2FxRdMcljIAv8ynVD2LF2vi4KfSYwQ1aO3IhP3g_9QbT7vDA';

// Robust URL normalization: cleans quotes, spaces, and enforces https:// for serverless
let rawUrl = (process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || DEFAULT_TURSO_URL).trim();
rawUrl = rawUrl.replace(/^['"]|['"]$/g, '');
if (rawUrl.startsWith('libsql://')) {
  rawUrl = rawUrl.replace('libsql://', 'https://');
}
if (!rawUrl.startsWith('https://') && !rawUrl.startsWith('http://') && !rawUrl.startsWith('file:')) {
  rawUrl = 'https://' + rawUrl;
}

// Clean and sanitize auth token
let rawToken = (process.env.TURSO_AUTH_TOKEN || DEFAULT_TURSO_TOKEN).trim();
rawToken = rawToken.replace(/^['"]|['"]$/g, '');

// Auto-repair token if 'ey' prefix was accidentally omitted when copy-pasting into Vercel
if (!rawToken.startsWith('ey') && rawToken.startsWith('JhbGci')) {
  rawToken = 'ey' + rawToken;
}
if (!rawToken || !rawToken.startsWith('ey')) {
  rawToken = DEFAULT_TURSO_TOKEN;
}

export const client = createClient({
  url: rawUrl,
  authToken: rawToken,
});

export const db = drizzle(client, { schema });

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initializes all database tables for Saad Furniture ecosystem.
 * Works seamlessly with Turso Cloud or local embedded LibSQL.
 */
export async function initializeDatabase() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Ultra-fast path: If tables already exist in Turso Cloud, skip heavy multi-query DDL
    try {
      const fastCheck = await client.execute('SELECT 1 FROM users LIMIT 1').catch(() => null);
      if (fastCheck) {
        // Ensure user_app_lock table exists
        await client.execute(`
          CREATE TABLE IF NOT EXISTS user_app_lock (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            is_enabled INTEGER NOT NULL DEFAULT 0,
            pin_hash TEXT,
            pin_salt TEXT,
            pin_length INTEGER NOT NULL DEFAULT 4,
            biometric_enabled INTEGER NOT NULL DEFAULT 0,
            biometric_credential_id TEXT,
            auto_lock_minutes REAL NOT NULL DEFAULT 1,
            failed_attempts INTEGER NOT NULL DEFAULT 0,
            locked_until TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `).catch(() => null);
        isInitialized = true;
        return;
      }
    } catch {}

    try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        permissions TEXT DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'active',
        avatar_url TEXT,
        address TEXT,
        city TEXT,
        first_business_date TEXT,
        marketing_opt_in INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Safe column migrations for users
    const userAlters = [
      "ALTER TABLE users ADD COLUMN avatar_url TEXT",
      "ALTER TABLE users ADD COLUMN address TEXT",
      "ALTER TABLE users ADD COLUMN city TEXT",
      "ALTER TABLE users ADD COLUMN first_business_date TEXT",
      "ALTER TABLE users ADD COLUMN marketing_opt_in INTEGER DEFAULT 1"
    ];
    for (const alt of userAlters) {
      try {
        await client.execute(alt);
      } catch {}
    }

    await client.execute(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        price_on_request INTEGER NOT NULL DEFAULT 0,
        discount_price REAL,
        material TEXT NOT NULL,
        dimensions TEXT NOT NULL,
        available_colours TEXT DEFAULT '[]',
        available_designs TEXT DEFAULT '[]',
        stock_quantity INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'available',
        showroom_location TEXT,
        featured INTEGER NOT NULL DEFAULT 0,
        images TEXT NOT NULL DEFAULT '[]',
        specs TEXT DEFAULT '{}',
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL UNIQUE,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_email TEXT,
        delivery_address TEXT,
        product_name TEXT NOT NULL DEFAULT 'Bespoke Furniture Commission',
        product_category TEXT NOT NULL DEFAULT 'Living Room',
        product_description TEXT,
        custom_design_details TEXT,
        dimensions TEXT,
        fabric_info TEXT,
        colour_info TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_amount REAL NOT NULL,
        paid_amount REAL NOT NULL DEFAULT 0,
        remaining_balance REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        expected_completion_date TEXT,
        actual_delivery_date TEXT,
        assigned_staff_id TEXT,
        assigned_staff_name TEXT,
        order_status TEXT NOT NULL DEFAULT 'in_production',
        custom_status TEXT,
        is_delayed INTEGER NOT NULL DEFAULT 0,
        delay_reason TEXT,
        production_stage TEXT NOT NULL DEFAULT 'order_confirmed',
        production_progress INTEGER NOT NULL DEFAULT 10,
        custom_stages TEXT DEFAULT '[]',
        delivery_status TEXT NOT NULL DEFAULT 'pending',
        estimated_delivery_date TEXT,
        delivery_driver_name TEXT,
        delivery_driver_phone TEXT,
        special_instructions TEXT,
        custom_specifications TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES users(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT,
        product_title TEXT NOT NULL,
        custom_details TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS media_files (
        id TEXT PRIMARY KEY,
        folder_id TEXT,
        order_id TEXT,
        customer_id TEXT,
        product_id TEXT,
        product_category TEXT,
        google_drive_file_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        original_name TEXT,
        mime_type TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        media_type TEXT NOT NULL DEFAULT 'photo',
        category TEXT NOT NULL DEFAULT 'general',
        title TEXT DEFAULT '',
        description TEXT,
        stage TEXT DEFAULT 'final_inspection',
        thumbnail_url TEXT,
        video_duration REAL,
        page_count INTEGER,
        web_view_link TEXT,
        web_content_link TEXT,
        visibility TEXT NOT NULL DEFAULT 'public',
        is_published INTEGER NOT NULL DEFAULT 1,
        download_allowed INTEGER NOT NULL DEFAULT 1,
        is_public INTEGER NOT NULL DEFAULT 1,
        uploaded_by TEXT DEFAULT 'system',
        uploaded_at TEXT NOT NULL,
        updated_at TEXT DEFAULT '',
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Safe column migrations for media_files
    const mediaAlters = [
      "ALTER TABLE media_files ADD COLUMN folder_id TEXT",
      "ALTER TABLE media_files ADD COLUMN product_id TEXT",
      "ALTER TABLE media_files ADD COLUMN product_category TEXT",
      "ALTER TABLE media_files ADD COLUMN original_name TEXT",
      "ALTER TABLE media_files ADD COLUMN category TEXT DEFAULT 'general'",
      "ALTER TABLE media_files ADD COLUMN visibility TEXT DEFAULT 'public'",
      "ALTER TABLE media_files ADD COLUMN is_published INTEGER DEFAULT 1",
      "ALTER TABLE media_files ADD COLUMN download_allowed INTEGER DEFAULT 1",
      "ALTER TABLE media_files ADD COLUMN page_count INTEGER",
      "ALTER TABLE media_files ADD COLUMN updated_at TEXT"
    ];
    for (const alt of mediaAlters) {
      try {
        await client.execute(alt);
      } catch {}
    }

    // Performance Sanitization: Prevent large video base64 strings from polluting media_files thumbnail_url
    try {
      await client.execute(`
        UPDATE media_files 
        SET thumbnail_url = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' 
        WHERE (media_type = 'video' OR mime_type LIKE 'video%') 
          AND (thumbnail_url LIKE 'data:video%' OR thumbnail_url LIKE '%/stream%' OR thumbnail_url LIKE '%.mp4');
      `);
    } catch {}

    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN received_by TEXT DEFAULT 'Saad Finance Bureau';`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN is_reversed INTEGER DEFAULT 0;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN reversal_reason TEXT;`);
    } catch {}

    // Multi-Item Orders & Products Migrations
    const newAlters = [
      "ALTER TABLE orders ADD COLUMN subtotal REAL",
      "ALTER TABLE orders ADD COLUMN discount REAL NOT NULL DEFAULT 0",
      "ALTER TABLE orders ADD COLUMN delivery_charges REAL NOT NULL DEFAULT 0",
      "ALTER TABLE order_items ADD COLUMN sku_snapshot TEXT",
      "ALTER TABLE order_items ADD COLUMN unit TEXT NOT NULL DEFAULT 'pcs'",
      "ALTER TABLE order_items ADD COLUMN discount REAL NOT NULL DEFAULT 0",
      "ALTER TABLE order_items ADD COLUMN line_total REAL",
      "ALTER TABLE order_items ADD COLUMN specifications TEXT",
      "ALTER TABLE order_items ADD COLUMN customization_details TEXT",
      "ALTER TABLE order_items ADD COLUMN created_at TEXT",
      "ALTER TABLE products ADD COLUMN featured_image TEXT",
      "ALTER TABLE products ADD COLUMN videos TEXT DEFAULT '[]'",
      "ALTER TABLE products ADD COLUMN documents TEXT DEFAULT '[]'",
      "ALTER TABLE products ADD COLUMN warranty_details TEXT",
      "ALTER TABLE products ADD COLUMN is_published INTEGER NOT NULL DEFAULT 1"
    ];

    for (const alt of newAlters) {
      try {
        await client.execute(alt);
      } catch {}
    }

    await client.execute(`
      CREATE TABLE IF NOT EXISTS delivery_records (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        customer_contact_number TEXT NOT NULL,
        expected_delivery_date TEXT,
        delivery_time_window TEXT,
        delivery_charges REAL NOT NULL DEFAULT 0,
        assigned_delivery_staff TEXT,
        assigned_delivery_staff_phone TEXT,
        delivery_notes TEXT,
        delivery_stage TEXT NOT NULL DEFAULT 'preparing_for_dispatch',
        dispatch_date TEXT,
        delivered_date TEXT,
        delivery_photographs TEXT DEFAULT '[]',
        delivery_confirmation_signature TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES users(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS delivery_status_history (
        id TEXT PRIMARY KEY,
        delivery_record_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        notes TEXT,
        updated_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        payment_number TEXT NOT NULL UNIQUE,
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
        payment_type TEXT NOT NULL DEFAULT 'Initial Deposit',
        transaction_reference TEXT,
        receipt_url TEXT,
        notes TEXT,
        received_by TEXT NOT NULL,
        is_reversed INTEGER NOT NULL DEFAULT 0,
        reversal_reason TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES users(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS customer_ledger (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        order_id TEXT,
        entry_type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_after REAL NOT NULL,
        description TEXT NOT NULL,
        payment_method TEXT,
        reference TEXT,
        recorded_by TEXT NOT NULL,
        is_reversed INTEGER NOT NULL DEFAULT 0,
        reversal_reason TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES users(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_timeline_events (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        stage TEXT NOT NULL,
        event_type TEXT NOT NULL DEFAULT 'production',
        performed_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'order_update',
        related_order_id TEXT,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        email_notifications INTEGER NOT NULL DEFAULT 1,
        sms_notifications INTEGER NOT NULL DEFAULT 1,
        push_notifications INTEGER NOT NULL DEFAULT 1,
        marketing_opt_in INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        fcm_token TEXT,
        subscription_json TEXT,
        endpoint TEXT,
        p256dh TEXT,
        auth TEXT,
        device_type TEXT NOT NULL DEFAULT 'android',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    try { await client.execute(`ALTER TABLE push_subscriptions ADD COLUMN subscription_json TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE push_subscriptions ADD COLUMN endpoint TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE push_subscriptions ADD COLUMN p256dh TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE push_subscriptions ADD COLUMN auth TEXT;`); } catch {}

    await client.execute(`
      CREATE TABLE IF NOT EXISTS communication_logs (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT,
        message_body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sent',
        error_message TEXT,
        related_order_id TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        sent_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES users(id)
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS product_inquiries (
        id TEXT PRIMARY KEY,
        product_id TEXT,
        product_title TEXT NOT NULL,
        customer_id TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_email TEXT,
        inquiry_type TEXT NOT NULL DEFAULT 'quotation',
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        ip_address TEXT,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL DEFAULT 'Saad Furniture',
        currency_symbol TEXT NOT NULL DEFAULT '$',
        google_drive_folder_id TEXT,
        google_drive_service_account_email TEXT,
        google_drive_key_configured INTEGER NOT NULL DEFAULT 0,
        fcm_server_key_configured INTEGER NOT NULL DEFAULT 0,
        email_provider TEXT DEFAULT 'smtp',
        sms_provider TEXT DEFAULT 'twilio',
        showroom_address TEXT DEFAULT 'Saad Luxury Showroom, Boulevard Prestige, Suite 400',
        support_phone TEXT DEFAULT '+1 (800) 555-SAAD',
        support_email TEXT DEFAULT 'concierge@saadfurniture.com',
        website_announcement_banner TEXT DEFAULT 'Welcome to Saad Furniture – Handcrafted Luxury for Discerning Spaces.'
      );
    `);

    // Safe column migrations for orders table
    try { await client.execute(`ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'showroom';`); } catch {}
    try { await client.execute(`ALTER TABLE orders ADD COLUMN payment_method TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid';`); } catch {}
    try { await client.execute(`ALTER TABLE orders ADD COLUMN payment_transaction_id TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE orders ADD COLUMN bank_receipt_url TEXT;`); } catch {}

    // E-Commerce Tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS shopping_carts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        session_token TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        cart_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        selected_colour TEXT,
        selected_design TEXT,
        custom_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT 'Home',
        recipient_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        area TEXT,
        postal_code TEXT,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        userId TEXT NOT NULL,
        gateway TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'initiated',
        gateway_transaction_ref TEXT,
        gateway_response TEXT,
        created_at TEXT NOT NULL,
        verified_at TEXT
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS bank_transfer_receipts (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        bank_name TEXT NOT NULL,
        sender_account_title TEXT NOT NULL,
        sender_account_number TEXT,
        transaction_reference TEXT NOT NULL,
        amount_paid REAL NOT NULL,
        receipt_image_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        review_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL DEFAULT 'percentage',
        discount_value REAL NOT NULL,
        min_order_amount REAL NOT NULL DEFAULT 0,
        max_discount_amount REAL,
        valid_until TEXT,
        usage_limit INTEGER NOT NULL DEFAULT 100,
        used_count INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Shop Profile Settings Table (Section 4)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS shop_settings (
        id TEXT PRIMARY KEY,
        shop_name TEXT NOT NULL DEFAULT 'SAAD FURNITURE',
        display_name TEXT NOT NULL DEFAULT 'Saad Furniture & Interior Studio',
        logo_url TEXT DEFAULT '/assets/branding/logo.svg',
        app_icon_url TEXT DEFAULT '/assets/branding/app-dp.svg',
        splash_logo_url TEXT DEFAULT '/assets/branding/splash-logo.svg',
        description TEXT DEFAULT 'Premium handcrafted furniture atelier creating bespoke architectural woodcraft, royal bedroom suites, executive sofas, and master living room furniture built for generations.',
        tagline TEXT DEFAULT 'Handcrafted Luxury Built For Generations',
        primary_phone TEXT DEFAULT '+92 300 0000000',
        secondary_phone TEXT DEFAULT '+92 321 0000000',
        whatsapp_number TEXT DEFAULT '+92 300 0000000',
        official_email TEXT DEFAULT 'info@saadfurniture.com',
        support_email TEXT DEFAULT 'concierge@saadfurniture.com',
        complete_address TEXT DEFAULT 'Main Boulevard, Gulberg III / Defense Phase 6, Lahore, Pakistan',
        city TEXT DEFAULT 'Lahore',
        social_links TEXT,
        opening_hours TEXT DEFAULT 'Mon - Sat: 10:00 AM - 10:00 PM | Sunday: 02:00 PM - 10:00 PM',
        currency TEXT NOT NULL DEFAULT 'PKR',
        warranty_information TEXT DEFAULT '10-Year Lifetime Structural Warranty on Seasoned Teak & Sheesham Timber with 5-Year High-Density Foam Assurance.',
        delivery_information TEXT DEFAULT 'White-Glove Nationwide Secure Transport with Protective Double-Corrugated Foam Packing and Complimentary In-Room Assembly in Lahore, Islamabad, & Karachi.',
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL DEFAULT 'super_admin'
      );
    `);

    // Ensure default shop profile exists
    try {
      const existing = await client.execute(`SELECT id FROM shop_settings WHERE id = 'default' LIMIT 1;`);
      if (existing.rows.length === 0) {
        const defaultSocial = JSON.stringify({
          facebook: { url: 'https://facebook.com/saadfurniture', enabled: true },
          instagram: { url: 'https://instagram.com/saadfurniture', enabled: true },
          tiktok: { url: 'https://tiktok.com/@saadfurniture', enabled: true },
          youtube: { url: 'https://youtube.com/@saadfurniture', enabled: true },
          whatsapp: { url: 'https://wa.me/923000000000', enabled: true },
          website: { url: 'https://saadfurniture-iota.vercel.app', enabled: true }
        });

        await client.execute({
          sql: `
            INSERT INTO shop_settings (
              id, shop_name, display_name, logo_url, app_icon_url, splash_logo_url,
              description, tagline, primary_phone, secondary_phone, whatsapp_number,
              official_email, support_email, complete_address, city, social_links,
              opening_hours, currency, warranty_information, delivery_information,
              updated_at, updated_by
            ) VALUES (
              'default', 'SAAD FURNITURE', 'Saad Furniture & Interior Studio',
              '/assets/branding/logo.svg', '/assets/branding/app-dp.svg', '/assets/branding/splash-logo.svg',
              'Premium handcrafted furniture atelier creating bespoke architectural woodcraft, royal bedroom suites, executive sofas, and master living room furniture built for generations.',
              'Handcrafted Luxury Built For Generations', '+92 300 0000000', '+92 321 0000000', '+92 300 0000000',
              'info@saadfurniture.com', 'concierge@saadfurniture.com',
              'Main Boulevard, Gulberg III / Defense Phase 6, Lahore, Pakistan', 'Lahore',
              ?, 'Mon - Sat: 10:00 AM - 10:00 PM | Sunday: 02:00 PM - 10:00 PM', 'PKR',
              '10-Year Lifetime Structural Warranty on Seasoned Teak & Sheesham Timber with 5-Year High-Density Foam Assurance.',
              'White-Glove Nationwide Secure Transport with Protective Double-Corrugated Foam Packing and Complimentary In-Room Assembly in Lahore, Islamabad, & Karachi.',
              ?, 'super_admin'
            );
          `,
          args: [defaultSocial, new Date().toISOString()]
        });
      }
    } catch (e) {
      console.warn('Default shop settings seed note:', e);
    }

    // --- Google Drive 5TB Cloud Storage & Media Library Tables ---
    await client.execute(`
      CREATE TABLE IF NOT EXISTS cloud_storage_connections (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL DEFAULT 'google_drive',
        account_email TEXT,
        account_name TEXT,
        connected_at TEXT,
        refresh_token TEXT,
        access_token TEXT,
        token_expires_at TEXT,
        scope TEXT,
        root_folder_id TEXT,
        root_folder_name TEXT DEFAULT 'Saad Furniture Cloud Vault (5TB)',
        storage_quota_total TEXT DEFAULT '5497558138880',
        storage_quota_used TEXT DEFAULT '142857142857',
        status TEXT NOT NULL DEFAULT 'connected',
        last_sync_at TEXT,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL DEFAULT 'super_admin'
      );
    `);

    // Media files safe column migrations
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN folder_id TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN product_id TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN product_category TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN original_name TEXT;`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN category TEXT DEFAULT 'general';`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN visibility TEXT DEFAULT 'public';`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN is_published INTEGER DEFAULT 1;`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN download_allowed INTEGER DEFAULT 1;`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN page_count INTEGER;`); } catch {}
    try { await client.execute(`ALTER TABLE media_files ADD COLUMN updated_at TEXT;`); } catch {}

    await client.execute(`
      CREATE TABLE IF NOT EXISTS media_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        parent_id TEXT,
        google_drive_folder_id TEXT,
        icon TEXT DEFAULT 'Folder',
        color TEXT DEFAULT '#B99A68',
        is_system INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS media_customer_access (
        id TEXT PRIMARY KEY,
        media_file_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        granted_by TEXT NOT NULL,
        granted_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS media_order_access (
        id TEXT PRIMARY KEY,
        media_file_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS media_product_access (
        id TEXT PRIMARY KEY,
        media_file_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS media_access_logs (
        id TEXT PRIMARY KEY,
        media_file_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action TEXT NOT NULL DEFAULT 'view',
        ip_address TEXT,
        user_agent TEXT,
        accessed_at TEXT NOT NULL
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS media_upload_logs (
        id TEXT PRIMARY KEY,
        media_file_id TEXT,
        file_name TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        error_message TEXT,
        upload_speed TEXT,
        uploaded_by TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT
      );
    `);

    // Ensure default 9 system categories in media_folders
    try {
      const existingFolders = await client.execute(`SELECT count(*) as cnt FROM media_folders;`);
      if (Number(existingFolders.rows[0].cnt || 0) === 0) {
        const defaultFolders = [
          { id: 'fld_catalogues', name: 'Furniture Catalogues', slug: 'catalogues', cat: 'catalogues', icon: 'BookOpen', color: '#B99A68' },
          { id: 'fld_photos', name: 'Product Photographs', slug: 'photographs', cat: 'photographs', icon: 'Image', color: '#38BDF8' },
          { id: 'fld_videos', name: 'Product Videos', slug: 'videos', cat: 'videos', icon: 'Video', color: '#A855F7' },
          { id: 'fld_pdfs', name: 'PDF Documents', slug: 'pdf-documents', cat: 'pdf_documents', icon: 'FileText', color: '#EF4444' },
          { id: 'fld_pricelists', name: 'Price Lists', slug: 'price-lists', cat: 'price_lists', icon: 'DollarSign', color: '#10B981' },
          { id: 'fld_brochures', name: 'Brochures', slug: 'brochures', cat: 'brochures', icon: 'File', color: '#F59E0B' },
          { id: 'fld_warranty', name: 'Warranty Documents', slug: 'warranty', cat: 'warranty_documents', icon: 'ShieldCheck', color: '#6366F1' },
          { id: 'fld_customer_docs', name: 'Customer Documents', slug: 'customer-docs', cat: 'customer_documents', icon: 'Users', color: '#EC4899' },
          { id: 'fld_general', name: 'General Files', slug: 'general', cat: 'general', icon: 'Folder', color: '#89847C' },
        ];

        const now = new Date().toISOString();
        for (const f of defaultFolders) {
          await client.execute({
            sql: `INSERT OR IGNORE INTO media_folders (id, name, slug, category, icon, color, is_system, created_at, created_by)
                  VALUES (?, ?, ?, ?, ?, ?, 1, ?, 'system');`,
            args: [f.id, f.name, f.slug, f.cat, f.icon, f.color, now],
          });
        }
      }
    } catch (fldErr) {
      console.warn('Folder seed note:', fldErr);
    }

    // Ensure default Google Drive 5TB connection record exists
    try {
      const existingConn = await client.execute(`SELECT id FROM cloud_storage_connections WHERE id = 'google_drive' LIMIT 1;`);
      if (existingConn.rows.length === 0) {
        await client.execute({
          sql: `INSERT INTO cloud_storage_connections (
                  id, provider, account_email, account_name, connected_at,
                  root_folder_id, root_folder_name, storage_quota_total, storage_quota_used,
                  status, last_sync_at, updated_at, updated_by
                ) VALUES (
                  'google_drive', 'google_drive', 'saadfurniture.cloud5tb@gmail.com', 'Saad Furniture Master Vault',
                  ?, '1_saad_furniture_vault_root_5tb', 'Saad Furniture Cloud Vault (5TB)',
                  '5497558138880', '142857142857', 'connected', ?, ?, 'super_admin'
                );`,
          args: [new Date().toISOString(), new Date().toISOString(), new Date().toISOString()],
        });
      }
    } catch (connErr) {
      console.warn('Cloud storage connection seed note:', connErr);
    }

    // --- 36. WORKSHOP MEDIA TABLE & MIGRATIONS ---
    await client.execute(`
      CREATE TABLE IF NOT EXISTS workshop_media (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        media_type TEXT NOT NULL DEFAULT 'photo',
        category TEXT NOT NULL DEFAULT 'workshop_tour',
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        video_duration REAL,
        is_featured INTEGER NOT NULL DEFAULT 0,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_published INTEGER NOT NULL DEFAULT 1,
        views_count INTEGER NOT NULL DEFAULT 0,
        google_drive_file_id TEXT,
        uploaded_by TEXT DEFAULT 'admin',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // --- 37. BANK ACCOUNTS TABLE ---
    await client.execute(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id TEXT PRIMARY KEY,
        bank_name TEXT NOT NULL,
        account_title TEXT NOT NULL,
        account_number TEXT NOT NULL,
        iban TEXT NOT NULL,
        branch_name TEXT,
        branch_code TEXT,
        instructions TEXT,
        qr_code_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Safe column migration for bank_transfer_receipts
    try {
      await client.execute(`ALTER TABLE bank_transfer_receipts ADD COLUMN rejection_reason TEXT;`);
    } catch {}

    // --- 38. PAYMENT GATEWAYS CONFIG TABLE ---
    await client.execute(`
      CREATE TABLE IF NOT EXISTS payment_gateways_config (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL DEFAULT 'stripe',
        mode TEXT NOT NULL DEFAULT 'sandbox',
        is_enabled INTEGER NOT NULL DEFAULT 1,
        publishable_key TEXT,
        secret_key_encrypted TEXT,
        webhook_secret_encrypted TEXT,
        merchant_id TEXT,
        supported_currencies TEXT DEFAULT '["PKR","USD"]',
        settings_json TEXT DEFAULT '{}',
        updated_at TEXT NOT NULL,
        updated_by TEXT DEFAULT 'super_admin'
      );
    `);

    // --- 39. USER APP LOCK TABLE ---
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_app_lock (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        is_enabled INTEGER NOT NULL DEFAULT 0,
        pin_hash TEXT,
        pin_salt TEXT,
        pin_length INTEGER NOT NULL DEFAULT 4,
        biometric_enabled INTEGER NOT NULL DEFAULT 0,
        biometric_credential_id TEXT,
        auto_lock_minutes REAL NOT NULL DEFAULT 1,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Ensure default bank accounts exist
    try {
      const existingBanks = await client.execute(`SELECT count(*) as cnt FROM bank_accounts;`);
      if (Number(existingBanks.rows[0].cnt || 0) === 0) {
        const now = new Date().toISOString();
        const defaultBanks = [
          {
            id: 'bank_meezan_primary',
            bank_name: 'Meezan Bank Limited',
            account_title: 'Saad Furniture Private Limited',
            account_number: '02840105829102',
            iban: 'PK64MEZN0002840105829102',
            branch_name: 'Main Boulevard, Gulberg III Branch, Lahore',
            branch_code: '0284',
            instructions: 'Transfer order advance or total balance. Supports instant Raast IBFT via 03009482811. Attach transaction receipt screenshot for instant verification.',
            is_active: 1,
            display_order: 1,
          },
          {
            id: 'bank_scb_premier',
            bank_name: 'Standard Chartered Bank',
            account_title: 'Saad Furniture Atelier',
            account_number: '01827461901',
            iban: 'PK36SCBL0000001827461901',
            branch_name: 'DHA Phase 5 Commercial Avenue, Lahore',
            branch_code: '0182',
            instructions: 'Corporate premier client accounts for bespoke estate furnishing and white-glove projects.',
            is_active: 1,
            display_order: 2,
          },
          {
            id: 'bank_alfalah_isb',
            bank_name: 'Bank Alfalah Limited',
            account_title: 'Saad Furniture & Interior Studio',
            account_number: '5512900381',
            iban: 'PK12ALFH00005512900381',
            branch_name: 'F-6 Super Market Executive Branch, Islamabad',
            branch_code: '5512',
            instructions: 'Direct transfer for North/Islamabad region patron commissions.',
            is_active: 1,
            display_order: 3,
          },
        ];

        for (const b of defaultBanks) {
          await client.execute({
            sql: `INSERT INTO bank_accounts (id, bank_name, account_title, account_number, iban, branch_name, branch_code, instructions, is_active, display_order, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            args: [b.id, b.bank_name, b.account_title, b.account_number, b.iban, b.branch_name, b.branch_code, b.instructions, b.is_active, b.display_order, now, now],
          });
        }
      }
    } catch (bErr) {
      console.warn('Bank accounts seed note:', bErr);
    }

    // Ensure default card gateway config exists
    try {
      const existingGateway = await client.execute(`SELECT id FROM payment_gateways_config WHERE id = 'card_gateway' LIMIT 1;`);
      if (existingGateway.rows.length === 0) {
        await client.execute({
          sql: `INSERT INTO payment_gateways_config (
                  id, provider, mode, is_enabled, publishable_key, merchant_id,
                  supported_currencies, settings_json, updated_at, updated_by
                ) VALUES (
                  'card_gateway', 'stripe', 'sandbox', 1, 'pk_test_saad_furniture_luxury_demo', 'acct_saadfurniture2026',
                  '["PKR","USD"]', '{"allowVisa": true, "allowMastercard": true, "require3DS": true}', ?, 'super_admin'
                );`,
          args: [new Date().toISOString()],
        });
      }
    } catch (gErr) {
      console.warn('Gateway config seed note:', gErr);
    }

    // Ensure initial workshop media exists
    try {
      const existingWorkshop = await client.execute(`SELECT count(*) as cnt FROM workshop_media;`);
      if (Number(existingWorkshop.rows[0].cnt || 0) === 0) {
        const now = new Date().toISOString();
        const initialWorkshopMedia = [
          {
            id: 'ws_feat_video_1',
            title: 'Inside Our Master Atelier: The Making of Royal Suites',
            description: 'Comprehensive 4K walkthrough of our primary manufacturing facility, showcasing hardwood seasoning, computerized precision wood routing, hand carving, and architectural assembly.',
            media_type: 'video',
            category: 'workshop_tour',
            url: 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-wood-plank-41584-large.mp4',
            thumbnail_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
            video_duration: 72,
            is_featured: 1,
            display_order: 1,
            is_published: 1,
            views_count: 1420,
          },
          {
            id: 'ws_sofa_frame_1',
            title: 'Sofa Frame Manufacturing & Mortise Joinery',
            description: 'Precision crafting of structural sofa frames using 100% seasoned solid Sheesham hardwood with reinforced corner blocks and double-dowel joinery.',
            media_type: 'photo',
            category: 'sofa_frame',
            url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
            thumbnail_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
            video_duration: null,
            is_featured: 0,
            display_order: 2,
            is_published: 1,
            views_count: 890,
          },
          {
            id: 'ws_woodworking_1',
            title: 'Precision Timber Cutting & Planing Atelier',
            description: 'Raw log conversion, industrial wood seasoning, moisture measurement, and high-precision CNC routing of architectural bedposts.',
            media_type: 'video',
            category: 'woodworking',
            url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-carpenter-shaping-wood-with-a-chisel-42777-large.mp4',
            thumbnail_url: 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=1200&q=80',
            video_duration: 48,
            is_featured: 0,
            display_order: 3,
            is_published: 1,
            views_count: 1105,
          },
          {
            id: 'ws_foam_1',
            title: 'Multi-Zone Ergonomic Foam Work & Webbing',
            description: 'Application of Master Molty Diamond 40-density foam with serpentine steel springs and interwoven nylon webbing for 15-year sagging prevention.',
            media_type: 'photo',
            category: 'foam_work',
            url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
            thumbnail_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
            video_duration: null,
            is_featured: 0,
            display_order: 4,
            is_published: 1,
            views_count: 670,
          },
          {
            id: 'ws_stitching_1',
            title: 'Bespoke Fabric & Pure Leather Stitching',
            description: 'Artisans hand-tufting velvet chesterfields with diamond pleats and heavy-gauge industrial thread stitching.',
            media_type: 'photo',
            category: 'fabric_stitching',
            url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
            thumbnail_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
            video_duration: null,
            is_featured: 0,
            display_order: 5,
            is_published: 1,
            views_count: 742,
          },
          {
            id: 'ws_polish_1',
            title: '7-Coat Furniture Polishing & Hand Waxing',
            description: 'Application of moisture-resistant polyurethane coats followed by traditional spirit polish and organic beeswax buffing for high-gloss grain accentuation.',
            media_type: 'video',
            category: 'furniture_polishing',
            url: 'https://assets.mixkit.co/videos/preview/mixkit-carpenter-measuring-a-wood-plank-41584-large.mp4',
            thumbnail_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
            video_duration: 60,
            is_featured: 0,
            display_order: 6,
            is_published: 1,
            views_count: 980,
          },
          {
            id: 'ws_finishing_1',
            title: 'Final Quality Audit & Brass Hardware Fitting',
            description: 'Installation of antiqued solid brass handles, precision Blum soft-close hinges, and zero-defect white-glove inspection.',
            media_type: 'photo',
            category: 'final_finishing',
            url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
            thumbnail_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
            video_duration: null,
            is_featured: 0,
            display_order: 7,
            is_published: 1,
            views_count: 812,
          },
          {
            id: 'ws_completed_1',
            title: 'Completed Royal Velvet Emerald Living Suite',
            description: 'Finished bespoke 8-piece royal salon commission prepared for white-glove double-corrugated transport to Islamabad villa.',
            media_type: 'photo',
            category: 'completed_products',
            url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
            thumbnail_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
            video_duration: null,
            is_featured: 0,
            display_order: 8,
            is_published: 1,
            views_count: 1530,
          },
        ];

        for (const item of initialWorkshopMedia) {
          await client.execute({
            sql: `INSERT INTO workshop_media (
                    id, title, description, media_type, category, url, thumbnail_url,
                    video_duration, is_featured, display_order, is_published, views_count,
                    created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            args: [
              item.id, item.title, item.description, item.media_type, item.category,
              item.url, item.thumbnail_url, item.video_duration, item.is_featured,
              item.display_order, item.is_published, item.views_count, now, now
            ],
          });
        }
      }
    } catch (wsErr) {
      console.warn('Workshop media seed note:', wsErr);
    }

    // Clean up any historical duplicate wishlists safely
    try {
      await client.execute(`
        DELETE FROM wishlists WHERE id NOT IN (
          SELECT min(id) FROM wishlists GROUP BY user_id, product_id
        );
      `);
      // Performance indexes for sub-millisecond lookups on low-end mobile devices & high-concurrency
      await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlists_user_product ON wishlists(user_id, product_id);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_wishlists_product ON wishlists(product_id);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_media_drive_id ON media_files(google_drive_file_id);`);
    } catch (idxErr) {
      console.warn('Index initialization note:', idxErr);
    }

    isInitialized = true;
  } catch (err) {
    console.error('Database table initialization note:', err);
  }
  })();

  return initPromise;
}
