import { keystoneContext } from "@keystone/keystoneContext";
import { removeEmpty } from "keystone/lib/removeEmpty";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  const { shopId } = req.query;
  try {
    // Find the shop and its platform
    const shop = await keystoneContext.sudo().query.Shop.findOne({
      where: { id: shopId },
      query: 'id platform { createOrderWebhookHandler }',
    });
    const platformFunctions = await import(`../../../../../shopAdapters/${shop.platform.createOrderWebhookHandler}.js`);
    const createOrderData = await platformFunctions.createOrderWebhookHandler(req, res);

    await keystoneContext.sudo().query.Order.createOne({
      data: removeEmpty(createOrderData),
      query: `id shop { links { channel { id name } } }`,
    });
  } catch (error) {
    console.error("Error creating order:", error);
  }
};

export default handler;