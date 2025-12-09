'use server';

import { redirect } from 'next/navigation';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";
import { handleChannelOAuth } from '../../../keystone/utils/channelProviderAdapter';

export interface CreateChannelInput {
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
    callbackUrl: platform.callbackUrl || `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/oauth/callback`,
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