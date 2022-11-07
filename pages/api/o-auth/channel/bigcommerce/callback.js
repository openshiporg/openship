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

    const { access_token, context, account_uuid } = req.query;


    const {
      channels: [foundChannel],
    } = await gqlClient(req).request(gql`
      query CHANNELS_QUERY {
        channels(where: { domain: { equals: "${context.split("/")[1]}" } }) {
          id
        }
      }
    `);

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
          data: { accessToken: access_token },
        }
      );
    } else {
      const createChannel = await gqlClient(req).request(
        CREATE_CHANNEL_MUTATION,
        {
          data: {
            name: context.split("/")[1],
            accessToken: access_token,
            domain: context.split("/")[1],
            type: "bigcommerce",
            searchProductsEndpoint: "/api/search-products/bigcommerce",
            createPurchaseEndpoint: "/api/create-purchase/bigcommerce",
            getWebhooksEndpoint: "/api/get-webhooks/bigcommerce",
            createWebhookEndpoint: "/api/create-webhook/bigcommerce",
            deleteWebhookEndpoint: "/api/delete-webhook/bigcommerce",
            user: { connect: { id: authenticatedItem.id } },
          },
        }
      );
    }
    const redirectUrl = `${process.env.FRONTEND_URL}/shops`;
    return res.status(200).redirect(redirectUrl);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "Error occurred", error: e.stack });
  }
};
