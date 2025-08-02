'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Update line item quantity
 */
export async function updateLineItemQuantity(id: string, quantity: number) {
  const query = `
    mutation UpdateLineItem($where: LineItemWhereUniqueInput!, $data: LineItemUpdateInput!) {
      updateLineItem(where: $where, data: $data) {
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
 * Delete line item
 */
export async function deleteLineItem(id: string) {
  const query = `
    mutation DeleteLineItem($where: LineItemWhereUniqueInput!) {
      deleteLineItem(where: $where) {
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
 * Update line item data
 */
export async function updateLineItem(id: string, data: Record<string, unknown>) {
  const query = `
    mutation UpdateLineItem($where: LineItemWhereUniqueInput!, $data: LineItemUpdateInput!) {
      updateLineItem(where: $where, data: $data) {
        id
        name
        quantity
        price
        sku
        image
        productId
        variantId
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