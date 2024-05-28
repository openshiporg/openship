import { GraphQLClient, gql } from "graphql-request";
import ShopifyToken from "shopify-token";

// Function to search products
export async function searchProducts({ domain, accessToken, searchEntry }) {
  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const gqlQuery = gql`
    query SearchProducts($query: String) {
      productVariants(first: 15, query: $query) {
        edges {
          node {
            id
            availableForSale
            image {
              originalSrc
            }
            price
            title
            product {
              id
              handle
              title
              images(first: 1) {
                edges {
                  node {
                    originalSrc
                  }
                }
              }
            }
            inventoryQuantity
            inventoryPolicy
          }
        }
      }
    }
  `;

  const { productVariants } = await shopifyClient.request(gqlQuery, {
    query: searchEntry,
  });

  if (productVariants.edges.length < 1) {
    throw new Error("No products found from Shopify");
  }

  console.log({ productVariants });

  const products = productVariants.edges.map(({ node }) => ({
    image:
      node.image?.originalSrc || node.product.images.edges[0]?.node.originalSrc,
    title: `${node.product.title} - ${node.title}`,
    productId: node.product.id.split("/").pop(),
    variantId: node.id.split("/").pop(),
    price: node.price,
    availableForSale: node.availableForSale,
    inventory: node.inventoryQuantity,
    inventoryTracked: node.inventoryPolicy !== "deny",
    productLink: `https://${domain}/products/${node.product.handle}`,
  }));

  return { products };
}

