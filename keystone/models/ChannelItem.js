import {
  integer,
  text,
  relationship,
  virtual,
  float,
} from "@keystone-6/core/fields";
import { graphql, list } from "@keystone-6/core";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";
import { getChannelProduct } from "../extendGraphqlSchema/queries";

function mergeData(existingData, newData) {
  const updatedData = {};

  // Loop through all keys in existingData to create a base for updatedData
  Object.keys(existingData).forEach((key) => {
    // Default to existing data
    updatedData[key] = existingData[key];

    // Check if new data is provided for the key
    if (newData[key] !== undefined) {
      if (typeof newData[key] === "object" && newData[key] !== null) {
        // Handle connect and disconnect for relationships
        if (newData[key].connect) {
          updatedData[key] = newData[key].connect.id; // Use connected ID
        } else if (newData[key].disconnect) {
          updatedData[key] = null; // Disconnect the relationship
        }
      } else {
        // Directly assign new data if it's not an object or null
        updatedData[key] = newData[key];
      }
    }
  });

  return updatedData;
}

export const ChannelItem = list({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
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
    priceChanged: virtual({
      field: graphql.field({
        type: graphql.Float,
        async resolve(item, args, context) {
          const channelItem = await context.query.ChannelItem.findOne({
            where: { id: item.id },
            query: 'price externalDetails { price }',
          });
    
          if (channelItem) {
            const savedPrice = parseFloat(channelItem.price);
            const currentPrice = parseFloat(channelItem.externalDetails.price);
            return currentPrice - savedPrice;
          }
          return 0;
        },
      }),
    }),
    externalDetails: virtual({
      field: graphql.field({
        type: graphql.object()({
          name: "ChannelProduct",
          fields: {
            image: graphql.field({ type: graphql.String }),
            title: graphql.field({ type: graphql.String }),
            productId: graphql.field({ type: graphql.ID }),
            variantId: graphql.field({ type: graphql.ID }),
            price: graphql.field({ type: graphql.String }),
            availableForSale: graphql.field({ type: graphql.Boolean }),
            productLink: graphql.field({ type: graphql.String }),
            inventory: graphql.field({ type: graphql.Int }),
            inventoryTracked: graphql.field({ type: graphql.Boolean }),
            error: graphql.field({ type: graphql.String }),
          },
        }),
        resolve: async (item, args, context) => {
          const channelItem = await context.query.ChannelItem.findOne({
            where: { id: item.id },
            query: "channel { id }",
          });

          if (!channelItem?.channel) {
            console.error("Channel not associated or missing.");
            return { error: "Channel not associated or missing." };
          }

          const channelId = channelItem.channel.id;

          try {
            const product = await getChannelProduct(
              null,
              {
                channelId: channelId,
                productId: item.productId,
                variantId: item.variantId,
              },
              context
            );
            return product;
          } catch (error) {
            console.error("Failed to fetch external details:", error);
            return { error: "Failed to fetch external details." };
          }
        },
      }),
      ui: {
        query:
          "{ image title productId variantId price availableForSale productLink inventory inventoryTracked error }",
      },
    }),
    matches: relationship({ ref: "Match.output", many: true }),
    channel: relationship({ ref: "Channel.channelItems" }),
    user: relationship({
      ref: "User.channelItems",
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          // Default to the currently logged in user on create.
          if (
            operation === "create" &&
            !resolvedData.user &&
            context.session?.itemId
          ) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.user;
        },
      },
    }),
    ...trackingFields,
  },
  db: {
    extendPrismaSchema: (schema) => {
      // add a (poor) example of a multi-column unique constraint
      return schema.replace(
        /(model [^}]+)}/g,
        "$1@@unique([quantity, productId, variantId, channelId, userId])\n}"
      );
    },
  },
  // hooks: {
  //   resolveInput: async ({ operation, resolvedData, item, context }) => {
  //     if (operation === "update") {
  //       // Merge item with resolvedData, overriding with non-undefined resolvedData values
  //       const updates = {
  //         ...item,
  //         ...Object.keys(resolvedData).reduce((acc, key) => {
  //           if (resolvedData[key] !== undefined) {
  //             // Specifically handle 'connect' operations for relationships
  //             if (resolvedData[key].connect) {
  //               acc[key + "Id"] = resolvedData[key].connect.id; // Store the connected ID
  //             } else {
  //               acc[key] = resolvedData[key]; // Copy over non-undefined non-relationship values
  //             }
  //           }
  //           return acc;
  //         }, {}),
  //       };



  //       // Perform your validation or further operations with 'updates'
  //       // Example: Check for duplicates, apply business rules, etc.
  //       const existingItems = await context.query.ChannelItem.findMany({
  //         where: {
  //           productId: { equals: updates.productId },
  //           variantId: { equals: updates.variantId },
  //           quantity: { equals: updates.quantity },
  //           channel: { id: { equals: updates.channelId } }, // Now correctly using the potentially updated channel ID
  //           NOT: { id: { equals: item.id } }, // Exclude the current item from the check
  //         },
  //       });

  //       if (existingItems.length > 0) {
  //         throw new Error(
  //           "A ChannelItem with the same specifications already exists."
  //         );
  //       }
  //     }

  //     if (operation === "create") {
  //       const { productId, variantId, quantity, channel, user } = resolvedData;
  //       const existingItem = await context.query.ChannelItem.findMany({
  //         where: {
  //           productId: { equals: productId },
  //           variantId: { equals: variantId },
  //           quantity: { equals: quantity },
  //           channel: {
  //             id: { equals: channel.connect ? channel.connect.id : undefined },
  //           },
  //           user: {
  //             id: { equals: user.connect ? user.connect.id : undefined },
  //           },
  //         },
  //       });

  //       if (existingItem.length > 0) {
  //         throw new Error(
  //           "A ChannelItem with the same productId, variantId, quantity, channel, and user already exists."
  //         );
  //       }
  //     }

  //     return resolvedData; // Always return the resolved data
  //   },
  // },
});
