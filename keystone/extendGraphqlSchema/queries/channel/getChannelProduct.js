async function getChannelProduct(
  root,
  { channelId, productId, variantId },
  context
) {
  // Fetch the channel using the provided channelId
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id getProductFunction }",
  });

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!channel.platform.getProductFunction) {
    throw new Error("Get product function not configured.");
  }

  const { getProductFunction } = channel.platform;

  if (getProductFunction.startsWith("http")) {
    const params = new URLSearchParams({
      variantId: variantId || "",
      productId: productId || "",
      domain: channel.domain,
      accessToken: channel.accessToken,
    }).toString();

    const response = await fetch(`${getProductFunction}?${params}`);

    console.log(`${getProductFunction}?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const { products } = await response.json();
    return products;
  } else {
    // Internal function logic if applicable
    const channelAdapters = await import(
      `../../../../channelAdapters/${getProductFunction}.js`
    );

    const result = await channelAdapters.searchProducts({
      variantId,
      productId,
      domain: channel.domain,
      accessToken: channel.accessToken,
    });

    return result.products; // Ensure products are in the shape of ChannelProduct[]
  }
}

export default getChannelProduct;
