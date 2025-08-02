import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { relationship, timestamp, virtual } from "@keystone-6/core/fields";
import { graphql } from "@keystone-6/core";

import { isSignedIn, permissions, rules } from "../access";
import { trackingFields } from "./trackingFields";

export const Match = list({
  access: {
    operation: {
      create: permissions.canCreateMatches,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageMatches,
    },
    filter: {
      query: rules.canReadMatches,
      update: rules.canManageMatches,
      delete: rules.canManageMatches,
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
    // TODO: Add complex match validation hooks from Openship
    // beforeOperation: async ({ operation, resolvedData, context }) => {
    //   // Ensure items exist before creating matches
    // },
  },
  ui: {
    listView: {
      initialColumns: ["input", "output", "user"],
    },
  },
  fields: {
    // Virtual fields for match status
    outputPriceChanged: virtual({
      field: graphql.field({
        type: graphql.String,
        resolve() {
          return "Price change detection for output items";
        },
      }),
      ui: {
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "hidden" },
      },
    }),
    inventoryNeedsToBeSynced: virtual({
      field: graphql.field({
        type: graphql.object()({
          name: "MatchInventoryData",
          fields: {
            syncEligible: graphql.field({ type: graphql.Boolean }),
            sourceQuantity: graphql.field({ type: graphql.Int }),
            targetQuantity: graphql.field({ type: graphql.Int }),
            syncNeeded: graphql.field({ type: graphql.Boolean }),
          },
        }),
        async resolve(item, args, context) {
          const match = await context.query.Match.findOne({
            where: { id: item.id },
            query: `
              input { quantity externalDetails { inventory } }
              output { quantity externalDetails { inventory } }
            `,
          });

          const result = {
            syncEligible: false,
            sourceQuantity: null,
            targetQuantity: null,
          };

          if (match?.input?.length === 1 && match?.output?.length === 1) {
            const input = match.input[0];
            const output = match.output[0];

            if (
              input.quantity === 1 &&
              output.quantity === 1 &&
              input.externalDetails?.inventory !== undefined &&
              output.externalDetails?.inventory !== undefined
            ) {
              result.syncEligible = true;
              result.sourceQuantity = input.externalDetails.inventory;
              result.targetQuantity = output.externalDetails.inventory;
            }
          }

          result.syncNeeded = result.syncEligible && 
                             result.sourceQuantity !== result.targetQuantity;

          return result;
        },
      }),
      ui: {
        query: "{ syncEligible sourceQuantity targetQuantity syncNeeded }",
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "hidden" },
      },
    }),

    // Relationships - Many-to-many between ShopItems and ChannelItems
    input: relationship({
      ref: "ShopItem.matches",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["productId", "variantId", "quantity"],
        inlineConnect: true,
      },
    }),
    output: relationship({
      ref: "ChannelItem.matches",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["productId", "variantId", "quantity", "price"],
        inlineConnect: true,
      },
    }),
    user: relationship({
      ref: "User.matches",
    }),

    ...trackingFields,
  },
});
