// pages/api/create-tracking/[channelId].js
import { keystoneContext } from "@keystone/keystoneContext";

const handler = async (req, res) => {
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
      console.error("Missing fields needed to create tracking");
      return;
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
    console.log("Fulfillment Uploaded");
  } catch (error) {
    console.error("Error creating tracking:", error);
  }
};

export default handler;