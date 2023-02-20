import {
  integer,
  text,
  relationship,
  virtual,
  float,
} from "@keystone-6/core/fields";
import { list } from "@keystone-6/core";
import { isSignedIn, rules, permissions } from "../../access";
import { trackingFields } from "../trackingFields";
import { shopify } from "./addShopTracking/shopify";

const functions = {
  shopify: shopify,
};

export const TrackingDetail = list({
  access: {
    operation: {
      create: isSignedIn,
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canUpdateOrders,
      delete: rules.canUpdateOrders,
    },
  },
  fields: {
    trackingCompany: text(),
    trackingNumber: text(),
    purchaseId: text(),
    cartItems: relationship({ ref: "CartItem.trackingDetails", many: true }),
    user: relationship({
      ref: "User.trackingDetails",
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          // Default to the currently logged in user on create.
          if (
            operation === "create" &&
            !resolvedData.user &&
            context.session?.itemId
          ) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.user;
        },
      },
    }),
    ...trackingFields,
  },
  hooks: {
    resolveInput: async ({ operation, resolvedData, context }) => {
      // Default to the currently logged in user on create.
      console.log("resolvedData", resolvedData.user)
      console.log("context", context.session?.itemId)

      if (
        operation === "create" &&
        !resolvedData.user &&
        context.session?.itemId
      ) {
        return { connect: { id: context.session?.itemId } };
      }
      return resolvedData.user;
    },
    afterOperation: async ({ operation, item, context }) => {
      if (operation === "create") {
        const sudoContext = context.sudo();
        // get cartItems from purchaseId if cartItems doesn't exist
        if (!item.cartItems) {
          const foundCartItems = await sudoContext.query.CartItem.findMany({
            where: {
              purchaseId: { equals: item.purchaseId },
            },
            query:
              "id quantity order { id orderId shop { domain accessToken } }",
          });

          console.log({ foundCartItems });

          const addCartItemsToTracking =
            await sudoContext.query.TrackingDetail.updateOne({
              where: { id: item.id },
              data: {
                cartItems: {
                  connect: foundCartItems.map((foundCartItem) => ({
                    id: foundCartItem.id,
                  })),
                },
              },
            });
        }
        const foundTracking = await sudoContext.query.TrackingDetail.findOne({
          where: { id: item.id },
          query: `id cartItems { order { id orderId shop { domain accessToken type } } }`,
        });

        console.log({ foundTracking });

        if (foundTracking?.cartItems[0]?.order?.shop?.type !== "custom") {
          if (functions[foundTracking.cartItems[0].order.shop.type]) {
            const addTracking = await functions[
              foundTracking.cartItems[0].order.shop.type
            ]({
              order: foundTracking.cartItems[0].order,
              trackingCompany: item.trackingCompany,
              trackingNumber: item.trackingNumber,
            });
          } else {
            console.log(
              "Add shop tracking function for shop type does not exist."
            );
          }
        } else {
          console.log(
            "Tracking details were created without order connected. This should not be happening."
          );
        }

        // we check if all the cart items in this order have trackingDetails.
        // If so, we mark the order as complete.
        if (foundTracking?.cartItems[0]?.order?.id) {
          const foundOrder = await sudoContext.query.Order.findOne({
            where: { id: foundTracking.cartItems[0].order.id },
            query: `
            id
            orderName
            cartItems(
              where: {
                OR: [
                  {
                    trackingDetails: { none: {} }
                    status: { not: { equals: "CANCELLED" } }
                  }
                ]
              }
            ) {
              productId
            }
          `,
          });

          if (foundOrder?.cartItems.length === 0) {
            const updatedOrder = await sudoContext.query.Order.updateOne({
              where: { id: foundOrder.id },
              data: {
                status: "COMPLETE",
              },
            });
          }
        }
      }
    },
  },
});
