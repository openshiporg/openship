import { gql } from "graphql-request";
import { ORDER_FRAGMENT } from "@graphql/orders";

export const ADDMATCHTOCART_MUTATION = gql`
  mutation ADDMATCHTOCART_MUTATION($orderId: ID!) {
    addMatchToCart(orderId: $orderId) {
      ...orderFragment
    }
  }
  ${ORDER_FRAGMENT}
`;

export const MATCHORDER_MUTATION = gql`
  mutation MATCHORDER_MUTATION($orderId: ID!) {
    matchOrder(orderId: $orderId) {
      id
      input {
        id
        quantity
        productId
        variantId
      }
      output {
        id
        quantity
        productId
        variantId
      }
    }
  }
`;

export const OVERWRITEMATCH_MUTATION = gql`
  mutation OVERWRITEMATCH_MUTATION(
    $input: [ShopItemWhereInput!]!
    $output: [ChannelItemWhereInput!]!
  ) {
    overwriteMatch(input: $input, output: $output) {
      id
      input {
        id
        quantity
        productId
        variantId
      }
      output {
        id
        quantity
        productId
        variantId
      }
    }
  }
`;

export const GET_MATCH_QUERY = gql`
  query GET_MATCH_QUERY($input: [ShopItemWhereInput!]!) {
    getMatch(input: $input) {
      quantity
      productId
      variantId
      price
      image
      name
      channelName
    }
  }
`;

export const MATCH_COUNT = gql`
  query MATCH_COUNT($input: [ShopItemWhereInput!]!) {
    getMatchCount(input: $input)
  }
`;
