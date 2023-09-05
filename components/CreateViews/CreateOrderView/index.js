import React, { useState } from "react";
import { useForm, formList } from "@mantine/form";
import {
  TextInput,
  Button,
  Text,
  useMantineTheme,
  Box,
  Select,
  Group,
  Tooltip,
  Modal,
  Checkbox,
} from "@mantine/core";
import { mutate } from "swr";
import { CREATE_ORDER, ORDER_COUNT_QUERY, UPDATE_ORDER } from "@graphql/orders";
import { request } from "graphql-request";
import { useNotifications } from "@mantine/notifications";
import { ChevronDownIcon } from "@primer/octicons-react";
import { LineItemSelect } from "./LineItemSelect";
import { ShopSelect } from "./ShopSelect";
import { CartItemSelect } from "./CartItemSelect";
import { ChannelSelect } from "./ChannelSelect";
import { useSharedState } from "keystone/lib/useSharedState";
import { removeEmpty } from "keystone/lib/removeEmpty";

export const CreateOrderView = ({
  showModal,
  setShowModal,
  shopData,
  channelData,
}) => {
  const notifications = useNotifications();

  const [loading, setLoading] = useState(false);
  const [initialOrder, setInitialOrder] = useSharedState(
    "createOrderInitialState"
  );

  const theme = useMantineTheme();

  const initialValues = initialOrder
    ? {
        status: "PENDING",
        orderName: initialOrder.orderName,
        first_name: initialOrder.first_name,
        last_name: initialOrder.last_name,
        email: initialOrder.email,
        streetAddress1: initialOrder.streetAddress1,
        streetAddress2: initialOrder.streetAddress2,
        city: initialOrder.city,
        state: initialOrder.state,
        zip: initialOrder.zip,
        country: initialOrder.country,
        shopId: initialOrder.shopId,
        channelId: channelData?.channels[0]?.id,
        lineItems: formList(
          initialOrder.lineItems?.map(({ name, ...item }) => ({
            title: name,
            ...item,
          })) ?? []
        ),
        cartItems: formList(
          initialOrder.cartItems?.map(({ name, ...item }) => ({
            title: name,
            ...item,
          })) ?? []
        ),
        processOrder: false,
      }
    : {
        status: "PENDING",
        orderName: "",
        first_name: "",
        last_name: "",
        email: "",
        streetAddress1: "",
        streetAddress2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
        shopId: shopData?.shops[0]?.id,
        channelId: channelData?.channels[0]?.id,
        lineItems: formList([]),
        cartItems: formList([]),
        processOrder: false,
      };

  const form = useForm({
    initialValues,
  });

  const handleSubmit = async (values) => {
    setLoading(true);

    const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

    const res = await request("/api/graphql", CREATE_ORDER, {
      data: removeEmpty({
        orderId: initialOrder?.orderId
          ? parseFloat(initialOrder.orderId.split("/").pop())
          : random(1, 3295438957843),
        status: values.status,
        orderName: values.orderName,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        streetAddress1: values.streetAddress1,
        streetAddress2: values.streetAddress2,
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        currency: "USD",
        shop: { connect: { id: values.shopId } },
        lineItems: {
          create: values.lineItems.map(
            ({ title, image, price, quantity, productId, variantId }) => ({
              name: title,
              image,
              price,
              quantity,
              productId,
              variantId,
            })
          ),
        },
        cartItems: {
          create: values.cartItems.map(
            ({
              title,
              image,
              price,
              quantity,
              productId,
              variantId,
              channel,
            }) => ({
              name: title,
              image,
              price,
              quantity,
              productId,
              variantId,
              channel: { connect: { id: channel.id } },
            })
          ),
        },
        ...(values.processOrder === "TRUE" && {
          linkOrder: true,
          matchOrder: true,
          processOrder: true,
        }),
      }),
    })
      .then(async () => {
        await mutate([
          ORDER_COUNT_QUERY,
          JSON.stringify({ where: { status: { equals: values.status } } }),
        ]);
        notifications.showNotification({
          title: `Order has been added.`,
        });
        setShowModal(false);
      })
      .catch((error) => {
        setLoading(false);
        notifications.showNotification({
          title: error.response.errors[0].extensions.code,
          message: error.response.errors[0].message,
          color: "red",
        });
      });
  };

  const shop = shopData?.shops.find((shop) => shop.id === form.values.shopId);
  const channel = channelData?.channels.find(
    (channel) => channel.id === form.values.channelId
  );

  return (
    <Modal
      opened={showModal === "Order"}
      onClose={() => setShowModal(false)}
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
          Create Order
        </Text>
      }
      styles={{
        inner: { padding: 20 },
        // modal: { height: "100%" },
        // body: { minHeight: "100%" },
      }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {/* <LoadingOverlay visible={loading} /> */}
        <Group align={"flex-start"}>
          <Box sx={{ width: "100%", flex: 1 }}>
            <TextInput
              placeholder="WS-12345"
              label="Order Name"
              {...form.getInputProps("orderName")}
            />
            <TextInput
              mt="md"
              placeholder="Bruce"
              label="First Name"
              {...form.getInputProps("first_name")}
            />
            <TextInput
              mt="md"
              placeholder="Wilson"
              label="Last Name"
              {...form.getInputProps("last_name")}
            />
            <TextInput
              mt="md"
              placeholder="brucewilson@gmail.com"
              label="Email"
              {...form.getInputProps("email")}
            />
            <TextInput
              mt="md"
              placeholder="1588 Nixon Avenue"
              label="Street Address"
              {...form.getInputProps("streetAddress1")}
            />
            <TextInput
              mt="md"
              placeholder="Apt. 1714"
              label="Apt, Suite, etc."
              {...form.getInputProps("streetAddress2")}
            />
            <TextInput
              mt="md"
              placeholder="Chattanooga"
              label="City"
              {...form.getInputProps("city")}
            />
            <TextInput
              mt="md"
              placeholder="TN"
              label="State"
              {...form.getInputProps("state")}
            />
            <TextInput
              mt="md"
              placeholder="37406"
              label="Zip"
              {...form.getInputProps("zip")}
            />
            <TextInput
              mt="md"
              placeholder="US"
              label="Country"
              {...form.getInputProps("country")}
            />
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

            {shop && shop.searchProductsEndpoint ? (
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
            {channel && channel.searchProductsEndpoint && (
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
                                ? theme.colors.blue[7]
                                : theme.colors.dark[0],
                          }}
                        />
                      }
                    />
                  )
                }
              />
            )}
            <Select
              label="Process Order"
              // itemComponent={SelectItem}
              data={["FALSE", "TRUE"]}
              maxDropdownHeight={400}
              nothingFound="Nobody here"
              defaultValue="FALSE"
              // variant="unstyled"
              size="md"
              mt={20}
              styles={{
                root: {
                  position: "relative",
                },

                input: {
                  fontWeight: 600,
                  color:
                    theme.colorScheme === "light"
                      ? theme.colors.gray[6]
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
              {...form.getInputProps("processOrder")}
            />
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
              from: theme.colors.indigo[5],
              to: theme.colors.indigo[9],
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
            Create Order
          </Button>
        </Box>
      </form>
    </Modal>
  );
};
