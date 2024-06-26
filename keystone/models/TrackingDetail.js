import {
  integer,
  text,
  relationship,
  virtual,
  float,
} from "@keystone-6/core/fields";
import { list } from "@keystone-6/core";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const TrackingDetail = list({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
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
    afterOperation: async ({ operation, item, context }) => {
      if (operation === "create") {
        const sudoContext = context.sudo();

        if (!item.cartItems) {
          const foundCartItems = await sudoContext.query.CartItem.findMany({
            where: {
              purchaseId: { equals: item.purchaseId },
            },
            query:
              "id quantity order { id orderId shop { domain accessToken platform { addTrackingFunction } } }",
          });

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
          query: `id cartItems { order { id orderId shop { domain accessToken platform { addTrackingFunction } } } }`,
        });

        const shop = foundTracking?.cartItems[0]?.order?.shop;

        if (shop && shop.platform && shop.platform.addTrackingFunction) {
          const addTrackingFunction = shop.platform.addTrackingFunction;

          try {
            if (addTrackingFunction.startsWith("http")) {
              // External API call
              const response = await fetch(addTrackingFunction, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  order: foundTracking.cartItems[0].order,
                  trackingCompany: item.trackingCompany,
                  trackingNumber: item.trackingNumber,
                }),
              });

              if (!response.ok) {
                throw new Error(`Failed to add tracking info: ${response.statusText}`);
              }

              await response.json();
            } else {
              // Internal function call
              const platformFunctions = await import(
                `../../shopAdapters/${addTrackingFunction}.js`
              );

              if (platformFunctions.addTracking) {
                await platformFunctions.addTracking({
                  order: foundTracking.cartItems[0].order,
                  trackingCompany: item.trackingCompany,
                  trackingNumber: item.trackingNumber,
                });
              } else {
                console.error(`Add tracking function for platform ${addTrackingFunction} does not exist.`);
              }
            }
          } catch (error) {
            console.error(`Failed to add tracking info for platform ${addTrackingFunction}:`, error);
          }
        } else {
          console.error("Add tracking function not configured or shop not associated.");
        }

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
            await sudoContext.query.Order.updateOne({
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
  ui: {
    listView: { fieldMode: 'edit' },
  },
});
