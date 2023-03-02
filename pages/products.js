import { Container } from "@mantine/core";
import {
  ChannelProductSearch,
  ShopProductSearch,
} from "@components/ProductSearch";
import { AppShell } from "@components/AppShell";
import { useState } from "react";
import { checkAuth, gqlClient } from "@lib/checkAuth";
import useSWR from "swr";
import { CHANNELS_QUERY } from "@graphql/channels";
import { SHOPS_QUERY } from "@graphql/shops";
import { gqlFetcher } from "@lib/gqlFetcher";

export default function Products({ shops, channels }) {
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: channelData,
    error: channelError,
    mutate: mutateChannels,
  } = useSWR(CHANNELS_QUERY, gqlFetcher, {
    fallbackData: { channels },
    revalidateOnMount: false,
  });
  const {
    data: shopData,
    error: shopError,
    mutate: mutateShops,
  } = useSWR(SHOPS_QUERY, gqlFetcher, {
    fallbackData: { shops },
    revalidateOnMount: false,
  });

  const sideData = [
    {
      label: "Shop Products",
      component: <ShopProductSearch />,
    },
    {
      label: "Channel Products",
      component: <ChannelProductSearch />,
    },
  ];

  return (
    <AppShell data={sideData} activeTab={activeTab} setActiveTab={setActiveTab}>
      <Container mt="xl" mb="xs" size="md" px="xs">
        {sideData[activeTab].component}
      </Container>
    </AppShell>
  );
}

export async function getServerSideProps({ req }) {
  const { authenticatedItem, redirectToInit } = await checkAuth(req);
  if (authenticatedItem) {
    const { shops } = await gqlClient(req).request(SHOPS_QUERY);
    const { channels } = await gqlClient(req).request(CHANNELS_QUERY);

    return {
      props: { shops, channels },
    };
  }
  if (redirectToInit) {
    return { redirect: { destination: `/init` } };
  }
  return { redirect: { destination: `/signin` } };
}
