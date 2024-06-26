// Function to search products in BigCommerce
export async function searchProducts({ domain, accessToken, searchEntry }) {
  const products = [];

  // Helper function to format product data
  function formatProductData(variant, product) {
    return {
      image: variant.image_url || product.images[0]?.url_thumbnail || "",
      title: `${product.name} ${
        variant.option_values?.length > 0
          ? `(${variant.option_values.map((o) => o.label).join(", ")})`
          : ""
      }`,
      productId: product.id.toString(),
      variantId: variant.id.toString(),
      price: variant.price?.toString() || product.price?.toString() || "0",
      availableForSale: product.availability === "available",
      inventory: variant.inventory_level,
      inventoryTracked: variant.inventory_tracking !== "none",
    };
  }

  const includeFields = "images,variants";

  const queryParams = new URLSearchParams({
    include: includeFields,
  });
  if (searchEntry) queryParams.set("name:like", searchEntry);

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );
  const responseData = await response.json();

  responseData.data.forEach((product) => {
    product.variants.forEach((variant) => {
      products.push(formatProductData(variant, product));
    });
  });

  return { products };
}

// Function to get a specific product by variantId and productId in BigCommerce
export async function getProduct({
  domain,
  accessToken,
  variantId,
  productId,
}) {
  // Helper function to format product data
  function formatProductData(variant, product) {
    return {
      image: variant.image_url || product.images[0]?.url_thumbnail || "",
      title: `${product.name} ${
        variant.option_values?.length > 0
          ? `(${variant.option_values.map((o) => o.label).join(", ")})`
          : ""
      }`,
      productId: product.id.toString(),
      variantId: variant.id.toString(),
      price: variant.price?.toString() || product.price?.toString() || "0",
      availableForSale: product.availability === "available",
      inventory: variant.inventory_level,
      inventoryTracked: variant.inventory_tracking !== "none",
    };
  }

  const includeFields = "images,variants";

  const variantResponse = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products/${productId}/variants/${variantId}`,
    {
      method: "GET",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );
  const variant = await variantResponse.json();

  if (!variant || !variant.data) {
    throw new Error("Variant not found from BigCommerce");
  }

  const productResponse = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products/${productId}?include=${includeFields}`,
    {
      method: "GET",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );
  const product = await productResponse.json();

  if (!product || !product.data) {
    throw new Error("Product not found from BigCommerce");
  }

  const formattedProduct = formatProductData(variant.data, product.data);

  return formattedProduct;
}

// Get Orders
export async function searchOrders({ domain, accessToken, searchEntry }) {
  const headers = {
    "X-Auth-Token": accessToken,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v2/orders?is_deleted=false&min_date_created=${searchEntry}`,
    {
      method: "GET",
      headers,
    }
  );

  const data = await response.json();

  const promises = data.map((order) =>
    Promise.all([
      fetch(order.shipping_addresses.url, { method: "GET", headers }).then(
        (res) => res.json()
      ),
      fetch(`${order.products.url}?include=images`, {
        method: "GET",
        headers,
      }).then((res) => res.json()),
    ])
  );

  const result = await Promise.all(promises);

  const orders = result.map(([shippingData, productData], index) => {
    const { id, date_created } = data[index];
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
    } = shippingData[0];

    return {
      orderId: id.toString(),
      orderName: `#${id}`,
      link: `https://store-${domain}.mybigcommerce.com/manage/orders/${id}`,
      date: Intl.DateTimeFormat("en-US").format(Date.parse(date_created)),
      first_name,
      last_name,
      streetAddress1: street_1,
      streetAddress2: street_2,
      city,
      state,
      zip,
      email,
      country,
      lineItems: productData.map(
        ({ id, name, quantity, product_id, variant_id, base_price }) => ({
          name,
          quantity,
          price: base_price,
          productId: product_id.toString(),
          variantId: variant_id.toString(),
          lineItemId: id.toString(),
        })
      ),
    };
  });

  return { orders };
}

