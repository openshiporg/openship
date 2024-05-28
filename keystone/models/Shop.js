import {
  integer,
  text,
  relationship,
  virtual,
  float,
} from "@keystone-6/core/fields";
import { graphql, list, group } from "@keystone-6/core";
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
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.canReadShops,
      update: rules.canUpdateShops,
      delete: rules.canUpdateShops,
    },
  },
  fields: {
    // ...group({
    //   label: "Credentials",
    //   description: "Shop credentials",
    //   fields: {
    //     name: text(),
    //     domain: text({ isIndexed: "unique" }),
    //     accessToken: text(),
    //   },
    // }),
    name: text(),
    domain: text({ isIndexed: "unique" }),
    accessToken: text(),

    platform: relationship({
      ref: "ShopPlatform.shops",
      ui: {
        displayMode: "select",
        labelField: "name",
      },
    }),

    orders: relationship({ ref: "Order.shop", many: true }),
    shopItems: relationship({ ref: "ShopItem.shop", many: true }),

    links: relationship({ ref: "Link.shop", many: true }),
    metafields: relationship({ ref: "ShopMetafield.shop", many: true }),

    user: relationship({
      ref: "User.shops",
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
});
