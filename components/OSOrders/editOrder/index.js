import React, { useState } from "react";
import {
  TextInput,
  Button,
  Text,
  Group,
  Drawer,
  useMantineTheme,
  Box,
  Select,
  Modal,
  Tooltip,
} from "@mantine/core";
import useSWR, { mutate } from "swr";
import { ORDER_COUNT_QUERY, UPDATE_ORDER } from "@graphql/orders";
import { request } from "graphql-request";
import { useNotifications } from "@mantine/notifications";
import { CartItemSelect } from "@components/CreateViews/CreateOrderView/CartItemSelect";
import { ChannelSelect } from "@components/CreateViews/CreateOrderView/ChannelSelect";
import { LineItemSelect } from "@components/CreateViews/CreateOrderView/LineItemSelect";
import { ShopSelect } from "@components/CreateViews/CreateOrderView/ShopSelect";
import { SHOPS_QUERY } from "@graphql/shops";
import { gqlFetcher } from "@lib/gqlFetcher";
import { CHANNELS_QUERY } from "@graphql/channels";
import { useForm, formList } from "@mantine/form";
import { ChevronDownIcon } from "@primer/octicons-react";
import isPlainObject from "lodash.isplainobject";
import isEqual from "lodash.isequal";
import reduce from "lodash.reduce";
import {
  CREATE_CARTITEM,
  DELETE_CARTITEM_MUTATION,
  UPDATE_CARTITEM,
} from "@graphql/cartItems";
import {
  CREATE_LINEITEM,
  DELETE_LINEITEM_MUTATION,
  UPDATE_LINEITEM,
} from "@graphql/lineItems";

