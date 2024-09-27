import {
  text,
  relationship,
  float,
  json,
  checkbox,
  virtual,
} from "@keystone-6/core/fields";
import { graphql, list } from "@keystone-6/core";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";
import { placeMultipleOrders } from "../lib/placeMultipleOrders";
import { getMatches } from "../extendGraphqlSchema/mutations/addMatchToCart";

async function applyDynamicWhereClause(context, linkId, orderId) {
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
  hooks: {
    beforeOperation: async ({ listKey, operation, item, context }) => {
      if (operation === "delete") {
        const lIds = await context.query.LineItem.findMany({
          where: { order: { id: { equals: item.id } } },
        });
        const cIds = await context.query.CartItem.findMany({
          where: { order: { id: { equals: item.id } } },
        });
        await context.query.LineItem.deleteMany({
          where: lIds,
        });
        await context.query.CartItem.deleteMany({
          where: cIds,
        });
      }
    },
    afterOperation: async ({ operation, item, context }) => {
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
          const links = order.shop.links.sort((a, b) => a.rank - b.rank);
          let matchedLinks = [];

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
                data: order.lineItems.map((c) => ({
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
                orderError: "No matching link found for this order",
              },
            });
          }
        } else if (item.matchOrder) {
          if (item.matchOrder) {
            const cartItemsFromMatch = await getMatches({
              orderId: item.id,
              context: sudoContext,
            });

            const order = await sudoContext.query.Order.findOne({
              where: { id: item.id },
              query: `id orderError`,
            });
            if (order?.orderError) {
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
    orderId: text(),
    orderLink: virtual({
      field: graphql.field({
        type: graphql.String,
        async resolve(item, args, context) {
          const order = await context.query.Order.findOne({
            where: { id: item.id },
            query: `
              id
              orderId
              shop {
                id
                domain
                platform {
                  id
                  orderLinkFunction
                }
              }
            `,
          });

          if (!order || !order.shop) {
            return null;
          }

          const { shop } = order;

          if (shop.platform && shop.platform.orderLinkFunction) {
            const { orderLinkFunction } = shop.platform;

            if (orderLinkFunction.startsWith("http")) {
              // External API call
              try {
                const response = await fetch(orderLinkFunction, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    domain: shop.domain,
                    orderId: order.orderId,
                  }),
                });

                if (!response.ok) {
                  throw new Error(`Failed to generate order link: ${response.statusText}`);
                }

                const result = await response.json();
                return result.orderLink;
              } catch (error) {
                console.error("Error generating order link:", error);
                return `${shop.domain}/orders/${order.orderId}`;
              }
            } else {
              // Internal function call
              try {
                const shopAdapters = await import(
                  `../../../shopAdapters/${orderLinkFunction}.js`
                );
                const result = await shopAdapters.generateOrderLink({
                  domain: shop.domain,
                  orderId: order.orderId,
                });

                if (result.error) {
                  throw new Error(result.error);
                }

                return result.orderLink;
              } catch (error) {
                console.error("Error generating order link:", error);
                return `${shop.domain}/orders/${order.orderId}`;
              }
            }
          } else {
            // Default behavior if no orderLinkFunction is specified
            return `${shop.domain}/orders/${order.orderId}`;
          }
        },
      }),
    }),
    orderName: text(),
    email: text(),
    firstName: text(),
    lastName: text(),
    streetAddress1: text(),
    streetAddress2: text(),
    city: text(),
    state: text(),
    zip: text(),
    currency: text(),
    totalPrice: text(),
    subTotalPrice: text(),
    totalDiscount: text(),
    totalTax: text(),
    phoneNumber: text(),
    note: text(),
    shippingMethod: json(),
    country: text(),
    orderError: text(),
    status: text(),
    locationId: float(),
    user: relationship({
      ref: "User.orders",
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
    shop: relationship({ ref: "Shop.orders" }),
    lineItems: relationship({ ref: "LineItem.order", many: true }),
    cartItems: relationship({ ref: "CartItem.order", many: true }),
    linkOrder: checkbox(),
    matchOrder: checkbox(),
    processOrder: checkbox(),
    readyToProcess: virtual({
      field: graphql.field({
        type: graphql.String,
        async resolve(item, args, context) {
          const order = await context.query.Order.findOne({
            where: { id: item.id },
            query: "orderError status",
          });
          if (order.orderError) {
            return `NOT READY: Order Error - ${order.orderError}`;
          }

          if (order.status !== "PENDING") {
            return `NOT READY: Status is ${order.status}, needs to be PENDING`;
          }

          const cartItemsReadyToBeProcessed = await context.query.CartItem.count({
            where: {
              order: { id: { equals: item.id } },
              AND: [{ error: { equals: "" } }, { purchaseId: { equals: "" } }],
            },
          });
          if (cartItemsReadyToBeProcessed === 0) {
            return "NOT READY: No cart items ready to be processed, some may have errors";
          }
          return "READY";
        },
      }),
    }),
    ...trackingFields,
  },
  // ui: {
  //   listView: { initialColumns: ["lineItems", "cartItems"] },
  // },
});
