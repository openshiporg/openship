'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Get list of channels
 */
export async function getChannels(
  where: Record<string, unknown> = {},
  take: number = 10,
  skip: number = 0,
  orderBy: Array<Record<string, string>> = [{ createdAt: 'desc' }],
  selectedFields: string = `
    id
    name
    domain
    accessToken
    metadata
    createdAt
    updatedAt
    webhooks
    platform {
      id
      name
    }
    user {
      id
      name
      email
    }
    channelItems {
      id
    }
    links {
      id
      shop {
        id
        name
      }
      filters
      rank
    }
  `
) {
  const query = `
    query GetChannels($where: ChannelWhereInput, $take: Int!, $skip: Int!, $orderBy: [ChannelOrderByInput!]) {
      items: channels(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
        ${selectedFields}
      }
      count: channelsCount(where: $where)
    }
  `;

  const response = await keystoneClient(query, { where, take, skip, orderBy });
  return response;
}

/**
 * Get a single channel by ID with full details
 */
export async function getChannel(channelId: string) {
  const query = `
    query ($id: ID!) {
      channel(where: { id: $id }) {
        id
        name
        domain
        accessToken
        metadata
        createdAt
        updatedAt
        webhooks
        platform {
          id
          name
          appKey
          appSecret
        }
        user {
          id
          name
          email
        }
        channelItems {
          id
          name
          image
          price
          quantity
          productId
          variantId
        }
        links {
          id
          shop {
            id
            name
          }
        }
      }
    }
  `;

  const cacheOptions = {
    next: {
      tags: [`channel-${channelId}`],
      revalidate: 3600, // Cache for 1 hour
    },
  };

  const response = await keystoneClient(query, { id: channelId }, cacheOptions);
  return response;
}

/**
 * Get filtered channels based on search parameters
 */
export async function getFilteredChannels(
  search: string | null = null,
  page: number = 1,
  pageSize: number = 10,
  sort: { field: string; direction: 'ASC' | 'DESC' } | null = null
) {
  const where: Record<string, unknown> = {};

  // Add search filter if provided
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
      { platform: { name: { contains: search, mode: 'insensitive' } } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;

  // Handle sorting
  const orderBy = sort
    ? [{ [sort.field]: sort.direction.toLowerCase() }]
    : [{ createdAt: 'desc' }];

  return getChannels(where, pageSize, skip, orderBy);
}

/**
 * Update channel
 */
export async function updateChannel(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateChannel($id: ID!, $data: ChannelUpdateInput!) {
      updateChannel(where: { id: $id }, data: $data) {
        id
        name
        domain
      }
    }
  `;

  const response = await keystoneClient(query, {
    id,
    data
  });

  if (response.success) {
    revalidatePath(`/dashboard/platform/channels/${id}`);
    revalidatePath('/dashboard/platform/channels');
  }

  return response;
}

/**
 * Get list of channel platforms
 */
export async function getChannelPlatforms() {
  const query = `
    query GetChannelPlatforms {
      channelPlatforms {
        id
        name
        appKey
        appSecret
        oAuthFunction
        oAuthCallbackFunction
        createdAt
        updatedAt
        channels {
          id
        }
      }
    }
  `;

  const response = await keystoneClient(query, {});
  return response;
}


/**
 * Create channel platform
 */
export async function createChannelPlatform(data: Record<string, unknown>) {
  const query = `
    mutation CreateChannelPlatform($data: ChannelPlatformCreateInput!) {
      createChannelPlatform(data: $data) {
        id
        name
      }
    }
  `;

  const response = await keystoneClient(query, { data });
  
  if (response.success) {
    revalidatePath('/dashboard/platform/channels');
  }
  
  return response;
}

/**
 * Get filtered channels with platform filter
 */
export async function getFilteredChannelsWithPlatform(
  search: string | null = null,
  platformId: string | null = null,
  page: number = 1,
  pageSize: number = 10,
  sort: { field: string; direction: 'ASC' | 'DESC' } | null = null
) {
  const where: Record<string, unknown> = {};

  // Add platform filter if provided
  if (platformId) {
    where.platform = { id: { equals: platformId } };
  }

  // Add search filter if provided
  if (search) {
    const searchConditions = [
      { name: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];

    if (platformId) {
      // If platform filter is active, combine it with search
      where.AND = [
        { platform: { id: { equals: platformId } } },
        { OR: searchConditions }
      ];
    } else {
      // If no platform filter, include platform name in search
      (searchConditions as any).push({ platform: { name: { contains: search, mode: 'insensitive' } } });
      where.OR = searchConditions;
    }
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;

  // Handle sorting
  const orderBy = sort
    ? [{ [sort.field]: sort.direction.toLowerCase() }]
    : [{ createdAt: 'desc' }];

  return getChannels(where, pageSize, skip, orderBy);
}

/**
 * Create channel
 */
export async function createChannel(data: {
  name: string;
  domain?: string;
  accessToken?: string;
  platformId: string;
  metadata?: any;
}) {
  const query = `
    mutation CreateChannel($data: ChannelCreateInput!) {
      createChannel(data: $data) {
        id
        name
        domain
        platform {
          id
          name
        }
        createdAt
      }
    }
  `;

  const channelData = {
    name: data.name,
    domain: data.domain,
    accessToken: data.accessToken,
    platform: { connect: { id: data.platformId } },
    metadata: data.metadata || {},
  };

  const response = await keystoneClient(query, { data: channelData });

  if (response.success) {
    revalidatePath('/dashboard/platform/channels');
  }

  return response;
}

/**
 * Update channel platform
 */
export async function updateChannelPlatform(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateChannelPlatform($id: ID!, $data: ChannelPlatformUpdateInput!) {
      updateChannelPlatform(where: { id: $id }, data: $data) {
        id
        name
      }
    }
  `;

  const response = await keystoneClient(query, { id, data });
  
  if (response.success) {
    revalidatePath('/dashboard/platform/channels');
  }
  
  return response;
}
