"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __glob = (map) => (path) => {
  var fn = map[path];
  if (fn) return fn();
  throw new Error("Module not found in bundle: " + path);
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// features/integrations/channel/shopify.ts
var shopify_exports = {};
__export(shopify_exports, {
  cancelPurchaseWebhookHandler: () => cancelPurchaseWebhookHandler,
  createPurchaseFunction: () => createPurchaseFunction,
  createTrackingWebhookHandler: () => createTrackingWebhookHandler,
  createWebhookFunction: () => createWebhookFunction,
  deleteWebhookFunction: () => deleteWebhookFunction,
  getProductFunction: () => getProductFunction,
  getWebhooksFunction: () => getWebhooksFunction,
  oAuthCallbackFunction: () => oAuthCallbackFunction,
  oAuthFunction: () => oAuthFunction,
  searchProductsFunction: () => searchProductsFunction
});
async function searchProductsFunction({
  platform,
  searchEntry,
  after
}) {
  const shopifyClient = new import_graphql_request.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const gqlQuery = import_graphql_request.gql`
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
  const result = await shopifyClient.request(gqlQuery, {
    query: searchEntry,
    after
  });
  const { productVariants } = result;
  if (productVariants.edges.length < 1) {
    throw new Error("No products found from Shopify channel");
  }
  const products = productVariants.edges.map(({ node, cursor }) => ({
    image: node.image?.originalSrc || node.product.images.edges[0]?.node.originalSrc,
    title: `${node.product.title} - ${node.title}`,
    productId: node.product.id.split("/").pop(),
    variantId: node.id.split("/").pop(),
    price: node.price,
    availableForSale: node.availableForSale,
    inventory: node.inventoryQuantity,
    inventoryTracked: node.inventoryPolicy !== "deny",
    productLink: `https://${platform.domain}/products/${node.product.handle}`,
    cursor
  }));
  return {
    products,
    pageInfo: productVariants.pageInfo
  };
}
async function getProductFunction({
  platform,
  productId,
  variantId
}) {
  console.log("CHANNEL getProductFunction called with:", { platform: platform.domain, productId, variantId });
  const shopifyClient = new import_graphql_request.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const gqlQuery = import_graphql_request.gql`
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
  const variantResult = await shopifyClient.request(gqlQuery, {
    variantId: fullVariantId
  });
  const { productVariant } = variantResult;
  console.log("CHANNEL productVariant result:", productVariant);
  if (!productVariant) {
    throw new Error("Product not found from Shopify channel");
  }
  const product = {
    image: productVariant.image?.originalSrc || productVariant.product.images.edges[0]?.node.originalSrc,
    title: `${productVariant.product.title} - ${productVariant.title}`,
    productId: productVariant.product.id.split("/").pop(),
    variantId: productVariant.id.split("/").pop(),
    price: productVariant.price,
    availableForSale: productVariant.availableForSale,
    inventory: productVariant.inventoryQuantity,
    inventoryTracked: productVariant.inventoryPolicy !== "deny",
    productLink: `https://${platform.domain}/products/${productVariant.product.handle}`
  };
  return { product };
}
async function createPurchaseFunction({
  platform,
  cartItems,
  shipping,
  notes
}) {
  const shopifyClient = new import_graphql_request.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const mutation = import_graphql_request.gql`
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
  const lineItems = cartItems.map((item) => ({
    variantId: `gid://shopify/ProductVariant/${item.variantId}`,
    quantity: item.quantity,
    originalUnitPrice: item.price
  }));
  const input = {
    lineItems,
    note: notes
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
      phone: shipping.phone
    };
  }
  const result = await shopifyClient.request(mutation, { input });
  if (result.draftOrderCreate.userErrors.length > 0) {
    throw new Error(`Failed to create purchase: ${result.draftOrderCreate.userErrors.map((e) => e.message).join(", ")}`);
  }
  const draftOrder = result.draftOrderCreate.draftOrder;
  const completeMutation = import_graphql_request.gql`
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
    id: draftOrder.id
  });
  if (completeResult.draftOrderComplete.userErrors.length > 0) {
    throw new Error(`Failed to complete purchase: ${completeResult.draftOrderComplete.userErrors.map((e) => e.message).join(", ")}`);
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
      variantId: node.variant.id.split("/").pop()
    })),
    status: "pending"
  };
}
async function createWebhookFunction({
  platform,
  endpoint,
  events
}) {
  const mapTopic = {
    ORDER_CREATED: "ORDERS_CREATE",
    ORDER_CANCELLED: "ORDERS_CANCELLED",
    ORDER_CHARGEBACKED: "DISPUTES_CREATE",
    TRACKING_CREATED: "FULFILLMENTS_CREATE"
  };
  const shopifyClient = new import_graphql_request.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const webhooks = [];
  for (const event of events) {
    const shopifyTopic = mapTopic[event] || event;
    const mutation = import_graphql_request.gql`
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
        format: "JSON"
      }
    });
    webhooks.push(result.webhookSubscriptionCreate.webhookSubscription);
  }
  return { webhooks };
}
async function deleteWebhookFunction({
  platform,
  webhookId
}) {
  const shopifyClient = new import_graphql_request.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const mutation = import_graphql_request.gql`
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
    id: `gid://shopify/WebhookSubscription/${webhookId}`
  });
  return result.webhookSubscriptionDelete;
}
async function getWebhooksFunction({
  platform
}) {
  const mapTopic = {
    ORDERS_CREATE: "ORDER_CREATED",
    ORDERS_CANCELLED: "ORDER_CANCELLED",
    DISPUTES_CREATE: "ORDER_CHARGEBACKED",
    FULFILLMENTS_CREATE: "TRACKING_CREATED"
  };
  const shopifyClient = new import_graphql_request.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const query = import_graphql_request.gql`
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
  const webhooksResult = await shopifyClient.request(query);
  const { webhookSubscriptions } = webhooksResult;
  const webhooks = webhookSubscriptions.edges.map(({ node }) => ({
    id: node.id.split("/").pop(),
    callbackUrl: node.endpoint.callbackUrl,
    topic: mapTopic[node.topic] || node.topic,
    format: node.format,
    createdAt: node.createdAt
  }));
  return { webhooks };
}
async function oAuthFunction({
  platform,
  callbackUrl
}) {
  const scopes = "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory";
  const shopifyAuthUrl = `https://${platform.domain}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_APP_KEY}&scope=${scopes}&redirect_uri=${callbackUrl}&state=${Math.random().toString(36).substring(7)}`;
  return { authUrl: shopifyAuthUrl };
}
async function oAuthCallbackFunction({
  platform,
  code,
  shop,
  state
}) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_APP_KEY,
      client_secret: process.env.SHOPIFY_APP_SECRET,
      code
    })
  });
  if (!response.ok) {
    throw new Error("Failed to exchange OAuth code for access token");
  }
  const { access_token } = await response.json();
  return {
    accessToken: access_token,
    domain: shop
  };
}
async function createTrackingWebhookHandler({
  platform,
  event,
  headers: headers2
}) {
  const hmac = headers2["x-shopify-hmac-sha256"];
  if (!hmac) {
    throw new Error("Missing webhook HMAC");
  }
  const fulfillment = {
    id: event.id,
    orderId: event.order_id,
    status: event.status,
    trackingCompany: event.tracking_company,
    trackingNumber: event.tracking_number,
    trackingUrl: event.tracking_url,
    purchaseId: event.order_id?.toString(),
    // Use order ID as purchaseId
    lineItems: event.line_items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      variantId: item.variant_id,
      productId: item.product_id
    })),
    createdAt: event.created_at,
    updatedAt: event.updated_at
  };
  return { fulfillment, type: "fulfillment_created" };
}
async function cancelPurchaseWebhookHandler({
  platform,
  event,
  headers: headers2
}) {
  const hmac = headers2["x-shopify-hmac-sha256"];
  if (!hmac) {
    throw new Error("Missing webhook HMAC");
  }
  const order = {
    id: event.id,
    name: event.name,
    cancelReason: event.cancel_reason,
    cancelledAt: event.cancelled_at,
    refund: event.refunds?.[0] || null
  };
  return { order, type: "purchase_cancelled" };
}
var import_graphql_request;
var init_shopify = __esm({
  "features/integrations/channel/shopify.ts"() {
    "use strict";
    import_graphql_request = require("graphql-request");
  }
});

// import("../**/*.ts") in features/integrations/channel/lib/executor.ts
var globImport_ts;
var init_ = __esm({
  'import("../**/*.ts") in features/integrations/channel/lib/executor.ts'() {
    globImport_ts = __glob({
      "../lib/executor.ts": () => Promise.resolve().then(() => (init_executor(), executor_exports)),
      "../shopify.ts": () => Promise.resolve().then(() => (init_shopify(), shopify_exports))
    });
  }
});

// features/integrations/channel/lib/executor.ts
var executor_exports = {};
__export(executor_exports, {
  createChannelPurchase: () => createChannelPurchase,
  createChannelWebhook: () => createChannelWebhook,
  deleteChannelWebhook: () => deleteChannelWebhook,
  executeChannelAdapterFunction: () => executeChannelAdapterFunction,
  getChannelProduct: () => getChannelProduct,
  getChannelWebhooks: () => getChannelWebhooks,
  handleChannelCancelWebhook: () => handleChannelCancelWebhook,
  handleChannelOAuth: () => handleChannelOAuth,
  handleChannelOAuthCallback: () => handleChannelOAuthCallback,
  handleChannelTrackingWebhook: () => handleChannelTrackingWebhook,
  searchChannelProducts: () => searchChannelProducts
});
async function executeChannelAdapterFunction({ platform, functionName, args }) {
  const functionPath = platform[functionName];
  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  const adapter = await globImport_ts(`../${functionPath}.ts`);
  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`
    );
  }
  try {
    return await fn({ platform, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for platform ${functionPath}: ${error.message}`
    );
  }
}
async function searchChannelProducts({ platform, searchEntry, after }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after }
  });
}
async function getChannelProduct({ platform, productId }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "getProductFunction",
    args: { productId }
  });
}
async function createChannelPurchase({ platform, cartItems, shipping, notes }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createPurchaseFunction",
    args: { cartItems, shipping, notes }
  });
}
async function createChannelWebhook({ platform, endpoint, events }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events }
  });
}
async function deleteChannelWebhook({ platform, webhookId }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId }
  });
}
async function getChannelWebhooks({ platform }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "getWebhooksFunction",
    args: {}
  });
}
async function handleChannelOAuth({ platform, callbackUrl }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "oAuthFunction",
    args: { callbackUrl }
  });
}
async function handleChannelOAuthCallback({ platform, code, shop, state, appKey, appSecret, redirectUri }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "oAuthCallbackFunction",
    args: { code, shop, state, appKey, appSecret, redirectUri }
  });
}
async function handleChannelTrackingWebhook({ platform, event, headers: headers2 }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "createTrackingWebhookHandler",
    args: { event, headers: headers2 }
  });
}
async function handleChannelCancelWebhook({ platform, event, headers: headers2 }) {
  return executeChannelAdapterFunction({
    platform,
    functionName: "cancelPurchaseWebhookHandler",
    args: { event, headers: headers2 }
  });
}
var init_executor = __esm({
  "features/integrations/channel/lib/executor.ts"() {
    "use strict";
    init_();
  }
});

// features/integrations/shop/shopify.ts
var shopify_exports2 = {};
__export(shopify_exports2, {
  addTrackingFunction: () => addTrackingFunction,
  cancelOrderWebhookHandler: () => cancelOrderWebhookHandler,
  createOrderWebhookHandler: () => createOrderWebhookHandler,
  createWebhookFunction: () => createWebhookFunction2,
  deleteWebhookFunction: () => deleteWebhookFunction2,
  getProductFunction: () => getProductFunction2,
  getWebhooksFunction: () => getWebhooksFunction2,
  oAuthCallbackFunction: () => oAuthCallbackFunction2,
  oAuthFunction: () => oAuthFunction2,
  searchOrdersFunction: () => searchOrdersFunction,
  searchProductsFunction: () => searchProductsFunction2,
  updateProductFunction: () => updateProductFunction
});
async function searchProductsFunction2({
  platform,
  searchEntry,
  after
}) {
  const shopifyClient = new import_graphql_request2.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const gqlQuery = import_graphql_request2.gql`
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
    after
  });
  if (productVariants.edges.length < 1) {
    throw new Error("No products found from Shopify");
  }
  const products = productVariants.edges.map(({ node, cursor }) => ({
    image: node.image?.originalSrc || node.product.images.edges[0]?.node.originalSrc,
    title: `${node.product.title} - ${node.title}`,
    productId: node.product.id.split("/").pop(),
    variantId: node.id.split("/").pop(),
    price: node.price,
    availableForSale: node.availableForSale,
    inventory: node.inventoryQuantity,
    inventoryTracked: node.inventoryPolicy !== "deny",
    productLink: `https://${platform.domain}/products/${node.product.handle}`,
    cursor
  }));
  return {
    products,
    pageInfo: productVariants.pageInfo
  };
}
async function getProductFunction2({
  platform,
  productId,
  variantId
}) {
  console.log("SHOP getProductFunction called with:", { platform: platform.domain, productId, variantId });
  const shopifyClient = new import_graphql_request2.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const gqlQuery = import_graphql_request2.gql`
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
    variantId: fullVariantId
  });
  console.log("SHOP productVariant result:", productVariant);
  if (!productVariant) {
    throw new Error("Product not found from Shopify");
  }
  const product = {
    image: productVariant.image?.originalSrc || productVariant.product.images.edges[0]?.node.originalSrc,
    title: `${productVariant.product.title} - ${productVariant.title}`,
    productId: productVariant.product.id.split("/").pop(),
    variantId: productVariant.id.split("/").pop(),
    price: productVariant.price,
    availableForSale: productVariant.availableForSale,
    inventory: productVariant.inventoryQuantity,
    inventoryTracked: productVariant.inventoryPolicy !== "deny",
    productLink: `https://${platform.domain}/admin/products/${productVariant.product.id.split("/").pop()}/variants/${productVariant.id.split("/").pop()}`
  };
  return { product };
}
async function searchOrdersFunction({
  platform,
  searchEntry,
  after
}) {
  const shopifyClient = new import_graphql_request2.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const gqlQuery = import_graphql_request2.gql`
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
    after
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
      sku: lineItem.variant?.sku || ""
    })),
    cartItems: [],
    // Would be populated if this order has cart items
    fulfillments: [],
    // Would need to be fetched if needed
    note: "",
    cursor
  }));
  return {
    orders: formattedOrders,
    pageInfo: orders.pageInfo
  };
}
async function updateProductFunction({
  platform,
  productId,
  variantId,
  inventory,
  price
}) {
  const shopifyClient = new import_graphql_request2.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const mutations = [];
  if (price !== void 0) {
    const updatePriceMutation = import_graphql_request2.gql`
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
          price
        }
      })
    );
  }
  if (inventory !== void 0) {
    try {
      const getVariantWithInventoryQuery = import_graphql_request2.gql`
        query GetVariantWithInventory($id: ID!) {
          productVariant(id: $id) {
            inventoryQuantity
            inventoryItem {
              id
            }
          }
        }
      `;
      console.log("QUERYING FOR VARIANT ID:", variantId);
      console.log("FULL GID:", `gid://shopify/ProductVariant/${variantId}`);
      const variantData = await shopifyClient.request(getVariantWithInventoryQuery, {
        id: `gid://shopify/ProductVariant/${variantId}`
      });
      console.log("VARIANT DATA RECEIVED:", JSON.stringify(variantData, null, 2));
      if (!variantData.productVariant?.inventoryItem?.id) {
        console.log("FAILING BECAUSE NO inventoryItem.id");
        console.log("variantData structure:", variantData);
        console.log("productVariant:", variantData.productVariant);
        console.log("inventoryItem:", variantData.productVariant?.inventoryItem);
        throw new Error("Unable to find inventory item for variant");
      }
      const getLocationsQuery = import_graphql_request2.gql`
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
      const inventoryDelta = inventory;
      const updateInventoryMutation = import_graphql_request2.gql`
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
async function createWebhookFunction2({
  platform,
  endpoint,
  events
}) {
  const mapTopic = {
    ORDER_CREATED: "ORDERS_CREATE",
    ORDER_CANCELLED: "ORDERS_CANCELLED",
    ORDER_CHARGEBACKED: "DISPUTES_CREATE",
    TRACKING_CREATED: "FULFILLMENTS_CREATE"
  };
  if (!platform.domain) {
    throw new Error("Missing domain in platform configuration");
  }
  if (!platform.accessToken) {
    throw new Error("Missing accessToken in platform configuration");
  }
  const shopifyClient = new import_graphql_request2.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const webhooks = [];
  for (const event of events) {
    const shopifyTopic = mapTopic[event] || event;
    const mutation = import_graphql_request2.gql`
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
          format: "JSON"
        }
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
  const webhookId = webhooks[0]?.id?.split("/").pop();
  return { webhooks, webhookId };
}
async function deleteWebhookFunction2({
  platform,
  webhookId
}) {
  const shopifyClient = new import_graphql_request2.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const mutation = import_graphql_request2.gql`
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
    id: `gid://shopify/WebhookSubscription/${webhookId}`
  });
  return result.webhookSubscriptionDelete;
}
async function getWebhooksFunction2({
  platform
}) {
  const mapTopic = {
    ORDERS_CREATE: "ORDER_CREATED",
    ORDERS_CANCELLED: "ORDER_CANCELLED",
    DISPUTES_CREATE: "ORDER_CHARGEBACKED",
    FULFILLMENTS_CREATE: "TRACKING_CREATED"
  };
  const shopifyClient = new import_graphql_request2.GraphQLClient(
    `https://${platform.domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": platform.accessToken
      }
    }
  );
  const query = import_graphql_request2.gql`
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
  const baseUrl = await (0, import_getBaseUrl.getBaseUrl)();
  const webhooks = webhookSubscriptions.edges.map(({ node }) => ({
    id: node.id.split("/").pop(),
    callbackUrl: node.endpoint.callbackUrl.replace(baseUrl, ""),
    topic: mapTopic[node.topic] || node.topic,
    format: node.format,
    createdAt: node.createdAt
  }));
  return { webhooks };
}
async function oAuthFunction2({
  platform,
  callbackUrl
}) {
  const scopes = "read_products,write_products,read_orders,write_orders,read_inventory,write_inventory";
  const shopifyAuthUrl = `https://${platform.domain}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_APP_KEY}&scope=${scopes}&redirect_uri=${callbackUrl}&state=${Math.random().toString(36).substring(7)}`;
  return { authUrl: shopifyAuthUrl };
}
async function oAuthCallbackFunction2({
  platform,
  code,
  shop,
  state
}) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_APP_KEY,
      client_secret: process.env.SHOPIFY_APP_SECRET,
      code
    })
  });
  if (!response.ok) {
    throw new Error("Failed to exchange OAuth code for access token");
  }
  const { access_token } = await response.json();
  return {
    accessToken: access_token,
    domain: shop
  };
}
async function createOrderWebhookHandler({
  platform,
  event,
  headers: headers2
}) {
  const hmac = headers2["x-shopify-hmac-sha256"];
  if (!hmac) {
    throw new Error("Missing webhook HMAC");
  }
  const lineItemsOutput = await Promise.all(
    event.line_items.map(async (item) => {
      let image = null;
      try {
        const shopifyClient = new import_graphql_request2.GraphQLClient(
          `https://${platform.domain}/admin/api/graphql.json`,
          {
            headers: {
              "X-Shopify-Access-Token": platform.accessToken
            }
          }
        );
        const variantQuery = import_graphql_request2.gql`
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
          id: `gid://shopify/ProductVariant/${item.variant_id}`
        });
        image = result.productVariant?.image?.originalSrc || result.productVariant?.product?.images?.edges?.[0]?.node?.originalSrc || null;
      } catch (error) {
        console.warn(`Failed to fetch image for variant ${item.variant_id}:`, error instanceof Error ? error.message : "Unknown error");
      }
      return {
        name: item.title,
        image,
        price: parseFloat(item.price),
        quantity: item.quantity,
        productId: item.product_id?.toString(),
        variantId: item.variant_id?.toString(),
        sku: item.sku || "",
        lineItemId: item.id?.toString()
      };
    })
  );
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
    lineItems: { create: lineItemsOutput }
  };
}
async function addTrackingFunction({
  order,
  trackingCompany,
  trackingNumber
}) {
  const FETCH_FULFILLMENT_ORDER = import_graphql_request2.gql`
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
  const UPDATE_FULFILLMENT_TRACKING_INFO = import_graphql_request2.gql`
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
  const CREATE_FULFILLMENT = import_graphql_request2.gql`
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
  const client = new import_graphql_request2.GraphQLClient(
    `https://${order.shop.domain}/admin/api/graphql.json`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": order.shop.accessToken
      }
    }
  );
  const data = await client.request(FETCH_FULFILLMENT_ORDER, {
    id: `gid://shopify/Order/${order.orderId}`
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
              ...fulfillment.trackingInfo.map(({ number }) => number)
            ]
          }
        }
      );
      return updateResponseBody;
    }
  }
  const createResponseBody = await client.request(CREATE_FULFILLMENT, {
    fulfillment: {
      lineItemsByFulfillmentOrder: [
        {
          fulfillmentOrderId: fulfillmentOrder.id
        }
      ],
      trackingInfo: {
        company: trackingCompany,
        numbers: [trackingNumber]
      }
    }
  });
  return createResponseBody;
}
async function cancelOrderWebhookHandler({
  platform,
  event,
  headers: headers2
}) {
  const hmac = headers2["x-shopify-hmac-sha256"];
  if (!hmac) {
    throw new Error("Missing webhook HMAC");
  }
  const order = {
    id: event.id,
    name: event.name,
    cancelReason: event.cancel_reason,
    cancelledAt: event.cancelled_at
  };
  return { order, type: "order_cancelled" };
}
var import_graphql_request2, import_getBaseUrl;
var init_shopify2 = __esm({
  "features/integrations/shop/shopify.ts"() {
    "use strict";
    import_graphql_request2 = require("graphql-request");
    import_getBaseUrl = require("@/features/dashboard/lib/getBaseUrl");
  }
});

