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

export const ShopItem = list({
  access: {
    operation: {
      create: isSignedIn,
    },
    filter: {
      query: rules.canReadMatches,
      update: rules.canUpdateMatches,
      delete: rules.canUpdateMatches,
    },
  },
  fields: {
    quantity: integer(),
    productId: text(),
    variantId: text(),
    lineItemId: text(),
    matches: relationship({ ref: "Match.input", many: true }),
    shop: relationship({ ref: "Shop.shopItems" }),
    user: relationship({
      ref: "User.shopItems",
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
