import { query } from ".keystone/api";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res.status(400).json({ error: "Parser for platform not found" });
  }

  const { purchaseId, trackingNumber, trackingCompany } = transformer[platform](
    req,
    res
  );


  const createdTracking = await query.TrackingDetail.createOne({
    data: {
      trackingNumber,
      trackingCompany,
      purchaseId,
    },
  });


  return res.status(200).send("Fulfillment Uploaded");
};

export default handler;

const transformer = {
  shopify: (req, res) => {
    if (
      !req.body.tracking_numbers?.length > 0 ||
      !req.body.tracking_company ||
      !req.body.order_id
    ) {
      return res
        .status(400)
        .json({ error: "Missing fields needed to create tracking" });
    }
    return {
      purchaseId: req.body.order_id.toString(),
      trackingNumber: req.body.tracking_numbers[0],
      trackingCompany: req.body.tracking_company,
    };
  },
  stockandtrace: (req, res) => {
    if (
      !req.body.shippingOrder?.trackingNumber?.length > 0 ||
      !req.body.shippingOrder?.carrier?.name ||
      !req.body.shippingOrder?.purchaseOrder
    ) {
      return res
        .status(400)
        .json({ error: "Missing fields needed to create tracking" });
    }
    return {
      purchaseId: req.body.shippingOrder.purchaseOrder,
      trackingNumber: req.body.shippingOrder.trackingNumber[0],
      trackingCompany: req.body.shippingOrder.carrier.name,
    };
  },
};
