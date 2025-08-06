import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import {
  json,
  relationship,
  select,
  text,
  timestamp,
  virtual,
} from "@keystone-6/core/fields";
import { graphql } from "@keystone-6/core";

import { isSignedIn, permissions, rules } from "../access";
import { trackingFields } from "./trackingFields";
import { getBaseUrl } from '../../dashboard/lib/getBaseUrl';
import { executeShopAdapterFunction } from '../utils/shopProviderAdapter';

export const Shop = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateShops,
      update: isSignedIn,
      delete: permissions.canManageShops,
    },
    filter: {
      query: rules.canReadShops,
      update: rules.canManageShops,
      delete: rules.canManageShops,
    },
  },
  ui: {
    listView: {
      initialColumns: ["name", "domain", "platform", "linkMode"],
    },
  },
  fields: {
    name: text({
      validation: { isRequired: true },
    }),
    domain: text(),
    accessToken: text({
      ui: {
        displayMode: "textarea",
      },
    }),
    linkMode: select({
      options: [
        { label: "Sequential", value: "sequential" },
        { label: "Simultaneous", value: "simultaneous" },
      ],
      defaultValue: "sequential",
    }),
    metadata: json({
      defaultValue: {},
    }),

    // Relationships
    platform: relationship({
      ref: "ShopPlatform.shops",
    }),
    user: relationship({
      ref: "User.shops",
      hooks: {
        resolveInput: ({ operation, resolvedData, context }) => {
          if (
            operation === "create" &&
            !resolvedData.user &&
            context.session?.itemId
          ) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        },
      },
    }),
    links: relationship({
      ref: "Link.shop",
      many: true,
    }),
    orders: relationship({
      ref: "Order.shop",
      many: true,
    }),
    shopItems: relationship({
      ref: "ShopItem.shop",
      many: true,
    }),

    // Virtual field for webhooks with proper base URL
    webhooks: virtual({
      field: graphql.field({
        type: graphql.JSON,
        async resolve(item: any, args: any, context: any): Promise<any> {
          try {
            const recommendedWebhooks = [
              {
                callbackUrl: `/api/handlers/shop/create-order/${item.id}`,
                topic: "ORDER_CREATED",
                description: "When an order is created on this shop, Openship will create the order to be fulfilled.",
              },
              {
                callbackUrl: `/api/handlers/shop/cancel-order/${item.id}`,
                topic: "ORDER_CANCELLED",
                description: "When an order is cancelled on this shop, Openship will mark the order status cancelled",
              },
              {
                callbackUrl: `/api/handlers/shop/cancel-order/${item.id}`,
                topic: "ORDER_CHARGEBACKED",
                description: "When an order is chargebacked on this shop, Openship will mark the order status cancelled",
              },
            ];

            // Get platform data with relationships resolved
            const shopWithPlatform = await context.query.Shop.findOne({
              where: { id: item.id },
              query: 'platform { getWebhooksFunction }'
            });

            if (!shopWithPlatform?.platform?.getWebhooksFunction) {
              return {
                success: false,
                error: "Get webhooks function not configured",
                recommendedWebhooks
              } as any;
            }

            const platformConfig = {
              domain: item.domain,
              accessToken: item.accessToken,
              getWebhooksFunction: shopWithPlatform.platform.getWebhooksFunction,
              ...(item.metadata || {}),
            };

            const webhooksResult = await executeShopAdapterFunction({
              platform: platformConfig,
              functionName: 'getWebhooksFunction',
              args: {},
            });

            return {
              success: true,
              data: { webhooks: webhooksResult.webhooks || [] },
              recommendedWebhooks
            } as any;
          } catch (error) {
            console.error('Error in webhooks virtual field:', error);
            return {
              success: false,
              error: (error as any)?.message || 'Unknown error',
              recommendedWebhooks: [
                {
                  callbackUrl: `/api/handlers/shop/create-order/${item.id}`,
                  topic: "ORDER_CREATED",
                  description: "When an order is created on this shop, Openship will create the order to be fulfilled.",
                },
                {
                  callbackUrl: `/api/handlers/shop/cancel-order/${item.id}`,
                  topic: "ORDER_CANCELLED",
                  description: "When an order is cancelled on this shop, Openship will mark the order status cancelled",
                },
                {
                  callbackUrl: `/api/handlers/shop/cancel-order/${item.id}`,
                  topic: "ORDER_CHARGEBACKED",
                  description: "When an order is chargebacked on this shop, Openship will mark the order status cancelled",
                },
              ]
            } as any;
          }
        },
      }),
    }),

    ...trackingFields,
  },
});
