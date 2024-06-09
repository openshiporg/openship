import { gql } from "graphql-request";
import { CREATE_CHANNEL_MUTATION } from "@graphql/channels";
import { checkAuth, gqlClient } from "keystone/lib/checkAuth";

const PLATFORM_QUERY = gql`
  query GetChannelPlatform($id: ID!) {
    channelPlatform(where: { id: $id }) {
      id
      appKey
      appSecret
      oAuthCallbackFunction
    }
  }
`;

const CHANNELS_QUERY = gql`
  query GetChannels($domain: String!) {
    channels(where: { domain: { equals: $domain } }) {
      id
      platform {
        id
      }
    }
  }
`;

const UPDATE_CHANNEL_MUTATION = gql`
  mutation UpdateChannel($id: ID!, $data: ChannelUpdateInput!) {
    updateChannel(where: { id: $id }, data: $data) {
      id
    }
  }
`;

export default async (req, res) => {
  try {
    const { platform, ...queryParams } = req.query;
    const { authenticatedItem } = await checkAuth(req);

    if (!authenticatedItem) {
      return res
        .status(422)
        .redirect(
          `${process.env.FRONTEND_URL}/signin?from=${encodeURIComponent(req.url)}`
        );
    }

    if (!platform) {
      return res.status(422).json({ status: "Unprocessable Entity" });
    }

    const { channel } = req.query;

    const { channelPlatform } = await gqlClient(req).request(PLATFORM_QUERY, { id: platform });

    if (!channelPlatform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    const platformFunctions = await import(`../../../../../channelFunctions/${channelPlatform.oAuthCallbackFunction}.js`);
    const accessToken = await platformFunctions.callback(queryParams, {
      appKey: channelPlatform.appKey,
      appSecret: channelPlatform.appSecret,
      redirectUri: `${process.env.FRONTEND_URL}/api/o-auth/channel/callback/${channelPlatform.id}`,
      scopes: platformFunctions.scopes(), // Assuming the scopes function is defined in the platformFunctions
    });

    async function upsertChannel(channel, accessToken) {
      const { channels } = await gqlClient(req).request(CHANNELS_QUERY, { domain: channel });

      if (channels.length > 0) {
        const foundChannel = channels[0];
        await gqlClient(req).request(
          UPDATE_CHANNEL_MUTATION,
          {
            id: foundChannel.id,
            data: { accessToken },
          }
        );
      } else {
        await gqlClient(req).request(
          CREATE_CHANNEL_MUTATION,
          {
            data: {
              name: channel.split(".")[0].toUpperCase(),
              accessToken,
              domain: channel,
              platform: { connect: { id: channelPlatform.id } },
              user: { connect: { id: authenticatedItem.id } },
            },
          }
        );
      }
    }

    await upsertChannel(channel, accessToken);

    const redirectUrl = `${process.env.FRONTEND_URL}/channels`;
    return res.status(200).redirect(redirectUrl);
  } catch (e) {
    console.warn(e);
    return res.status(500).json({ status: "Error occurred", error: e.stack });
  }
};