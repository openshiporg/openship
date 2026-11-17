import { placeMultipleOrders } from '../../lib/placeMultipleOrders';
import { isSignedInFor } from '../../access';

async function placeOrders(root: any, { ids }: { ids: string[] }, context: any) {
  // 1. Query the current user see if they are signed in
  const sesh = context.session;
  if (!sesh?.itemId) {
    throw new Error('You must be logged in to do this!');
  }
  if (!isSignedInFor('canProcessOrders')({ session: sesh } as any)) {
    throw new Error('This API key cannot place orders');
  }

  const processedOrders = await placeMultipleOrders({
    ids,
    query: context.query,
    prisma: context.prisma,
  });

  return processedOrders;
}

export default placeOrders;