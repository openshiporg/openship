'use server';

import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getChannels(): Promise<ApiResponse> {
  try {
    const query = `
      query GetChannels {
        channels(take: 50) {
          id
          name
        }
      }
    `;
    
    const response = await keystoneClient(query);
    console.log('RAW KEYSTONE RESPONSE:', JSON.stringify(response, null, 2));
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    const channels = response.success ? (response.data?.channels || []) : [];
    console.log('EXTRACTED CHANNELS:', JSON.stringify(channels, null, 2));
    
    return { success: true, data: { channels } };
  } catch (error: any) {
    console.error('CHANNELS ERROR:', error);
    return { success: false, error: error.message };
  }
}

export async function getShopLinks(shopId: string): Promise<ApiResponse> {
  try {
    const query = `
      query GetShopLinks($shopId: ID!) {
        links(where: { shop: { id: { equals: $shopId } } }) {
          id
          channel {
            id
            name
          }
          filters
          createdAt
        }
      }
    `;
    
    const response = await keystoneClient(query, { shopId });
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    return { success: true, data: { links: response.success ? (response.data?.links || []) : [] } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createShopLink(shopId: string, channelId: string, filters?: any): Promise<ApiResponse> {
  try {
    const mutation = `
      mutation CreateLink($data: LinkCreateInput!) {
        createLink(data: $data) {
          id
          channel {
            id
            name
          }
          filters
        }
      }
    `;
    
    const response = await keystoneClient(mutation, {
      data: {
        shop: { connect: { id: shopId } },
        channel: { connect: { id: channelId } },
        filters: filters || {}
      }
    });
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateShopLink(linkId: string, filters: any): Promise<ApiResponse> {
  try {
    const mutation = `
      mutation UpdateLink($where: LinkWhereUniqueInput!, $data: LinkUpdateInput!) {
        updateLink(where: $where, data: $data) {
          id
          channel {
            id
            name
          }
          filters
        }
      }
    `;
    
    const response = await keystoneClient(mutation, {
      where: { id: linkId },
      data: { filters }
    });
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteShopLink(linkId: string): Promise<ApiResponse> {
  try {
    const mutation = `
      mutation DeleteLink($where: LinkWhereUniqueInput!) {
        deleteLink(where: $where) {
          id
        }
      }
    `;
    
    const response = await keystoneClient(mutation, {
      where: { id: linkId }
    });
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
