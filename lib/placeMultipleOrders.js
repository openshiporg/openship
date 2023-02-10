async function updateCartItems({
  query,
  cartItems,
  url = "",
  error = "",
  purchaseId = "",
}) {
  const update = [];
  for (const { id } of cartItems) {
    const res = await query.CartItem.updateOne({
      where: {
        id,
      },
      data: {
        url,
        error,
        purchaseId,
      },
    });
    update.push(res);
  }
  return update;
}

export async function placeMultipleOrders({ ids, query }) {
  const processed = [];
  for (const orderId of ids) {
    const {
      first_name,
      last_name,
      streetAddress1,
      streetAddress2,
      city,
      state,
      zip,
      country,
      phoneNumber,
      note,
      user,
      shop,
      shippingMethod,
      orderId: shopOrderId,
      orderName,
    } = await query.Order.findOne({
      where: {
        id: orderId,
      },
      query: `
        first_name,
        last_name,
        streetAddress1,
        streetAddress2,
        city,
        state,
        zip,
        country,
        phoneNumber,
        note
        shippingMethod
        shop {
          domain
          accessToken
        }
        orderId
        orderName
        user {
          email
        }
      `,
    });

    // we use channel query because this groups cartItems per channel
    const cartChannels = await query.Channel.findMany({
      // where: {
      //   cartItems_every: {
      //     order: {
      //       orderId,
      //     },
      //   },
      // },
      query: `
      domain
      accessToken
      cartItems(
        where: {
          order: { id: { equals: "${orderId}" }}
          purchaseId: { equals: "" }
          url: { equals: "" }
        }
      ) {
        id
        productId
        variantId
        sku
        name
        quantity
        price
      }
      createPurchaseEndpoint
      metafields {
        id
        key
        value
      }
      `,
    });

    // console.log(cartChannels);

    for (const {
      domain,
      accessToken,
      cartItems,
      createPurchaseEndpoint,
      metafields,
    } of cartChannels.filter((channel) => channel.cartItems.length > 0)) {
      const metafieldsObject = Object.assign(
        {},
        ...metafields.map(({ key, value }) => ({ [key]: value }))
      );

      console.log({ metafieldsObject });

      const body = {
        domain,
        accessToken,
        cartItems,
        address: {
          first_name,
          last_name,
          streetAddress1,
          streetAddress2,
          city,
          state,
          zip,
          country,
          phoneNumber,
        },
        note,
        email: user.email,
        shippingMethod,
        orderName,
        orderId,
        shopOrderId,
        metafields: metafieldsObject,
      };
      try {
        const response = await fetch(
          createPurchaseEndpoint.includes("http")
            ? createPurchaseEndpoint
            : `${process.env.FRONTEND_URL}${createPurchaseEndpoint}`,
          {
            credentials: "same-origin",
            mode: "cors",
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-type": "application/json",
              "X-Requested-With": "Fetch",
            },
            body: JSON.stringify(body),
          }
        );

        const orderPlacementRes = await response.json();
        if (orderPlacementRes.error) {
          const data = await updateCartItems({
            cartItems,
            error: orderPlacementRes.error,
            query,
          });
        }

        if (orderPlacementRes.url) {
          const data = await updateCartItems({
            cartItems,
            url: orderPlacementRes.url,
            purchaseId: orderPlacementRes.purchaseId,
            query,
          });
        }
      } catch (error) {
        const data = await updateCartItems({
          cartItems,
          error: "Error on order placement. Order may have been placed.",
          query,
        });
      }

      const cartCount = await query.CartItem.count({
        where: {
          order: {
            id: { equals: orderId },
          },
          url: { equals: "" },
          purchaseId: { equals: "" },
        },
      });

      const cartLog = await query.CartItem.findMany({
        where: {
          order: {
            id: { equals: orderId },
          },
          url: { equals: "" },
          purchaseId: { equals: "" },
        },
      });

      // console.log('cartCount', cartCount);
      // console.log('cartCount', orderId);
      // console.log('cartCount', cartLog);

      // no cartItems found with url and purchaseId undefined
      if (cartCount === 0) {
        // console.log('ORDERID inside cartCount if', orderId);

        // console.log('cartCount if', cartCount);
        // console.log('cartCount if', orderId);
        // console.log('cartCount cart', cartLog);

        const updatedOrder = await query.Order.updateOne({
          where: { id: orderId },
          data: {
            status: "AWAITING",
          },
          query: `
            id
            orderId
            cartItems {
              id,
              name,
              quantity,
              price,
              image,
              productId,
              variantId,
              sku,
              purchaseId,
              lineItemId,
              channel {
                id
                name
              },
              url,
              error,
            }
            shop {
              type
            }
          `,
        });

        console.log("AWAITING", updatedOrder);

        if (addCartToPlatformOrder[updatedOrder?.shop?.type]) {
          const updatedOrderOnPlatform = await addCartToPlatformOrder[
            updatedOrder?.shop?.type
          ]({
            cart: updatedOrder.cartItems,
            orderId: updatedOrder.orderId,
            domain: shop.domain,
            accessToken: shop.accessToken,
          });
          console.log(`Order updated on ${updatedOrder?.shop?.type}`);
        }

        processed.push(updatedOrder);
      } else {
        // console.log('cartCount else', cartCount);
        // console.log('cartCount else', orderId);
        // console.log('cartCount cart', cartLog);

        const updatedOrder = await query.Order.updateOne({
          where: { id: orderId },
          data: {
            status: "PENDING",
          },
          query: `
            orderId
            cartItems {
              channel {
                id
              }
              image
              price
              id
              quantity
              productId
              variantId
              sku
            }
          `,
        });

        processed.push(updatedOrder);
      }
    }
  }
  return processed;
}

import { gql, GraphQLClient } from "graphql-request";

const addCartToPlatformOrder = {
  shopify: async ({ cart, orderId, domain, accessToken }) => {
    const shopifyClient = new GraphQLClient(
      `https://${domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
        },
      }
    );

    const { orderUpdate } = await shopifyClient.request(
      gql`
        mutation ($input: OrderInput!) {
          orderUpdate(input: $input) {
            order {
              metafields(first: 100) {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        input: {
          id: `gid://shopify/Order/${orderId}`,
          metafields: [
            {
              namespace: "oscart",
              key: "oscart",
              value: JSON.stringify(cart),
              type: "json_string",
            },
          ],
        },
      }
    );

    return { order: orderUpdate?.order };
  },
};
