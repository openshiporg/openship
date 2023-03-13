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
  woocommerce: async (req, res) => {
    const response = await fetch(
      `${req.body.domain}/wp-json/wc/v3/webhooks/${req.body.webhookId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${btoa(req.body.accessToken)}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.message) {
      console.log(data.message);
      return {
        error: data.message,
      };
    }

    return { success: "Webhook deleted" };
  },
  bigcommerce: async (req, res) => {
    const response = await fetch(
      `https://api.bigcommerce.com/stores/${req.body.domain}/v3/hooks/${req.body.webhookId}`,
      {
        method: "DELETE",
        headers: {
          "X-Auth-Token": req.body.accessToken,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.title) {
      console.log(data.title);
      return {
        error: data.title,
      };
    }

    return { success: "Webhook deleted" };
  },
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