// import("../**/*.ts") in features/integrations/shop/lib/executor.ts
var globImport_ts2;
var init_2 = __esm({
  'import("../**/*.ts") in features/integrations/shop/lib/executor.ts'() {
    globImport_ts2 = __glob({
      "../lib/executor.ts": () => Promise.resolve().then(() => (init_executor2(), executor_exports2)),
      "../shopify.ts": () => Promise.resolve().then(() => (init_shopify2(), shopify_exports2))
    });
  }
});

// features/integrations/shop/lib/executor.ts
var executor_exports2 = {};
__export(executor_exports2, {
  addCartToPlatformOrder: () => addCartToPlatformOrder,
  addShopTracking: () => addShopTracking,
  createShopWebhook: () => createShopWebhook,
  deleteShopWebhook: () => deleteShopWebhook,
  executeShopAdapterFunction: () => executeShopAdapterFunction,
  getShopProduct: () => getShopProduct,
  getShopWebhooks: () => getShopWebhooks,
  handleShopCancelWebhook: () => handleShopCancelWebhook,
  handleShopOAuth: () => handleShopOAuth,
  handleShopOAuthCallback: () => handleShopOAuthCallback,
  handleShopOrderWebhook: () => handleShopOrderWebhook,
  searchShopOrders: () => searchShopOrders,
  searchShopProducts: () => searchShopProducts,
  updateShopProduct: () => updateShopProduct
});
async function executeShopAdapterFunction({ platform, functionName, args }) {
  const functionPath = platform[functionName];
  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  const adapter = await globImport_ts2(`../${functionPath}.ts`);
  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`
    );
  }
  try {
    return await fn({ platform, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for platform ${functionPath}: ${error.message}`
    );
  }
}
async function searchShopProducts({ platform, searchEntry, after }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after }
  });
}
async function getShopProduct({ platform, productId }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getProductFunction",
    args: { productId }
  });
}
async function searchShopOrders({ platform, searchEntry, after }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "searchOrdersFunction",
    args: { searchEntry, after }
  });
}
async function updateShopProduct({ platform, productId, inventory, price }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "updateProductFunction",
    args: { productId, inventory, price }
  });
}
async function addCartToPlatformOrder({ platform, cartItems, orderId }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "addCartToPlatformOrderFunction",
    args: { cartItems, orderId }
  });
}
async function createShopWebhook({ platform, endpoint, events }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events }
  });
}
async function deleteShopWebhook({ platform, webhookId }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId }
  });
}
async function getShopWebhooks({ platform }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getWebhooksFunction",
    args: {}
  });
}
async function handleShopOAuth({ platform, callbackUrl }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "oAuthFunction",
    args: { callbackUrl }
  });
}
async function handleShopOAuthCallback({ platform, code, shop, state, appKey, appSecret, redirectUri }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "oAuthCallbackFunction",
    args: { code, shop, state, appKey, appSecret, redirectUri }
  });
}
async function handleShopOrderWebhook({ platform, event, headers: headers2 }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "createOrderWebhookHandler",
    args: { event, headers: headers2 }
  });
}
async function handleShopCancelWebhook({ platform, event, headers: headers2 }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "cancelOrderWebhookHandler",
    args: { event, headers: headers2 }
  });
}
async function addShopTracking({ platform, order, trackingCompany, trackingNumber }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "addTrackingFunction",
    args: { order, trackingCompany, trackingNumber }
  });
}
var init_executor2 = __esm({
  "features/integrations/shop/lib/executor.ts"() {
    "use strict";
    init_2();
  }
});

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default2
});
module.exports = __toCommonJS(keystone_exports);

// features/keystone/index.ts
var import_auth = require("@keystone-6/auth");
var import_core20 = require("@keystone-6/core");
var import_config = require("dotenv/config");

// features/keystone/models/User.ts
var import_core = require("@keystone-6/core");
var import_fields2 = require("@keystone-6/core/fields");

// features/keystone/access.ts
var isSignedIn = ({ session }) => {
  return Boolean(session);
};
var permissions = {
  // Basic Dashboard Permissions
  canSeeOtherUsers: ({ session }) => Boolean(session?.data.role?.canSeeOtherUsers),
  canEditOtherUsers: ({ session }) => Boolean(session?.data.role?.canEditOtherUsers),
  canManageUsers: ({ session }) => Boolean(session?.data.role?.canManageUsers),
  canManageRoles: ({ session }) => Boolean(session?.data.role?.canManageRoles),
  canAccessDashboard: ({ session }) => Boolean(session?.data.role?.canAccessDashboard),
  // E-commerce Platform Permissions
  // Shop Management
  canSeeOtherShops: ({ session }) => Boolean(session?.data.role?.canSeeOtherShops),
  canManageShops: ({ session }) => Boolean(session?.data.role?.canManageShops),
  canCreateShops: ({ session }) => Boolean(session?.data.role?.canCreateShops),
  // Channel Management
  canSeeOtherChannels: ({ session }) => Boolean(session?.data.role?.canSeeOtherChannels),
  canManageChannels: ({ session }) => Boolean(session?.data.role?.canManageChannels),
  canCreateChannels: ({ session }) => Boolean(session?.data.role?.canCreateChannels),
  canUpdateChannels: ({ session }) => Boolean(session?.data.role?.canManageChannels),
  // Order Management
  canSeeOtherOrders: ({ session }) => Boolean(session?.data.role?.canSeeOtherOrders),
  canManageOrders: ({ session }) => Boolean(session?.data.role?.canManageOrders),
  canProcessOrders: ({ session }) => Boolean(session?.data.role?.canProcessOrders),
  // Product & Inventory Management
  canSeeOtherMatches: ({ session }) => Boolean(session?.data.role?.canSeeOtherMatches),
  canManageMatches: ({ session }) => Boolean(session?.data.role?.canManageMatches),
  canCreateMatches: ({ session }) => Boolean(session?.data.role?.canCreateMatches),
  // Linking System
  canSeeOtherLinks: ({ session }) => Boolean(session?.data.role?.canSeeOtherLinks),
  canManageLinks: ({ session }) => Boolean(session?.data.role?.canManageLinks),
  canCreateLinks: ({ session }) => Boolean(session?.data.role?.canCreateLinks),
  // Platform Integration
  canManagePlatforms: ({ session }) => Boolean(session?.data.role?.canManagePlatforms),
  canViewPlatformMetrics: ({ session }) => Boolean(session?.data.role?.canViewPlatformMetrics),
  // API Key Management
  canManageApiKeys: ({ session }) => Boolean(session?.data.role?.canManageApiKeys),
  canCreateApiKeys: ({ session }) => Boolean(session?.data.role?.canCreateApiKeys),
  // Advanced Features
  canAccessAnalytics: ({ session }) => Boolean(session?.data.role?.canAccessAnalytics),
  canExportData: ({ session }) => Boolean(session?.data.role?.canExportData),
  canManageWebhooks: ({ session }) => Boolean(session?.data.role?.canManageWebhooks)
};
var rules = {
  // User Rules
  canReadPeople: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canSeeOtherUsers) return true;
    return { id: { equals: session.itemId } };
  },
  canUpdatePeople: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canEditOtherUsers) return true;
    return { id: { equals: session.itemId } };
  },
  // E-commerce Multi-tenant Rules
  // Shop Rules - users can only access their own shops unless they have permission
  canReadShops: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canSeeOtherShops) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  canManageShops: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageShops) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  // Channel Rules
  canReadChannels: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canSeeOtherChannels) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  canManageChannels: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageChannels) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  canUpdateChannels: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageChannels) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  // Order Rules
  canReadOrders: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canSeeOtherOrders) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  canManageOrders: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageOrders) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  // Match Rules (Product Matching)
  canReadMatches: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canSeeOtherMatches) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  canUpdateMatches: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageMatches) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  canManageMatches: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageMatches) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  // Link Rules (Shop-Channel Linking)
  canReadLinks: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canSeeOtherLinks) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  canManageLinks: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageLinks) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  // API Key Rules
  canReadApiKeys: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageApiKeys) return true;
    return { user: { id: { equals: session.itemId } } };
  },
  canManageApiKeys: ({ session }) => {
    if (!session) return false;
    if (session.data.role?.canManageApiKeys) return true;
    return { user: { id: { equals: session.itemId } } };
  }
};
var itemRules = {
  canUpdateUser: ({ session, item }) => {
    if (!session) return false;
    if (session.data.role?.canEditOtherUsers) return true;
    return session.itemId === item.id;
  },
  canDeleteUser: ({ session }) => {
    if (!session) return false;
    return Boolean(session.data.role?.canManageUsers);
  }
};
var fieldRules = {
  canReadUserPassword: () => false,
  // Never allow reading passwords
  canUpdateUserPassword: ({ session, item }) => {
    if (!session) return false;
    if (session.data.role?.canManageUsers) return true;
    return session.itemId === item?.id;
  },
  canManageUserRole: ({ session }) => {
    if (!session) return false;
    return Boolean(session.data.role?.canManageUsers);
  }
};

// features/keystone/models/trackingFields.ts
var import_fields = require("@keystone-6/core/fields");
var trackingFields = {
  createdAt: (0, import_fields.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" }
    },
    hooks: {
      resolveInput: ({ context, operation, resolvedData }) => {
        if (operation === "create") return /* @__PURE__ */ new Date();
        return resolvedData.createdAt;
      }
    }
  }),
  updatedAt: (0, import_fields.timestamp)({
    access: { read: () => true, create: () => false, update: () => false },
    // db: { updatedAt: true },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" }
    },
    hooks: {
      resolveInput: ({ context, operation, resolvedData }) => {
        if (operation === "update") return /* @__PURE__ */ new Date();
        return resolvedData.updatedAt;
      }
    }
  })
};

// features/keystone/models/User.ts
var User = (0, import_core.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageUsers,
      update: isSignedIn,
      delete: permissions.canManageUsers
    },
    filter: {
      query: rules.canReadPeople,
      update: rules.canUpdatePeople,
      delete: rules.canUpdatePeople
    },
    item: {
      update: itemRules.canUpdateUser,
      delete: itemRules.canDeleteUser
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManageUsers({ session: args.session, context: args.context, listKey: "User", operation: "create" }),
    hideDelete: (args) => !permissions.canManageUsers({ session: args.session, context: args.context, listKey: "User", operation: "delete" }),
    listView: {
      initialColumns: ["name", "email", "role", "shops", "channels"]
    },
    itemView: {
      defaultFieldMode: ({ session, item }) => {
        if (session?.data.role?.canEditOtherUsers) return "edit";
        if (session?.itemId === item?.id) return "edit";
        return "read";
      }
    }
  },
  fields: {
    name: (0, import_fields2.text)({
      validation: {
        isRequired: true
      }
    }),
    email: (0, import_fields2.text)({
      isFilterable: false,
      isOrderable: false,
      isIndexed: "unique",
      validation: {
        isRequired: true
      }
    }),
    password: (0, import_fields2.password)({
      access: {
        read: fieldRules.canReadUserPassword,
        update: fieldRules.canUpdateUserPassword
      },
      validation: { isRequired: true }
    }),
    role: (0, import_fields2.relationship)({
      ref: "Role.assignedTo",
      access: {
        create: fieldRules.canManageUserRole,
        update: fieldRules.canManageUserRole
      },
      ui: {
        itemView: {
          fieldMode: (args) => permissions.canManageUsers({ session: args.session, context: args.context, listKey: "User", operation: "update" }) ? "edit" : "read"
        }
      }
    }),
    // E-commerce Platform Management Relationships
    shops: (0, import_fields2.relationship)({
      ref: "Shop.user",
      many: true
    }),
    channels: (0, import_fields2.relationship)({
      ref: "Channel.user",
      many: true
    }),
    orders: (0, import_fields2.relationship)({
      ref: "Order.user",
      many: true
    }),
    lineItems: (0, import_fields2.relationship)({
      ref: "LineItem.user",
      many: true
    }),
    cartItems: (0, import_fields2.relationship)({
      ref: "CartItem.user",
      many: true
    }),
    shopItems: (0, import_fields2.relationship)({
      ref: "ShopItem.user",
      many: true
    }),
    channelItems: (0, import_fields2.relationship)({
      ref: "ChannelItem.user",
      many: true
    }),
    matches: (0, import_fields2.relationship)({
      ref: "Match.user",
      many: true
    }),
    links: (0, import_fields2.relationship)({
      ref: "Link.user",
      many: true
    }),
    trackingDetails: (0, import_fields2.relationship)({
      ref: "TrackingDetail.user",
      many: true
    }),
    shopPlatforms: (0, import_fields2.relationship)({
      ref: "ShopPlatform.user",
      many: true
    }),
    channelPlatforms: (0, import_fields2.relationship)({
      ref: "ChannelPlatform.user",
      many: true
    }),
    apiKeys: (0, import_fields2.relationship)({
      ref: "ApiKey.user",
      many: true
    }),
    ...trackingFields
  }
});

