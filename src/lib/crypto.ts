import crypto from 'crypto';

/**
 * Derives a consistent 32-byte key for AES-256-GCM encryption.
 * Priority: GOOGLE_TOKEN_ENCRYPTION_KEY -> JWT_SECRET -> SESSION_SECRET -> fallback constant
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    process.env.SESSION_SECRET ||
    'saad_furniture_master_secure_vault_key_2026_aes256_gcm';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt sensitive plain text using AES-256-GCM.
 * Output format: "enc:iv_hex:tag_hex:ciphertext_hex"
 */
export function encryptText(plainText: string): string {
  if (!plainText) return '';
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let ciphertext = cipher.update(plainText, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return `enc:${iv.toString('hex')}:${tag}:${ciphertext}`;
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Failed to securely encrypt credential.');
  }
}

/**
 * Decrypt text encrypted with AES-256-GCM.
 * Gracefully handles unencrypted legacy text if not starting with "enc:".
 */
export function decryptText(cipherPayload: string): string {
  if (!cipherPayload) return '';
  if (!cipherPayload.startsWith('enc:')) {
    // Legacy / unencrypted token fallback
    return cipherPayload;
  }

  try {
    const parts = cipherPayload.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted payload format.');
    }

    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const ciphertext = parts[3];

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    // If decryption fails, return empty to prevent using corrupt token
    return '';
  }
}
