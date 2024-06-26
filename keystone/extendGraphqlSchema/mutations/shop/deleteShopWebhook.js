async function deleteShopWebhook(root, { shopId, webhookId }, context) {
  // Fetch the shop using the provided shopId
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: "id domain accessToken platform { id deleteWebhookFunction }",
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.deleteWebhookFunction) {
    throw new Error("Delete webhook function not configured.");
  }

  const { deleteWebhookFunction } = shop.platform;

  if (deleteWebhookFunction.startsWith("http")) {
    // External API call
    const params = new URLSearchParams({
      domain: shop.domain,
      accessToken: shop.accessToken,
      webhookId,
    }).toString();

    const response = await fetch(`${deleteWebhookFunction}?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to delete webhook: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } else {
    // Internal function call
    const shopAdapters = await import(
      `../../../../shopAdapters/${deleteWebhookFunction}.js`
    );

    const result = await shopAdapters.deleteWebhook({
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