// features/keystone/models/ApiKey.ts
var import_fields3 = require("@keystone-6/core/fields");
var import_core2 = require("@keystone-6/core");
var ApiKey = (0, import_core2.list)({
  hooks: {
    beforeOperation: async ({
      listKey,
      operation,
      inputData,
      item,
      resolvedData,
      context
    }) => {
      if (operation === "create") {
        const existingKeys = await context.query.ApiKey.findMany({
          where: { user: { id: { equals: context.session.itemId } } }
        });
        if (existingKeys.length > 0) {
          await context.query.ApiKey.deleteMany({
            where: existingKeys.map((key) => ({ id: key.id }))
          });
        }
      }
    }
  },
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateApiKeys,
      update: isSignedIn,
      delete: isSignedIn
    },
    filter: {
      query: rules.canReadApiKeys,
      update: rules.canManageApiKeys,
      delete: rules.canManageApiKeys
    }
  },
  fields: {
    user: (0, import_fields3.relationship)({
      ref: "User.apiKeys",
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if (operation === "create" && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/Role.ts
var import_fields5 = require("@keystone-6/core/fields");
var import_core3 = require("@keystone-6/core");

// features/keystone/models/fields.ts
var import_fields4 = require("@keystone-6/core/fields");
var permissionFields = {
  canSeeOtherUsers: (0, import_fields4.checkbox)({
    label: "User can query other users"
  }),
  canEditOtherUsers: (0, import_fields4.checkbox)({
    label: "User can edit other users"
  }),
  canManageUsers: (0, import_fields4.checkbox)({
    label: "User can CRUD users"
  }),
  canManageRoles: (0, import_fields4.checkbox)({
    label: "User can CRUD roles"
  }),
  canAccessDashboard: (0, import_fields4.checkbox)({
    label: "User can access the dashboard"
  }),
  canSeeOtherShops: (0, import_fields4.checkbox)({
    label: "User can query other shops"
  }),
  canManageShops: (0, import_fields4.checkbox)({
    label: "User can CRUD shops"
  }),
  canCreateShops: (0, import_fields4.checkbox)({
    label: "User can create shops"
  }),
  canSeeOtherChannels: (0, import_fields4.checkbox)({
    label: "User can query other channels"
  }),
  canManageChannels: (0, import_fields4.checkbox)({
    label: "User can CRUD channels"
  }),
  canCreateChannels: (0, import_fields4.checkbox)({
    label: "User can create channels"
  }),
  canSeeOtherOrders: (0, import_fields4.checkbox)({
    label: "User can query other orders"
  }),
  canManageOrders: (0, import_fields4.checkbox)({
    label: "User can CRUD orders"
  }),
  canProcessOrders: (0, import_fields4.checkbox)({
    label: "User can process orders"
  }),
  canSeeOtherMatches: (0, import_fields4.checkbox)({
    label: "User can query other matches"
  }),
  canManageMatches: (0, import_fields4.checkbox)({
    label: "User can CRUD matches"
  }),
  canCreateMatches: (0, import_fields4.checkbox)({
    label: "User can create matches"
  }),
  canSeeOtherLinks: (0, import_fields4.checkbox)({
    label: "User can query other links"
  }),
  canManageLinks: (0, import_fields4.checkbox)({
    label: "User can CRUD links"
  }),
  canCreateLinks: (0, import_fields4.checkbox)({
    label: "User can create links"
  }),
  canManagePlatforms: (0, import_fields4.checkbox)({
    label: "User can manage platforms"
  }),
  canViewPlatformMetrics: (0, import_fields4.checkbox)({
    label: "User can view platform metrics"
  }),
  canManageApiKeys: (0, import_fields4.checkbox)({
    label: "User can manage API keys"
  }),
  canCreateApiKeys: (0, import_fields4.checkbox)({
    label: "User can create API keys"
  }),
  canAccessAnalytics: (0, import_fields4.checkbox)({
    label: "User can access analytics"
  }),
  canExportData: (0, import_fields4.checkbox)({
    label: "User can export data"
  }),
  canManageWebhooks: (0, import_fields4.checkbox)({
    label: "User can manage webhooks"
  })
};
var permissionsList = Object.keys(
  permissionFields
);

// features/keystone/models/Role.ts
var Role = (0, import_core3.list)({
  /*
      SPEC
      - [x] Block all public access
      - [x] Restrict edit access based on canManageRoles
      - [ ] Prevent users from deleting their own role
      - [ ] Add a pre-save hook that ensures some permissions are selected when others are:
          - [ ] when canEditOtherUsers is true, canSeeOtherUsers must be true
          - [ ] when canManageUsers is true, canEditOtherUsers and canSeeOtherUsers must be true
      - [ ] Extend the Admin UI with client-side validation based on the same set of rules
    */
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageRoles,
      update: permissions.canManageRoles,
      delete: permissions.canManageRoles
    }
  },
  ui: {
    hideCreate: (args) => !permissions.canManageRoles({ session: args.session, context: args.context, listKey: "Role", operation: "create" }),
    hideDelete: (args) => !permissions.canManageRoles({ session: args.session, context: args.context, listKey: "Role", operation: "delete" }),
    listView: {
      initialColumns: ["name", "assignedTo"]
    },
    itemView: {
      defaultFieldMode: (args) => permissions.canManageRoles({ session: args.session, context: args.context, listKey: "Role", operation: "update" }) ? "edit" : "read"
    }
  },
  fields: {
    /* The name of the role */
    name: (0, import_fields5.text)({ validation: { isRequired: true } }),
    ...permissionFields,
    assignedTo: (0, import_fields5.relationship)({
      ref: "User.role",
      many: true,
      ui: {
        itemView: { fieldMode: "read" }
      }
    })
  }
});

// features/keystone/models/Order.ts
var import_core4 = require("@keystone-6/core");
var import_fields7 = require("@keystone-6/core/fields");

// import("../../integrations/channel/**/*.ts") in features/keystone/utils/channelProviderAdapter.ts
var globImport_integrations_channel_ts = __glob({
  "../../integrations/channel/lib/executor.ts": () => Promise.resolve().then(() => (init_executor(), executor_exports)),
  "../../integrations/channel/shopify.ts": () => Promise.resolve().then(() => (init_shopify(), shopify_exports))
});

// features/keystone/utils/channelProviderAdapter.ts
async function executeChannelAdapterFunction2({
  platform,
  functionName,
  args
}) {
  const functionPath = platform[functionName];
  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    return response.json();
  }
  const adapter = await globImport_integrations_channel_ts(`../../integrations/channel/${functionPath}.ts`);
  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`
    );
  }
  try {
    return await fn({ platform, ...args });
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for platform ${functionPath}: ${error.message}`
    );
  }
}
async function searchChannelProducts2({
  platform,
  searchEntry,
  after
}) {
  return executeChannelAdapterFunction2({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after }
  });
}
async function getChannelProduct2({
  platform,
  productId,
  variantId
}) {
  return executeChannelAdapterFunction2({
    platform,
    functionName: "getProductFunction",
    args: { productId, variantId }
  });
}
async function createChannelPurchase2({
  platform,
  cartItems,
  shipping,
  notes
}) {
  return executeChannelAdapterFunction2({
    platform,
    functionName: "createPurchaseFunction",
    args: { cartItems, shipping, notes }
  });
}
async function createChannelWebhook2({
  platform,
  endpoint,
  events
}) {
  return executeChannelAdapterFunction2({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events }
  });
}
async function deleteChannelWebhook2({
  platform,
  webhookId
}) {
  return executeChannelAdapterFunction2({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId }
  });
}
async function getChannelWebhooks2({ platform }) {
  return executeChannelAdapterFunction2({
    platform,
    functionName: "getWebhooksFunction",
    args: {}
  });
}

// import("../../integrations/shop/**/*.ts") in features/keystone/utils/shopProviderAdapter.ts
var globImport_integrations_shop_ts = __glob({
  "../../integrations/shop/lib/executor.ts": () => Promise.resolve().then(() => (init_executor2(), executor_exports2)),
  "../../integrations/shop/shopify.ts": () => Promise.resolve().then(() => (init_shopify2(), shopify_exports2))
});

// features/keystone/utils/shopProviderAdapter.ts
async function executeShopAdapterFunction2({ platform, functionName, args }) {
  const functionPath = platform[functionName];
  if (functionPath.startsWith("http")) {
    const response = await fetch(functionPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, ...args })
    });
    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
  }
  const adapter = await globImport_integrations_shop_ts(`../../integrations/shop/${functionPath}.ts`);
  const fn = adapter[functionName];
  if (!fn) {
    throw new Error(
      `Function ${functionName} not found in adapter ${functionPath}`
    );
  }
  try {
    const result = await fn({ platform, ...args });
    return result;
  } catch (error) {
    throw new Error(
      `Error executing ${functionName} for platform ${functionPath}: ${error?.message || "Unknown error"}`
    );
  }
}
async function searchShopProducts2({ platform, searchEntry, after }) {
  return executeShopAdapterFunction2({
    platform,
    functionName: "searchProductsFunction",
    args: { searchEntry, after }
  });
}
async function getShopProduct2({ platform, productId, variantId }) {
  return executeShopAdapterFunction2({
    platform,
    functionName: "getProductFunction",
    args: { productId, variantId }
  });
}
async function searchShopOrders2({ platform, searchEntry, after }) {
  return executeShopAdapterFunction2({
    platform,
    functionName: "searchOrdersFunction",
    args: { searchEntry, after }
  });
}
async function updateShopProduct2({ platform, productId, variantId, inventory, price }) {
  return executeShopAdapterFunction2({
    platform,
    functionName: "updateProductFunction",
    args: { productId, variantId, inventory, price }
  });
}
async function addCartToPlatformOrder2({ platform, cartItems, orderId }) {
  return executeShopAdapterFunction2({
    platform,
    functionName: "addCartToPlatformOrderFunction",
    args: { cartItems, orderId }
  });
}
async function createShopWebhook2({ platform, endpoint, events }) {
  return executeShopAdapterFunction2({
    platform,
    functionName: "createWebhookFunction",
    args: { endpoint, events }
  });
}
async function deleteShopWebhook2({ platform, webhookId }) {
  return executeShopAdapterFunction2({
    platform,
    functionName: "deleteWebhookFunction",
    args: { webhookId }
  });
}
async function getShopWebhooks2({ platform }) {
  return executeShopAdapterFunction2({
    platform,
    functionName: "getWebhooksFunction",
    args: {}
  });
}

// features/keystone/lib/placeMultipleOrders.ts
async function updateCartItems({
  query,
  cartItems,
  url = "",
  error = "",
  purchaseId = ""
}) {
  const update = [];
  for (const { id } of cartItems) {
    const res = await query.CartItem.updateOne({
      where: {
        id
      },
      data: {
        url,
        error,
        purchaseId
      }
    });
    update.push(res);
  }
  return update;
}
async function placeMultipleOrders({ ids, query }) {
  const processed = [];
  for (const orderId of ids) {
    const {
      firstName,
      lastName,
      streetAddress1,
      streetAddress2,
      city,
      state,
      zip,
      country,
      phone,
      user,
      shop,
      orderId: shopOrderId,
      orderName
    } = await query.Order.findOne({
      where: {
        id: orderId
      },
      query: `
        firstName,
        lastName,
        streetAddress1,
        streetAddress2,
        city,
        state,
        zip,
        country,
        phone
        shop {
          domain
          accessToken
          platform {
            addCartToPlatformOrderFunction
          }
        }
        orderId
        orderName
        user {
          email
        }
      `
    });
    const cartChannels = await query.Channel.findMany({
      query: `
      domain
      accessToken
      cartItems(
        where: {
          order: { id: { equals: "${orderId}" }}
          purchaseId: { equals: "" }
          url: { equals: "" }
        }
      ) {
        id
        productId
        variantId
        sku
        name
        quantity
        price
      } 
      platform {
        createPurchaseFunction
      }
      metadata
      `
    });
    for (const {
      domain,
      accessToken,
      cartItems,
      platform,
      metadata
    } of cartChannels.filter((channel) => channel.cartItems.length > 0)) {
      const body = {
        domain,
        accessToken,
        cartItems,
        address: {
          firstName,
          lastName,
          streetAddress1,
          streetAddress2,
          city,
          state,
          zip,
          country,
          phone
        },
        email: user.email,
        orderName,
        orderId,
        shopOrderId,
        metadata
      };
      const platformConfig = {
        domain,
        accessToken,
        createPurchaseFunction: platform.createPurchaseFunction,
        ...metadata
      };
      try {
        const orderPlacementRes = await createChannelPurchase2({
          platform: platformConfig,
          cartItems,
          shipping: {
            firstName,
            lastName,
            address1: streetAddress1,
            address2: streetAddress2,
            city,
            province: state,
            zip,
            country,
            phone,
            email: user.email
          },
          notes: ""
        });
        if (orderPlacementRes.error) {
          await updateCartItems({
            cartItems,
            error: `ORDER_PLACEMENT_ERROR: ${orderPlacementRes.error}`,
            query
          });
        }
        if (orderPlacementRes.purchaseId) {
          await updateCartItems({
            cartItems,
            url: orderPlacementRes.url,
            purchaseId: orderPlacementRes.purchaseId,
            query
          });
        }
      } catch (error) {
        await updateCartItems({
          cartItems,
          error: `ORDER_PLACEMENT_ERROR: ${error.message || "Error on order placement. Order may have been placed."}`,
          query
        });
      }
      const cartCount = await query.CartItem.count({
        where: {
          order: {
            id: { equals: orderId }
          },
          url: { equals: "" },
          purchaseId: { equals: "" }
        }
      });
      if (cartCount === 0) {
        const updatedOrder = await query.Order.updateOne({
          where: { id: orderId },
          data: {
            status: "AWAITING"
          },
          query: `
            id
            orderId
            cartItems {
              id,
              name,
              quantity,
              price,
              image,
              productId,
              variantId,
              sku,
              purchaseId,
              lineItemId,
              channel {
                id
                name
              },
              url,
              error,
            }
            shop {
              platform {
                addCartToPlatformOrderFunction
              }
            }
          `
        });
        try {
          await addCartToPlatformOrder2({
            platform: updatedOrder.shop.platform,
            cartItems: updatedOrder.cartItems,
            orderId: updatedOrder.orderId
          });
        } catch (error) {
          console.warn(
            "Warning: Add cart to platform order function failed:",
            error.message
          );
        }
        processed.push(updatedOrder);
      } else {
        const updatedOrder = await query.Order.updateOne({
          where: { id: orderId },
          data: {
            status: "PENDING"
          },
          query: `
            orderId
            cartItems {
              channel {
                id
              }
              image
              price
              id
              quantity
              productId
              variantId
              sku
            }
          `
        });
        processed.push(updatedOrder);
      }
    }
  }
  return processed;
}

