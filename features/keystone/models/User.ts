import { list } from "@keystone-6/core";
import { allOperations, denyAll } from "@keystone-6/core/access";
import {
  checkbox,
  password,
  relationship,
  text,
  timestamp,
} from "@keystone-6/core/fields";

import {
  isSignedIn,
  permissions,
  rules,
  itemRules,
  fieldRules,
} from "../access";
import { trackingFields } from "./trackingFields";

export const User = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageUsers,
      update: isSignedIn,
      delete: permissions.canManageUsers,
    },
    filter: {
      query: rules.canReadPeople,
      update: rules.canUpdatePeople,
      delete: rules.canUpdatePeople,
    },
    item: {
      update: itemRules.canUpdateUser,
      delete: itemRules.canDeleteUser,
    },
  },
  ui: {
    hideCreate: (args) => !permissions.canManageUsers(args),
    hideDelete: (args) => !permissions.canManageUsers(args),
    listView: {
      initialColumns: ["name", "email", "role", "shops", "channels"],
    },
    itemView: {
      defaultFieldMode: ({ session, item }) => {
        // canEditOtherUsers can edit other people
        if (session?.data.role?.canEditOtherUsers) return "edit";

        // edit themselves
        if (session?.itemId === item?.id) return "edit";

        // else, default all fields to read mode
        return "read";
      },
    },
  },
  fields: {
    name: text({
      validation: {
        isRequired: true,
      },
    }),
    email: text({
      isFilterable: false,
      isOrderable: false,
      isIndexed: "unique",
      validation: {
        isRequired: true,
      },
    }),
    password: password({
      access: {
        read: fieldRules.canReadUserPassword,
        update: fieldRules.canUpdateUserPassword,
      },
      validation: { isRequired: true },
    }),
    role: relationship({
      ref: "Role.assignedTo",
      access: {
        create: fieldRules.canManageUserRole,
        update: fieldRules.canManageUserRole,
      },
      ui: {
        itemView: {
          fieldMode: (args) =>
            permissions.canManageUsers(args) ? "edit" : "read",
        },
      },
    }),

    // E-commerce Platform Management Relationships
    shops: relationship({
      ref: "Shop.user",
      many: true,
    }),
    channels: relationship({
      ref: "Channel.user",
      many: true,
    }),
    orders: relationship({
      ref: "Order.user",
      many: true,
    }),
    lineItems: relationship({
      ref: "LineItem.user",
      many: true,
    }),
    cartItems: relationship({
      ref: "CartItem.user",
      many: true,
    }),
    shopItems: relationship({
      ref: "ShopItem.user",
      many: true,
    }),
    channelItems: relationship({
      ref: "ChannelItem.user",
      many: true,
    }),
    matches: relationship({
      ref: "Match.user",
      many: true,
    }),
    links: relationship({
      ref: "Link.user",
      many: true,
    }),
    trackingDetails: relationship({
      ref: "TrackingDetail.user",
      many: true,
    }),
    shopPlatforms: relationship({
      ref: "ShopPlatform.user",
      many: true,
    }),
    channelPlatforms: relationship({
      ref: "ChannelPlatform.user",
      many: true,
    }),
    apiKeys: relationship({
      ref: "ApiKey.user",
      many: true,
    }),

    ...trackingFields,
  },
});
