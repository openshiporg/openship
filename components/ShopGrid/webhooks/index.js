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
} from "@mantine/core";
import { EditMetafield } from "./EditWebhook";
import { GearIcon, PlusIcon, TrashIcon, XIcon } from "@primer/octicons-react";
import {
  CHANNELS_QUERY,
  CREATE_CHANNEL_METAFIELD_MUTATION,
} from "@graphql/channels";
import { useNotifications } from "@mantine/notifications";
import useSWR from "swr";
import { gqlFetcher } from "@lib/gqlFetcher";
import request from "graphql-request";
import { SHOPS_QUERY, UPDATE_SHOP_MUTATION } from "@graphql/shops";

export const Webhooks = ({
  shopId,
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

  console.log({ url });
  const { data, error, mutate } = useSWR(url);
  const existingWebhooks = [...(data?.webhooks ? data.webhooks : [])];

  const recommendWebhooks = [
    {
      callbackUrl: `/api/triggers/create-order/${type}`,
      topic: "ORDER_CREATED",
    },
    {
      callbackUrl: `/api/triggers/cancel-order/${type}`,
      topic: "ORDER_CANCELLED",
    },
    {
      callbackUrl: `/api/triggers/cancel-order/${type}`,
      topic: "ORDER_CHARGEBACKED",
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
    <Paper radius="sm" withBorder sx={{ width: "100%" }}>
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
            shopId={shopId}
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
                  <Code>{webhook.topic}</Code>
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

function EditWebhookSettings({ setting, shopId, setOpen }) {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [endpoint, setEndpoint] = useState(setting.value);
  const { mutate: mutateShops } = useSWR(SHOPS_QUERY, gqlFetcher);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        if (endpoint !== setting.value) {
          setLoading(true);
          let data = {};
          data[`${setting.functionValue}`] = endpoint;
          await request("/api/graphql", UPDATE_SHOP_MUTATION, {
            id: shopId,
            data,
          })
            .then(async ({ updateShop }) => {
              setLoading(false);
              // console.log({ updateShop });
              await mutateShops(({ shops }) => {
                const newData = [];
                for (const item of shops) {
                  if (item.id === updateShop.id) {
                    newData.push(updateShop);
                  } else {
                    newData.push(item);
                  }
                }
                return {
                  shops: newData,
                };
              }, false);
              notifications.showNotification({
                title: `Endpoint has been updated.`,
                // message: JSON.stringify(data),
              });
              // setOpen(false);
            })
            .catch((error) => {
              console.log(error);
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