// features/keystone/extendGraphqlSchema/mutations/addMatchToCart.ts
init_executor();
async function getMatches({ orderId, context }) {
  async function createCartItems({ matches }) {
    if (matches.length > 0) {
      let result;
      for (const existingMatch of matches) {
        for (const {
          channel,
          productId,
          variantId,
          price: matchPrice,
          id,
          user,
          ...rest
        } of existingMatch.output) {
          const platformData = {
            ...channel.platform,
            domain: channel.domain,
            accessToken: channel.accessToken
          };
          const productResult = await executeChannelAdapterFunction({
            platform: platformData,
            functionName: "getProductFunction",
            args: { productId, variantId }
          });
          const product = productResult.product;
          const currentPriceStr = String(product.price || "");
          const savedPriceStr = String(matchPrice || "");
          const hasPriceChange = currentPriceStr !== savedPriceStr;
          const priceValue = currentPriceStr;
          result = await context.query.CartItem.createOne({
            data: {
              price: priceValue,
              productId,
              variantId,
              image: product.image,
              name: product.title,
              order: { connect: { id: order.id } },
              channel: { connect: { id: channel.id } },
              ...hasPriceChange && {
                error: `PRICE_CHANGE: Price changed: ${savedPriceStr} \u2192 ${currentPriceStr}. Verify before placing order.`
              },
              user: { connect: { id: user.id } },
              ...rest
            }
          });
        }
      }
      return result;
    }
  }
  const order = await context.query.Order.findOne({
    where: {
      id: orderId
    },
    query: `
    id
    user {
      id
    } 
    lineItems {
      image
      price
      id
      quantity
      productId
      variantId
      lineItemId
    }`
  });
  if (!order) {
    throw new Error("Order not found");
  }
  const allMatches = await context.query.Match.findMany({
    where: {
      user: {
        id: { equals: order.user.id }
      },
      AND: order.lineItems.map(({ productId, variantId, quantity }) => ({
        input: {
          some: {
            productId: { equals: productId },
            variantId: { equals: variantId },
            quantity: { equals: quantity }
          }
        }
      }))
    },
    query: ` 
      inputCount
      outputCount
      input {
        id
        quantity
        productId
        variantId
        shop {
          id
        }
        user {
          id
        }
      }
      output {
        id
        quantity
        productId
        variantId
        price
        channel {
          id
          domain
          accessToken
          platform {
            id
            getProductFunction
          }
        }
        user {
          id
        }
      }
    `
  });
  const [filt] = allMatches.filter(
    ({ inputCount }) => inputCount === order.lineItems.length
  );
  if (filt) {
    return await createCartItems({ matches: [filt] });
  } else {
    if (order.lineItems.length > 1) {
      const output = await Promise.all(
        order.lineItems.map(async ({ quantity, variantId, productId }) => {
          const singleAllMatches = await context.query.Match.findMany({
            where: {
              user: {
                id: { equals: order.user.id }
              },
              AND: [
                {
                  input: {
                    every: {
                      productId: { equals: productId },
                      variantId: { equals: variantId },
                      quantity: { equals: quantity }
                    }
                  }
                }
              ]
            },
            query: `
            input {
              id
              quantity
              productId
              variantId
              shop {
                id
              }
            }
            output {
              id
              quantity
              productId
              variantId
              price
              channel {
                id
                domain
                accessToken
                platform {
                  id
                  getProductFunction
                }
              }
              user {
                id
              }
            }
          `
          });
          const [singleFilt] = singleAllMatches;
          if (singleFilt) {
            return singleFilt;
          }
          await context.query.Order.updateOne({
            where: { id: orderId },
            data: {
              error: "MATCH_ERROR: Some lineItems not matched",
              status: "PENDING"
            }
          });
        })
      );
      if (output.filter((value) => value !== void 0).length) {
        return await createCartItems({ matches: output });
      }
    } else {
      await context.query.Order.updateOne({
        where: { id: orderId },
        data: {
          error: "MATCH_ERROR: No matches found"
        }
      });
    }
  }
}
async function addMatchToCart(root, { orderId }, context) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be logged in to do this!");
  }
  const cartItemsFromMatch = await getMatches({
    orderId,
    context
  });
  if (cartItemsFromMatch) {
    return await context.db.Order.findOne({
      where: { id: orderId }
    });
  } else {
    throw new Error("No Matches found");
  }
}
var addMatchToCart_default = addMatchToCart;

// features/keystone/models/Order.ts
async function applyDynamicWhereClause(context, linkId, orderId) {
  const link = await context.query.Link.findOne({
    where: { id: linkId },
    query: "id dynamicWhereClause"
  });
  if (!link || !link.dynamicWhereClause) {
    return null;
  }
  const whereClause = {
    ...link.dynamicWhereClause,
    id: { equals: orderId }
  };
  const matchedOrder = await context.query.Order.findOne({
    where: whereClause,
    query: "id"
  });
  return matchedOrder;
}
var Order = (0, import_core4.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageOrders
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canManageOrders,
      delete: rules.canManageOrders
    }
  },
  hooks: {
    resolveInput: {
      create: ({ operation, resolvedData, context }) => {
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } }
          };
        }
        return resolvedData;
      }
    },
    afterOperation: async ({ operation, item, context }) => {
      if (operation === "create") {
        const sudoContext = context.sudo();
        const order = await sudoContext.query.Order.findOne({
          where: { id: item.id },
          query: `
            id
            user {
              id
            }
            shop {
              id
              name
              linkMode
              links {
                id
                rank
                channel {
                  id
                  name
                }
              }
            }
            lineItems {
              name
              price
              lineItemId
              quantity
              image
              productId
              variantId
              sku
            }
            cartItemsCount
          `
        });
        if (item.linkOrder && order.shop?.links.length > 0) {
          const links = order.shop.links.sort((a, b) => a.rank - b.rank);
          let matchedLinks = [];
          if (order.shop.linkMode === "sequential") {
            for (const link of links) {
              const matchedOrder = await applyDynamicWhereClause(sudoContext, link.id, order.id);
              if (matchedOrder) {
                matchedLinks.push(link);
                break;
              }
            }
          } else if (order.shop.linkMode === "simultaneous") {
            for (const link of links) {
              const matchedOrder = await applyDynamicWhereClause(sudoContext, link.id, order.id);
              if (matchedOrder) {
                matchedLinks.push(link);
              }
            }
          }
          if (matchedLinks.length > 0) {
            for (const link of matchedLinks) {
              await sudoContext.query.CartItem.createMany({
                data: order.lineItems.map((c) => ({
                  ...c,
                  channel: { connect: { id: link.channel.id } },
                  order: { connect: { id: item.id } },
                  user: { connect: { id: order.user?.id } }
                }))
              });
            }
            if (item.processOrder) {
              await placeMultipleOrders({
                ids: [item.id],
                query: sudoContext.query
              });
            }
          } else {
            await sudoContext.query.Order.updateOne({
              where: { id: item.id },
              data: {
                error: "No matching link found for this order"
              }
            });
          }
        } else if (item.matchOrder) {
          if (item.matchOrder) {
            try {
              const cartItemsFromMatch = await getMatches({
                orderId: item.id,
                context: sudoContext
              });
              const order2 = await sudoContext.query.Order.findOne({
                where: { id: item.id },
                query: `id error`
              });
              if (order2?.error) {
                const updatedOrder = await sudoContext.query.Order.updateOne({
                  where: { id: item.id },
                  data: {
                    status: "PENDING"
                  }
                });
              } else {
                if (item.processOrder) {
                  const processedOrder = await placeMultipleOrders({
                    ids: [item.id],
                    query: sudoContext.query
                  });
                }
              }
            } catch (matchError) {
              console.error("Error during match processing:", matchError);
              await sudoContext.query.Order.updateOne({
                where: { id: item.id },
                data: {
                  error: `Match processing failed: ${matchError instanceof Error ? matchError.message : "Unknown error"}`,
                  status: "PENDING"
                }
              });
            }
          }
        } else if (order.cartItemsCount > 0 && item.processOrder) {
          const processedOrder = await placeMultipleOrders({
            ids: [item.id],
            query: sudoContext.query
          });
        }
      }
    }
  },
  ui: {
    listView: {
      initialColumns: ["orderId", "orderName", "email", "totalPrice", "shop"]
    }
  },
  fields: {
    // Order identifiers
    orderId: (0, import_fields7.text)({
      isIndexed: "unique",
      validation: { isRequired: true }
    }),
    orderName: (0, import_fields7.text)(),
    email: (0, import_fields7.text)(),
    // Customer information
    firstName: (0, import_fields7.text)(),
    lastName: (0, import_fields7.text)(),
    streetAddress1: (0, import_fields7.text)(),
    streetAddress2: (0, import_fields7.text)(),
    city: (0, import_fields7.text)(),
    state: (0, import_fields7.text)(),
    zip: (0, import_fields7.text)(),
    country: (0, import_fields7.text)(),
    phone: (0, import_fields7.text)(),
    // Pricing
    currency: (0, import_fields7.text)(),
    totalPrice: (0, import_fields7.float)(),
    subTotalPrice: (0, import_fields7.float)(),
    totalDiscounts: (0, import_fields7.float)(),
    totalTax: (0, import_fields7.float)(),
    // Processing flags
    linkOrder: (0, import_fields7.checkbox)({ defaultValue: true }),
    matchOrder: (0, import_fields7.checkbox)({ defaultValue: true }),
    processOrder: (0, import_fields7.checkbox)({ defaultValue: true }),
    // Status tracking
    status: (0, import_fields7.text)({ defaultValue: "PENDING" }),
    error: (0, import_fields7.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    // Metadata
    orderMetadata: (0, import_fields7.json)(),
    // Relationships
    shop: (0, import_fields7.relationship)({
      ref: "Shop.orders",
      ui: {
        displayMode: "cards",
        cardFields: ["name", "domain"],
        inlineCreate: { fields: ["name", "domain"] },
        inlineEdit: { fields: ["name", "domain"] }
      }
    }),
    lineItems: (0, import_fields7.relationship)({
      ref: "LineItem.order",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "quantity", "price"],
        inlineCreate: { fields: ["name", "quantity", "price"] },
        inlineEdit: { fields: ["name", "quantity", "price"] }
      }
    }),
    cartItems: (0, import_fields7.relationship)({
      ref: "CartItem.order",
      many: true
    }),
    user: (0, import_fields7.relationship)({
      ref: "User.orders"
    }),
    ...trackingFields
  }
});

// features/keystone/models/TrackingDetail.ts
var import_core5 = require("@keystone-6/core");
var import_fields8 = require("@keystone-6/core/fields");
var TrackingDetail = (0, import_core5.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageOrders
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canManageOrders,
      delete: rules.canManageOrders
    }
  },
  hooks: {
    resolveInput: {
      create: ({ operation, resolvedData, context }) => {
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } }
          };
        }
        return resolvedData;
      }
    },
    afterOperation: async ({ operation, item, context }) => {
      if (operation === "create") {
        const sudoContext = context.sudo();
        const foundTracking = await sudoContext.query.TrackingDetail.findOne({
          where: { id: String(item.id) },
          query: `
            id
            trackingNumber
            trackingCompany
            purchaseId
            cartItems {
              id
              purchaseId
              order {
                id
                orderName
                orderId
                status
                shop {
                  id
                  domain
                  accessToken
                  platform {
                    id
                    name
                    addTrackingFunction
                  }
                }
              }
            }
          `
        });
        if (!foundTracking?.cartItems?.length) {
          return;
        }
        const firstCartItem = foundTracking.cartItems[0];
        const order = firstCartItem.order;
        if (order.shop?.platform?.addTrackingFunction) {
          try {
            const { addShopTracking: addShopTracking2 } = await Promise.resolve().then(() => (init_executor2(), executor_exports2));
            await addShopTracking2({
              platform: {
                ...order.shop.platform,
                domain: order.shop.domain,
                accessToken: order.shop.accessToken
              },
              order,
              trackingCompany: foundTracking.trackingCompany,
              trackingNumber: foundTracking.trackingNumber
            });
          } catch (error) {
            console.error("Error calling addTracking:", error);
          }
        }
        const foundOrder = await sudoContext.query.Order.findOne({
          where: { id: order.id },
          query: `
            id
            orderName
            status
            cartItems(
              where: {
                AND: [
                  { trackingDetails: { none: {} } },
                  { status: { not: { equals: "CANCELLED" } } }
                ]
              }
            ) {
              id
              status
            }
          `
        });
        if (foundOrder && foundOrder.cartItems.length === 0 && foundOrder.status === "AWAITING") {
          await sudoContext.query.Order.updateOne({
            where: { id: foundOrder.id },
            data: {
              status: "COMPLETE"
            }
          });
        }
      }
    }
  },
  ui: {
    listView: {
      initialColumns: ["trackingCompany", "trackingNumber", "purchaseId"]
    }
  },
  fields: {
    // Tracking information
    trackingCompany: (0, import_fields8.text)({
      validation: { isRequired: true }
    }),
    trackingNumber: (0, import_fields8.text)({
      validation: { isRequired: true }
    }),
    purchaseId: (0, import_fields8.text)(),
    // Relationships
    cartItems: (0, import_fields8.relationship)({
      ref: "CartItem.trackingDetails",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["name", "quantity", "status"]
      }
    }),
    user: (0, import_fields8.relationship)({
      ref: "User.trackingDetails"
    }),
    ...trackingFields
  }
});

// features/keystone/models/LineItem.ts
var import_core6 = require("@keystone-6/core");
var import_fields9 = require("@keystone-6/core/fields");
var LineItem = (0, import_core6.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageOrders
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canManageOrders,
      delete: rules.canManageOrders
    }
  },
  hooks: {
    resolveInput: {
      create: ({ operation, resolvedData, context }) => {
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } }
          };
        }
        return resolvedData;
      }
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "quantity", "price", "order"]
    }
  },
  fields: {
    // Product information
    name: (0, import_fields9.text)({
      validation: { isRequired: true }
    }),
    image: (0, import_fields9.text)(),
    price: (0, import_fields9.float)(),
    quantity: (0, import_fields9.integer)(),
    // Product identifiers
    productId: (0, import_fields9.text)(),
    variantId: (0, import_fields9.text)(),
    sku: (0, import_fields9.text)(),
    lineItemId: (0, import_fields9.text)(),
    // Relationships
    order: (0, import_fields9.relationship)({
      ref: "Order.lineItems",
      ui: {
        displayMode: "cards",
        cardFields: ["orderId", "orderName"]
      }
    }),
    user: (0, import_fields9.relationship)({
      ref: "User.lineItems"
    }),
    ...trackingFields
  }
});

// features/keystone/models/CartItem.ts
var import_core7 = require("@keystone-6/core");
var import_fields10 = require("@keystone-6/core/fields");
var CartItem = (0, import_core7.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageOrders
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canManageOrders,
      delete: rules.canManageOrders
    }
  },
  hooks: {
    resolveInput: {
      create: ({ operation, resolvedData, context }) => {
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } }
          };
        }
        return resolvedData;
      }
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "quantity", "price", "status", "channel"]
    }
  },
  fields: {
    // Product information
    name: (0, import_fields10.text)({
      validation: { isRequired: true }
    }),
    image: (0, import_fields10.text)(),
    price: (0, import_fields10.text)(),
    quantity: (0, import_fields10.integer)(),
    // Product identifiers
    productId: (0, import_fields10.text)(),
    variantId: (0, import_fields10.text)(),
    sku: (0, import_fields10.text)(),
    lineItemId: (0, import_fields10.text)(),
    // Processing information
    url: (0, import_fields10.text)(),
    error: (0, import_fields10.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    purchaseId: (0, import_fields10.text)(),
    status: (0, import_fields10.text)({ defaultValue: "PENDING" }),
    // Relationships
    order: (0, import_fields10.relationship)({
      ref: "Order.cartItems",
      ui: {
        displayMode: "cards",
        cardFields: ["orderId", "orderName"]
      }
    }),
    channel: (0, import_fields10.relationship)({
      ref: "Channel.cartItems",
      ui: {
        displayMode: "cards",
        cardFields: ["name", "domain"]
      }
    }),
    trackingDetails: (0, import_fields10.relationship)({
      ref: "TrackingDetail.cartItems",
      many: true
    }),
    user: (0, import_fields10.relationship)({
      ref: "User.cartItems"
    }),
    ...trackingFields
  }
});

