'use server';

import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getShops(): Promise<ApiResponse> {
  try {
    const query = `
      query GetShops {
        shops(take: 50) {
          id
          name
        }
      }
    `;
    
    const response = await keystoneClient(query);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    const shops = response.shops || response.data?.shops || [];
    
    return { success: true, data: { shops } };
  } catch (error: any) {
    console.error('SHOPS ERROR:', error);
    return { success: false, error: error.message };
  }
}

export async function getChannelLinks(channelId: string): Promise<ApiResponse> {
  try {
    const query = `
      query GetChannelLinks {
        links {
          id
          shop {
            id
            name
          }
          filters
          rank
          createdAt
        }
      }
    `;
    
    const response = await keystoneClient(query);
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    return { success: true, data: { links: response.links || [] } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createChannelLink(channelId: string, shopId: string, filters?: any): Promise<ApiResponse> {
  try {
    const mutation = `
      mutation CreateLink($data: LinkCreateInput!) {
        createLink(data: $data) {
          id
          shop {
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

export async function updateChannelLink(linkId: string, data: { filters?: any; rank?: number }): Promise<ApiResponse> {
  try {
    const mutation = `
      mutation UpdateLink($where: LinkWhereUniqueInput!, $data: LinkUpdateInput!) {
        updateLink(where: $where, data: $data) {
          id
          shop {
            id
            name
          }
          filters
          rank
        }
      }
    `;
    
    const response = await keystoneClient(mutation, {
      where: { id: linkId },
      data
    });
    
    if (response.error) {
      return { success: false, error: response.error };
    }
    
    return { success: true, data: response };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteChannelLink(linkId: string): Promise<ApiResponse> {
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
