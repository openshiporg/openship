import { query } from ".keystone/api";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res.status(200).json({ error: "Parser for platform not found" });
  }

  const { purchaseId, trackingNumber, trackingCompany, userId, error } =
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
      user: { connect: { id: userId } },
    },
  });

  return res.status(200).json({ success: "Fulfillment Uploaded" });
};

export default handler;

const transformer = {
  bigcommerce: async (req, res) => {
    console.log("BigCommerce", req.body);
    if (!req.body.data?.id || !req.body.data?.orderId) {
      return { error: true };
    }
    try {
      const foundCartItems = await query.CartItem.findMany({
        where: {
          purchaseId: { equals: req.body.data.orderId.toString() },
          channel: { domain: { equals: req.body.producer.split("/")[1] } },
        },
        query: "id quantity channel { domain accessToken } user { id }",
      });

      console.log("foundCartItems", foundCartItems[0].channel);
      if (foundCartItems[0]?.channel?.domain && foundCartItems[0]?.user?.id) {
        // Send the API request
        const response = await fetch(
          `https://api.bigcommerce.com/stores/${foundCartItems[0]?.channel?.domain}/v2/orders/${req.body.data.orderId}/shipments/${req.body.data.id}`,
          {
            method: "GET",
            headers: {
              "X-Auth-Token": foundCartItems[0]?.channel?.accessToken,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        console.log({
          purchaseId: req.body.data.orderId.toString(),
          trackingNumber: data.tracking_number,
          trackingCompany: getShippingCarrier(data.tracking_number),
          userId: foundCartItems[0]?.user?.id,
        });
        // Extract the tracking number and tracking company from the response data
        // const trackingNumber = data.tracking_number;
        // const trackingCompany = data.carrier;

        return {
          purchaseId: req.body.data.orderId.toString(),
          trackingNumber: data.tracking_number,
          trackingCompany: getShippingCarrier(data.tracking_number),
          userId: foundCartItems[0]?.user?.id,
        };
      } else {
        return { error: true };
      }
    } catch (error) {
      console.error(error);
      return { error: true };
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

function getShippingCarrier(trackingNumber) {
  // USPS tracking number format - 22 digits starting with "9" and ending with two letters
  // USPS tracking number format (domestic)
  if (/^[\d]{20,22}$/.test(trackingNumber)) {
    return "USPS";
  }

  // USPS tracking number format (international)
  if (
    /^[A-Z]{2}\d{9}US$|^[A-Z]{2}\d{4}\s\d{4}\s\d{2}\s\d{4}\s\d{2}$/.test(
      trackingNumber
    )
  ) {
    return "USPS";
  }

  // FedEx tracking number format
  if (/^(\d{12}|\d{15})$/.test(trackingNumber)) {
    return "FedEx";
  }

  // UPS tracking number format
  if (/^1Z[\dA-Z]{16}$/i.test(trackingNumber)) {
    return "UPS";
  }

  // DHL tracking number format
  if (/^([0-9]{10}|[0-9]{12})$/.test(trackingNumber)) {
    return "DHL";
  }

  // Amazon tracking number format - starts with TBA, followed by 6-10 digit alphanumeric code
  if (/^TBA[0-9a-zA-Z]{6,10}$/.test(trackingNumber)) {
    return "Amazon";
  }

  // OnTrac tracking number format - 4 digit facility code followed by 13 digit delivery order number
  if (/^[0-9]{4}[0-9]{13}$/.test(trackingNumber)) {
    return "OnTrac";
  }

  // Canada Post tracking number format - 2 letters, followed by 9 digits, ending with CA
  if (/^[A-Za-z]{2}\d{9}CA$/.test(trackingNumber)) {
    return "Canada Post";
  }

  // Royal Mail tracking number format - 2 letters, followed by 9 digits, ending with GB (for UK)
  if (/^[A-Za-z]{2}\d{9}GB$/.test(trackingNumber)) {
    return "Royal Mail";
  }

  // Japan Post tracking number format - 13 digit alphanumeric code
  if (/^\d{13}$/.test(trackingNumber)) {
    return "Japan Post";
  }

  // If the tracking number format is not recognized, return null
  return "Other";
}