// features/keystone/models/Channel.ts
var import_core8 = require("@keystone-6/core");
var import_fields11 = require("@keystone-6/core/fields");
var import_core9 = require("@keystone-6/core");
var Channel = (0, import_core8.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateChannels,
      update: isSignedIn,
      delete: permissions.canManageChannels
    },
    filter: {
      query: rules.canReadChannels,
      update: rules.canManageChannels,
      delete: rules.canManageChannels
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "domain", "platform"]
    }
  },
  fields: {
    name: (0, import_fields11.text)({
      validation: { isRequired: true }
    }),
    domain: (0, import_fields11.text)(),
    accessToken: (0, import_fields11.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    metadata: (0, import_fields11.json)({
      defaultValue: {}
    }),
    // Relationships
    platform: (0, import_fields11.relationship)({
      ref: "ChannelPlatform.channels"
    }),
    user: (0, import_fields11.relationship)({
      ref: "User.channels",
      hooks: {
        resolveInput: ({ operation, resolvedData, context }) => {
          if (operation === "create" && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    links: (0, import_fields11.relationship)({
      ref: "Link.channel",
      many: true
    }),
    channelItems: (0, import_fields11.relationship)({
      ref: "ChannelItem.channel",
      many: true
    }),
    cartItems: (0, import_fields11.relationship)({
      ref: "CartItem.channel",
      many: true
    }),
    // Virtual field for webhooks with proper base URL
    webhooks: (0, import_fields11.virtual)({
      field: import_core9.graphql.field({
        type: import_core9.graphql.JSON,
        async resolve(item, args, context) {
          try {
            const recommendedWebhooks = [
              {
                callbackUrl: `/api/handlers/channel/cancel-purchase/${item.id}`,
                topic: "ORDER_CANCELLED",
                description: "When a purchase order is cancelled by this channel, enabling this will notify Openship to mark the cart item as cancelled and move the order to PENDING for reprocessing."
              },
              {
                callbackUrl: `/api/handlers/channel/create-tracking/${item.id}`,
                topic: "TRACKING_CREATED",
                description: "When a purchase order is fulfilled by this channel, enabling this will notify Openship to add the tracking to the order and shop."
              }
            ];
            const channelWithPlatform = await context.query.Channel.findOne({
              where: { id: String(item.id) },
              query: "platform { getWebhooksFunction }"
            });
            if (!channelWithPlatform?.platform?.getWebhooksFunction) {
              return {
                success: false,
                error: "Get webhooks function not configured",
                recommendedWebhooks
              };
            }
            const platformConfig = {
              domain: item.domain,
              accessToken: item.accessToken,
              getWebhooksFunction: channelWithPlatform.platform.getWebhooksFunction,
              ...item.metadata || {}
            };
            const webhooksResult = await executeChannelAdapterFunction2({
              platform: platformConfig,
              functionName: "getWebhooksFunction",
              args: {}
            });
            return {
              success: true,
              data: { webhooks: webhooksResult.webhooks || [] },
              recommendedWebhooks
            };
          } catch (error) {
            console.error("Error in webhooks virtual field:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              recommendedWebhooks: [
                {
                  callbackUrl: `/api/handlers/channel/cancel-purchase/${item.id}`,
                  topic: "ORDER_CANCELLED",
                  description: "When a purchase order is cancelled by this channel, enabling this will notify Openship to mark the cart item as cancelled and move the order to PENDING for reprocessing."
                },
                {
                  callbackUrl: `/api/handlers/channel/create-tracking/${item.id}`,
                  topic: "TRACKING_CREATED",
                  description: "When a purchase order is fulfilled by this channel, enabling this will notify Openship to add the tracking to the order and shop."
                }
              ]
            };
          }
        }
      })
    }),
    ...trackingFields
  }
});

// features/keystone/models/ChannelItem.ts
var import_fields12 = require("@keystone-6/core/fields");
var import_core10 = require("@keystone-6/core");

// features/keystone/extendGraphqlSchema/queries/getMatchQuery.ts
async function getMatches2({ inputArray, user, context }) {
  const allMatches = await context.query.Match.findMany({
    where: {
      user: { id: { equals: user.id } },
      AND: inputArray.map(({ productId, variantId, quantity }) => ({
        input: {
          some: {
            productId,
            variantId,
            quantity
          }
        }
      }))
    },
    query: ` 
    id
    inputCount
    outputCount
    input {
      id
      quantity
      productId
      variantId
      shop {
        id
      }
      user {
        id
      }
    }
    output {
      id
      quantity
      productId
      variantId
      price
      channel {
        id
        domain
        accessToken
        name
        platform {
          id
          searchProductsFunction
        }
      }
      user {
        id
      }
    }
  `
  });
  const [filt] = allMatches.filter(
    ({ inputCount }) => inputCount === inputArray.length
  );
  if (filt) {
    return [filt];
  }
  throw new Error("No match found");
}
async function getMatch(root, { input }, context) {
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }
  const existingMatches = await getMatches2({
    inputArray: input,
    user: { id: sesh.itemId },
    context
  });
  const cleanEM = existingMatches.filter((a) => a !== void 0);
  if (cleanEM.length > 0) {
    const output = [];
    for (const existingMatch of cleanEM) {
      for (const {
        channel,
        productId,
        variantId,
        quantity,
        price: matchPrice,
        id,
        userId,
        channelId,
        ...rest
      } of existingMatch.output) {
        const { searchProductsFunction: searchProductsFunction3 } = channel.platform;
        const searchResult = await searchChannelProducts2({
          platform: channel.platform,
          searchEntry: productId,
          after: void 0
        });
        const products = searchResult.products;
        const [productInfo] = products;
        productInfo.name = productInfo.title;
        output.push({ ...productInfo, channelName: channel.name, quantity });
      }
    }
    return output;
  }
}
var getMatchQuery_default = getMatch;

// features/keystone/extendGraphqlSchema/queries/getMatchCount.ts
async function getMatches3({ inputArray, user, context }) {
  const allMatches = await context.query.Match.findMany({
    where: {
      user: { id: { equals: user.id } },
      AND: inputArray.map(({ productId, variantId, quantity }) => ({
        input: {
          some: {
            productId,
            variantId,
            quantity
          }
        }
      }))
    },
    query: ` 
    id
    inputCount
  `
  });
  const filteredValues = allMatches.filter(
    ({ inputCount }) => inputCount === inputArray.length
  );
  return filteredValues.length;
}
async function getMatchCount(root, { input }, context) {
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }
  const existingMatchesCount = await getMatches3({
    inputArray: input,
    user: { id: sesh.itemId },
    context
  });
  return existingMatchesCount;
}
var getMatchCount_default = getMatchCount;

// features/keystone/extendGraphqlSchema/queries/getShopWebhooks.ts
async function getShopWebhooks3(root, { shopId }, context) {
  try {
    const shop = await context.query.Shop.findOne({
      where: { id: shopId },
      query: "id domain accessToken platform { id getWebhooksFunction }"
    });
    if (!shop) {
      throw new Error("Shop not found");
    }
    if (!shop.platform) {
      throw new Error("Platform configuration not specified.");
    }
    const result = await getShopWebhooks2({
      platform: {
        ...shop.platform,
        domain: shop.domain,
        accessToken: shop.accessToken
      }
    });
    return result.webhooks;
  } catch (error) {
    throw new Error(`Error getting shop webhooks: ${error.message}`);
  }
}
var getShopWebhooks_default = getShopWebhooks3;

// features/keystone/extendGraphqlSchema/mutations/redirectToInit.ts
async function redirectToInit(root, { ids }, context) {
  const userCount = await context.sudo().query.User.count({});
  if (userCount === 0) {
    return true;
  }
  return false;
}
var redirectToInit_default = redirectToInit;

// features/keystone/extendGraphqlSchema/queries/searchShopOrders.ts
async function searchShopOrders3(root, { shopId, searchEntry, take = 25, skip = 0, after, status, financialStatus, fulfillmentStatus, dateFrom, dateTo }, context) {
  if (!shopId || typeof shopId !== "string") {
    throw new Error("Valid shop ID is required");
  }
  if (take > 250) {
    throw new Error("Cannot fetch more than 250 orders at once");
  }
  if (take < 1) {
    throw new Error("Take must be at least 1");
  }
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: `
      id 
      domain 
      accessToken 
      metadata
      platform { 
        id 
        name
        searchOrdersFunction 
      }
    `
  });
  if (!shop) {
    throw new Error("Shop not found");
  }
  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }
  if (!shop.platform.searchOrdersFunction) {
    throw new Error("Search orders function not configured.");
  }
  const platformConfig = {
    domain: shop.domain,
    accessToken: shop.accessToken,
    ...shop.metadata
  };
  const filterOptions = {
    searchEntry,
    after,
    take,
    skip,
    // Advanced filtering capabilities
    filters: {
      status: status || void 0,
      financialStatus: financialStatus || void 0,
      fulfillmentStatus: fulfillmentStatus || void 0,
      createdAtMin: dateFrom ? new Date(dateFrom).toISOString() : void 0,
      createdAtMax: dateTo ? new Date(dateTo).toISOString() : void 0
    }
  };
  try {
    const result = await searchShopOrders2({
      platform: {
        ...shop.platform,
        ...platformConfig
      },
      ...filterOptions
    });
    return {
      orders: result.orders || [],
      pageInfo: {
        hasNextPage: result.pageInfo?.hasNextPage || false,
        hasPreviousPage: result.pageInfo?.hasPreviousPage || false,
        startCursor: result.pageInfo?.startCursor || null,
        endCursor: result.pageInfo?.endCursor || null
      },
      totalCount: result.totalCount || null,
      shopInfo: {
        id: shop.id,
        domain: shop.domain,
        platformName: shop.platform.name
      },
      searchMetadata: {
        searchEntry,
        filtersApplied: Object.keys(filterOptions.filters).filter(
          (key) => filterOptions.filters[key] !== void 0
        ),
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
        resultCount: result.orders?.length || 0
      }
    };
  } catch (error) {
    console.error(`Error searching orders for shop ${shop.id}:`, error);
    throw new Error(`Failed to search orders from ${shop.platform.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
var searchShopOrders_default = searchShopOrders3;

// features/keystone/extendGraphqlSchema/queries/searchShopProducts.ts
async function searchShopProductsQuery(root, { shopId, searchEntry, after }, context) {
  const sudoContext = context.sudo();
  const shop = await sudoContext.query.Shop.findOne({
    where: { id: shopId },
    query: `
      id
      domain
      accessToken
      metadata
      platform {
        id
        name
        searchProductsFunction
      }
    `
  });
  if (!shop) {
    throw new Error("Shop not found");
  }
  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }
  if (!shop.platform.searchProductsFunction) {
    throw new Error("Search products function not configured.");
  }
  const platformConfig = {
    domain: shop.domain,
    accessToken: shop.accessToken,
    ...shop.metadata
  };
  try {
    const result = await searchShopProducts2({
      platform: {
        ...shop.platform,
        ...platformConfig
      },
      searchEntry: searchEntry || "",
      after
    });
    return result.products;
  } catch (error) {
    console.error("Error searching shop products:", error);
    throw new Error(`Failed to search products: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
var searchShopProducts_default = searchShopProductsQuery;

// features/keystone/extendGraphqlSchema/queries/searchChannelProducts.ts
async function searchChannelProductsQuery(root, {
  channelId,
  searchEntry,
  after
}, context) {
  console.log("helllooooo");
  const sudoContext = context.sudo();
  const channel = await sudoContext.query.Channel.findOne({
    where: { id: channelId },
    query: `
      id
      domain
      accessToken
      metadata
      platform {
        id
        name
        searchProductsFunction
      }
    `
  });
  if (!channel) {
    throw new Error("Channel not found");
  }
  if (!channel.platform) {
    throw new Error("Platform configuration not specified.");
  }
  if (!channel.platform.searchProductsFunction) {
    throw new Error("Search products function not configured.");
  }
  const platformConfig = {
    domain: channel.domain,
    accessToken: channel.accessToken,
    searchProductsFunction: channel.platform.searchProductsFunction,
    ...channel.metadata
  };
  try {
    const result = await searchChannelProducts2({
      platform: platformConfig,
      searchEntry: searchEntry || "",
      after
    });
    return result.products;
  } catch (error) {
    console.error("Error searching channel products:", error);
    throw new Error(`Failed to search products: ${error.message}`);
  }
}
var searchChannelProducts_default = searchChannelProductsQuery;

// features/keystone/extendGraphqlSchema/queries/getChannelWebhooks.ts
async function getChannelWebhooks3(root, { channelId }, context) {
  try {
    const channel = await context.query.Channel.findOne({
      where: { id: channelId },
      query: "id domain accessToken platform { id getWebhooksFunction }"
    });
    if (!channel) {
      throw new Error("Channel not found");
    }
    if (!channel.platform) {
      throw new Error("Platform configuration not specified.");
    }
    const result = await getChannelWebhooks2({
      platform: channel.platform
    });
    return result.webhooks;
  } catch (error) {
    throw new Error(`Error getting channel webhooks: ${error.message}`);
  }
}
var getChannelWebhooks_default = getChannelWebhooks3;

// features/keystone/extendGraphqlSchema/queries/getFilteredMatches.ts
async function getFilteredMatches(root, args, context) {
  const matches = await context.query.Match.findMany({
    query: `
      id 
      outputPriceChanged
      inventoryNeedsToBeSynced { syncEligible sourceQuantity targetQuantity }
      input { 
        id quantity productId variantId lineItemId 
        externalDetails { title image price productLink inventory inventoryTracked } 
        shop { id name } 
      } 
      output { 
        id quantity productId variantId lineItemId 
        externalDetails { title image price productLink inventory inventoryTracked } 
        price channel { id name } 
      }
    `
  });
  const filteredMatches = matches.filter((match) => match.inventoryNeedsToBeSynced.syncEligible);
  return filteredMatches;
}
var getFilteredMatches_default = getFilteredMatches;

// features/keystone/extendGraphqlSchema/queries/getChannelProduct.ts
async function getChannelProduct3(root, { channelId, productId, variantId }, context) {
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id getProductFunction }"
  });
  if (!channel) {
    throw new Error("Channel not found");
  }
  if (!channel.platform) {
    throw new Error("Platform configuration not specified.");
  }
  const platformConfig = {
    domain: channel.domain,
    accessToken: channel.accessToken,
    getProductFunction: channel.platform.getProductFunction,
    ...channel.metadata
  };
  try {
    const result = await getChannelProduct2({
      platform: platformConfig,
      productId,
      variantId
    });
    return result.product;
  } catch (error) {
    throw new Error(`Failed to get channel product: ${error.message}`);
  }
}
var getChannelProduct_default = getChannelProduct3;

