import { useState } from "react";
import { AppShell } from "@components/AppShell";
import { OSOrders } from "@components/OSOrders";
import { ShopOrders } from "@components/ShopOrders";
import { gqlFetcher } from "@lib/gqlFetcher";
import { SHOPS_QUERY } from "@graphql/shops";
import { ORDER_COUNT_QUERY } from "@graphql/orders";
import useSWR from "swr";
import { checkAuth, gqlClient } from "@lib/checkAuth";
import { CHANNELS_QUERY } from "@graphql/channels";

export default function HomePage({ shops, channels }) {
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

  const { data: pendingCount, error } = useSWR(
    [
      ORDER_COUNT_QUERY,
      JSON.stringify({ where: { status: { equals: "PENDING" } } }),
    ],
    gqlFetcher
  );

  const { data: progressCount } = useSWR(
    [
      ORDER_COUNT_QUERY,
      JSON.stringify({ where: { status: { equals: "INPROCESS" } } }),
    ],
    gqlFetcher
  );

  const { data: awaitingCount } = useSWR(
    [
      ORDER_COUNT_QUERY,
      JSON.stringify({ where: { status: { equals: "AWAITING" } } }),
    ],
    gqlFetcher
  );

  const { data: backCount } = useSWR(
    [
      ORDER_COUNT_QUERY,
      JSON.stringify({ where: { status: { equals: "BACKORDERED" } } }),
    ],
    gqlFetcher
  );

  const { data: compCount } = useSWR(
    [
      ORDER_COUNT_QUERY,
      JSON.stringify({ where: { status: { equals: "COMPLETE" } } }),
    ],
    gqlFetcher
  );

  const sideData = [
    {
      label: "Pending",
      component: (
        <OSOrders key="PENDING" shops={shopData?.shops} status="PENDING" />
      ),
      count: pendingCount?.ordersCount,
    },
    {
      label: "Processing",
      component: (
        <OSOrders
          key="INPROCESS"
          shops={shopData?.shops}
          status="INPROCESS"
          defaultPerPage={100}
        />
      ),
      count: progressCount?.ordersCount,
    },
    {
      label: "Awaiting Tracking",
      component: (
        <OSOrders
          key="AWAITING"
          shops={shopData?.shops}
          status="AWAITING"
          defaultPerPage={100}
        />
      ),
      count: awaitingCount?.ordersCount,
    },
    {
      label: "Backordered",
      component: (
        <OSOrders
          key="BACKORDERED"
          shops={shopData?.shops}
          status="BACKORDERED"
          defaultPerPage={100}
        />
      ),
      count: backCount?.ordersCount,
    },
    {
      label: "Complete",
      component: (
        <OSOrders
          key="COMPLETE"
          shops={shopData?.shops}
          status="COMPLETE"
          defaultPerPage={100}
        />
      ),
      count: compCount?.ordersCount,
    },
    {
      label: "All Orders",
      component: <ShopOrders key="ALL" shops={shopData?.shops} />,
    },
  ];

  return (
    <AppShell data={sideData} activeTab={activeTab} setActiveTab={setActiveTab}>
      {sideData[activeTab].component}
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
