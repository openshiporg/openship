import { NextRequest, NextResponse } from 'next/server';
import { keystoneContext } from '@/features/keystone/context';
import { handleShopOAuthCallback } from '@/features/integrations/shop/lib/executor';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    console.log('🔴 REVERSE CALLBACK: Raw URL:', request.url);
    console.log('🔴 REVERSE CALLBACK: All search params:', Object.fromEntries(searchParams.entries()));
    
    // Get OAuth parameters  
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const shop = searchParams.get('shop'); // OpenFront domain
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    console.log('🔴 REVERSE CALLBACK: Basic params - code:', !!code, 'state:', !!state, 'shop:', !!shop);
    
    // Parse app details from state parameter
    let clientId, clientSecret, appName;
    if (state) {
      console.log('🔴 REVERSE CALLBACK: Attempting to parse state:', state);
      try {
        const stateData = JSON.parse(state);
        console.log('🔴 REVERSE CALLBACK: Parsed state data:', stateData);
        clientId = stateData.clientId;
        clientSecret = stateData.clientSecret;
        appName = stateData.appName;
        console.log('🔴 REVERSE CALLBACK: Extracted - clientId:', !!clientId, 'clientSecret:', !!clientSecret, 'appName:', appName);
      } catch (e) {
        console.error('🔴 REVERSE CALLBACK: Failed to parse state JSON:', e);
        return NextResponse.json(
          { error: 'Invalid state parameter - could not parse app details' },
          { status: 400 }
        );
      }
    } else {
      console.log('🔴 REVERSE CALLBACK: No state parameter provided');
    }
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return NextResponse.json(
        { error: error, description: errorDescription },
        { status: 400 }
      );
    }
    
    if (!code || !shop) {
      return NextResponse.json(
        { error: 'Missing required parameters: code or shop' },
        { status: 400 }
      );
    }
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing app details in state parameter: clientId or clientSecret' },
        { status: 400 }
      );
    }

    console.log('🚀 REVERSE CALLBACK: Processing reverse OAuth flow');
    console.log('🚀 Code:', code);
    console.log('🚀 Shop (OpenFront domain):', shop);
    console.log('🚀 Raw State:', state);
    console.log('🚀 Parsed Client ID:', clientId);
    console.log('🚀 Parsed Client Secret:', clientSecret ? '[PRESENT]' : '[MISSING]');
    console.log('🚀 Parsed App Name:', appName);
    
    const baseUrl = await getBaseUrl();
    
    try {
      
      // Step 1: Check if platform already exists with this client_id
      let platform = null;
      
      try {
        const existingPlatforms = await keystoneContext.sudo().query.ShopPlatform.findMany({
          where: { appKey: { equals: clientId } },
          query: `
            id
            name
            appKey
            appSecret
            oAuthCallbackFunction
          `,
          take: 1
        });
        
        if (existingPlatforms.length > 0) {
          platform = existingPlatforms[0];
          console.log('✅ Found existing platform:', platform.name);
        }
      } catch (error) {
        console.log('⚠️ Error checking for existing platform:', error);
      }
      
      // Step 2: Create platform if it doesn't exist
      if (!platform) {
        console.log('📦 Creating new platform for:', appName);
        
        try {
          platform = await keystoneContext.sudo().query.ShopPlatform.createOne({
            data: {
              name: `${appName} (Auto-created)`,
              appKey: clientId,
              appSecret: clientSecret,
              
              // Built-in OpenFront adapter functions - use file path, not function names
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
            query: `id name appKey appSecret oAuthCallbackFunction`,
          });
          
          console.log('✅ Created new platform:', platform.name);
        } catch (error) {
          console.error('❌ Failed to create platform:', error);
          return NextResponse.json(
            { error: 'Failed to create platform', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
          );
        }
      }
      
      // Step 3: Exchange code for access token using the platform
      let accessToken;
      try {
        accessToken = await handleShopOAuthCallback({
          platform,
          code,
          shop,
          state: state || 'reverse-oauth-flow',
          appKey: platform.appKey,
          appSecret: platform.appSecret,
          redirectUri: `${baseUrl}/api/oauth/reverse-callback`,
        });
        
        console.log('✅ Got access token from OAuth exchange');
      } catch (error) {
        console.error('❌ Failed to exchange OAuth code:', error);
        return NextResponse.json(
          { error: 'Failed to exchange OAuth code', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
      
      // Step 4: Determine app type and redirect accordingly
      let redirectPath = '/dashboard/platform/shops';
      let paramName = 'showCreateShopAndPlatform';
      
      // Check if this is a channel app based on app name or metadata
      if (appName && (appName.toLowerCase().includes('channel') || appName.toLowerCase().includes('fulfillment'))) {
        redirectPath = '/dashboard/platform/channels';
        paramName = 'showCreateChannelAndPlatform';
      }
      
      const redirectUrl = new URL(`${baseUrl}${redirectPath}`);
      redirectUrl.searchParams.set(paramName, 'true');
      redirectUrl.searchParams.set('client_id', platform.appKey);
      redirectUrl.searchParams.set('client_secret', platform.appSecret);
      redirectUrl.searchParams.set('app_name', platform.name);
      redirectUrl.searchParams.set('accessToken', accessToken);
      redirectUrl.searchParams.set('domain', shop);
      
      console.log('🔄 Redirecting to shops page for reverse OAuth completion');
      return NextResponse.redirect(redirectUrl.toString());
      
    } catch (error) {
      console.error('❌ Reverse OAuth flow failed:', error);
      return NextResponse.json(
        { 
          error: 'Reverse OAuth failed', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('OAuth reverse callback error:', error);
    return NextResponse.json(
      { 
        error: 'OAuth reverse callback failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}