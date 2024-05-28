// shopFunctions/woocommerce.js

// Function to search products in WooCommerce
export async function searchProducts({ domain, accessToken, searchEntry }) {
  const response = await fetch(
    `${domain}/wp-json/wc/v3/products?search=${searchEntry}`,
    {
      headers: {
        Authorization: "Basic " + btoa(accessToken),
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Unable to fetch products.");
  }

  const allProducts = await response.json();

  const products = [];
  for (const {
    id,
    name,
    price,
    images,
    variations,
    purchasable,
  } of allProducts) {
    if (variations.length === 0) {
      products.push({
        image: images[0].src,
        title: name,
        productId: id.toString(),
        variantId: "0",
        price,
        availableForSale: purchasable && true,
      });
    } else {
      const variantResponse = await fetch(
        `${domain}/wp-json/wc/v3/products/${id}/variations`,
        {
          headers: {
            Authorization: "Basic " + btoa(accessToken),
            "Content-Type": "application/json",
          },
        }
      );

      const allVariants = await variantResponse.json();

      for (const variant of allVariants) {
        products.push({
          image: variant.image.src,
          title: name,
          productId: id.toString(),
          variantId: variant.id.toString(),
          price: variant.price,
          availableForSale: variant.purchasable && true,
        });
      }
    }
  }

  return { products };
}

// Function to get a specific product by variantId and productId in WooCommerce
export async function getProduct({
  domain,
  accessToken,
  variantId,
  productId,
}) {
  const response = await fetch(
    `${domain}/wp-json/wc/v3/products/${productId}/variations/${variantId}`,
    {
      headers: {
        Authorization: "Basic " + btoa(accessToken),
        "Content-Type": "application/json",
      },
    }
  );
  const product = await response.json();

  if (!product) {
    throw new Error("Product not found");
  }

  return {
    image: product.image.src,
    title: product.name,
    productId: productId.toString(),
    variantId: variantId.toString(),
    price: product.price,
    availableForSale: product.purchasable && true,
  };
}
// Search Orders
export async function searchOrders({ domain, accessToken, searchEntry }) {
  const response = await fetch(
    `${domain}/wp-json/wc/v3/orders/?search=${searchEntry}`,
    {
      headers: {
        Authorization: "Basic " + btoa(accessToken),
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to fetch orders.");
  }

  const orders = data.map((order) => ({
    orderId: order.id.toString(),
    orderName: order.number.toString(),
    link: order._links.self[0].href,
    date: order.date_created,
    first_name: order.shipping.first_name,
    last_name: order.shipping.last_name,
    streetAddress1: order.shipping.address_1,
    streetAddress2: order.shipping.address_2,
    city: order.shipping.city,
    state: order.shipping.state,
    zip: order.shipping.postcode,
    country: order.shipping.country,
    lineItems: order.line_items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image.src,
      productId: item.product_id,
      variantId: item.variation_id,
      lineItemId: item.id,
    })),
  }));

  return { orders };
}

// Create Webhook
export async function createWebhook({ domain, accessToken, topic, endpoint }) {
  const mapTopic = {
    ORDER_CREATED: "woocommerce_created_order",
    ORDER_CANCELLED: "woocommerce_order_status_cancelled",
    ORDER_CHARGEBACKED: "woocommerce_payment_complete",
    TRACKING_CREATED: "woocommerce_order_tracking_number_added",
  };

  if (!mapTopic[topic]) {
    throw new Error("Topic not mapped yet");
  }

  const response = await fetch(`${domain}/wp-json/wc/v3/webhooks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${req.body.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: `${topic} webhook`,
      topic: mapTopic[topic],
      delivery_url: `${process.env.FRONTEND_URL}${endpoint}`,
      status: "active",
      secret: "",
    }),
  });

  const data = await response.json();

  if (data.message) {
    throw new Error(`Error creating webhook: ${data.message}`);
  }

  return { success: "Webhook created" };
}

// Delete Webhook
export async function deleteWebhook({ domain, accessToken, webhookId }) {
  const response = await fetch(
    `${domain}/wp-json/wc/v3/webhooks/${webhookId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${btoa(accessToken)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();

  if (data.message) {
    throw new Error(`Error deleting webhook: ${data.message}`);
  }

  return { success: "Webhook deleted" };
}

// Get Webhooks
export async function getWebhooks({ domain, accessToken }) {
  const mapTopic = {
    ORDER_CREATED: "woocommerce_checkout_order_processed",
    ORDER_CANCELLED: "woocommerce_order_status_cancelled",
    ORDER_CHARGEBACKED: "woocommerce_refund_created",
    TRACKING_CREATED: "woocommerce_order_status_changed",
  };

  const response = await fetch(`${domain}/wp-json/wc/v3/webhooks`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${btoa(accessToken)}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Unable to fetch webhooks.");
  }

  const webhooks = data.map(({ id, delivery_url, created_at, topic }) => ({
    id,
    createdAt: created_at,
    callbackUrl: delivery_url.replace(process.env.FRONTEND_URL, ""),
    topic: mapTopic[topic],
    includeFields: [],
  }));

  return { webhooks };
}

export async function addTracking({ order, trackingCompany, trackingNumber }) {
  const url = `${order.shop.domain}/wp-json/wc/v3/orders/${order.orderId}/shipments`;

  const orderResponse = await fetch(url, {
    headers: new Headers({
      "Authorization": `Basic ${btoa(`${order.shop.accessToken}`)}`,
    }),
  });

  const orderDetails = await orderResponse.json();

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
    const updateOrderResponse = await fetch(
      `${order.shop.domain}/wp-json/wc/v3/orders/${order.orderId}`,
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

export async function cancelOrderWebhookHandler(req, res) {
  if (!req.body.data.orderId) {
    return res.status(400).json({ error: "Missing fields needed to cancel order" });
  }
  return req.body.data.orderId.toString();
}

export async function createOrderWebhookHandler(req, res) {
  if (req.body) {
    const existingShop = await keystoneContext.sudo().query.Shop.findOne({
      where: {
        domain: req.body.producer.split("/")[1],
      },
      query: `
        id
        domain
        accessToken
        user {
          id
          email
        }
        links {
          channel {
            id
            name
          }
        }
      `,
    });

    const headers = {
      "X-Auth-Token": existingShop.accessToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const orderId = req.body.data.id;
    const orderRes = await fetch(
      `https://api.woocommerce.com/stores/${existingShop.domain}/v2/orders/${orderId}`,
      {
        headers,
      }
    );

    const orderData = await orderRes.json();

    const shippingAddresses = await fetch(orderData.shipping_addresses.url, {
      method: "GET",
      headers,
    }).then((res) => res.json());

    const orderProducts = await fetch(`${orderData.products.url}?include=images`, {
      method: "GET",
      headers,
    }).then((res) => res.json());

    const images = await Promise.all(
      orderProducts.map((value) => {
        return fetch(
          `https://api.woocommerce.com/stores/${existingShop.domain}/v3/catalog/products/${value.product_id}/images`,
          {
            method: "GET",
            headers,
          }
        ).then((res) => res.json());
      })
    );

    const lineItemsOutput = orderProducts.map(
      ({ id, name, quantity, product_id, variant_id, base_price }, key) => ({
        name,
        quantity,
        price: base_price,
        image: images[key].data ? images[key].data[0].url_zoom : "",
        productId: product_id.toString(),
        variantId: variant_id.toString(),
        lineItemId: id.toString(),
        user: { connect: { id: existingShop.user.id } },
      })
    );

    const {
      first_name,
      last_name,
      street_1,
      street_2,
      city,
      state,
      zip,
      email,
      country,
    } = shippingAddresses[0];

    return {
      orderId: orderData.id,
      orderName: `#${orderData.id}`,
      first_name,
      last_name,
      streetAddress1: street_1,
      streetAddress2: street_2,
      city,
      state,
      zip,
      email,
      country,
      shippingMethod: orderData.shipping_methods,
      currency: orderData.currency_code,
      phoneNumber: orderData.billing_address.phone,
      note: orderData.customer_message,
      lineItems: { create: lineItemsOutput },
      user: { connect: { id: existingShop.user.id } },
      shop: { connect: { id: existingShop.id } },
      status: "INPROCESS",
      linkOrder: true,
      matchOrder: true,
      processOrder: true,
    };
  }
}
