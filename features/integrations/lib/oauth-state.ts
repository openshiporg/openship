import crypto from 'crypto';

// Self-contained signed state parameters (industry standard)
const SECRET_KEY = process.env.OAUTH_STATE_SECRET || 'openship-oauth-secret-key';

export async function generateOAuthState(platformId: string, type: 'shop' | 'channel'): Promise<string> {
  // Create state payload with timestamp for expiry
  const payload = {
    platformId,
    type,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex') // Small nonce for uniqueness
  };
  
  console.log('🟢 GENERATE: Creating signed state for:', payload);
  
  // Create signature
  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payloadString).digest('hex');
  
  // Combine payload and signature
  const signedState = {
    payload: payloadString,
    signature
  };
  
  // Encode as base64
  const encodedState = Buffer.from(JSON.stringify(signedState)).toString('base64');
  console.log('🟢 GENERATE: Generated signed state:', encodedState);
  
  return encodedState;
}