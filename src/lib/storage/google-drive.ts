import { client } from '@/lib/db';
import { encryptText, decryptText } from '@/lib/crypto';

// Folder ID Cache to prevent repeated API calls
const folderCache = new Map<string, string>();

// High-speed In-Memory Token Cache to prevent repeated database query latency
let inMemoryTokensCache: { tokens: GoogleTokens; cachedAt: number } | null = null;
const TOKENS_CACHE_TTL_MS = 60 * 1000; // 60s in-memory cache

export function invalidateGoogleTokensCache() {
  inMemoryTokensCache = null;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number; // epoch ms
  accountEmail: string;
  intendedEmail?: string;
  accountName?: string;
  scope?: string;
  rootFolderId?: string;
  isConnected: boolean;
  lastConnectionCheck?: string;
  lastTestStatus?: string;
  lastTestMessage?: string;
}

export interface DriveStorageQuota {
  connectedEmail: string;
  intendedEmail?: string;
  connectedName: string;
  limitBytes: number;
  usageBytes: number;
  usageInDriveBytes: number;
  freeBytes: number;
  usagePercentage: number;
  isConnected: boolean;
  rootFolderId?: string;
  lastConnectionCheck?: string;
  lastTestStatus?: string;
  lastTestMessage?: string;
}

export interface ResumableSessionOptions {
  filename: string;
  mimeType: string;
  fileSize: number;
  pathSegments: string[];
  description?: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  source: 'env' | 'database' | 'none';
}

export const ROOT_FOLDER_NAME = 'SAAD FURNITURE MASTER';

export const PRODUCT_CATALOG_CATEGORIES = [
  'Sofas',
  'Double Beds',
  'Single Beds',
  'Wardrobes',
  'Center Tables',
  'Mattresses',
  'Room Chairs',
  'Custom Furniture',
] as const;

export const STANDARD_DRIVE_SECTIONS = [
  'Product Catalog',
  'Product Videos',
  'Catalogues & Brochures',
  'Price Lists',
  'Customer Orders',
  'Customer Documents',
  'Warranty Documents',
  'General Business Documents',
] as const;

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

/**
 * Determine default redirect URI based on production domain or localhost
 */
export function getDefaultRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/admin/google-drive/callback`;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/google-drive/callback`;
  }
  return 'https://saadfurniture-iota.vercel.app/api/admin/google-drive/callback';
}

/**
 * Synchronous Google OAuth configuration getter (reads from env vars)
 */
export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = getDefaultRedirectUri();

  return {
    clientId,
    clientSecret,
    redirectUri,
    source: (clientId && clientSecret ? 'env' : 'none') as 'env' | 'none',
  };
}

/**
 * Resolve Google OAuth configuration from Environment or Database (encrypted).
 * Ensures admin can configure via UI if env vars are missing on Vercel.
 */
export async function resolveGoogleOAuthConfig(redirectUriOverride?: string): Promise<GoogleOAuthConfig> {
  const envClientId = process.env.GOOGLE_CLIENT_ID?.trim() || '';
  const envClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || '';
  const defaultRedirect = redirectUriOverride || getDefaultRedirectUri();

  if (envClientId && envClientSecret) {
    return {
      clientId: envClientId,
      clientSecret: envClientSecret,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || defaultRedirect,
      source: 'env',
    };
  }

  // Fallback to database credentials configured in Admin UI
  try {
    await ensureGoogleDriveSchema();
    const res = await client.execute(
      "SELECT client_id, client_secret_encrypted, redirect_uri FROM google_oauth_credentials WHERE id = 'default' LIMIT 1"
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      const dbClientId = String(row.client_id || '').trim();
      const decryptedSecret = decryptText(String(row.client_secret_encrypted || '')).trim();
      const dbRedirect = (row.redirect_uri ? String(row.redirect_uri) : null) || defaultRedirect;

      if (dbClientId && decryptedSecret) {
        return {
          clientId: dbClientId,
          clientSecret: decryptedSecret,
          redirectUri: dbRedirect,
          source: 'database',
        };
      }
    }
  } catch (err) {
    console.error('Error reading google_oauth_credentials from DB:', err);
  }

  return {
    clientId: '',
    clientSecret: '',
    redirectUri: defaultRedirect,
    source: 'none',
  };
}

