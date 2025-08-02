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

export const ApiKey = list({
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
        // Remove existing API keys for the user before creating a new one
        const existingKeys = await context.query.ApiKey.findMany({
          where: { user: { id: { equals: context.session.itemId } } },
        });
        if (existingKeys.length > 0) {
          await context.query.ApiKey.deleteMany({
            where: existingKeys.map(key => ({ id: key.id })),
          });
        }
      }
    },
  },
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateApiKeys,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.canReadApiKeys,
      update: rules.canManageApiKeys,
      delete: rules.canManageApiKeys,
    },
  },
  fields: {
    user: relationship({
      ref: "User.apiKeys",
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