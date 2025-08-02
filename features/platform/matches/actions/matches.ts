'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

// Interface for match data
interface Match {
  id: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Get list of matches
 */
export async function getMatches(
  where: Record<string, unknown> = {},
  take: number = 10,
  skip: number = 0,
  orderBy: Array<Record<string, string>> = [{ createdAt: 'desc' }],
  selectedFields: string = `
    id
    outputPriceChanged
    inventoryNeedsToBeSynced {
      syncEligible
      sourceQuantity
      targetQuantity
      syncNeeded
    }
    input {
      id
      productId
      variantId
      lineItemId
      quantity
      externalDetails {
        image
        title
        productId
        variantId
        price
        availableForSale
        productLink
        inventory
        inventoryTracked
        error
      }
      shop {
        id
        name
        domain
      }
    }
    output {
      id
      productId
      variantId
      lineItemId
      quantity
      price
      priceChanged
      externalDetails {
        image
        title
        productId
        variantId
        price
        availableForSale
        productLink
        inventory
        inventoryTracked
        error
      }
      channel {
        id
        name
        domain
      }
    }
    user {
      id
      name
      email
    }
    createdAt
    updatedAt
  `
) {
  const query = `
    query GetMatches($where: MatchWhereInput, $take: Int!, $skip: Int!, $orderBy: [MatchOrderByInput!]) {
      items: matches(where: $where, take: $take, skip: $skip, orderBy: $orderBy) {
        ${selectedFields}
      }
      count: matchesCount(where: $where)
    }
  `;

  const response = await keystoneClient(query, { where, take, skip, orderBy });
  
  if (!response.success) {
    throw new Error(response.error);
  }

  return response.data;
}

/**
 * Get filtered matches based on search parameters
 */
export async function getFilteredMatches(
  search: string | null = null,
  page: number = 1,
  pageSize: number = 10,
  sort: { field: string; direction: 'ASC' | 'DESC' } | null = null
) {
  const where: Record<string, unknown> = {};

  // Add search filter if provided
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;

  // Handle sorting
  const orderBy = sort
    ? [{ [sort.field]: sort.direction.toLowerCase() }]
    : [{ createdAt: 'desc' }];

  try {
    const data = await getMatches(where, pageSize, skip, orderBy);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sync inventory for matches
 */
export async function syncInventory(matchIds: string[]) {
  try {
    // Get matches with inventory data
    const matchesQuery = `
      query GetMatchesForSync($ids: [ID!]!) {
        matches(where: { id: { in: $ids } }) {
          id
          input {
            id
            quantity
            productId
            variantId
            shop {
              id
            }
          }
          inventoryNeedsToBeSynced {
            syncEligible
            sourceQuantity
            targetQuantity
            syncNeeded
          }
        }
      }
    `;
    
    const matchesResponse = await keystoneClient(matchesQuery, { ids: matchIds });
    
    if (!matchesResponse.success) {
      return { success: false, error: "Failed to fetch matches" };
    }

    const matches = matchesResponse.data?.matches || [];
    const syncPromises = [];

    // For each match that needs inventory sync
    for (const match of matches) {
      const inventoryData = match.inventoryNeedsToBeSynced;
      
      if (inventoryData?.syncEligible && inventoryData?.syncNeeded) {
        // Calculate inventory delta (difference between target and source)
        const inventoryDelta = inventoryData.targetQuantity - inventoryData.sourceQuantity;
        
        // Update each shop product in the match
        for (const shopItem of match.input) {
          const updateQuery = `
            mutation UpdateShopProduct(
              $shopId: ID!, 
              $variantId: ID!, 
              $productId: ID!, 
              $inventoryDelta: Int
            ) {
              updateShopProduct(
                shopId: $shopId, 
                variantId: $variantId, 
                productId: $productId, 
                inventoryDelta: $inventoryDelta
              ) {
                success
                error
                updatedVariant {
                  price
                  inventory
                }
              }
            }
          `;
          
          syncPromises.push(
            keystoneClient(updateQuery, {
              shopId: shopItem.shop.id,
              variantId: shopItem.variantId,
              productId: shopItem.productId,
              inventoryDelta: inventoryDelta
            })
          );
        }
      }
    }

    // Execute all sync operations
    const results = await Promise.allSettled(syncPromises);
    
    // Check for any failures
    const failures = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.success)
    );

    if (failures.length > 0) {
      return { 
        success: false, 
        error: `Failed to sync ${failures.length} out of ${results.length} items` 
      };
    }

    revalidatePath(`/dashboard/platform/matches`);
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new match
 */
export async function createMatch(data: Record<string, unknown>) {
  const query = `
    mutation CreateMatch($data: MatchCreateInput!) {
      createMatch(data: $data) {
        id
        input
        output
        createdAt
      }
    }
  `;
  const response = await keystoneClient(query, { data });
  if (response.success) {
    revalidatePath(`/dashboard/platform/matches`);
  }
  return response;
}


/**
 * Update a match
 */
export async function updateMatch(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateMatch($where: MatchWhereUniqueInput!, $data: MatchUpdateInput!) {
      updateMatch(where: $where, data: $data) {
        id
        input
        output
        updatedAt
      }
    }
  `;
  const response = await keystoneClient(query, { where: { id }, data });
  if (response.success) {
    revalidatePath(`/dashboard/platform/matches`);
  }
  return response;
}

/**
 * Delete a match
 */
export async function deleteMatch(id: string) {
  const query = `
    mutation DeleteMatch($where: MatchWhereUniqueInput!) {
      deleteMatch(where: $where) {
        id
      }
    }
  `;
  const response = await keystoneClient(query, { where: { id } });
  if (response.success) {
    revalidatePath(`/dashboard/platform/matches`);
  }
  return response;
}

/**
 * Get matches for a specific shop
 */
export async function getShopMatches(shopId: string, page: number = 1, pageSize: number = 10) {
  const where = {
    input: {
      some: {
        shop: {
          id: {
            equals: shopId
          }
        }
      }
    }
  };

  const skip = (page - 1) * pageSize;
  const orderBy = [{ createdAt: 'desc' }];

  try {
    const data = await getMatches(where, pageSize, skip, orderBy);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get matches for a specific channel
 */
export async function getChannelMatches(channelId: string, page: number = 1, pageSize: number = 10) {
  const where = {
    output: {
      some: {
        channel: {
          id: {
            equals: channelId
          }
        }
      }
    }
  };

  const skip = (page - 1) * pageSize;
  const orderBy = [{ createdAt: 'desc' }];

  try {
    const data = await getMatches(where, pageSize, skip, orderBy);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Search shop products
 */
export async function searchShopProducts(shopId: string, searchEntry: string) {
  const query = `
    query SearchShopProducts($shopId: ID!, $searchEntry: String!) {
      searchShopProducts(shopId: $shopId, searchEntry: $searchEntry) {
        image
        title
        productId
        variantId
        price
      }
    }
  `;

  const response = await keystoneClient(query, { shopId, searchEntry });

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data?.searchShopProducts;
}

/**
 * Update channel item (for accepting price changes)
 */
export async function updateChannelItem(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateChannelItem($where: ChannelItemWhereUniqueInput!, $data: ChannelItemUpdateInput!) {
      updateChannelItem(where: $where, data: $data) {
        id
        price
        priceChanged
      }
    }
  `;
  
  const response = await keystoneClient(query, { 
    where: { id }, 
    data 
  });
  
  if (response.success) {
    revalidatePath(`/dashboard/platform/matches`);
    return {
      success: true,
      data: response.data.updateChannelItem
    };
  } else {
    return {
      success: false,
      error: response.error || 'Failed to update channel item'
    };
  }
}

/**
 * Update shop item (for accepting price/inventory changes)
 */
export async function updateShopItem(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateShopItem($where: ShopItemWhereUniqueInput!, $data: ShopItemUpdateInput!) {
      updateShopItem(where: $where, data: $data) {
        id
        price
        externalDetails {
          price
          inventory
        }
      }
    }
  `;
  
  const response = await keystoneClient(query, { 
    where: { id }, 
    data 
  });
  
  if (response.success) {
    revalidatePath(`/dashboard/platform/matches`);
    return {
      success: true,
      data: response.data.updateShopItem
    };
  } else {
    return {
      success: false,
      error: response.error || 'Failed to update shop item'
    };
  }
}

