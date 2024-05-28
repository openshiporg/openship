const upsertMatch = async (_, { data }, context) => {
  const { input, output } = data;
  // Ensure ShopItems
  const ensureShopItems = async (items) => {
    const processedItems = [];
    for (const item of items) {
      console.log({ item });
      let [existingItem] = await context.query.ShopItem.findMany({
        where: {
          productId: { equals: item.productId },
          variantId: { equals: item.variantId },
          quantity: { equals: item.quantity },
          shop: { id: { equals: item.shop.connect.id } },
          user: { id: { equals: item.user?.connect?.id || context.session?.itemId } },
        },
        query: "id",
      });

      if (!existingItem) {
        existingItem = await context.db.ShopItem.createOne({
          data: item,
          query: "id",
        });
      }

      processedItems.push({ id: existingItem.id });
    }
    return processedItems;
  };

  // Ensure ChannelItems
  const ensureChannelItems = async (items) => {
    const processedItems = [];
    for (const item of items) {
      console.log({ item });
      let [existingItem] = await context.query.ChannelItem.findMany({
        where: {
          productId: { equals: item.productId },
          variantId: { equals: item.variantId },
          quantity: { equals: item.quantity },
          channel: { id: { equals: item.channel.connect.id } },
          user: { id: { equals: item.user?.connect?.id || context.session?.itemId } },
        },
        query: "id",
      });

      if (!existingItem) {
        existingItem = await context.query.ChannelItem.createOne({
          data: item,
          query: "id",
        });
      }

      processedItems.push({ id: existingItem.id });
    }
    return processedItems;
  };

  // Process inputs and outputs
  const processedInput = await ensureShopItems(input.create);
  const processedOutput = await ensureChannelItems(output.create);

  const inputIds = processedInput.map((item) => item.id);
  const outputIds = processedOutput.map((item) => item.id);

  // Check for existing match
  const existingMatches = await context.query.Match.findMany({
    where: {
      input: {
        some: { id: { in: inputIds } },
      },
    },
    query: "id input { id } output { id }",
  });

  const duplicateMatch = existingMatches.find((match) => {
    const matchInputIds = match.input.map((i) => i.id);
    return (
      matchInputIds.length === inputIds.length &&
      matchInputIds.every((id) => inputIds.includes(id))
    );
  });

  if (duplicateMatch) {
    // Update existing match
    await context.query.Match.updateOne({
      where: { id: duplicateMatch.id },
      data: {
        output: {
          disconnect: duplicateMatch.output.map((o) => ({ id: o.id })),
          connect: outputIds.map((id) => ({ id })),
        },
      },
    });
    return duplicateMatch;
  } else {
    // Create new match
    return await context.query.Match.createOne({
      data: {
        input: { connect: inputIds.map((id) => ({ id })) },
        output: { connect: outputIds.map((id) => ({ id })) },
      },
    });
  }
};

export default upsertMatch;
