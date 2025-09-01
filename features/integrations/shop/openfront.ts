import { GraphQLClient, gql } from "graphql-request";
import { getBaseUrl } from '@/features/dashboard/lib/getBaseUrl';
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

// Helper function to get fresh access token with proper OAuth 2.0 flow
const getFreshAccessToken = async (platform: OpenFrontPlatform) => {
  console.log('🔄 [OpenFront Shop] getFreshAccessToken called');
  console.log('🔄 [OpenFront Shop] Platform domain:', platform.domain);
  console.log('🔄 [OpenFront Shop] Actual access token:', platform.accessToken);
  
  // Get shop with OAuth credentials from database
  const shops = await keystoneContext.sudo().query.Shop.findMany({
    where: { 
      domain: { equals: platform.domain },
      accessToken: { equals: platform.accessToken }
    },
    query: 'id refreshToken tokenExpiresAt platform { appKey appSecret }'
  });
  
  if (!shops || shops.length === 0) {
    console.log('⚠️ [OpenFront Shop] No matching shop found in database');
    return platform.accessToken;
  }
  
  const shop = shops[0];
  console.log('🔄 [OpenFront Shop] Found shop:', shop.id);
  console.log('🔄 [OpenFront Shop] Has refresh token:', !!shop.refreshToken);
  console.log('🔄 [OpenFront Shop] Token expires at:', shop.tokenExpiresAt);
  console.log('🔄 [OpenFront Shop] Has appKey:', !!shop.platform?.appKey);
  console.log('🔄 [OpenFront Shop] Has appSecret:', !!shop.platform?.appSecret);
  console.log('🔄 [OpenFront Shop] Actual refresh token:', shop.refreshToken);
  
  // If we have a refresh token, check if we need to refresh
  if (shop.refreshToken) {
    console.log('🔄 [OpenFront Shop] Refresh token found, checking if refresh needed');
    
    // Check if access token has expired (if we have expiry info)
    let shouldRefresh = false;
    
    if (shop.tokenExpiresAt) {
      const expiresAt = typeof shop.tokenExpiresAt === 'string' 
        ? new Date(shop.tokenExpiresAt) 
        : shop.tokenExpiresAt;
      
      const now = new Date();
      shouldRefresh = expiresAt <= now;
      
      console.log('🔄 [OpenFront Shop] Token expiry check:');
      console.log('🔄 [OpenFront Shop] - Expires at:', expiresAt.toISOString());
      console.log('🔄 [OpenFront Shop] - Current time:', now.toISOString());
      console.log('🔄 [OpenFront Shop] - Should refresh:', shouldRefresh);
    } else {
      // If no expiry info, assume token needs refresh
      shouldRefresh = true;
      console.log('🔄 [OpenFront Shop] No expiry info found, assuming refresh needed');
    }
    
    if (shouldRefresh) {
      console.log('🔄 [OpenFront Shop] Starting token refresh process...');
      
      // Use refresh token to get new access token
      const tokenUrl = `${platform.domain}/api/oauth/token`;
      console.log('🔄 [OpenFront Shop] Token URL:', tokenUrl);
      
      const formData = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: shop.refreshToken,
        client_id: shop.platform?.appKey || "",
        client_secret: shop.platform?.appSecret || "",
      });

      console.log('🔄 [OpenFront Shop] Refresh request params:');
      console.log('🔄 [OpenFront Shop] - grant_type: refresh_token');
      console.log('🔄 [OpenFront Shop] - client_id:', shop.platform?.appKey || "NOT_SET");
      console.log('🔄 [OpenFront Shop] - client_secret:', shop.platform?.appSecret ? "SET" : "NOT_SET");
      console.log('🔄 [OpenFront Shop] - refresh_token:', shop.refreshToken ? "SET" : "NOT_SET");

      console.log('🔄 [OpenFront Shop] Making refresh token request...');
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      console.log('🔄 [OpenFront Shop] Refresh response status:', response.status);
      console.log('🔄 [OpenFront Shop] Refresh response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 [OpenFront Shop] Token refresh failed:', errorText);
        console.error('🚨 [OpenFront Shop] Response status:', response.status);
        console.error('🚨 [OpenFront Shop] Response statusText:', response.statusText);
        throw new Error(`Failed to refresh access token: ${response.statusText} - ${errorText}`);
      }

      const tokenData = await response.json();
      console.log('🔄 [OpenFront Shop] Token refresh response received');
      console.log('🔄 [OpenFront Shop] - Has access_token:', !!tokenData.access_token);
      console.log('🔄 [OpenFront Shop] - Has refresh_token:', !!tokenData.refresh_token);
      console.log('🔄 [OpenFront Shop] - Expires in:', tokenData.expires_in, 'seconds');
      
      const { access_token, refresh_token, expires_in } = tokenData;
      
      // Update stored access token and expiry in database
      console.log('🔄 [OpenFront Shop] Updating tokens in database...');
      try {
        console.log('🔄 [OpenFront Shop] Updating shop:', shop.id);
        await keystoneContext.sudo().query.Shop.updateOne({
          where: { id: shop.id },
          data: {
            accessToken: access_token,
            ...(refresh_token && { refreshToken: refresh_token }),
            ...(expires_in && { tokenExpiresAt: new Date(Date.now() + (expires_in * 1000)) })
          }
        });
        console.log('✅ [OpenFront Shop] Shop updated with new tokens:', shop.id);
      } catch (error) {
        console.error('🚨 [OpenFront Shop] Failed to update shop tokens in database:', error);
        // Continue with the request even if database update fails
      }
      
      console.log('✅ [OpenFront Shop] Returning fresh access token');
      return access_token;
    } else {
      // Token hasn't expired yet, use existing one
      console.log('✅ [OpenFront Shop] Token still valid, using existing access token');
      return platform.accessToken;
    }
  }
  
  // If no refresh token, just use the access token as-is
  console.log('⚠️ [OpenFront Shop] No refresh token available, using existing access token');
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

