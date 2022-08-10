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

export const LineItem = list({
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
    name: text(),
    image: text(),
    price: text(),
    quantity: integer(),
    productId: text(),
    variantId: text(),
    sku: text(),
    lineItemId: text(),
    order: relationship({ ref: "Order.lineItems" }),
    user: relationship({
      ref: "User.lineItems",
      hooks: {
        resolveInput: ({ context, resolvedData }) => {
          if (context?.session?.itemId) {
            return {
              connect: { id: context.session.itemId },
            };
          }
          return resolvedData.user;
        },
      },
    }),
    ...trackingFields,
  },
});