let schemaEnsured = false;

/**
 * Automatically ensures tables and columns exist in Turso Cloud DB
 */
export async function ensureGoogleDriveSchema() {
  if (schemaEnsured) return;
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS google_drive_tokens (
        id TEXT PRIMARY KEY,
        account_email TEXT NOT NULL,
        intended_email TEXT,
        account_name TEXT,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expiry_date INTEGER NOT NULL,
        scope TEXT,
        root_folder_id TEXT,
        storage_quota_bytes INTEGER,
        storage_usage_bytes INTEGER,
        is_connected INTEGER NOT NULL DEFAULT 1,
        last_connection_check TEXT,
        last_test_status TEXT,
        last_test_message TEXT,
        updated_at TEXT NOT NULL
      );
    `);

    const alters = [
      'ALTER TABLE google_drive_tokens ADD COLUMN intended_email TEXT',
      'ALTER TABLE google_drive_tokens ADD COLUMN last_connection_check TEXT',
      'ALTER TABLE google_drive_tokens ADD COLUMN last_test_status TEXT',
      'ALTER TABLE google_drive_tokens ADD COLUMN last_test_message TEXT',
    ];

    for (const alt of alters) {
      try {
        await client.execute(alt);
      } catch {
        // column already exists
      }
    }

    await client.execute(`
      CREATE TABLE IF NOT EXISTS google_oauth_credentials (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        client_secret_encrypted TEXT NOT NULL,
        redirect_uri TEXT,
        updated_at TEXT NOT NULL
      );
    `);

    schemaEnsured = true;
  } catch (e) {
    console.warn('ensureGoogleDriveSchema auto-migration warning:', e);
  }
}

/**
 * Save Google OAuth Credentials in Turso (with AES-256-GCM encryption)
 */
export async function saveGoogleOAuthCredentials(clientId: string, clientSecret: string, redirectUri?: string) {
  await ensureGoogleDriveSchema();
  const encryptedSecret = encryptText(clientSecret.trim());
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT OR REPLACE INTO google_oauth_credentials (id, client_id, client_secret_encrypted, redirect_uri, updated_at)
          VALUES ('default', ?, ?, ?, ?)`,
    args: [clientId.trim(), encryptedSecret, redirectUri?.trim() || null, now],
  });
}

/**
 * Save Tokens to Turso Database with AES-256-GCM encryption
 */
