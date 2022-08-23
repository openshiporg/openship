import React, { useState } from "react";
import {
  Text,
  useMantineTheme,
  Button,
  Group,
  Loader,
  Input,
  ActionIcon,
  Box,
} from "@mantine/core";
import useSWR from "swr";
import { gqlFetcher } from "@lib/gqlFetcher";
import { PencilIcon, TrashIcon, XIcon } from "@primer/octicons-react";
import request from "graphql-request";
import { useNotifications } from "@mantine/notifications";
import {
  CHANNELS_QUERY,
  DELETE_CHANNEL_METAFIELD_MUTATION,
  UPDATE_CHANNEL_METAFIELD_MUTATION,
} from "@graphql/channels";

export const EditMetafield = ({ metafield, channelId }) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(metafield.value);
  const [key, setKey] = useState(metafield.key);
  const { mutate: mutateChannels } = useSWR(CHANNELS_QUERY, gqlFetcher);

  return editMode ? (
    <Group
      spacing={0}
      px="sm"
      py="xs"
      sx={{
        borderTop: `1px solid ${
          theme.colorScheme === "light"
            ? theme.colors.blueGray[2]
            : theme.colors.dark[8]
        }`,
        "&:first-of-type": {
          borderTop: "none",
        },
      }}
    >
      <Box sx={{ flexBasis: 150 }}>
        {/* <Text
          size="sm"
          weight={600}
          color={theme.colors.blueGray[theme.colorScheme === "dark" ? 4 : 5]}
        >
          {customInput.key}
        </Text> */}
        <Input
          size="sm"
          variant="unstyled"
          placeholder="Key"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          styles={{
            wrapper: {
              width: "100%",
            },
            input: {
              minHeight: 0,
              height: 22,
              fontWeight: 600,
              color:
                theme.colors.blueGray[theme.colorScheme === "dark" ? 4 : 5],
            },
          }}
          ml={-2}
        />
      </Box>
      <Group spacing={0} sx={{ flex: 1 }} noWrap>
        <Input
          size="sm"
          variant="unstyled"
          placeholder="Value"
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
        <Group spacing={0} noWrap ml="md">
          <Button
            size="xs"
            ml="auto"
            color="gray"
            variant="subtle"
            onClick={() => {
              setEditMode(false);
              setValue(metafield.value);
              setKey(metafield.key);
            }}
            compact
          >
            Cancel
          </Button>
          <Button
            size="xs"
            ml="auto"
            color="red"
            variant="subtle"
            onClick={async (event) => {
              event.preventDefault();
              if (value && key) {
                setLoading(true);
                await request(
                  "/api/graphql",
                  DELETE_CHANNEL_METAFIELD_MUTATION,
                  {
                    where: { id: metafield.id },
                  }
                )
                  .then(async ({ deleteChannelMetafield }) => {
                    setLoading(false);

                    await mutateChannels(({ channels }) => {
                      const newData = [];
                      for (const item of channels) {
                        if (item.id === channelId) {
                          const filteredChannel = {
                            ...item,
                            metafields: item.metafields.filter(
                              (c) => c.id !== deleteChannelMetafield.id
                            ),
                          };
                          newData.push(filteredChannel);
                        } else {
                          newData.push(item);
                        }
                      }
                      return {
                        channels: newData,
                      };
                    }, false);
                    notifications.showNotification({
                      title: `Custom detail is deleted.`,
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
                  });
              }
            }}
            compact
          >
            Delete
          </Button>
          <Button
            color="cyan"
            variant="subtle"
            size="xs"
            sx={{
              fontWeight: 700,
              letterSpacing: -0.4,
            }}
            type="submit"
            styles={{
              subtle: {
                ":disabled": { backgroundColor: "transparent !important" },
              },
            }}
            // loading={true}
            compact
            disabled={value === metafield.value && key === metafield.key}
            onClick={async (event) => {
              event.preventDefault();
              if (value !== metafield.value || key !== metafield.key) {
                setLoading(true);
                const data = {
                  ...(value !== metafield.value && { value }),
                  ...(key !== metafield.key && { key }),
                };
                await request(
                  "/api/graphql",
                  UPDATE_CHANNEL_METAFIELD_MUTATION,
                  {
                    id: metafield.id,
                    data,
                  }
                )
                  .then(async ({ updateChannelMetafield: { channel } }) => {
                    setLoading(false);
                    await mutateChannels(({ channels }) => {
                      const newData = [];
                      for (const item of channels) {
                        if (item.id === channelId) {
                          newData.push(channel);
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
            {loading ? <Loader size={10} color="cyan" /> : "Save"}
          </Button>
        </Group>
      </Group>
    </Group>
  ) : (
    <Group
      spacing={0}
      px="sm"
      py="xs"
      sx={{
        borderTop: `1px solid ${
          theme.colorScheme === "light"
            ? theme.colors.blueGray[2]
            : theme.colors.dark[8]
        }`,
        "&:first-of-type": {
          borderTop: "none",
        },
      }}
      noWrap
    >
      <Box sx={{ flexBasis: 150 }}>
        <Text
          size="sm"
          weight={600}
          color={theme.colors.blueGray[theme.colorScheme === "dark" ? 4 : 5]}
        >
          {metafield.key}
        </Text>
      </Box>
      <Box
        sx={{
          overflow: "hidden",
          flex: 1,
          maxWidth: "100%",
        }}
      >
        <Group spacing={8} ml={2} noWrap>
          <Text
            size="sm"
            weight={400}
            sx={{
              flex: 1,
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {metafield.value}
          </Text>
          <Group spacing={0} noWrap ml="auto">
            {loading && <Loader size={14} color="cyan" mr={5} />}

            <Button
              color="indigo"
              variant="subtle"
              onClick={() => setEditMode(true)}
              size="xs"
              sx={{
                fontWeight: 700,
                letterSpacing: -0.4,
              }}
              radius="sm"
              compact
              ml="md"
            >
              Update
            </Button>
          </Group>
        </Group>
      </Box>
    </Group>
  );
};
