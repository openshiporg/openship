async function searchShopProducts(
  root,
  { shopId, searchEntry, productId, variantId },
  context
) {
  // Fetch the shop using the provided shopId
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: "id domain accessToken platform { id searchProductsFunction }",
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.searchProductsFunction) {
    throw new Error("Search products function not configured.");
  }

  const { searchProductsFunction } = shop.platform;

  if (searchProductsFunction.startsWith("http")) {
    const params = new URLSearchParams({
      searchEntry: searchEntry || "",
      variantId: variantId || "",
      productId: productId || "",
      domain: shop.domain,
      accessToken: shop.accessToken,
    }).toString();

    const response = await fetch(`${searchProductsFunction}?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const { products } = await response.json();
    return products;
  } else {
    // Internal function logic if applicable
    const shopFunctions = await import(
      `../../../../shopFunctions/${searchProductsFunction}.js`
    );
    const result = await shopFunctions.searchProducts({
      searchEntry,
      variantId,
      productId,
      domain: shop.domain,
      accessToken: shop.accessToken,
    });
    return result.products; // Ensure products are in the shape of ShopProduct[]
  }
}

export default searchShopProducts;
