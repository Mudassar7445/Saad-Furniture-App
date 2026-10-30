import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

let url = process.env.TURSO_DATABASE_URL || 'file:saad_furniture.db';
if (url.startsWith('libsql://')) {
  url = url.replace('libsql://', 'https://');
}
const authToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({
  url,
  authToken,
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

    try {
      await client.execute(`ALTER TABLE users ADD COLUMN marketing_opt_in INTEGER DEFAULT 1;`);
    } catch {}

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

    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN received_by TEXT DEFAULT 'Saad Finance Bureau';`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN is_reversed INTEGER DEFAULT 0;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN reversal_reason TEXT;`);
    } catch {}

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

    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN received_by TEXT DEFAULT 'Saad Finance Bureau';`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN is_reversed INTEGER DEFAULT 0;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE payments ADD COLUMN reversal_reason TEXT;`);
    } catch {}

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
        fcm_token TEXT NOT NULL,
        device_type TEXT NOT NULL DEFAULT 'desktop',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

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

    isInitialized = true;
  } catch (err) {
    console.error('Database table initialization note:', err);
  }
}
