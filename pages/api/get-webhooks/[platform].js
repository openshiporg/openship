import request, { gql, GraphQLClient } from "graphql-request";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res
      .status(400)
      .json({ error: "Get webhooks endpoint for platform not found" });
  }

  try {
    const { webhooks } = await transformer[platform](req, res);

    res.status(200).json({ webhooks });
  } catch (err) {
    console.log({ err });
    return res.status(500).json({
      error: `${platform} get webhooks endpoint failed, please try again.`,
    });
  }
};

export default handler;

const transformer = {
  shopify: async (req, res) => {
    const mapTopic = {
      ORDERS_CREATE: "ORDER_CREATED",
      ORDERS_CANCELLED: "ORDER_CANCELLED",
      DISPUTES_CREATE: "ORDER_CHARGEBACKED",
      FULFILLMENTS_CREATE: "TRACKING_CREATED",
    };

    const shopifyClient = new GraphQLClient(
      `https://${req.query.domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.query.accessToken,
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
    console.log(req.query.topic);

    console.log(data.webhookSubscriptions.edges);

    return {
      webhooks: data?.webhookSubscriptions.edges.map(({ node }) => ({
        ...node,
        callbackUrl: node.callbackUrl.replace(process.env.FRONTEND_URL, ""),
        topic: mapTopic[node.topic],
      })),
    };
  },
};
