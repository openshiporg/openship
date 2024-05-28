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
import { getShopProduct } from "../extendGraphqlSchema/queries";

export const ShopItem = list({
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
    externalDetails: virtual({
      field: graphql.field({
        type: graphql.object()({
          name: "ShopProduct",
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
          const shopItem = await context.query.ShopItem.findOne({
            where: { id: item.id },
            query: "shop { id }",
          });

          if (!shopItem?.shop) {
            console.error("Shop not associated or missing.");
            return { error: "Shop not associated or missing." };
          }

          const shopId = shopItem.shop.id;

          try {
            const product = await getShopProduct(
              null,
              {
                shopId: shopId,
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
          "{ image title productId variantId price availableForSale productLink inventory inventoryTracked error }", // Adjust UI query as needed
      },
    }),
    matches: relationship({ ref: "Match.input", many: true }),
    shop: relationship({ ref: "Shop.shopItems" }),
    user: relationship({
      ref: "User.shopItems",
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
        "$1@@unique([quantity, productId, variantId, shopId, userId])\n}"
      );
    },
  },
});
