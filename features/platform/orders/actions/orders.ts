'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Search for products in a channel
 */
export async function searchChannelProducts(channelId: string, searchEntry: string) {
  const query = `
    query SearchChannelProducts($channelId: ID!, $searchEntry: String!) {
      searchChannelProducts(channelId: $channelId, searchEntry: $searchEntry) {
        image
        title
        productId
        variantId
        price
      }
    }
  `;

  const response = await keystoneClient(query, { channelId, searchEntry });

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data?.searchChannelProducts;
}

/**
 * Search for products in a shop
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
 * Add item to cart
 */
export async function addToCart(itemData: any) {
  const query = `
    mutation ADD_TO_CART_MUTATION(
      $channelId: ID
      $image: String
      $name: String
      $price: String
      $productId: String
      $variantId: String
      $quantity: String
      $orderId: ID
    ) {
      addToCart(
        channelId: $channelId
        image: $image
        name: $name
        price: $price
        productId: $productId
        variantId: $variantId
        quantity: $quantity
        orderId: $orderId
      ) {
        id
      }
    }
  `;

  const response = await keystoneClient(query, itemData);
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders/${itemData.orderId}`);
  }
  return response;
}

/**
 * Match order
 */
export async function matchOrder(orderId: string) {
  const query = `
    mutation MATCHORDER_MUTATION($orderId: ID!) {
      matchOrder(orderId: $orderId) {
        id
      }
    }
  `;
  const response = await keystoneClient(query, { orderId });
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders/${orderId}`);
  }
  return response;
}

/**
 * Add match to cart (GET MATCH functionality)
 */
export async function addMatchToCart(orderId: string) {
  const query = `
    mutation ADDMATCHTOCART_MUTATION($orderId: ID!) {
      addMatchToCart(orderId: $orderId) {
        id
      }
    }
  `;
  const response = await keystoneClient(query, { orderId });
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders/${orderId}`);
  }
  return response;
}

/**
 * Place orders
 */
export async function placeOrders(ids: string[]) {
  const query = `
    mutation PLACE_ORDERS($ids: [ID!]!) {
      placeOrders(ids: $ids) {
        orderId
      }
    }
  `;
  const response = await keystoneClient(query, { ids });
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders`);
  }
  return response;
}

/**
 * Delete order
 */
export async function deleteOrder(orderId: string) {
  const query = `
    mutation DELETE_ORDER($where: OrderWhereUniqueInput!) {
      deleteOrder(where: $where) {
        id
      }
    }
  `;
  const response = await keystoneClient(query, { where: { id: orderId } });
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders`);
  }
  return response;
}

/**
 * Delete multiple orders
 */
export async function deleteOrders(orderIds: string[]) {
  const query = `
    mutation DELETE_ORDERS($where: [OrderWhereUniqueInput!]!) {
      deleteOrders(where: $where) {
        id
      }
    }
  `;
  const response = await keystoneClient(query, { 
    where: orderIds.map((id) => ({ id }))
  });
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders`);
  }
  return response;
}

/**
 * Get all channels
 */
export async function getChannels() {
  const query = `
    query GetChannels {
      channels {
        id
        name
      }
    }
  `;
  const response = await keystoneClient(query);
  return response.data?.channels || [];
}