// features/keystone/extendGraphqlSchema/queries/getShopProduct.ts
async function getShopProductQuery(root, { shopId, productId, variantId }, context) {
  if (!shopId || typeof shopId !== "string") {
    throw new Error("Valid shop ID is required");
  }
  if (!productId || typeof productId !== "string") {
    throw new Error("Valid product ID is required");
  }
  const sudoContext = context.sudo();
  const shop = await sudoContext.query.Shop.findOne({
    where: { id: shopId },
    query: `
      id
      domain
      accessToken
      metadata
      platform {
        id
        name
        getProductFunction
      }
    `
  });
  if (!shop) {
    throw new Error("Shop not found");
  }
  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }
  if (!shop.platform.getProductFunction) {
    throw new Error("Get product function not configured.");
  }
  const platformConfig = {
    domain: shop.domain,
    accessToken: shop.accessToken,
    getProductFunction: shop.platform.getProductFunction,
    ...shop.metadata
  };
  try {
    const result = await getShopProduct2({
      platform: platformConfig,
      productId,
      variantId
    });
    const productData = result.product || result;
    return {
      ...productData,
      shopId: shop.id,
      shopDomain: shop.domain,
      platformName: shop.platform.name,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      // Include live inventory levels if available
      inventoryLevel: productData.inventory || null,
      inventoryTracked: productData.inventoryTracked || false,
      // Include pricing information
      price: productData.price || null,
      compareAtPrice: productData.compareAtPrice || null,
      // Include availability
      availableForSale: productData.availableForSale || false
    };
  } catch (error) {
    console.error("Error getting shop product:", error);
    throw new Error(`Failed to get product from ${shop.platform.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
var getShopProduct_default = getShopProductQuery;

// features/keystone/models/ChannelItem.ts
var ChannelItem = (0, import_core10.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    },
    filter: {
      query: rules.canReadMatches,
      update: rules.canUpdateMatches,
      delete: rules.canUpdateMatches
    }
  },
  fields: {
    quantity: (0, import_fields12.integer)(),
    productId: (0, import_fields12.text)(),
    variantId: (0, import_fields12.text)(),
    lineItemId: (0, import_fields12.text)(),
    price: (0, import_fields12.text)(),
    priceChanged: (0, import_fields12.virtual)({
      field: import_core10.graphql.field({
        type: import_core10.graphql.String,
        async resolve(item, args, context) {
          const channelItem = await context.query.ChannelItem.findOne({
            where: { id: item.id },
            query: "price externalDetails { price }"
          });
          if (channelItem && channelItem.price && channelItem.externalDetails?.price) {
            const savedPrice = channelItem.price;
            const currentPrice = channelItem.externalDetails.price;
            if (savedPrice !== currentPrice) {
              return `Price changed from ${savedPrice} to ${currentPrice}`;
            }
          }
          return null;
        }
      })
    }),
    externalDetails: (0, import_fields12.virtual)({
      field: import_core10.graphql.field({
        type: import_core10.graphql.object()({
          name: "ChannelProduct",
          fields: {
            image: import_core10.graphql.field({ type: import_core10.graphql.String, resolve: (parent) => parent.image }),
            title: import_core10.graphql.field({ type: import_core10.graphql.String, resolve: (parent) => parent.title }),
            productId: import_core10.graphql.field({ type: import_core10.graphql.ID, resolve: (parent) => parent.productId }),
            variantId: import_core10.graphql.field({ type: import_core10.graphql.ID, resolve: (parent) => parent.variantId }),
            price: import_core10.graphql.field({ type: import_core10.graphql.String, resolve: (parent) => parent.price }),
            availableForSale: import_core10.graphql.field({ type: import_core10.graphql.Boolean, resolve: (parent) => parent.availableForSale }),
            productLink: import_core10.graphql.field({ type: import_core10.graphql.String, resolve: (parent) => parent.productLink }),
            inventory: import_core10.graphql.field({ type: import_core10.graphql.Int, resolve: (parent) => parent.inventory }),
            inventoryTracked: import_core10.graphql.field({ type: import_core10.graphql.Boolean, resolve: (parent) => parent.inventoryTracked }),
            error: import_core10.graphql.field({ type: import_core10.graphql.String, resolve: (parent) => parent.error })
          }
        }),
        resolve: async (item, args, context) => {
          const channelItem = await context.query.ChannelItem.findOne({
            where: { id: item.id },
            query: "channel { id }"
          });
          if (!channelItem?.channel) {
            console.error("Channel not associated or missing.");
            return { error: "Channel not associated or missing." };
          }
          const channelId = String(channelItem.channel.id);
          try {
            const product = await getChannelProduct_default(
              null,
              {
                channelId,
                productId: item.productId,
                variantId: item.variantId
              },
              context
            );
            return product;
          } catch (error) {
            console.error("Failed to fetch external details:", error);
            return { error: "Failed to fetch external details." };
          }
        }
      }),
      ui: {
        query: "{ image title productId variantId price availableForSale productLink inventory inventoryTracked error }"
      }
    }),
    matches: (0, import_fields12.relationship)({ ref: "Match.output", many: true }),
    channel: (0, import_fields12.relationship)({ ref: "Channel.channelItems" }),
    user: (0, import_fields12.relationship)({
      ref: "User.channelItems",
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if (operation === "create" && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    ...trackingFields
  },
  db: {
    extendPrismaSchema: (schema) => {
      return schema.replace(
        /(model [^}]+)}/g,
        "$1@@unique([quantity, productId, variantId, channelId, userId])\n}"
      );
    }
  }
});

// features/keystone/models/Shop.ts
var import_core11 = require("@keystone-6/core");
var import_fields13 = require("@keystone-6/core/fields");
var import_core12 = require("@keystone-6/core");
var Shop = (0, import_core11.list)({
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canCreateShops,
      update: isSignedIn,
      delete: permissions.canManageShops
    },
    filter: {
      query: rules.canReadShops,
      update: rules.canManageShops,
      delete: rules.canManageShops
    }
  },
  ui: {
    listView: {
      initialColumns: ["name", "domain", "platform", "linkMode"]
    }
  },
  fields: {
    name: (0, import_fields13.text)({
      validation: { isRequired: true }
    }),
    domain: (0, import_fields13.text)(),
    accessToken: (0, import_fields13.text)({
      ui: {
        displayMode: "textarea"
      }
    }),
    linkMode: (0, import_fields13.select)({
      options: [
        { label: "Sequential", value: "sequential" },
        { label: "Simultaneous", value: "simultaneous" }
      ],
      defaultValue: "sequential"
    }),
    metadata: (0, import_fields13.json)({
      defaultValue: {}
    }),
    // Relationships
    platform: (0, import_fields13.relationship)({
      ref: "ShopPlatform.shops"
    }),
    user: (0, import_fields13.relationship)({
      ref: "User.shops",
      hooks: {
        resolveInput: ({ operation, resolvedData, context }) => {
          if (operation === "create" && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    links: (0, import_fields13.relationship)({
      ref: "Link.shop",
      many: true
    }),
    orders: (0, import_fields13.relationship)({
      ref: "Order.shop",
      many: true
    }),
    shopItems: (0, import_fields13.relationship)({
      ref: "ShopItem.shop",
      many: true
    }),
    // Virtual field for webhooks with proper base URL
    webhooks: (0, import_fields13.virtual)({
      field: import_core12.graphql.field({
        type: import_core12.graphql.JSON,
        async resolve(item, args, context) {
          try {
            const recommendedWebhooks = [
              {
                callbackUrl: `/api/handlers/shop/create-order/${item.id}`,
                topic: "ORDER_CREATED",
                description: "When an order is created on this shop, Openship will create the order to be fulfilled."
              },
              {
                callbackUrl: `/api/handlers/shop/cancel-order/${item.id}`,
                topic: "ORDER_CANCELLED",
                description: "When an order is cancelled on this shop, Openship will mark the order status cancelled"
              },
              {
                callbackUrl: `/api/handlers/shop/cancel-order/${item.id}`,
                topic: "ORDER_CHARGEBACKED",
                description: "When an order is chargebacked on this shop, Openship will mark the order status cancelled"
              }
            ];
            const shopWithPlatform = await context.query.Shop.findOne({
              where: { id: item.id },
              query: "platform { getWebhooksFunction }"
            });
            if (!shopWithPlatform?.platform?.getWebhooksFunction) {
              return {
                success: false,
                error: "Get webhooks function not configured",
                recommendedWebhooks
              };
            }
            const platformConfig = {
              domain: item.domain,
              accessToken: item.accessToken,
              getWebhooksFunction: shopWithPlatform.platform.getWebhooksFunction,
              ...item.metadata || {}
            };
            const webhooksResult = await executeShopAdapterFunction2({
              platform: platformConfig,
              functionName: "getWebhooksFunction",
              args: {}
            });
            return {
              success: true,
              data: { webhooks: webhooksResult.webhooks || [] },
              recommendedWebhooks
            };
          } catch (error) {
            console.error("Error in webhooks virtual field:", error);
            return {
              success: false,
              error: error?.message || "Unknown error",
              recommendedWebhooks: [
                {
                  callbackUrl: `/api/handlers/shop/create-order/${item.id}`,
                  topic: "ORDER_CREATED",
                  description: "When an order is created on this shop, Openship will create the order to be fulfilled."
                },
                {
                  callbackUrl: `/api/handlers/shop/cancel-order/${item.id}`,
                  topic: "ORDER_CANCELLED",
                  description: "When an order is cancelled on this shop, Openship will mark the order status cancelled"
                },
                {
                  callbackUrl: `/api/handlers/shop/cancel-order/${item.id}`,
                  topic: "ORDER_CHARGEBACKED",
                  description: "When an order is chargebacked on this shop, Openship will mark the order status cancelled"
                }
              ]
            };
          }
        }
      })
    }),
    ...trackingFields
  }
});

// features/keystone/models/ShopItem.ts
var import_fields14 = require("@keystone-6/core/fields");
var import_core13 = require("@keystone-6/core");
var ShopItem = (0, import_core13.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    },
    filter: {
      query: rules.canReadMatches,
      update: rules.canUpdateMatches,
      delete: rules.canUpdateMatches
    }
  },
  fields: {
    quantity: (0, import_fields14.integer)(),
    productId: (0, import_fields14.text)(),
    variantId: (0, import_fields14.text)(),
    lineItemId: (0, import_fields14.text)(),
    externalDetails: (0, import_fields14.virtual)({
      field: import_core13.graphql.field({
        type: import_core13.graphql.object()({
          name: "ShopProduct",
          fields: {
            image: import_core13.graphql.field({ type: import_core13.graphql.String, resolve: (parent) => parent.image }),
            title: import_core13.graphql.field({ type: import_core13.graphql.String, resolve: (parent) => parent.title }),
            productId: import_core13.graphql.field({ type: import_core13.graphql.ID, resolve: (parent) => parent.productId }),
            variantId: import_core13.graphql.field({ type: import_core13.graphql.ID, resolve: (parent) => parent.variantId }),
            price: import_core13.graphql.field({ type: import_core13.graphql.String, resolve: (parent) => parent.price }),
            availableForSale: import_core13.graphql.field({ type: import_core13.graphql.Boolean, resolve: (parent) => parent.availableForSale }),
            productLink: import_core13.graphql.field({ type: import_core13.graphql.String, resolve: (parent) => parent.productLink }),
            inventory: import_core13.graphql.field({ type: import_core13.graphql.Int, resolve: (parent) => parent.inventory }),
            inventoryTracked: import_core13.graphql.field({ type: import_core13.graphql.Boolean, resolve: (parent) => parent.inventoryTracked }),
            error: import_core13.graphql.field({ type: import_core13.graphql.String, resolve: (parent) => parent.error })
          }
        }),
        resolve: async (item, args, context) => {
          const shopItem = await context.query.ShopItem.findOne({
            where: { id: item.id },
            query: "shop { id }"
          });
          if (!shopItem?.shop) {
            console.error("Shop not associated or missing.");
            return { error: "Shop not associated or missing." };
          }
          const shopId = shopItem.shop.id;
          try {
            const product = await getShopProduct_default(
              null,
              {
                shopId,
                productId: item.productId,
                variantId: item.variantId
              },
              context
            );
            return product;
          } catch (error) {
            console.error("Failed to fetch external details:", error);
            return { error: "Failed to fetch external details." };
          }
        }
      }),
      ui: {
        query: "{ image title productId variantId price availableForSale productLink inventory inventoryTracked error }"
        // Adjust UI query as needed
      }
    }),
    matches: (0, import_fields14.relationship)({ ref: "Match.input", many: true }),
    shop: (0, import_fields14.relationship)({ ref: "Shop.shopItems" }),
    user: (0, import_fields14.relationship)({
      ref: "User.shopItems",
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if (operation === "create" && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    ...trackingFields
  },
  db: {
    extendPrismaSchema: (schema) => {
      return schema.replace(
        /(model [^}]+)}/g,
        "$1@@unique([quantity, productId, variantId, shopId, userId])\n}"
      );
    }
  }
});

// features/keystone/models/Match.ts
var import_core14 = require("@keystone-6/core");
var import_fields15 = require("@keystone-6/core/fields");
var import_core15 = require("@keystone-6/core");
var Match = (0, import_core14.list)({
  access: {
    operation: {
      create: permissions.canCreateMatches,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageMatches
    },
    filter: {
      query: rules.canReadMatches,
      update: rules.canManageMatches,
      delete: rules.canManageMatches
    }
  },
  hooks: {
    resolveInput: async ({ item, resolvedData, operation, context }) => {
      const { input, output } = resolvedData;
      const ensureShopItems = async (items) => {
        const processedItems = [];
        if (items.create) {
          for (const item2 of items.create) {
            let [existingItem] = await context.query.ShopItem.findMany({
              where: {
                productId: { equals: item2.productId },
                variantId: { equals: item2.variantId },
                quantity: { equals: item2.quantity },
                shop: { id: { equals: item2.shop.connect.id } },
                user: {
                  id: {
                    equals: item2.user?.connect?.id || context.session?.itemId
                  }
                }
              },
              query: "id"
            });
            if (!existingItem) {
              existingItem = await context.query.ShopItem.createOne({
                data: item2,
                query: "id"
              });
            }
            processedItems.push({ id: existingItem.id });
          }
        }
        return processedItems;
      };
      const ensureChannelItems = async (items) => {
        const processedItems = [];
        if (items.create) {
          for (const item2 of items.create) {
            let existingItem = await context.query.ChannelItem.findOne({
              where: {
                productId: { equals: item2.productId },
                variantId: { equals: item2.variantId },
                quantity: { equals: item2.quantity },
                channel: { id: { equals: item2.channel.connect.id } },
                user: {
                  id: {
                    equals: item2.user?.connect?.id || context.session?.itemId
                  }
                }
              },
              query: "id"
            });
            if (!existingItem) {
              existingItem = await context.query.ChannelItem.createOne({
                data: item2,
                query: "id"
              });
            }
            processedItems.push({ id: existingItem.id });
          }
        }
        return processedItems;
      };
      if (input && input.create) {
        const processedInput = await ensureShopItems(input);
        resolvedData.input.connect = [
          ...resolvedData.input.connect || [],
          ...processedInput
        ];
        delete resolvedData.input.create;
      }
      if (output && output.create) {
        const processedOutput = await ensureChannelItems(output);
        resolvedData.output.connect = [
          ...resolvedData.output.connect || [],
          ...processedOutput
        ];
        delete resolvedData.output.create;
      }
      const checkForDuplicate = async (inputIds) => {
        const existingMatches = await context.query.Match.findMany({
          where: {
            input: {
              some: { id: { in: inputIds } }
            }
          },
          query: "id input { id }"
        });
        return existingMatches.some((match) => {
          const matchInputIds = match.input.map((item2) => item2.id);
          return matchInputIds.length === inputIds.length && matchInputIds.every((id) => inputIds.includes(id));
        });
      };
      if (operation === "create") {
        if (resolvedData.input.connect && resolvedData.input.connect.length > 0) {
          const inputIds = resolvedData.input.connect.map((item2) => item2.id);
          const isDuplicate = await checkForDuplicate(inputIds);
          if (isDuplicate) {
            throw new Error(
              "A match with the same input combination already exists."
            );
          }
        }
      }
      if (operation === "update") {
        if (resolvedData.input) {
          const matchToUpdate = await context.query.Match.findOne({
            where: { id: String(item.id) },
            query: `id input { id productId variantId quantity shop { id } }`
          });
          const newInputs = resolvedData.input.connect ? await Promise.all(
            resolvedData.input.connect.map(async (connectItem) => {
              return await context.query.ShopItem.findOne({
                where: { id: connectItem.id },
                query: `id productId variantId quantity shop { id }`
              });
            })
          ) : [];
          const disconnectedIds = resolvedData.input.disconnect ? resolvedData.input.disconnect.map((item2) => item2.id) : [];
          const remainingCurrentInputs = matchToUpdate.input.filter(
            (input2) => !disconnectedIds.includes(input2.id)
          );
          const combinedInputs = [...remainingCurrentInputs, ...newInputs];
          const inputIds = combinedInputs.map((item2) => item2.id);
          const isDuplicate = await checkForDuplicate(inputIds);
          if (isDuplicate) {
            throw new Error(
              "A match with the same input combination already exists."
            );
          }
        }
      }
      if (!resolvedData.user && context.session?.itemId) {
        resolvedData.user = { connect: { id: context.session.itemId } };
      }
      return resolvedData;
    }
  },
  ui: {
    listView: {
      initialColumns: ["input", "output", "user"]
    }
  },
  fields: {
    // Virtual fields for match status
    outputPriceChanged: (0, import_fields15.virtual)({
      field: import_core15.graphql.field({
        type: import_core15.graphql.String,
        resolve() {
          return "Price change detection for output items";
        }
      }),
      ui: {
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "hidden" }
      }
    }),
    inventoryNeedsToBeSynced: (0, import_fields15.virtual)({
      field: import_core15.graphql.field({
        type: import_core15.graphql.object()({
          name: "MatchInventoryData",
          fields: {
            syncEligible: import_core15.graphql.field({ type: import_core15.graphql.Boolean, resolve: (parent) => parent.syncEligible }),
            sourceQuantity: import_core15.graphql.field({ type: import_core15.graphql.Int, resolve: (parent) => parent.sourceQuantity }),
            targetQuantity: import_core15.graphql.field({ type: import_core15.graphql.Int, resolve: (parent) => parent.targetQuantity }),
            syncNeeded: import_core15.graphql.field({ type: import_core15.graphql.Boolean, resolve: (parent) => parent.syncNeeded })
          }
        }),
        async resolve(item, args, context) {
          const match = await context.query.Match.findOne({
            where: { id: String(item.id) },
            query: `
              input { quantity externalDetails { inventory } }
              output { quantity externalDetails { inventory } }
            `
          });
          const result = {
            syncEligible: false,
            sourceQuantity: null,
            targetQuantity: null,
            syncNeeded: false
          };
          if (match?.input?.length === 1 && match?.output?.length === 1) {
            const input = match.input[0];
            const output = match.output[0];
            if (input.quantity === 1 && output.quantity === 1 && input.externalDetails?.inventory !== void 0 && output.externalDetails?.inventory !== void 0) {
              result.syncEligible = true;
              result.sourceQuantity = input.externalDetails.inventory;
              result.targetQuantity = output.externalDetails.inventory;
            }
          }
          result.syncNeeded = result.syncEligible && result.sourceQuantity !== result.targetQuantity;
          return result;
        }
      }),
      ui: {
        query: "{ syncEligible sourceQuantity targetQuantity syncNeeded }",
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "hidden" }
      }
    }),
    // Relationships - Many-to-many between ShopItems and ChannelItems
    input: (0, import_fields15.relationship)({
      ref: "ShopItem.matches",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["productId", "variantId", "quantity"],
        inlineConnect: true
      }
    }),
    output: (0, import_fields15.relationship)({
      ref: "ChannelItem.matches",
      many: true,
      ui: {
        displayMode: "cards",
        cardFields: ["productId", "variantId", "quantity", "price"],
        inlineConnect: true
      }
    }),
    user: (0, import_fields15.relationship)({
      ref: "User.matches"
    }),
    ...trackingFields
  }
});

// features/keystone/models/Link.ts
var import_core16 = require("@keystone-6/core");
var import_fields16 = require("@keystone-6/core/fields");
var import_core17 = require("@keystone-6/core");
var Link = (0, import_core16.list)({
  access: {
    operation: {
      create: permissions.canCreateLinks,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageLinks
    },
    filter: {
      query: rules.canReadLinks,
      update: rules.canManageLinks,
      delete: rules.canManageLinks
    }
  },
  hooks: {
    resolveInput: {
      create: ({ operation, resolvedData, context }) => {
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } }
          };
        }
        return resolvedData;
      }
    },
    beforeOperation: async ({ operation, resolvedData, context }) => {
      if (operation === "create") {
        const shopId = resolvedData.shop.connect.id;
        const existingLinks = await context.query.Link.findMany({
          where: { shop: { id: { equals: shopId } } }
        });
        const nextRank = existingLinks.length > 0 ? existingLinks.length + 1 : 1;
        resolvedData.rank = nextRank;
      }
    }
  },
  ui: {
    listView: {
      initialColumns: ["shop", "channel", "rank"]
    }
  },
  fields: {
    // Processing order
    rank: (0, import_fields16.integer)({
      defaultValue: 1,
      ui: {
        description: "Processing order - lower numbers processed first"
      }
    }),
    // Filter configuration
    filters: (0, import_fields16.json)({
      defaultValue: [],
      ui: {
        description: "Order filtering rules"
      }
    }),
    customWhere: (0, import_fields16.json)({
      defaultValue: {},
      ui: {
        description: "Custom where clause for order filtering"
      }
    }),
    // Virtual field for dynamic where clause
    dynamicWhereClause: (0, import_fields16.virtual)({
      field: import_core17.graphql.field({
        type: import_core17.graphql.String,
        resolve() {
          return "Generated where clause based on filters";
        }
      }),
      ui: {
        itemView: { fieldMode: "read" },
        listView: { fieldMode: "hidden" }
      }
    }),
    // Relationships
    shop: (0, import_fields16.relationship)({
      ref: "Shop.links",
      ui: {
        displayMode: "cards",
        cardFields: ["name", "domain"]
      }
    }),
    channel: (0, import_fields16.relationship)({
      ref: "Channel.links",
      ui: {
        displayMode: "cards",
        cardFields: ["name", "domain"]
      }
    }),
    user: (0, import_fields16.relationship)({
      ref: "User.links"
    }),
    ...trackingFields
  }
});

// features/keystone/models/ShopPlatform.ts
var import_core18 = require("@keystone-6/core");
var import_fields17 = require("@keystone-6/core/fields");

// features/dashboard/lib/getBaseUrl.ts
var import_headers = require("next/headers");
async function getBaseUrl2() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (typeof process !== "undefined") {
    try {
      const headersList = await (0, import_headers.headers)();
      const host = headersList.get("x-forwarded-host") || headersList.get("host");
      const protocol = headersList.get("x-forwarded-proto") || "https";
      if (host) {
        return `${protocol}://${host}`;
      }
    } catch (e) {
    }
  }
  return "";
}

