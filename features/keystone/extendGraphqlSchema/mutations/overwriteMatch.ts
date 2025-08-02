import type { KeystoneContext } from '@keystone-6/core/types';

interface OverwriteMatchArgs {
  input: Array<{
    productId?: string;
    variantId?: string;
    [key: string]: any;
  }>;
  output: Array<{
    productId?: string;
    variantId?: string;
    [key: string]: any;
  }>;
}

async function overwriteMatch(
  root: any,
  { input, output }: OverwriteMatchArgs,
  context: KeystoneContext
) {
  // 1. Query the current user see if they are signed in
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  // 2. Find existing match with same input criteria
  const existingMatches = await context.query.Match.findMany({
    where: {
      input: {
        every: {
          OR: input.map(item => ({
            AND: [
              { productId: { equals: item.productId } },
              { variantId: { equals: item.variantId } }
            ]
          }))
        }
      }
    },
    query: "id",
  });

  // 3. Delete existing matches
  for (const match of existingMatches) {
    await context.query.Match.deleteOne({
      where: { id: match.id },
    });
  }

  // 4. Create new match
  const match = await context.query.Match.createOne({
    data: {
      user: { connect: { id: session.itemId } },
      input: {
        create: input.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          user: { connect: { id: session.itemId } },
        }))
      },
      output: {
        create: output.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
          image: item.image,
          channel: { connect: { id: item.channelId } },
          user: { connect: { id: session.itemId } },
        }))
      }
    },
    query: "id",
  });

  return match;
}

export default overwriteMatch;