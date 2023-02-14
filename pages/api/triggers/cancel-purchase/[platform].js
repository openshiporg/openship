import { query } from ".keystone/api";

const handler = async (req, res) => {
  res.status(200).json({ received: true });

  const { platform } = req.query;
  if (!transformer[platform]) {
    return { error: "Parser for platform not found" };
  }

  const purchaseId = await transformer[platform](req, res);

  const cartItemIDs = await query.CartItem.findMany({
    where: {
      purchaseId: { equals: purchaseId },
    },
  });

  const updatedCartItems = await query.CartItem.updateMany({
    data: cartItemIDs.map(({ id }) => ({
      where: { id },
      data: { status: "CANCELLED" },
    })),
    query: `id order { id }`,
  });


  const order = await query.Order.updateOne({
    where: { id: updatedCartItems[0].order.id },
    data: {
      status: "PENDING",
    },
  });
  return { success: "Order cancelled" };
};

export default handler;

const transformer = {
  bigcommerce: async (req, res) => {
    if (!req.body.id) {
      return res
        .status(400)
        .json({ error: "Missing fields needed to cancel cart item" });
    }
    return req.body.id.toString();
  },
  shopify: async (req, res) => {
    if (!req.body.id) {
      return res
        .status(400)
        .json({ error: "Missing fields needed to cancel cart item" });
    }
    return req.body.id.toString();
  },
  torod: async (req, res) => {
    if (!req.body.order_id) {
      return res
        .status(400)
        .json({ error: "Missing fields needed to cancel cart item" });
    }
    return req.body.order_id.toString();
  },
};
