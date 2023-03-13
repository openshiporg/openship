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
    try {
      const foundCartItems = await query.CartItem.findMany({
        where: {
          purchaseId: { equals: req.body.data.orderId.toString() },
        },
        query: "id quantity order { id orderId shop { domain accessToken } }",
      });
      if (foundCartItems[0].order?.shop?.domain) {
        // Send the API request
        const response = await fetch(
          `https://api.bigcommerce.com/stores/${foundCartItems[0].order?.shop?.domain}/v3/orders/${req.body.data.orderId}/shipments/${req.body.data.id}`,
          {
            method: "POST",
            headers: {
              "X-Auth-Token": foundCartItems[0].order?.shop?.accessToken,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        // Extract the tracking number and tracking company from the response data
        // const trackingNumber = data.tracking_number;
        // const trackingCompany = data.carrier;

        return {
          purchaseId: req.body.data.orderId.toString(),
          trackingNumber: data.tracking_number,
          trackingCompany: data.carrier,
        };
      } else {
        return { error: true };
      }
    } catch (error) {
      console.error(error);
    }
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