// Function to get a specific product by variantId and productId
export async function getProduct({
  domain,
  accessToken,
  variantId,
  productId,
}) {
  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const gqlQuery = gql`
    query GetProduct($variantId: ID!, $productId: ID!) {
      productVariant(id: $variantId) {
        id
        availableForSale
        image {
          originalSrc
        }
        price
        title
        product {
          id
          handle
          title
          images(first: 1) {
            edges {
              node {
                originalSrc
              }
            }
          }
        }
        inventoryQuantity
        inventoryPolicy
      }
    }
  `;

  const { productVariant } = await shopifyClient.request(gqlQuery, {
    variantId: `gid://shopify/ProductVariant/${variantId}`,
    productId: `gid://shopify/Product/${productId}`,
  });

  if (!productVariant) {
    throw new Error("Product not found from Shopify");
  }

  console.log({ productVariant });

  const product = {
    image:
      productVariant.image?.originalSrc ||
      productVariant.product.images.edges[0]?.node.originalSrc,
    title: `${productVariant.product.title} - ${productVariant.title}`,
    productId: productVariant.product.id.split("/").pop(),
    variantId: productVariant.id.split("/").pop(),
    price: productVariant.price,
    availableForSale: productVariant.availableForSale,
    inventory: productVariant.inventoryQuantity,
    inventoryTracked: productVariant.inventoryPolicy !== "deny",
    productLink: `https://${domain}/products/${productVariant.product.handle}`,
  };

  return { product };
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
  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const shopItems = cartItems.map(({ variantId, quantity }) => ({
    variantId: `gid://shopify/ProductVariant/${variantId}`,
    quantity,
  }));

  const input = {
    email,
    note: "Openship order placed",
    shippingAddress: {
      firstName: address.first_name,
      lastName: address.last_name,
      address1: address.streetAddress1,
      address2: address.streetAddress2,
      city: address.city,
      province: address.state,
      zip: address.zip,
      countryCode: "US", // Adapt country code as needed
    },
    lineItems: shopItems,
    customAttributes: [{ key: "openship_order_id", value: orderId }],
    shippingLine: {
      title: "Free shipping", // Adapt shipping title/price as needed
      price: "0",
    },
  };

  const {
    draftOrderCreate: { draftOrder, userErrors },
  } = await shopifyClient.request(
    gql`
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    { input }
  );

  if (userErrors.length > 0) {
    throw new Error(`Error creating draft order: ${userErrors[0].message}`);
  }

  const { draftOrderComplete } = await shopifyClient.request(
    gql`
      mutation draftOrderComplete($id: ID!, $paymentPending: Boolean) {
        draftOrderComplete(id: $id, paymentPending: $paymentPending) {
          draftOrder {
            order {
              id
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      id: draftOrder.id,
      paymentPending: false,
    }
  );

  if (draftOrderComplete.userErrors.length > 0) {
    throw new Error(
      `Error completing draft order: ${draftOrderComplete.userErrors[0].message}`
    );
  }

  return {
    purchaseId: draftOrderComplete.draftOrder.order.id.split("/").pop(),
  };
}

// Create Webhook
export async function createWebhook({ domain, accessToken, topic, endpoint }) {
  const mapTopic = {
    ORDER_CREATED: "ORDERS_CREATE",
    ORDER_CANCELLED: "ORDERS_CANCELLED",
    ORDER_CHARGEBACKED: "DISPUTES_CREATE",
    TRACKING_CREATED: "FULFILLMENTS_CREATE",
  };

  if (!mapTopic[topic]) {
    throw new Error("Topic not mapped yet");
  }

  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const {
    webhookSubscriptionCreate: { userErrors, webhookSubscription },
  } = await shopifyClient.request(
    gql`
      mutation (
        $topic: WebhookSubscriptionTopic!
        $webhookSubscription: WebhookSubscriptionInput!
      ) {
        webhookSubscriptionCreate(
          topic: $topic
          webhookSubscription: $webhookSubscription
        ) {
          userErrors {
            field
            message
          }
          webhookSubscription {
            id
          }
        }
      }
    `,
    {
      topic: mapTopic[topic],
      webhookSubscription: {
        callbackUrl: `${process.env.FRONTEND_URL}${endpoint}`,
        format: "JSON",
      },
    }
  );

  if (userErrors.length > 0) {
    throw new Error(`Error creating webhook: ${userErrors[0].message}`);
  }

  return { success: "Webhook created", webhookId: webhookSubscription.id };
}

// Delete Webhook
export async function deleteWebhook({ domain, accessToken, webhookId }) {
  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const {
    webhookSubscriptionDelete: { userErrors, deletedWebhookSubscriptionId },
  } = await shopifyClient.request(
    gql`
      mutation webhookSubscriptionDelete($id: ID!) {
        webhookSubscriptionDelete(id: $id) {
          deletedWebhookSubscriptionId
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      id: webhookId,
    }
  );

  if (userErrors.length > 0) {
    throw new Error(`Error deleting webhook: ${userErrors[0].message}`);
  }

  return { success: "Webhook deleted" };
}

// Get Webhooks
export async function getWebhooks({ domain, accessToken }) {
  const mapTopic = {
    ORDERS_CREATE: "ORDER_CREATED",
    ORDERS_CANCELLED: "ORDER_CANCELLED",
    DISPUTES_CREATE: "ORDER_CHARGEBACKED",
    FULFILLMENTS_CREATE: "TRACKING_CREATED",
  };

  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const data = await shopifyClient.request(
    gql`
      query {
        webhookSubscriptions(first: 10) {
          edges {
            node {
              id
              callbackUrl
              createdAt
              topic
              includeFields
            }
          }
        }
      }
    `
  );

  return {
    webhooks: data?.webhookSubscriptions.edges.map(({ node }) => ({
      ...node,
      callbackUrl: node.callbackUrl.replace(process.env.FRONTEND_URL, ""),
      topic: mapTopic[node.topic],
    })),
  };
}
// Function to get config for Shopify
export function getConfig() {
  return {
    apiKey: process.env.CHANNEL_SHOPIFY_API_KEY,
    apiSecret:  process.env.CHANNEL_SHOPIFY_SECRET,
    redirectUri: `${process.env.FRONTEND_URL}/api/o-auth/channel/callback/shopify`,
    scopes: [
      "write_orders", "write_products", "read_orders", "read_products", "read_fulfillments", 
      "write_fulfillments", "write_draft_orders", "read_assigned_fulfillment_orders", 
      "write_assigned_fulfillment_orders", "read_merchant_managed_fulfillment_orders", 
      "write_merchant_managed_fulfillment_orders"
    ],
  };
}

// Shopify OAuth function
export async function oauth(req, res, config) {
  const shop = req.query.shop;
  const state = req.query.state;
  const redirectUri = config.redirectUri;
  const scopes = config.scopes;

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${config.apiKey}&scope=${scopes.join(",")}&state=${state}&redirect_uri=${redirectUri}`;
  res.redirect(authUrl);
}

// Shopify callback function
export async function callback(query, config) {
  const { shop, hmac, code, timestamp } = query;

  async function getToken() {
    if (!code) {
      return {
        status: 422,
        redirect: `${process.env.FRONTEND_URL}/api/o-auth/shop/shopify?shop=${shop}`
      };
    }

    if (!hmac || !timestamp) {
      return { status: 422, error: "Unprocessable Entity" };
    }

    const shopifyToken = new ShopifyToken({
      redirectUri: `${config.redirectUri}/callback`,
      sharedSecret: config.apiSecret,
      apiKey: config.apiKey,
      scopes: config.scopes,
      accessMode: "offline",
      timeout: 10000,
    });

    if (!shopifyToken.verifyHmac(query)) {
      console.error("Error validating hmac");
      throw new Error("Error validating hmac");
    }

    const data = await shopifyToken.getAccessToken(shop, code);
    return data.access_token;
  }

  const accessToken = await getToken();
  return accessToken;
}

export async function createTrackingWebhookHandler(req, res) {
  const { tracking_numbers, tracking_company, order_id } = req.body;
  if (!tracking_numbers?.length || !tracking_company || !order_id) {
    return { error: true };
  }
  return {
    purchaseId: order_id.toString(),
    trackingNumber: tracking_numbers[0],
    trackingCompany: tracking_company,
  };
}

export async function cancelPurchaseWebhookHandler(req, res) {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Missing fields needed to cancel cart item" });
  }
  return id.toString();
}
