import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { oauthStateSecret } from '@/features/integrations/lib/oauth-secret';
import { keystoneContext } from '@/features/keystone/context';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';
import { handleShopOAuthCallback } from '@/features/integrations/shop/lib/executor';
import { handleChannelOAuthCallback } from '@/features/integrations/channel/lib/executor';
import {
  sealPendingShopOAuth,
  SHOP_OAUTH_PENDING_COOKIE,
} from '@/features/integrations/lib/oauth-pending';


function readOAuthState(state: string): {
  platformId: string;
  type: 'shop' | 'channel';
  timestamp: number;
} {
  const signedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
  const payload = String(signedState.payload || '');
  const signature = String(signedState.signature || '');
  const expectedSignature = crypto
    .createHmac('sha256', oauthStateSecret())
    .update(payload)
    .digest('hex');
  const supplied = Buffer.from(signature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');

  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    throw new Error('Invalid state signature');
  }

  const value = JSON.parse(payload);
  if (
    typeof value.platformId !== 'string' ||
    (value.type !== 'shop' && value.type !== 'channel') ||
    typeof value.timestamp !== 'number'
  ) {
    throw new Error('Invalid state payload');
  }

  const age = Date.now() - value.timestamp;
  if (age < 0 || age > 10 * 60 * 1000) throw new Error('State expired');
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get('error');
    if (error) {
      return NextResponse.json(
        { error, description: searchParams.get('error_description') },
        { status: 400 }
      );
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const shop = searchParams.get('shop');
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters: code or state' },
        { status: 400 }
      );
    }

    let stateData: ReturnType<typeof readOAuthState>;
    try {
      stateData = readOAuthState(state);
    } catch (error) {
      console.error('OAuth state validation failed:', error);
      return NextResponse.json({ error: 'Invalid or expired state parameter' }, { status: 400 });
    }

    const baseUrl = await getBaseUrl();
    const redirectUri = `${baseUrl}/api/oauth/callback`;

    if (stateData.type === 'shop') {
      const platform = await keystoneContext.sudo().query.ShopPlatform.findOne({
        where: { id: stateData.platformId },
        query: 'id name appKey appSecret oAuthCallbackFunction',
      });
      if (!platform) return NextResponse.json({ error: 'Shop platform not found' }, { status: 404 });

      const tokenResult = await handleShopOAuthCallback({
        platform,
        code,
        shop: shop || undefined,
        state,
        appKey: platform.appKey,
        appSecret: platform.appSecret,
        redirectUri,
      });
      const accessToken = typeof tokenResult === 'string' ? tokenResult : tokenResult.accessToken;
      const domain = new URL(shop || '').origin;
      const pendingGrant = sealPendingShopOAuth({
        platformId: stateData.platformId,
        domain,
        accessToken,
        ...(typeof tokenResult === 'object' && tokenResult.refreshToken
          ? { refreshToken: tokenResult.refreshToken }
          : {}),
        ...(typeof tokenResult === 'object' && tokenResult.tokenExpiresAt
          ? { tokenExpiresAt: tokenResult.tokenExpiresAt }
          : {}),
        createdAt: Date.now(),
      }, oauthStateSecret());
      const redirectUrl = new URL('/dashboard/platform/shops', baseUrl);
      redirectUrl.searchParams.set('showCreateShop', 'true');
      redirectUrl.searchParams.set('platform', stateData.platformId);
      redirectUrl.searchParams.set('domain', domain);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set(SHOP_OAUTH_PENDING_COOKIE, pendingGrant, {
        httpOnly: true,
        secure: redirectUrl.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: 10 * 60,
      });
      return response;
    }

    const platform = await keystoneContext.sudo().query.ChannelPlatform.findOne({
      where: { id: stateData.platformId },
      query: 'id name appKey appSecret oAuthCallbackFunction',
    });
    if (!platform) return NextResponse.json({ error: 'Channel platform not found' }, { status: 404 });

    const tokenResult = await handleChannelOAuthCallback({
      platform,
      code,
      shop: shop || undefined,
      state,
      appKey: platform.appKey,
      appSecret: platform.appSecret,
      redirectUri,
    });
    const accessToken = typeof tokenResult === 'string' ? tokenResult : tokenResult.accessToken;
    const redirectUrl = new URL('/dashboard/platform/channels', baseUrl);
    redirectUrl.searchParams.set('showCreateChannel', 'true');
    redirectUrl.searchParams.set('platform', stateData.platformId);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('domain', shop || '');
    if (typeof tokenResult === 'object') {
      if (tokenResult.refreshToken) redirectUrl.searchParams.set('refreshToken', tokenResult.refreshToken);
      if (tokenResult.tokenExpiresAt) redirectUrl.searchParams.set('tokenExpiresAt', tokenResult.tokenExpiresAt);
    }
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
