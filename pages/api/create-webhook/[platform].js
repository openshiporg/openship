import request, { gql, GraphQLClient } from "graphql-request";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res
      .status(400)
      .json({ error: "Create webhooks endpoint for platform not found" });
  }

  try {
    const { success, error } = await transformer[platform](req, res);
    console.log({ error });
    if (success) {
      res.status(200).json({ success });
    } else {
      res.status(400).json({ error });
    }
  } catch (err) {
    console.log({ err });
    return res.status(500).json({
      error: err.response?.errors[0]?.message ?? err.response.errors,
    });
  }
};

export default handler;

const transformer = {
  bigcommerce: async (req, res) => {
    const mapTopic = {
      ORDERS_CREATE: "store/order/created",
      ORDERS_CANCELLED: "store/order/archived",
      DISPUTES_CREATE: "store/order/refund/created",
      FULFILLMENTS_CREATE: "store/order/transaction/created",
    };


    if (!mapTopic[req.body.topic]) {
      return {
        error: "Topic not mapped yet",
      };
    }

    const response = await fetch(
      `https://api.bigcommerce.com/stores/${req.body.domain}/v3/hooks`,
      {
        method: "POST",
        headers: {
          "X-Auth-Token": req.body.accessToken,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        data: {
          scope: mapTopic[req.body.topic],
          destination: `${process.env.FRONTEND_URL}${req.body.endpoint}`,
          is_active: true,
          events_history_enabled: true,
          headers: {
            custom: "JSON"
          }
        }
      }
    );

    const data = await response.json();

    if (data.title) {
      console.log(data.title);
      return {
        error: data.title,
      };
    }

    return { success: "Webhook created" };
  },
  shopify: async (req, res) => {
    const mapTopic = {
      ORDER_CREATED: "ORDERS_CREATE",
      ORDER_CANCELLED: "ORDERS_CANCELLED",
      ORDER_CHARGEBACKED: "DISPUTES_CREATE",
      TRACKING_CREATED: "FULFILLMENTS_CREATE",
    };

    if (!mapTopic[req.body.topic]) {
      return {
        error: "Topic not mapped yet",
      };
    }

    const shopifyClient = new GraphQLClient(
      `https://${req.body.domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.body.accessToken,
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
        topic: mapTopic[req.body.topic],
        webhookSubscription: {
          callbackUrl: `${process.env.FRONTEND_URL}${req.body.endpoint}`,
          format: "JSON",
        },
      }
    );

    if (userErrors.length > 0) {
      console.log(userErrors[0]);
      return {
        error: userErrors[0].message,
      };
    }

    return { success: "Webhook created" };
  },
  walmart: async (req, res) => {
    const mapTopic = {
      ORDER_CREATED: "ORDERS_CREATE",
      ORDER_CANCELLED: "ORDERS_CANCELLED",
      ORDER_CHARGEBACKED: "DISPUTES_CREATE",
      TRACKING_CREATED: "FULFILLMENTS_CREATE",
    };

    if (!mapTopic[req.body.topic]) {
      return {
        error: "Topic not mapped yet",
      };
    }

    const shopifyClient = new GraphQLClient(
      `https://${req.body.domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.body.accessToken,
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
        topic: mapTopic[req.body.topic],
        webhookSubscription: {
          callbackUrl: `${process.env.FRONTEND_URL}${req.body.endpoint}`,
          format: "JSON",
        },
      }
    );

    if (userErrors.length > 0) {
      console.log(userErrors[0]);
      return {
        error: userErrors[0].message,
      };
    }

    return { success: "Webhook created" };
  },
};
