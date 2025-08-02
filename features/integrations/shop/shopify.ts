import { GraphQLClient, gql } from "graphql-request";
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';

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

interface SearchOrdersArgs {
  searchEntry: string;
  after?: string;
}

interface UpdateProductArgs {
  productId: string;
  variantId: string;
  inventory?: number;
  price?: string;
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

// Function to search products
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
    throw new Error("No products found from Shopify");
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
  console.log("SHOP getProductFunction called with:", { platform: platform.domain, productId, variantId });
  
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
  console.log("SHOP querying with variantId:", fullVariantId);
  
  const { productVariant } = await shopifyClient.request(gqlQuery, {
    variantId: fullVariantId,
  });

  console.log("SHOP productVariant result:", productVariant);

  if (!productVariant) {
    throw new Error("Product not found from Shopify");
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
    productLink: `https://${platform.domain}/admin/products/${productVariant.product.id
      .split("/")
      .pop()}/variants/${productVariant.id.split("/").pop()}`,
  };

  return { product };
}

export async function searchOrdersFunction({
  platform,
  searchEntry,
  after,
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
    query SearchOrders($query: String, $after: String) {
      orders(first: 15, query: $query, after: $after) {
        edges {
          node {
            id
            name
            email
            createdAt
            updatedAt
            displayFulfillmentStatus
            displayFinancialStatus
            totalPriceSet {
              presentmentMoney {
                amount
                currencyCode
              }
            }
            shippingAddress {
              firstName
              lastName
              address1
              address2
              city
              province
              provinceCode
              zip
              country
              countryCodeV2
            }
            lineItems(first: 10) {
              edges {
                node {
                  id
                  title
                  quantity
                  image {
                    originalSrc
                  }
                  variant {
                    id
                    title
                    price
                    sku
                    product {
                      id
                      title
                      handle
                    }
                  }
                }
              }
            }
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

  const { orders } = await shopifyClient.request(gqlQuery, {
    query: searchEntry,
    after,
  });

  const formattedOrders = orders.edges.map(({ node, cursor }) => ({
    orderId: node.id.split("/").pop(),
    orderName: node.name,
    link: `https://${platform.domain}/admin/orders/${node.id.split("/").pop()}`,
    date: new Date(node.createdAt).toLocaleDateString(),
    firstName: node.shippingAddress?.firstName || "",
    lastName: node.shippingAddress?.lastName || "",
    streetAddress1: node.shippingAddress?.address1 || "",
    streetAddress2: node.shippingAddress?.address2 || "",
    city: node.shippingAddress?.city || "",
    state: node.shippingAddress?.provinceCode || "",
    zip: node.shippingAddress?.zip || "",
    country: node.shippingAddress?.countryCodeV2 || "",
    email: node.email || "",
    fulfillmentStatus: node.displayFulfillmentStatus,
    financialStatus: node.displayFinancialStatus,
    totalPrice: node.totalPriceSet.presentmentMoney.amount,
    currency: node.totalPriceSet.presentmentMoney.currencyCode,
    lineItems: node.lineItems.edges.map(({ node: lineItem }) => ({
      lineItemId: lineItem.id.split("/").pop(),
      name: lineItem.title,
      quantity: lineItem.quantity,
      image: lineItem.image?.originalSrc || "",
      price: lineItem.variant?.price || "0",
      variantId: lineItem.variant?.id.split("/").pop(),
      productId: lineItem.variant?.product.id.split("/").pop(),
      sku: lineItem.variant?.sku || "",
    })),
    cartItems: [], // Would be populated if this order has cart items
    fulfillments: [], // Would need to be fetched if needed
    note: "",
    cursor,
  }));

  return { 
    orders: formattedOrders, 
    pageInfo: orders.pageInfo 
  };
}

export async function updateProductFunction({
  platform,
  productId,
  variantId,
  inventory,
  price,
}: {
  platform: ShopifyPlatform;
  productId: string;
  variantId: string;
  inventory?: number;
  price?: string;
}) {
  const shopifyClient = new GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken,
      },
    }
  );

  const mutations = [];

  if (price !== undefined) {
    const updatePriceMutation = gql`
      mutation UpdateProductVariantPrice($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    mutations.push(
      shopifyClient.request(updatePriceMutation, {
        input: {
          id: `gid://shopify/ProductVariant/${variantId}`,
          price: price,
        },
      })
    );
  }

  if (inventory !== undefined) {
    try {
      // Get current inventory and calculate absolute quantity
      const getVariantWithInventoryQuery = gql`
        query GetVariantWithInventory($id: ID!) {
          productVariant(id: $id) {
            inventoryQuantity
            inventoryItem {
              id
            }
          }
        }
      `;

      console.log('QUERYING FOR VARIANT ID:', variantId);
      console.log('FULL GID:', `gid://shopify/ProductVariant/${variantId}`);
      
      const variantData = await shopifyClient.request(getVariantWithInventoryQuery, {
        id: `gid://shopify/ProductVariant/${variantId}`,
      });

      console.log('VARIANT DATA RECEIVED:', JSON.stringify(variantData, null, 2));

      if (!variantData.productVariant?.inventoryItem?.id) {
        console.log('FAILING BECAUSE NO inventoryItem.id');
        console.log('variantData structure:', variantData);
        console.log('productVariant:', variantData.productVariant);
        console.log('inventoryItem:', variantData.productVariant?.inventoryItem);
        throw new Error("Unable to find inventory item for variant");
      }

      // Get the first location
      const getLocationsQuery = gql`
        query GetLocations {
          locations(first: 1) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `;

      const locationsData = await shopifyClient.request(getLocationsQuery);
      const location = locationsData.locations.edges[0]?.node;

      if (!location) {
        throw new Error("No locations found for shop");
      }

      // Use inventory delta to adjust available inventory (not on-hand)
      const inventoryDelta = inventory;

      const updateInventoryMutation = gql`
        mutation InventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
          inventoryAdjustQuantities(input: $input) {
            inventoryAdjustmentGroup {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      mutations.push(
        shopifyClient.request(updateInventoryMutation, {
          input: {
            reason: "correction",
            name: "available",
            changes: [
              {
                inventoryItemId: variantData.productVariant.inventoryItem.id,
                locationId: location.id, 
                delta: inventoryDelta
              }
            ]
          }
        })
      );
    } catch (inventoryError) {
      console.error("Error updating inventory:", inventoryError);
      throw inventoryError;
    }
  }

  const results = await Promise.all(mutations);
  return { success: true, results };
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

  if (!platform.domain) {
    throw new Error("Missing domain in platform configuration");
  }

  if (!platform.accessToken) {
    throw new Error("Missing accessToken in platform configuration");
  }


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

    try {
      const result = await shopifyClient.request(mutation, {
        topic: shopifyTopic,
        webhookSubscription: {
          callbackUrl: endpoint,
          format: "JSON",
        },
      });


      if (result.webhookSubscriptionCreate.userErrors.length > 0) {
        throw new Error(
          `Error creating webhook: ${result.webhookSubscriptionCreate.userErrors[0].message}`
        );
      }

      webhooks.push(result.webhookSubscriptionCreate.webhookSubscription);
    } catch (error) {
      throw error;
    }
  }

  // Return the first webhook's ID for compatibility with existing code
  const webhookId = webhooks[0]?.id?.split("/").pop();
  return { webhooks, webhookId };
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

  const baseUrl = await getBaseUrl();
  const webhooks = webhookSubscriptions.edges.map(({ node }) => ({
    id: node.id.split("/").pop(),
    callbackUrl: node.endpoint.callbackUrl.replace(baseUrl, ""),
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

export async function createOrderWebhookHandler({
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

  // Process the order data and format for Keystone Order creation
  const lineItemsOutput = await Promise.all(
    event.line_items.map(async (item) => {
      // Get product variant image from Shopify
      let image = null;
      try {
        const shopifyClient = new GraphQLClient(
          `https://${platform.domain}/admin/api/graphql.json`,
          {
            headers: {
              'X-Shopify-Access-Token': platform.accessToken,
            },
          }
        );

        const variantQuery = gql`
          query productVariant($id: ID!) {
            productVariant(id: $id) {
              image {
                originalSrc
              }
              product {
                images(first: 1) {
                  edges {
                    node {
                      originalSrc
                    }
                  }
                }
              }
            }
          }
        `;

        const result = await shopifyClient.request(variantQuery, {
          id: `gid://shopify/ProductVariant/${item.variant_id}`,
        });

        image = result.productVariant?.image?.originalSrc || 
                result.productVariant?.product?.images?.edges?.[0]?.node?.originalSrc || 
                null;
      } catch (error) {
        console.warn(`Failed to fetch image for variant ${item.variant_id}:`, error.message);
      }

      return {
        name: item.title,
        image,
        price: parseFloat(item.price),
        quantity: item.quantity,
        productId: item.product_id?.toString(),
        variantId: item.variant_id?.toString(),
        sku: item.sku || "",
        lineItemId: item.id?.toString(),
      };
    })
  );

  // Return Keystone-ready order data (same format as Dasher)
  return {
    orderId: event.id?.toString(),
    orderName: event.name,
    email: event.email,
    firstName: event.shipping_address?.first_name,
    lastName: event.shipping_address?.last_name,
    streetAddress1: event.shipping_address?.address1,
    streetAddress2: event.shipping_address?.address2,
    city: event.shipping_address?.city,
    state: event.shipping_address?.province_code,
    zip: event.shipping_address?.zip,
    country: event.shipping_address?.country_code,
    phone: event.shipping_address?.phone,
    currency: event.currency,
    totalPrice: parseFloat(event.total_price),
    subTotalPrice: parseFloat(event.subtotal_price || event.total_price),
    totalDiscounts: parseFloat(event.total_discounts || "0"),
    totalTax: parseFloat(event.total_tax || "0"),
    status: "INPROCESS",
    linkOrder: true,
    matchOrder: true,
    processOrder: true,
    lineItems: { create: lineItemsOutput },
  };
}

