'use server'

import { keystoneContext } from '@/features/keystone/context'

export async function getShopPlatformByClientId(clientId: string) {
  try {
    const context = keystoneContext
    
    // Query for shop platform with matching OAuth app client_id stored in appKey
    // OpenFront platforms store the client_id as appKey  
    const platforms = await context.query.ShopPlatform.findMany({
      where: {
        appKey: {
          equals: clientId
        }
      },
      take: 1
    })

    if (platforms.length > 0) {
      return {
        success: true,
        data: platforms[0]
      }
    }

    return {
      success: false,
      data: null
    }

  } catch (error) {
    console.error('Error getting shop platform by client_id:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }
  }
}