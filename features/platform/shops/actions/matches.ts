'use server';

import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Get matches
 */
export async function getMatches(
  where: Record<string, unknown> = {},
  take: number = 10,
  skip: number = 0,
  orderBy: Array<Record<string, string>> = [{ createdAt: 'desc' }]
) {
  const query = `
    query GetMatches(
      $where: MatchWhereInput
      $take: Int!
      $skip: Int!
      $orderBy: [MatchOrderByInput!]
    ) {
      items: matches(
        where: $where
        take: $take
        skip: $skip
        orderBy: $orderBy
      ) {
        id
        input {
          id
          quantity
          productId
          variantId
          lineItemId
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
          }
        }
        output {
          id
          quantity
          productId
          variantId
          lineItemId
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
          price
          channel {
            id
            name
          }
        }
        createdAt
        outputPriceChanged
        inventoryNeedsToBeSynced
      }
      count: matchesCount(where: $where)
    }
  `;

  const response = await keystoneClient(query, { where, take, skip, orderBy });
  return response;
}

/**
 * Get matches for a specific shop
 */
export async function getShopMatches(
  shopId: string,
  page: number = 1,
  pageSize: number = 10
) {
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
  return getMatches(where, pageSize, skip);
}

/**
 * Get matches for a specific channel
 */
export async function getChannelMatches(
  channelId: string,
  page: number = 1,
  pageSize: number = 10
) {
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
  return getMatches(where, pageSize, skip);
}
