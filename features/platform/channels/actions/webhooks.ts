'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Get channel webhooks
 */
export async function getChannelWebhooks(channelId: string) {
  const query = `
    query GetChannelWebhooks($channelId: ID!) {
      getChannelWebhooks(channelId: $channelId) {
        id
        callbackUrl
        topic
      }
    }
  `;

  const response = await keystoneClient(query, { channelId });
  return response;
}

/**
 * Create channel webhook
 */
export async function createChannelWebhook(channelId: string, topic: string, endpoint: string) {
  const query = `
    mutation CreateChannelWebhook($channelId: ID!, $topic: String!, $endpoint: String!) {
      createChannelWebhook(channelId: $channelId, topic: $topic, endpoint: $endpoint) {
        success
        error
        webhookId
      }
    }
  `;

  const response = await keystoneClient(query, { channelId, topic, endpoint });

  if (response.success) {
    revalidatePath('/dashboard/platform/channels');
  }

  return response;
}

/**
 * Delete channel webhook
 */
export async function deleteChannelWebhook(channelId: string, webhookId: string) {
  const query = `
    mutation DeleteChannelWebhook($channelId: ID!, $webhookId: ID!) {
      deleteChannelWebhook(channelId: $channelId, webhookId: $webhookId) {
        success
        error
      }
    }
  `;

  const response = await keystoneClient(query, { channelId, webhookId });

  if (response.success) {
    revalidatePath('/dashboard/platform/channels');
  }

  return response;
}
