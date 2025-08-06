import { list } from "@keystone-6/core";
import { allOperations } from "@keystone-6/core/access";
import { json, relationship, text, timestamp, virtual } from "@keystone-6/core/fields";
import { graphql } from "@keystone-6/core";

import { isSignedIn, permissions, rules } from "../access";
import { trackingFields } from "./trackingFields";
import { getBaseUrl } from '../../dashboard/lib/getBaseUrl';
import { executeChannelAdapterFunction } from '../utils/channelProviderAdapter';

export const Channel = list({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateChannels,
      update: isSignedIn,
      delete: permissions.canManageChannels,
    },
    filter: {
      query: rules.canReadChannels,
      update: rules.canManageChannels,
      delete: rules.canManageChannels,
    },
  },
  ui: {
    listView: {
      initialColumns: ["name", "domain", "platform"],
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
    metadata: json({
      defaultValue: {},
    }),

    // Relationships
    platform: relationship({
      ref: "ChannelPlatform.channels",
    }),
    user: relationship({
      ref: "User.channels",
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
      ref: "Link.channel",
      many: true,
    }),
    channelItems: relationship({
      ref: "ChannelItem.channel",
      many: true,
    }),
    cartItems: relationship({
      ref: "CartItem.channel",
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
                callbackUrl: `/api/handlers/channel/cancel-purchase/${item.id}`,
                topic: "ORDER_CANCELLED",
                description: "When a purchase order is cancelled by this channel, enabling this will notify Openship to mark the cart item as cancelled and move the order to PENDING for reprocessing.",
              },
              {
                callbackUrl: `/api/handlers/channel/create-tracking/${item.id}`,
                topic: "TRACKING_CREATED",
                description: "When a purchase order is fulfilled by this channel, enabling this will notify Openship to add the tracking to the order and shop.",
              },
            ];

            // Get platform data with relationships resolved
            const channelWithPlatform = await context.query.Channel.findOne({
              where: { id: String(item.id) },
              query: 'platform { getWebhooksFunction }'
            });

            if (!channelWithPlatform?.platform?.getWebhooksFunction) {
              return {
                success: false,
                error: "Get webhooks function not configured",
                recommendedWebhooks
              } as any;
            }

            const platformConfig: any = {
              domain: item.domain,
              accessToken: item.accessToken,
              getWebhooksFunction: channelWithPlatform.platform.getWebhooksFunction,
              ...(item.metadata || {}),
            };

            const webhooksResult = await executeChannelAdapterFunction({
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
              error: error instanceof Error ? error.message : 'Unknown error',
              recommendedWebhooks: [
                {
                  callbackUrl: `/api/handlers/channel/cancel-purchase/${item.id}`,
                  topic: "ORDER_CANCELLED",
                  description: "When a purchase order is cancelled by this channel, enabling this will notify Openship to mark the cart item as cancelled and move the order to PENDING for reprocessing.",
                },
                {
                  callbackUrl: `/api/handlers/channel/create-tracking/${item.id}`,
                  topic: "TRACKING_CREATED",
                  description: "When a purchase order is fulfilled by this channel, enabling this will notify Openship to add the tracking to the order and shop.",
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