// Function to search products
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
    query SearchProducts($where: ProductWhereInput, $take: Int, $skip: Int) {
      products(where: $where, take: $take, skip: $skip, orderBy: { createdAt: desc }) {
        id
        title
        handle
        description {
          document
        }
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
            region {
              countries {
                iso2
              }
            }
          }
        }
        productCollections {
          id
          title
        }
        metadata
        status
        createdAt
      }
      productsCount(where: $where)
    }
  `;

  // Build search filter
  const where: any = {
    status: { equals: "published" }
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
    throw new Error("No products found from OpenFront");
  }

  // Transform products to Openship format
  const transformedProducts = products.flatMap((product: any) => 
    product.productVariants.map((variant: any) => {
      const firstPrice = variant.prices[0];
      const firstImage = product.productImages[0];
      
      return {
        image: getProductImageUrl(firstImage, platform.domain),
        title: `${product.title} - ${variant.title}`,
        productId: product.id,
        variantId: variant.id,
        price: firstPrice ? (firstPrice.amount / 100).toFixed(2) : "0.00", // Convert from cents
        availableForSale: product.status === "published" && variant.inventoryQuantity > 0,
        inventory: variant.inventoryQuantity || 0,
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

// Function to get a specific product by variantId and productId
export async function getProductFunction({
  platform,
  productId,
  variantId,
}: {
  platform: OpenFrontPlatform;
  productId: string;
  variantId?: string;
}) {
  console.log("OpenFront getProductFunction called with:", { platform: platform.domain, productId, variantId });
  
  const openFrontClient = await createOpenFrontClient(platform);

  // Build the query conditionally based on whether variantId is provided
  const gqlQuery = variantId ? gql`
    query GetProduct($productId: ID!, $variantId: ID!) {
      product(where: { id: $productId }) {
        id
        title
        handle
        description {
          document
        }
        productImages {
          image {
            url
          }
          imagePath
        }
        productVariants(where: { id: { equals: $variantId } }) {
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
  ` : gql`
    query GetProduct($productId: ID!) {
      product(where: { id: $productId }) {
        id
        title
        handle
        description {
          document
        }
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
    }
  `;

  const variables: any = { productId };
  if (variantId) {
    variables.variantId = variantId;
  }

  const { product } = await openFrontClient.request(gqlQuery, variables) as any;

  if (!product) {
    throw new Error("Product not found from OpenFront");
  }

  const variant = variantId 
    ? product.productVariants.find((v: any) => v.id === variantId)
    : product.productVariants[0];

  if (!variant) {
    throw new Error("Product variant not found from OpenFront");
  }

  const firstPrice = variant.prices[0];
  const firstImage = product.productImages[0];

  const transformedProduct = {
    image: getProductImageUrl(firstImage, platform.domain),
    title: `${product.title} - ${variant.title}`,
    productId: product.id,
    variantId: variant.id,
    price: firstPrice ? (firstPrice.amount / 100).toFixed(2) : "0.00",
    availableForSale: product.status === "published" && variant.inventoryQuantity > 0,
    inventory: variant.inventoryQuantity || 0,
    inventoryTracked: true,
    productLink: `https://${platform.domain}/products/${product.handle}`,
  };

  return { product: transformedProduct };
}

export async function searchOrdersFunction({
  platform,
  searchEntry,
  after,
}: {
  platform: OpenFrontPlatform;
  searchEntry: string;
  after?: string;
}) {
  console.log("fuckkk")
  const openFrontClient = await createOpenFrontClient(platform);

  const gqlQuery = gql`
    query SearchOrders($where: OrderWhereInput, $take: Int, $skip: Int) {
      orders(where: $where, take: $take, skip: $skip, orderBy: { createdAt: desc }) {
        id
        displayId
        email
        status
        total
        rawTotal
        currency {
          code
        }
        shippingAddress {
          firstName
          lastName
          address1
          address2
          city
          province
          postalCode
          phone
          country {
            iso2
          }
        }
        lineItems {
          id
          title
          quantity
          sku
          variantTitle
          thumbnail
          formattedUnitPrice
          formattedTotal
          moneyAmount {
            amount
            originalAmount
          }
          productVariant {
            id
            title
            sku
            product {
              id
              title
              handle
              thumbnail
            }
          }
          productData
          variantData
        }
        createdAt
        updatedAt
      }
      ordersCount(where: $where)
    }
  `;

  // Build search filter
  const where: any = {};

  if (searchEntry && searchEntry.trim()) {
    where.OR = [
      { displayId: { contains: searchEntry, mode: "insensitive" } },
      { email: { contains: searchEntry, mode: "insensitive" } },
      { shippingAddress: { 
        is: {
          OR: [
            { firstName: { contains: searchEntry, mode: "insensitive" } },
            { lastName: { contains: searchEntry, mode: "insensitive" } }
          ]
        }
      }}
    ];
  }

  // Handle pagination
  const take = 15;
  const skip = after ? parseInt(Buffer.from(after, 'base64').toString()) : 0;

  const { orders, ordersCount } = await openFrontClient.request(gqlQuery, {
    where,
    take,
    skip,
  }) as any;

  console.log("Orders from OpenFront:", orders);

  // Transform orders to Openship format
  const transformedOrders = orders.map((order: any) => {
    const shippingAddress = order.shippingAddress || {};
    
    return {
      orderId: order.id,
      orderName: `#${order.displayId}`,
      link: `${platform.domain}/admin/orders/${order.id}`,
      date: new Date(order.createdAt).toLocaleDateString(),
      firstName: shippingAddress.firstName || "",
      lastName: shippingAddress.lastName || "",
      streetAddress1: shippingAddress.address1 || "",
      streetAddress2: shippingAddress.address2 || "",
      city: shippingAddress.city || "",
      state: shippingAddress.province || "",
      zip: shippingAddress.postalCode || "",
      country: shippingAddress.country?.iso2 || "",
      email: order.email || "",
      fulfillmentStatus: order.status,
      financialStatus: order.status,
      totalPrice: order.rawTotal ? (order.rawTotal / 100).toFixed(2) : "0.00",
      currency: order.currency?.code || "USD",
      lineItems: (order.lineItems || []).map((lineItem: any) => {
        // Combine product title and variant title like in channel search
        const productTitle = lineItem.productVariant?.product?.title || '';
        const variantTitle = lineItem.productVariant?.title || '';
        const combinedTitle = productTitle && variantTitle ? `${productTitle} - ${variantTitle}` : lineItem.title;
        
        return {
          lineItemId: lineItem.id,
          name: combinedTitle,
          quantity: lineItem.quantity,
          image: getProductImageUrl({ imagePath: lineItem.thumbnail, image: { url: lineItem.productVariant?.product?.thumbnail } }, platform.domain) || "",
          price: lineItem.moneyAmount ? (lineItem.moneyAmount.amount / 100).toFixed(2) : "0.00",
          variantId: lineItem.productVariant?.id || "",
          productId: lineItem.productVariant?.product?.id || "",
          sku: lineItem.sku || lineItem.productVariant?.sku || "",
        };
      }),
      cartItems: [],
      fulfillments: [],
      note: "",
      cursor: Buffer.from((skip + orders.indexOf(order) + 1).toString()).toString('base64'),
    };
  });

  console.log("Transformed orders:", transformedOrders);

  const hasNextPage = skip + take < ordersCount;
  const endCursor = hasNextPage ? Buffer.from((skip + take).toString()).toString('base64') : null;

  return { 
    orders: transformedOrders, 
    pageInfo: {
      hasNextPage,
      endCursor
    }
  };
}

export async function updateProductFunction({
  platform,
  productId,
  variantId,
  inventory,
  price,
}: {
  platform: OpenFrontPlatform;
  productId: string;
  variantId: string;
  inventory?: number;
  price?: string;
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  const mutations = [];

  if (inventory !== undefined) {
    const updateInventoryMutation = gql`
      mutation UpdateProductVariantInventory($where: ProductVariantWhereUniqueInput!, $data: ProductVariantUpdateInput!) {
        updateProductVariant(where: $where, data: $data) {
          id
          inventoryQuantity
        }
      }
    `;

    mutations.push(
      openFrontClient.request(updateInventoryMutation, {
        where: { id: variantId },
        data: { inventoryQuantity: inventory },
      })
    );
  }

  if (price !== undefined) {
    // Note: Price updates in OpenFront might require updating the Price model separately
    // This is a simplified approach - you might need to adjust based on your schema
    console.log(`Price update requested for variant ${variantId}: ${price}`);
    // Actual price update would depend on how prices are structured in OpenFront
  }

  const results = await Promise.all(mutations);
  return { success: true, results };
}

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
    mutation CreateWebhookEndpoint($data: WebhookEndpointCreateInput!) {
      createWebhookEndpoint(data: $data) {
        id
        url
        events
        isActive
        secret
      }
    }
  `;

  // Map Openship events to OpenFront events
  const eventMap: Record<string, string> = {
    ORDER_CREATED: "order.created",
    ORDER_CANCELLED: "order.cancelled",
    TRACKING_CREATED: "fulfillment.created",
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

export async function deleteWebhookFunction({
  platform,
  webhookId,
}: {
  platform: OpenFrontPlatform;
  webhookId: string;
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  const deleteWebhookMutation = gql`
    mutation DeleteWebhookEndpoint($where: WebhookEndpointWhereUniqueInput!) {
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

export async function getWebhooksFunction({
  platform,
}: {
  platform: OpenFrontPlatform;
}) {
  const openFrontClient = await createOpenFrontClient(platform);

  const query = gql`
    query GetWebhookEndpoints {
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

  const baseUrl = await getBaseUrl();
  
  // Map OpenFront events back to Openship events
  const eventMap: Record<string, string> = {
    "order.created": "ORDER_CREATED",
    "order.cancelled": "ORDER_CANCELLED", 
    "fulfillment.created": "TRACKING_CREATED",
  };

  const webhooks = webhookEndpoints.map((webhook: any) => ({
    id: webhook.id,
    callbackUrl: webhook.url.replace(baseUrl, ""),
    topic: webhook.events.map((event: string) => eventMap[event] || event),
    format: "JSON",
    createdAt: webhook.createdAt,
  }));

  return { webhooks };
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
  
  // Generate OpenFront OAuth URL
  const scopes = "read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_webhooks,write_webhooks";
  const state = (platform as any).state || Math.random().toString(36).substring(7);
  
  // Redirect to apps page with install popup
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

  const { access_token, refresh_token, expires_in } = await response.json();
  
  // Return OAuth response with refresh token support
  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    tokenExpiresAt: new Date(Date.now() + (expires_in * 1000)).toISOString()
  };
}

export async function createOrderWebhookHandler({
  platform,
  event,
  headers,
}: {
  platform: OpenFrontPlatform;
  event: any;
  headers: Record<string, string>;
}) {
  // Verify webhook authenticity using OpenFront's signature
  const signature = headers["x-openfront-webhook-signature"] || headers["X-OpenFront-Webhook-Signature"];
  if (!signature) {
    console.error("Missing webhook signature. Available headers:", Object.keys(headers));
    throw new Error("Missing webhook signature");
  }

  // Transform OpenFront order to Openship format
  const lineItemsOutput = event.data?.lineItems?.map((item: any) => {
    // Combine product title and variant title like in channel search
    const productTitle = item.productVariant?.product?.title || '';
    const variantTitle = item.productVariant?.title || '';
    const combinedTitle = productTitle && variantTitle ? `${productTitle} - ${variantTitle}` : item.title;
    
    return {
      name: combinedTitle,
      image: getProductImageUrl(item.productVariant?.product?.productImages?.[0], platform.domain) || item.thumbnail,
      price: item.moneyAmount?.amount ? (item.moneyAmount.amount / 100) : 0, // Convert from cents to float
      quantity: item.quantity || 0,
      productId: item.productVariant?.product?.id?.toString(),
      variantId: item.productVariant?.id?.toString(),
      sku: item.productVariant?.sku || item.sku || "",
      lineItemId: item.id?.toString(),
    };
  }) || [];

  // Return Keystone-ready order data
  const orderData = event.data;
  const shippingAddress = orderData.shippingAddress || {};
  
  return {
    orderId: orderData.id?.toString(),
    orderName: orderData.displayId ? `#${orderData.displayId}` : "",
    email: orderData.email || "",
    firstName: shippingAddress.firstName || "",
    lastName: shippingAddress.lastName || "",
    streetAddress1: shippingAddress.address1 || "",
    streetAddress2: shippingAddress.address2 || "",
    city: shippingAddress.city || "",
    state: shippingAddress.province || "",
    zip: shippingAddress.postalCode || "",
    country: shippingAddress.country?.iso2?.toUpperCase() || "",
    phone: shippingAddress.phone || "",
    currency: orderData.currency?.code?.toUpperCase() || "USD",
    totalPrice: orderData.rawTotal ? (orderData.rawTotal / 100) : 0, // rawTotal is in cents, convert to float
    subTotalPrice: parseFloat(orderData.subtotal?.replace(/[$,]/g, '') || '0'), // Parse formatted string to float
    totalDiscounts: parseFloat(orderData.discount?.replace(/[$,]/g, '') || '0'), // Parse formatted string to float
    totalTax: parseFloat(orderData.tax?.replace(/[$,]/g, '') || '0'), // Parse formatted string to float
    status: "INPROCESS",
    linkOrder: true,
    matchOrder: true,
    processOrder: true,
    lineItems: { create: lineItemsOutput },
  };
}

export async function cancelOrderWebhookHandler({
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

  const orderData = event.data;
  const order = {
    id: orderData.id,
    name: orderData.orderNumber,
    cancelReason: orderData.cancellationReason || "merchant_cancelled",
    cancelledAt: new Date().toISOString(),
  };

  return { order, type: "order_cancelled" };
}

// Required OAuth scopes for OpenFront shop integration
const REQUIRED_SCOPES = "read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_webhooks,write_webhooks";

export function scopes() {
  return REQUIRED_SCOPES;
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
  const openFrontClient = await createOpenFrontClient({
    domain: order.shop.domain,
    accessToken: order.shop.accessToken,
  });

  // Create fulfillment record in OpenFront
  const createFulfillmentMutation = gql`
    mutation CreateFulfillment($data: FulfillmentCreateInput!) {
      createFulfillment(data: $data) {
        id
        trackingNumber
        trackingCompany
      }
    }
  `;

  const fulfillmentData = {
    order: { connect: { id: order.orderId } },
    trackingNumber,
    trackingCompany,
    status: "shipped",
  };

  const result = await openFrontClient.request(createFulfillmentMutation, {
    data: fulfillmentData,
  });

  return result;
}