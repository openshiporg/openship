import React, { useState } from "react";
import {
  Text,
  useMantineTheme,
  Button,
  Group,
  Badge,
  TextInput,
  Collapse as Coll,
  Box,
  Stack,
} from "@mantine/core";
import useSWR from "swr";
import { gqlFetcher } from "@lib/gqlFetcher";
import request from "graphql-request";
import { useNotifications } from "@mantine/notifications";
import { CHANNELS_QUERY, UPDATE_CHANNEL_MUTATION } from "@graphql/channels";

export const EditEndpoint = ({ detail, channelId }) => {
  const notifications = useNotifications();
  const theme = useMantineTheme();
  const [opened, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [endpoint, setEndpoint] = useState(detail.value);
  const { mutate: mutateChannels } = useSWR(CHANNELS_QUERY, gqlFetcher);


  return (
    <Stack
      spacing={0}
      sx={{
        width: "100%",
        borderTop: `1px solid ${
          theme.colorScheme === "light"
            ? theme.colors.blueGray[2]
            : theme.colors.dark[8]
        }`,
      }}
    >
      <Group
        spacing={0}
        px="sm"
        py="xs"
        sx={{ width: "100%" }}
        noWrap
        align="flex-start"
      >
        <Stack spacing={0} pr={50}>
          <Text
            size="sm"
            weight={600}
            color={theme.colors.blueGray[theme.colorScheme === "dark" ? 4 : 5]}
          >
            {detail.label}
          </Text>
          <Text size="xs" color="dimmed">
            {detail.description}
          </Text>
        </Stack>
        <Box ml="auto">
          <Badge
            ml="auto"
            radius={"sm"}
            color={!detail.value && "green"}
            onClick={() => setOpen((o) => !o)}
            sx={{
              border: `1px solid ${
                theme.colors[detail.value ? "blue" : "green"][
                  theme.colorScheme === "dark" ? 9 : 1
                ]
              }`,
              cursor: "pointer",
            }}
          >
            {detail.value ? "Active" : "Activate"}
          </Badge>
        </Box>
      </Group>
      <Coll in={opened} sx={{ width: "100%" }}>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (endpoint !== detail.value) {
              setLoading(true);
              let data = {};
              data[`${detail.functionValue}`] = endpoint;
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
                    title: `Endpoint has been updated.`,
                    // message: JSON.stringify(data),
                  });
                  setOpen(false);
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
          <TextInput
            placeholder="Endpoint"
            label="Endpoint"
            // icon={loading ? <Loader size={12} /> : <DotFillIcon size={10} />}
            rightSectionWidth={loading ? 26 : 70}
            pb="sm"
            px="sm"
            id="endpoint"
            spellcheck="false"
            
            rightSection={
              <Button
                color="cyan"
                variant={loading ? "subtle" : "light"}
                size="xs"
                sx={{
                  fontWeight: 700,
                  letterSpacing: -0.4,
                }}
                type="submit"
                loading={loading}
                radius="sm"
                mt="auto"
                mb={7}
                compact
                disabled={endpoint === detail.value}
              >
                {loading ? "" : "Update"}
              </Button>
            }
            size="sm"
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
          />
        </form>
      </Coll>
    </Stack>
  );
};
