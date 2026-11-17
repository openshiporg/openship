"use server";

async function findChannelItems({ cartItems, userId, context }: {
  cartItems: Array<any>;
  userId: string;
  context: any;
}) {
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
    price, // ensure price is string if present
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

    if (existingChannelItem) {
      arr.push({ id: existingChannelItem.id });
    } else {
      const createChannelItem = await context.query.ChannelItem.createOne({
        data: {
          channel: { connect: { id: channelId } },
          quantity: parseInt(quantity),
          productId,
          variantId,
          ...(price !== undefined ? { price: String(price) } : {}),
          ...rest,
        },
      });
      arr.push({ id: createChannelItem.id });
    }
  }

  return arr;
}

async function findShopItems({ lineItems, userId, context }: {
  lineItems: Array<any>;
  userId: string;
  context: any;
}) {
  const arr = [];

  for (const {
    name,
    image,
    channelName,
    price, // REMOVE for ShopItem
    quantity,
    channelId,
    productId,
    variantId,
    ...rest
  } of lineItems) {
    // Remove price from rest if present
    const { price: _omitPrice, ...restWithoutPrice } = rest;
    const [existingShopItem] = await context.query.ShopItem.findMany({
      where: {
        shop: { id: { equals: channelId } },
        user: { id: { equals: userId } },
        quantity: { equals: parseInt(quantity) },
        productId: { equals: productId },
        variantId: { equals: variantId },
        ...restWithoutPrice,
      },
    });

    if (existingShopItem) {
      arr.push({ id: existingShopItem.id });
    } else {
      const createShopItem = await context.query.ShopItem.createOne({
        data: {
          shop: { connect: { id: channelId } },
          quantity: parseInt(quantity),
          productId,
          variantId,
          ...restWithoutPrice,
        },
      });
      arr.push({ id: createShopItem.id });
    }
  }

  return arr;
}

async function matchOrder(root: any, { orderId }: { orderId: string }, context: any) {
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
        lineItemId
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

  // A saved match is used only one source line at a time, so save one per line.
  // With more than one line, each cart item must say which line it fills.
  const lineGroups = order.lineItems.map((line: any) => ({
    line,
    cartItems:
      order.lineItems.length === 1
        ? order.cartItems
        : order.cartItems.filter(
            (cartItem: any) =>
              String(cartItem.lineItemId || "").trim() &&
              String(cartItem.lineItemId) === String(line.lineItemId)
          ),
  }));
  const groupedCount = lineGroups.reduce((sum: number, group: any) => sum + group.cartItems.length, 0);
  if (
    lineGroups.some((group: any) => group.cartItems.length === 0) ||
    groupedCount !== order.cartItems.length
  ) {
    throw new Error(
      "Every order line needs its own supplier items before the match can be saved"
    );
  }

  let lastMatch = null;
  for (const { line, cartItems } of lineGroups) {
    const shopItemConnect = await findShopItems({
      lineItems: [line].map(
        ({ id, lineItemId, orderId, userId, updatedAt, createdAt, ...rest }: any) => ({
          ...rest,
          channelId: order.shop.id,
        })
      ),
      userId: sesh.itemId,
      context,
    });

    const channelItemConnect = await findChannelItems({
      cartItems: cartItems.map(
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
        }: any) => ({
          ...rest,
          channelId: channel.id,
        })
      ),
      userId: sesh.itemId,
      context,
    });

    const existingMatches = await context.query.Match.findMany({
      where: {
        user: { id: { equals: sesh.itemId } },
        input: { some: { id: { in: shopItemConnect.map((item: any) => item.id) } } },
      },
      query: "id inputCount",
    });
    for (const existing of existingMatches.filter((match: any) => match.inputCount === 1)) {
      await context.query.Match.deleteOne({ where: { id: existing.id } });
    }

    lastMatch = await context.db.Match.createOne({
      data: {
        input: { connect: shopItemConnect },
        output: { connect: channelItemConnect },
        user: { connect: { id: sesh.itemId } },
      },
    });
  }

  return lastMatch;
}

export default matchOrder;