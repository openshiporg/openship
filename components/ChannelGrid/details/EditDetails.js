import React, { useState } from "react";
import {
  Text,
  useMantineTheme,
  Button,
  Group,
  Loader,
  Input,
  ActionIcon,
} from "@mantine/core";
import useSWR from "swr";
import { gqlFetcher } from "@lib/gqlFetcher";
import { PencilIcon, XIcon } from "@primer/octicons-react";
import request from "graphql-request";
import { useNotifications } from "@mantine/notifications";
import { CHANNELS_QUERY, UPDATE_CHANNEL_MUTATION } from "@graphql/channels";

export const EditDetails = ({ detail, channelId }) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(detail.value);
  const { mutate: mutateChannels } = useSWR(CHANNELS_QUERY, gqlFetcher);

  return editMode ? (
    <Group spacing={0} sx={{ width: "100%" }} noWrap>
      <Input
        size="sm"
        variant="unstyled"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        styles={{
          wrapper: {
            width: "100%",
          },
          input: {
            minHeight: 0,
            height: 22,
          },
        }}
        autoFocus
      />
      <Group spacing={0} noWrap>
        <Button
          color="cyan"
          variant="light"
          size="xs"
          sx={{
            fontWeight: 700,
            letterSpacing: -0.4,
            borderTopLeftRadius: theme.radius.sm,
            borderBottomLeftRadius: theme.radius.sm,
          }}
          type="submit"
          // loading={true}
          radius={0}
          compact
          disabled={value === detail.value}
          onClick={async (event) => {
            event.preventDefault();
            if (value !== detail.value) {
              setLoading(true);
              let data = {};
              data[`${detail.functionValue}`] = value;
              await request("/api/graphql", UPDATE_CHANNEL_MUTATION, {
                id: channelId,
                data,
              })
                .then(async ({ updateChannel }) => {
                  setLoading(false);
                  await mutateChannels(({ channels }) => {
                    const newData = [];
                    for (const item of channels) {
                      if (item.id === updateChannel.id) {
                        newData.push(updateChannel);
                      } else {
                        newData.push(item);
                      }
                    }
                    return {
                      channels: newData,
                    };
                  }, false);
                  notifications.showNotification({
                    title: `Channel has been updated.`,
                    // message: JSON.stringify(data),
                  });
                  setEditMode(false);
                })
                .catch((error) => {
                  setLoading(false);
                  notifications.showNotification({
                    title: error.response.errors[0].extensions.code,
                    message: error.response.errors[0].message,
                    color: "red",
                  });
                });
            }
          }}
        >
          {loading ? <Loader size={10} color="cyan" /> : "Update"}
        </Button>
        <ActionIcon
          radius={0}
          sx={{
            borderTopRightRadius: theme.radius.sm,
            borderBottomRightRadius: theme.radius.sm,
          }}
          color="red"
          size="sm"
          variant="light"
          onClick={() => {
            setEditMode(false);
            setValue(detail.value);
          }}
        >
          <XIcon size={14} />
        </ActionIcon>
      </Group>
    </Group>
  ) : (
    <Group spacing={8} ml={2}>
      <Text size="sm" weight={400}>
        {detail.type === "password"
          ? "·································"
          : detail.value}
      </Text>
      <ActionIcon
        variant="light"
        color="blue"
        size="sm"
        onClick={() => setEditMode(true)}
        ml="auto"
      >
        <PencilIcon size={12} />
      </ActionIcon>
      {/* <Button
        color="blue"
        variant="light"
        onClick={() => setEditMode(true)}
        size="xs"
        sx={{
          fontWeight: 700,
          letterSpacing: -0.4,
        }}
        type="submit"
        radius="sm"
        compact
        ml="auto"
      >
        Edit
      </Button> */}
    </Group>
  );
};
