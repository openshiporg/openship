'use server';

import { redirect } from 'next/navigation';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";
import { handleShopOAuth } from '../../../keystone/utils/shopProviderAdapter';
import { cookies } from 'next/headers';
import {
  openPendingShopOAuth,
  SHOP_OAUTH_PENDING_COOKIE,
} from '@/features/integrations/lib/oauth-pending';
import { oauthStateSecret } from '@/features/integrations/lib/oauth-secret';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';

export interface CreateShopInput {
  name: string;
  domain: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  platformId: string;
}

export async function createShop(data: CreateShopInput) {
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

  if (data.refreshToken) {
    variables.data.refreshToken = data.refreshToken;
  }

  if (data.tokenExpiresAt) {
    variables.data.tokenExpiresAt = data.tokenExpiresAt.toISOString();
  }

  variables.data.platform = { connect: { id: data.platformId } };

  const response = await keystoneClient(mutation, variables);

  if (response.success && response.data?.createShop) {
    return { success: true, shop: response.data.createShop };
  } else {
    return {
      success: false,
      error: response.error || 'Failed to create shop'
    };
  }
}

export async function completeShopOAuthConnection(name: string) {
  const cookieStore = await cookies();
  const sealedGrant = cookieStore.get(SHOP_OAUTH_PENDING_COOKIE)?.value;
  if (!sealedGrant) return { success: false, error: 'OAuth connection grant is missing or expired' };

  try {
    const pending = openPendingShopOAuth(
      sealedGrant,
      oauthStateSecret()
    );
    const result = await createShop({
      name: name.trim(),
      domain: pending.domain,
      accessToken: pending.accessToken,
      refreshToken: pending.refreshToken,
      tokenExpiresAt: pending.tokenExpiresAt ? new Date(pending.tokenExpiresAt) : undefined,
      platformId: pending.platformId,
    });
    if (result.success) cookieStore.delete(SHOP_OAUTH_PENDING_COOKIE);
    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Invalid OAuth connection grant' };
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
  };

  // Call the OAuth function to get the auth URL - pass state as separate argument
  const result = await handleShopOAuth({
    platform: platformWithDomain,
    callbackUrl: platform.callbackUrl || `${await getBaseUrl()}/api/oauth/callback`,
    state: state,
  });
  
  // Redirect to the OAuth URL
  if (result.authUrl) {
    redirect(result.authUrl);
  } else {
    throw new Error('Failed to get OAuth URL');
  }
}