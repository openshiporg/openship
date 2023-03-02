import React, { useState } from "react";
import { useForm } from "@mantine/hooks";
import {
  TextInput,
  Button,
  Text,
  LoadingOverlay,
  Drawer,
  useMantineTheme,
  Box,
} from "@mantine/core";
import { mutate } from "swr";
import { ORDER_COUNT_QUERY } from "@graphql/orders";
import { UPDATE_CARTITEM } from "@graphql/cartItems";
import { request } from "graphql-request";
import { useNotifications } from "@mantine/notifications";

export function EditCartItem({ isOpen, onClose, cartItem, mutateOrders }) {
  const notifications = useNotifications();

  const [loading, setLoading] = useState(false);

  const theme = useMantineTheme();

  const { name, error, purchaseId, url } = cartItem;

  const form = useForm({
    initialValues: {
      name,
      error,
      purchaseId,
      url,
    },
  });

  const handleSubmit = async ({ name, error, purchaseId, url }) => {
    setLoading(true);
    // setError(null);

    const res = await request("/api/graphql", UPDATE_CARTITEM, {
      id: cartItem.id,
      data: {
        name,
        error,
        purchaseId,
        url,
        // checkOrder: true,
      },
    })
      .then(async () => {
        await mutateOrders();
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
        notifications.showNotification({
          title: `Order has been updated.`,
        });
        onClose();
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

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title={
        <Text size="xl" weight={600}>
          Edit Cart Item
        </Text>
      }
      padding="xl"
      size="lg"
      position="right"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <LoadingOverlay visible={loading} />
        <TextInput
          mt="md"
          placeholder="Empty field"
          label="Name"
          {...form.getInputProps("name")}
        />
        <TextInput
          mt="md"
          placeholder="Empty field"
          label="Error"
          {...form.getInputProps("error")}
        />
        <TextInput
          mt="md"
          placeholder="Empty field"
          label="Purchase ID"
          {...form.getInputProps("purchaseId")}
        />
        <TextInput
          mt="md"
          placeholder="Empty field"
          label="URL"
          {...form.getInputProps("url")}
        />

        <Box sx={{ display: "flex", width: "100%" }}>
          <Button
            color="green"
            type="submit"
            uppercase
            variant="gradient"
            mt={30}
            ml="auto"
            size="md"
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
            Update Cart Item
          </Button>
        </Box>
      </form>
    </Drawer>
  );
}
