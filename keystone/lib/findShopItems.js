export async function findShopItems({ lineItems, userId, context }) {
  const arr = [];

  for (const {
    name,
    image,
    channelName,
    price,
    searchProductsEndpoint,
    updateProductEndpoint,
    quantity,
    channelId,
    productId,
    variantId,
    ...rest
  } of lineItems) {
    const [existingShopItem] = await context.query.ShopItem.findMany({
      where: {
        shop: { id: { equals: channelId } },
        user: {
          id: { equals: userId },
        },
        quantity: { equals: parseInt(quantity) },
        productId: { equals: productId },
        variantId: { equals: variantId },
        ...rest,
      },
    });

    // 3. Check if that item is already in their cart and increment by 1 if it is
    if (existingShopItem) {
      arr.push({ id: existingShopItem.id });
    }

    // 4. If its not, create a fresh CartItem for that user!
    else {
      const createShopItem = await context.query.ShopItem.createOne({
        data: {
          shop: { connect: { id: channelId } },
          quantity: parseInt(quantity),
          productId,
          variantId,
          ...rest,
        },
      });

      arr.push({ id: createShopItem.id });
    }
  }

  return arr;
}
