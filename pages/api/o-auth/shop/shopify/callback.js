import ShopifyToken from "shopify-token";
import { CREATE_SHOP_MUTATION } from "@graphql/shops";
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
            `${process.env.FRONTEND_URL}/api/o-auth/shop/shopify?shop=${shop}`
          );
      }

      if (!hmac || !timestamp) {
        return res.status(422).json({ status: "Unprocessable Entity" });
      }

      if (
        !process.env.SHOP_SHOPIFY_SECRET ||
        !process.env.SHOP_SHOPIFY_API_KEY
      ) {
        return res.status(422).json({ status: "Unprocessable Entity" });
      }

      const shopifyToken = new ShopifyToken({
        redirectUri: `${process.env.FRONTEND_URL}/api/o-auth/shop/shopify/callback`,
        sharedSecret: process.env.SHOP_SHOPIFY_SECRET,
        apiKey: process.env.SHOP_SHOPIFY_API_KEY,
        scopes: [
          "write_orders, write_products, read_orders, read_products, read_fulfillments, write_fulfillments, write_draft_orders, read_assigned_fulfillment_orders, write_assigned_fulfillment_orders, read_merchant_managed_fulfillment_orders, write_merchant_managed_fulfillment_orders",
          "read_shopify_payments_disputes",
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
      shops: [foundShop],
    } = await gqlClient(req).request(gql`
      query SHOPS_QUERY {
        shops(where: { domain: { equals: "${shop}" } }) {
          id
        }
      }
    `);

    const accessToken = await getToken(token);

    console.log({ foundShop });
    console.log({ accessToken });

    if (foundShop) {
      const updateShop = await gqlClient(req).request(
        gql`
          mutation UPDATE_SHOP_MUTATION($id: ID!, $data: ShopUpdateInput!) {
            updateShop(where: { id: $id }, data: $data) {
              id
            }
          }
        `,
        {
          id: foundShop.id,
          data: { accessToken },
        }
      );
      console.log({ updateShop });
    } else {
      const createShop = await gqlClient(req).request(CREATE_SHOP_MUTATION, {
        data: {
          name: shop.split(".")[0].toUpperCase(),
          accessToken,
          domain: shop,
          type: "shopify",
          searchProductsEndpoint: "/api/search-products/shopify",
          searchOrdersEndpoint: "/api/search-orders/shopify",
          updateProductEndpoint: "/api/update-product/shopify",
          getWebhooksEndpoint: "/api/get-webhooks/shopify",
          createWebhookEndpoint: "/api/create-webhook/shopify",
          deleteWebhookEndpoint: "/api/delete-webhook/shopify",
          user: { connect: { id: authenticatedItem.id } },
        },
      });
    }
    const redirectUrl = `${process.env.FRONTEND_URL}/shops`;
    return res.status(200).redirect(redirectUrl);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "Error occurred", error: e.stack });
  }
};
