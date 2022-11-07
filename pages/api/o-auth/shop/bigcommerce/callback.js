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

    const { access_token, context, account_uuid } = req.query;

    const {
      shops: [foundShop],
    } = await gqlClient(req).request(gql`
      query SHOPS_QUERY {
        shops(where: { domain: { equals: "${context}" } }) {
          id
        }
      }
    `);

    console.log({ foundShop });

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
          data: { accessToken: access_token },
        }
      );
      console.log({ updateShop });
    } else {
      const createShop = await gqlClient(req).request(CREATE_SHOP_MUTATION, {
        data: {
          name: context.split("/")[0],
          accessToken: access_token,
          domain: context.split("/")[0],
          type: "bigcommerce",
          searchProductsEndpoint: "/api/search-products/bigcommerce",
          searchOrdersEndpoint: "/api/search-orders/bigcommerce",
          updateProductEndpoint: "/api/update-product/bigcommerce",
          getWebhooksEndpoint: "/api/get-webhooks/bigcommerce",
          createWebhookEndpoint: "/api/create-webhook/bigcommerce",
          deleteWebhookEndpoint: "/api/delete-webhook/bigcommerce",
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
