import { list, group, graphql } from "@keystone-6/core";
import { relationship, text, virtual } from "@keystone-6/core/fields";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";
import { getBaseUrl } from '../../dashboard/lib/getBaseUrl';

export const ShopPlatform = list({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      query: rules.canReadShops,
      update: rules.canManageShops,
      delete: rules.canManageShops,
    },
  },
  fields: {
    name: text({ validation: { isRequired: true } }),
    ...group({
      label: "App Credentials",
      description:
        "Adding these fields will enable this platform to be installed as an app by users",
      fields: {
        appKey: text({ validation: { isRequired: true } }),
        appSecret: text({ validation: { isRequired: true } }),
        callbackUrl: virtual({
          field: graphql.field({
            type: graphql.String,
            resolve: async (item: any) => {
              const baseUrl = await getBaseUrl();
              return `${baseUrl}/api/oauth/shop/${item.id}/callback`;
            },
          }),
          ui: {
            description:
              "This URL needs to be set as the callback in your app settings",
          },
        }),
      },
    }),
    ...group({
      label: "Adapter Functions",
      description: "These functions link to built-in adapters, but can also be external endpoints",
      fields: {
        searchProductsFunction: text({
          validation: { isRequired: true },
        }),
        getProductFunction: text({
          validation: { isRequired: true },
        }),
        searchOrdersFunction: text({
          validation: { isRequired: true },
        }),
        updateProductFunction: text({
          validation: { isRequired: true },
        }),
        createWebhookFunction: text({
          validation: { isRequired: true },
        }),
        oAuthFunction: text({
          validation: { isRequired: true },
        }),
        oAuthCallbackFunction: text({
          validation: { isRequired: true },
        }),
        createOrderWebhookHandler: text({
          validation: { isRequired: true },
        }),
        cancelOrderWebhookHandler: text({
          validation: { isRequired: true },
        }),
        addTrackingFunction: text({
          validation: { isRequired: true },
        }),
        orderLinkFunction: text({
          validation: { isRequired: true },
          ui: {
            description: "Function to generate the order link for this platform",
          },
        }),
        addCartToPlatformOrderFunction: text({
          validation: { isRequired: true },
        }),
        getWebhooksFunction: text({
          validation: { isRequired: true },
        }),
        deleteWebhookFunction: text({
          validation: { isRequired: true },
        }),
      },
    }),
    shops: relationship({ ref: "Shop.platform", many: true }),
    user: relationship({
      ref: "User.shopPlatforms",
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