import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { relationship, text, timestamp } from "@keystone-6/core/fields";

import { isSignedIn, permissions, rules } from "../access";
import { trackingFields } from "./trackingFields";

export const TrackingDetail = list({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageOrders,
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canManageOrders,
      delete: rules.canManageOrders,
    },
  },
  hooks: {
    resolveInput: {
      create: ({ operation, resolvedData, context }) => {
        // Auto-assign user if not provided
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } },
          };
        }
        return resolvedData;
      },
    },
    afterOperation: async ({ operation, item, context }) => {
      if (operation === "create") {
        const sudoContext = context.sudo();
        
        // Get tracking detail with related data
        const foundTracking = await sudoContext.query.TrackingDetail.findOne({
          where: { id: String(item.id) },
          query: `
            id
            trackingNumber
            trackingCompany
            purchaseId
            cartItems {
              id
              purchaseId
              order {
                id
                orderName
                orderId
                status
                shop {
                  id
                  domain
                  accessToken
                  platform {
                    id
                    name
                    addTrackingFunction
                  }
                }
              }
            }
          `,
        });
        
        if (!foundTracking?.cartItems?.length) {
          return;
        }
        
        const firstCartItem = foundTracking.cartItems[0];
        const order = firstCartItem.order;
        
        // Execute shop platform addTracking function
        if (order.shop?.platform?.addTrackingFunction) {
          try {
            // Use the executor pattern
            const { addShopTracking } = await import('../../integrations/shop/lib/executor');
            
            await addShopTracking({
              platform: {
                ...order.shop.platform,
                domain: order.shop.domain,
                accessToken: order.shop.accessToken,
              },
              order: order,
              trackingCompany: foundTracking.trackingCompany,
              trackingNumber: foundTracking.trackingNumber,
            });
          } catch (error) {
            console.error('Error calling addTracking:', error);
            // Don't throw - continue with order status update even if shop tracking fails
          }
        }
        
        // Check if all cart items for this order have tracking
        const foundOrder = await sudoContext.query.Order.findOne({
          where: { id: order.id },
          query: `
            id
            orderName
            status
            cartItems(
              where: {
                AND: [
                  { trackingDetails: { none: {} } },
                  { status: { not: { equals: "CANCELLED" } } }
                ]
              }
            ) {
              id
              status
            }
          `,
        });
        
        // If no untracked items remain, update order status to COMPLETE
        if (foundOrder && foundOrder.cartItems.length === 0 && foundOrder.status === "AWAITING") {
          await sudoContext.query.Order.updateOne({
            where: { id: foundOrder.id },
            data: {
              status: "COMPLETE",
            },
          });
        }
      }
    },
  },
  ui: {
    listView: {
      initialColumns: ["trackingCompany", "trackingNumber", "purchaseId"],
    },
  },
  fields: {
    // Tracking information
    trackingCompany: text({
      validation: { isRequired: true },
    }),
    trackingNumber: text({
      validation: { isRequired: true },
    }),
    purchaseId: text(),

    // Relationships
    cartItems: relationship({
      ref: "CartItem.trackingDetails",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "quantity", "status"],
      },
    }),
    user: relationship({
      ref: "User.trackingDetails",
    }),

    ...trackingFields,
  },
});
