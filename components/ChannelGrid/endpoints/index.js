import React from "react";
import { Group, Paper, Stack, Text, useMantineTheme } from "@mantine/core";
import { useNotifications } from "@mantine/notifications";
import { EditEndpoint } from "./EditEndpoint";

export const Endpoints = ({
  channelId,
  searchProductsEndpoint,
  createPurchaseEndpoint,
}) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();

  const functions = [
    {
      label: "Search Products",
      description: "Endpoint to search channel products",
      value: searchProductsEndpoint,
      functionValue: "searchProductsEndpoint",
    },
    {
      label: "Create Purchase",
      description: "Endpoint to create channel purchase orders",
      value: createPurchaseEndpoint,
      functionValue: "createPurchaseEndpoint",
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
          Control how Openship interacts with your channel
        </Text>
      </Stack>
      {functions.map((detail) => (
        <EditEndpoint detail={detail} channelId={channelId} />
      ))}
    </Paper>
  );
};
