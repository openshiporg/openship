import type { KeystoneContext } from '@keystone-6/core/types';

interface CancelOrderArgs {
  orderId: string;
}

async function cancelOrder(
  root: any,
  { orderId }: CancelOrderArgs,
  context: KeystoneContext
) {
  try {
    // 1. Update order status to cancelled
    await context.query.Order.updateOne({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
      },
    });

    // 2. Cancel all associated cart items
    const cartItems = await context.query.CartItem.findMany({
      where: {
        order: { id: { equals: orderId } },
      },
      query: "id",
    });

    for (const cartItem of cartItems) {
      await context.query.CartItem.updateOne({
        where: { id: cartItem.id },
        data: {
          status: "CANCELLED",
        },
      });
    }

    return "Order cancelled successfully";
  } catch (error: any) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
}

export default cancelOrder;