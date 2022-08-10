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

export const Match = list({
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
    input: relationship({ ref: "ShopItem.matches", many: true }),
    output: relationship({ ref: "ChannelItem.matches", many: true }),
    user: relationship({
      ref: "User.matches",
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
