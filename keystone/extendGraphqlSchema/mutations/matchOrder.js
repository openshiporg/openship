async function findChannelItems({ cartItems, userId, context }) {
  const arr = [];

  for (const {
    name,
    image,
    channelName,
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

async function findShopItems({ lineItems, userId, context }) {
  const arr = [];

  for (const {
    name,
    image,
    channelName,
    price,
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

async function matchOrder(root, { orderId }, context) {
  const sesh = context.session;

  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const order = await context.query.Order.findOne({
    where: {
      id: orderId,
    },
    query: `
      cartItems {
        channel {
          id
        }
        image
        price
        id
        quantity
        productId
        variantId
      }
      shop {
        id
      }
      lineItems {
        image
        price
        id
        quantity
        productId
        variantId
        lineItemId
      }
    `,
  });


  const shopItemConnect = await findShopItems({
    lineItems: order.lineItems.map(
      ({ id, lineItemId, orderId, userId, updatedAt, createdAt, ...rest }) => {
        // turn into NullFilter values ({ equal }) for findMany
        const restNested = Object.keys(rest).reduce(
          (acc, key) => ({
            ...acc,
            ...{ [key]: { equals: rest[key] } },
          }),
          {}
        );
        return {
          ...rest,
          channelId: order.shop.id,
        };
      }
    ),
    userId: sesh.itemId,
    context,
  });


  const channelItemConnect = await findChannelItems({
    cartItems: order.cartItems.map(
      ({
        id,
        lineItemId,
        orderId,
        userId,
        updatedAt,
        createdAt,
        url,
        error: cartItemError,
        purchaseId,
        channel,
        ...rest
      }) => {


        return {
          ...rest,
          channelId: channel.id,
        };
      }
    ),
    userId: sesh.itemId,
    context,
  });


  const existingMatches = await context.query.Match.findMany({
    where: {
      user: {
        id: { equals: sesh.itemId },
      },
      AND: order.lineItems.map(({ productId, variantId, quantity }) => ({
        input: {
          some: {
            productId: { equals: productId },
            variantId: { equals: variantId },
            quantity: { equals: parseInt(quantity) },
          },
        },
      })),
    },
    query: ` 
    id
    inputCount
    outputCount
    input {
      id
      quantity
      productId
      variantId
      shop {
        id
      }
      user {
        id
      }
    }
    output {
      id
      quantity
      productId
      variantId
      price
      channel {
        id
        domain
        accessToken
        platform {
          id
        }
      }
      user {
        id
      }
    }
  `,
  });


  const [existingMatch] = existingMatches.filter(
    (match) => match.input.length === order.lineItems.length
  );


  if (existingMatch) {
    const deletedMatch = await context.query.Match.deleteOne({
      where: { id: existingMatch.id },
    });
  }

  const newMatch = await context.db.Match.createOne({
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

  return newMatch;
}

export default matchOrder;
