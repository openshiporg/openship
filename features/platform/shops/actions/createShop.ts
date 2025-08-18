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
  const mutation = `
    mutation CreateShop($data: ShopCreateInput!) {
      createShop(data: $data) {
        id
        name
        domain
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
    platformData = { connect: { id: data.platformId } };
  } else if (data.platform?.create) {
    // Inline platform creation
    platformData = { create: data.platform.create };
  } else {
    throw new Error('Either platformId or platform.create must be provided');
  }

  const variables = {
    data: {
      name: data.name,
      domain: data.domain,
      accessToken: data.accessToken,
      ...(data.refreshToken && { refreshToken: data.refreshToken }),
      ...(data.tokenExpiresAt && { tokenExpiresAt: data.tokenExpiresAt.toISOString() }),
      platform: platformData
    }
  };

  const response = await keystoneClient(mutation, variables);
  console.log('Created shop response:', response);
  
  if (response.success && response.data?.createShop) {
    return { success: true, shop: response.data.createShop };
  } else {
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