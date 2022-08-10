import { gql } from "graphql-request";
import { ORDER_FRAGMENT } from "@graphql/orders";

export const CREATE_CARTITEM = gql`
  mutation CREATE_CARTITEM($data: CartItemCreateInput!) {
    createCartItem(data: $data) {
      id
    }
  }
`;

export const UPDATE_CARTITEM = gql`
  mutation UPDATE_CARTITEM($id: ID!, $data: CartItemUpdateInput!) {
    updateCartItem(where: { id: $id }, data: $data) {
      id
      order {
        ...orderFragment
      }
    }
  }
  ${ORDER_FRAGMENT}
`;

export const DELETE_CARTITEM_MUTATION = gql`
  mutation DELETE_CARTITEM_MUTATION($id: ID!) {
    deleteCartItem(where: { id: $id }) {
      id
      order {
        ...orderFragment
      }
    }
  }
  ${ORDER_FRAGMENT}
`;
