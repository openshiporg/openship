async function getShopProduct(
  root,
  { shopId, productId, variantId },
  context
) {
  // Fetch the shop using the provided shopId
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: "id domain accessToken platform { id getProductFunction }",
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.getProductFunction) {
    throw new Error("Get product function not configured.");
  }

  const { getProductFunction } = shop.platform;

  if (getProductFunction.startsWith("http")) {
    const response = await fetch(getProductFunction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variantId: variantId || "",
        productId: productId || "",
        domain: shop.domain,
        accessToken: shop.accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const { products } = await response.json();
    return products;
  } else {
    // Internal function logic if applicable
    const shopAdapters = await import(
      `../../../../shopAdapters/${getProductFunction}.js`
    );
    const result = await shopAdapters.getProduct({
      variantId,
      productId,
      domain: shop.domain,
      accessToken: shop.accessToken,
    });
    return result.product; // Ensure products are in the shape of ShopProduct[]
  }
}

export default getShopProduct;