export async function saveStoredTokens(tokens: GoogleTokens) {
  invalidateGoogleTokensCache();
  await ensureGoogleDriveSchema();
  const now = new Date().toISOString();
  const encryptedAccess = encryptText(tokens.accessToken);
  const encryptedRefresh = encryptText(tokens.refreshToken);

  await client.execute({
    sql: `INSERT OR REPLACE INTO google_drive_tokens 
          (id, account_email, intended_email, account_name, access_token, refresh_token, expiry_date, scope, root_folder_id, is_connected, last_connection_check, last_test_status, last_test_message, updated_at)
          VALUES ('active_account', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      tokens.accountEmail,
      tokens.intendedEmail || null,
      tokens.accountName || null,
      encryptedAccess,
      encryptedRefresh,
      tokens.expiryDate,
      tokens.scope || null,
      tokens.rootFolderId || null,
      tokens.isConnected ? 1 : 0,
      tokens.lastConnectionCheck || now,
      tokens.lastTestStatus || 'success',
      tokens.lastTestMessage || 'Connected and verified with Google API',
      now,
    ],
  });
  // Prime in-memory cache
  inMemoryTokensCache = { tokens, cachedAt: Date.now() };
}

/**
 * Update intended account email before or during OAuth initiation
 */
export async function setIntendedGoogleEmail(intendedEmail: string) {
  invalidateGoogleTokensCache();
  await ensureGoogleDriveSchema();
  const cleanEmail = intendedEmail.trim().toLowerCase();
  const now = new Date().toISOString();

  const existing = await client.execute("SELECT id FROM google_drive_tokens WHERE id = 'active_account' LIMIT 1");
  if (existing.rows.length > 0) {
    await client.execute({
      sql: `UPDATE google_drive_tokens SET intended_email = ?, updated_at = ? WHERE id = 'active_account'`,
      args: [cleanEmail, now],
    });
  } else {
    await client.execute({
      sql: `INSERT INTO google_drive_tokens (id, account_email, intended_email, access_token, refresh_token, expiry_date, is_connected, updated_at)
            VALUES ('active_account', ?, ?, '', '', 0, 0, ?)`,
      args: [cleanEmail, cleanEmail, now],
    });
  }
}

/**
 * Retrieve Stored Tokens from Database (Decrypts AES-256-GCM tokens)
 * Uses high-performance in-memory caching to eliminate repeated DB trips.
 */
export async function getStoredTokens(forceRefresh = false): Promise<GoogleTokens | null> {
  if (!forceRefresh && inMemoryTokensCache && Date.now() - inMemoryTokensCache.cachedAt < TOKENS_CACHE_TTL_MS) {
    return inMemoryTokensCache.tokens;
  }

  try {
    await ensureGoogleDriveSchema();
    const res = await client.execute(
      "SELECT * FROM google_drive_tokens WHERE id = 'active_account' LIMIT 1"
    );

    if (res.rows.length > 0) {
      const row = res.rows[0];
      const rawAccess = String(row.access_token || '');
      const rawRefresh = String(row.refresh_token || '');

      const accessToken = decryptText(rawAccess);
      const refreshToken = decryptText(rawRefresh);

      const parsedTokens: GoogleTokens = {
        accessToken,
        refreshToken,
        expiryDate: Number(row.expiry_date || 0),
        accountEmail: String(row.account_email || ''),
        intendedEmail: row.intended_email ? String(row.intended_email) : undefined,
        accountName: row.account_name ? String(row.account_name) : undefined,
        scope: row.scope ? String(row.scope) : undefined,
        rootFolderId: row.root_folder_id ? String(row.root_folder_id) : undefined,
        isConnected: Boolean(row.is_connected),
        lastConnectionCheck: row.last_connection_check ? String(row.last_connection_check) : undefined,
        lastTestStatus: row.last_test_status ? String(row.last_test_status) : undefined,
        lastTestMessage: row.last_test_message ? String(row.last_test_message) : undefined,
      };

      inMemoryTokensCache = { tokens: parsedTokens, cachedAt: Date.now() };
      return parsedTokens;
    }
  } catch (err) {
    console.error('Error reading google_drive_tokens from DB:', err);
  }

  // Environment fallback if manual refresh token was configured
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    return {
      accessToken: process.env.GOOGLE_ACCESS_TOKEN || '',
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      expiryDate: 0, // force refresh
      accountEmail: process.env.GOOGLE_ACCOUNT_EMAIL || 'owner@saadfurniture.com',
      accountName: 'Saad Furniture Master Storage',
      isConnected: true,
    };
  }

  return null;
}

/**
 * Generate Google OAuth 2.0 Authorization URL with optional login_hint
 */
export async function getGoogleOAuthUrl(
  state: string,
  redirectUriOverride?: string,
  loginHint?: string
): Promise<string> {
  const { clientId, redirectUri } = await resolveGoogleOAuthConfig(redirectUriOverride);
  if (!clientId) {
    throw new Error(
      'Google Client ID is not configured. Please enter GOOGLE_CLIENT_ID in Admin Google Drive Settings or environment variables.'
    );
  }

  const uri = redirectUriOverride || redirectUri;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: uri,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });

  if (loginHint && loginHint.trim()) {
    params.set('login_hint', loginHint.trim());
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Access & Refresh Tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUriOverride?: string
): Promise<GoogleTokens> {
  const { clientId, clientSecret, redirectUri } = await resolveGoogleOAuthConfig(redirectUriOverride);
  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials (Client ID or Client Secret).');
  }

  const uri = redirectUriOverride || redirectUri;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: uri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for tokens');
  }

  const { access_token, refresh_token, expires_in, scope } = tokenData;
  const expiryDate = Date.now() + (expires_in || 3600) * 1000;

  // Query verified user profile from Google UserInfo endpoint
  let verifiedEmail = 'owner@saadfurniture.com';
  let accountName = 'Saad Furniture Vault Owner';

  try {
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      verifiedEmail = userData.email || verifiedEmail;
      accountName = userData.name || accountName;
    }
  } catch (err) {
    console.warn('Could not fetch Google user profile:', err);
  }

  // Initialize Root Folder and Standard Subfolders in Google Drive
  let rootFolderId: string | undefined;
  try {
    const folderStructure = await ensureStandardFolderStructure(access_token);
    rootFolderId = folderStructure.rootFolderId;
  } catch (e) {
    console.warn('Standard folder init warning:', e);
  }

  // Preserve existing intended email if set
  const existingTokens = await getStoredTokens();
  const intendedEmail = existingTokens?.intendedEmail || verifiedEmail;

  // Retain existing refresh token if Google didn't reissue one on reconnect
  const finalRefreshToken = refresh_token || existingTokens?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN || '';

  if (!finalRefreshToken) {
    throw new Error('Google did not return a refresh token. Please disconnect and grant offline access permissions again.');
  }

  const now = new Date().toISOString();
  const tokens: GoogleTokens = {
    accessToken: access_token,
    refreshToken: finalRefreshToken,
    expiryDate,
    accountEmail: verifiedEmail,
    intendedEmail,
    accountName,
    scope: scope || OAUTH_SCOPES,
    rootFolderId,
    isConnected: true,
    lastConnectionCheck: now,
    lastTestStatus: 'success',
    lastTestMessage: `Successfully connected to ${verifiedEmail} with verified Drive access.`,
  };

  await saveStoredTokens(tokens);
  return tokens;
}

/**
 * Get Valid Google Access Token (Auto-refreshes if expired or near expiry)
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await getStoredTokens();
  if (!tokens || !tokens.refreshToken || !tokens.isConnected) {
    throw new Error(
      'Google Drive is not connected. Please connect your Google account in Admin > Google Drive Storage Settings.'
    );
  }

  // Refresh if token expires within 5 minutes (300,000 ms)
  const isExpiringSoon = Date.now() + 300000 > tokens.expiryDate;
  if (!isExpiringSoon && tokens.accessToken) {
    return tokens.accessToken;
  }

  const { clientId, clientSecret } = await resolveGoogleOAuthConfig();
  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials (Client ID or Client Secret).');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.error_description || data.error || 'Failed to refresh Google Drive access token';
    await client.execute({
      sql: `UPDATE google_drive_tokens SET last_test_status = 'error', last_test_message = ?, updated_at = ? WHERE id = 'active_account'`,
      args: [`Token refresh failed: ${errorMsg}`, new Date().toISOString()],
    });
    throw new Error(errorMsg);
  }

  const newAccessToken = data.access_token;
  const newExpiry = Date.now() + (data.expires_in || 3600) * 1000;

  tokens.accessToken = newAccessToken;
  tokens.expiryDate = newExpiry;
  await saveStoredTokens(tokens);

  return newAccessToken;
}

/**
 * Disconnect Google Drive Account & Revoke Token
 */
export async function disconnectGoogleDrive() {
  invalidateGoogleTokensCache();
  const tokens = await getStoredTokens();
  if (tokens?.refreshToken || tokens?.accessToken) {
    try {
      const tokenToRevoke = tokens.refreshToken || tokens.accessToken;
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (e) {
      console.warn('Token revocation warning:', e);
    }
  }

  const now = new Date().toISOString();
  await client.execute({
    sql: `UPDATE google_drive_tokens 
          SET is_connected = 0, last_test_status = 'warning', last_test_message = 'Account disconnected by administrator', updated_at = ? 
          WHERE id = 'active_account'`,
    args: [now],
  });
  folderCache.clear();
}

/**
 * Fetch Google Drive Storage Quota and User Info
 */
export async function getDriveStorageQuota(): Promise<DriveStorageQuota> {
  const tokens = await getStoredTokens();
  if (!tokens || !tokens.isConnected) {
    return {
      connectedEmail: '',
      intendedEmail: tokens?.intendedEmail || '',
      connectedName: '',
      limitBytes: 0,
      usageBytes: 0,
      usageInDriveBytes: 0,
      freeBytes: 0,
      usagePercentage: 0,
      isConnected: false,
      lastConnectionCheck: tokens?.lastConnectionCheck,
      lastTestStatus: tokens?.lastTestStatus || 'warning',
      lastTestMessage: tokens?.lastTestMessage || 'Not connected to any Google Account',
    };
  }

  try {
    const accessToken = await getValidAccessToken();
    const res = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=storageQuota,user',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      throw new Error(`Drive about API failed with status ${res.status}`);
    }

    const data = await res.json();
    const quota = data.storageQuota || {};
    const limit = Number(quota.limit || 0); // e.g. 5TB = 5497558138880 bytes
    const usage = Number(quota.usage || 0);
    const usageInDrive = Number(quota.usageInDrive || 0);
    const free = limit > usage ? limit - usage : 0;
    const percentage = limit > 0 ? Math.round((usage / limit) * 100) : 0;

    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE google_drive_tokens 
            SET storage_quota_bytes = ?, storage_usage_bytes = ?, last_connection_check = ?, last_test_status = 'success', last_test_message = 'Google Drive API active and healthy', updated_at = ? 
            WHERE id = 'active_account'`,
      args: [limit, usage, now, now],
    });

    return {
      connectedEmail: data.user?.emailAddress || tokens.accountEmail,
      intendedEmail: tokens.intendedEmail || tokens.accountEmail,
      connectedName: data.user?.displayName || tokens.accountName || 'Google Account Owner',
      limitBytes: limit,
      usageBytes: usage,
      usageInDriveBytes: usageInDrive,
      freeBytes: free,
      usagePercentage: percentage,
      isConnected: true,
      rootFolderId: tokens.rootFolderId,
      lastConnectionCheck: now,
      lastTestStatus: 'success',
      lastTestMessage: 'Google Drive API active and healthy',
    };
  } catch (err: any) {
    console.error('Error querying Drive storage quota:', err);
    return {
      connectedEmail: tokens.accountEmail,
      intendedEmail: tokens.intendedEmail || tokens.accountEmail,
      connectedName: tokens.accountName || 'Connected Account',
      limitBytes: 0,
      usageBytes: 0,
      usageInDriveBytes: 0,
      freeBytes: 0,
      usagePercentage: 0,
      isConnected: true,
      rootFolderId: tokens.rootFolderId,
      lastConnectionCheck: tokens.lastConnectionCheck,
      lastTestStatus: 'error',
      lastTestMessage: err.message || 'Failed to reach Google Drive API',
    };
  }
}

