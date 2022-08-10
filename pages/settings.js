import { Box } from '@mantine/core';
import {
  ChannelProductSearch,
  ShopProductSearch,
} from '@components/ProductSearch';
import { AppShell } from '@components/AppShell';
import { useState } from 'react';
import { gql, GraphQLClient } from 'graphql-request';
import { checkAuth } from '@lib/checkAuth';

export default function Products() {
  const [activeTab, setActiveTab] = useState(0);

  const sideData = [
    {
      label: 'API Access',
      component: <ShopProductSearch />,
    },
    {
      label: 'Billing',
      component: <ChannelProductSearch />,
    },
  ];

  return (
    <AppShell data={sideData} activeTab={activeTab} setActiveTab={setActiveTab}>
      <Box sx={{ maxWidth: 600 }}>{sideData[activeTab].component}</Box>
    </AppShell>
  );
}

export async function getServerSideProps({ req }) {
  const { authenticatedItem, redirectToInit } = await checkAuth(req);
  if (authenticatedItem) {
    return {
      props: {},
    };
  }
  if (redirectToInit) {
    return { redirect: { destination: `/init` } };
  }
  return { redirect: { destination: `/signin` } };
}
