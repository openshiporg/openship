'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Get shop webhooks
 */
export async function getShopWebhooks(shopId: string) {
  const query = `
    query GetShopWebhooks($shopId: ID!) {
      getShopWebhooks(shopId: $shopId) {
        id
        callbackUrl
        topic
      }
    }
  `;

  const response = await keystoneClient(query, { shopId });
  return response;
}

/**
 * Create shop webhook
 */
export async function createShopWebhook(shopId: string, topic: string, endpoint: string) {
  const query = `
    mutation CreateShopWebhook($shopId: ID!, $topic: String!, $endpoint: String!) {
      createShopWebhook(shopId: $shopId, topic: $topic, endpoint: $endpoint) {
        success
        error
        webhookId
      }
    }
  `;

  try {
    const response = await keystoneClient(query, { shopId, topic, endpoint });

    if (response.success) {
      revalidatePath('/dashboard/platform/shops');
    }

    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete shop webhook
 */
export async function deleteShopWebhook(shopId: string, webhookId: string) {
  const query = `
    mutation DeleteShopWebhook($shopId: ID!, $webhookId: ID!) {
      deleteShopWebhook(shopId: $shopId, webhookId: $webhookId) {
        success
        error
      }
    }
  `;

  const response = await keystoneClient(query, { shopId, webhookId });

  if (response.success) {
    revalidatePath('/dashboard/platform/shops');
  }

  return response;
}
