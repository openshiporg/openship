import React, { useState } from "react";
import {
  Skeleton,
  Paper,
  Text,
  Box,
  useMantineTheme,
  Divider,
  Button,
  Group,
  Input,
  Stack,
} from "@mantine/core";
import { CHANNEL_ORDERS_QUERY } from "@graphql/orders";
import useSWR from "swr";
import { gqlFetcher } from "keystone/lib/gqlFetcher";
import { Collapse } from "@primitives/collapse";
import { Order } from "@primitives/order";
import { CartItem } from "@primitives/cartItem";
import { ArrowRightIcon, SearchIcon } from "@primer/octicons-react";

export const Orders = ({ channelId }) => {
  const theme = useMantineTheme();
  const [searchEntry, setSearchEntry] = useState("");

  const {
    data,
    error,
    mutate: mutateOrders,
  } = useSWR(
    [
      CHANNEL_ORDERS_QUERY,
      JSON.stringify({
        where: {
          cartItems: {
            some: { channel: { id: { equals: channelId } } },
          },
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
        },
        cartItemsWhere: { channel: { id: { equals: channelId } } },
        // skip: parseInt(skip),
        take: 5,
      }),
    ],
    gqlFetcher
  );
  if (error) return <div>Failed to load</div>;

  return (
    <Paper
      //   height={PRIMARY_COL_HEIGHT}
      radius="sm"
      //   shadow="xs"
      withBorder
      sx={{ maxWidth: 600 }}
    >
      <Stack px="xs" py={5} spacing={0}>
        <Text
          weight={600}
          size="sm"
          color={theme.colors.blueGray[theme.colorScheme === "dark" ? 3 : 7]}
        >
          Orders
        </Text>
        <Text size="xs" color="dimmed">
          Search orders from Openship
        </Text>
      </Stack>
      <Divider />
      <Box p="xs">
        <Input
          variant="filled"
          icon={<SearchIcon />}
          size="md"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              setSearchEntry(e.target.value);
            }
          }}
        />
      </Box>
      {!data && (
        <>
          <Skeleton height={100} radius={0} animate={true} />
          <Divider />
          <Skeleton height={100} radius={0} animate={true} />
        </>
      )}
      {data?.orders.length === 0 && (
        <Text
          //   key={id}
          sx={{
            borderTop: `1px solid ${
              theme.colorScheme === "light"
                ? theme.colors.blueGray[2]
                : theme.colors.dark[8]
            }`,
          }}
          align="center"
          p="sm"
          color="dimmed"
        >
          No orders found
        </Text>
      )}
      {data?.orders?.map((order) => {
        const {
          id,
          orderId,
          shop,
          orderName,
          first_name,
          last_name,
          streetAddress1,
          streetAddress2,
          city,
          state,
          zip,
          createdAt,
          cartItems,
          lineItems,
          orderError,
        } = order;
        return (
          <Box
            key={id}
            sx={{
              borderTop: `1px solid ${
                theme.colorScheme === "light"
                  ? theme.colors.blueGray[2]
                  : theme.colors.dark[8]
              }`,
            }}
          >
            <Collapse
              key={id}
              //   defaultOpen={orderPerPage === 1 && true}
              component={({ open, setOpen }) => (
                <>
                  <Box>
                    <Order
                      key={id}
                      shopName={shop.name}
                      title={orderName}
                      link={`https://${shop.domain}/admin/orders/${orderId}`}
                      date={Intl.DateTimeFormat("en-US").format(
                        Date.parse(createdAt)
                      )}
                      open={open}
                      setOpen={setOpen}
                      address={
                        <>
                          {" "}
                          {first_name} {last_name}
                          <br />
                          {streetAddress1} {streetAddress2}
                          <br />
                          {city}
                          {state && ", "}
                          {state} {zip}
                        </>
                      }
                    />
                  </Box>
                  {open && (
                    <>
                      {cartItems?.length > 0 && (
                        <>
                          <Divider />
                          <Box
                            sx={{
                              // background:
                              //   theme.colorScheme === 'dark'
                              //     ? theme.fn.rgba(theme.colors.teal[9], .25)
                              //     : theme.colors.teal[0],
                              background: theme.fn.rgba(
                                theme.fn.themeColor(
                                  "teal",
                                  theme.colorScheme === "dark" ? 9 : 0
                                ),
                                theme.colorScheme === "dark" ? 0.25 : 1
                              ),

                              padding: 12,
                            }}
                          >
                            <Text
                              size="sm"
                              weight={600}
                              color={
                                theme.colorScheme === "dark"
                                  ? theme.colors.green[0]
                                  : theme.colors.green[9]
                              }
                              mb={10}
                            >
                              Cart Items
                            </Text>
                            {cartItems.map(
                              ({
                                id: cartId,
                                name,
                                quantity,
                                price,
                                image,
                                productId,
                                variantId,
                                purchaseId,
                                lineItemId,
                                channel,
                                url: cartURL,
                                error,
                                status,
                              }) => (
                                <Box pt={1} _first={{ pt: 0 }} key={cartId}>
                                  <CartItem
                                    image={image}
                                    lineId={lineItemId}
                                    title={name}
                                    productId={productId}
                                    variantId={variantId}
                                    purchaseId={purchaseId}
                                    quantity={quantity}
                                    price={price}
                                    channelName={channel?.name}
                                    buttons={
                                      <>
                                        {cartURL && (
                                          <Button
                                            component="a"
                                            variant="light"
                                            radius="sm"
                                            size="xs"
                                            compact
                                            uppercase
                                            color={
                                              status !== "CANCELLED"
                                                ? "teal"
                                                : "red"
                                            }
                                            styles={{
                                              rightIcon: { marginLeft: 5 },
                                            }}
                                            href={cartURL}
                                            target="_blank"
                                            // sx={{ padding: 0 }}
                                            rightIcon={<ArrowRightIcon />}
                                          >
                                            {status || "Order"}
                                          </Button>
                                        )}
                                      </>
                                    }
                                  />
                                </Box>
                              )
                            )}
                          </Box>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            />
          </Box>
        );
      })}
    </Paper>
  );
};
