export async function findShopItems({ lineItems, userId, context }) {
  const arr = [];

  // console.log(lineItems[0]);
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
    console.log({ channelId });
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

export async function findChannelItems({ cartItems, userId, context }) {
  const arr = [];
  // console.log({ cartItems });

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
    console.log({ rest });
    console.log({ channelId });
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

    console.log({ existingChannelItem });

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

async function overwriteMatch(root, { input, output }, context) {
  // 1. Query the current user see if they are signed in
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const shopItemConnect = await findShopItems({
    lineItems: input.map(({ shop, ...rest }) => {
      // convert rest values from
      // productId: { equals: "12321" } to
      // productId: "12321"
      // needed for findShopItems and findChannelItems
      const restNested = Object.keys(rest).reduce(
        (acc, key) => ({
          ...acc,
          ...{ [key]: rest[key].equals },
        }),
        {}
      );

      return {
        channelId: shop.id.equals,
        ...restNested,
      };
    }),
    userId: sesh.itemId,
    context,
  });

  console.log({ input });
  console.log({ shopItemConnect });
  console.log({ output });

  const channelItemConnect = await findChannelItems({
    cartItems: output.map(({ channel, ...rest }) => {
      const restNested = Object.keys(rest).reduce(
        (acc, key) => ({
          ...acc,
          ...{ [key]: rest[key].equals },
        }),
        {}
      );
      return {
        channelId: channel.id.equals,
        ...restNested,
      };
    }),
    userId: sesh.itemId,
    context,
  });

  console.log({ channelItemConnect });

  const existingMatches = await context.query.Match.findMany({
    where: {
      user: {
        id: { equals: sesh.itemId },
      },
      AND: input.map(({ productId, variantId, quantity }) => ({
        input: {
          some: {
            productId,
            variantId,
            quantity,
          },
        },
      })),
    },
    query: `id inputCount outputCount`,
  });

  console.log({ existingMatches });

  const [existingMatch] = existingMatches.filter(
    (match) => match.inputCount === input.length
  );

  if (existingMatch) {
    const deletedMatch = await context.query.Match.deleteOne({
      where: { id: existingMatch.id },
    });
  }

  return await context.db.Match.createOne({
    data: {
      input: { connect: shopItemConnect },
      output: { connect: channelItemConnect },
      user: {
        connect: {
          id: sesh.itemId,
        },
      },
    },
  });
}

export default overwriteMatch;
