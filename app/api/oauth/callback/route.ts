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
    
    // Handle simplified auto-create flow
    if (autoCreate && clientId && shop) {
      console.log('🚀 SIMPLIFIED FLOW: Auto-creating platform and shop');
      return await handleAutoCreateFlow({
        code,
        shop,
        clientId,
        appName: appName || 'OpenFront Store',
        request
      });
    }
    
    // Decode and validate signed state (original flow)
    let signedState;
    try {
      const decoded = Buffer.from(state, 'base64').toString();
      console.log('🔵 CALLBACK: Decoded state string:', decoded);
      signedState = JSON.parse(decoded);
      console.log('🔵 CALLBACK: Parsed signed state:', signedState);
    } catch (e) {
      console.error('🔴 CALLBACK: Failed to decode state:', e);
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }
    
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
    let stateData;
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
    
    console.log('🔵 CALLBACK: State verified successfully');
    
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
      
      // Exchange code for access token
      accessToken = await handleShopOAuthCallback({
        platform,
        code,
        shop: shop || undefined,
        state,
        appKey: platform.appKey,
        appSecret: platform.appSecret,
        redirectUri: `${baseUrl}/api/oauth/callback`, // Single callback URL
      });
      
      // Redirect to shops page with params
      const redirectUrl = new URL(`${baseUrl}/dashboard/platform/shops`);
      redirectUrl.searchParams.set('showCreateShop', 'true');
      redirectUrl.searchParams.set('platform', platformId);
      redirectUrl.searchParams.set('accessToken', accessToken);
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
      accessToken = await handleChannelOAuthCallback({
        platform,
        code,
        shop: shop || undefined,
        state,
        appKey: platform.appKey,
        appSecret: platform.appSecret,
        redirectUri: `${baseUrl}/api/oauth/callback`, // Single callback URL
      });
      
      // Redirect to channels page with params
      const redirectUrl = new URL(`${baseUrl}/dashboard/platform/channels`);
      redirectUrl.searchParams.set('showCreateChannel', 'true');
      redirectUrl.searchParams.set('platform', platformId);
      redirectUrl.searchParams.set('accessToken', accessToken);
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

// Handle simplified auto-create flow from OpenFront
async function handleAutoCreateFlow({
  code,
  shop,
  clientId,
  appName,
  request
}: {
  code: string;
  shop: string;
  clientId: string;
  appName: string;
  request: NextRequest;
}) {
  try {
    console.log('🚀 AUTO-CREATE: Starting simplified flow');
    console.log('🚀 Shop domain:', shop);
    console.log('🚀 Client ID:', clientId);
    console.log('🚀 App name:', appName);
    
    const baseUrl = await getBaseUrl();
    
    // Step 1: Fetch client secret from OpenFront
    let clientSecret;
    try {
      const appDetailsUrl = `${shop}/api/oauth/app-details`;
      const response = await fetch(appDetailsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId })
      });
      
      if (response.ok) {
        const appDetails = await response.json();
        clientSecret = appDetails.client_secret;
        console.log('✅ Retrieved client secret from OpenFront');
      } else {
        console.log('⚠️ Could not fetch client secret, using placeholder');
        clientSecret = 'auto-generated-placeholder';
      }
    } catch (error) {
      console.log('⚠️ Error fetching client secret:', error);
      clientSecret = 'auto-generated-placeholder';
    }
    
    // Step 2: Auto-create shop platform
    const platformName = `${appName} (Auto-created)`;
    const platform = await keystoneContext.sudo().query.ShopPlatform.createOne({
      data: {
        name: platformName,
        appKey: clientId,
        appSecret: clientSecret,
        // OpenFront adapter functions
        searchProductsFunction: 'openfront',
        getProductFunction: 'openfront', 
        searchOrdersFunction: 'openfront',
        updateProductFunction: 'openfront',
        createWebhookFunction: 'openfront',
        oAuthFunction: 'openfront',
        oAuthCallbackFunction: 'openfront',
        createOrderWebhookHandler: 'openfront',
        cancelOrderWebhookHandler: 'openfront',
        addTrackingFunction: 'openfront',
        orderLinkFunction: 'openfront',
        addCartToPlatformOrderFunction: 'openfront',
        getWebhooksFunction: 'openfront',
        deleteWebhookFunction: 'openfront',
      },
      query: `id name appKey appSecret`,
    });
    
    console.log('✅ Auto-created platform:', platform.name);
    
    // Step 3: Exchange OAuth code for access token
    const accessToken = await handleShopOAuthCallback({
      platform,
      code,
      shop: shop || undefined,
      state: 'auto-create-flow',
      appKey: platform.appKey,
      appSecret: platform.appSecret,
      redirectUri: `${baseUrl}/api/oauth/callback`
    });
    
    console.log('✅ Got access token from OAuth exchange');
    
    // Step 4: Auto-create shop instance
    const shopName = shop.replace(/^https?:\/\//, '').replace(/\/$/, '').split('.')[0] + ' Store';
    const shopInstance = await keystoneContext.sudo().query.Shop.createOne({
      data: {
        name: shopName,
        domain: shop,
        accessToken: accessToken,
        platform: { connect: { id: platform.id } },
      },
      query: `id name domain`,
    });
    
    console.log('✅ Auto-created shop:', shopInstance.name);
    
    // Step 5: Redirect to success page
    const redirectUrl = new URL(`${baseUrl}/dashboard/platform/shops`);
    redirectUrl.searchParams.set('created', 'true');
    redirectUrl.searchParams.set('shop_id', shopInstance.id);
    redirectUrl.searchParams.set('platform_id', platform.id);
    
    console.log('🔄 Redirecting to shops page with success');
    return NextResponse.redirect(redirectUrl.toString());
    
  } catch (error) {
    console.error('❌ Auto-create flow failed:', error);
    return NextResponse.json(
      { 
        error: 'Auto-create failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}