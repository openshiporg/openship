import { useMantineTheme } from "@mantine/core";
import useSWR from "swr";
import { AppShell } from "@components/AppShell";
import { useState } from "react";
import { SHOPS_QUERY } from "@graphql/shops";
import { CHANNELS_QUERY } from "@graphql/channels";
import { gqlFetcher } from "keystone/lib/gqlFetcher";
import { ShopGrid } from "@components/ShopGrid";
import { checkAuth, gqlClient } from "keystone/lib/checkAuth";

export default function Shops({ shops, channels }) {
  const theme = useMantineTheme();
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

  const [activeTab, setActiveTab] = useState(0);

  const sideData = shopData?.shops?.map(({ name }) => ({
    label: name,
  }));

  return (
    <AppShell
      loadingTabs={!shopData}
      data={sideData}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {/* <Box sx={{ maxWidth: 600 }}>{shopData?.shops[activeTab].id}</Box> */}
      <ShopGrid
        {...shopData?.shops[activeTab]}
        key={activeTab}
        channelData={channelData}
      />
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
