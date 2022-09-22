import React, { useState } from "react";
import { Option } from "@primitives/option";
import {
  ArrowRightIcon,
  PlusIcon,
  SearchIcon,
  DashIcon,
  CheckIcon,
} from "@primer/octicons-react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { gqlFetcher } from "@lib/gqlFetcher";
import { ORDER_COUNT_QUERY } from "@graphql/orders";
import { ORDERS_QUERY } from "@graphql/orders";
import { BULK_UPDATE_ORDERS } from "@graphql/orders";
import request from "graphql-request";
import { PLACE_ORDERS } from "@graphql/orders";
import {
  Box,
  Button,
  Divider,
  Group,
  Input,
  Menu,
  NumberInput,
  Paper,
  Skeleton,
  ActionIcon,
  Text,
  useMantineTheme,
  Container,
} from "@mantine/core";
import { OsOrderList } from "./osOrderList";
import { useSharedState } from "@lib/useSharedState";
import { useNotifications } from "@mantine/notifications";

export const OSOrders = ({ shops, status, defaultPerPage = 1 }) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();

  const [selectedShop, setSelectedShop] = useState();
  const [searchEntry, setSearchEntry] = useState("");
  const [orderPerPage, setOrderPerPage] = useState(defaultPerPage);
  const [skip, setSkip] = useState(0);
  const [numberOfOrder, setNumberOfOrder] = useState({
    name: "All",
    value: null,
  });

  const [showModal, setShowModal] = useSharedState("createModal");

  const orderPPList = [
    ...(status === "PENDING" ? [1] : []),
    25,
    50,
    100,
    200,
    1000,
  ];

  // const { isOpen, onToggle } = useDisclosure();

  const filteredShop =
    shops?.length > 0 && shops.filter(({ id }) => id === selectedShop)[0];

  const {
    data,
    error,
    mutate: mutateOrders,
  } = useSWR(
    [
      ORDERS_QUERY,
      JSON.stringify({
        where: {
          OR: [
            { orderName: { contains: searchEntry, mode: "insensitive" } },
            { first_name: { contains: searchEntry, mode: "insensitive" } },
            { last_name: { contains: searchEntry, mode: "insensitive" } },
            { streetAddress1: { contains: searchEntry, mode: "insensitive" } },
            { streetAddress2: { contains: searchEntry, mode: "insensitive" } },
            { city: { contains: searchEntry, mode: "insensitive" } },
            { state: { contains: searchEntry, mode: "insensitive" } },
            { zip: { contains: searchEntry, mode: "insensitive" } },
          ],
          shop: { id: { equals: filteredShop?.id } },
          status: { equals: status },
        },
        skip: parseInt(skip),
        take: parseInt(orderPerPage),
      }),
    ],
    gqlFetcher
  );

  const { data: orderCount, mutate: orderCountMutate } = useSWR(
    [
      ORDER_COUNT_QUERY,
      JSON.stringify({
        where: {
          orderName: { contains: searchEntry },
          shop: { id: { equals: filteredShop?.id } },
          status: { equals: status },
        },
      }),
    ],
    gqlFetcher
  );

  const ordersWithCart = data?.orders?.filter(
    ({ cartItems, orderError }) =>
      !orderError &&
      cartItems?.filter(
        (cItem) => cItem.status !== "CANCELLED" && !cItem.purchaseId
      ).length > 0
  );

  const count = orderCount?.ordersCount;

  const pageCount = Math.ceil(count / orderPerPage);

  const processOrders = async () => {
    const updateStatusToINPROCESS = await request(
      "/api/graphql",
      BULK_UPDATE_ORDERS,
      {
        data: ordersWithCart.map(({ id }) => ({
          where: { id },
          data: { status: "INPROCESS" },
        })),
      }
    )
      .then(async () => {
        await mutateOrders();
        await orderCountMutate();
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "PENDING" } } }),
        ]);
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "INPROCESS" } } }),
        ]);
      })
      .catch((error) => {
        notifications.showNotification({
          title: error.response.errors[0].extensions.code,
          message: error.response.errors[0].message,
          color: "red",
        });
      });

    const placeOrders = await request("/api/graphql", PLACE_ORDERS, {
      ids: ordersWithCart.map(({ id }) => id),
    })
      .then(async () => {
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "INPROCESS" } } }),
        ]);
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "AWAITING" } } }),
        ]);
      })
      .catch((error) => {
        notifications.showNotification({
          title: error.response.errors[0].extensions.code,
          message: error.response.errors[0].message,
          color: "red",
        });
      });
  };

  const ShopSelect = ({ shops }) => {
    if (!shops)
      return (
        <Box
          sx={{
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <Text
            size="sm"
            weight={500}
            color={theme.colors.dark[3]}
            transform="uppercase"
            mb={6}
            ml={2}
          >
            Shops
          </Text>
          <Group dir="row" spacing={7}>
            <Skeleton height={24} width={60} radius="sm" />
            <Skeleton height={24} width={60} radius="sm" />
            <Skeleton height={24} width={60} radius="sm" />
          </Group>
        </Box>
      );
    if (shops.length === 0)
      return (
        <Box p="sm">
          <Button
            rightIcon={<ArrowRightIcon />}
            color="green"
            compact
            uppercase
            variant="light"
            onClick={() => setShowModal("Shop")}
          >
            Add first shop
          </Button>
        </Box>
      );

    return (
      <Option
        title="Shops"
        options={[{ name: "All", value: "" }, ...shops].map((a) => ({
          name: a.name,
          value: a.id,
        }))}
        update={(a) => setSelectedShop(a)}
        selected={selectedShop}
        color="green"
      />
    );
  };

  return (
    <Container mt="xl" mb="xs" size="md" px="xs">
      <Paper withBorder sx={{ overflow: "hidden", maxWidth: 500 }}>
        <Group
          position="apart"
          sx={{
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 5,
            paddingBottom: 5,
          }}
        >
          <Text
            size="xs"
            transform="uppercase"
            sx={{
              color: theme.colors.blueGray[5],
              lineHeight: 1.5,
            }}
          >
            {orderPerPage === 1 ? "Order" : "Page"}{" "}
            {count === 0 ? 0 : Math.ceil(skip / orderPerPage) + 1} of{" "}
            {pageCount}
          </Text>
          <Group spacing={8}>
            {orderPerPage !== 1 && status === "PENDING" && (
              <Button
                onClick={processOrders}
                size="xs"
                compact
                variant="light"
                uppercase
                disabled={ordersWithCart?.length === 0}
                rightIcon={
                  <Box
                    sx={{
                      background:
                        ordersWithCart?.length === 0
                          ? theme.colors.gray[5]
                          : theme.colors.blue[5],
                      color: theme.white,
                      paddingLeft: 6,
                      paddingRight: 6,
                      paddingTop: 3,
                      paddingBottom: 3,
                      fontSize: 10,
                      borderRadius: 3,
                      marginRight: -3,
                      marginLeft: -4,
                    }}
                  >
                    {ordersWithCart?.length}
                  </Box>
                }
              >
                Process
              </Button>
            )}
            <Menu
              sx={{ height: 28 }}
              control={
                <Button
                  size="xs"
                  compact
                  variant="light"
                  uppercase
                  color="green"
                >
                  {orderPerPage === 1
                    ? "PLAY MODE"
                    : `${orderPerPage}${" "} PER PAGE`}
                </Button>
              }
            >
              {orderPPList.map((item) => (
                <Menu.Item
                  key={item}
                  icon={
                    <Box
                      sx={{
                        color: orderPerPage === item ? "green" : "transparent",
                      }}
                    >
                      <CheckIcon />
                    </Box>
                  }
                  onClick={() => {
                    setOrderPerPage(item);
                    setSkip(0);
                  }}
                  sx={{
                    background:
                      orderPerPage === item
                        ? theme.fn.lighten(theme.colors.green[0], 0.5)
                        : "transparent",
                    fontWeight: orderPerPage === item && 600,
                  }}
                >
                  {item === 1 ? "Play Mode" : `${item}${" "}per page`}
                </Menu.Item>
              ))}
            </Menu>
            <Box>
              <Group
                spacing={0}
                sx={{ borderWidth: 1, borderColor: theme.colors.dark[1] }}
              >
                <ActionIcon
                  color="cyan"
                  variant="light"
                  size="sm"
                  onClick={() => skip !== 0 && setSkip(skip - orderPerPage * 1)}
                  sx={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  }}
                >
                  <DashIcon />
                </ActionIcon>
                <NumberInput
                  hideControls
                  size="xs"
                  styles={{
                    input: {
                      width:
                        (Math.ceil(skip / orderPerPage).toString().length + 1) *
                        14,
                      padding: 0,
                      textAlign: "center",
                      borderRadius: 0,
                      border: 0,
                    },
                  }}
                  variant="unstyled"
                  defaultValue={Math.ceil(skip / orderPerPage) + 1}
                  key={Math.ceil(skip / orderPerPage) + 1}
                  // value={skip + 1}
                  min={1}
                  max={pageCount ?? 9999}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      if (
                        e.target.value !== "" &&
                        e.target.value !== "0" &&
                        parseInt(e.target.value) - 1 < pageCount
                      ) {
                        setSkip(e.target.value * orderPerPage - 1);
                      }
                    }
                  }}
                />
                <ActionIcon
                  color="cyan"
                  variant="light"
                  onClick={() => setSkip(skip + orderPerPage * 1)}
                  disabled={
                    count === 0 ||
                    Math.ceil(skip / orderPerPage) + 1 === pageCount
                  }
                  sx={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  }}
                  size="sm"
                >
                  <PlusIcon />
                </ActionIcon>
              </Group>
            </Box>
          </Group>
        </Group>
        <Divider />
        <Input
          sx={{ margin: 8 }}
          icon={<SearchIcon />}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              setSearchEntry(e.target.value);
            }
          }}
        />
        <Divider />
        <ShopSelect shops={shops} />
        {!data && <Skeleton />}
        {error && <Box>Something went wrong. Please try again later.</Box>}

        <OsOrderList
          data={data}
          mutateOrders={mutateOrders}
          orderCountMutate={orderCountMutate}
          status={status}
          orderPerPage={orderPerPage}
        />
      </Paper>
    </Container>
  );
};
