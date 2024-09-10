import { keystoneContext } from "@keystone/keystoneContext";

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

// Create Purchase
export async function createPurchase({
  domain,
  accessToken,
  cartItems,
  email,
  address,
  orderId,
}) {
  const shopItems = cartItems.map(({ productId, quantity }) => ({
    product_id: productId,
    quantity,
  }));

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${domain}/v2/orders`,
    {
      method: "POST",
      headers: {
        "X-Auth-Token": accessToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        billing_address: {
          first_name: address.firstName,
          last_name: address.lastName,
          street_1: address.streetAddress1,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: "United States", // Adapt country code as needed
          country_iso2: "US",
          email,
        },
        shipping_addresses: [
          {
            first_name: address.firstName,
            last_name: address.lastName,
            street_1: address.streetAddress1,
            street_2: address.streetAddress2,
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: "United States", // Adapt country code as needed
            country_iso2: "US",
            email,
            shipping_method: "Free Shipping", // Adapt shipping method as needed
          },
        ],
        status_id: 11, // Completed status
        staff_notes: `Openship order placed (Order ID: ${orderId})`,
        products: shopItems,
        customer_id: 0, // Guest customer
      }),
    }
  );

  const data = await response.json();

  if (data[0]?.status >= 400) {
    throw new Error(`Error creating order: ${data[0].title}`);
  }

  return {
    purchaseId: data.id.toString(),
  };
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

// BigCommerce OAuth function
export function oauth(storeHash, config) {
  const clientId = config.clientId;
  const redirectUri = config.redirectUri;
  const scopes = config.scopes;

  const authUrl = `https://login.bigcommerce.com/oauth2/authorize?client_id=${clientId}&response_type=code&scope=${scopes.join(" ")}&redirect_uri=${redirectUri}&context=stores/${storeHash}`;

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

export async function createTrackingWebhookHandler(req, res) {
  const { id, orderId } = req.body.data;
  const { producer } = req.body;
  if (!id || !orderId) {
    return { error: true };
  }
  const foundCartItems = await keystoneContext.sudo().query.CartItem.findMany({
    where: {
      purchaseId: { equals: orderId.toString() },
      channel: { domain: { equals: producer.split("/")[1] } },
    },
    query: "id quantity channel { domain accessToken }",
  });

  if (!foundCartItems[0]?.channel?.domain || !foundCartItems[0]?.channel?.accessToken) {
    return { error: true };
  }

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${foundCartItems[0]?.channel?.domain}/v2/orders/${orderId}/shipments/${id}`,
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
  return {
    purchaseId: orderId.toString(),
    trackingNumber: data.tracking_number,
    trackingCompany: getShippingCarrier(data.tracking_number),
    domain: producer.split("/")[1],
  };
}

export async function cancelPurchaseWebhookHandler(req, res) {
  const { data, producer } = req.body;
  if (!data?.orderId) {
    return res.status(400).json({ error: "Missing fields needed to cancel cart item" });
  }
  return data.orderId.toString();
}

function getShippingCarrier(trackingNumber) {
  // Define your carrier logic here
  if (/^[\d]{20,22}$/.test(trackingNumber)) {
    return "USPS";
  }
  if (/^(\d{12}|\d{15})$/.test(trackingNumber)) {
    return "FedEx";
  }
  if (/^1Z[\dA-Z]{16}$/i.test(trackingNumber)) {
    return "UPS";
  }
  if (/^([0-9]{10}|[0-9]{12})$/.test(trackingNumber)) {
    return "DHL";
  }
  return "Other";
}
