'use server';

import { redirect } from 'next/navigation';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";
import { handleShopOAuth } from '../../../keystone/utils/shopProviderAdapter';

export interface CreateShopInput {
  name: string;
  domain: string;
  accessToken: string;
  platformId: string;
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

  const variables = {
    data: {
      name: data.name,
      domain: data.domain,
      accessToken: data.accessToken,
      platform: { connect: { id: data.platformId } }
    }
  };

  const response = await keystoneClient(mutation, variables);
  console.log('Created shop response:', response);
  
  if (response.success && response.data?.createShop) {
    return { success: true, shop: response.data.createShop };
  } else {
    return { 
      success: false, 
      error: response.errors?.[0]?.message || 'Failed to create shop' 
    };
  }
}

export async function initiateOAuthFlow(platformId: string, domain: string) {
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

  // The platform object needs to have the domain from user input
  const platformWithDomain = {
    ...platform,
    domain: domain, // Use the domain entered by the user
  };
  
  // Call the OAuth function to get the auth URL
  const result = await handleShopOAuth({
    platform: platformWithDomain,
    callbackUrl: platform.callbackUrl || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/oauth/shop/${platformId}/callback`
  });
  
  // Redirect to the OAuth URL
  if (result.authUrl) {
    redirect(result.authUrl);
  } else {
    throw new Error('Failed to get OAuth URL');
  }
}