// Create Webhook
export async function createWebhook({ domain, accessToken, topic, endpoint }) {
  const mapTopic = {
    ORDER_CREATED: "store/order/created",
    ORDER_CANCELLED: "store/order/archived",
    ORDER_CHARGEBACKED: "store/order/refund/created",
    TRACKING_CREATED: "store/shipment/created",
  };

  if (!mapTopic[topic]) {
    throw new Error("Topic not mapped yet");
  }

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/hooks`,
    {
      method: "POST",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        scope: mapTopic[topic],
        destination: `${process.env.FRONTEND_URL}${endpoint}`,
        is_active: true,
        events_history_enabled: true,
        headers: {
          custom: "JSON",
        },
      }),
    }
  );

  const data = await response.json();

  if (data.title) {
    throw new Error(`Error creating webhook: ${data.title}`);
  }

  return { success: "Webhook created", webhookId: data.id };
}

// Delete Webhook
export async function deleteWebhook({ domain, accessToken, webhookId }) {
  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/hooks/${webhookId}`,
    {
      method: "DELETE",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();

  if (data.title) {
    throw new Error(`Error deleting webhook: ${data.title}`);
  }

  return { success: "Webhook deleted" };
}

// Get Webhooks
export async function getWebhooks({ domain, accessToken }) {
  const mapTopic = {
    "store/order/created": "ORDER_CREATED",
    "store/order/archived": "ORDER_CANCELLED",
    "store/order/refund/created": "ORDER_CHARGEBACKED",
    "store/shipment/created": "TRACKING_CREATED",
  };

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/hooks`,
    {
      method: "GET",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );

  const { data } = await response.json();

  const webhooks = data.map(({ id, destination, created_at, scope }) => ({
    id,
    createdAt: created_at,
    callbackUrl: destination.replace(process.env.FRONTEND_URL, ""),
    topic: mapTopic[scope],
    includeFields: [],
  }));

  return { webhooks };
}

// Update Product
export async function updateProduct({ domain, accessToken, variantId, price }) {
  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v3/catalog/products/${variantId}`,
    {
      method: "PUT",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        price: price.toString(),
      }),
    }
  );

  const { data } = await response.json();

  if (response.status >= 400) {
    throw new Error(`Error updating product: ${data.title}`);
  }

  return { updatedVariant: data };
}

export async function addTracking({ order, trackingCompany, trackingNumber }) {
  const shippingResponse = await fetch(
    `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/orders/${order.orderId}/shipping_addresses`,
    {
      headers: {
        "X-Auth-Token": order.shop.accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      method: "GET",
    }
  );

  const shippingAddresses = await shippingResponse.json();

  const orderProductsResponse = await fetch(
    `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/orders/${order.orderId}/products`,
    {
      headers: {
        "X-Auth-Token": order.shop.accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      method: "GET",
    }
  );

  const orderProducts = await orderProductsResponse.json();

  const shipmentResponse = await fetch(
    `https://api.bigcommerce.com/stores/${order.shop.domain}/v2/orders/${order.orderId}/shipments`,
    {
      headers: {
        "X-Auth-Token": order.shop.accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        order_address_id: shippingAddresses[0].id,
        tracking_number: trackingNumber,
        shipping_method: "Standard",
        tracking_carrier: "usps",
        items: orderProducts.map(({ id, quantity }) => ({
          order_product_id: id,
          quantity,
        })),
      }),
    }
  );

  const shipments = await shipmentResponse.json();

  if (shipments[0]?.status === 400) {
    return { error: shipments[0]?.message };
  }

  return { fulfillment: { id: shipments.id } };
}

// BigCommerce OAuth function
export function oauth(storeHash, config) {
  const clientId = config.clientId;
  const redirectUri = config.redirectUri;
  const scopes = config.scopes;

  const authUrl = `https://login.bigcommerce.com/oauth2/authorize?client_id=${clientId}&response_type=code&scope=${scopes.join(
    " "
  )}&redirect_uri=${redirectUri}&context=stores/${storeHash}`;

  window.location.href = authUrl; // Redirect using window.location.href
}

// BigCommerce callback function
export async function callback(query, { appKey, appSecret, redirectUri }) {
  const accessTokenRequestUrl = "https://login.bigcommerce.com/oauth2/token";
  const accessTokenPayload = {
    client_id: appKey,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    ...query,
  };

  const response = await fetch(accessTokenRequestUrl, {
    method: "POST",
    body: JSON.stringify(accessTokenPayload),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const responseBody = await response.json();
  const accessToken = responseBody.access_token;
  const storeHash = responseBody.context.split("/")[1];

  return { storeHash, accessToken };
}

export async function cancelOrderWebhookHandler(req, res) {
  if (!req.body.data.orderId) {
    return res
      .status(400)
      .json({ error: "Missing fields needed to cancel order" });
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
      `https://api.bigcommerce.com/stores/${existingShop.domain}/v2/orders/${orderId}`,
      {
        headers,
      }
    );

    const orderData = await orderRes.json();

    const shippingAddresses = await fetch(orderData.shipping_addresses.url, {
      method: "GET",
      headers,
    }).then((res) => res.json());

    const orderProducts = await fetch(
      `${orderData.products.url}?include=images`,
      {
        method: "GET",
        headers,
      }
    ).then((res) => res.json());

    const images = await Promise.all(
      orderProducts.map((value) => {
        return fetch(
          `https://api.bigcommerce.com/stores/${existingShop.domain}/v3/catalog/products/${value.product_id}/images`,
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

// Function to get scopes for BigCommerce
export function scopes() {
  return [
    "store_v2_products",
    "store_v2_orders",
    "store_v2_customers",
    "store_v2_transactions",
    "store_v2_hooks",
  ];
}
