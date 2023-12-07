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

const canManageKeys = ({ session }) => {
  if (!session) {
    // No session? No Users.
    return false;
  }
  return { user: { id: session.itemId } };
};

export const apiKey = list({
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
        const aIds = await context.query.apiKey.findMany({
          where: { user: { id: { equals: context.session.itemId } } },
        });
        if (aIds.length > 0)
          await context.query.apiKey.deleteMany({
            where: aIds,
          });
      }
    },
  },
  access: {
    operation: {
      create: isSignedIn,
      read: canManageKeys,
      update: canManageKeys,
      delete: ({ session }) => canManageKeys({ session }) !== false,
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
