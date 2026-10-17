import type { KeystoneContext } from '@keystone-6/core/types';
import { executeChannelAdapterFunction } from '../../../integrations/channel/lib/executor';

interface AddMatchToCartArgs {
  orderId: string;
}

export function sourceLineForSavedMatch({
  match,
  orderLineItems,
}: {
  match: any;
  orderLineItems: any[];
}) {
  if (match.input?.length !== 1) {
    throw new Error(
      'Saved multi-line matches cannot safely map supplier items to source lines; save one match per source line'
    );
  }

  const input = match.input[0];
  const candidates = orderLineItems.filter(
    (line: any) =>
      line.productId === input.productId &&
      line.variantId === input.variantId &&
      Number(line.quantity) === Number(input.quantity) &&
      String(line.lineItemId || '').trim()
  );

  if (candidates.length !== 1) {
    throw new Error('Saved match must resolve to exactly one source order line');
  }

  return candidates[0];
}

export async function getMatches({ orderId, context }: { orderId: string; context: KeystoneContext }) {
  async function createCartItems({ matches }: { matches: any[] }) {
    if (matches.length > 0) {
      let result;
      for (const existingMatch of matches) {
        const sourceLine = sourceLineForSavedMatch({
          match: existingMatch,
          orderLineItems: order.lineItems,
        });
        const routedItems = [
          ...(await context.query.CartItem.findMany({
            where: {
              order: { id: { equals: order.id } },
              lineItemId: { equals: String(sourceLine.lineItemId) },
              status: { not: { equals: 'CANCELLED' } },
            },
            query: 'id quantity productId variantId channel { id }',
          })),
        ];
        let allocatedQuantity = routedItems.reduce(
          (total: number, item: any) => total + Number(item.quantity || 0),
          0
        );
        let matchedQuantity = 0;

        for (const {
          channel,
          productId,
          variantId,
          price: matchPrice,
          id,
          user,
          lineItemId: _savedLineItemId,
          ...rest
        } of existingMatch.output) {
          const outputQuantity = Number(rest.quantity || 0);
          matchedQuantity += outputQuantity;
          if (matchedQuantity > Number(sourceLine.quantity || 0)) {
            throw new Error('Saved match routes more quantity than the source order line contains');
          }

          const existingItem = routedItems.find(
            (item: any) =>
              item.channel?.id === channel.id &&
              item.productId === productId &&
              item.variantId === variantId &&
              Number(item.quantity) === outputQuantity
          );
          if (existingItem) {
            result = existingItem;
            continue;
          }
          if (allocatedQuantity + outputQuantity > Number(sourceLine.quantity || 0)) {
            throw new Error('Saved match exceeds the source line quantity already routed');
          }

          const platformData = {
            ...channel.platform,
            domain: channel.domain,
            accessToken: channel.accessToken,
          };

          const productResult = await executeChannelAdapterFunction({
            platform: platformData,
            functionName: "getProductFunction",
            args: { productId, variantId, currency: order.currency },
          });
          const product = productResult.product;
          const currentPriceStr = String(product.price || '');
          const savedPriceStr = String(matchPrice || '');
          const hasPriceChange = currentPriceStr !== savedPriceStr;

          result = await context.query.CartItem.createOne({
            data: {
              price: currentPriceStr,
              productId,
              variantId,
              lineItemId: String(sourceLine.lineItemId),
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
          allocatedQuantity += outputQuantity;
          routedItems.push({
            id: result.id,
            quantity: outputQuantity,
            productId,
            variantId,
            channel: { id: channel.id },
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
    currency
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

      const matchedOutput = output.filter((value) => value !== undefined);
      if (matchedOutput.length) {
        return await createCartItems({ matches: matchedOutput });
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