async function createShopWebhook(root, { shopId, topic, endpoint }, context) {
  // Fetch the shop using the provided shopId
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: "id domain accessToken platform { id createWebhookFunction }",
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.createWebhookFunction) {
    throw new Error("Create webhook function not configured.");
  }

  const { createWebhookFunction } = shop.platform;

  if (createWebhookFunction.startsWith("http")) {
    // External API call
    const response = await fetch(createWebhookFunction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: shop.domain,
        accessToken: shop.accessToken,
        topic,
        endpoint,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create webhook: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } else {
    // Internal function call
    const shopAdapters = await import(
      `../../../../shopAdapters/${createWebhookFunction}.js`
    );

    const result = await shopAdapters.createWebhook({
      domain: shop.domain,
      accessToken: shop.accessToken,
      topic,
      endpoint,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true, webhookId: result.webhookId };
  }
}

export default createShopWebhook;