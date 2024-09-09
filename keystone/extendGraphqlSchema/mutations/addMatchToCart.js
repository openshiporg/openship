export async function getMatches({ orderId, context }) {
  async function createCartItems({ matches }) {
    console.log({ matches });
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
          const { getProductFunction } = channel.platform;

          if (!getProductFunction) {
            throw new Error("Search products function not configured.");
          }

          let product;
          if (getProductFunction.startsWith("http")) {
            const params = new URLSearchParams({
              productId: productId,
              variantId: variantId,
              domain: channel.domain,
              accessToken: channel.accessToken,
            }).toString();

            const response = await fetch(`${getProductFunction}?${params}`);
            if (!response.ok) {
              throw new Error(
                `Failed to fetch product: ${response.statusText}`
              );
            }
            const data = await response.json();
            product = data.product;
          } else {
            const channelAdapters = await import(
              `../../../channelAdapters/${getProductFunction}.js`
            );
            const result = await channelAdapters.getProduct({
              productId: productId,
              variantId: variantId,
              domain: channel.domain,
              accessToken: channel.accessToken,
            });
            product = result.product;
          }

          result = await context.query.CartItem.createOne({
            data: {
              price: product.price,
              productId,
              variantId,
              image: product.image,
              name: product.title,
              order: { connect: { id: order.id } },
              channel: { connect: { id: channel.id } },
              ...(product.price !== matchPrice && {
                error: `Price has increased $${(
                  product.price - matchPrice
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
          platform {
            id
            getProductFunction
          }
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
                platform {
                  id
                  getProductFunction
                }
              }
              user {
                id
              }
            }
          `,
          });

          const [singleFilt] = singleAllMatches;

          if (singleFilt) {
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

      if (output.filter((value) => value !== undefined).length) {
        return await createCartItems({ matches: output });
      }
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
