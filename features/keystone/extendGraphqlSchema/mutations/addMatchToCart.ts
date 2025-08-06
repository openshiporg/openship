import type { KeystoneContext } from '@keystone-6/core/types';
import { executeChannelAdapterFunction } from '../../../integrations/channel/lib/executor';

interface AddMatchToCartArgs {
  orderId: string;
}

export async function getMatches({ orderId, context }: { orderId: string; context: KeystoneContext }) {
  async function createCartItems({ matches }: { matches: any[] }) {
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
          // Create platform object with all necessary data
          const platformData = {
            ...channel.platform,
            domain: channel.domain,
            accessToken: channel.accessToken,
          };

          // Use the new executor pattern to get product data
          const productResult = await executeChannelAdapterFunction({
            platform: platformData,
            functionName: "getProductFunction",
            args: { productId, variantId },
          });
          
          const product = productResult.product;

          // Simple string comparison - no parsing needed
          const currentPriceStr = String(product.price || '');
          const savedPriceStr = String(matchPrice || '');
          const hasPriceChange = currentPriceStr !== savedPriceStr;
          
          // Store price as text (no parsing needed)
          const priceValue = currentPriceStr;

          result = await context.query.CartItem.createOne({
            data: {
              price: priceValue,
              productId,
              variantId,
              image: product.image,
              name: product.title,
              order: { connect: { id: order.id } },
              channel: { connect: { id: channel.id } },
              ...(hasPriceChange && {
                error: `PRICE_CHANGE: Price changed: ${savedPriceStr} → ${currentPriceStr}. Verify before placing order.`,
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

  if (!order) {
    throw new Error("Order not found");
  }

  const allMatches = await context.query.Match.findMany({
    where: {
      user: {
        id: { equals: order.user.id },
      },
      AND: order.lineItems.map(({ productId, variantId, quantity }: any) => ({
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
        order.lineItems.map(async ({ quantity, variantId, productId }: any) => {
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
          await context.query.Order.updateOne({
            where: { id: orderId },
            data: {
              error: "MATCH_ERROR: Some lineItems not matched",
              status: "PENDING",
            },
          });
        })
      );

      if (output.filter((value) => value !== undefined).length) {
        return await createCartItems({ matches: output });
      }
    } else {
      await context.query.Order.updateOne({
        where: { id: orderId },
        data: {
          error: "MATCH_ERROR: No matches found",
        },
      });
    }
  }
}

async function addMatchToCart(
  root: any,
  { orderId }: AddMatchToCartArgs,
  context: KeystoneContext
) {
  const session = context.session;
  if (!session?.itemId) {
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