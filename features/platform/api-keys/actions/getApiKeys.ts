'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";
import { generateApiKeyTokenSync } from "@/features/keystone/lib/crypto-utils";

export interface ApiKey {
  id: string;
  name: string;
  tokenPreview: string;
  scopes: string[];
  status: string;
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount?: { total: number; daily: Record<string, number> };
  restrictedToIPs?: string[];
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

/**
 * Get list of API keys
 */
export async function getApiKeys(
  where: Record<string, unknown> = {},
  take: number = 10,
  skip: number = 0,
  orderBy: Array<Record<string, string>> = [{ createdAt: 'desc' }],
  selectedFields: string = `
    id
    name
    tokenPreview
    scopes
    status
    expiresAt
    lastUsedAt
    usageCount
    restrictedToIPs
    createdAt
    updatedAt
    user {
      id
      name
      email
    }
  `
) {
  const query = `
    query GetApiKeys($where: ApiKeyWhereInput, $take: Int!, $skip: Int!, $orderBy: [ApiKeyOrderByInput!]) {
      items: apiKeys(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
        ${selectedFields}
      }
      count: apiKeysCount(where: $where)
    }
  `;

  const response = await keystoneClient(query, { where, take, skip, orderBy });
  return response;
}

/**
 * Get a single API key by ID with full details
 */
export async function getApiKey(apiKeyId: string) {
  const query = `
    query ($id: ID!) {
      apiKey(where: { id: $id }) {
        id
        name
        tokenPreview
        scopes
        status
        expiresAt
        lastUsedAt
        usageCount
        restrictedToIPs
        createdAt
        updatedAt
        user {
          id
          name
          email
        }
      }
    }
  `;

  const cacheOptions = {
    next: {
      tags: [`apiKey-${apiKeyId}`],
      revalidate: 3600, // Cache for 1 hour
    },
  };

  try {
    const response = await keystoneClient(query, { id: apiKeyId }, cacheOptions);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

/**
 * Create API key
 */
export async function createApiKey(data: {
  name: string;
  scopes: string[];
  expiresAt?: string;
  tokenSecret: string;
}) {
  const query = `
    mutation CreateApiKey($data: ApiKeyCreateInput!) {
      createApiKey(data: $data) {
        id
        name
        tokenPreview
        scopes
        status
        expiresAt
        lastUsedAt
        usageCount
        restrictedToIPs
        createdAt
        updatedAt
        user {
          id
          name
          email
        }
      }
    }
  `;

  // Create preview from the token (first 8 chars + "...")
  const tokenPreview = data.tokenSecret.substring(0, 12) + "...";

  const apiKeyData = {
    name: data.name,
    scopes: data.scopes,
    expiresAt: data.expiresAt,
    tokenSecret: data.tokenSecret,
    tokenPreview,
  };

  try {
    const response = await keystoneClient(query, { data: apiKeyData });
    
    if (response.success && response.data?.createApiKey) {
      revalidatePath('/dashboard/platform/api-keys');
      
      return {
        success: true,
        data: response.data.createApiKey
      };
    } else {
      return {
        success: false,
        error: response.error || 'Failed to create API key',
        data: null
      };
    }
  } catch (error) {
    console.error('Error creating API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

/**
 * Update API key
 */
export async function updateApiKey(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateApiKey($id: ID!, $data: ApiKeyUpdateInput!) {
      updateApiKey(where: { id: $id }, data: $data) {
        id
        name
        status
      }
    }
  `;

  try {
    const response = await keystoneClient(query, { id, data });
    
    if (response.success) {
      revalidatePath(`/dashboard/platform/api-keys/${id}`);
      revalidatePath('/dashboard/platform/api-keys');
      return {
        success: true,
        data: response.data?.updateApiKey
      };
    } else {
      return {
        success: false,
        error: response.error || 'Failed to update API key',
        data: null
      };
    }
  } catch (error) {
    console.error('Error updating API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

/**
 * Delete API key
 */
export async function deleteApiKey(id: string) {
  const query = `
    mutation DeleteApiKey($id: ID!) {
      deleteApiKey(where: { id: $id }) {
        id
      }
    }
  `;

  try {
    const response = await keystoneClient(query, { id });
    
    if (response.success) {
      revalidatePath('/dashboard/platform/api-keys');
      return {
        success: true,
        data: response.data?.deleteApiKey
      };
    } else {
      return {
        success: false,
        error: response.error || 'Failed to delete API key',
        data: null
      };
    }
  } catch (error) {
    console.error('Error deleting API key:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}