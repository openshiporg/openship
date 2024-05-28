import { mergeSchemas } from "@graphql-tools/schema";
import {
  getMatch,
  getMatchCount,
  getShopWebhooks,
  redirectToInit,
  searchShopOrders,
  searchShopProducts,
  searchChannelProducts,
  getChannelWebhooks,
  getFilteredMatches,
  getChannelProduct,
  getShopProduct
} from "./queries";
import {
  addMatchToCart,
  addToCart,
  cancelOrder,
  cancelPurchase,
  matchOrder,
  overwriteMatch,
  placeOrders,
  createShopWebhook,
  deleteShopWebhook,
  updateShopProduct,
  createChannelWebhook,
  deleteChannelWebhook,
  createChannelPurchase,
  upsertMatch
} from "./mutations";

const graphql = String.raw;
// Use graphql.tag or similar if needed to define GraphQL strings
const typeDefs = graphql`
  extend type Mutation {
    addToCart(
      channelId: ID
      image: String
      name: String
      price: String
      productId: String
      variantId: String
      quantity: String
      orderId: ID
    ): Order
    placeOrders(ids: [ID!]!): [Order]
    addMatchToCart(orderId: ID!): Order
    matchOrder(orderId: ID!): Match
    overwriteMatch(
      input: [ShopItemWhereInput!]
      output: [ChannelItemWhereInput!]
    ): Match
    cancelPurchase(purchaseId: String!): String
    cancelOrder(orderId: String!): String
    createShopWebhook(
      shopId: ID!
      topic: String!
      endpoint: String!
    ): CreateWebhookResponse
    deleteShopWebhook(shopId: ID!, webhookId: ID!): DeleteWebhookResponse
    updateShopProduct(
      shopId: ID!
      variantId: ID!
      productId: ID!
      price: String
      inventoryDelta: Int
    ): UpdateProductResponse
    createChannelWebhook(
      channelId: ID!
      topic: String!
      endpoint: String!
    ): CreateWebhookResponse
    deleteChannelWebhook(channelId: ID!, webhookId: ID!): DeleteWebhookResponse
    createChannelPurchase(input: CreatePurchaseInput!): CreatePurchaseResponse
    upsertMatch(data: MatchCreateInput!): Match
  }

  extend type Query {
    getMatch(input: [ShopItemWhereInput!]): [ChannelItemPlus!]
    getMatchCount(input: [ShopItemWhereInput!]): Int
    redirectToInit: Boolean
    searchShopProducts(
      shopId: ID!
      searchEntry: String
    ): [ShopProduct]
    getShopProduct(
      shopId: ID!
      variantId: String
      productId: String
    ): ShopProduct
    searchShopOrders(shopId: ID!, searchEntry: String): [ShopOrder]
    getShopWebhooks(shopId: ID!): [Webhook]
    searchChannelProducts(
      channelId: ID!
      searchEntry: String
    ): [ChannelProduct]
    getChannelProduct(
      channelId: ID!
      variantId: String
      productId: String
    ): ChannelProduct
    getChannelWebhooks(channelId: ID!): [Webhook]
    getFilteredMatches: [Match]
  }

  type FoundMatch {
    id: ID!
    output: [ChannelItemPlus!]
  }

  type ChannelItemPlus {
    quantity: Int
    productId: String
    variantId: String
    price: String
    image: String
    name: String
    channelName: String
    channelId: String
  }

  type ShopOrder {
    orderId: ID!
    orderName: String
    link: String
    date: String
    first_name: String
    last_name: String
    streetAddress1: String
    streetAddress2: String
    city: String
    state: String
    zip: String
    country: String
    email: String
    cartItems: [CartItem]
    cursor: String
    lineItems: [LineItem]
    fulfillments: [Fulfillment]
    note: String
    totalPrice: String
  }

  type CartItem {
    productId: String
    variantId: String
    quantity: Int
    price: String
    name: String
    image: String
  }

  type LineItem {
    name: String
    quantity: Int
    price: String
    image: String
    productId: String
    variantId: String
    lineItemId: String
  }

  type Fulfillment {
    company: String
    number: String
    url: String
  }

  type Webhook {
    id: ID!
    callbackUrl: String!
    createdAt: DateTime!
    topic: String!
    includeFields: [String!]
  }

  type CreateWebhookResponse {
    success: Boolean
    error: String
    webhookId: ID
  }

  type DeleteWebhookResponse {
    success: Boolean
    error: String
  }

  type UpdateProductResponse {
    success: Boolean
    error: String
    updatedVariant: ProductVariant
  }

  type ProductVariant {
    price: String
    inventory: Int
  }

  input CreatePurchaseInput {
    shopId: ID!
    cartItems: [CartItemInput!]!
    email: String!
    address: AddressInput!
    orderId: ID!
  }
  
  input CartItemInput {
    variantId: ID!
    quantity: Int!
  }
  
  input AddressInput {
    first_name: String!
    last_name: String!
    streetAddress1: String!
    streetAddress2: String
    city: String!
    state: String!
    zip: String!
    country: String!
  }
  
  type CreatePurchaseResponse {
    success: Boolean
    error: String
    purchaseId: ID
  }
`;

export const extendGraphqlSchema = (baseSchema) =>
  mergeSchemas({
    schemas: [baseSchema],
    typeDefs,
    resolvers: {
      Mutation: {
        addToCart,
        placeOrders,
        addMatchToCart,
        matchOrder,
        overwriteMatch,
        cancelPurchase,
        cancelOrder,
        createShopWebhook,
        deleteShopWebhook,
        updateShopProduct,
        createChannelWebhook,
        deleteChannelWebhook,
        createChannelPurchase,
        upsertMatch
      },
      Query: {
        getMatch,
        getMatchCount,
        redirectToInit,
        searchShopProducts,
        searchShopOrders,
        getShopWebhooks,
        searchChannelProducts,
        getChannelWebhooks,
        getFilteredMatches,
        getChannelProduct,
        getShopProduct
      },
    },
  });
