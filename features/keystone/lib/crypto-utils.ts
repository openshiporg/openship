/**
 * Crypto utilities for API key generation and hashing
 * Separated from the model to avoid Node.js import issues at build time
 */

let crypto: typeof import('crypto');

// Dynamically import crypto to avoid bundling issues
async function getCrypto() {
  if (!crypto) {
    // Use dynamic import to avoid webpack bundling the crypto module
    crypto = await import('crypto');
  }
  return crypto;
}

// Generate secure API key token
export async function generateApiKeyToken(): Promise<string> {
  const cryptoModule = await getCrypto();
  const prefix = 'osp_'; // Openship API key prefix
  const randomBytes = cryptoModule.randomBytes(32).toString('hex');
  return `${prefix}${randomBytes}`;
}

// Hash API key for secure storage
export async function hashApiKey(key: string): Promise<string> {
  const cryptoModule = await getCrypto();
  return cryptoModule.createHash('sha256').update(key).digest('hex');
}

// Synchronous versions for KeystoneJS hooks (only when needed)
export function generateApiKeyTokenSync(): string {
  // Fallback for synchronous usage - use Math.random as last resort
  const prefix = 'osp_';
  const randomString = Math.random().toString(36).substring(2) + 
                      Math.random().toString(36).substring(2) +
                      Math.random().toString(36).substring(2) +
                      Date.now().toString(36);
  return `${prefix}${randomString}`;
}

export function hashApiKeySync(key: string): string {
  // Simple hash function for fallback (not cryptographically secure)
  // This is just for development - should be replaced with proper crypto
  let hash = 0;
  if (key.length === 0) return hash.toString();
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}