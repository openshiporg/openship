export async function findChannelItems({ cartItems, userId, context }) {
  const arr = [];

  for (const {
    name,
    image,
    channelName,
    searchProductsEndpoint,
    status,
    quantity,
    channelId,
    productId,
    variantId,
    ...rest
  } of cartItems) {

    const [existingChannelItem] = await context.query.ChannelItem.findMany({
      where: {
        channel: { id: { equals: channelId } },
        user: { id: { equals: userId } },
        quantity: { equals: parseInt(quantity) },
        productId: { equals: productId },
        variantId: { equals: variantId },
        // ...rest,
      },
    });


    // 3. Check if that item is already in their cart and increment by 1 if it is
    if (existingChannelItem) {
      arr.push({ id: existingChannelItem.id });
    }

    // 4. If its not, create a fresh CartItem for that user!
    else {
      const createChannelItem = await context.query.ChannelItem.createOne({
        data: {
          channel: { connect: { id: channelId } },
          quantity: parseInt(quantity),
          productId,
          variantId,
          ...rest,
        },
      });

      arr.push({ id: createChannelItem.id });
    }
  }

  return arr;
}
