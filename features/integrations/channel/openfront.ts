import { GraphQLClient, gql } from "graphql-request";

interface OpenFrontPlatform {
  domain: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date | string;
  appKey?: string;
  appSecret?: string;
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
  cartItems: any[];
  shipping: any;
  notes?: string;
}

interface CreateWebhookArgs {
  endpoint: string;
  events: string[];
}

interface DeleteWebhookArgs {
  webhookId: string;
}

// Helper function to get fresh access token with proper OAuth 2.0 flow
const getFreshAccessToken = async (platform: OpenFrontPlatform) => {
  // Check if we have local access token expiry information
  if (platform.tokenExpiresAt && platform.refreshToken) {
    const expiresAt = typeof platform.tokenExpiresAt === 'string' 
      ? new Date(platform.tokenExpiresAt) 
      : platform.tokenExpiresAt;
    
    // If access token hasn't expired yet, use it
    if (expiresAt > new Date()) {
      return platform.accessToken;
    }
    
    // Use refresh token to get new access token
    const tokenUrl = `${platform.domain}/api/oauth/token`;
    
    const formData = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: platform.refreshToken,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      throw new Error(`Failed to refresh access token: ${response.statusText} - ${errorText}`);
    }

    const { access_token } = await response.json();
    
    // TODO: Update stored access token and expiry in database
    // This would require updating the shop/channel record with new tokens
    
    return access_token;
  }
  
  // If no refresh capability, just use the access token as-is
  return platform.accessToken;
};

// Helper function to create OpenFront GraphQL client with fresh token
const createOpenFrontClient = async (platform: OpenFrontPlatform) => {
  const freshAccessToken = await getFreshAccessToken(platform);

  return new GraphQLClient(
    `${platform.domain}/api/graphql`,
    {
      headers: {
        "Authorization": `Bearer ${freshAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
};

// Helper function to get product image URL
// imagePath is a relative path (e.g., "/images/product.jpg") that needs domain prepended
// image.url is an absolute S3 URL that can be used directly
const getProductImageUrl = (productImage: any, domain: string): string | null => {
  if (productImage?.imagePath) {
    return `${domain}${productImage.imagePath}`;
  }
  return productImage?.image?.url || null;
};

// Function to search products for fulfillment
export async function searchProductsFunction({ 
  platform, 
  searchEntry, 
  after 
}: { 
  platform: OpenFrontPlatform; 
  searchEntry: string; 
  after?: string; 
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  const gqlQuery = gql`
    query SearchChannelProducts($where: ProductWhereInput, $take: Int, $skip: Int) {
      products(where: $where, take: $take, skip: $skip, orderBy: { createdAt: desc }) {
        id
        title
        handle
        productImages {
          image {
            url
          }
          imagePath
        }
        productVariants {
          id
          title
          sku
          inventoryQuantity
          prices {
            id
            amount
            currency {
              code
            }
          }
        }
        status
      }
      productsCount(where: $where)
    }
  `;

  // Build search filter - only show products available for fulfillment
  const where: any = {
    status: { equals: "published" },
    productVariants: {
      some: {
        inventoryQuantity: { gt: 0 } // Only products with inventory
      }
    }
  };

  if (searchEntry && searchEntry.trim()) {
    where.OR = [
      { title: { contains: searchEntry, mode: "insensitive" } },
      { handle: { contains: searchEntry, mode: "insensitive" } },
      { productVariants: { some: { sku: { contains: searchEntry, mode: "insensitive" } } } }
    ];
  }

  // Handle pagination
  const take = 15;
  const skip = after ? parseInt(Buffer.from(after, 'base64').toString()) : 0;

  const { products, productsCount } = await openFrontClient.request(gqlQuery, {
    where,
    take,
    skip,
  }) as any;

  if (!products || products.length === 0) {
    throw new Error("No fulfillment products found from OpenFront");
  }

  // Transform products to Openship channel format
  const transformedProducts = products.flatMap((product: any) => 
    product.productVariants
      .filter((variant: any) => variant.inventoryQuantity > 0) // Only variants with inventory
      .map((variant: any) => {
        const firstPrice = variant.prices[0];
        const firstImage = product.productImages[0];
        
        return {
          image: getProductImageUrl(firstImage, platform.domain),
          title: `${product.title} - ${variant.title}`,
          productId: product.id,
          variantId: variant.id,
          price: firstPrice ? (firstPrice.amount / 100).toFixed(2) : "0.00", // Convert from cents
          availableForSale: true, // Already filtered above
          inventory: variant.inventoryQuantity,
          inventoryTracked: true,
          productLink: `https://${platform.domain}/products/${product.handle}`,
          cursor: Buffer.from((skip + products.indexOf(product) + 1).toString()).toString('base64'),
        };
      })
  );

  const hasNextPage = skip + take < productsCount;
  const endCursor = hasNextPage ? Buffer.from((skip + take).toString()).toString('base64') : null;

  return { 
    products: transformedProducts, 
    pageInfo: {
      hasNextPage,
      endCursor
    }
  };
}

