export async function getMatches({ orderId, context }) {
  async function createCartItems({ matches }) {
    if (matches.length > 0) {
      let result;
      for (const existingMatch of matches) {
        for (const {
          channel,
          productId,
          variantId,
          price: matchPrice,
          id,
          user,
          ...rest
        } of existingMatch.output) {
          const params = new URLSearchParams({
            channelId: channel.id,
            domain: channel.domain,
            accessToken: channel.accessToken,
            productId,
            variantId,
          }).toString();

          const searchRes = await fetch(
            channel.searchProductsEndpoint.includes("http")
              ? `${channel.searchProductsEndpoint}?${params}`
              : `${process.env.FRONTEND_URL}${channel.searchProductsEndpoint}?${params}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-type": "application/json",
                "X-Requested-With": "Fetch",
              },
            }
          );

          const { products } = await searchRes.json();

          const [productInfo] = products;

          result = await context.query.CartItem.createOne({
            data: {
              price: productInfo.price,
              productId,
              variantId,
              image: productInfo.image,
              name: productInfo.title,
              order: { connect: { id: order.id } },
              channel: { connect: { id: channel.id } },
              ...(productInfo.price !== matchPrice && {
                error: `Price has increased $${(
                  productInfo.price - matchPrice
                ).toFixed(2)}. Verify before placing order.`,
              }),
              user: { connect: { id: user.id } },
              ...rest,
            },
          });
        }
      }

      return result;
    }
  }
  const order = await context.query.Order.findOne({
    where: {
      id: orderId,
    },
    query: `
    id
    user {
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
    }`,
  });

  const allMatches = await context.query.Match.findMany({
    where: {
      user: {
        id: { equals: order.user.id },
      },
      AND: order.lineItems.map(({ productId, variantId, quantity }) => ({
        input: {
          some: {
            productId: { equals: productId },
            variantId: { equals: variantId },
            quantity: { equals: quantity },
          },
        },
      })),
    },
    query: ` 
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
  const [filt] = allMatches.filter(
    ({ inputCount }) => inputCount === order.lineItems.length
  );

  // console.log({ filt });

  if (filt) {
    return await createCartItems({ matches: [filt] });
  } else {
    if (order.lineItems.length > 1) {
      const output = await Promise.all(
        order.lineItems.map(async ({ quantity, variantId, productId }) => {
          const singleAllMatches = await context.query.Match.findMany({
            where: {
              user: {
                id: { equals: order.user.id },
              },
              AND: [
                {
                  input: {
                    every: {
                      productId: { equals: productId },
                      variantId: { equals: variantId },
                      quantity: { equals: quantity },
                    },
                  },
                },
              ],
            },
            query: `
            input {
              id
              quantity
              productId
              variantId
              shop {
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

          const [singleFilt] = singleAllMatches;

          // console.log({ singleFilt });

          if (singleFilt) {
            // console.log('single filt returned');
            return singleFilt;
          }
          const updateOrder = await context.query.Order.updateOne({
            where: { id: orderId },
            data: {
              orderError: "Some lineItems not matched",
              status: "PENDING",
            },
          });

        })
      );

      return await createCartItems({ matches: output });
    } else {
      const updateOrder = await context.query.Order.updateOne({
        where: { id: orderId },
        data: {
          orderError: "No matches found",
        },
      });
    }
  }
}

async function addMatchToCart(root, { orderId }, context) {
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  const cartItemsFromMatch = await getMatches({
    orderId,
    context,
  });

  if (cartItemsFromMatch) {
    return await context.db.Order.findOne({
      where: { id: orderId },
    });
  } else {
    throw new Error("No Matches found");
  }
}

export default addMatchToCart;
