import React from "react";
import { Group, Paper, Stack, Text, useMantineTheme } from "@mantine/core";
import { useNotifications } from "@mantine/notifications";
import { EditEndpoint } from "./EditEndpoint";

export const Endpoints = ({
  shopId,
  searchOrdersEndpoint,
  searchProductsEndpoint,
  updateProductEndpoint,
}) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();

  const functions = [
    {
      label: "Search Orders",
      description: "Endpoint to search shop orders",
      value: searchOrdersEndpoint,
      functionValue: "searchOrdersEndpoint",
    },
    {
      label: "Search Products",
      description: "Endpoint to search shop products",
      value: searchProductsEndpoint,
      functionValue: "searchProductsEndpoint",
    },
    {
      label: "Update Product",
      description: "Endpoint to update shop products",
      value: updateProductEndpoint,
      functionValue: "updateProductEndpoint",
    },
  ];

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
          Endpoints
        </Text>
        <Text size="xs" color="dimmed">
          Control how Openship interacts with your shop
        </Text>
      </Stack>
      {functions.map((detail) => (
        <EditEndpoint detail={detail} shopId={shopId} />
      ))}
    </Paper>
  );
};
