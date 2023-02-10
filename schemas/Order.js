import { LineItem } from "./LineItem";
import {
  integer,
  text,
  relationship,
  virtual,
  float,
  json,
  checkbox,
} from "@keystone-6/core/fields";
import { list } from "@keystone-6/core";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";
import { placeMultipleOrders } from "../lib/placeMultipleOrders";
import { getMatches } from "../mutations/addMatchToCart";

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
              name
              links {
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
          `,
        });

        // console.log("linkOrder", item.linkOrder);

        if (item.linkOrder && order.shop?.links[0]?.channel?.id) {
          console.log("linkOrder", item.linkOrder);
          console.log("linkedOrderFound", order.shop?.links[0]?.channel?.id);

          const cartItemsFromLink = await sudoContext.query.CartItem.createMany(
            {
              data: order.lineItems.map((c) => ({
                ...c,
                channel: {
                  connect: { id: order.shop?.links[0]?.channel?.id },
                },
                order: { connect: { id: item.id } },
                user: { connect: { id: order.user?.id } },
              })),
            }
          );

          console.log({ cartItemsFromLink });

          if (item.processOrder) {
            const processedOrder = await placeMultipleOrders({
              ids: [item.id],
              query: sudoContext.query,
            });
          }
        } else {
          if (item.matchOrder) {
            const cartItemsFromMatch = await getMatches({
              orderId: item.id,
              context: sudoContext,
            });
            console.log({ cartItemsFromMatch });

            const order = await sudoContext.query.Order.findOne({
              where: { id: item.id },
              query: `id orderError`,
            });
            console.log("PENDING", order);
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
        }
      }
    },
  },
  access: {
    // create: isSignedIn,
    // read: rules.canReadOrders,
    // update: rules.canUpdateOrders,
    // delete: rules.canUpdateOrders,
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
    orderId: float(),
    orderName: text(),
    email: text(),
    first_name: text(),
    last_name: text(),
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
    ...trackingFields,
  },
});
