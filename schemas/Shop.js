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

export const Shop = list({
  access: {
    // create: isSignedIn,
    // read: rules.canReadShops,
    // update: rules.canUpdateShops,
    // delete: rules.canUpdateShops,
    operation: {
      create: isSignedIn,
    },
    filter: {
      query: rules.canReadShops,
      update: rules.canUpdateShops,
      delete: rules.canUpdateShops,
    },
  },
  fields: {
    name: text(),
    type: text(),
    domain: text({ isIndexed: "unique" }),
    accessToken: text(),
    searchProductsEndpoint: text(),
    searchOrdersEndpoint: text(),
    updateProductEndpoint: text(),

    getWebhooksEndpoint: text(),
    createWebhookEndpoint: text(),
    deleteWebhookEndpoint: text(),

    orders: relationship({ ref: "Order.shop", many: true }),
    shopItems: relationship({ ref: "ShopItem.shop", many: true }),

    links: relationship({ ref: "Link.shop", many: true }),

    user: relationship({
      ref: "User.shops",
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