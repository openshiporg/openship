import {
  integer,
  text,
  relationship,
  virtual,
  float,
  json,
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
    name: text({ validation: { isRequired: true } }),

    ...group({
      label: "Credentials",
      description: "Shop credentials",
      fields: {
        domain: text(),
        accessToken: text(),
      },
    }),

    links: relationship({ ref: "Link.shop", many: true }),

    platform: relationship({
      ref: "ShopPlatform.shops",
      ui: {
        displayMode: "select",
        labelField: "name",
      },
    }),

    orders: relationship({ ref: "Order.shop", many: true }),
    shopItems: relationship({ ref: "ShopItem.shop", many: true }),

    metadata: json(),

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