/**
 * Ensure a single folder exists in Google Drive
 */
export async function ensureFolderWithToken(
  folderName: string,
  parentId?: string,
  token?: string
): Promise<string> {
  const cacheKey = `${parentId || 'root'}_${folderName}`;
  if (folderCache.has(cacheKey)) {
    return folderCache.get(cacheKey)!;
  }

  const accessToken = token || (await getValidAccessToken());

  // Search existing folder
  let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  } else {
    q += ` and 'root' in parents`;
  }

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const id = searchData.files[0].id;
      folderCache.set(cacheKey, id);
      return id;
    }
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(createData.error?.message || `Failed to create Google Drive folder: ${folderName}`);
  }

  const newId = createData.id;
  folderCache.set(cacheKey, newId);
  return newId;
}

/**
 * Ensure the full standard SAAD FURNITURE MASTER folder structure exists in connected Google Drive:
 * SAAD FURNITURE MASTER/
 *   Product Catalog/
 *     Sofas/
 *     Double Beds/
 *     Single Beds/
 *     Wardrobes/
 *     Center Tables/
 *     Mattresses/
 *     Room Chairs/
 *     Custom Furniture/
 *   Product Videos/
 *   Catalogues & Brochures/
 *   Price Lists/
 *   Customer Orders/
 *   Customer Documents/
 *   Warranty Documents/
 *   General Business Documents/
 */
