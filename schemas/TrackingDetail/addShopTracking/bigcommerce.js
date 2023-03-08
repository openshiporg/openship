async function bigcommerce({ order, trackingCompany, trackingNumber }) {
  const fulfillResponse = await fetch(
    `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/orders/${order.orderId}/shipments`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": order.shop.accessToken,
      },
      method: "POST",
      body: JSON.stringify({
        tracking_number: trackingNumber,
        carrier: trackingCompany,
        order_address_id: 0,
        items: [],
      }),
    }
  );

  const {
    data: { data: fulfillment },
    errors: fulErrors,
  } = await fulfillResponse.json();

  if (fulErrors?.length > 0) {
    const orderResponse = await fetch(
      `https://api.bigcommerce.com/stores/${order.shop.domain}/v3/orders/${order.orderId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": order.shop.accessToken,
        },
        method: "GET",
      }
    );

    const {
      data: { data: { shipments } },
      errors: orderErrors,
    } = await orderResponse.json();

    if (shipments?.length > 0) {
      const fulfillUpdateResponse = await fetch(
        `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/shipments/${shipments[0].id}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Token": order.shop.accessToken,
          },
          method: "PUT",
          body: JSON.stringify({
            tracking_numbers: [trackingNumber, ...shipments[0].tracking_numbers],
            tracking_url: shipments[0].tracking_url,
            carrier: trackingCompany,
          }),
        }
      );

      const {
        data: { data: { id: fulfillmentId } },
        errors: updateErrors,
      } = await fulfillUpdateResponse.json();
      return { fulfillment: { id: fulfillmentId }, userErrors: updateErrors };
    }
  } else {
    return { fulfillment: { id: fulfillment.id }, userErrors: [] };
  }
}
