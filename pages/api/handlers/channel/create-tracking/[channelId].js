// pages/api/create-tracking/[channelId].js
import { keystoneContext } from "@keystone/keystoneContext";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  const { channelId } = req.query;
  try {
    // Find the channel and its platform
    const channel = await keystoneContext.sudo().query.Channel.findOne({
      where: { id: channelId },
      query: 'id platform { createTrackingWebhookHandler }',
    });
    const platformFunctions = await import(`../../../../../channelAdapters/${channel.platform.createTrackingWebhookHandler}.js`);
    const { purchaseId, trackingNumber, trackingCompany, domain, error } =
      await platformFunctions.createTrackingWebhookHandler(req, res);

    if (error) {
      return res.status(200).json({ error: "Missing fields needed to create tracking" });
    }

    const foundCartItems = await keystoneContext.sudo().query.CartItem.findMany({
      where: {
        purchaseId: { equals: purchaseId },
        channel: { domain: { equals: domain } },
      },
      query: "user { id }",
    });

    if (foundCartItems[0]?.user?.id) {
      await keystoneContext.sudo().query.TrackingDetail.createOne({
        data: {
          trackingNumber,
          trackingCompany,
          purchaseId,
          user: { connect: { id: foundCartItems[0]?.user?.id } },
        },
      });
    }
    return res.status(200).json({ success: "Fulfillment Uploaded" });
  } catch (error) {
    console.error("Error creating tracking:", error);
    return res.status(500).json({ error: "Error creating tracking" });
  }
};

export default handler;