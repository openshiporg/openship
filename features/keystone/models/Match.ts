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
    resolveInput: async ({ item, resolvedData, operation, context }) => {
      const { input, output } = resolvedData;

      const ensureShopItems = async (items: any) => {
        const processedItems = [];
        if (items.create) {
          for (const item of items.create) {
            let [existingItem] = await context.query.ShopItem.findMany({
              where: {
                productId: { equals: item.productId },
                variantId: { equals: item.variantId },
                quantity: { equals: item.quantity },
                shop: { id: { equals: item.shop.connect.id } },
                user: {
                  id: {
                    equals: item.user?.connect?.id || context.session?.itemId,
                  },
                },
              },
              query: "id",
            });

            if (!existingItem) {
              existingItem = await context.query.ShopItem.createOne({
                data: item,
                query: "id",
              });
            }

            processedItems.push({ id: existingItem.id });
          }
        }
        return processedItems;
      };

      const ensureChannelItems = async (items: any) => {
        const processedItems = [];
        if (items.create) {
          for (const item of items.create) {
            let existingItem = await context.query.ChannelItem.findOne({
              where: {
                productId: { equals: item.productId },
                variantId: { equals: item.variantId },
                quantity: { equals: item.quantity },
                channel: { id: { equals: item.channel.connect.id } },
                user: {
                  id: {
                    equals: item.user?.connect?.id || context.session?.itemId,
                  },
                },
              },
              query: "id",
            });

            if (!existingItem) {
              existingItem = await context.query.ChannelItem.createOne({
                data: item,
                query: "id",
              });
            }

            processedItems.push({ id: existingItem.id });
          }
        }
        return processedItems;
      };

      if (input && input.create) {
        const processedInput = await ensureShopItems(input);
        resolvedData.input.connect = [
          ...(resolvedData.input.connect || []),
          ...processedInput,
        ];
        delete resolvedData.input.create;
      }

      if (output && output.create) {
        const processedOutput = await ensureChannelItems(output);
        resolvedData.output.connect = [
          ...(resolvedData.output.connect || []),
          ...processedOutput,
        ];
        delete resolvedData.output.create;
      }

      // Check for duplicate matches
      const checkForDuplicate = async (inputIds: any) => {
        const existingMatches = await context.query.Match.findMany({
          where: {
            input: {
              some: { id: { in: inputIds } },
            },
          },
          query: "id input { id }",
        });

        return existingMatches.some((match) => {
          const matchInputIds = match.input.map((item: any) => item.id);
          return (
            matchInputIds.length === inputIds.length &&
            matchInputIds.every((id: any) => inputIds.includes(id))
          );
        });
      };

      if (operation === "create") {
        if (
          resolvedData.input.connect &&
          resolvedData.input.connect.length > 0
        ) {
          const inputIds = resolvedData.input.connect.map((item: any) => item.id);
          const isDuplicate = await checkForDuplicate(inputIds);

          if (isDuplicate) {
            throw new Error(
              "A match with the same input combination already exists."
            );
          }
        }
      }

      if (operation === "update") {
        if (resolvedData.input) {
          // Fetch the current state of the match being updated
          const matchToUpdate = await context.query.Match.findOne({
            where: { id: String(item.id) },
            query: `id input { id productId variantId quantity shop { id } }`,
          });

          const newInputs = resolvedData.input.connect
            ? await Promise.all(
                resolvedData.input.connect.map(async (connectItem: any) => {
                  return await context.query.ShopItem.findOne({
                    where: { id: connectItem.id },
                    query: `id productId variantId quantity shop { id }`,
                  });
                })
              )
            : [];

          const disconnectedIds = resolvedData.input.disconnect
            ? resolvedData.input.disconnect.map((item: any) => item.id)
            : [];

          const remainingCurrentInputs = matchToUpdate.input.filter(
            (input: any) => !disconnectedIds.includes(input.id)
          );

          const combinedInputs = [...remainingCurrentInputs, ...newInputs];
          const inputIds = combinedInputs.map((item) => item.id);

          const isDuplicate = await checkForDuplicate(inputIds);

          if (isDuplicate) {
            throw new Error(
              "A match with the same input combination already exists."
            );
          }
        }
      }

      // Auto-assign user if not provided
      if (!resolvedData.user && context.session?.itemId) {
        resolvedData.user = { connect: { id: context.session.itemId } };
      }

      return resolvedData;
    },
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
            syncEligible: graphql.field({ type: graphql.Boolean, resolve: (parent: any) => parent.syncEligible }),
            sourceQuantity: graphql.field({ type: graphql.Int, resolve: (parent: any) => parent.sourceQuantity }),
            targetQuantity: graphql.field({ type: graphql.Int, resolve: (parent: any) => parent.targetQuantity }),
            syncNeeded: graphql.field({ type: graphql.Boolean, resolve: (parent: any) => parent.syncNeeded }),
          },
        }),
        async resolve(item, args, context) {
          const match = await context.query.Match.findOne({
            where: { id: String(item.id) },
            query: `
              input { quantity externalDetails { inventory } }
              output { quantity externalDetails { inventory } }
            `,
          });

          const result = {
            syncEligible: false,
            sourceQuantity: null,
            targetQuantity: null,
            syncNeeded: false,
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
