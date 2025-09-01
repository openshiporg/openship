import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleShopOAuthCallback } from '@/features/integrations/shop/lib/executor';
import { handleChannelOAuthCallback } from '@/features/integrations/channel/lib/executor';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';
import crypto from 'crypto';

// Self-contained signed state parameters (industry standard)
const SECRET_KEY = process.env.OAUTH_STATE_SECRET || 'openship-oauth-secret-key';

async function generateOAuthState(platformId: string, type: 'shop' | 'channel'): Promise<string> {
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

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 OAuth callback endpoint called');
    console.log('🔍 Request URL:', request.url);
    
    const { searchParams } = new URL(request.url);
    
    // Get OAuth parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const shop = searchParams.get('shop'); // Domain from OpenFront
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Check for simplified auto-create flow
    const autoCreate = searchParams.get('auto_create') === 'true';
    const appName = searchParams.get('app_name');
    const clientId = searchParams.get('client_id');

    console.log('🔍 OAuth callback parameters:');
    console.log('  - code:', code ? `${code.substring(0, 10)}...` : 'MISSING');
    console.log('  - state:', state ? `${state.substring(0, 20)}...` : 'MISSING');
    console.log('  - shop:', shop);
    console.log('  - error:', error);
    console.log('  - errorDescription:', errorDescription);
    console.log('  - autoCreate:', autoCreate);
    console.log('  - appName:', appName);
    console.log('  - clientId:', clientId);
    
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
    
    console.log('🔵 CALLBACK: Received state parameter:', state);
    
    // Simplified auto-create flow is handled by marketplace flow instead
    
    // Decode and validate state (handle both base64 and JSON formats)
    let signedState;
    try {
      // First try to parse as direct JSON (marketplace flow from OpenFront)
      try {
        signedState = JSON.parse(state);
        console.log('🔵 CALLBACK: Parsed state as direct JSON:', signedState);
      } catch {
        // If that fails, try base64 decoding (original flow from OpenShip)
        const decoded = Buffer.from(state, 'base64').toString();
        console.log('🔵 CALLBACK: Decoded state string from base64:', decoded);
        signedState = JSON.parse(decoded);
        console.log('🔵 CALLBACK: Parsed signed state from base64:', signedState);
      }
    } catch (e) {
      console.error('🔴 CALLBACK: Failed to decode state:', e);
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }
    
    // Handle different state formats
    let stateData;
    
    if (signedState.type === 'marketplace') {
      // Marketplace flow - state is already the data we need
      console.log('🔵 CALLBACK: Detected marketplace flow');
      stateData = signedState;
    } else {
      // Original OpenShip flow - has payload and signature
      console.log('🔵 CALLBACK: Detected original OpenShip flow');
      const { payload, signature } = signedState;
      
      // Verify signature
      const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
      if (signature !== expectedSignature) {
        console.error('🔴 CALLBACK: Invalid state signature');
        return NextResponse.json(
          { error: 'Invalid state signature' },
          { status: 400 }
        );
      }
      
      // Parse verified payload
      try {
        stateData = JSON.parse(payload);
        console.log('🔵 CALLBACK: Verified state data:', stateData);
      } catch (e) {
        console.error('🔴 CALLBACK: Failed to parse payload:', e);
        return NextResponse.json(
          { error: 'Invalid state payload' },
          { status: 400 }
        );
      }
    }
    
    console.log('🔵 CALLBACK: State verified successfully');
    
    // Handle marketplace flow - exchange code for tokens then redirect
    if (stateData.type === 'marketplace') {
      console.log('🔵 CALLBACK: Processing marketplace flow - exchanging code for tokens');
      
      // Create minimal platform object for adapter
      const marketplacePlatform = {
        domain: shop,
        accessToken: '', // Will be set after OAuth exchange
        appKey: stateData.client_id,
        appSecret: stateData.client_secret,
        oAuthCallbackFunction: stateData.adapter_slug // Use dynamic adapter slug
      };
      
      // Determine app type for proper OAuth handler
      const marketplaceAppType = stateData.app_type || 'shop'; // Default to shop for backward compatibility
      
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
      
      console.log('🔍 Token exchange result type:', typeof tokenResult);
      console.log('🔍 Token exchange result:', typeof tokenResult === 'string' ? `${tokenResult.substring(0, 10)}...` : tokenResult);
      
      // Handle both old string format and new object format
      let accessToken, refreshToken, tokenExpiresAt;
      if (typeof tokenResult === 'string') {
        console.log('📝 Using legacy string token format');
        accessToken = tokenResult;
      } else {
        console.log('📝 Using new object token format');
        // OpenFront returns camelCase field names
        accessToken = tokenResult.accessToken;
        refreshToken = tokenResult.refreshToken;
        tokenExpiresAt = tokenResult.tokenExpiresAt;
        console.log('🔑 Token details:');
        console.log('  - accessToken present:', !!accessToken);
        console.log('  - refreshToken present:', !!refreshToken);
        console.log('  - tokenExpiresAt present:', !!tokenExpiresAt);
      }
      
      const baseUrl = await getBaseUrl();
      
      // Determine redirect URL based on app type
      const redirectAppType = stateData.app_type || 'shop'; // Default to shop for backward compatibility
      const endpoint = redirectAppType === 'channel' ? 'channels' : 'shops';
      const createParam = redirectAppType === 'channel' ? 'showCreateChannel' : 'showCreateShop';
      
      console.log('🎯 Building redirect URL:');
      console.log('  - baseUrl:', baseUrl);
      console.log('  - redirectAppType:', redirectAppType);
      console.log('  - endpoint:', endpoint);
      console.log('  - createParam:', createParam);
      
      const redirectUrl = new URL(`${baseUrl}/dashboard/platform/${endpoint}`);
      redirectUrl.searchParams.set(createParam, 'true');
      redirectUrl.searchParams.set('domain', shop ?? '');
      redirectUrl.searchParams.set('accessToken', accessToken);
      redirectUrl.searchParams.set('client_id', stateData.client_id);
      redirectUrl.searchParams.set('client_secret', stateData.client_secret);
      redirectUrl.searchParams.set('app_name', stateData.app_name);
      redirectUrl.searchParams.set('adapter_slug', stateData.adapter_slug);
      
      console.log('🔑 Adding optional tokens to redirect:');
      if (refreshToken) {
        console.log('  - Adding refreshToken to URL params');
        redirectUrl.searchParams.set('refreshToken', refreshToken);
      } else {
        console.log('  - No refreshToken to add');
      }
      if (tokenExpiresAt) {
        console.log('  - Adding tokenExpiresAt to URL params:', tokenExpiresAt);
        // tokenExpiresAt is already a string from OpenFront adapter
        redirectUrl.searchParams.set('tokenExpiresAt', tokenExpiresAt);
      } else {
        console.log('  - No tokenExpiresAt to add');
      }
      
      console.log('🎯 Final redirect URL:', redirectUrl.toString());
      
      return NextResponse.redirect(redirectUrl.toString());
    }
    
    // Handle original OpenShip flow
    const { platformId, type, timestamp } = stateData;
    
    // Check if state is expired (10 minutes max)
    const maxAge = 10 * 60 * 1000; // 10 minutes
    if (Date.now() - timestamp > maxAge) {
      console.error('🔴 CALLBACK: State expired. Age:', Date.now() - timestamp, 'ms');
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
        redirectUri: `${baseUrl}/api/oauth/callback`, // Single callback URL
      });
      
      // Handle both old string format and new object format for backward compatibility
      if (typeof tokenResult === 'string') {
        // Legacy format - just access token
        accessToken = tokenResult;
      } else {
        // New format - object with both tokens
        accessToken = tokenResult.accessToken;
      }
      
      // Redirect to shops page with params
      const redirectUrl = new URL(`${baseUrl}/dashboard/platform/shops`);
      redirectUrl.searchParams.set('showCreateShop', 'true');
      redirectUrl.searchParams.set('platform', platformId);
      redirectUrl.searchParams.set('accessToken', accessToken);
      if (typeof tokenResult === 'object') {
        // Include additional token data for new implementations
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
        redirectUri: `${baseUrl}/api/oauth/callback`, // Single callback URL
      });
      
      // Handle both old string format and new object format for backward compatibility
      if (typeof channelTokenResult === 'string') {
        // Legacy format - just access token
        accessToken = channelTokenResult;
      } else {
        // New format - object with both tokens
        accessToken = channelTokenResult.accessToken;
      }
      
      // Redirect to channels page with params
      const redirectUrl = new URL(`${baseUrl}/dashboard/platform/channels`);
      redirectUrl.searchParams.set('showCreateChannel', 'true');
      redirectUrl.searchParams.set('platform', platformId);
      redirectUrl.searchParams.set('accessToken', accessToken);
      if (typeof channelTokenResult === 'object') {
        // Include additional token data for new implementations
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

