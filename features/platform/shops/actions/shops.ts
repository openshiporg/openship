'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Get list of shops
 */
export async function getShops(
  where: Record<string, unknown> = {},
  take: number = 10,
  skip: number = 0,
  orderBy: Array<Record<string, string>> = [{ createdAt: 'desc' }],
  selectedFields: string = `
    id
    name
    domain
    accessToken
    linkMode
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
    orders {
      id
    }
    shopItems {
      id
    }
    links {
      id
    }
  `
) {
  const query = `
    query GetShops($where: ShopWhereInput, $take: Int!, $skip: Int!, $orderBy: [ShopOrderByInput!]) {
      items: shops(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
        ${selectedFields}
      }
      count: shopsCount(where: $where)
    }
  `;

  const response = await keystoneClient(query, { where, take, skip, orderBy });
  return response;
}

/**
 * Get a single shop by ID with full details
 */
export async function getShop(shopId: string) {
  const query = `
    query ($id: ID!) {
      shop(where: { id: $id }) {
        id
        name
        domain
        accessToken
        linkMode
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
        orders {
          id
          orderId
          orderName
          status
          totalPrice
          createdAt
        }
        shopItems {
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
          channel {
            id
            name
          }
        }
      }
    }
  `;

  const cacheOptions = {
    next: {
      tags: [`shop-${shopId}`],
      revalidate: 3600, // Cache for 1 hour
    },
  };

  const response = await keystoneClient(query, { id: shopId }, cacheOptions);
  return response;
}

/**
 * Get filtered shops based on search parameters
 */
export async function getFilteredShops(
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

  return getShops(where, pageSize, skip, orderBy);
}

/**
 * Update shop
 */
export async function updateShop(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateShop($id: ID!, $data: ShopUpdateInput!) {
      updateShop(where: { id: $id }, data: $data) {
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
    revalidatePath(`/dashboard/platform/shops/${id}`);
    revalidatePath('/dashboard/platform/shops');
  }

  return response;
}

/**
 * Get list of shop platforms
 */
export async function getShopPlatforms() {
  const query = `
    query GetShopPlatforms {
      shopPlatforms {
        id
        name
        appKey
        appSecret
        oAuthFunction
        oAuthCallbackFunction
        createdAt
        updatedAt
        shops {
          id
        }
      }
    }
  `;

  const response = await keystoneClient(query, {});
  return response;
}


/**
 * Create shop platform
 */
export async function createShopPlatform(data: Record<string, unknown>) {
  const query = `
    mutation CreateShopPlatform($data: ShopPlatformCreateInput!) {
      createShopPlatform(data: $data) {
        id
        name
      }
    }
  `;

  const response = await keystoneClient(query, { data });
  
  if (response.success) {
    revalidatePath('/dashboard/platform/shops');
  }
  
  return response;
}

/**
 * Update shop platform
 */
export async function updateShopPlatform(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateShopPlatform($id: ID!, $data: ShopPlatformUpdateInput!) {
      updateShopPlatform(where: { id: $id }, data: $data) {
        id
        name
      }
    }
  `;

  const response = await keystoneClient(query, { id, data });
  
  if (response.success) {
    revalidatePath('/dashboard/platform/shops');
  }
  
  return response;
}

/**
 * Get filtered shops with platform filter
 */
export async function getFilteredShopsWithPlatform(
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
      searchConditions.push({ platform: { name: { contains: search, mode: 'insensitive' } } });
      where.OR = searchConditions;
    }
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;

  // Handle sorting
  const orderBy = sort
    ? [{ [sort.field]: sort.direction.toLowerCase() }]
    : [{ createdAt: 'desc' }];

  return getShops(where, pageSize, skip, orderBy);
}

/**
 * Create shop
 */
export async function createShop(data: {
  name: string;
  domain?: string;
  accessToken?: string;
  platformId: string;
  linkMode?: string;
  metadata?: any;
}) {
  const query = `
    mutation CreateShop($data: ShopCreateInput!) {
      createShop(data: $data) {
        id
        name
        domain
        platform {
          id
          name
        }
        linkMode
        createdAt
      }
    }
  `;

  const shopData = {
    name: data.name,
    domain: data.domain,
    accessToken: data.accessToken,
    platform: { connect: { id: data.platformId } },
    linkMode: data.linkMode || "sequential",
    metadata: data.metadata || {},
  };

  const response = await keystoneClient(query, { data: shopData });

  if (response.success) {
    revalidatePath('/dashboard/platform/shops');
  }

  return response;
}
