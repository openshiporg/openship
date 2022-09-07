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

export const ShopMetafield = list({
  access: {
    // create: isSignedIn,
    // read: rules.canReadMatches,
    // update: rules.canUpdateMatches,
    // delete: rules.canUpdateMatches,
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
    key: text(),
    value: text(),
    shop: relationship({ ref: "Shop.metafields" }),
    user: relationship({
      ref: "User.shopMetafields",
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          // Default to the currently logged in user on create.
          if (operation === 'create' && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.user;
        },
      },
    }),
    ...trackingFields,
  },
});
