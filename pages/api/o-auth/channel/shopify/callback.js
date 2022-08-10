import ShopifyToken from "shopify-token";
import { CREATE_CHANNEL_MUTATION } from "@graphql/channels";
import { checkAuth, gqlClient } from "@lib/checkAuth";
import { gql } from "graphql-request";

export default async (req, res) => {
  try {
    const { authenticatedItem } = await checkAuth(req);
    if (!authenticatedItem) {
      return res
        .status(422)
        .redirect(
          `${process.env.FRONTEND_URL}/signin?from=${encodeURIComponent(
            req.url
          )}`
        );
    }

    const { code, shop, hmac, timestamp, token } = req.query;

    if (!shop) {
      return res.status(422).json({ status: "Unprocessable Entity" });
    }

    async function getToken(token) {
      if (token) {
        return token;
      }

      if (!code) {
        return res
          .status(422)
          .redirect(
            `${process.env.FRONTEND_URL}/api/o-auth/channel/shopify?shop=${shop}`
          );
      }

      if (!hmac || !timestamp) {
        return res.status(422).json({ status: "Unprocessable Entity" });
      }

      if (
        !process.env.CHANNEL_SHOPIFY_SECRET ||
        !process.env.CHANNEL_SHOPIFY_API_KEY
      ) {
        return res.status(422).json({ status: "Unprocessable Entity" });
      }

      const shopifyToken = new ShopifyToken({
        redirectUri: `${process.env.FRONTEND_URL}/api/o-auth/channel/shopify/callback`,
        sharedSecret: process.env.CHANNEL_SHOPIFY_SECRET,
        apiKey: process.env.CHANNEL_SHOPIFY_API_KEY,
        scopes: [
          "write_orders, write_products, read_orders, read_products, read_fulfillments, write_fulfillments, write_draft_orders, read_assigned_fulfillment_orders, write_assigned_fulfillment_orders, read_merchant_managed_fulfillment_orders, write_merchant_managed_fulfillment_orders",
        ],
        accessMode: "offline",
        timeout: 10000,
      });
      if (!shopifyToken.verifyHmac(req.query)) {
        console.error("Error validating hmac");
        return res.status(500).json({ error: "Error validating hmac" });
      }
      const data = await shopifyToken.getAccessToken(shop, code);
      const timeNow = +new Date();
      const expiresAt = timeNow + (data.expires_in - 20 * 1000);
      const tokenData = { ...data, expires_at: expiresAt }; // TODO: change from unix timestamp to Firestore date
      return tokenData.access_token;
    }

    const {
      channels: [foundChannel],
    } = await gqlClient(req).request(gql`
      query CHANNELS_QUERY {
        channels(where: { domain: { equals: "${shop}" } }) {
          id
        }
      }
    `);

    const accessToken = await getToken(token);

    console.log({ foundChannel });

    if (foundChannel) {
      const updateChannel = await gqlClient(req).request(
        gql`
          mutation UPDATE_CHANNEL_MUTATION($id: ID!, $data: ChannelUpdateInput!) {
            updateChannel(where: { id: $id }, data: $data) {
              id
            }
          }
        `,
        {
          id: foundChannel.id,
          data: { accessToken },
        }
      );
    } else {
      const createChannel = await gqlClient(req).request(
        CREATE_CHANNEL_MUTATION,
        {
          data: {
            name: shop.split(".")[0].toUpperCase(),
            accessToken,
            domain: shop,
            type: "shopify",
            searchProductsEndpoint: "/api/search-products/shopify",
            createPurchaseEndpoint: "/api/create-purchase/shopify",
            getWebhooksEndpoint: "/api/get-webhooks/shopify",
            createWebhookEndpoint: "/api/create-webhook/shopify",
            deleteWebhookEndpoint: "/api/delete-webhook/shopify",
            user: { connect: { id: authenticatedItem.id } },
          },
        }
      );
    }
    const redirectUrl = `${process.env.FRONTEND_URL}/channels`;
    return res.status(200).redirect(redirectUrl);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "Error occurred", error: e.stack });
  }
};
