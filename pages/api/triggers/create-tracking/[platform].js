import { query } from ".keystone/api";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res.status(200).json({ error: "Parser for platform not found" });
  }

  const { purchaseId, trackingNumber, trackingCompany, error } =
    await transformer[platform](req, res);

  if (error) {
    return res
      .status(200)
      .json({ error: "Missing fields needed to create tracking" });
  }

  const createdTracking = await query.TrackingDetail.createOne({
    data: {
      trackingNumber,
      trackingCompany,
      purchaseId,
    },
  });

  return res.status(200).json({ success: "Fulfillment Uploaded" });
};

export default handler;

const transformer = {
  bigcommerce: async (req, res) => {
    if (!req.body.data?.id || !req.body.data?.orderId) {
      return { error: true };
    }
    // try {
    //   // Send the API request
    //   const response = await fetch(
    //     `https://api.bigcommerce.com/stores/${storeHash}/v3/orders/${req.body.data.orderId}/shipments/${req.body.data.id}`,
    //     {
    //       method: "POST",
    //       headers: {
    //         "X-Auth-Token": req.body.accessToken,
    //         "Content-Type": "application/json",
    //         Accept: "application/json",
    //       },
    //     }
    //   );

    //   const data = await response.json();

    //   // Extract the tracking number and tracking company from the response data
    //   const trackingNumber = data.tracking_number;
    //   const trackingCompany = data.carrier;

    //   // Do something with the tracking number and tracking company
    //   console.log(`Tracking number: ${trackingNumber}`);
    //   console.log(`Tracking company: ${trackingCompany}`);
    // } catch (error) {
    //   console.error(error);
    // }
    return {
      purchaseId: req.body.order_id.toString(),
      trackingNumber: req.body.tracking_numbers[0],
      trackingCompany: req.body.tracking_company,
    };
  },
  shopify: (req, res) => {
    if (
      !req.body.tracking_numbers?.length > 0 ||
      !req.body.tracking_company ||
      !req.body.order_id
    ) {
      return { error: true };
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
      return { error: true };
    }
    return {
      purchaseId: req.body.shippingOrder.purchaseOrder,
      trackingNumber: req.body.shippingOrder.trackingNumber[0],
      trackingCompany: req.body.shippingOrder.carrier.name,
    };
  },
  torod: (req, res) => {
    if (!req.body.order_id || !req.body.tracking_id) {
      return { error: true };
    }
    return {
      purchaseId: req.body.order_id,
      trackingNumber: req.body.tracking_id,
      trackingCompany: "TOROD",
    };
  },
};
