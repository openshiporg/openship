// shopFunctions/woocommerce.js

// Search Products
export async function searchProducts({
  domain,
  accessToken,
  searchEntry,
  productId,
  variantId,
}) {
  if (productId && variantId) {
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
      products: [
        {
          image: product.image.src,
          title: product.name,
          productId: productId.toString(),
          variantId: variantId.toString(),
          price: product.price,
          availableForSale: product.purchasable && true,
        },
      ],
    };
  }

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
