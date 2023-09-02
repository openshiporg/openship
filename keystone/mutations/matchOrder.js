import { findChannelItems } from "../lib/findChannelItems";
import { findShopItems } from "../lib/findShopItems";
import { gql } from "graphql-request";
const graphql = String.raw;

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

  // console.log(order);

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

  console.log({ shopItemConnect });

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
        // const restNested = Object.keys(rest).reduce(
        //   (acc, key) => ({
        //     ...acc,
        //     ...{ [key]: { equals: rest[key] } },
        //   }),
        //   {}
        // );

        // console.log({ restNested });
        return {
          ...rest,
          channelId: channel.id,
        };
      }
    ),
    userId: sesh.itemId,
    context,
  });

  console.log({ channelItemConnect });

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
        searchProductsEndpoint
      }
      user {
        id
      }
    }
  `,
  });

  console.log({ existingMatches });

  const [existingMatch] = existingMatches.filter(
    (match) => match.input.length === order.lineItems.length
  );

  console.log({ existingMatch });

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
