async function getShopWebhooks(root, { shopId }, context) {
  // Fetch the shop using the provided shopId
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: "id domain accessToken platform { id getWebhooksFunction }",
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.getWebhooksFunction) {
    throw new Error("Get webhooks function not configured.");
  }

  const { getWebhooksFunction } = shop.platform;

  if (getWebhooksFunction.startsWith("http")) {
    // External API call
    const body = JSON.stringify({
      domain: shop.domain,
      accessToken: shop.accessToken,
    });

    const response = await fetch(getWebhooksFunction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
    }

    const { webhooks } = await response.json();
    return webhooks; // Assuming the response includes a 'webhooks' array
  } else {
    // Internal function call
    const shopAdapters = await import(
      `../../../../shopAdapters/${getWebhooksFunction}.js`
    );

    const result = await shopAdapters.getWebhooks({
      domain: shop.domain,
      accessToken: shop.accessToken,
    });

    return result.webhooks; // Ensure webhooks are returned in the expected format
  }
}

export default getShopWebhooks;