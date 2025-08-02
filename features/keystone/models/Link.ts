import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import {
  integer,
  json,
  relationship,
  timestamp,
  virtual,
} from "@keystone-6/core/fields";
import { graphql } from "@keystone-6/core";

import { isSignedIn, permissions, rules } from "../access";
import { trackingFields } from "./trackingFields";

export const Link = list({
  access: {
    operation: {
      create: permissions.canCreateLinks,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageLinks,
    },
    filter: {
      query: rules.canReadLinks,
      update: rules.canManageLinks,
      delete: rules.canManageLinks,
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
    beforeOperation: async ({ operation, resolvedData, context }) => {
      if (operation === "create") {
        const shopId = resolvedData.shop.connect.id;

        const existingLinks = await context.query.Link.findMany({
          where: { shop: { id: { equals: shopId } } },
        });

        // Calculate the next rank value
        const nextRank =
          existingLinks.length > 0 ? existingLinks.length + 1 : 1;

        resolvedData.rank = nextRank;
      }
    },
  },
  ui: {
    listView: {
      initialColumns: ["shop", "channel", "rank"],
    },
  },
  fields: {
    // Processing order
    rank: integer({
      defaultValue: 1,
      ui: {
        description: "Processing order - lower numbers processed first",
      },
    }),

    // Filter configuration
    filters: json({
      defaultValue: [],
      ui: {
        description: "Order filtering rules",
      },
    }),
    customWhere: json({
      defaultValue: {},
      ui: {
        description: "Custom where clause for order filtering",
      },
    }),

    // Virtual field for dynamic where clause
    dynamicWhereClause: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve() {
          return "Generated where clause based on filters";
        },
      }),
      ui: {
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "hidden" },
      },
    }),

    // Relationships
    shop: relationship({
      ref: "Shop.links",
      ui: {
        displayMode: "cards",
        cardFields: ["name", "domain"],
      },
    }),
    channel: relationship({
      ref: "Channel.links",
      ui: {
        displayMode: "cards",
        cardFields: ["name", "domain"],
      },
    }),
    user: relationship({
      ref: "User.links",
    }),

    ...trackingFields,
  },
});
