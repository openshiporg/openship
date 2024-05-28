import { keystoneContext } from "@keystone/keystoneContext";
import { removeEmpty } from "keystone/lib/removeEmpty";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  const { platform } = req.query;
  try {
    const platformFunctions = await import(`../../../shopFunctions/${platform}.js`);
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
