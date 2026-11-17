import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { json, relationship, text, timestamp } from "@keystone-6/core/fields";

import { isSignedIn, permissions, rules, isSignedInFor } from "../access";
import { trackingFields } from "./trackingFields";
import { relaySourceTrackingForDetail } from "../../integrations/channel/tracking-relay";

export const TrackingDetail = list({
  access: {
    operation: {
      create: isSignedInFor("canManageOrders"),
      query: isSignedInFor("canSeeOtherOrders"),
      update: isSignedInFor("canManageOrders"),
      delete: permissions.canManageOrders,
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canManageOrders,
      delete: rules.canManageOrders,
    },
  },
  hooks: {
    resolveInput: {
      create: ({ operation, resolvedData, context }) => {
        // Auto-assign user if not provided
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } },
          };
        }
        return resolvedData;
      },
    },
    afterOperation: async ({ operation, item, context }) => {
      if (operation === "create") {
        // Propagate relay failures so the inbound webhook remains retryable.
        // The TrackingDetail row itself is the durable pending state.
        await relaySourceTrackingForDetail(context, String(item.id));
      }
    },
  },
  ui: {
    listView: {
      initialColumns: ["trackingCompany", "trackingNumber", "purchaseId"],
    },
  },
  fields: {
    // Tracking information
    trackingCompany: text({
      validation: { isRequired: true },
    }),
    trackingNumber: text({
      validation: { isRequired: true },
    }),
    purchaseId: text(),
    dedupeKey: text({
      isIndexed: "unique",
      db: { isNullable: true },
      ui: {
        itemView: { fieldMode: "read" },
        createView: { fieldMode: "hidden" },
      },
    }),
    fulfillmentLineItems: json({
      defaultValue: [],
      ui: { itemView: { fieldMode: "read" } },
    }),
    relayedAt: timestamp({
      ui: { itemView: { fieldMode: "read" } },
    }),

    // Relationships
    cartItems: relationship({
      ref: "CartItem.trackingDetails",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "quantity", "status"],
      },
    }),
    user: relationship({
      ref: "User.trackingDetails",
    }),

    ...trackingFields,
  },
});
