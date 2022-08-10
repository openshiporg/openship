import { query } from ".keystone/api";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res.status(400).json({ error: "Parser for platform not found" });
  }

  const orderId = await transformer[platform](req, res);

  const [foundOrder] = await query.Order.findMany({
    where: {
      orderId: { equals: orderId },
    },
  });

  const updatedOrder = await query.Order.updateOne({
    where: { id: foundOrder },
    data: { status: "CANCELLED" },
  });
  return res.status(200).send("Order cancelled");
};

export default handler;

const transformer = {
  shopify: async (req, res) => {
    if (!req.body.id) {
      return res
        .status(400)
        .json({ error: "Missing fields needed to cancel order" });
    }
    return req.body.id.toString();
  },
};
