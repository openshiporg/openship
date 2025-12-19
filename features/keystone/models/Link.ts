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
        type: graphql.JSON,
        async resolve(item: any, args, context) {
          // Get the filters from the item
          const link = await context.query.Link.findOne({
            where: { id: item.id },
            query: 'filters',
          });
          
          const filters = link?.filters;
          
          // If no filters or not an array, return empty object (match all)
          if (!filters || !Array.isArray(filters) || filters.length === 0) {
            return {};
          }
          
          // Convert filters array to Keystone where clause format
          // Using the same logic as buildWhereClause.ts
          const whereConditions: Record<string, any>[] = [];
          
          for (const filter of filters) {
            if (!filter.field || !filter.type || filter.value === undefined) {
              continue;
            }
            
            const { field: fieldPath, type, value } = filter;
            
            // Handle text field filter types (contains_i, is_i, starts_with_i, etc.)
            if (type.endsWith('_i')) {
              const isNot = type.startsWith('not_');
              // Convert filter type to GraphQL key
              // e.g., contains_i -> contains, not_contains_i -> contains (with not wrapper)
              // e.g., is_i -> equals, starts_with_i -> startsWith
              const key = type === 'is_i' || type === 'not_i'
                ? 'equals'
                : type
                    .replace(/_i$/, '')
                    .replace('not_', '')
                    .replace(/_([a-z])/g, (_: string, char: string) => char.toUpperCase());
              
              const baseFilter = { 
                [key]: value,
                mode: 'insensitive'
              };
              
              whereConditions.push({
                [fieldPath]: isNot ? { not: baseFilter } : baseFilter,
              });
            }
            // Handle other filter types (equals, gt, lt, etc.)
            else if (['equals', 'gt', 'lt', 'gte', 'lte', 'in', 'notIn'].includes(type)) {
              whereConditions.push({
                [fieldPath]: { [type]: value },
              });
            }
            // Handle not filter
            else if (type === 'not') {
              whereConditions.push({
                [fieldPath]: { not: { equals: value } },
              });
            }
            // Handle empty/not_empty
            else if (type === 'empty') {
              whereConditions.push({
                [fieldPath]: { equals: null },
              });
            }
            else if (type === 'not_empty') {
              whereConditions.push({
                [fieldPath]: { not: { equals: null } },
              });
            }
            // Handle relationship filters
            else if (type === 'is') {
              whereConditions.push({
                [fieldPath]: { id: { equals: value } },
              });
            }
            else if (type === 'not_is') {
              whereConditions.push({
                [fieldPath]: { not: { id: { equals: value } } },
              });
            }
            else if (type === 'some') {
              whereConditions.push({
                [fieldPath]: { some: { id: { in: Array.isArray(value) ? value : [value] } } },
              });
            }
            else if (type === 'not_some') {
              whereConditions.push({
                [fieldPath]: { not: { some: { id: { in: Array.isArray(value) ? value : [value] } } } },
              });
            }
            // Handle select matches/not_matches
            else if (type === 'matches') {
              whereConditions.push({
                [fieldPath]: { in: Array.isArray(value) ? value : [value] },
              });
            }
            else if (type === 'not_matches') {
              whereConditions.push({
                [fieldPath]: { notIn: Array.isArray(value) ? value : [value] },
              });
            }
            // Fallback for any other type
            else {
              whereConditions.push({
                [fieldPath]: { [type]: value },
              });
            }
          }
          
          // Return combined where clause
          if (whereConditions.length === 0) {
            return {};
          }
          
          if (whereConditions.length === 1) {
            return whereConditions[0];
          }
          
          return { AND: whereConditions };
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
