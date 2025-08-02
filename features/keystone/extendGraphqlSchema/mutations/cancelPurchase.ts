import type { KeystoneContext } from '@keystone-6/core/types';

interface CancelPurchaseArgs {
  purchaseId: string;
}

async function cancelPurchase(
  root: any,
  { purchaseId }: CancelPurchaseArgs,
  context: KeystoneContext
) {
  try {
    // 1. Find cart items with this purchase ID
    const cartItems = await context.query.CartItem.findMany({
      where: {
        purchaseId: { equals: purchaseId },
      },
      query: "id",
    });

    // 2. Update cart items to cancelled status
    for (const cartItem of cartItems) {
      await context.query.CartItem.updateOne({
        where: { id: cartItem.id },
        data: {
          status: "CANCELLED",
        },
      });
    }

    return "Purchase cancelled successfully";
  } catch (error: any) {
    throw new Error(`Failed to cancel purchase: ${error.message}`);
  }
}

export default cancelPurchase;