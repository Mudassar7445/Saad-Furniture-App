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

/**
 * Initializes all database tables for Saad Furniture ecosystem.
 * Works seamlessly with Turso Cloud or local embedded LibSQL.
 */
export async function initializeDatabase() {
  if (isInitialized) return;
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
        order_id TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        google_drive_file_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER DEFAULT 0,
        media_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        stage TEXT NOT NULL DEFAULT 'frame_preparation',
        thumbnail_url TEXT,
        video_duration REAL,
        web_view_link TEXT,
        web_content_link TEXT,
        uploaded_by TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        is_public INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES users(id)
      );
    `);

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

    isInitialized = true;
  } catch (err) {
    console.error('Database table initialization note:', err);
  }
}
