import { useState } from "react";
import {
  Box,
  Button,
  useMantineTheme,
  Divider,
  Text,
  Skeleton,
} from "@mantine/core";
import useSWR from "swr";

import { Order } from "@primitives/order";
import { LineItem } from "@primitives/lineItem";
import { CartItem } from "@primitives/cartItem";
import { Collapse } from "@primitives/collapse";
import { ArrowUpRightIcon, PlusIcon } from "@primer/octicons-react";
import { useSharedState } from "@lib/useSharedState";

export function OrderList({
  shopId,
  accessToken,
  domain,
  searchEntry,
  shopName,
  searchOrdersEndpoint,
  metafields
}) {
  const theme = useMantineTheme();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useSharedState("createModal");
  const [initialOrder, setInitialOrder] = useSharedState(
    "createOrderInitialState"
  );

  const metafieldsObject = Object.assign(
    {},
    ...metafields.map(({ key, value }) => ({ [key]: value }))
  );

  const params = new URLSearchParams({
    accessToken,
    domain,
    searchEntry,
    metafields: metafieldsObject
  }).toString();

  const url = `${searchOrdersEndpoint}?${params}`;

  const { data, error } = useSWR(url);

  if (error) {
    return <Box>Something went wrong. Please try again later.</Box>;
  }

  if (!data) return <Skeleton height={120} radius={0} />;

  const selectedOrderDetails = data?.orders?.filter(
    ({ id }) => id === selectedOrder
  )[0];

  return (
    <Box bg="white" borderTopWidth="1px">
      {data?.orders?.map(
        ({
          orderId,
          orderName,
          link,
          date,
          first_name,
          last_name,
          streetAddress1,
          streetAddress2,
          city,
          state,
          zip,
          lineItems,
          cartItems,
        }) => (
          <Collapse
            component={({ open, setOpen }) => (
              <Box
                key={orderId}
                sx={{
                  borderTop: `1px solid ${
                    theme.colorScheme === "light"
                      ? theme.colors.blueGray[2]
                      : theme.colors.dark[8]
                  }`,
                }}
              >
                <Order
                  key={orderId}
                  shopName={shopName}
                  title={orderName}
                  link={link}
                  date={date}
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
                      {", "}
                      {state} {zip}
                    </>
                  }
                  buttons={
                    <Button
                      variant="subtle"
                      leftIcon={<PlusIcon size={10} />}
                      color="indigo"
                      size="xs"
                      compact
                      uppercase
                      // radius="lg"
                      onClick={() => {
                        setShowModal("Order");
                        setInitialOrder({
                          shopId,
                          ...data?.orders?.filter(
                            (order) => order.orderId === orderId
                          )[0],
                        });
                        // setSelectedOrder(id);
                      }}
                      styles={{ leftIcon: { marginRight: 5 } }}
                    >
                      Add
                    </Button>
                  }
                />
                {open && (
                  <>
                    <Box
                      sx={{
                        // background:
                        //   theme.colorScheme === 'dark'
                        //     ? theme.fn.rgba(theme.colors.blue[7], 0.35)
                        //     : theme.colors.blue[0],
                        background: theme.fn.rgba(
                          theme.fn.themeColor(
                            "blue",
                            theme.colorScheme === "dark" ? 8 : 0
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
                            ? theme.colors.blue[0]
                            : theme.colors.blue[9]
                        }
                        mb={10}
                      >
                        Line Items
                      </Text>
                      {lineItems.map(
                        ({
                          name,
                          quantity,
                          price,
                          image,
                          productId,
                          variantId,
                          lineItemId,
                        }) => (
                          <LineItem
                            key={lineItemId}
                            image={image}
                            lineId={lineItemId}
                            title={name}
                            productId={productId}
                            variantId={variantId}
                            quantity={quantity}
                            price={price}
                          />
                        )
                      )}
                    </Box>
                    {/* {JSON.stringify(data?.orders)} */}
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
                              url,
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
                                  error={error}
                                  buttons={
                                    url && (
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
                                        href={url}
                                        target="_blank"
                                        // sx={{ padding: 0 }}
                                        rightIcon={<ArrowUpRightIcon />}
                                      >
                                        {status || "Order"}
                                      </Button>
                                    )
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
              </Box>
            )}
          />
        )
      )}
    </Box>
  );
}