export function EditOrder({ isOpen, onClose, order, mutateOrders }) {
  const notifications = useNotifications();

  const { data: shopData } = useSWR(SHOPS_QUERY, gqlFetcher);

  const { data: channelData, error } = useSWR(CHANNELS_QUERY, gqlFetcher);

  const [loading, setLoading] = useState(false);

  const theme = useMantineTheme();

  const {
    status,
    first_name,
    last_name,
    email,
    streetAddress1,
    streetAddress2,
    city,
    state,
    zip,
    country,
    lineItems,
    cartItems,
  } = order;

  const initialValues = {
    status,
    first_name,
    last_name,
    email,
    streetAddress1,
    streetAddress2,
    city,
    state,
    zip,
    country,
    shopId: order?.shop?.id ?? shopData?.shops[0]?.id,
    channelId: channelData?.channels[0]?.id,
    lineItems: formList(
      lineItems?.map(({ name, ...item }) => ({
        title: name,
        ...item,
      })) ?? []
    ),
    cartItems: formList(
      cartItems?.map(({ name, ...item }) => ({
        title: name,
        ...item,
      })) ?? []
    ),
  };

  const form = useForm({
    initialValues,
  });

  const shop = shopData?.shops.find((shop) => shop.id === form.values.shopId);
  const channel = channelData?.channels.find(
    (channel) => channel.id === form.values.channelId
  );

  const diff = function (obj1, obj2) {
    return reduce(
      obj1,
      function (result, value, key) {
        if (isPlainObject(value)) {
          result[key] = diff(value, obj2[key]);
        } else if (!isEqual(value, obj2[key])) {
          result[key] = value;
        }
        return result;
      },
      {}
    );
  };

  function getDifference(array1, array2) {
    return array1.filter((object1) => {
      return !array2.some((object2) => {
        return object1.id === object2.id;
      });
    });
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    console.log(values);

    const { lineItems, cartItems, channelId, ...updatedValues } = diff(
      values,
      initialValues
    );

    console.log({ updatedValues });
    try {
      if (lineItems) {
        const lineItemsToDelete = getDifference(
          initialValues.lineItems,
          form.values.lineItems
        );
        if (lineItemsToDelete) {
          for (const {
            id,
            order: lineOrder,
            channel,
            title,
            ...restItem
          } of lineItemsToDelete) {
            if (id) {
              await request("/api/graphql", DELETE_LINEITEM_MUTATION, {
                id,
              });
            }
          }
        }
        for (const {
          id,
          order: lineOrder,
          title,
          quantity,
          ...restItem
        } of lineItems) {
          if (id) {
            console.log("if called", id);
            await request("/api/graphql", UPDATE_LINEITEM, {
              id,
              data: {
                quantity,
              },
            });
          } else {
            console.log("else called", restItem);
            await request("/api/graphql", CREATE_LINEITEM, {
              data: {
                ...restItem,
                name: title,
                quantity,
                order: { connect: { id: order.id } },
              },
            });
          }
        }
      }
      if (cartItems) {
        const cartItemsToDelete = getDifference(
          initialValues.cartItems,
          form.values.cartItems
        );
        if (cartItemsToDelete) {
          for (const {
            id,
            order: cartOrder,
            channel,
            title,
            ...restItem
          } of cartItemsToDelete) {
            if (id) {
              await request("/api/graphql", DELETE_CARTITEM_MUTATION, {
                id,
              });
            }
          }
        }
        for (const {
          id,
          order: cartOrder,
          channel,
          title,
          quantity,
          ...restItem
        } of cartItems) {
          if (id) {
            console.log("if called", id);
            await request("/api/graphql", UPDATE_CARTITEM, {
              id,
              data: {
                quantity,
              },
            });
          } else {
            console.log("else called", restItem);
            await request("/api/graphql", CREATE_CARTITEM, {
              data: {
                ...restItem,
                name: title,
                quantity,
                order: { connect: { id: order.id } },
                channel: { connect: { id: channel.id } },
              },
            });
          }
        }
      }
      if (Object.keys(updatedValues).length > 0) {
        const { shopId, ...restUpdated } = updatedValues;
        const res = await request("/api/graphql", UPDATE_ORDER, {
          id: order.id,
          data: {
            ...(shopId && { shop: { connect: { id: shopId } } }),
            ...restUpdated,
          },
        });
      }

      if (updatedValues.status) {
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "PENDING" } } }),
        ]);
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "INPROCESS" } } }),
        ]);
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "AWAITING" } } }),
        ]);
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: "BACKORDERED" } } }),
        ]);
      }
      console.log("called");
      const hello = await mutateOrders();
      console.log({ hello });
      notifications.showNotification({
        title: `Order has been updated.`,
      });
      onClose();
    } catch (error) {
      setLoading(false);
      notifications.showNotification({
        title: error.response.errors[0].extensions.code,
        message: error.response.errors[0].message,
        color: "red",
      });
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <Text
          weight={600}
          size="xl"
          // transform="uppercase"
          color="gray"
          sx={
            {
              // fontWeight: 700,
              // letterSpacing: 0.6,
            }
          }
        >
          Edit Order
        </Text>
      }
      styles={{
        inner: { padding: 20 },
        // modal: { height: "100%" },
        // body: { minHeight: "100%" },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Group align={"flex-start"}>
          <Box sx={{ width: "100%", flex: 1 }}>
            <TextInput
              placeholder="Empty field"
              label="First Name"
              {...form.getInputProps("first_name")}
            />
            <TextInput
              mt="md"
              placeholder="Empty field"
              label="Last Name"
              {...form.getInputProps("last_name")}
            />
            <TextInput
              mt="md"
              placeholder="Empty field"
              label="Street Address"
              {...form.getInputProps("streetAddress1")}
            />
            <TextInput
              mt="md"
              placeholder="Empty field"
              label="Apt, Suite, etc."
              {...form.getInputProps("streetAddress2")}
            />
            <TextInput
              mt="md"
              placeholder="Empty field"
              label="City"
              {...form.getInputProps("city")}
            />
            <TextInput
              mt="md"
              placeholder="Empty field"
              label="State"
              {...form.getInputProps("state")}
            />
            <TextInput
              mt="md"
              placeholder="Empty field"
              label="Zip"
              {...form.getInputProps("zip")}
            />
            <TextInput
              mt="md"
              placeholder="Empty field"
              label="Country"
              {...form.getInputProps("country")}
            />
            {/* {error && (
          <Text color="red" size="sm" mt="sm">
            {error}
          </Text>
        )} */}
          </Box>
          <Box sx={{ width: "100%", flex: 1 }}>
            <Select
              label="Status"
              placeholder="Pick one"
              // itemComponent={SelectItem}
              data={[
                "PENDING",
                "INPROCESS",
                "AWAITING",
                "BACKORDERED",
                "COMPLETE",
              ]}
              maxDropdownHeight={400}
              nothingFound="Nobody here"
              // defaultValue={status}
              // variant="unstyled"
              size="md"
              styles={{
                root: {
                  position: "relative",
                },

                input: {
                  fontWeight: 600,
                  color:
                    theme.colorScheme === "light"
                      ? theme.colors.blue[7]
                      : theme.colors.dark[0],
                  height: "auto",
                  paddingTop: 18,
                  paddingLeft: 13,
                  border: `1px solid ${
                    theme.colors.blueGray[theme.colorScheme === "dark" ? 7 : 2]
                  }`,
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                  // fontSize: "16px !important",
                  background:
                    theme.colorScheme === "dark"
                      ? theme.colors.dark[5]
                      : theme.fn.lighten(theme.colors.blueGray[0], 0.5),
                  "&:focus, &:focus-within": {
                    outline: "none",
                    borderColor: `${
                      theme.colors[theme.primaryColor][
                        theme.colorScheme === "dark" ? 8 : 5
                      ]
                    } !important`,
                  },
                },

                required: {
                  display: "none",
                  // ":before": { marginLeft: "auto", content: '" required"' },
                },

                error: {
                  fontSize: 14,
                },

                label: {
                  position: "absolute",
                  pointerEvents: "none",
                  color:
                    theme.colors.blueGray[theme.colorScheme === "dark" ? 2 : 6],
                  fontSize: theme.fontSizes.xs,
                  paddingLeft: 14,
                  paddingTop: 6,
                  zIndex: 1,
                },
                item: {
                  fontWeight: 600,
                  marginTop: 3,
                },
              }}
              // rightSection={<ArrowDownIcon />}
              {...form.getInputProps("status")}
            />
            {shopData?.shops.length > 0 && (
              <ShopSelect
                // {...form.getInputProps("shopId")}
                value={form.getInputProps("shopId").value}
                onChange={(event) => {
                  form.setFieldValue("lineItems", formList([]));
                  form.getInputProps("shopId").onChange(event);
                }}
                error={form.getInputProps("shopId").error}
                shops={shopData?.shops}
                form={form}
                mt="md"
                size="md"
                label="Shop"
              />
            )}

            {shop?.searchProductsEndpoint ? (
              <LineItemSelect form={form} shop={shop} />
            ) : (
              <Tooltip
                label="Search products needs to be activated for this shop."
                position="bottom"
                color="red"
                sx={{ width: "100%" }}
              >
                <Box sx={{ pointerEvents: "none" }}>
                  <LineItemSelect form={form} shop={shop} />
                </Box>
              </Tooltip>
            )}
            {channel?.searchProductsEndpoint && (
              <CartItemSelect
                form={form}
                channel={channel}
                rightSection={
                  channelData?.channels.length > 0 && (
                    <ChannelSelect
                      // {...form.getInputProps("shopId")}
                      value={form.getInputProps("channelId").value}
                      onChange={(event) => {
                        form.getInputProps("channelId").onChange(event);
                      }}
                      error={form.getInputProps("channelId").error}
                      channels={channelData?.channels}
                      form={form}
                      type="sm"
                      size="xs"
                      rightSection={
                        <Box
                          component={ChevronDownIcon}
                          size={10}
                          sx={{
                            color:
                              theme.colorScheme === "light"
                                ? theme.colors.blue[5]
                                : theme.colors.dark[0],
                          }}
                        />
                      }
                    />
                  )
                }
              />
            )}
          </Box>
        </Group>
        <Box sx={{ display: "flex", width: "100%" }}>
          <Button
            // color="indigo"
            type="submit"
            uppercase
            // variant="light"
            mt={30}
            ml="auto"
            size="md"
            loading={loading}
            variant="gradient"
            gradient={{
              from: theme.colors.emerald[5],
              to: theme.colors.emerald[6],
              deg: 135,
            }}
            sx={{
              fontWeight: 700,
              letterSpacing: 0.6,
              //   border: `1px solid ${
              //     theme.colorScheme === "light" && theme.colors.green[1]
              //   }`,
              boxShadow: theme.shadows.xs,
            }}
          >
            Update Order
          </Button>
        </Box>
      </form>
    </Modal>
  );
}
