import { gql } from "graphql-request";

export const ORDER_FRAGMENT = gql`
  fragment orderFragment on Order {
    id
    orderId
    orderName
    email
    first_name
    last_name
    streetAddress1
    streetAddress2
    city
    state
    zip
    country
    orderError
    cartItems {
      id
      name
      image
      price
      quantity
      productId
      variantId
      purchaseId
      url
      error
      status
      order {
        id
      }
      channel {
        id
        name
        createPurchaseEndpoint
      }
    }
    lineItems {
      id
      name
      quantity
      price
      image
      productId
      variantId
      lineItemId
    }
    shop {
      id
      name
      domain
      accessToken
      searchOrdersEndpoint
      searchProductsEndpoint
      updateProductEndpoint
    }
    currency
    totalPrice
    subTotalPrice
    totalDiscount
    totalTax
    status
    createdAt
  }
`;

export const ORDERS_QUERY = gql`
  query ORDERS_QUERY(
    $skip: Int
    $take: Int
    # $orderBy: [OrderOrderByInput!]!
    $where: OrderWhereInput
  ) {
    orders(orderBy: [], take: $take, skip: $skip, where: $where) {
      ...orderFragment
    }
  }
  ${ORDER_FRAGMENT}
`;

export const CREATE_ORDER = gql`
  mutation CREATE_ORDER($data: OrderCreateInput!) {
    createOrder(data: $data) {
      id
    }
  }
`;

export const UPDATE_ORDER = gql`
  mutation UPDATE_ORDER($id: ID!, $data: OrderUpdateInput!) {
    updateOrder(where: { id: $id }, data: $data) {
      ...orderFragment
    }
  }
  ${ORDER_FRAGMENT}
`;

export const ORDER_COUNT_QUERY = gql`
  query ORDER_COUNT_QUERY($where: OrderWhereInput!) {
    ordersCount(where: $where)
  }
`;

export const BULK_UPDATE_ORDERS = gql`
  mutation BULK_UPDATE_ORDERS($data: [OrderUpdateArgs!]!) {
    updateOrders(data: $data) {
      id
      orderId
    }
  }
`;

export const PLACE_ORDERS = gql`
  mutation PLACE_ORDERS($ids: [ID!]!) {
    placeOrders(ids: $ids) {
      orderId
    }
  }
`;

export const DELETE_ORDER = gql`
  mutation DELETE_ORDER($id: ID!) {
    deleteOrder(where: { id: $id }) {
      id
    }
  }
`;

export const ADD_TO_CART_MUTATION = gql`
  mutation ADD_TO_CART_MUTATION(
    $channelId: ID
    $image: String
    $name: String
    $price: String
    $productId: String
    $variantId: String
    $quantity: String
    $orderId: ID
  ) {
    addToCart(
      channelId: $channelId
      image: $image
      name: $name
      price: $price
      productId: $productId
      variantId: $variantId
      quantity: $quantity
      orderId: $orderId
    ) {
      ...orderFragment
    }
  }
  ${ORDER_FRAGMENT}
`;

export const CHANNEL_ORDERS_QUERY = gql`
  query CHANNEL_ORDERS_QUERY(
    $skip: Int
    $take: Int
    $where: OrderWhereInput
    $cartItemsWhere: CartItemWhereInput
  ) {
    orders(orderBy: [], take: $take, skip: $skip, where: $where) {
      id
      orderId
      orderName
      email
      first_name
      last_name
      streetAddress1
      streetAddress2
      city
      state
      zip
      orderError
      cartItems(where: $cartItemsWhere) {
        id
        name
        image
        price
        quantity
        productId
        variantId
        purchaseId
        url
        error
        order {
          id
        }
        channel {
          id
          name
          createPurchaseEndpoint
        }
      }
      shop {
        name
        domain
        accessToken
        searchOrdersEndpoint
        searchProductsEndpoint
        updateProductEndpoint
      }
      currency
      totalPrice
      subTotalPrice
      totalDiscount
      totalTax
      status
      createdAt
    }
  }
`;
