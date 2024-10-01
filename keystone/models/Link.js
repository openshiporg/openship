import {
  integer,
  text,
  relationship,
  virtual,
  float,
  json,
} from "@keystone-6/core/fields";
import { list, graphql } from "@keystone-6/core";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const Link = list({
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
  // db: {
  //   extendPrismaSchema: (schema) => {
  //     return schema.replace(
  //       /(model Link \{[^}]+)\}/g,
  //       `$1\n@@unique([shopId, rank])\n}`
  //     );
  //   },
  // },
  hooks: {
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
  fields: {
    shop: relationship({ ref: "Shop.links" }),
    channel: relationship({ ref: "Channel.links" }),
    rank: integer(),
    filters: json(),
    customWhere: json(),
    dynamicWhereClause: virtual({
      field: graphql.field({
        type: graphql.JSON,
        resolve(item, args, context) {
          // return {};
          // Using 'Order' listKey hardcoded
          if (item.customWhere) {
            return item.customWhere;
          }
          return transformToWhere(
            item.filters,
            context.__internal.lists.Order.fields
          );
        },
      }),
    }),
    user: relationship({
      ref: "User.links",
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
});

const fieldViews = {
  "@keystone-6/core/fields/types/text/views": {
    controller: {
      filter: {
        graphql: ({ type, value, field }) => {
          const isNot = type.startsWith("not_");
          const key =
            type === "is_i" || type === "not_i"
              ? "equals"
              : type
                  .replace(/_i$/, "")
                  .replace("not_", "")
                  .replace(/_([a-z])/g, (_, char) => char.toUpperCase());
          return {
            [field]: {
              ...(isNot ? { not: { [key]: value } } : { [key]: value }),
              mode: "insensitive",
            },
          };
        },
      },
    },
  },
  "@keystone-6/core/fields/types/float/views": {
    controller: {
      filter: {
        graphql: ({ type, value, field }) => {
          const valueWithoutWhitespace = value.replace(/\s/g, "");
          const parsed =
            type === "in" || type === "not_in"
              ? valueWithoutWhitespace.split(",").map(parseFloat)
              : parseFloat(valueWithoutWhitespace);
          const key =
            type === "is" ? "equals" : type === "not_in" ? "notIn" : type;
          return {
            [field]: { [key]: parsed },
          };
        },
      },
    },
  },
  "@keystone-6/core/fields/types/integer/views": {
    controller: {
      filter: {
        graphql: ({ type, value, field }) => {
          const valueWithoutWhitespace = value.replace(/\s/g, "");
          const parsed =
            type === "in" || type === "not_in"
              ? valueWithoutWhitespace.split(",").map((x) => parseInt(x))
              : parseInt(valueWithoutWhitespace);
          const key =
            type === "is" ? "equals" : type === "not_in" ? "notIn" : type;
          return {
            [field]: { [key]: parsed },
          };
        },
      },
    },
  },
  "@keystone-6/core/fields/types/select/views": {
    controller: {
      filter: {
        graphql: ({ type, value, field }) => {
          const values = value.split(",").map((v) => v.trim());
          const key = type === "not_matches" ? "notIn" : "in";
          return {
            [field]: { [key]: values },
          };
        },
      },
    },
  },
  "@keystone-6/core/___internal-do-not-use-will-break-in-patch/admin-ui/id-field-view":
    {
      controller: {
        filter: {
          graphql: ({ type, value, field }) => {
            if (type === "not") {
              return { [field]: { not: { equals: value } } };
            }
            return {
              [field]: { equals: value },
            };
          },
        },
      },
    },
  "@keystone-6/core/fields/types/checkbox/views": {
    controller: {
      filter: {
        graphql: ({ type, value, field }) => {
          return { [field]: { equals: type === "is" } };
        },
      },
    },
  },
  // Add other types as necessary with placeholders
};

function transformToWhere(filters, fields) {
  return filters.reduce((acc, filter) => {
    const fieldConfig = fields[filter.field];
    const fieldView = fieldViews[fieldConfig.views]; // Using views to access the right controller

    if (fieldView && fieldView.controller && fieldView.controller.filter) {
      const graphqlFilter = fieldView.controller.filter.graphql({
        type: filter.type,
        value: filter.value,
        field: filter.field,
      });
      return { ...acc, ...graphqlFilter };
    }
    return acc;
  }, {});
}
