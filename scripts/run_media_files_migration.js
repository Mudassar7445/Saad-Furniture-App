const { createClient } = require('@libsql/client');

const DEFAULT_TURSO_URL = 'https://saad-furniture-mudassar7445.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMzNzk1OTIsImlkIjoiMDFhMThkYmEtZWMwMS03OTE5LTk2ZTktYmI0OTBiNDNjY2U3Iiwia2lkIjoiZG5HdHlvcVQtUTVCenVnLU95eHhmU3JHZ0E2LXhqOUUzc0I2Y0JmMUxJZyIsInJpZCI6IjA4NTM0ZDJkLTJmYmYtNDIxZC05OTRjLTJiOGM4ZDM5ZWJmZiJ9.dLmD0n5QMyGMtcAEnzEg84qcvwTICFxJizc6mo2FxRdMcljIAv8ynVD2LF2vi4KfSYwQ1aO3IhP3g_9QbT7vDA';

const client = createClient({
  url: DEFAULT_TURSO_URL,
  authToken: DEFAULT_TURSO_TOKEN,
});

async function runMigration() {
  console.log('--- STARTING SAFE MEDIA_FILES MIGRATION ---');

  // Check count before
  let countBefore = 0;
  try {
    const c = await client.execute("SELECT count(*) as cnt FROM media_files;");
    countBefore = c.rows[0].cnt;
    console.log(`Existing media_files count: ${countBefore}`);
  } catch (err) {
    console.log('Table media_files might not exist yet:', err.message);
  }

  // 1. Create media_files_v2 with nullable order_id and customer_id
  console.log('Step 1: Creating media_files_v2 table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS media_files_v2 (
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

  // 2. If media_files exists, copy data
  if (countBefore > 0) {
    console.log('Step 2: Copying existing data to media_files_v2...');
    await client.execute(`
      INSERT INTO media_files_v2 (
        id, folder_id, order_id, customer_id, product_id, product_category,
        google_drive_file_id, file_name, original_name, mime_type, file_size,
        media_type, category, title, description, stage, thumbnail_url,
        video_duration, page_count, web_view_link, web_content_link,
        visibility, is_published, download_allowed, is_public,
        uploaded_by, uploaded_at, updated_at
      )
      SELECT 
        id, folder_id, order_id, customer_id, product_id, product_category,
        google_drive_file_id, file_name, original_name, mime_type, file_size,
        media_type, category, title, description, stage, thumbnail_url,
        video_duration, page_count, web_view_link, web_content_link,
        visibility, is_published, download_allowed, is_public,
        uploaded_by, uploaded_at, updated_at
      FROM media_files;
    `);
  }

  // 3. Drop old table
  console.log('Step 3: Dropping old media_files table...');
  await client.execute("DROP TABLE IF EXISTS media_files;");

  // 4. Rename media_files_v2 to media_files
  console.log('Step 4: Renaming media_files_v2 to media_files...');
  await client.execute("ALTER TABLE media_files_v2 RENAME TO media_files;");

  // Verify new schema
  console.log('Step 5: Verifying new schema...');
  const pragma = await client.execute("PRAGMA table_info('media_files');");
  console.table(pragma.rows.map(r => ({ cid: r.cid, name: r.name, type: r.type, notnull: r.notnull })));

  console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
