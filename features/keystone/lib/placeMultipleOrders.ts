import { createChannelPurchase } from "../utils/channelProviderAdapter";
import { addCartToPlatformOrder } from "../utils/shopProviderAdapter";
import {
  claimSupplierPurchase,
  completeSupplierPurchase,
  markSupplierPurchaseUnknown,
  shouldReconcileOpenFrontPurchase,
} from "./supplierPurchaseClaim";

export async function placeMultipleOrders({
  ids,
  query,
  prisma,
}: {
  ids: string[];
  query: any;
  prisma: any;
}) {
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
      currency,
      user,
      shop,
      orderId: shopOrderId,
      orderName,
      status: orderStatus,
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
        phone,
        currency
        shop {
          domain
          accessToken
          platform {
            addCartToPlatformOrderFunction
          }
        }
        orderId
        orderName
        status
        user {
          email
        }
      `,
    });

    const cartChannels = await query.Channel.findMany({
      query: `
      id
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
        status
        purchaseAttemptKey
        lineItemId
      } 
      platform {
        createPurchaseFunction
      }
      metadata
      `,
    });

    // A cancelled source order must never be bought from a supplier.
    if (orderStatus === "CANCELLED") continue;

    // OpenFront suppliers ship to this address: never buy without one.
    const missingAddress = [
      ["first name", firstName],
      ["last name", lastName],
      ["street address", streetAddress1],
      ["city", city],
      ["state", state],
      ["ZIP", zip],
      ["country", country],
    ].filter(([, value]) => !String(value || "").trim()).map(([label]) => label);

    for (const {
      id: channelId,
      domain,
      accessToken,
      cartItems,
      platform,
      metadata,
    } of cartChannels.filter((channel: any) => channel.cartItems.length > 0)) {
      const cartItemIds = cartItems.map((item: any) => item.id);
      if (platform.createPurchaseFunction === "openfront" && missingAddress.length) {
        await query.Order.updateOne({
          where: { id: orderId },
          data: {
            status: "PENDING",
            error: `Order is missing its shipping ${missingAddress.join(", ")}`,
          },
          query: "id",
        });
        continue;
      }
      let claim;
      try {
        claim = await claimSupplierPurchase(prisma, {
          orderId,
          channelId,
          cartItemIds,
        });
      } catch (error: any) {
        // One stuck group must not stop the rest of the batch.
        await query.Order.updateOne({
          where: { id: orderId },
          data: { error: error?.message || "Supplier purchase items are already claimed or changed" },
          query: "id",
        });
        continue;
      }
      if (
        !claim.claimed &&
        !shouldReconcileOpenFrontPurchase(claim, platform.createPurchaseFunction)
      ) {
        continue;
      }
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
            currency,
          },
          notes: "",
          idempotencyKey: claim.attemptKey,
        });

        if (!orderPlacementRes.purchaseId || orderPlacementRes.error) {
          await markSupplierPurchaseUnknown(prisma, {
            attemptKey: claim.attemptKey,
            cartItemIds,
            error: orderPlacementRes.error || "Supplier returned no purchase ID",
          });
        } else {
          await completeSupplierPurchase(prisma, {
            attemptKey: claim.attemptKey,
            cartItemIds,
            purchaseId: orderPlacementRes.purchaseId,
            url: orderPlacementRes.url || "",
          });
        }
      } catch (error: any) {
        await markSupplierPurchaseUnknown(prisma, {
          attemptKey: claim.attemptKey,
          cartItemIds,
          error: error.message || "Supplier outcome is unknown",
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