async function deleteShopWebhook(root, { shopId, webhookId }, context) {
  // Fetch the shop using the provided shopId
  const shop = await context.db.Shop.findOne({
    where: { id: shopId },
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  // Fetch the platform-specific function for deleting webhooks
  const platformConfig = await context.query.ShopPlatform.findOne({
    where: { id: shop.platform.id },
    query: "deleteWebhookFunction",
  });

  if (!platformConfig.deleteWebhookFunction) {
    throw new Error("Delete webhook function not configured.");
  }

  const { deleteWebhookFunction } = platformConfig;

  if (deleteWebhookFunction.startsWith("http")) {
    // External API call (not applicable in this case)
    throw new Error("External API calls not supported for deleting webhooks.");
  } else {
    // Internal function call
    const shopFunctions = await import(
      `../../../../shopFunctions/${deleteWebhookFunction}.js`
    );
    const result = await shopFunctions.deleteWebhook({
      domain: shop.domain,
      accessToken: shop.accessToken,
      webhookId,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true };
  }
}

export default deleteShopWebhook;