import { gql, GraphQLClient } from "graphql-request";

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
          type
          platform {
            addCartToPlatformOrderFunction
          }
        }
        orderId
        orderName
        user {
          email
        }
      `,
    });

    const cartChannels = await query.Channel.findMany({
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
      createPurchaseFunction
      metafields {
        id
        key
        value
      }
      `,
    });

    for (const {
      domain,
      accessToken,
      cartItems,
      createPurchaseFunction,
      metafields,
    } of cartChannels.filter((channel) => channel.cartItems.length > 0)) {
      const metafieldsObject = Object.assign(
        {},
        ...metafields.map(({ key, value }) => ({ [key]: value }))
      );

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
        if (createPurchaseFunction.startsWith("http")) {
          // External API call
          const response = await fetch(createPurchaseFunction, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            throw new Error(`Failed to create purchase: ${response.statusText}`);
          }

          const orderPlacementRes = await response.json();

          if (orderPlacementRes.error) {
            await updateCartItems({
              cartItems,
              error: orderPlacementRes.error,
              query,
            });
          }

          if (orderPlacementRes.url) {
            await updateCartItems({
              cartItems,
              url: orderPlacementRes.url,
              purchaseId: orderPlacementRes.purchaseId,
              query,
            });
          }
        } else {
          // Internal function call
          const platformFunctions = await import(
            `../../channelAdapters/${createPurchaseFunction}.js`
          );

          if (platformFunctions.createPurchase) {
            const orderPlacementRes = await platformFunctions.createPurchase(body);

            if (orderPlacementRes.error) {
              await updateCartItems({
                cartItems,
                error: orderPlacementRes.error,
                query,
              });
            }

            if (orderPlacementRes.url) {
              await updateCartItems({
                cartItems,
                url: orderPlacementRes.url,
                purchaseId: orderPlacementRes.purchaseId,
                query,
              });
            }
          } else {
            throw new Error("Create purchase function not implemented.");
          }
        }
      } catch (error) {
        await updateCartItems({
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

      if (cartCount === 0) {
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
              platform {
                addCartToPlatformOrderFunction
              }
            }
          `,
        });

        const { addCartToPlatformOrderFunction } = updatedOrder.shop.platform;

        if (addCartToPlatformOrderFunction.startsWith("http")) {
          // External API call
          const response = await fetch(addCartToPlatformOrderFunction, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cart: updatedOrder.cartItems,
              orderId: updatedOrder.orderId,
              domain: shop.domain,
              accessToken: shop.accessToken,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update order on platform: ${response.statusText}`);
          }

          await response.json();
        } else {
          // Internal function call
          const platformFunctions = await import(
            `../../channelAdapters/${addCartToPlatformOrderFunction}.js`
          );

          if (platformFunctions.addCartToPlatformOrder) {
            await platformFunctions.addCartToPlatformOrder({
              cart: updatedOrder.cartItems,
              orderId: updatedOrder.orderId,
              domain: shop.domain,
              accessToken: shop.accessToken,
            });
          } else {
            throw new Error("Add cart to platform order function not implemented.");
          }
        }

        processed.push(updatedOrder);
      } else {
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
