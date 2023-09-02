import { mergeSchemas } from "@graphql-tools/schema";
import addToCart from "./addToCart";
import getMatch from "./getMatch";
import getMatchCount from "./getMatchCount";
import placeOrders from "./placeOrders";
import addMatchToCart from "./addMatchToCart";
import matchOrder from "./matchOrder";
import overwriteMatch from "./overwriteMatch";
import redirectToInit from "./redirectToInit";
import cancelPurchase from "./cancelPurchase";
import cancelOrder from "./cancelOrder";

const graphql = String.raw;
export const extendGraphqlSchema = (schema) =>
  mergeSchemas({
    schemas: [schema],
    typeDefs: graphql`
      type Mutation {
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
          input: [ShopItemWhereInput!]!
          output: [ChannelItemWhereInput!]!
        ): Match
        cancelPurchase(purchaseId: String!): String
        cancelOrder(orderId: String!): String
      }
      type Query {
        getMatch(input: [ShopItemWhereInput!]!): [ChannelItemPlus]!
        getMatchCount(input: [ShopItemWhereInput!]!): Int
        redirectToInit: Boolean
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
    `,
    resolvers: {
      Mutation: {
        addToCart,
        placeOrders,
        addMatchToCart,
        matchOrder,
        overwriteMatch,
        cancelPurchase,
        cancelOrder,
      },
      Query: { getMatch, getMatchCount, redirectToInit },
    },
  });
