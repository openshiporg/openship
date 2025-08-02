import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import {
  checkbox,
  float,
  integer,
  json,
  relationship,
  text,
  timestamp,
} from "@keystone-6/core/fields";

import { isSignedIn, permissions, rules } from "../access";
import { trackingFields } from "./trackingFields";
import { placeMultipleOrders } from "../lib/placeMultipleOrders";
import { getMatches } from "../extendGraphqlSchema/mutations/addMatchToCart";

async function applyDynamicWhereClause(context: any, linkId: string, orderId: string) {
  const link = await context.query.Link.findOne({
    where: { id: linkId },
    query: 'id dynamicWhereClause',
  });

  if (!link || !link.dynamicWhereClause) {
    return null;
  }

  const whereClause = {
    ...link.dynamicWhereClause,
    id: { equals: orderId },
  };

  const matchedOrder = await context.query.Order.findOne({
    where: whereClause,
    query: 'id',
  });

  return matchedOrder;
}

export const Order = list({
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
    afterOperation: async ({ operation, item, context }: any) => {
      if (operation === "create") {
        const sudoContext = context.sudo();

        const order = await sudoContext.query.Order.findOne({
          where: { id: item.id },
          query: `
            id
            user {
              id
            }
            shop {
              id
              name
              linkMode
              links {
                id
                rank
                channel {
                  id
                  name
                }
              }
            }
            lineItems {
              name
              price
              lineItemId
              quantity
              image
              productId
              variantId
              sku
            }
            cartItemsCount
          `,
        });

        if (item.linkOrder && order.shop?.links.length > 0) {
          const links = order.shop.links.sort((a: any, b: any) => a.rank - b.rank);
          let matchedLinks: any[] = [];

          if (order.shop.linkMode === 'sequential') {
            for (const link of links) {
              const matchedOrder = await applyDynamicWhereClause(sudoContext, link.id, order.id);
              if (matchedOrder) {
                matchedLinks.push(link);
                break;
              }
            }
          } else if (order.shop.linkMode === 'simultaneous') {
            for (const link of links) {
              const matchedOrder = await applyDynamicWhereClause(sudoContext, link.id, order.id);
              if (matchedOrder) {
                matchedLinks.push(link);
              }
            }
          }

          if (matchedLinks.length > 0) {
            for (const link of matchedLinks) {
              await sudoContext.query.CartItem.createMany({
                data: order.lineItems.map((c: any) => ({
                  ...c,
                  channel: { connect: { id: link.channel.id } },
                  order: { connect: { id: item.id } },
                  user: { connect: { id: order.user?.id } },
                })),
              });
            }

            if (item.processOrder) {
              await placeMultipleOrders({
                ids: [item.id],
                query: sudoContext.query,
              });
            }
          } else {
            await sudoContext.query.Order.updateOne({
              where: { id: item.id },
              data: {
                error: "No matching link found for this order",
              },
            });
          }
        } else if (item.matchOrder) {
          if (item.matchOrder) {
            try {
              const cartItemsFromMatch = await getMatches({
                orderId: item.id,
                context: sudoContext,
              });

              const order = await sudoContext.query.Order.findOne({
                where: { id: item.id },
                query: `id error`,
              });
              if (order?.error) {
                const updatedOrder = await sudoContext.query.Order.updateOne({
                  where: { id: item.id },
                  data: {
                    status: "PENDING",
                  },
                });
              } else {
                if (item.processOrder) {
                  const processedOrder = await placeMultipleOrders({
                    ids: [item.id],
                    query: sudoContext.query,
                  });
                }
              }
            } catch (matchError) {
              // Handle match errors gracefully - don't break order creation
              console.error('Error during match processing:', matchError);
              await sudoContext.query.Order.updateOne({
                where: { id: item.id },
                data: {
                  error: `Match processing failed: ${matchError instanceof Error ? matchError.message : 'Unknown error'}`,
                  status: "PENDING",
                },
              });
            }
          }
        } else if (order.cartItemsCount > 0 && item.processOrder) {
          // Process the order if there are cart items and processOrder is true
          const processedOrder = await placeMultipleOrders({
            ids: [item.id],
            query: sudoContext.query,
          });
        }
      }
    },
  },
  ui: {
    listView: {
      initialColumns: ["orderId", "orderName", "email", "totalPrice", "shop"],
    },
  },
  fields: {
    // Order identifiers
    orderId: text({
      isIndexed: "unique",
      validation: { isRequired: true },
    }),
    orderName: text(),
    email: text(),

    // Customer information
    firstName: text(),
    lastName: text(),
    streetAddress1: text(),
    streetAddress2: text(),
    city: text(),
    state: text(),
    zip: text(),
    country: text(),
    phone: text(),

    // Pricing
    currency: text(),
    totalPrice: float(),
    subTotalPrice: float(),
    totalDiscounts: float(),
    totalTax: float(),

    // Processing flags
    linkOrder: checkbox({ defaultValue: true }),
    matchOrder: checkbox({ defaultValue: true }),
    processOrder: checkbox({ defaultValue: true }),

    // Status tracking
    status: text({ defaultValue: "PENDING" }),
    error: text({
      ui: {
        displayMode: "textarea",
      },
    }),

    // Metadata
    orderMetadata: json(),

    // Relationships
    shop: relationship({
      ref: "Shop.orders",
      ui: {
        displayMode: "cards",
        cardFields: ["name", "domain"],
        inlineCreate: { fields: ["name", "domain"] },
        inlineEdit: { fields: ["name", "domain"] },
      },
    }),
    lineItems: relationship({
      ref: "LineItem.order",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "quantity", "price"],
        inlineCreate: { fields: ["name", "quantity", "price"] },
        inlineEdit: { fields: ["name", "quantity", "price"] },
      },
    }),
    cartItems: relationship({
      ref: "CartItem.order",
      many: true,
    }),
    user: relationship({
      ref: "User.orders",
    }),

    ...trackingFields,
  },
});
