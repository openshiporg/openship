import { gql } from "graphql-request";

export const CHANNELS_QUERY = gql`
  query CHANNELS_QUERY {
    channels(orderBy: { createdAt: asc }) {
      id
      name
      type
      domain
      accessToken
      searchProductsEndpoint
      createPurchaseEndpoint
      getWebhooksEndpoint
      createWebhookEndpoint
      deleteWebhookEndpoint
      metafields {
        id
        key
        value
      }
    }
  }
`;

export const CREATE_CHANNEL_MUTATION = gql`
  mutation CREATE_CHANNEL_MUTATION($data: ChannelCreateInput!) {
    createChannel(data: $data) {
      id
    }
  }
`;

export const DELETE_CHANNEL_MUTATION = gql`
  mutation DELETE_CHANNEL_MUTATION($id: ID!) {
    deleteChannel(where: { id: $id }) {
      id
    }
  }
`;

export const UPDATE_CHANNEL_MUTATION = gql`
  mutation UPDATE_CHANNEL_MUTATION($id: ID!, $data: ChannelUpdateInput!) {
    updateChannel(where: { id: $id }, data: $data) {
      id
      name
      type
      domain
      accessToken
      searchProductsEndpoint
      createPurchaseEndpoint
      getWebhooksEndpoint
      createWebhookEndpoint
      deleteWebhookEndpoint
      metafields {
        id
        key
        value
      }
    }
  }
`;

export const UPDATE_CHANNEL_METAFIELD_MUTATION = gql`
  mutation UPDATE_CHANNEL_METAFIELD_MUTATION(
    $id: ID!
    $data: ChannelMetafieldUpdateInput!
  ) {
    updateChannelMetafield(where: { id: $id }, data: $data) {
      channel {
        id
        name
        type
        domain
        accessToken
        searchProductsEndpoint
        createPurchaseEndpoint
        getWebhooksEndpoint
        createWebhookEndpoint
        deleteWebhookEndpoint
        metafields {
          id
          key
          value
        }
      }
    }
  }
`;

export const CREATE_CHANNEL_METAFIELD_MUTATION = gql`
  mutation CREATE_CHANNEL_METAFIELD_MUTATION(
    $data: ChannelMetafieldCreateInput!
  ) {
    createChannelMetafield(data: $data) {
      channel {
        id
        name
        type
        domain
        accessToken
        searchProductsEndpoint
        createPurchaseEndpoint
        getWebhooksEndpoint
        createWebhookEndpoint
        deleteWebhookEndpoint
        metafields {
          id
          key
          value
        }
      }
    }
  }
`;

export const DELETE_CHANNEL_METAFIELD_MUTATION = gql`
  mutation DELETE_CHANNEL_METAFIELD_MUTATION(
    $where: ChannelMetafieldWhereUniqueInput!
  ) {
    deleteChannelMetafield(where: $where) {
      id
      channel {
        id
        name
        type
        domain
        accessToken
        searchProductsEndpoint
        createPurchaseEndpoint
        getWebhooksEndpoint
        createWebhookEndpoint
        deleteWebhookEndpoint
        metafields {
          id
          key
          value
        }
      }
    }
  }
`;
