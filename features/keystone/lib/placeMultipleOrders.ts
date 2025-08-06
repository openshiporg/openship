import { createChannelPurchase } from "../utils/channelProviderAdapter";
import { addCartToPlatformOrder } from "../utils/shopProviderAdapter";

async function updateCartItems({
  query,
  cartItems,
  url = "",
  error = "",
  purchaseId = "",
}: {
  query: any;
  cartItems: Array<{ id: string }>;
  url?: string;
  error?: string;
  purchaseId?: string;
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

export async function placeMultipleOrders({ ids, query }: { ids: string[]; query: any }) {
  const processed = [];
  for (const orderId of ids) {
    const {
      firstName,
      lastName,
      streetAddress1,
      streetAddress2,
      city,
      state,
      zip,
      country,
      phone,
      user,
      shop,
      orderId: shopOrderId,
      orderName,
    } = await query.Order.findOne({
      where: {
        id: orderId,
      },
      query: `
        firstName,
        lastName,
        streetAddress1,
        streetAddress2,
        city,
        state,
        zip,
        country,
        phone
        shop {
          domain
          accessToken
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
      platform {
        createPurchaseFunction
      }
      metadata
      `,
    });

    for (const {
      domain,
      accessToken,
      cartItems,
      platform,
      metadata,
    } of cartChannels.filter((channel: any) => channel.cartItems.length > 0)) {
      const body = {
        domain,
        accessToken,
        cartItems,
        address: {
          firstName,
          lastName,
          streetAddress1,
          streetAddress2,
          city,
          state,
          zip,
          country,
          phone,
        },
          email: user.email,
          orderName,
        orderId,
        shopOrderId,
        metadata,
      };

      // Prepare platform configuration like other functions do
      const platformConfig = {
        domain,
        accessToken,
        createPurchaseFunction: platform.createPurchaseFunction,
        ...metadata,
      };

      try {
        const orderPlacementRes = await createChannelPurchase({
          platform: platformConfig,
          cartItems,
          shipping: {
            firstName,
            lastName,
            address1: streetAddress1,
            address2: streetAddress2,
            city,
            province: state,
            zip,
            country,
            phone,
            email: user.email,
                },
          notes: "",
        });

        if (orderPlacementRes.error) {
          await updateCartItems({
            cartItems,
            error: `ORDER_PLACEMENT_ERROR: ${orderPlacementRes.error}`,
            query,
          });
        }

        if (orderPlacementRes.purchaseId) {
          await updateCartItems({
            cartItems,
            url: orderPlacementRes.url,
            purchaseId: orderPlacementRes.purchaseId,
            query,
          });
        }
      } catch (error: any) {
        await updateCartItems({
          cartItems,
          error: `ORDER_PLACEMENT_ERROR: ${error.message || "Error on order placement. Order may have been placed."}`,
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
              platform {
                addCartToPlatformOrderFunction
              }
            }
          `,
        });

        try {
          await addCartToPlatformOrder({
            platform: updatedOrder.shop.platform,
            cartItems: updatedOrder.cartItems,
            orderId: updatedOrder.orderId,
          });
        } catch (error: any) {
          console.warn(
            "Warning: Add cart to platform order function failed:",
            error.message
          );
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