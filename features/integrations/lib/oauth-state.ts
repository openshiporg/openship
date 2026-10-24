import crypto from 'crypto';
import { oauthStateSecret } from './oauth-secret';


export async function generateOAuthState(platformId: string, type: 'shop' | 'channel'): Promise<string> {
  // Create state payload with timestamp for expiry
  const payload = {
    platformId,
    type,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex')
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', oauthStateSecret()).update(payloadString).digest('hex');

  const signedState = {
    payload: payloadString,
    signature
  };

  return Buffer.from(JSON.stringify(signedState)).toString('base64');
}