export async function ensureStandardFolderStructure(token?: string): Promise<{
  rootFolderId: string;
  subfolders: Record<string, string>;
}> {
  const rootFolderId = await ensureFolderWithToken(ROOT_FOLDER_NAME, undefined, token);
  const subfolders: Record<string, string> = {};

  for (const section of STANDARD_DRIVE_SECTIONS) {
    const sectionId = await ensureFolderWithToken(section, rootFolderId, token);
    subfolders[section] = sectionId;

    // Sub-subfolders for Product Catalog
    if (section === 'Product Catalog') {
      for (const cat of PRODUCT_CATALOG_CATEGORIES) {
        const catId = await ensureFolderWithToken(cat, sectionId, token);
        subfolders[`Product Catalog/${cat}`] = catId;
      }
    }
  }

  return { rootFolderId, subfolders };
}

/**
 * Determine Google Drive folder path segments based on category & file type
 */
export function getFolderPathSegments(category?: string, mimeType?: string): string[] {
  const cat = (category || '').trim();
  const mime = (mimeType || '').toLowerCase();

  if (mime.startsWith('video/')) {
    return [ROOT_FOLDER_NAME, 'Product Videos'];
  }
  if (cat.toLowerCase().includes('order')) {
    return [ROOT_FOLDER_NAME, 'Customer Orders'];
  }
  if (cat.toLowerCase().includes('catalogue') || cat.toLowerCase().includes('brochure')) {
    return [ROOT_FOLDER_NAME, 'Catalogues & Brochures'];
  }
  if (cat.toLowerCase().includes('price')) {
    return [ROOT_FOLDER_NAME, 'Price Lists'];
  }
  if (cat.toLowerCase().includes('warranty')) {
    return [ROOT_FOLDER_NAME, 'Warranty Documents'];
  }
  if (cat.toLowerCase().includes('customer')) {
    return [ROOT_FOLDER_NAME, 'Customer Documents'];
  }

  // Check Product Catalog categories
  const matchedCategory = PRODUCT_CATALOG_CATEGORIES.find(
    (c) => c.toLowerCase() === cat.toLowerCase() || cat.toLowerCase().includes(c.toLowerCase())
  );

  if (matchedCategory) {
    return [ROOT_FOLDER_NAME, 'Product Catalog', matchedCategory];
  }

  return [ROOT_FOLDER_NAME, 'General Business Documents'];
}

