import { gql } from "graphql-request";

export const SHOPS_QUERY = gql`
  query SHOPS_QUERY {
    shops(orderBy: { createdAt: asc }) {
      id
      name
      type
      domain
      accessToken
      searchOrdersEndpoint
      searchProductsEndpoint
      updateProductEndpoint
      getWebhooksEndpoint
      createWebhookEndpoint
      deleteWebhookEndpoint
      links {
        id
        channel {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_SHOP_MUTATION = gql`
  mutation CREATE_SHOP_MUTATION($data: ShopCreateInput!) {
    createShop(data: $data) {
      id
    }
  }
`;

export const DELETE_SHOP_MUTATION = gql`
  mutation DELETE_SHOP_MUTATION($id: ID!) {
    deleteShop(where: { id: $id }) {
      id
    }
  }
`;

export const UPDATE_SHOP_MUTATION = gql`
  mutation UPDATE_SHOP_MUTATION($id: ID!, $data: ShopUpdateInput!) {
    updateShop(where: { id: $id }, data: $data) {
      id
      name
      type
      domain
      accessToken
      searchOrdersEndpoint
      searchProductsEndpoint
      updateProductEndpoint
      getWebhooksEndpoint
      createWebhookEndpoint
      deleteWebhookEndpoint
      links {
        id
        channel {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_LINK_MUTATION = gql`
  mutation CREATE_LINK_MUTATION($data: LinkCreateInput!) {
    createLink(data: $data) {
      shop {
        id
        name
        type
        domain
        accessToken
        searchOrdersEndpoint
        searchProductsEndpoint
        updateProductEndpoint
        getWebhooksEndpoint
        createWebhookEndpoint
        deleteWebhookEndpoint
        links {
          id
          channel {
            id
            name
          }
        }
      }
    }
  }
`;

export const DELETE_LINK_MUTATION = gql`
  mutation DELETE_LINK_MUTATION($id: ID!) {
    deleteLink(where: { id: $id }) {
      id
    }
  }
`;
