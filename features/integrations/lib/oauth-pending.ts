import crypto from "node:crypto";

export const SHOP_OAUTH_PENDING_COOKIE = "openship-shop-oauth-pending";
export const CHANNEL_OAUTH_PENDING_COOKIE = "openship-channel-oauth-pending";

export interface PendingShopOAuth {
  platformId: string;
  domain: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  createdAt: number;
}

function key(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

export function sealPendingShopOAuth(value: PendingShopOAuth, secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString("base64url")).join(".");
}

export function openPendingShopOAuth(value: string, secret: string): PendingShopOAuth {
  const [ivValue, tagValue, encryptedValue, extra] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue || extra) throw new Error("Invalid pending OAuth grant");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(secret), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const result = JSON.parse(plaintext) as PendingShopOAuth;
  if (!result.platformId || !result.domain || !result.accessToken || !result.createdAt) {
    throw new Error("Incomplete pending OAuth grant");
  }
  if (Date.now() - result.createdAt > 10 * 60 * 1000) throw new Error("Pending OAuth grant expired");
  return result;
}
