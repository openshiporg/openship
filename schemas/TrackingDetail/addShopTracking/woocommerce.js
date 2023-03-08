export async function woocommerce({ order, trackingCompany, trackingNumber }) {
  const url = `${domain}/wp-json/wc/v3/orders/${order.orderId}/shipments`;

  // Fetch the order details
  const orderResponse = await fetch(url, {
    headers: new Headers({
      "Authorization": `Basic ${btoa(`${order.shop.accessToken}`)}`,
    }),
  });

  const orderDetails = await orderResponse.json();

  // Create the shipment
  const shipmentResponse = await fetch(url, {
    headers: new Headers({
      "Content-Type": "application/json",
      "Authorization": `Basic ${btoa(`${order.shop.accessToken}`)}`,
    }),
    method: "POST",
    body: JSON.stringify({
      shipment: {
        tracking_number: trackingNumber,
        tracking_provider: trackingCompany,
        date_created: new Date().toISOString(),
      },
    }),
  });

  const { shipment, errors: createErrors } = await shipmentResponse.json();

  if (createErrors?.length > 0) {
    // Add the tracking information to the order
    const updateOrderResponse = await fetch(
      `${domain}/wp-json/wc/v3/orders/${order.orderId}`,
      {
        headers: new Headers({
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${order.shop.accessToken}`)}`,
        }),
        method: "PUT",
        body: JSON.stringify({
          order: {
            meta_data: orderDetails.meta_data.concat([
              {
                key: "tracking_number",
                value: trackingNumber,
              },
              {
                key: "tracking_company",
                value: trackingCompany,
              },
            ]),
          },
        }),
      }
    );

    const updatedOrder = await updateOrderResponse.json();
    return {
      fulfillment: null,
      userErrors: updatedOrder.data.status === "processing" ? [] : updatedOrder.message,
    };
  } else {
    // Update the shipment
    const updateResponse = await fetch(
      `${url}/${shipment.id}`,
      {
        headers: new Headers({
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`${order.shop.accessToken}`)}`,
        }),
        method: "PUT",
        body: JSON.stringify({
          shipment: {
            tracking_number: trackingNumber,
            tracking_provider: trackingCompany,
            date_created: shipment.date_created,
          },
        }),
      }
    );

    const { shipment: updatedShipment, errors: updateErrors } = await updateResponse.json();
    return { fulfillment: { id: updatedShipment.id }, userErrors: updateErrors };
  }
}
