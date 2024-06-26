// pages/api/cancel-purchase/[channelId].js
import { keystoneContext } from "@keystone/keystoneContext";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  const { channelId } = req.query;
  try {
    // Find the channel and its platform
    const channel = await keystoneContext.sudo().query.Channel.findOne({
      where: { id: channelId },
      query: 'id platform { cancelPurchaseWebhookHandler }',
    });
    const platformFunctions = await import(`../../../../../channelAdapters/${channel.platform.cancelPurchaseWebhookHandler}.js`);
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