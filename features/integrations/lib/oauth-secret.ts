// Same secret E-commerce uses for signed tokens: SESSION_SECRET. No extra setting.
export function oauthStateSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }
  return 'openship-local-development-oauth-state-secret';
}
