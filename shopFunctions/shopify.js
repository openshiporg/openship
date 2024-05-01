import { GraphQLClient, gql } from "graphql-request";

export async function searchProducts({
  domain,
  accessToken,
  variantId,
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


// Get Orders
export async function searchOrders({
  domain,
  accessToken,
  query,
  first = 10,
  after = null,
}) {
  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const { orders } = await shopifyClient.request(
    gql`
      query (
        $first: Int
        $after: String
        $before: String
        $last: Int
        $query: String
      ) {
        orders(
          first: $first
          after: $after
          before: $before
          last: $last
          reverse: true
          query: $query
        ) {
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
          edges {
            node {
              id
              email
              name
              processedAt
              metafield(namespace: "oscart", key: "oscart") {
                value
              }
              lineItems(first: 10) {
                edges {
                  node {
                    quantity
                    variantTitle
                    variant {
                      id
                    }
                    product {
                      id
                    }
                    discountedUnitPriceSet {
                      shopMoney {
                        amount
                      }
                    }
                    id
                    name
                    image {
                      originalSrc
                    }
                    discountedTotal
                  }
                }
              }
              fulfillments(first: 25) {
                trackingInfo {
                  company
                  number
                  url
                }
              }
              note
              shippingAddress {
                address1
                address2
                city
                name
                provinceCode
                zip
                country
              }
              totalReceivedSet {
                shopMoney {
                  amount
                }
              }
            }
            cursor
          }
        }
      }
    `,
    { query, first, after }
  );

  const formattedOrders = orders.edges.map(
    ({
      cursor,
      node: {
        id,
        name,
        email,
        processedAt,
        lineItems,
        metafield,
        fulfillments,
        note,
        shippingAddress: {
          address1,
          address2,
          city,
          provinceCode,
          zip,
          country,
          name: shipName,
        },
        totalReceivedSet: {
          shopMoney: { amount: totalPrice },
        },
      },
    }) => ({
      orderId: id,
      orderName: name,
      link: `https://${domain}/admin/orders/${id.split("/").pop()}`,
      date: Intl.DateTimeFormat("en-US").format(Date.parse(processedAt)),
      first_name: shipName.split(" ")[0],
      last_name: shipName.split(" ")[1] || shipName.split(" ")[0],
      streetAddress1: address1,
      streetAddress2: address2,
      city,
      state: provinceCode,
      zip,
      country,
      email,
      cartItems: metafield && JSON.parse(metafield.value),
      cursor,
      lineItems: lineItems.edges.map(
        ({
          node: {
            id,
            name,
            quantity,
            product,
            variant,
            image: { originalSrc },
            discountedUnitPriceSet: {
              shopMoney: { amount },
            },
          },
        }) => ({
          name,
          quantity,
          price: amount,
          image: originalSrc,
          productId: product.id.split("/").pop(),
          variantId: variant.id.split("/").pop(),
          lineItemId: id.split("/").pop(),
        })
      ),
      fulfillments: fulfillments.map(({ trackingInfo }) => ({
        company: trackingInfo?.company,
        number: trackingInfo?.number,
        url: trackingInfo?.url,
      })),
      note,
      totalPrice,
    })
  );

  return { orders: formattedOrders, pageInfo: orders.pageInfo };
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

// Update Product
export async function updateProduct({ domain, accessToken, variantId, price }) {
  const shopifyClient = new GraphQLClient(
    `https://${domain}/admin/api/graphql.json`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    }
  );

  const { productVariantUpdate } = await shopifyClient.request(
    gql`
      mutation ($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            price
          }
        }
      }
    `,
    {
      input: {
        id: `gid://shopify/ProductVariant/${variantId}`,
        price: price,
        compareAtPrice: Math.ceil(Number(price) * 1.7) - 0.01, // Example calculation for compareAtPrice
      },
    }
  );

  return { updatedVariant: productVariantUpdate.productVariant };
}
