import { keystoneContext } from "@keystone/keystoneContext";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  const { platform } = req.query;
  if (!transformer[platform]) {
    return { error: "Parser for platform not found" };
  }

  const orderId = await transformer[platform](req, res);

  const [foundOrder] = await keystoneContext.sudo().query.Order.findMany({
    where: {
      orderId: { equals: parseFloat(orderId) },
    },
  });

  console.log({ foundOrder });
  if (foundOrder) {
    const updatedOrder = await keystoneContext.sudo().query.Order.updateOne({
      where: { id: foundOrder.id },
      data: { status: "CANCELLED" },
    });
    return { success: "Order cancelled" };
  }

  return { error: "Order could not be cancelled" };
};

export default handler;

const transformer = {
  bigcommerce: async (req, res) => {
    if (!req.body.data.orderId) {
      return res
        .status(400)
        .json({ error: "Missing fields needed to cancel order" });
    }
    return req.body.data.orderId.toString();
  },
  shopify: async (req, res) => {
    if (!req.body.id) {
      return res
        .status(400)
        .json({ error: "Missing fields needed to cancel order" });
    }
    return req.body.id.toString();
  },
};