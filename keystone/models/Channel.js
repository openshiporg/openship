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

export const Channel = list({
  access: {
    // create: isSignedIn,
    // read: rules.canReadChannels,
    // update: rules.canUpdateChannels,
    // delete: rules.canUpdateChannels,
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
    name: text(),
    type: text(),
    domain: text(),
    accessToken: text(),
    searchProductsEndpoint: text(),
    createPurchaseEndpoint: text(),

    getWebhooksEndpoint: text(),
    createWebhookEndpoint: text(),
    deleteWebhookEndpoint: text(),

    channelItems: relationship({ ref: "ChannelItem.channel", many: true }),
    cartItems: relationship({ ref: "CartItem.channel", many: true }),

    links: relationship({ ref: "Link.channel", many: true }),

    metafields: relationship({ ref: "ChannelMetafield.channel", many: true }),

    user: relationship({
      ref: "User.channels",
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