// features/keystone/models/ShopPlatform.ts
var ShopPlatform = (0, import_core18.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    },
    filter: {
      query: rules.canReadShops,
      update: rules.canManageShops,
      delete: rules.canManageShops
    }
  },
  fields: {
    name: (0, import_fields17.text)({ validation: { isRequired: true } }),
    ...(0, import_core18.group)({
      label: "App Credentials",
      description: "Adding these fields will enable this platform to be installed as an app by users",
      fields: {
        appKey: (0, import_fields17.text)({ validation: { isRequired: true } }),
        appSecret: (0, import_fields17.text)({ validation: { isRequired: true } }),
        callbackUrl: (0, import_fields17.virtual)({
          field: import_core18.graphql.field({
            type: import_core18.graphql.String,
            resolve: async (item) => {
              const baseUrl = await getBaseUrl2();
              return `${baseUrl}/api/oauth/shop/${item.id}/callback`;
            }
          }),
          ui: {
            description: "This URL needs to be set as the callback in your app settings"
          }
        })
      }
    }),
    ...(0, import_core18.group)({
      label: "Adapter Functions",
      description: "These functions link to built-in adapters, but can also be external endpoints",
      fields: {
        searchProductsFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        getProductFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        searchOrdersFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        updateProductFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        createWebhookFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        oAuthFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        oAuthCallbackFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        createOrderWebhookHandler: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        cancelOrderWebhookHandler: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        addTrackingFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        orderLinkFunction: (0, import_fields17.text)({
          validation: { isRequired: true },
          ui: {
            description: "Function to generate the order link for this platform"
          }
        }),
        addCartToPlatformOrderFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        getWebhooksFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        }),
        deleteWebhookFunction: (0, import_fields17.text)({
          validation: { isRequired: true }
        })
      }
    }),
    shops: (0, import_fields17.relationship)({ ref: "Shop.platform", many: true }),
    user: (0, import_fields17.relationship)({
      ref: "User.shopPlatforms",
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if (operation === "create" && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/ChannelPlatform.ts
var import_core19 = require("@keystone-6/core");
var import_fields18 = require("@keystone-6/core/fields");
var ChannelPlatform = (0, import_core19.list)({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn
    },
    filter: {
      query: rules.canReadChannels,
      update: rules.canUpdateChannels,
      delete: rules.canUpdateChannels
    }
  },
  fields: {
    name: (0, import_fields18.text)({ validation: { isRequired: true } }),
    ...(0, import_core19.group)({
      label: "App Credentials",
      description: "Adding these fields will enable this platform to be installed as an app by users.",
      fields: {
        appKey: (0, import_fields18.text)({ validation: { isRequired: true } }),
        appSecret: (0, import_fields18.text)({ validation: { isRequired: true } }),
        callbackUrl: (0, import_fields18.virtual)({
          field: import_core19.graphql.field({
            type: import_core19.graphql.String,
            resolve: async (item) => {
              const baseUrl = await getBaseUrl2();
              return `${baseUrl}/api/oauth/channel/${item.id}/callback`;
            }
          }),
          ui: {
            description: "This URL needs to be set as the callback in your app settings"
          }
        })
      }
    }),
    ...(0, import_core19.group)({
      label: "Adapter Functions",
      description: "These functions link to built-in adapters, but can also be external endpoints",
      fields: {
        searchProductsFunction: (0, import_fields18.text)({ validation: { isRequired: true } }),
        getProductFunction: (0, import_fields18.text)({ validation: { isRequired: true } }),
        createPurchaseFunction: (0, import_fields18.text)({ validation: { isRequired: true } }),
        createWebhookFunction: (0, import_fields18.text)({ validation: { isRequired: true } }),
        oAuthFunction: (0, import_fields18.text)({ validation: { isRequired: true } }),
        oAuthCallbackFunction: (0, import_fields18.text)({ validation: { isRequired: true } }),
        createTrackingWebhookHandler: (0, import_fields18.text)({ validation: { isRequired: true } }),
        cancelPurchaseWebhookHandler: (0, import_fields18.text)({ validation: { isRequired: true } }),
        getWebhooksFunction: (0, import_fields18.text)({ validation: { isRequired: true } }),
        deleteWebhookFunction: (0, import_fields18.text)({ validation: { isRequired: true } })
      }
    }),
    channels: (0, import_fields18.relationship)({ ref: "Channel.platform", many: true }),
    user: (0, import_fields18.relationship)({
      ref: "User.channelPlatforms",
      hooks: {
        resolveInput({ operation, resolvedData, context }) {
          if (operation === "create" && !resolvedData.user && context.session?.itemId) {
            return { connect: { id: context.session?.itemId } };
          }
          return resolvedData.user;
        }
      }
    }),
    ...trackingFields
  }
});

// features/keystone/models/index.ts
var models = {
  User,
  Role,
  ApiKey,
  // E-commerce Platform Models
  ShopPlatform,
  ChannelPlatform,
  Shop,
  Channel,
  // Order Management Models
  Order,
  LineItem,
  CartItem,
  // Product & Inventory Models
  ShopItem,
  ChannelItem,
  Match,
  // Linking & Tracking Models
  Link,
  TrackingDetail
  // Add other models here as needed
};

// features/keystone/index.ts
var import_session = require("@keystone-6/core/session");

// features/keystone/extendGraphqlSchema/index.ts
var import_schema = require("@graphql-tools/schema");

// features/keystone/extendGraphqlSchema/mutations/addToCart.ts
async function addToCart(root, { channelId, image, name, price, productId, variantId, quantity, orderId }, context) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be logged in to do this!");
  }
  const allCartItems = await context.query.CartItem.findMany({
    where: {
      order: { id: { equals: orderId } },
      channel: { id: { equals: channelId } },
      user: { id: { equals: session.itemId } },
      productId: { equals: productId },
      variantId: { equals: variantId },
      status: { not: { equals: "CANCELLED" } },
      purchaseId: { equals: "" },
      url: { equals: "" }
    },
    query: "id quantity"
  });
  const [existingCartItem] = allCartItems;
  if (existingCartItem) {
    console.log(
      `There are already ${existingCartItem.quantity}, increment by 1!`
    );
    await context.query.CartItem.updateOne({
      where: { id: existingCartItem.id },
      data: {
        quantity: existingCartItem.quantity + parseInt(quantity, 10)
      }
    });
    return await context.db.Order.findOne({
      where: {
        id: orderId
      }
    });
  }
  await context.query.CartItem.createOne({
    data: {
      price,
      productId,
      variantId,
      quantity: parseInt(quantity, 10),
      image,
      name,
      user: { connect: { id: session.itemId } },
      order: { connect: { id: orderId } },
      channel: { connect: { id: channelId } }
    }
  });
  return await context.db.Order.findOne({
    where: {
      id: orderId
    }
  });
}
var addToCart_default = addToCart;

// features/keystone/extendGraphqlSchema/mutations/cancelOrder.ts
async function cancelOrder(root, { orderId }, context) {
  try {
    await context.query.Order.updateOne({
      where: { id: orderId },
      data: {
        status: "CANCELLED"
      }
    });
    const cartItems = await context.query.CartItem.findMany({
      where: {
        order: { id: { equals: orderId } }
      },
      query: "id"
    });
    for (const cartItem of cartItems) {
      await context.query.CartItem.updateOne({
        where: { id: cartItem.id },
        data: {
          status: "CANCELLED"
        }
      });
    }
    return "Order cancelled successfully";
  } catch (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
}
var cancelOrder_default = cancelOrder;

// features/keystone/extendGraphqlSchema/mutations/cancelPurchase.ts
async function cancelPurchase(root, { purchaseId }, context) {
  try {
    const cartItems = await context.query.CartItem.findMany({
      where: {
        purchaseId: { equals: purchaseId }
      },
      query: "id"
    });
    for (const cartItem of cartItems) {
      await context.query.CartItem.updateOne({
        where: { id: cartItem.id },
        data: {
          status: "CANCELLED"
        }
      });
    }
    return "Purchase cancelled successfully";
  } catch (error) {
    throw new Error(`Failed to cancel purchase: ${error.message}`);
  }
}
var cancelPurchase_default = cancelPurchase;

// features/keystone/extendGraphqlSchema/mutations/matchOrder.ts
async function findChannelItems({ cartItems, userId, context }) {
  const arr = [];
  for (const {
    name,
    image,
    channelName,
    status,
    quantity,
    channelId,
    productId,
    variantId,
    price,
    // ensure price is string if present
    ...rest
  } of cartItems) {
    const [existingChannelItem] = await context.query.ChannelItem.findMany({
      where: {
        channel: { id: { equals: channelId } },
        user: { id: { equals: userId } },
        quantity: { equals: parseInt(quantity) },
        productId: { equals: productId },
        variantId: { equals: variantId }
        // ...rest,
      }
    });
    if (existingChannelItem) {
      arr.push({ id: existingChannelItem.id });
    } else {
      const createChannelItem = await context.query.ChannelItem.createOne({
        data: {
          channel: { connect: { id: channelId } },
          quantity: parseInt(quantity),
          productId,
          variantId,
          ...price !== void 0 ? { price: String(price) } : {},
          ...rest
        }
      });
      arr.push({ id: createChannelItem.id });
    }
  }
  return arr;
}
async function findShopItems({ lineItems, userId, context }) {
  const arr = [];
  for (const {
    name,
    image,
    channelName,
    price,
    // REMOVE for ShopItem
    quantity,
    channelId,
    productId,
    variantId,
    ...rest
  } of lineItems) {
    const { price: _omitPrice, ...restWithoutPrice } = rest;
    const [existingShopItem] = await context.query.ShopItem.findMany({
      where: {
        shop: { id: { equals: channelId } },
        user: { id: { equals: userId } },
        quantity: { equals: parseInt(quantity) },
        productId: { equals: productId },
        variantId: { equals: variantId },
        ...restWithoutPrice
      }
    });
    if (existingShopItem) {
      arr.push({ id: existingShopItem.id });
    } else {
      const createShopItem = await context.query.ShopItem.createOne({
        data: {
          shop: { connect: { id: channelId } },
          quantity: parseInt(quantity),
          productId,
          variantId,
          ...restWithoutPrice
        }
      });
      arr.push({ id: createShopItem.id });
    }
  }
  return arr;
}
async function matchOrder(root, { orderId }, context) {
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }
  const order = await context.query.Order.findOne({
    where: {
      id: orderId
    },
    query: `
      cartItems {
        channel {
          id
        }
        image
        price
        id
        quantity
        productId
        variantId
      }
      shop {
        id
      }
      lineItems {
        image
        price
        id
        quantity
        productId
        variantId
        lineItemId
      }
    `
  });
  const shopItemConnect = await findShopItems({
    lineItems: order.lineItems.map(
      ({ id, lineItemId, orderId: orderId2, userId, updatedAt, createdAt, ...rest }) => {
        return {
          ...rest,
          channelId: order.shop.id
        };
      }
    ),
    userId: sesh.itemId,
    context
  });
  const channelItemConnect = await findChannelItems({
    cartItems: order.cartItems.map(
      ({
        id,
        lineItemId,
        orderId: orderId2,
        userId,
        updatedAt,
        createdAt,
        url,
        error: cartItemError,
        purchaseId,
        channel,
        ...rest
      }) => {
        return {
          ...rest,
          channelId: channel.id
        };
      }
    ),
    userId: sesh.itemId,
    context
  });
  const existingMatches = await context.query.Match.findMany({
    where: {
      user: {
        id: { equals: sesh.itemId }
      },
      AND: order.lineItems.map(({ productId, variantId, quantity }) => ({
        input: {
          some: {
            productId: { equals: productId },
            variantId: { equals: variantId },
            quantity: { equals: parseInt(quantity) }
          }
        }
      }))
    },
    query: ` 
    id
    inputCount
    outputCount
    input {
      id
      quantity
      productId
      variantId
      shop {
        id
      }
      user {
        id
      }
    }
    output {
      id
      quantity
      productId
      variantId
      price
      channel {
        id
        domain
        accessToken
        platform {
          id
        }
      }
      user {
        id
      }
    }
  `
  });
  const [existingMatch] = existingMatches.filter(
    (match) => match.input.length === order.lineItems.length
  );
  if (existingMatch) {
    await context.query.Match.deleteOne({
      where: { id: existingMatch.id }
    });
  }
  const newMatch = await context.db.Match.createOne({
    data: {
      input: { connect: shopItemConnect },
      output: { connect: channelItemConnect },
      user: {
        connect: {
          id: sesh.itemId
        }
      }
    }
  });
  return newMatch;
}
var matchOrder_default = matchOrder;

// features/keystone/extendGraphqlSchema/mutations/overwriteMatch.ts
async function overwriteMatch(root, { input, output }, context) {
  const session = context.session;
  if (!session?.itemId) {
    throw new Error("You must be logged in to do this!");
  }
  const existingMatches = await context.query.Match.findMany({
    where: {
      input: {
        every: {
          OR: input.map((item) => ({
            AND: [
              { productId: { equals: item.productId } },
              { variantId: { equals: item.variantId } }
            ]
          }))
        }
      }
    },
    query: "id"
  });
  for (const match2 of existingMatches) {
    await context.query.Match.deleteOne({
      where: { id: match2.id }
    });
  }
  const match = await context.query.Match.createOne({
    data: {
      user: { connect: { id: session.itemId } },
      input: {
        create: input.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          user: { connect: { id: session.itemId } }
        }))
      },
      output: {
        create: output.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
          image: item.image,
          channel: { connect: { id: item.channelId } },
          user: { connect: { id: session.itemId } }
        }))
      }
    },
    query: "id"
  });
  return match;
}
var overwriteMatch_default = overwriteMatch;

// features/keystone/extendGraphqlSchema/mutations/placeOrders.ts
async function placeOrders(root, { ids }, context) {
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }
  const processedOrders = await placeMultipleOrders({
    ids,
    query: context.query
  });
  return processedOrders;
}
var placeOrders_default = placeOrders;

