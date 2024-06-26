async function updateShopProduct(
  root,
  { shopId, variantId, productId, price, inventoryDelta },
  context
) {
  // Fetch the shop using the provided shopId
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: "id domain accessToken platform { id updateProductFunction }",
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.updateProductFunction) {
    throw new Error("Update product function not configured.");
  }

  const { updateProductFunction } = shop.platform;

  if (updateProductFunction.startsWith("http")) {
    // External API call
    const params = new URLSearchParams({
      domain: shop.domain,
      accessToken: shop.accessToken,
      variantId,
      productId,
      inventoryDelta,
      price,
    }).toString();

    const response = await fetch(`${updateProductFunction}?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to update product: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, updatedVariant: result.updatedVariant };
  } else {
    // Internal function call
    const shopAdapters = await import(
      `../../../../shopAdapters/${updateProductFunction}.js`
    );
    const result = await shopAdapters.updateProduct({
      domain: shop.domain,
      accessToken: shop.accessToken,
      variantId,
      productId,
      price,
      inventoryDelta
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true, updatedVariant: result.updatedVariant };
  }
}

export default updateShopProduct;
