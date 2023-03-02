import {
  integer,
  text,
  relationship,
  virtual,
  float,
  json,
} from "@keystone-6/core/fields";
import { list } from "@keystone-6/core";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const Link = list({
  hooks: {
    beforeOperation: async ({
      listKey,
      operation,
      inputData,
      item,
      resolvedData,
      context,
    }) => {
      if (operation === "create") {
        const aIds = await context.query.Link.findMany({
          where: { shop: { id: { equals: inputData.shop.connect.id } } },
        });
        if (aIds.length > 0)
          await context.query.apiKey.deleteMany({
            where: aIds,
          });
      }
    },
  },
  access: {
    // create: isSignedIn,
    // read: rules.canReadMatches,
    // update: rules.canUpdateMatches,
    // delete: rules.canUpdateMatches,
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
    shop: relationship({ ref: "Shop.links" }),
    channel: relationship({ ref: "Channel.links" }),
    filter: json(),
    user: relationship({
      ref: "User.links",
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