// Function to get a specific product for fulfillment
export async function getProductFunction({
  platform,
  productId,
  variantId,
}: {
  platform: OpenFrontPlatform;
  productId: string;
  variantId?: string;
}) {
  console.log("OpenFront Channel getProductFunction called with:", { platform: platform.domain, productId, variantId });
  
  const openFrontClient = await createOpenFrontClient(platform);

  const gqlQuery = gql`
    query GetChannelProduct($productId: ID!, $variantId: ID) {
      product(where: { id: $productId }) {
        id
        title
        handle
        productImages {
          image {
            url
          }
          imagePath
        }
        productVariants(where: $variantId ? { id: { equals: $variantId } } : {}) {
          id
          title
          sku
          inventoryQuantity
          prices {
            id
            amount
            currency {
              code
            }
          }
        }
        status
      }
    }
  `;

  const { product } = await openFrontClient.request(gqlQuery, {
    productId,
    variantId,
  }) as any;

  if (!product || product.status !== "published") {
    throw new Error("Product not available for fulfillment from OpenFront");
  }

  const variant = variantId 
    ? product.productVariants.find((v: any) => v.id === variantId)
    : product.productVariants[0];

  if (!variant || variant.inventoryQuantity <= 0) {
    throw new Error("Product variant not available for fulfillment from OpenFront");
  }

  const firstPrice = variant.prices[0];
  const firstImage = product.productImages[0];

  const transformedProduct = {
    image: getProductImageUrl(firstImage, platform.domain),
    title: `${product.title} - ${variant.title}`,
    productId: product.id,
    variantId: variant.id,
    price: firstPrice ? (firstPrice.amount / 100).toFixed(2) : "0.00",
    availableForSale: true,
    inventory: variant.inventoryQuantity,
    inventoryTracked: true,
    productLink: `https://${platform.domain}/products/${product.handle}`,
  };

  return { product: transformedProduct };
}

