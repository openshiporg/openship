import { GraphQLClient, gql } from "graphql-request";

interface ShopifyPlatform {
  domain: string;
  accessToken: string;
}

interface SearchProductsArgs {
  searchEntry: string;
  after?: string;
}

interface GetProductArgs {
  productId: string;
  variantId?: string;
}

interface CreatePurchaseArgs {
  cartItems: Array<{
    variantId: string;
    quantity: number;
    price?: string;
  }>;
  shipping?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone?: string;
  };
  notes?: string;
}

interface CreateWebhookArgs {
  endpoint: string;
  events: string[];
}

interface DeleteWebhookArgs {
  webhookId: string;
}

interface OAuthArgs {
  callbackUrl: string;
}

interface OAuthCallbackArgs {
  code: string;
  shop: string;
  state: string;
}

interface WebhookEventArgs {
  event: any;
  headers: Record<string, string>;
}

// Function to search products for purchasing
export async function searchProductsFunction({ 
  platform, 
  searchEntry, 
  after 
}: { 
  platform: ShopifyPlatform; 
  searchEntry: string; 
  after?: string; 
}) {
  const shopifyClient = new GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken,
      },
    }
  );

  const gqlQuery = gql`
    query SearchProducts($query: String, $after: String) {
      productVariants(first: 15, query: $query, after: $after) {
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
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const { productVariants } = await shopifyClient.request(gqlQuery, {
    query: searchEntry,
    after,
  });

  if (productVariants.edges.length < 1) {
    throw new Error("No products found from Shopify channel");
  }

  const products = productVariants.edges.map(({ node, cursor }) => ({
    image:
      node.image?.originalSrc || node.product.images.edges[0]?.node.originalSrc,
    title: `${node.product.title} - ${node.title}`,
    productId: node.product.id.split("/").pop(),
    variantId: node.id.split("/").pop(),
    price: node.price,
    availableForSale: node.availableForSale,
    inventory: node.inventoryQuantity,
    inventoryTracked: node.inventoryPolicy !== "deny",
    productLink: `https://${platform.domain}/products/${node.product.handle}`,
    cursor,
  }));

  return { 
    products, 
    pageInfo: productVariants.pageInfo 
  };
}

// Function to get a specific product by variantId and productId
export async function getProductFunction({
  platform,
  productId,
  variantId,
}: {
  platform: ShopifyPlatform;
  productId: string;
  variantId?: string;
}) {
  console.log("CHANNEL getProductFunction called with:", { platform: platform.domain, productId, variantId });
  
  const shopifyClient = new GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken,
      },
    }
  );

  const gqlQuery = gql`
    query GetProduct($variantId: ID!) {
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

  const fullVariantId = `gid://shopify/ProductVariant/${variantId}`;
  console.log("CHANNEL querying with variantId:", fullVariantId);
  
  const { productVariant } = await shopifyClient.request(gqlQuery, {
    variantId: fullVariantId,
  });

  console.log("CHANNEL productVariant result:", productVariant);

  if (!productVariant) {
    throw new Error("Product not found from Shopify channel");
  }

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
    productLink: `https://${platform.domain}/products/${productVariant.product.handle}`,
  };

  return { product };
}

export async function createPurchaseFunction({
  platform,
  cartItems,
  shipping,
  notes,
}: {
  platform: ShopifyPlatform;
  cartItems: CreatePurchaseArgs['cartItems'];
  shipping?: CreatePurchaseArgs['shipping'];
  notes?: string;
}) {
  const shopifyClient = new GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken,
      },
    }
  );

  const mutation = gql`
    mutation CreateDraftOrder($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
          invoiceUrl
          totalPrice
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPrice
                variant {
                  id
                  title
                  product {
                    id
                    title
                  }
                }
              }
            }
          }
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            country
            zip
            phone
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const lineItems = cartItems.map(item => ({
    variantId: `gid://shopify/ProductVariant/${item.variantId}`,
    quantity: item.quantity,
    originalUnitPrice: item.price,
  }));

  const input: any = {
    lineItems,
    note: notes,
  };

  if (shipping) {
    input.shippingAddress = {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      address1: shipping.address1,
      address2: shipping.address2,
      city: shipping.city,
      province: shipping.province,
      country: shipping.country,
      zip: shipping.zip,
      phone: shipping.phone,
    };
  }

  const result = await shopifyClient.request(mutation, { input });

  if (result.draftOrderCreate.userErrors.length > 0) {
    throw new Error(`Failed to create purchase: ${result.draftOrderCreate.userErrors.map(e => e.message).join(', ')}`);
  }

  const draftOrder = result.draftOrderCreate.draftOrder;

  // Complete the draft order to create an actual order
  const completeMutation = gql`
    mutation CompleteDraftOrder($id: ID!) {
      draftOrderComplete(id: $id) {
        draftOrder {
          id
          order {
            id
            name
            totalPrice
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const completeResult = await shopifyClient.request(completeMutation, {
    id: draftOrder.id,
  });

  if (completeResult.draftOrderComplete.userErrors.length > 0) {
    throw new Error(`Failed to complete purchase: ${completeResult.draftOrderComplete.userErrors.map(e => e.message).join(', ')}`);
  }

  const order = completeResult.draftOrderComplete.draftOrder.order;

  return {
    purchaseId: order.id.split("/").pop(),
    orderNumber: order.name,
    totalPrice: order.totalPrice,
    invoiceUrl: draftOrder.invoiceUrl,
    lineItems: order.lineItems.edges.map(({ node }) => ({
      id: node.id.split("/").pop(),
      title: node.title,
      quantity: node.quantity,
      variantId: node.variant.id.split("/").pop(),
    })),
    status: "pending",
  };
}

export async function createWebhookFunction({
  platform,
  endpoint,
  events,
}: {
  platform: ShopifyPlatform;
  endpoint: string;
  events: string[];
}) {
  const mapTopic = {
    ORDER_CREATED: "ORDERS_CREATE",
    ORDER_CANCELLED: "ORDERS_CANCELLED",
    ORDER_CHARGEBACKED: "DISPUTES_CREATE",
    TRACKING_CREATED: "FULFILLMENTS_CREATE",
  };

  const shopifyClient = new GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken,
      },
    }
  );

  const webhooks = [];

  for (const event of events) {
    const shopifyTopic = mapTopic[event] || event;
    const mutation = gql`
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const result = await shopifyClient.request(mutation, {
      topic: shopifyTopic.toUpperCase(),
      webhookSubscription: {
        callbackUrl: endpoint,
        format: "JSON",
      },
    });

    webhooks.push(result.webhookSubscriptionCreate.webhookSubscription);
  }

  return { webhooks };
}

