import { list } from "@keystone-6/core";
import { relationship, text } from "@keystone-6/core/fields";
import { isSignedIn, rules, permissions } from "../access";
import { trackingFields } from "./trackingFields";

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
      update: rules.canUpdateShops,
      delete: rules.canUpdateShops,
    },
  },
  fields: {
    name: text({ isRequired: true }),
    key: text({ isIndexed: "unique", isRequired: true }),
    updateProductFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    getWebhooksFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    deleteWebhookFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    createWebhookFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    searchProductsFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    getProductFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    searchOrdersFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    addTrackingFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    addCartToPlatformOrderFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
    }),
    oAuthFunction: text({
      defaultValue: "shopify", // Default function or provide options as needed
      isRequired: true,
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