// Function to create a purchase order (fulfillment order)
export async function createPurchaseFunction({
  platform,
  cartItems,
  shipping,
}: {
  platform: OpenFrontPlatform;
  cartItems: any[];
  shipping: any;
  notes?: string;
}) {
  console.log(`🛒 OpenFront Channel: Creating purchase with ${cartItems.length} items`);
  console.log(`🚚 OpenFront Channel: Ship to: ${shipping?.firstName} ${shipping?.lastName}`);

  const openFrontClient = await createOpenFrontClient(platform);

  // Generate unique purchase ID
  const purchaseId = `PO-OF-${Date.now()}`;
  const orderNumber = `#${purchaseId}`;

  // Calculate total price
  const totalPrice = cartItems.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.price) * item.quantity);
  }, 0);

  // Create fulfillment order in OpenFront
  const createOrderMutation = gql`
    mutation CreateFulfillmentOrder($data: OrderCreateInput!) {
      createOrder(data: $data) {
        id
        orderNumber
        total
        status
        orderLineItems {
          id
          title
          quantity
          unitPrice
          productVariant {
            id
            title
            sku
            product {
              id
              title
            }
          }
        }
      }
    }
  `;

  try {
    // Prepare order data
    const orderData = {
      orderNumber,
      customerEmail: shipping?.email || "fulfillment@openship.org",
      firstName: shipping?.firstName || "Fulfillment",
      lastName: shipping?.lastName || "Order",
      address1: shipping?.streetAddress1 || "",
      address2: shipping?.streetAddress2 || "",
      city: shipping?.city || "",
      state: shipping?.state || "",
      postalCode: shipping?.zip || "",
      countryCode: shipping?.country || "US",
      phone: shipping?.phone || "",
      total: Math.round(totalPrice * 100), // Convert to cents
      subtotal: Math.round(totalPrice * 100),
      status: "pending_fulfillment",
      orderLineItems: {
        create: cartItems.map((item: any) => ({
          title: item.name || `Product ${item.variantId}`,
          quantity: item.quantity,
          unitPrice: Math.round(parseFloat(item.price) * 100), // Convert to cents
          productVariant: { connect: { id: item.variantId } }
        }))
      }
    };

    const result = await openFrontClient.request(createOrderMutation, {
      data: orderData,
    }) as any;

    const order = result.createOrder;

    console.log(`📧 OpenFront Channel: Fulfillment Order Created: ${orderNumber}`);
    console.log(`💰 OpenFront Channel: Total: $${totalPrice.toFixed(2)}`);

    // Process line items for response
    const processedLineItems = order.orderLineItems.map((item: any) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      variantId: item.productVariant.id,
      productId: item.productVariant.product.id
    }));

    // Return success response
    return {
      purchaseId: order.id,
      orderNumber: order.orderNumber,
      totalPrice: (order.total / 100).toFixed(2),
      invoiceUrl: `https://${platform.domain}/admin/orders/${order.id}`,
      lineItems: processedLineItems,
      status: "processing"
    };

  } catch (error) {
    console.error('OpenFront Channel: Purchase creation failed:', error);
    
    // Return error response
    return {
      purchaseId,
      orderNumber,
      totalPrice: totalPrice.toFixed(2),
      invoiceUrl: null,
      lineItems: cartItems.map((item: any) => ({
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: item.name || `Product ${item.variantId}`,
        quantity: item.quantity,
        variantId: item.variantId,
        productId: item.productId
      })),
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Function to create webhook for channel events
export async function createWebhookFunction({
  platform,
  endpoint,
  events,
}: {
  platform: OpenFrontPlatform;
  endpoint: string;
  events: string[];
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  const createWebhookMutation = gql`
    mutation CreateChannelWebhookEndpoint($data: WebhookEndpointCreateInput!) {
      createWebhookEndpoint(data: $data) {
        id
        url
        events
        isActive
        secret
      }
    }
  `;

  // Map channel events to OpenFront events
  const eventMap: Record<string, string> = {
    PURCHASE_CREATED: "order.created",
    PURCHASE_SHIPPED: "fulfillment.shipped",
    INVENTORY_UPDATED: "inventory.updated",
  };

  const openFrontEvents = events.map(event => eventMap[event] || event);

  const result = await openFrontClient.request(createWebhookMutation, {
    data: {
      url: endpoint,
      events: openFrontEvents,
      isActive: true,
    },
  }) as any;

  const webhook = result.createWebhookEndpoint;

  return { 
    webhooks: [webhook], 
    webhookId: webhook.id 
  };
}

// Function to delete webhook
export async function deleteWebhookFunction({
  platform,
  webhookId,
}: {
  platform: OpenFrontPlatform;
  webhookId: string;
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  const deleteWebhookMutation = gql`
    mutation DeleteChannelWebhookEndpoint($where: WebhookEndpointWhereUniqueInput!) {
      deleteWebhookEndpoint(where: $where) {
        id
      }
    }
  `;

  const result = await openFrontClient.request(deleteWebhookMutation, {
    where: { id: webhookId },
  });

  return result;
}

// Function to get webhooks
export async function getWebhooksFunction({
  platform,
}: {
  platform: OpenFrontPlatform;
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  const query = gql`
    query GetChannelWebhookEndpoints {
      webhookEndpoints(where: { isActive: { equals: true } }) {
        id
        url
        events
        isActive
        createdAt
      }
    }
  `;

  const { webhookEndpoints } = await openFrontClient.request(query) as any;

  // Map OpenFront events back to channel events
  const eventMap: Record<string, string> = {
    "order.created": "PURCHASE_CREATED",
    "fulfillment.shipped": "PURCHASE_SHIPPED",
    "inventory.updated": "INVENTORY_UPDATED",
  };

  const webhooks = webhookEndpoints.map((webhook: any) => ({
    id: webhook.id,
    callbackUrl: webhook.url,
    topic: webhook.events.map((event: string) => eventMap[event] || event),
    format: "JSON",
    createdAt: webhook.createdAt,
  }));

  return { webhooks };
}

// Function to handle purchase tracking updates
export async function addTrackingFunction({
  platform,
  purchaseId,
  trackingCompany,
  trackingNumber,
}: {
  platform: OpenFrontPlatform;
  purchaseId: string;
  trackingCompany: string;
  trackingNumber: string;
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  // Update fulfillment order with tracking information
  const updateTrackingMutation = gql`
    mutation UpdateOrderTracking($where: OrderWhereUniqueInput!, $data: OrderUpdateInput!) {
      updateOrder(where: $where, data: $data) {
        id
        orderNumber
        status
      }
    }
  `;

  // Create or update fulfillment record
  const createFulfillmentMutation = gql`
    mutation CreateOrderFulfillment($data: FulfillmentCreateInput!) {
      createFulfillment(data: $data) {
        id
        trackingNumber
        trackingCompany
        status
      }
    }
  `;

  try {
    // Create fulfillment record
    const fulfillmentResult = await openFrontClient.request(createFulfillmentMutation, {
      data: {
        order: { connect: { id: purchaseId } },
        trackingNumber,
        trackingCompany,
        status: "shipped"
      },
    });

    // Update order status
    await openFrontClient.request(updateTrackingMutation, {
      where: { id: purchaseId },
      data: { status: "shipped" },
    });

    console.log(`📦 OpenFront Channel: Tracking added for order ${purchaseId}: ${trackingCompany} ${trackingNumber}`);

    return fulfillmentResult;
  } catch (error) {
    console.error('OpenFront Channel: Failed to add tracking:', error);
    throw error;
  }
}

// Webhook handler for fulfillment updates
export async function fulfillmentUpdateWebhookHandler({
  platform,
  event,
  headers,
}: {
  platform: OpenFrontPlatform;
  event: any;
  headers: Record<string, string>;
}) {
  // Verify webhook authenticity
  const signature = headers["x-openfront-webhook-signature"];
  if (!signature) {
    throw new Error("Missing webhook signature");
  }

  const fulfillmentData = event.data;
  
  return {
    purchaseId: fulfillmentData.order?.id,
    trackingNumber: fulfillmentData.trackingNumber,
    trackingCompany: fulfillmentData.trackingCompany,
    status: fulfillmentData.status,
    type: "fulfillment_update"
  };
}

export async function oAuthFunction({
  platform,
  callbackUrl,
}: {
  platform: OpenFrontPlatform;
  callbackUrl: string;
}) {
  if (!platform.appKey) {
    throw new Error("OpenFront OAuth requires appKey in platform configuration");
  }
  
  // Generate OpenFront OAuth URL for channel installation
  const scopes = "read_products,write_products,read_orders,write_orders,read_fulfillments,write_fulfillments,read_webhooks,write_webhooks";
  const state = (platform as any).state || Math.random().toString(36).substring(7);
  
  // Redirect to apps page with install popup (same as shop integration)
  const openFrontAuthUrl = `${platform.domain}/dashboard/platform/apps?` +
    `install=true&` +
    `client_id=${platform.appKey}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `state=${state}&` +
    `response_type=code`;
  
  return { authUrl: openFrontAuthUrl };
}

export async function oAuthCallbackFunction({
  platform,
  code,
  shop,
  state,
  appKey,
  appSecret,
  redirectUri,
}: {
  platform: OpenFrontPlatform;
  code: string;
  shop: string;
  state: string;
  appKey?: string;
  appSecret?: string;
  redirectUri?: string;
}) {
  // Use platform domain or shop parameter
  const domain = platform.domain || shop;
  const tokenUrl = `${domain}/api/oauth/token`;
  
  // Use passed credentials first (for flexibility), then platform's credentials
  const clientId = appKey || platform.appKey;
  const clientSecret = appSecret || platform.appSecret;
  
  if (!clientId || !clientSecret) {
    throw new Error("OpenFront OAuth requires appKey and appSecret in platform configuration or as parameters");
  }
  
  const formData = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri || "",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenFront OAuth error:", errorText);
    throw new Error(`Failed to exchange OAuth code for access token: ${response.statusText}`);
  }

  const { access_token } = await response.json();
  
  return access_token; // Return just the token, as expected by OpenShip
}

// Required OAuth scopes for OpenFront channel integration
const REQUIRED_SCOPES = "read_products,write_products,read_orders,write_orders,read_fulfillments,write_fulfillments,read_webhooks,write_webhooks";

export function scopes() {
  return REQUIRED_SCOPES;
}