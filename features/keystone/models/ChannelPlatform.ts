import { graphql, group, list } from "@keystone-6/core";
import { relationship, text, virtual } from "@keystone-6/core/fields";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";

export const ChannelPlatform = list({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.canReadChannels,
      update: rules.canUpdateChannels,
      delete: rules.canUpdateChannels,
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    ...group({
      label: "App Credentials",
      description:
        "Adding these fields will enable this platform to be installed as an app by users.",
      fields: {
        appKey: text({ validation: { isRequired: true } }),
        appSecret: text({ validation: { isRequired: true } }),
        callbackUrl: virtual({
          field: graphql.field({
            type: graphql.String,
            resolve: async (item: any, args: any, context: any) => {
              // Get the base URL from the request context
              let baseUrl = '';
              
              // Try to get from request headers if available
              if (context?.req?.headers) {
                const headers = context.req.headers;
                const host = headers['x-forwarded-host'] || headers['host'];
                const protocol = headers['x-forwarded-proto'] || 'https';
                
                if (host) {
                  baseUrl = `${protocol}://${host}`;
                }
              }
              
              // Fallback to environment variable or default
              if (!baseUrl) {
                baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
              }
              
              // Return simplified callback URL (no platform ID needed)
              return `${baseUrl}/api/oauth/callback`;
            },
          }),
          ui: {
            description:
              "Add this URL as the redirect URI in your OAuth app settings (same for all platforms)",
          },
        }),
      },
    }),
    ...group({
      label: "Adapter Functions",
      description:
        "These functions link to built-in adapters, but can also be external endpoints",
      fields: {
        searchProductsFunction: text({ validation: { isRequired: true } }),
        getProductFunction: text({ validation: { isRequired: true } }),
        createPurchaseFunction: text({ validation: { isRequired: true } }),
        createWebhookFunction: text({ validation: { isRequired: true } }),
        oAuthFunction: text({
          validation: { isRequired: true },
          ui: {
            description: "Function to initiate OAuth flow for this platform",
          },
        }),
        oAuthCallbackFunction: text({
          validation: { isRequired: true },
          ui: {
            description: "Function to handle OAuth callback for this platform",
          },
        }),
        createTrackingWebhookHandler: text({ validation: { isRequired: true } }),
        cancelPurchaseWebhookHandler: text({ validation: { isRequired: true } }),
        getWebhooksFunction: text({ validation: { isRequired: true } }),
        deleteWebhookFunction: text({ validation: { isRequired: true } }),
      },
    }),
    channels: relationship({ ref: "Channel.platform", many: true }),
    user: relationship({
      ref: "User.channelPlatforms",
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