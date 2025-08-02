'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";
import { updateMatch } from "../../matches/actions/matches";
import { extractPriceChangeDetails } from "../utils/error-codes";

/**
 * Update match price from cart item error
 * This function extracts the new price from the cart item error and updates the match
 */
export async function updateMatchPrice(cartItemId: string, errorMessage?: string) {
  try {
    // First, get the cart item details
    const cartItemQuery = `
      query GetCartItem($where: CartItemWhereUniqueInput!) {
        cartItem(where: $where) {
          id
          price
          error
          productId
          variantId
          channel {
            id
          }
        }
      }
    `;
    
    const cartItemResponse = await keystoneClient(cartItemQuery, { 
      where: { id: cartItemId } 
    });
    
    if (!cartItemResponse.success || !cartItemResponse.data?.cartItem) {
      throw new Error('Cart item not found');
    }
    
    const cartItem = cartItemResponse.data.cartItem;
    
    // Extract new price from error message
    const priceDetails = extractPriceChangeDetails(errorMessage || cartItem.error);
    
    if (!priceDetails) {
      throw new Error('Could not extract price change details from error message');
    }
    
    const newPrice = priceDetails.newPrice;
    
    // Find the ChannelItem that corresponds to this CartItem
    const channelItemQuery = `
      query GetChannelItem($where: ChannelItemWhereInput!) {
        channelItems(where: $where) {
          id
          price
          matches {
            id
          }
        }
      }
    `;
    
    const channelItemResponse = await keystoneClient(channelItemQuery, {
      where: {
        productId: { equals: cartItem.productId },
        variantId: { equals: cartItem.variantId },
        channel: { id: { equals: cartItem.channel.id } }
      }
    });
    
    if (!channelItemResponse.success || !channelItemResponse.data?.channelItems?.length) {
      throw new Error('Channel item not found');
    }
    
    const channelItem = channelItemResponse.data.channelItems[0];
    
    if (!channelItem.matches?.length) {
      throw new Error('No matches found for this channel item');
    }
    
    // Update the ChannelItem price
    const updateChannelItemQuery = `
      mutation UpdateChannelItem($where: ChannelItemWhereUniqueInput!, $data: ChannelItemUpdateInput!) {
        updateChannelItem(where: $where, data: $data) {
          id
          price
          updatedAt
        }
      }
    `;
    
    const updateResponse = await keystoneClient(updateChannelItemQuery, {
      where: { id: channelItem.id },
      data: { price: newPrice }
    });
    
    if (!updateResponse.success) {
      throw new Error(updateResponse.error || 'Failed to update match price');
    }
    
    // Clear the cart item error since we've updated the match
    const clearErrorQuery = `
      mutation UpdateCartItem($where: CartItemWhereUniqueInput!, $data: CartItemUpdateInput!) {
        updateCartItem(where: $where, data: $data) {
          id
          error
          updatedAt
        }
      }
    `;
    
    const clearErrorResponse = await keystoneClient(clearErrorQuery, { 
      where: { id: cartItemId }, 
      data: { error: "" } 
    });
    
    if (!clearErrorResponse.success) {
      throw new Error('Failed to clear cart item error');
    }
    
    // Revalidate relevant paths
    revalidatePath('/dashboard/platform/orders');
    revalidatePath('/dashboard/platform/matches');
    
    return { success: true, message: 'Match price updated successfully' };
  } catch (error: any) {
    console.error('Error updating match price:', error);
    return { success: false, error: error.message };
  }
}