/**
 * Ensure full hierarchical folder structure in Google Drive
 */
export async function ensureDriveHierarchy(pathSegments: string[]): Promise<string> {
  const rootId = await ensureFolderWithToken(ROOT_FOLDER_NAME);

  let currentParentId = rootId;
  for (let i = 1; i < pathSegments.length; i++) {
    const segment = pathSegments[i];
    if (!segment || !segment.trim()) continue;
    currentParentId = await ensureFolderWithToken(segment.trim(), currentParentId);
  }

  return currentParentId;
}

/**
 * Create a direct resumable upload session on Google Drive.
 */
export async function createResumableUploadSession(
  options: ResumableSessionOptions
): Promise<{ uploadUrl: string; targetFolderId: string }> {
  const accessToken = await getValidAccessToken();
  const targetFolderId = await ensureDriveHierarchy(options.pathSegments);

  const initRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': options.mimeType,
        'X-Upload-Content-Length': String(options.fileSize),
      },
      body: JSON.stringify({
        name: options.filename,
        parents: [targetFolderId],
        description: options.description || 'Saad Furniture Master Document',
      }),
    }
  );

  if (!initRes.ok) {
    const errorText = await initRes.text();
    throw new Error(`Google Drive upload session creation failed: ${errorText}`);
  }

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) {
    throw new Error('Google Drive did not return a resumable upload location header.');
  }

  return { uploadUrl, targetFolderId };
}