export async function deleteWebhookFunction({
  platform,
  webhookId,
}: {
  platform: ShopifyPlatform;
  webhookId: string;
}) {
  const shopifyClient = new GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken,
      },
    }
  );

  const mutation = gql`
    mutation DeleteWebhook($id: ID!) {
      webhookSubscriptionDelete(id: $id) {
        deletedWebhookSubscriptionId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const result = await shopifyClient.request(mutation, {
    id: `gid://shopify/WebhookSubscription/${webhookId}`,
  });

  return result.webhookSubscriptionDelete;
}

export async function getWebhooksFunction({
  platform,
}: {
  platform: ShopifyPlatform;
}) {
  const mapTopic = {
    ORDERS_CREATE: "ORDER_CREATED",
    ORDERS_CANCELLED: "ORDER_CANCELLED",
    DISPUTES_CREATE: "ORDER_CHARGEBACKED",
    FULFILLMENTS_CREATE: "TRACKING_CREATED",
  };

  const shopifyClient = new GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken,
      },
    }
  );

  const query = gql`
    query GetWebhooks {
      webhookSubscriptions(first: 50) {
        edges {
          node {
            id
            topic
            format
            createdAt
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
        }
      }
    }
  `;

  const { webhookSubscriptions } = await shopifyClient.request(query);

  const webhooks = webhookSubscriptions.edges.map(({ node }) => ({
    id: node.id.split("/").pop(),
    callbackUrl: node.endpoint.callbackUrl,
    topic: mapTopic[node.topic] || node.topic,
    format: node.format,
    createdAt: node.createdAt,
  }));

  return { webhooks };
}

export async function oAuthFunction({
  platform,
  callbackUrl,
}: {
  platform: ShopifyPlatform;
  callbackUrl: string;
}) {
  // This would typically redirect to Shopify's OAuth URL
  const scopes = "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory";
  const shopifyAuthUrl = `https://${platform.domain}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_APP_KEY}&scope=${scopes}&redirect_uri=${callbackUrl}&state=${Math.random().toString(36).substring(7)}`;
  
  return { authUrl: shopifyAuthUrl };
}

export async function oAuthCallbackFunction({
  platform,
  code,
  shop,
  state,
}: {
  platform: ShopifyPlatform;
  code: string;
  shop: string;
  state: string;
}) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_APP_KEY,
      client_secret: process.env.SHOPIFY_APP_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange OAuth code for access token");
  }

  const { access_token } = await response.json();
  
  return { 
    accessToken: access_token,
    domain: shop,
  };
}

export async function createTrackingWebhookHandler({
  platform,
  event,
  headers,
}: {
  platform: ShopifyPlatform;
  event: any;
  headers: Record<string, string>;
}) {
  // Verify webhook authenticity
  const hmac = headers["x-shopify-hmac-sha256"];
  if (!hmac) {
    throw new Error("Missing webhook HMAC");
  }

  // Process the fulfillment data
  const fulfillment = {
    id: event.id,
    orderId: event.order_id,
    status: event.status,
    trackingCompany: event.tracking_company,
    trackingNumber: event.tracking_number,
    trackingUrl: event.tracking_url,
    purchaseId: event.order_id?.toString(), // Use order ID as purchaseId
    lineItems: event.line_items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      variantId: item.variant_id,
      productId: item.product_id,
    })),
    createdAt: event.created_at,
    updatedAt: event.updated_at,
  };

  return { fulfillment, type: "fulfillment_created" };
}

export async function cancelPurchaseWebhookHandler({
  platform,
  event,
  headers,
}: {
  platform: ShopifyPlatform;
  event: any;
  headers: Record<string, string>;
}) {
  // Verify webhook authenticity
  const hmac = headers["x-shopify-hmac-sha256"];
  if (!hmac) {
    throw new Error("Missing webhook HMAC");
  }

  const order = {
    id: event.id,
    name: event.name,
    cancelReason: event.cancel_reason,
    cancelledAt: event.cancelled_at,
    refund: event.refunds?.[0] || null,
  };

  return { order, type: "purchase_cancelled" };
}