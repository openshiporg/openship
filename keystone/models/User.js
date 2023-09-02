import { list } from "@keystone-6/core";
import { text, password, relationship } from "@keystone-6/core/fields";
import { permissions, rules } from "../access";
import { trackingFields } from "./trackingFields";

export const User = list({
  access: {
    operation: {
      create: process.env.ALLOW_EXTERNAL_SIGNUPS
        ? () => true
        : permissions.canManageUsers,
      delete: permissions.canManageUsers,
    },
    filter: {
      query: rules.canReadUsers,
      update: rules.canUpdateUsers,
    },
  },
  ui: {
    hideCreate: (args) => !permissions.canManageUsers(args),
    hideDelete: (args) => !permissions.canManageUsers(args),
    listView: {
      initialColumns: ["name", "role"],
    },
    itemView: {
      defaultFieldMode: ({ session, item }) => {
        if (session.data.role?.canManageUsers) return "edit";
        if (session.itemId === item.id) return "edit";
        return "read";
      },
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    email: text({ validation: { isRequired: true }, isIndexed: "unique" }),
    password: password({
      validation: { isRequired: true },
      access: {
        update: ({ session, item }) =>
          permissions.canManageUsers({ session }) || session.itemId === item.id,
      },
    }),
    shops: relationship({ ref: "Shop.user", many: true }),
    channels: relationship({ ref: "Channel.user", many: true }),
    orders: relationship({ ref: "Order.user", many: true }),
    lineItems: relationship({ ref: "LineItem.user", many: true }),
    cartItems: relationship({ ref: "CartItem.user", many: true }),
    shopItems: relationship({ ref: "ShopItem.user", many: true }),
    channelItems: relationship({ ref: "ChannelItem.user", many: true }),
    apiKeys: relationship({ ref: "apiKey.user", many: true }),
    matches: relationship({ ref: "Match.user", many: true }),
    links: relationship({ ref: "Link.user", many: true }),
    channelMetafields: relationship({
      ref: "ChannelMetafield.user",
      many: true,
    }),
    shopMetafields: relationship({ ref: "ShopMetafield.user", many: true }),
    trackingDetails: relationship({ ref: "TrackingDetail.user", many: true }),
    role: relationship({
      ref: "Role.assignedTo",
      access: {
        create: permissions.canManageUsers,
        update: permissions.canManageUsers,
      },
      ui: {
        itemView: {
          fieldMode: (args) =>
            permissions.canManageUsers(args) ? "edit" : "read",
        },
      },
    }),
    ...trackingFields,
  },
});
