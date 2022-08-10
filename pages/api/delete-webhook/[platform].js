import request, { gql, GraphQLClient } from "graphql-request";

const handler = async (req, res) => {
  const { platform } = req.query;
  if (!transformer[platform]) {
    return res
      .status(400)
      .json({ error: "Delete webhooks endpoint for platform not found" });
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
    // console.log(err.response.errors);
    return res.status(500).json({
      error: err.response.errors,
    });
  }
};

export default handler;

const transformer = {
  shopify: async (req, res) => {
    const shopifyClient = new GraphQLClient(
      `https://${req.body.domain}/admin/api/graphql.json`,
      {
        headers: {
          "X-Shopify-Access-Token": req.body.accessToken,
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
        id: req.body.webhookId,
      }
    );

    if (userErrors.length > 0) {
      console.log(userErrors[0]);
      return {
        error: userErrors[0].message,
      };
    }

    return { success: "Webhook deleted" };
  },
};
