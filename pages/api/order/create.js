import { query } from ".keystone/api";
import { checkAuth } from "keystone/lib/checkAuth";
import { removeEmpty } from "keystone/lib/removeEmpty";

export default async function handle(req, res) {
  try {
    const { shopId, lineItems, ...rest } = req.body;

    const { authenticatedItem } = await checkAuth(req);

    if (authenticatedItem?.id) {
      const [order] = await query.Order.findMany({
        where: {
          orderId: { equals: rest.orderId },
        },
        query: `
          id
          status
        `,
      });

      if (order) {
        return res.status(400).json({
          error: {
            id: 101,
            message: `Order already exists under ${order.status}`,
          },
        });
      }

      const formatLine = lineItems.map(({ id, quantity, ...restLine }) => ({
        lineItemId: id,
        quantity: parseInt(quantity),
        user: { connect: { id: authenticatedItem?.id } },
        ...restLine,
      }));

      const sanitizedData = removeEmpty(rest);

      const result = await query.Order.createOne({
        data: {
          ...sanitizedData,
          status: "PENDING",
          lineItems: { create: formatLine },
          shop: { connect: { id: shopId } },
          user: { connect: { id: authenticatedItem?.id } },
        },
      });

      res.status(200).json(result);
    } else {
      res.statusCode = 403;
      res.end("Hold on, you're not allowed in here!");
    }
  } catch (error) {
    return res
      .status(400)
      .json({ error: { id: 101, message: "Order was not added" } });
  }
}
