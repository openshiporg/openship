'use server';

import { keystoneClient } from "@/features/dashboard/lib/keystoneClient";

export async function searchChannelOrders(
  channelId: string,
  searchEntry: string = "",
  take: number = 10,
  skip: number = 0
) {
  const query = `
    query CHANNEL_ORDERS_QUERY(
      $skip: Int
      $take: Int
      $where: OrderWhereInput
      $cartItemsWhere: CartItemWhereInput
    ) {
      orders(orderBy: [], take: $take, skip: $skip, where: $where) {
        id
        orderId
        orderName
        email
        firstName
        lastName
        streetAddress1
        streetAddress2
        city
        state
        zip
        error
        cartItems(where: $cartItemsWhere) {
          id
          name
          image
          price
          quantity
          productId
          variantId
          purchaseId
          url
          error
          order {
            id
          }
          channel {
            id
            name
          }
        }
        shop {
          name
          domain
          accessToken
        }
        currency
        totalPrice
        subTotalPrice
        totalDiscounts
        totalTax
        status
        createdAt
        cartItemsCount
        lineItemsCount
      }
    }
  `;

  const response = await keystoneClient(query, {
    where: {
      cartItems: {
        some: { channel: { id: { equals: channelId } } },
      },
      OR: [
        { orderName: { contains: searchEntry, mode: "insensitive" } },
        { firstName: { contains: searchEntry, mode: "insensitive" } },
        { lastName: { contains: searchEntry, mode: "insensitive" } },
        { streetAddress1: { contains: searchEntry, mode: "insensitive" } },
        { streetAddress2: { contains: searchEntry, mode: "insensitive" } },
        { city: { contains: searchEntry, mode: "insensitive" } },
        { state: { contains: searchEntry, mode: "insensitive" } },
        { zip: { contains: searchEntry, mode: "insensitive" } },
      ],
    },
    cartItemsWhere: { channel: { id: { equals: channelId } } },
    skip: skip,
    take: take,
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  return response.data;
}
