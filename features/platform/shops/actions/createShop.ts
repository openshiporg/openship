'use server';

import { redirect } from 'next/navigation';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";
import { handleShopOAuth } from '../../../keystone/utils/shopProviderAdapter';

export interface CreateShopInput {
  name: string;
  domain: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  platformId?: string; // Optional for marketplace flow
  platform?: { // For inline platform creation
    create: any;
  };
}

export async function createShop(data: CreateShopInput) {
  console.log('🏪 createShop action called with data:');
  console.log('  - name:', data.name);
  console.log('  - domain:', data.domain);
  console.log('  - accessToken present:', !!data.accessToken);
  console.log('  - refreshToken present:', !!data.refreshToken);
  console.log('  - refreshToken value:', data.refreshToken ? `${data.refreshToken.substring(0, 10)}...` : 'MISSING');
  console.log('  - tokenExpiresAt present:', !!data.tokenExpiresAt);
  console.log('  - tokenExpiresAt value:', data.tokenExpiresAt);
  console.log('  - platformId:', data.platformId);
  console.log('  - platform.create present:', !!data.platform?.create);
  
  const mutation = `
    mutation CreateShop($data: ShopCreateInput!) {
      createShop(data: $data) {
        id
        name
        domain
        accessToken
        refreshToken
        tokenExpiresAt
        platform {
          id
          name
        }
      }
    }
  `;

  // Handle platform connection (existing) vs creation (inline)
  let platformData;
  if (data.platformId) {
    // Existing platform - connect by ID
    console.log('🔗 Using existing platform ID:', data.platformId);
    platformData = { connect: { id: data.platformId } };
  } else if (data.platform?.create) {
    // Inline platform creation
    console.log('📦 Creating platform inline:', data.platform.create);
    platformData = { create: data.platform.create };
  } else {
    console.log('❌ No platform connection method provided');
    throw new Error('Either platformId or platform.create must be provided');
  }

  const variables: { 
    data: { 
      name: string;
      domain: string;
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt?: string;
      platform?: any;
    } 
  } = {
    data: {
      name: data.name,
      domain: data.domain,
      accessToken: data.accessToken,
    }
  };

  console.log('🔍 Building GraphQL variables:');
  console.log('  - Base variables:', JSON.stringify(variables, null, 2));

  if (data.refreshToken) {
    console.log('🔑 Adding refreshToken to variables:', data.refreshToken ? `${data.refreshToken.substring(0, 10)}...` : 'MISSING');
    variables.data.refreshToken = data.refreshToken;
  } else {
    console.log('❌ No refreshToken to add');
  }

  if (data.tokenExpiresAt) {
    console.log('⏰ Adding tokenExpiresAt to variables:', data.tokenExpiresAt);
    variables.data.tokenExpiresAt = data.tokenExpiresAt.toISOString();
  } else {
    console.log('❌ No tokenExpiresAt to add');
  }

  variables.data.platform = platformData;

  console.log('🚀 Final GraphQL variables being sent:');
  console.log(JSON.stringify(variables, null, 2));

  const response = await keystoneClient(mutation, variables);
  console.log('📨 GraphQL response received:');
  console.log('  - success:', response.success);
  console.log('  - data:', JSON.stringify(response.data, null, 2));
  console.log('  - error:', response.error);
  
  if (response.success && response.data?.createShop) {
    console.log('✅ Shop created successfully:');
    console.log('  - ID:', response.data.createShop.id);
    console.log('  - Name:', response.data.createShop.name);
    console.log('  - Domain:', response.data.createShop.domain);
    console.log('  - Has accessToken:', !!response.data.createShop.accessToken);
    console.log('  - Has refreshToken:', !!response.data.createShop.refreshToken);
    console.log('  - TokenExpiresAt:', response.data.createShop.tokenExpiresAt);
    return { success: true, shop: response.data.createShop };
  } else {
    console.log('❌ Shop creation failed:');
    console.log('  - Response success:', response.success);
    console.log('  - Response error:', response.error);
    console.log('  - Full response:', JSON.stringify(response, null, 2));
    return { 
      success: false, 
      error: response.error || 'Failed to create shop' 
    };
  }
}

export async function initiateOAuthFlow(platformId: string, domain: string) {
  // Import the state generator from the utility
  const { generateOAuthState } = await import('@/features/integrations/lib/oauth-state');
  
  // Get the platform details
  const query = `
    query GetPlatform($where: ShopPlatformWhereInput!) {
      shopPlatforms(where: $where) {
        id
        name
        appKey
        appSecret
        oAuthFunction
        oAuthCallbackFunction
        callbackUrl
      }
    }
  `;

  const response = await keystoneClient(query, { where: { id: { equals: platformId } } });
  
  if (!response.success || !response.data?.shopPlatforms?.[0]) {
    throw new Error('Platform not found');
  }
  
  const platform = response.data.shopPlatforms[0];

  if (!platform.oAuthFunction || !platform.oAuthCallbackFunction) {
    throw new Error('Platform does not support OAuth');
  }

  // Generate state parameter with platform info
  const state = await generateOAuthState(platformId, 'shop');
  
  // The platform object needs to have the domain from user input
  const platformWithDomain = {
    ...platform,
    domain: domain, // Use the domain entered by the user
    state: state, // Pass state to OAuth function
  };
  
  // Call the OAuth function to get the auth URL - use platform's callbackUrl
  const result = await handleShopOAuth({
    platform: platformWithDomain,
    callbackUrl: platform.callbackUrl || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/oauth/callback`
  });
  
  // Redirect to the OAuth URL
  if (result.authUrl) {
    redirect(result.authUrl);
  } else {
    throw new Error('Failed to get OAuth URL');
  }
}