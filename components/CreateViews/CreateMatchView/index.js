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
} from "@mantine/core";
import { useNotifications } from "@mantine/notifications";
import { ChevronDownIcon } from "@primer/octicons-react";
import { useSharedState } from "keystone/lib/useSharedState";
import { removeEmpty } from "keystone/lib/removeEmpty";
import { ShopProductSearch } from "./ShopProductSearch";
import { ShopSelect } from "./ShopSelect";
import { ChannelProductSearch } from "./ChannelProductSearch";
import { ChannelSelect } from "./ChannelSelect";
import { GET_MATCH_QUERY, OVERWRITEMATCH_MUTATION } from "@graphql/matches";
import request from "graphql-request";
import { mutate } from "swr";

export const CreateMatchView = ({
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

  const initialValues = {
    shopId: shopData?.shops[0]?.id,
    channelId: channelData?.channels[0]?.id,
    channelProducts: formList([]),
    shopProducts: formList([]),
  };

  const form = useForm({
    initialValues,
  });

  const handleSubmit = async (values) => {
    setLoading(true);

    const input = values.shopProducts.map(
      ({ productId, variantId, quantity, shop }) => ({
        productId: { equals: productId },
        variantId: { equals: variantId },
        quantity: { equals: quantity },
        shop: { id: { equals: shop.id } },
      })
    );

    const output = values.channelProducts.map(
      ({ productId, variantId, quantity, price, channel }) => ({
        productId: { equals: productId },
        variantId: { equals: variantId },
        quantity: { equals: quantity },
        price: { equals: price },
        channel: { id: { equals: channel.id } },
      })
    );

    const res = await request("/api/graphql", OVERWRITEMATCH_MUTATION, {
      input,
      output,
    })
      .then(async () => {
        setLoading(false);
        mutate([
          GET_MATCH_QUERY,
          input.map(({ variantId, productId, quantity }) => ({
            variantId: { equals: variantId },
            productId: { equals: productId },
            quantity: { equals: quantity },
          })),
        ]);
        notifications.showNotification({
          title: "Match creation successful",
          color: "blue",
        });
        form.reset();
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
      opened={showModal === "Match"}
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
          Create Match
        </Text>
      }
      styles={{
        inner: { padding: 20 },
        // modal: { height: "100%" },
        // body: { minHeight: "100%" },
      }}
    >
      {/* {JSON.stringify(form.values.channelProducts)} */}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {/* <LoadingOverlay visible={loading} /> */}
        <Group sx={{ justifyContent: "center" }} align="flex-start">
          <Box sx={{ width: "100%", flex: 1 }}>
            {/* {shopData?.shops.length > 0 && (
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
            )} */}
            {shop && shop.searchProductsEndpoint && (
              <ShopProductSearch
                form={form}
                shop={shop}
                rightSection={
                  shopData?.shops.length > 0 && (
                    <ShopSelect
                      // {...form.getInputProps("shopId")}
                      value={form.getInputProps("shopId").value}
                      onChange={(event) => {
                        form.getInputProps("shopId").onChange(event);
                      }}
                      error={form.getInputProps("shopId").error}
                      shops={shopData?.shops}
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
                                ? theme.colors.cyan[7]
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

          <Box sx={{ width: "100%", flex: 1 }}>
            {channel && channel.searchProductsEndpoint && (
              <ChannelProductSearch
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
                                ? theme.colors.indigo[7]
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
              from: theme.colors.violet[5],
              to: theme.colors.violet[9],
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
            Create Match
          </Button>
        </Box>
      </form>
    </Modal>
  );
};
