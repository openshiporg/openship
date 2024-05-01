async function searchChannelProducts(
  root,
  { channelId, searchEntry, productId, variantId },
  context
) {
  // Fetch the channel using the provided channelId
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id searchProductsFunction }",
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!channel.platform.searchProductsFunction) {
    throw new Error("Search products function not configured.");
  }

  const { searchProductsFunction } = channel.platform;

  if (searchProductsFunction.startsWith("http")) {
    const params = new URLSearchParams({
      searchEntry: searchEntry || "",
      variantId: variantId || "",
      productId: productId || "",
      domain: channel.domain,
      accessToken: channel.accessToken,
    }).toString();

    const response = await fetch(`${searchProductsFunction}?${params}`);

    console.log(`${searchProductsFunction}?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const { products } = await response.json();
    return products;
  } else {
    // Internal function logic if applicable
    const channelFunctions = await import(
      `../../../../channelFunctions/${searchProductsFunction}.js`
    );

    const result = await channelFunctions.searchProducts({
      searchEntry,
      variantId,
      productId,
      domain: channel.domain,
      accessToken: channel.accessToken,
    });

    return result.products; // Ensure products are in the shape of ChannelProduct[]
  }
}

export default searchChannelProducts;
