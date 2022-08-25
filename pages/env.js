import { Box, Text } from "@mantine/core";
import {
  ChannelProductSearch,
  ShopProductSearch,
} from "@components/ProductSearch";
import { AppShell } from "@components/AppShell";
import { useState } from "react";
import { gql, GraphQLClient } from "graphql-request";
import { checkAuth } from "@lib/checkAuth";

export default function Products({ FRONTEND_URL, RAILWAY_STATIC_URL }) {
  return (
    <Text>
      FRONTEND_URL:{FRONTEND_URL}
      <br />
      RAILWAY_STATIC_URL: {RAILWAY_STATIC_URL}
    </Text>
  );
}

export async function getServerSideProps({ req }) {
  return {
    props: {
      FRONTEND_URL: process.env.FRONTEND_URL,
      RAILWAY_STATIC_URL: process.env.RAILWAY_STATIC_URL,
    },
  };
}
