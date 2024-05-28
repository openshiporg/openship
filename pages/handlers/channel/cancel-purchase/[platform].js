import { keystoneContext } from "@keystone/keystoneContext";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  const { platform } = req.query;
  try {
    const platformFunctions = await import(`../../../channelFunctions/${platform}.js`);
    const purchaseId = await platformFunctions.cancelPurchaseWebhookHandler(req, res);

    const cartItemIDs = await keystoneContext.sudo().query.CartItem.findMany({
      where: {
        purchaseId: { equals: purchaseId },
      },
    });

    const updatedCartItems = await keystoneContext.sudo().query.CartItem.updateMany({
      data: cartItemIDs.map(({ id }) => ({
        where: { id },
        data: { status: "CANCELLED" },
      })),
      query: `id order { id }`,
    });

    await keystoneContext.sudo().query.Order.updateOne({
      where: { id: updatedCartItems[0].order.id },
      data: { status: "PENDING" },
    });
    return { success: "Order cancelled" };
  } catch (error) {
    console.error("Error cancelling purchase:", error);
    return { error: "Order could not be cancelled" };
  }
};

export default handler;
