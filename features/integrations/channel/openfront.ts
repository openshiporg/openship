import { GraphQLClient, gql } from "graphql-request";
import { keystoneContext } from '@/features/keystone/context';

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
  // Get channel with OAuth credentials from database
  const channels = await keystoneContext.sudo().query.Channel.findMany({
    where: {
      domain: { equals: platform.domain },
      accessToken: { equals: platform.accessToken }
    },
    query: 'id refreshToken tokenExpiresAt platform { appKey appSecret }'
  });

  if (!channels || channels.length === 0) {
    return platform.accessToken;
  }

  const channel = channels[0];
  
  // If we have a refresh token, check if we need to refresh
  if (channel.refreshToken) {
    // Check if access token has expired (if we have expiry info)
    let shouldRefresh = false;

    if (channel.tokenExpiresAt) {
      const expiresAt = typeof channel.tokenExpiresAt === 'string'
        ? new Date(channel.tokenExpiresAt)
        : channel.tokenExpiresAt;

      const now = new Date();
      shouldRefresh = expiresAt <= now;
    } else {
      // If no expiry info, assume token needs refresh
      shouldRefresh = true;
    }

    if (shouldRefresh) {
      // Use refresh token to get new access token
      const tokenUrl = `${platform.domain}/api/oauth/token`;

      const formData = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: channel.refreshToken,
        client_id: channel.platform?.appKey || "",
        client_secret: channel.platform?.appSecret || "",
      });

      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to refresh access token: ${response.statusText} - ${errorText}`);
      }

      const tokenData = await response.json();
      const { access_token, refresh_token, expires_in } = tokenData;

      // Update stored access token and expiry in database
      try {
        await keystoneContext.sudo().query.Channel.updateOne({
          where: { id: channel.id },
          data: {
            accessToken: access_token,
            ...(refresh_token && { refreshToken: refresh_token }),
            ...(expires_in && { tokenExpiresAt: new Date(Date.now() + (expires_in * 1000)) })
          }
        });
      } catch (error) {
        // Continue with the request even if database update fails
      }

      return access_token;
    } else {
      // Token hasn't expired yet, use existing one
      return platform.accessToken;
    }
  }

  // If no refresh token, just use the access token as-is
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
  const openFrontClient = await createOpenFrontClient(platform);

  const gqlQuery = gql`
    query GetChannelProduct($productId: ID!, $variantWhere: ProductVariantWhereInput) {
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
        productVariants(where: $variantWhere) {
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
    variantWhere: variantId ? { id: { equals: variantId } } : {},
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
  const openFrontClient = await createOpenFrontClient(platform);

  try {
    // Step 1: Get region data with currency ID and taxRate (like storefront does)
    const currencyCode = (shipping?.currency || "USD").toLowerCase();
    const getRegionQuery = gql`
      query GetRegion($currencyCode: String!) {
        regions(where: { currency: { code: { equals: $currencyCode } } }) {
          id
          taxRate
          currency {
            id
            code
          }
        }
      }
    `;
    
    const { regions } = await openFrontClient.request(getRegionQuery, {
      currencyCode: currencyCode,
    }) as any;
    
    const region = regions[0];
    if (!region) {
      throw new Error(`No region found for currency: ${currencyCode}`);
    }

    // Step 2: Create cart (following storefront flow)
    const { createCart: cart } = await openFrontClient.request(gql`
      mutation CreateCart($data: CartCreateInput!) {
        createCart(data: $data) {
          id
          region {
            id
            currency {
              id
              code
            }
          }
        }
      }
    `, {
      data: {
        region: { connect: { id: region.id } },
        email: shipping?.email || `order-${Date.now()}@openship.generated`
      }
    }) as any;

    // Step 3: Add line items to cart (this computes unitPrice/total automatically)
    const lineItemsToCreate = [];
    for (const item of cartItems) {
      lineItemsToCreate.push({
        productVariant: { connect: { id: item.variantId } },
        quantity: item.quantity
      });
    }

    await openFrontClient.request(gql`
      mutation AddLineItemsToCart($cartId: ID!, $data: CartUpdateInput!) {
        updateActiveCart(cartId: $cartId, data: $data) {
          id
        }
      }
    `, {
      cartId: cart.id,
      data: {
        lineItems: {
          create: lineItemsToCreate
        }
      }
    }) as any;

    // Step 4: Create addresses and add to cart
    const { createAddress: shippingAddr } = await openFrontClient.request(gql`
      mutation CreateAddress($data: AddressCreateInput!) {
        createAddress(data: $data) {
          id
        }
      }
    `, {
      data: {
        firstName: shipping?.firstName || "Guest",
        lastName: shipping?.lastName || "Customer", 
        address1: shipping?.address1 || "123 Default St",
        city: shipping?.city || "Default City",
        province: shipping?.state || "NY",
        postalCode: shipping?.zip || "10001",
        phone: shipping?.phone || "",
        country: {
          connect: {
            iso2: (shipping?.country || "US").toLowerCase()
          }
        }
      }
    }) as any;

    // Step 5: Update cart with addresses
    await openFrontClient.request(gql`
      mutation UpdateCartAddresses($cartId: ID!, $data: CartUpdateInput!) {
        updateActiveCart(cartId: $cartId, data: $data) {
          id
        }
      }
    `, {
      cartId: cart.id,
      data: {
        shippingAddress: { connect: { id: shippingAddr.id } },
        billingAddress: { connect: { id: shippingAddr.id } }
      }
    }) as any;

    // Step 6: Complete cart to create order (like storefront placeOrder)
    const completeResult = await openFrontClient.request(gql`
      mutation CompleteActiveCart($cartId: ID!) {
        completeActiveCart(cartId: $cartId)
      }
    `, {
      cartId: cart.id
    }) as any;

    const order = completeResult.completeActiveCart;
    if (!order?.id) {
      throw new Error("Failed to complete cart - no order created");
    }

    // Process line items from cart items (since order doesn't include line items)
    const processedLineItems = cartItems.map((item: any) => ({
      id: item.variantId,
      title: item.name || `Product ${item.variantId}`,
      quantity: item.quantity,
      variantId: item.variantId,
    }));

    // Return in the same format as Shopify channel
    return {
      purchaseId: order.id,
      orderNumber: `#${order.displayId}`,
      totalPrice: order.total,
      url: `https://${platform.domain}/account/orders/details/${order.id}`,
      lineItems: processedLineItems,
      status: "pending",
    };

  } catch (error: any) {
    // Return error response with detailed error info
    return {
      purchaseId: null,
      orderNumber: null,
      totalPrice: "0.00",
      url: null,
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

// Function to create webhook for channel events - simplified to update user's webhook URL
export async function createWebhookFunction({
  platform,
  endpoint,
  events,
}: {
  platform: OpenFrontPlatform;
  endpoint: string;
  events: string[];
}) {
  // Check if ORDER_CANCELLED is requested - OpenFront doesn't support this yet
  if (events.includes('ORDER_CANCELLED')) {
    throw new Error('OpenFront does not support ORDER_CANCELLED webhooks. Only TRACKING_CREATED webhooks are currently supported.');
  }

  // Map Openship channel events to OpenFront events
  const eventMap: Record<string, string> = {
    ORDER_CREATED: "order.created",
    TRACKING_CREATED: "fulfillment.created",
  };

  const openFrontEvents = events.map(event => eventMap[event] || event);

  const openFrontClient = await createOpenFrontClient(platform);

  // Get current user from the access token
  const getUserQuery = gql`
    query GetCurrentUser {
      authenticatedItem {
        ... on User {
          id
          email
          orderWebhookUrl
        }
      }
    }
  `;

  const { authenticatedItem: user } = await openFrontClient.request(getUserQuery) as any;

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Update the user's webhook URL using updateActiveUser (bypasses access restrictions)
  const updateUserMutation = gql`
    mutation UpdateActiveUserWebhookUrl($data: UserUpdateProfileInput!) {
      updateActiveUser(data: $data) {
        id
        orderWebhookUrl
      }
    }
  `;

  const result = await openFrontClient.request(updateUserMutation, {
    data: { orderWebhookUrl: endpoint }
  }) as any;

  const updatedUser = result.updateActiveUser;

  return {
    webhooks: [{
      id: `user-${updatedUser.id}`,
      callbackUrl: updatedUser.orderWebhookUrl,
      topic: openFrontEvents.join(", "),
      format: "JSON",
      createdAt: new Date().toISOString()
    }],
    webhookId: `user-${updatedUser.id}`
  };
}

// Function to delete webhook - clear user's webhook URL
export async function deleteWebhookFunction({
  platform,
  webhookId,
}: {
  platform: OpenFrontPlatform;
  webhookId: string;
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  // Clear the user's webhook URL using updateActiveUser (same as createWebhookFunction)
  const updateUserMutation = gql`
    mutation ClearActiveUserWebhookUrl($data: UserUpdateProfileInput!) {
      updateActiveUser(data: $data) {
        id
        orderWebhookUrl
      }
    }
  `;

  const result = await openFrontClient.request(updateUserMutation, {
    data: { orderWebhookUrl: "" }
  }) as any;

  const updatedUser = result.updateActiveUser;

  return {
    success: true,
    result: updatedUser,
    deletedWebhookSubscriptionId: webhookId
  };
}

// Function to get webhooks - get user's webhook URL  
export async function getWebhooksFunction({
  platform,
}: {
  platform: OpenFrontPlatform;
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  // Map OpenFront events back to Openship channel events
  const eventMap: Record<string, string> = {
    "order.created": "PURCHASE_CREATED",
    "fulfillment.created": "PURCHASE_SHIPPED",
  };

  // Get current user's webhook URL
  const getUserQuery = gql`
    query GetCurrentUser {
      authenticatedItem {
        ... on User {
          id
          email
          orderWebhookUrl
          createdAt
        }
      }
    }
  `;

  const { authenticatedItem: user } = await openFrontClient.request(getUserQuery) as any;
  
  if (!user || !user.orderWebhookUrl) {
    return { webhooks: [] };
  }

  // For OpenFront channels, we only support TRACKING_CREATED
  const webhooks = [{
    id: `user-${user.id}`,
    callbackUrl: user.orderWebhookUrl,
    topic: "TRACKING_CREATED",
    format: "JSON",
    createdAt: user.createdAt
  }];

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

    return fulfillmentResult;
  } catch (error) {
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
    throw new Error(`Failed to exchange OAuth code for access token: ${response.statusText} - ${errorText}`);
  }

  const { access_token, refresh_token, expires_in } = await response.json();
  
  // Return OAuth response with refresh token support
  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    tokenExpiresAt: new Date(Date.now() + (expires_in * 1000)).toISOString()
  };
}

// Function to handle tracking/fulfillment webhook from OpenFront
export async function createTrackingWebhookHandler({
  platform,
  event,
  headers,
}: {
  platform: OpenFrontPlatform;
  event: any;
  headers: Record<string, string>;
}) {
  // Validate event type
  if (event.event !== 'order.fulfilled') {
    throw new Error(`Unsupported event type: ${event.event}`);
  }

  // Extract order and fulfillment data
  const order = event.order;
  const fulfillment = event.fulfillment;

  if (!order?.id) {
    throw new Error('Missing order.id in webhook payload');
  }

  if (!fulfillment?.shippingLabels || fulfillment.shippingLabels.length === 0) {
    throw new Error('Missing shipping labels in fulfillment data');
  }

  // Get the first shipping label for tracking info
  const shippingLabel = fulfillment.shippingLabels[0];

  if (!shippingLabel.trackingNumber || !shippingLabel.carrier) {
    throw new Error('Missing tracking number or carrier in shipping label');
  }

  // Return tracking data in the expected format (matching Shopify pattern)
  return {
    fulfillment: {
      id: fulfillment.id || `fulfillment_${order.id}`,
      orderId: order.id,
      status: 'shipped',
      trackingCompany: shippingLabel.carrier,
      trackingNumber: shippingLabel.trackingNumber,
      trackingUrl: shippingLabel.url || null,
      purchaseId: order.id, // This is what the route expects to find cart items
      lineItems: fulfillment.items?.map((item: any) => ({
        id: item.id,
        title: item.lineItem?.title || 'Unknown Product',
        quantity: item.quantity,
        variantId: item.lineItem?.variantId || null,
        productId: item.lineItem?.productId || null,
      })) || [],
      createdAt: event.timestamp || new Date().toISOString(),
      updatedAt: event.timestamp || new Date().toISOString(),
    },
    type: "fulfillment_created"
  };
}

// Required OAuth scopes for OpenFront channel integration
const REQUIRED_SCOPES = "read_products,write_products,read_orders,write_orders,read_fulfillments,write_fulfillments,read_webhooks,write_webhooks";

export function scopes() {
  return REQUIRED_SCOPES;
}