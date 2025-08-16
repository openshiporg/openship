'use server'

import { keystoneClient } from '@/features/dashboard/lib/keystoneClient'

export interface CreateChannelPlatformInput {
  name: string
  clientId: string
  clientSecret?: string
  scopes: string[]
  redirectUri: string
  domain: string
}

export async function createChannelPlatform(data: CreateChannelPlatformInput) {
  try {
    // Create a new channel platform for OpenFront integration
    const mutation = `
      mutation CreateChannelPlatform($data: ChannelPlatformCreateInput!) {
        createChannelPlatform(data: $data) {
          id
          name
          appKey
          appSecret
          callbackUrl
        }
      }
    `

    // OpenFront integration uses built-in adapter functions
    const variables = {
      data: {
        name: data.name,
        appKey: data.clientId,
        appSecret: data.clientSecret || 'oauth-app-secret', // OpenFront manages the real secret
        
        // Built-in OpenFront adapter functions - use file path, not function names
        searchProductsFunction: 'openfront',
        getProductFunction: 'openfront', 
        searchOrdersFunction: 'openfront',
        updateProductFunction: 'openfront',
        createWebhookFunction: 'openfront',
        oAuthFunction: 'openfront',
        oAuthCallbackFunction: 'openfront',
        createOrderWebhookHandler: 'openfront',
        cancelOrderWebhookHandler: 'openfront',
        addTrackingFunction: 'openfront',
        orderLinkFunction: 'openfront',
        addCartToPlatformOrderFunction: 'openfront',
        getWebhooksFunction: 'openfront',
        deleteWebhookFunction: 'openfront',
        createPurchaseFunction: 'openfront',
        
      }
    }

    const response = await keystoneClient(mutation, variables)
    
    if (response.success && response.data?.createChannelPlatform) {
      return {
        success: true,
        data: response.data.createChannelPlatform
      }
    } else {
      return {
        success: false,
        error: response.error || 'Failed to create channel platform',
        data: null
      }
    }

  } catch (error) {
    console.error('Error creating channel platform:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}