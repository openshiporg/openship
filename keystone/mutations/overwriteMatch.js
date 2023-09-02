import { findChannelItems } from "../lib/findChannelItems";
import { findShopItems } from "../lib/findShopItems";

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
