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

export const ChannelItem = list({
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
    quantity: integer(),
    productId: text(),
    variantId: text(),
    lineItemId: text(),
    price: text(),
    matches: relationship({ ref: "Match.output", many: true }),
    channel: relationship({ ref: "Channel.channelItems" }),
    user: relationship({
      ref: "User.channelItems",
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
