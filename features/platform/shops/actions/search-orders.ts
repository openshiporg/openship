'use server';

import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

/**
 * Search shop orders from platform
 */
export async function searchShopOrders(
  shopId: string,
  searchEntry: string = "",
  take: number = 10,
  skip: number = 0,
  after?: string
) {
  const query = `
    query SearchShopOrders(
      $shopId: ID!
      $searchEntry: String
      $take: Int!
      $skip: Int
      $after: String
    ) {
      searchShopOrders(
        shopId: $shopId
        searchEntry: $searchEntry
        take: $take
        skip: $skip
        after: $after
      ) {
        orders {
          orderId
          orderName
          link
          date
          firstName
          lastName
          streetAddress1
          streetAddress2
          city
          state
          zip
          country
          email
          cartItems {
            productId
            variantId
            quantity
            price
            name
            image
            channel {
              id
              name
            }
          }
          lineItems {
            name
            quantity
            price
            image
            productId
            variantId
            sku
            lineItemId
          }
          fulfillments {
            company
            number
            url
          }
          note
          totalPrice
          cursor
        }
        hasNextPage
      }
    }
  `;

  const response = await keystoneClient(query, { 
    shopId, 
    searchEntry, 
    take, 
    skip, 
    after 
  });

  return response;
}