export async function addTrackingFunction({
  order,
  trackingCompany,
  trackingNumber,
}: {
  order: any;
  trackingCompany: string;
  trackingNumber: string;
}) {
  const FETCH_FULFILLMENT_ORDER = gql`
    query ($id: ID!) {
      order(id: $id) {
        fulfillmentOrders(first: 1) {
          edges {
            node {
              id
              status
              fulfillments(first: 1) {
                edges {
                  node {
                    id
                    trackingInfo {
                      number
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const UPDATE_FULFILLMENT_TRACKING_INFO = gql`
    mutation fulfillmentTrackingInfoUpdateV2(
      $fulfillmentId: ID!
      $trackingInfoInput: FulfillmentTrackingInput!
    ) {
      fulfillmentTrackingInfoUpdateV2(
        fulfillmentId: $fulfillmentId
        trackingInfoInput: $trackingInfoInput
      ) {
        fulfillment {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const CREATE_FULFILLMENT = gql`
    mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
      fulfillmentCreateV2(fulfillment: $fulfillment) {
        fulfillment {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  
  const client = new GraphQLClient(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken,
      },
    }
  );

  const data = await client.request(FETCH_FULFILLMENT_ORDER, {
    id: `gid://shopify/Order/${order.orderId}`,
  });

  const fulfillmentOrder = data.order?.fulfillmentOrders?.edges?.[0]?.node;
  
  if (!fulfillmentOrder) {
    throw new Error("No fulfillment order found");
  }

  if (fulfillmentOrder.status === "CLOSED") {
    const fulfillment = fulfillmentOrder.fulfillments.edges[0]?.node;
    if (fulfillment) {
      const updateResponseBody = await client.request(
        UPDATE_FULFILLMENT_TRACKING_INFO,
        {
          fulfillmentId: fulfillment.id,
          trackingInfoInput: {
            numbers: [
              trackingNumber,
              ...fulfillment.trackingInfo.map(({ number }) => number),
            ],
          },
        }
      );
      return updateResponseBody;
    }
  }

  const createResponseBody = await client.request(CREATE_FULFILLMENT, {
    fulfillment: {
      lineItemsByFulfillmentOrder: [
        {
          fulfillmentOrderId: fulfillmentOrder.id,
        },
      ],
      trackingInfo: {
        company: trackingCompany,
        numbers: [trackingNumber],
      },
    },
  });

  return createResponseBody;
}

export async function cancelOrderWebhookHandler({
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
  };

  return { order, type: "order_cancelled" };
}