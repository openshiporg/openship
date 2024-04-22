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

const canReadKeys = ({ session }) => {
  if (!session) {
    // No session? No Users.
    return false;
  }
  if (permissions.canSeeOtherUsers({ session })) {
    return true; // They can read everything!
  }
  // Can only see yourself
  return { user: { id: { equals: session.itemId } } };
};

const canUpdateKeys = ({ session }) => {
  if (!session) {
    // No session? No Users.
    return false;
  }
  if (permissions.canManageUsers({ session })) {
    return true; // They can read everything!
  }
  // Can only see yourself
  return { user: { id: { equals: session.itemId } } };
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
    // operation: {
    //   create: isSignedIn,
    //   query: isSignedIn,
    //   delete: isSignedIn,
    // },
    // filter: {
    //   query: canManageKeys,
    //   update: canManageKeys,
    // },
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      delete: isSignedIn,
      update: isSignedIn,
    },
    filter: {
      // we use user rules since ApiKey is connected to the user
      query: canReadKeys,
      update: canUpdateKeys,
      delete: canUpdateKeys,
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
