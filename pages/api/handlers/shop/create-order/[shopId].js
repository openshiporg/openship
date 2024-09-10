import { keystoneContext } from "@keystone/keystoneContext";
import { removeEmpty } from "keystone/lib/removeEmpty";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  const { shopId } = req.query;
  try {
    // Find the shop and its platform
    const shop = await keystoneContext.sudo().query.Shop.findOne({
      where: { id: shopId },
      query: "id platform { createOrderWebhookHandler }",
    });

    console.log({ shop });
    const platformFunctions = await import(
      `../../../../../shopAdapters/${shop.platform.createOrderWebhookHandler}.js`
    );
    console.log({ platformFunctions });
    const createOrderData = await platformFunctions.createOrderWebhookHandler(
      req,
      res
    );

    console.log({ createOrderData });

    const order = await keystoneContext.sudo().query.Order.createOne({
      data: removeEmpty(createOrderData),
      query: `id shop { links { channel { id name } } }`,
    });
    console.log({ order });
  } catch (error) {
    console.error("Error creating order:", error);
  }
};

export default handler;