// features/keystone/extendGraphqlSchema/mutations/createShopWebhook.ts
async function createShopWebhook3(root, { shopId, topic, endpoint }, context) {
  try {
    const sudoContext = context.sudo();
    const shop = await sudoContext.query.Shop.findOne({
      where: { id: shopId },
      query: `
        id
        domain
        accessToken
        metadata
        platform {
          id
          name
          createWebhookFunction
        }
      `
    });
    if (!shop) {
      return { success: false, error: "Shop not found" };
    }
    if (!shop.platform) {
      return { success: false, error: "Platform configuration not specified." };
    }
    if (!shop.platform.createWebhookFunction) {
      return { success: false, error: "Create webhook function not configured." };
    }
    const platformConfig = {
      domain: shop.domain,
      accessToken: shop.accessToken,
      createWebhookFunction: shop.platform.createWebhookFunction,
      ...shop.metadata
    };
    const result = await createShopWebhook2({
      platform: platformConfig,
      endpoint,
      events: [topic]
    });
    return { success: true, webhookId: result.webhookId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
var createShopWebhook_default = createShopWebhook3;

// features/keystone/extendGraphqlSchema/mutations/deleteShopWebhook.ts
async function deleteShopWebhook3(root, { shopId, webhookId }, context) {
  try {
    const shop = await context.query.Shop.findOne({
      where: { id: shopId },
      query: "id domain accessToken platform { id deleteWebhookFunction }"
    });
    if (!shop) {
      return { success: false, error: "Shop not found" };
    }
    if (!shop.platform) {
      return { success: false, error: "Platform configuration not specified." };
    }
    await deleteShopWebhook2({
      platform: {
        ...shop.platform,
        domain: shop.domain,
        accessToken: shop.accessToken
      },
      webhookId
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
var deleteShopWebhook_default = deleteShopWebhook3;

// features/keystone/extendGraphqlSchema/mutations/updateShopProduct.ts
async function updateShopProduct3(root, { shopId, variantId, productId, price, inventoryDelta }, context) {
  const shop = await context.query.Shop.findOne({
    where: { id: shopId },
    query: `
      id
      domain
      accessToken
      metadata
      platform {
        id
        updateProductFunction
      }
    `
  });
  if (!shop) {
    throw new Error("Shop not found");
  }
  if (!shop.platform) {
    throw new Error("Platform configuration not specified.");
  }
  const platformConfig = {
    domain: shop.domain,
    accessToken: shop.accessToken,
    ...shop.metadata
  };
  try {
    const result = await updateShopProduct2({
      platform: {
        ...shop.platform,
        ...platformConfig
      },
      productId,
      variantId,
      inventory: inventoryDelta,
      price
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return { success: true, updatedVariant: result.updatedVariant };
  } catch (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }
}
var updateShopProduct_default = updateShopProduct3;

// features/keystone/extendGraphqlSchema/mutations/createChannelWebhook.ts
async function createChannelWebhook3(root, { channelId, topic, endpoint }, context) {
  try {
    const sudoContext = context.sudo();
    const channel = await sudoContext.query.Channel.findOne({
      where: { id: channelId },
      query: `
        id
        domain
        accessToken
        metadata
        platform {
          id
          name
          createWebhookFunction
        }
      `
    });
    if (!channel) {
      return { success: false, error: "Channel not found" };
    }
    if (!channel.platform) {
      return { success: false, error: "Platform configuration not specified." };
    }
    if (!channel.platform.createWebhookFunction) {
      return { success: false, error: "Create webhook function not configured." };
    }
    const platformConfig = {
      domain: channel.domain,
      accessToken: channel.accessToken,
      createWebhookFunction: channel.platform.createWebhookFunction,
      ...channel.metadata
    };
    const result = await createChannelWebhook2({
      platform: platformConfig,
      endpoint,
      events: [topic]
    });
    return { success: true, webhookId: result.webhookId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
var createChannelWebhook_default = createChannelWebhook3;

// features/keystone/extendGraphqlSchema/mutations/deleteChannelWebhook.ts
async function deleteChannelWebhook3(root, { channelId, webhookId }, context) {
  try {
    const channel = await context.query.Channel.findOne({
      where: { id: channelId },
      query: "id domain accessToken platform { id deleteWebhookFunction }"
    });
    if (!channel) {
      return { success: false, error: "Channel not found" };
    }
    if (!channel.platform) {
      return { success: false, error: "Platform configuration not specified." };
    }
    await deleteChannelWebhook2({
      platform: {
        ...channel.platform,
        domain: channel.domain,
        accessToken: channel.accessToken
      },
      webhookId
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
var deleteChannelWebhook_default = deleteChannelWebhook3;

// features/keystone/extendGraphqlSchema/mutations/createChannelPurchase.ts
async function createChannelPurchase3(root, { input }, context) {
  const { channelId, cartItems, address, notes, ...otherData } = input;
  const channel = await context.query.Channel.findOne({
    where: { id: channelId },
    query: "id domain accessToken platform { id createPurchaseFunction }"
  });
  if (!channel) {
    throw new Error("Channel not found");
  }
  if (!channel.platform) {
    throw new Error("Channel platform not configured.");
  }
  try {
    const result = await createChannelPurchase2({
      platform: channel.platform,
      cartItems,
      shipping: address,
      notes
    });
    if (result.error) {
      throw new Error(result.error);
    }
    return { success: true, purchaseId: result.purchaseId };
  } catch (error) {
    throw new Error(`Failed to create purchase: ${error.message}`);
  }
}
var createChannelPurchase_default = createChannelPurchase3;

// features/keystone/extendGraphqlSchema/mutations/upsertMatch.ts
var upsertMatch = async (_, { data }, context) => {
  const { input, output } = data;
  const ensureShopItems = async (items) => {
    const processedItems = [];
    for (const item of items) {
      let [existingItem] = await context.query.ShopItem.findMany({
        where: {
          productId: { equals: item.productId },
          variantId: { equals: item.variantId },
          quantity: { equals: item.quantity },
          shop: { id: { equals: item.shop.connect.id } },
          user: { id: { equals: item.user?.connect?.id || context.session?.itemId } }
        },
        query: "id"
      });
      if (!existingItem) {
        existingItem = await context.db.ShopItem.createOne({
          data: item,
          query: "id"
        });
      }
      processedItems.push({ id: existingItem.id });
    }
    return processedItems;
  };
  const ensureChannelItems = async (items) => {
    const processedItems = [];
    for (const item of items) {
      let [existingItem] = await context.query.ChannelItem.findMany({
        where: {
          productId: { equals: item.productId },
          variantId: { equals: item.variantId },
          quantity: { equals: item.quantity },
          channel: { id: { equals: item.channel.connect.id } },
          user: { id: { equals: item.user?.connect?.id || context.session?.itemId } }
        },
        query: "id"
      });
      if (!existingItem) {
        existingItem = await context.query.ChannelItem.createOne({
          data: item,
          query: "id"
        });
      }
      processedItems.push({ id: existingItem.id });
    }
    return processedItems;
  };
  const processedInput = await ensureShopItems(input.create);
  const processedOutput = await ensureChannelItems(output.create);
  const inputIds = processedInput.map((item) => item.id);
  const outputIds = processedOutput.map((item) => item.id);
  const existingMatches = await context.query.Match.findMany({
    where: {
      input: {
        some: { id: { in: inputIds } }
      }
    },
    query: "id input { id } output { id }"
  });
  const duplicateMatch = existingMatches.find((match) => {
    const matchInputIds = match.input.map((i) => i.id);
    return matchInputIds.length === inputIds.length && matchInputIds.every((id) => inputIds.includes(id));
  });
  if (duplicateMatch) {
    await context.query.Match.updateOne({
      where: { id: duplicateMatch.id },
      data: {
        output: {
          disconnect: duplicateMatch.output.map((o) => ({ id: o.id })),
          connect: outputIds.map((id) => ({ id }))
        }
      }
    });
    return duplicateMatch;
  } else {
    return await context.query.Match.createOne({
      data: {
        input: { connect: inputIds.map((id) => ({ id })) },
        output: { connect: outputIds.map((id) => ({ id })) }
      }
    });
  }
};
var upsertMatch_default = upsertMatch;

// features/keystone/extendGraphqlSchema/index.ts
var graphql9 = String.raw;
var typeDefs = graphql9`
  extend type Mutation {
    addToCart(
      channelId: ID
      image: String
      name: String
      price: String
      productId: String
      variantId: String
      quantity: String
      orderId: ID
    ): Order
    placeOrders(ids: [ID!]!): [Order]
    addMatchToCart(orderId: ID!): Order
    matchOrder(orderId: ID!): Match
    overwriteMatch(
      input: [ShopItemWhereInput!]
      output: [ChannelItemWhereInput!]
    ): Match
    cancelPurchase(purchaseId: String!): String
    cancelOrder(orderId: String!): String
    createShopWebhook(
      shopId: ID!
      topic: String!
      endpoint: String!
    ): CreateWebhookResponse
    deleteShopWebhook(shopId: ID!, webhookId: ID!): DeleteWebhookResponse
    updateShopProduct(
      shopId: ID!
      variantId: ID!
      productId: ID!
      price: String
      inventoryDelta: Int
    ): UpdateProductResponse
    createChannelWebhook(
      channelId: ID!
      topic: String!
      endpoint: String!
    ): CreateWebhookResponse
    deleteChannelWebhook(channelId: ID!, webhookId: ID!): DeleteWebhookResponse
    createChannelPurchase(input: CreatePurchaseInput!): CreatePurchaseResponse
    upsertMatch(data: MatchCreateInput!): Match
  }

  extend type Query {
    getMatch(input: [ShopItemWhereInput!]): [ChannelItemPlus!]
    getMatchCount(input: [ShopItemWhereInput!]): Int
    redirectToInit: Boolean
    searchShopProducts(shopId: ID!, searchEntry: String): [ShopProduct]
    getShopProduct(
      shopId: ID!
      variantId: String
      productId: String
    ): ShopProduct
    searchShopOrders(
      shopId: ID!
      searchEntry: String
      take: Int!
      skip: Int
      after: String
    ): ShopOrderConnection
    getShopWebhooks(shopId: ID!): [Webhook]
    searchChannelProducts(channelId: ID!, searchEntry: String): [ChannelProduct]
    getChannelProduct(
      channelId: ID!
      variantId: String
      productId: String
    ): ChannelProduct
    getChannelWebhooks(channelId: ID!): [Webhook]
    getFilteredMatches: [Match]
  }

  type FoundMatch {
    id: ID!
    output: [ChannelItemPlus!]
  }

  type ChannelItemPlus {
    quantity: Int
    productId: String
    variantId: String
    price: String
    image: String
    name: String
    channelName: String
    channelId: String
  }

  type ShopOrder {
    orderId: ID!
    orderName: String
    link: String
    date: String
    firstName: String
    lastName: String
    streetAddress1: String
    streetAddress2: String
    city: String
    state: String
    zip: String
    country: String
    email: String
    cartItems: [ShopCartItem]
    cursor: String
    lineItems: [ShopLineItem]
    fulfillments: [Fulfillment]
    note: String
    totalPrice: String
  }

  type ShopOrderConnection {
    orders: [ShopOrder]
    hasNextPage: Boolean
  }

  type ChannelPlus {
    id: ID!
    name: String!
  }

  type ShopCartItem {
    productId: String
    variantId: String
    quantity: Int
    price: String
    name: String
    image: String
    channel: ChannelPlus
  }

  type ShopLineItem {
    name: String
    quantity: Int
    price: String
    image: String
    productId: String
    variantId: String
    sku: String
    lineItemId: String
  }

  type Fulfillment {
    company: String
    number: String
    url: String
  }

  type Webhook {
    id: ID!
    callbackUrl: String!
    createdAt: DateTime!
    topic: String!
    includeFields: [String!]
  }

  type CreateWebhookResponse {
    success: Boolean
    error: String
    webhookId: ID
  }

  type DeleteWebhookResponse {
    success: Boolean
    error: String
  }

  type UpdateProductResponse {
    success: Boolean
    error: String
    updatedVariant: ProductVariant
  }

  type ProductVariant {
    price: String
    inventory: Int
  }

  input CreatePurchaseInput {
    shopId: ID!
    cartItems: [CartItemInput!]!
    email: String!
    address: AddressInput!
    orderId: ID!
  }

  input CartItemInput {
    variantId: ID!
    quantity: Int!
  }

  input AddressInput {
    firstName: String!
    lastName: String!
    streetAddress1: String!
    streetAddress2: String
    city: String!
    state: String!
    zip: String!
    country: String!
  }

  type CreatePurchaseResponse {
    success: Boolean
    error: String
    purchaseId: ID
  }
`;
var extendGraphqlSchema = (baseSchema) => (0, import_schema.mergeSchemas)({
  schemas: [baseSchema],
  typeDefs,
  resolvers: {
    Mutation: {
      addToCart: addToCart_default,
      placeOrders: placeOrders_default,
      addMatchToCart: addMatchToCart_default,
      matchOrder: matchOrder_default,
      overwriteMatch: overwriteMatch_default,
      cancelPurchase: cancelPurchase_default,
      cancelOrder: cancelOrder_default,
      createShopWebhook: createShopWebhook_default,
      deleteShopWebhook: deleteShopWebhook_default,
      updateShopProduct: updateShopProduct_default,
      createChannelWebhook: createChannelWebhook_default,
      deleteChannelWebhook: deleteChannelWebhook_default,
      createChannelPurchase: createChannelPurchase_default,
      upsertMatch: upsertMatch_default
    },
    Query: {
      getMatch: getMatchQuery_default,
      getMatchCount: getMatchCount_default,
      redirectToInit: redirectToInit_default,
      searchShopProducts: searchShopProducts_default,
      searchShopOrders: searchShopOrders_default,
      getShopWebhooks: getShopWebhooks_default,
      searchChannelProducts: searchChannelProducts_default,
      getChannelWebhooks: getChannelWebhooks_default,
      getFilteredMatches: getFilteredMatches_default,
      getChannelProduct: getChannelProduct_default,
      getShopProduct: getShopProduct_default
    }
  }
});

// features/keystone/lib/mail.ts
var import_nodemailer = require("nodemailer");
function getBaseUrlForEmails() {
  if (process.env.SMTP_STORE_LINK) {
    return process.env.SMTP_STORE_LINK;
  }
  console.warn("SMTP_STORE_LINK not set. Please add SMTP_STORE_LINK to your environment variables for email links to work properly.");
  return "";
}
var transport = (0, import_nodemailer.createTransport)({
  // @ts-ignore
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
function passwordResetEmail({ url }) {
  const backgroundColor = "#f9f9f9";
  const textColor = "#444444";
  const mainBackgroundColor = "#ffffff";
  const buttonBackgroundColor = "#346df1";
  const buttonBorderColor = "#346df1";
  const buttonTextColor = "#ffffff";
  return `
    <body style="background: ${backgroundColor};">
      <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
        <tr>
          <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            Please click below to reset your password
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}"><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">Reset Password</a></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
            If you did not request this email you can safely ignore it.
          </td>
        </tr>
      </table>
    </body>
  `;
}
async function sendPasswordResetEmail(resetToken, to, baseUrl) {
  const frontendUrl = baseUrl || getBaseUrlForEmails();
  const info = await transport.sendMail({
    to,
    from: process.env.SMTP_FROM,
    subject: "Your password reset token!",
    html: passwordResetEmail({
      url: `${frontendUrl}/dashboard/reset?token=${resetToken}`
    })
  });
  if (process.env.MAIL_USER?.includes("ethereal.email")) {
    console.log(`\u{1F4E7} Message Sent!  Preview it at ${(0, import_nodemailer.getTestMessageUrl)(info)}`);
  }
}

// features/keystone/index.ts
var databaseURL = process.env.DATABASE_URL || "file:./keystone.db";
var sessionConfig = {
  maxAge: 60 * 60 * 24 * 360,
  // How long they stay signed in?
  secret: process.env.SESSION_SECRET || "this secret should only be used in testing"
};
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  identityField: "email",
  secretField: "password",
  initFirstItem: {
    fields: ["name", "email", "password"],
    itemData: {
      role: {
        create: {
          name: "Admin",
          canSeeOtherUsers: true,
          canEditOtherUsers: true,
          canManageUsers: true,
          canManageRoles: true,
          canAccessDashboard: true,
          canSeeOtherShops: true,
          canManageShops: true,
          canCreateShops: true,
          canSeeOtherChannels: true,
          canManageChannels: true,
          canCreateChannels: true,
          canSeeOtherOrders: true,
          canManageOrders: true,
          canProcessOrders: true,
          canSeeOtherMatches: true,
          canManageMatches: true,
          canCreateMatches: true,
          canSeeOtherLinks: true,
          canManageLinks: true,
          canCreateLinks: true,
          canManagePlatforms: true,
          canViewPlatformMetrics: true,
          canManageApiKeys: true,
          canCreateApiKeys: true,
          canAccessAnalytics: true,
          canExportData: true,
          canManageWebhooks: true
        }
      }
    }
  },
  passwordResetLink: {
    async sendToken(args) {
      await sendPasswordResetEmail(args.token, args.identity);
    }
  },
  sessionData: `id name email role { id name ${permissionsList.join(" ")} }`
});
var keystone_default = withAuth(
  (0, import_core20.config)({
    db: {
      provider: "postgresql",
      url: databaseURL
    },
    lists: models,
    ui: {
      isAccessAllowed: ({ session }) => session?.data.role?.canAccessDashboard ?? false
    },
    session: (0, import_session.statelessSessions)(sessionConfig),
    graphql: {
      extendGraphqlSchema
    }
  })
);

// keystone.ts
var keystone_default2 = keystone_default;
//# sourceMappingURL=config.js.map
