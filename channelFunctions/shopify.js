import { GraphQLClient, gql } from "graphql-request";

export async function searchProducts({
  domain,
  accessToken,
  variantId,
  productId,
  searchEntry,
}) {
  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const queryValue = variantId || searchEntry;

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
    query: queryValue,
  });

  const products = productVariants.edges.map(({ node }) => ({
    image:
      node.image?.originalSrc || node.product.images.edges[0]?.node.originalSrc,
    title: `${node.product.title} - ${node.title}`,
    productId: node.product.id.split("/").pop(),
    variantId: node.id.split("/").pop(),
    price: node.price,
    availableForSale: node.availableForSale,
    inventory: node.inventoryQuantity,
    inventoryTracked: node.inventoryPolicy !== 'deny',
    productLink: `https://${domain}/products/${node.product.handle}`,
  }));

  return { products };
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
