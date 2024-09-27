async function searchShopOrders(
  root,
  { shopId, searchEntry, take, skip, after },
  context
) {
  // Fetch the shop using the provided shopId
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: "id domain accessToken platform { id searchOrdersFunction }",
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }

  if (!shop.platform.searchOrdersFunction) {
    throw new Error("Search orders function not configured.");
  }

  const { searchOrdersFunction } = shop.platform;

  if (searchOrdersFunction.startsWith("http")) {
    // External API call
    const response = await fetch(searchOrdersFunction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchEntry,
        domain: shop.domain,
        accessToken: shop.accessToken,
        first: take,
        skip,
        after,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const { orders, hasNextPage } = await response.json();
    return { orders, hasNextPage };
  } else {
    // Internal function call
    const shopAdapters = await import(
      `../../../../shopAdapters/${searchOrdersFunction}.js`
    );

    const { orders, hasNextPage } = await shopAdapters.searchOrders({
      searchEntry,
      domain: shop.domain,
      accessToken: shop.accessToken,
      first: take,
      skip,
      after,
    });


    return { orders, hasNextPage };
  }
}

export default searchShopOrders;
