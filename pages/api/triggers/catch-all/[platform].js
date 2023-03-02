const handler = async (req, res) => {
  res.status(200).json({ received: true });

  // use catch-all route if platform sends all webhook alerts to 1 url (e.g. TOROD)

  const { platform } = req.query;
  if (!transformer[platform]) {
    return { error: "Catch all parser for platform not found" };
  }

  await transformer[platform](req, res);
};

export default handler;

const transformer = {
  torod: async (req, res) => {
    if (req.body.status === "Shipped") {
      const shipOrderRes = await fetch(
        `${process.env.FRONTEND_URL}/api/triggers/create-tracking/torod`,
        {
          method: "POST",
          body: req.body,
        }
      );
      const shipOrder = shipOrderRes.json();
      console.log({ shipOrder });
      return { orderShipped: true };
    } else if (
      req.body.status === "Cancelled" ||
      req.body.status === "Failed" ||
      req.body.status === "RTO"
    ) {
      const cancelOrderRes = await fetch(
        `${process.env.FRONTEND_URL}/api/triggers/cancel-purchase/torod`,
        {
          method: "POST",
          body: req.body,
        }
      );
      const cancelOrder = cancelOrderRes.json();
      console.log({ cancelOrder });
      return { orderCancelled: true };
    }
  },
};