/**
 * Upload a binary buffer directly to Google Drive server-side.
 */
export async function uploadBufferToDrive(options: {
  buffer: Buffer | Uint8Array;
  filename: string;
  mimeType: string;
  pathSegments?: string[];
  description?: string;
}): Promise<{ id: string; name: string; size: number; mimeType: string; webViewLink?: string; webContentLink?: string }> {
  const { uploadUrl, targetFolderId } = await createResumableUploadSession({
    filename: options.filename,
    mimeType: options.mimeType,
    fileSize: options.buffer.byteLength,
    pathSegments: options.pathSegments || [ROOT_FOLDER_NAME, 'Product Catalog', 'Sofas'],
    description: options.description || 'Saad Furniture Luxury Asset',
  });

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(options.buffer.byteLength),
      'Content-Range': `bytes 0-${options.buffer.byteLength - 1}/${options.buffer.byteLength}`,
      'Content-Type': options.mimeType,
    },
    body: new Blob([new Uint8Array(options.buffer)]) as any,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Google Drive buffer upload failed (${uploadRes.status}): ${errorText}`);
  }

  const fileData = await uploadRes.json();
  const fileId = fileData.id;

  // Make public read-only for product catalog images if required
  try {
    const token = await getValidAccessToken();
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Set permission warning:', permErr);
  }

  return {
    id: fileData.id,
    name: fileData.name,
    size: Number(fileData.size || options.buffer.byteLength),
    mimeType: fileData.mimeType || options.mimeType,
    webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink: fileData.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`,
  };
}

/**
 * Verify that a file was successfully uploaded to Google Drive
 */
export async function verifyUploadedDriveFile(driveFileId: string) {
  const accessToken = await getValidAccessToken();

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?fields=id,name,mimeType,size,parents,trashed,md5Checksum,webViewLink,webContentLink`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`File verification failed on Google Drive (status ${res.status})`);
  }

  const file = await res.json();
  if (file.trashed) {
    throw new Error('File is marked as trashed on Google Drive');
  }

  return {
    id: file.id as string,
    name: file.name as string,
    mimeType: file.mimeType as string,
    size: Number(file.size || 0),
    parents: (file.parents as string[]) || [],
    webViewLink: file.webViewLink as string | undefined,
    webContentLink: file.webContentLink as string | undefined,
  };
}

/**
 * Safely delete a file from Google Drive
 */
export async function deleteDriveFile(driveFileId: string): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok || res.status === 404;
  } catch (err) {
    console.error('Error deleting file from Google Drive:', err);
    return false;
  }
}

/**
 * Stream binary content from Google Drive
 */
export async function streamDriveFile(driveFileId: string, rangeHeader?: string | null) {
  const accessToken = await getValidAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
    { headers }
  );

  return res;
}

/**
 * Check if Google Drive is currently authorized and connected
 */
export async function isDriveConnected(): Promise<boolean> {
  try {
    const tokens = await getStoredTokens();
    return Boolean(tokens && tokens.isConnected && (tokens.refreshToken || tokens.accessToken));
  } catch {
    return false;
  }
}

