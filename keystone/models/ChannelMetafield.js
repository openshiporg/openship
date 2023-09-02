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

export const ChannelMetafield = list({
  access: {
    // create: isSignedIn,
    // read: rules.canReadMatches,
    // update: rules.canUpdateMatches,
    // delete: rules.canUpdateMatches,
    operation: {
      create: isSignedIn,
    },
    filter: {
      query: rules.canReadChannels,
      update: rules.canUpdateChannels,
      delete: rules.canUpdateChannels,
    },
  },
  fields: {
    key: text(),
    value: text(),
    channel: relationship({ ref: "Channel.metafields" }),
    user: relationship({
      ref: "User.channelMetafields",
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
