import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleShopOAuthCallback } from '@/features/integrations/shop/lib/executor';
import { handleChannelOAuthCallback } from '@/features/integrations/channel/lib/executor';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';
import crypto from 'crypto';

const SECRET_KEY = process.env.OAUTH_STATE_SECRET || 'openship-oauth-secret-key';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get OAuth parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const shop = searchParams.get('shop');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.json(
        { error: error, description: errorDescription },
        { status: 400 }
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters: code or state' },
        { status: 400 }
      );
    }

    // Decode and validate state (handle both base64 and JSON formats)
    let signedState;
    try {
      // First try to parse as direct JSON (marketplace flow from OpenFront)
      try {
        signedState = JSON.parse(state);
      } catch {
        // If that fails, try base64 decoding (original flow from OpenShip)
        const decoded = Buffer.from(state, 'base64').toString();
        signedState = JSON.parse(decoded);
      }
    } catch (e) {
      console.error('Failed to decode state:', e);
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Handle different state formats
    let stateData;

    if (signedState.type === 'marketplace') {
      // Marketplace flow - state is already the data we need
      stateData = signedState;
    } else {
      // Original OpenShip flow - has payload and signature
      const { payload, signature } = signedState;

      // Verify signature
      const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
      if (signature !== expectedSignature) {
        console.error('Invalid state signature');
        return NextResponse.json(
          { error: 'Invalid state signature' },
          { status: 400 }
        );
      }

      // Parse verified payload
      try {
        stateData = JSON.parse(payload);
      } catch (e) {
        console.error('Failed to parse payload:', e);
        return NextResponse.json(
          { error: 'Invalid state payload' },
          { status: 400 }
        );
      }
    }

    // Handle marketplace flow - exchange code for tokens then redirect
    if (stateData.type === 'marketplace') {
      // Create minimal platform object for adapter
      const marketplacePlatform = {
        domain: shop,
        accessToken: '',
        appKey: stateData.client_id,
        appSecret: stateData.client_secret,
        oAuthCallbackFunction: stateData.adapter_slug
      };

      // Determine app type for proper OAuth handler
      const marketplaceAppType = stateData.app_type || 'shop';

      // Exchange code for access token using appropriate OAuth handler
      const tokenResult = marketplaceAppType === 'channel'
        ? await handleChannelOAuthCallback({
            platform: marketplacePlatform,
            code,
            shop: shop || undefined,
            state: 'marketplace-flow',
            appKey: stateData.client_id,
            appSecret: stateData.client_secret,
            redirectUri: `${await getBaseUrl()}/api/oauth/callback`
          })
        : await handleShopOAuthCallback({
            platform: marketplacePlatform,
            code,
            shop: shop || undefined,
            state: 'marketplace-flow',
            appKey: stateData.client_id,
            appSecret: stateData.client_secret,
            redirectUri: `${await getBaseUrl()}/api/oauth/callback`
          });

      // Handle both old string format and new object format
      let accessToken, refreshToken, tokenExpiresAt;
      if (typeof tokenResult === 'string') {
        accessToken = tokenResult;
      } else {
        accessToken = tokenResult.accessToken;
        refreshToken = tokenResult.refreshToken;
        tokenExpiresAt = tokenResult.tokenExpiresAt;
      }

      const baseUrl = await getBaseUrl();

      // Determine redirect URL based on app type
      const redirectAppType = stateData.app_type || 'shop';
      const endpoint = redirectAppType === 'channel' ? 'channels' : 'shops';
      const createParam = redirectAppType === 'channel' ? 'showCreateChannel' : 'showCreateShop';

      const redirectUrl = new URL(`${baseUrl}/dashboard/platform/${endpoint}`);
      redirectUrl.searchParams.set(createParam, 'true');
      redirectUrl.searchParams.set('domain', shop ?? '');
      redirectUrl.searchParams.set('accessToken', accessToken);
      redirectUrl.searchParams.set('client_id', stateData.client_id);
      redirectUrl.searchParams.set('client_secret', stateData.client_secret);
      redirectUrl.searchParams.set('app_name', stateData.app_name);
      redirectUrl.searchParams.set('adapter_slug', stateData.adapter_slug);

      if (refreshToken) {
        redirectUrl.searchParams.set('refreshToken', refreshToken);
      }
      if (tokenExpiresAt) {
        redirectUrl.searchParams.set('tokenExpiresAt', tokenExpiresAt);
      }

      return NextResponse.redirect(redirectUrl.toString());
    }

    // Handle original OpenShip flow
    const { platformId, type, timestamp } = stateData;

    // Check if state is expired (10 minutes max)
    const maxAge = 10 * 60 * 1000;
    if (Date.now() - timestamp > maxAge) {
      console.error('State expired');
      return NextResponse.json(
        { error: 'State expired' },
        { status: 400 }
      );
    }

    // Fetch the platform based on type
    let platform;
    let accessToken;
    const baseUrl = await getBaseUrl();

    if (type === 'shop') {
      platform = await keystoneContext.sudo().query.ShopPlatform.findOne({
        where: { id: platformId },
        query: `
          id
          name
          appKey
          appSecret
          oAuthCallbackFunction
        `,
      });

      if (!platform) {
        return NextResponse.json({ error: 'Shop platform not found' }, { status: 404 });
      }

      // Exchange code for tokens
      const tokenResult = await handleShopOAuthCallback({
        platform,
        code,
        shop: shop || undefined,
        state,
        appKey: platform.appKey,
        appSecret: platform.appSecret,
        redirectUri: `${baseUrl}/api/oauth/callback`,
      });

      // Handle both old string format and new object format
      if (typeof tokenResult === 'string') {
        accessToken = tokenResult;
      } else {
        accessToken = tokenResult.accessToken;
      }

      // Redirect to shops page with params
      const redirectUrl = new URL(`${baseUrl}/dashboard/platform/shops`);
      redirectUrl.searchParams.set('showCreateShop', 'true');
      redirectUrl.searchParams.set('platform', platformId);
      redirectUrl.searchParams.set('accessToken', accessToken);
      if (typeof tokenResult === 'object') {
        if (tokenResult.refreshToken) {
          redirectUrl.searchParams.set('refreshToken', tokenResult.refreshToken);
        }
        if (tokenResult.tokenExpiresAt) {
          redirectUrl.searchParams.set('tokenExpiresAt', tokenResult.tokenExpiresAt);
        }
      }
      redirectUrl.searchParams.set('domain', shop ?? '');

      return NextResponse.redirect(redirectUrl.toString());

    } else if (type === 'channel') {
      platform = await keystoneContext.sudo().query.ChannelPlatform.findOne({
        where: { id: platformId },
        query: `
          id
          name
          appKey
          appSecret
          oAuthCallbackFunction
        `,
      });

      if (!platform) {
        return NextResponse.json({ error: 'Channel platform not found' }, { status: 404 });
      }

      // Exchange code for access token
      const channelTokenResult = await handleChannelOAuthCallback({
        platform,
        code,
        shop: shop || undefined,
        state,
        appKey: platform.appKey,
        appSecret: platform.appSecret,
        redirectUri: `${baseUrl}/api/oauth/callback`,
      });

      // Handle both old string format and new object format
      if (typeof channelTokenResult === 'string') {
        accessToken = channelTokenResult;
      } else {
        accessToken = channelTokenResult.accessToken;
      }

      // Redirect to channels page with params
      const redirectUrl = new URL(`${baseUrl}/dashboard/platform/channels`);
      redirectUrl.searchParams.set('showCreateChannel', 'true');
      redirectUrl.searchParams.set('platform', platformId);
      redirectUrl.searchParams.set('accessToken', accessToken);
      if (typeof channelTokenResult === 'object') {
        if (channelTokenResult.refreshToken) {
          redirectUrl.searchParams.set('refreshToken', channelTokenResult.refreshToken);
        }
        if (channelTokenResult.tokenExpiresAt) {
          redirectUrl.searchParams.set('tokenExpiresAt', channelTokenResult.tokenExpiresAt);
        }
      }
      redirectUrl.searchParams.set('domain', shop ?? '');

      return NextResponse.redirect(redirectUrl.toString());

    } else {
      return NextResponse.json(
        { error: 'Invalid platform type' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      {
        error: 'OAuth callback failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
