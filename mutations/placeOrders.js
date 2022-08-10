import { placeMultipleOrders } from '../lib/placeMultipleOrders';

async function placeOrders(root, { ids }, context) {
  // 1. Query the current user see if they are signed in
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error('You must be logged in to do this!');
  }

  const processedOrders = await placeMultipleOrders({
    ids,
    query: context.query,
  });

  return processedOrders;
}

export default placeOrders;
