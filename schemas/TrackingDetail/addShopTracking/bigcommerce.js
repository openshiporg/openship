import xml2js from "xml2js";

function convertXmlToJson(xml) {
  let json = null;
  const parser = new xml2js.Parser({ explicitArray: false });
  parser.parseString(xml, (error, result) => {
    if (error) {
      throw new Error("Failed to parse XML: " + error);
    }
    json = result;
  });
  return json;
}

export async function bigcommerce({ order, trackingCompany, trackingNumber }) {
  const shippingResponse = await fetch(
    `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/orders/${order.orderId}/shipping_addresses`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": order.shop.accessToken,
      },
      method: "GET",
    }
  );

  const shippingAddresses = await shippingResponse.text();

  const { addresses } = convertXmlToJson(shippingAddresses);

  const orderProductsResponse = await fetch(
    `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/orders/${order.orderId}/products`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": order.shop.accessToken,
      },
      method: "GET",
    }
  );

  const orderProducts = await orderProductsResponse.text();

  const { products } = convertXmlToJson(orderProducts);

  const productsArray = Array.isArray(products.product)
    ? products.product
    : [products.product];

  const shipmentResponse = await fetch(
    `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/orders/${order.orderId}/shipments`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": order.shop.accessToken,
      },
      method: "POST",
      body: JSON.stringify({
        order_address_id: addresses.address.id,
        tracking_number: trackingNumber,
        shipping_method: "Standard",
        tracking_carrier: "usps",
        items: productsArray.map(({ id, quantity }) => ({
          order_product_id: id,
          quantity,
        })),
      }),
    }
  );

  // console.log(fulfillResponse);

  const shipments = await shipmentResponse.text();

  const { shipment } = convertXmlToJson(shipments);

  console.log(shipment);

  return { fulfillment: { id: shipment.id }, userErrors: [] };

  // if (fulErrors?.length > 0) {
  //   const orderResponse = await fetch(
  //     `https://api.bigcommerce.com/stores/${order.shop.domain}/v3/orders/${order.orderId}`,
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //         "X-Auth-Token": order.shop.accessToken,
  //       },
  //       method: "GET",
  //     }
  //   );

  //   const {
  //     data: {
  //       data: { shipments },
  //     },
  //     errors: orderErrors,
  //   } = await orderResponse.json();

  //   if (shipments?.length > 0) {
  //     const fulfillUpdateResponse = await fetch(
  //       `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/shipments/${shipments[0].id}`,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           "X-Auth-Token": order.shop.accessToken,
  //         },
  //         method: "PUT",
  //         body: JSON.stringify({
  //           tracking_numbers: [
  //             trackingNumber,
  //             ...shipments[0].tracking_numbers,
  //           ],
  //           tracking_url: shipments[0].tracking_url,
  //           carrier: trackingCompany,
  //         }),
  //       }
  //     );

  //     const {
  //       data: {
  //         data: { id: fulfillmentId },
  //       },
  //       errors: updateErrors,
  //     } = await fulfillUpdateResponse.json();
  //     return { fulfillment: { id: fulfillmentId }, userErrors: updateErrors };
  //   }
  // } else {
  //   return { fulfillment: { id: fulfillment.id }, userErrors: [] };
  // }
}
