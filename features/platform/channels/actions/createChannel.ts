'use server';

import { redirect } from 'next/navigation';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";
import { handleChannelOAuth } from '../../../keystone/utils/channelProviderAdapter';
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';

export interface CreateChannelInput {
  name: string;
  domain: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  platformId: string;
}

export async function createChannel(data: CreateChannelInput) {
  const mutation = `
    mutation CreateChannel($data: ChannelCreateInput!) {
      createChannel(data: $data) {
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
      ...(data.refreshToken && { refreshToken: data.refreshToken }),
      ...(data.tokenExpiresAt && { tokenExpiresAt: data.tokenExpiresAt.toISOString() }),
      platform: { connect: { id: data.platformId } }
    }
  };

  const response = await keystoneClient(mutation, variables);
  console.log('Created channel response:', response);
  
  if (response.success && response.data?.createChannel) {
    return { success: true, channel: response.data.createChannel };
  } else {
    return { 
      success: false, 
      error: response.error || 'Failed to create channel' 
    };
  }
}

export async function initiateChannelOAuthFlow(platformId: string, domain: string) {
  // Import the state generator from the utility
  const { generateOAuthState } = await import('@/features/integrations/lib/oauth-state');
  
  // Get the platform details
  const query = `
    query GetChannelPlatform($where: ChannelPlatformWhereInput!) {
      channelPlatforms(where: $where) {
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
  
  if (!response.success || !response.data?.channelPlatforms?.[0]) {
    throw new Error('Channel platform not found');
  }
  
  const platform = response.data.channelPlatforms[0];

  if (!platform.oAuthFunction || !platform.oAuthCallbackFunction) {
    throw new Error('Platform does not support OAuth');
  }

  // Generate state parameter with platform info
  const state = await generateOAuthState(platformId, 'channel');

  // The platform object needs to have the domain from user input
  const platformWithDomain = {
    ...platform,
    domain: domain, // Use the domain entered by the user
  };

  // Call the OAuth function to get the auth URL - pass state as separate argument
  const result = await handleChannelOAuth({
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

// Alias for consistency with shops
export const initiateOAuthFlow = initiateChannelOAuthFlow;