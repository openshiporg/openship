import React, { useState } from "react";
import {
  Paper,
  Text,
  useMantineTheme,
  Group,
  Box,
  ActionIcon,
  Collapse,
  Input,
  Button,
  Loader,
  Table,
  Code,
  Divider,
  TextInput,
  Stack,
  Tooltip,
} from "@mantine/core";
import {
  GearIcon,
  InfoIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@primer/octicons-react";
import { CHANNELS_QUERY, UPDATE_CHANNEL_MUTATION } from "@graphql/channels";
import { useNotifications } from "@mantine/notifications";
import useSWR from "swr";
import { gqlFetcher } from "keystone/lib/gqlFetcher";
import request from "graphql-request";

export const Webhooks = ({
  channelId,
  type,
  domain,
  accessToken,
  getWebhooksEndpoint,
  createWebhookEndpoint,
  deleteWebhookEndpoint,
}) => {
  const theme = useMantineTheme();
  const [opened, setOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [createLoading, setCreateLoading] = useState(null);
  const notifications = useNotifications();

  const showToggle = ({
    opened,
    getWebhooksEndpoint,
    createWebhookEndpoint,
    deleteWebhookEndpoint,
  }) => {
    if (
      !getWebhooksEndpoint ||
      !createWebhookEndpoint ||
      !deleteWebhookEndpoint
    ) {
      return true;
    }
    if (opened) {
      return opened;
    }
    return false;
  };

  const params = new URLSearchParams({
    accessToken,
    domain,
  }).toString();

  const url = `${getWebhooksEndpoint}?${params}`;

  const { data, error, mutate } = useSWR(url);
  const existingWebhooks = [...(data?.webhooks ? data.webhooks : [])];

  const recommendWebhooks = [
    {
      callbackUrl: `/api/triggers/cancel-purchase/${type}`,
      topic: "ORDER_CANCELLED",
      description:
        "When a purchase order is cancelled by the channel, Openship will mark the cart item as cancelled and move the order to PENDING to be processed again",
    },
    {
      callbackUrl: `/api/triggers/create-tracking/${type}`,
      topic: "TRACKING_CREATED",
      description:
        "When a purchase order is fulfilled by the channel, Openship will add this tracking to the order and the shop",
    },
  ].filter((item) => {
    return (
      existingWebhooks.filter((existItem) => {
        return (
          existItem.topic == item.topic &&
          existItem.callbackUrl == item.callbackUrl
        );
      }).length == 0
    );
  });

  const platformWebhookEndpoints = [
    {
      label: "Get webhooks endpoint",
      value: getWebhooksEndpoint,
      functionValue: "getWebhooksEndpoint",
    },
    {
      label: "Create webhook endpoint",
      value: createWebhookEndpoint,
      functionValue: "createWebhookEndpoint",
    },
    {
      label: "Delete webhook endpoint",
      value: deleteWebhookEndpoint,
      functionValue: "deleteWebhookEndpoint",
    },
  ];

  return (
    <Paper radius="sm" withBorder sx={{ maxWidth: 600 }}>
      <Group px="xs" py={5}>
        <Stack spacing={0}>
          <Text
            weight={600}
            size="sm"
            color={theme.colors.blueGray[theme.colorScheme === "dark" ? 3 : 7]}
          >
            Webhooks
          </Text>
          <Text size="xs" color="dimmed">
            Create platform webhooks to keep Openship in sync
          </Text>
        </Stack>
        {/* <ActionIcon
          variant="light"
          onClick={() => setOpen(!opened)}
          color="green"
          size={28}
          radius="sm"
          ml="auto"
          sx={{
            border: `1px solid ${
              theme.colors.green[theme.colorScheme === "dark" ? 9 : 1]
            }`,
          }}
          mr={2}
        >
          <PlusIcon size={16} />
        </ActionIcon> */}
        {getWebhooksEndpoint && createWebhookEndpoint && deleteWebhookEndpoint && (
          <ActionIcon
            variant="light"
            onClick={() => setOpen(!opened)}
            color="gray"
            size={28}
            radius="sm"
            ml="auto"
            sx={{
              border: `1px solid ${
                theme.colors.green[theme.colorScheme === "dark" ? 9 : 1]
              }`,
            }}
            mr={2}
          >
            <GearIcon size={14} />
          </ActionIcon>
        )}
      </Group>
      <Collapse
        in={
          !getWebhooksEndpoint ||
          !createWebhookEndpoint ||
          !deleteWebhookEndpoint
            ? true
            : opened
        }
        sx={{
          width: "100%",
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        }}
      >
        {/* <CreateWebhook
          setOpen={setOpen}
          opened={opened}
          domain={domain}
          accessToken={accessToken}
          callbackUrl={callbackUrl}
          setCallbackUrl={setCallbackUrl}
          topic={topic}
          setTopic={setTopic}
          mutateWebhooks={mutate}
        /> */}
        <Divider />
        <Text
          mx="md"
          my={8}
          size="sm"
          weight={500}
          sx={{
            color:
              theme.colorScheme === "dark"
                ? theme.colors.gray[0]
                : theme.colors.gray[6],
          }}
        >
          Webhook configuration
        </Text>
        {platformWebhookEndpoints.map((setting) => (
          <EditWebhookSettings
            setting={setting}
            channelId={channelId}
            setOpen={setOpen}
          />
        ))}
      </Collapse>
      <Divider />
      {getWebhooksEndpoint && createWebhookEndpoint && deleteWebhookEndpoint && (
        <Table>
          <thead>
            <tr>
              <th>Topic</th>
              <th>URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...existingWebhooks, ...recommendWebhooks].map((webhook) => (
              <Box
                component="tr"
                key={webhook.id}
                sx={{ opacity: !webhook.id && ".7" }}
              >
                <td>
                  <Group spacing="xs" noWrap>
                    <Code>{webhook.topic}</Code>
                    {webhook.description && (
                      <Tooltip
                        wrapLines
                        width={320}
                        transition="fade"
                        transitionDuration={200}
                        label={webhook.description}
                      >
                        <ActionIcon color="gray" size={12}>
                          <InfoIcon size={12} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </td>
                <td>
                  <Text sx={{ wordBreak: "break-word" }} size="xs">
                    {webhook.callbackUrl}
                  </Text>
                </td>
                <td>
                  {webhook.id ? (
                    <ActionIcon
                      variant="light"
                      onClick={async (event) => {
                        event.preventDefault();
                        setDeleteLoading(webhook.id);
                        const res = await fetch(`${deleteWebhookEndpoint}`, {
                          body: JSON.stringify({
                            accessToken,
                            domain,
                            webhookId: webhook.id,
                          }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                          method: "POST",
                        });

                        const { error, success } = await res.json();
                        setDeleteLoading(null);

                        if (error) {
                          setDeleteLoading(null);
                          notifications.showNotification({
                            title: `Webhook could not be deleted.`,
                            message: error,
                            color: "red",
                          });
                        } else {
                          setDeleteLoading(null);
                          await mutate();
                          notifications.showNotification({
                            title: `Webhook has been deleted.`,
                            // message: JSON.stringify(data),
                          });
                        }
                      }}
                      color="red"
                      size={20}
                      radius="sm"
                      ml="auto"
                      sx={{
                        border: `1px solid ${
                          theme.colors.red[theme.colorScheme === "dark" ? 9 : 1]
                        }`,
                      }}
                      mr={2}
                      loading={webhook.id === deleteLoading}
                    >
                      <XIcon size={12} />
                    </ActionIcon>
                  ) : (
                    <ActionIcon
                      variant="light"
                      // onClick={() => {
                      //   setOpen(true);
                      //   setCallbackUrl(webhook.callbackUrl);
                      //   setTopic(webhook.topic);
                      // }}
                      onClick={async (event) => {
                        event.preventDefault();
                        setCreateLoading(webhook.id);
                        const res = await fetch(`${createWebhookEndpoint}`, {
                          body: JSON.stringify({
                            accessToken,
                            domain,
                            endpoint: webhook.callbackUrl,
                            topic: webhook.topic,
                          }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                          method: "POST",
                        });

                        const { error, success } = await res.json();
                        setCreateLoading(null);

                        if (error) {
                          setCreateLoading(null);
                          notifications.showNotification({
                            title: `Webhook could not be created.`,
                            message: error,
                            color: "red",
                          });
                        } else {
                          setCreateLoading(null);
                          await mutate();
                          notifications.showNotification({
                            title: `Webhook has been created.`,
                            // message: JSON.stringify(data),
                          });
                        }
                      }}
                      color="blue"
                      size={20}
                      radius="sm"
                      ml="auto"
                      sx={{
                        border: `1px solid ${
                          theme.colors.blue[
                            theme.colorScheme === "dark" ? 9 : 1
                          ]
                        }`,
                      }}
                      mr={2}
                      loading={webhook.id === createLoading}
                    >
                      <PlusIcon size={12} />
                    </ActionIcon>
                  )}
                </td>
              </Box>
            ))}
          </tbody>
        </Table>
      )}
    </Paper>
  );
};

function EditWebhookSettings({ setting, channelId, setOpen }) {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [endpoint, setEndpoint] = useState(setting.value);
  const { mutate: mutateChannels } = useSWR(CHANNELS_QUERY, gqlFetcher);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (endpoint !== setting.value) {
          setLoading(true);
          let data = {};
          data[`${setting.functionValue}`] = endpoint;
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
              // setOpen(false);
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
        label={setting.label}
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
            disabled={endpoint === setting.value}
          >
            {loading ? "" : "Update"}
          </Button>
        }
        size="sm"
        value={endpoint}
        onChange={(event) => setEndpoint(event.target.value)}
      />
    </form>
  );
}
