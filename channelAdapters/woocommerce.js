
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
export async function getProduct({ domain, accessToken, variantId, productId }) {
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


// Create Purchase
export async function createPurchase({
  domain,
  accessToken,
  email,
  cartItems,
  address,
}) {
  const {
    firstName,
    lastName,
    streetAddress1,
    streetAddress2,
    city,
    state,
    zip,
    country,
  } = address;

  const line_items = cartItems.map((item) => ({
    product_id: item.productId,
    variation_id: item.variantId,
    quantity: item.quantity,
  }));

  const shipping = {
    first_name: firstName,
    last_name: lastName,
    address_1: streetAddress1,
    address_2: streetAddress2,
    city,
    state,
    postcode: zip,
    country,
  };

  const orderData = {
    line_items,
    shipping,
    status: "completed", // You might want to adjust the status based on your workflow
  };

  const createOrderResponse = await fetch(`${domain}/wp-json/wc/v3/orders`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  const orderJson = await createOrderResponse.json();

  if (createOrderResponse.status >= 400) {
    throw new Error(`Order creation failed: ${orderJson.message}`);
  }

  return {
    purchaseId: orderJson.id.toString(),
    url: `${domain}/wp-admin/post.php?post=${orderJson.id}&action=edit`,
  };
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

export async function createTrackingWebhookHandler(req, res) {
  const { shippingOrder } = req.body;
  if (!shippingOrder?.trackingNumber?.length || !shippingOrder?.carrier?.name || !shippingOrder?.purchaseOrder) {
    return { error: true };
  }
  return {
    purchaseId: shippingOrder.purchaseOrder,
    trackingNumber: shippingOrder.trackingNumber[0],
    trackingCompany: shippingOrder.carrier.name,
  };
}

export async function cancelPurchaseWebhookHandler(req, res) {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing fields needed to cancel cart item" });
  }
  return id.toString();
}
