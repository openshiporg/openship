async function searchChannelProducts(
  root,
  { channelId, searchEntry },
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
    const response = await fetch(searchProductsFunction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchEntry: searchEntry || "",
        domain: channel.domain,
        accessToken: channel.accessToken,
      }),
    });

    console.log(`POST request to ${searchProductsFunction}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const { products } = await response.json();
    return products;
  } else {
    // Internal function logic if applicable
    const channelAdapters = await import(
      `../../../../channelAdapters/${searchProductsFunction}.js`
    );

    const result = await channelAdapters.searchProducts({
      searchEntry,
      domain: channel.domain,
      accessToken: channel.accessToken,
    });

    return result.products; // Ensure products are in the shape of ChannelProduct[]
  }
}

export default searchChannelProducts;
