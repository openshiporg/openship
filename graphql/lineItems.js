import { gql } from "graphql-request";
import { ORDER_FRAGMENT } from "@graphql/orders";

export const CREATE_LINEITEM = gql`
  mutation CREATE_LINEITEM($data: LineItemCreateInput!) {
    createLineItem(data: $data) {
      id
    }
  }
`;

export const UPDATE_LINEITEM = gql`
  mutation UPDATE_LINEITEM($id: ID!, $data: LineItemUpdateInput!) {
    updateLineItem(where: { id: $id }, data: $data) {
      id
      order {
        ...orderFragment
      }
    }
  }
  ${ORDER_FRAGMENT}
`;

export const DELETE_LINEITEM_MUTATION = gql`
  mutation DELETE_LINEITEM_MUTATION($id: ID!) {
    deleteLineItem(where: { id: $id }) {
      id
      order {
        ...orderFragment
      }
    }
  }
  ${ORDER_FRAGMENT}
`;
