'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(id: string, quantity: number) {
  const query = `
    mutation UpdateCartItem($where: CartItemWhereUniqueInput!, $data: CartItemUpdateInput!) {
      updateCartItem(where: $where, data: $data) {
        id
        quantity
        updatedAt
      }
    }
  `;
  
  const response = await keystoneClient(query, { 
    where: { id }, 
    data: { quantity } 
  });
  
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders`);
  }
  
  return response;
}

/**
 * Delete cart item
 */
export async function deleteCartItem(id: string) {
  const query = `
    mutation DeleteCartItem($where: CartItemWhereUniqueInput!) {
      deleteCartItem(where: $where) {
        id
      }
    }
  `;
  
  const response = await keystoneClient(query, { where: { id } });
  
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders`);
  }
  
  return response;
}

/**
 * Clear cart item error
 */
export async function clearCartItemError(id: string) {
  const query = `
    mutation UpdateCartItem($where: CartItemWhereUniqueInput!, $data: CartItemUpdateInput!) {
      updateCartItem(where: $where, data: $data) {
        id
        error
        updatedAt
      }
    }
  `;
  
  const response = await keystoneClient(query, { 
    where: { id }, 
    data: { error: "" } 
  });
  
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders`);
  }
  
  return response;
}

/**
 * Update cart item data
 */
export async function updateCartItem(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateCartItem($where: CartItemWhereUniqueInput!, $data: CartItemUpdateInput!) {
      updateCartItem(where: $where, data: $data) {
        id
        name
        quantity
        price
        sku
        image
        productId
        variantId
        error
        purchaseId
        channel {
          id
          name
        }
        updatedAt
      }
    }
  `;
  
  const response = await keystoneClient(query, { 
    where: { id }, 
    data 
  });
  
  if (response.success) {
    revalidatePath(`/dashboard/platform/orders`);
  }
  
  return response;
}