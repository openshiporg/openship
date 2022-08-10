import React, { useState } from "react";
import {
  Text,
  useMantineTheme,
  Group,
  Box,
  ActionIcon,
  Input,
  Button,
  Loader,
  Badge,
  Stack,
} from "@mantine/core";
import { XIcon } from "@primer/octicons-react";
import {
  CHANNELS_QUERY,
  CREATE_CHANNEL_METAFIELD_MUTATION,
  DELETE_CHANNEL_MUTATION,
} from "@graphql/channels";
import { useNotifications } from "@mantine/notifications";
import useSWR from "swr";
import { gqlFetcher } from "@lib/gqlFetcher";
import request from "graphql-request";
import { useModals } from "@mantine/modals";

export const Dangerous = ({ channelId, name }) => {
  const [loading, setLoading] = useState(false);
  const { mutate: mutateChannels } = useSWR(CHANNELS_QUERY, gqlFetcher);

  const theme = useMantineTheme();
  const notifications = useNotifications();
  const modals = useModals();

  const openDeleteModal = () =>
    modals.openConfirmModal({
      title: (
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
          Delete {name}
        </Text>
      ),
      closeOnConfirm: false,
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete this channel? This action is
          destructive and will delete all data associated with this channel
          including orders, links, matches, etc.
        </Text>
      ),
      labels: { confirm: "Delete channel", cancel: "No don't delete it" },
      confirmProps: { color: "red", loading },
      // onCancel: () => console.log("Cancel"),
      onConfirm: async () =>
        await request("/api/graphql", DELETE_CHANNEL_MUTATION, {
          id: channelId,
        })
          .then(async () => {
            await mutateChannels(({ channels }) => {
              const newData = [];
              for (const item of channels) {
                if (item.id !== channelId) {
                  newData.push(item);
                }
              }
              return {
                channels: newData,
              };
            }, false);
            modals.closeAll();
            notifications.showNotification({
              title: `Channel has been deleted.`,
              // message: JSON.stringify(data),
            });
          })
          .catch((error) => {
            setLoading(false);
            notifications.showNotification({
              title: error.response.errors[0].extensions.code,
              message: error.response.errors[0].message,
              color: "red",
            });
          }),
    });

  return (
    <>
      <Text mb={-10} weight={600} color="red">
        Delete channel
      </Text>

      <Badge
        //   height={PRIMARY_COL_HEIGHT}
        radius="sm"
        //   shadow="xs"
        variant="outline"
        color="red"
        withBorder
        sx={{
          width: "100%",
          height: "100%",
          // background: "transparent",
          // border: `1px solid ${theme.colors.red[5]}`,
        }}
        px={0}
        py={1}
        styles={{ inner: { width: "100%", whiteSpace: "unset" } }}
      >
        <Group
          px="xs"
          py={5}
          sx={{ justifyContent: "space-between", maxWidth: "100%" }}
        >
          <Stack spacing={0}>
            <Text
              // color={theme.colors.red[theme.colorScheme === "dark" ? 4 : 6]}
              size="md"
              weight={400}
              sx={{ textTransform: "none" }}
            >
              Deleting the channel will permanently delete all data connected to
              this shop including orders, links, matches, etc. This action is
              irreversible.
            </Text>
          </Stack>
        </Group>
      </Badge>
      <Button onClick={openDeleteModal} color="red" size="md" compact>
        Delete channel
      </Button>
    </>
  );
};
