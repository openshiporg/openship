import React, { useState } from "react";
import {
  Paper,
  Text,
  useMantineTheme,
  Group,
  ActionIcon,
  Collapse,
  Button,
  Stack,
} from "@mantine/core";
import { PlusIcon, XIcon } from "@primer/octicons-react";
import { useNotifications } from "@mantine/notifications";
import useSWR from "swr";
import { gqlFetcher } from "@lib/gqlFetcher";
import request from "graphql-request";
import {
  CREATE_LINK_MUTATION,
  DELETE_LINK_MUTATION,
  SHOPS_QUERY,
} from "@graphql/shops";
import { ChannelSelect } from "@components/CreateViews/CreateOrderView/ChannelSelect";

export const Links = ({ shopId, links, channelData }) => {
  const theme = useMantineTheme();
  const [opened, setOpen] = useState(false);

  return (
    <Paper radius="sm" withBorder sx={{ width: "100%" }}>
      <Group px="xs" py={5}>
        <Stack spacing={0}>
          <Text
            weight={600}
            size="sm"
            color={theme.colors.blueGray[theme.colorScheme === "dark" ? 3 : 7]}
          >
            Link
          </Text>
          <Text size="xs" color="dimmed">
            Create a channel link
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
      </Group>
      {/* <Collapse in={opened} sx={{ width: "100%" }}> */}
      <CreateLink
        shopId={shopId}
        setOpen={setOpen}
        opened={opened}
        channelData={channelData}
        link={links && links[0]}
      />
      {/* </Collapse> */}
      {/* {links.map((link) => (
        <EditLink
          key={link.id}
          shopId={shopId}
          link={link}
        />
      ))} */}
    </Paper>
  );
};

const CreateLink = ({ link, shopId, setOpen, opened, channelData }) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(link?.channel?.id);
  const { mutate: mutateShops } = useSWR(SHOPS_QUERY, gqlFetcher);

  console.log(value);
  console.log(link?.channel?.id);
  return (
    <Group
      spacing={0}
      // px="sm"
      pt="xs"
      sx={{
        width: "100%",
        borderTop: `1px solid ${
          theme.colorScheme === "light"
            ? theme.colors.blueGray[2]
            : theme.colors.dark[8]
        }`,
      }}
    >
      {channelData?.channels.length > 0 && (
        <ChannelSelect
          placeholder="None selected"
          label="Channel"
          // icon={loading ? <Loader size={12} /> : <DotFillIcon size={10} />}
          rightSectionWidth={loading ? 100 : 125}
          pb="sm"
          px="sm"
          id="endpoint"
          spellcheck="false"
          rightSection={
            <Group mt="auto" ml="auto" mr={7} mb={7} spacing={4}>
              <Button
                size="xs"
                ml="auto"
                color="gray"
                variant="subtle"
                onClick={() => setValue(undefined)}
                compact
                sx={{ display: value === undefined && "none" }}
              >
                Clear
              </Button>
              <Button
                color="cyan"
                variant={loading ? "subtle" : "light"}
                size="xs"
                sx={{
                  fontWeight: 700,
                  letterSpacing: -0.4,
                }}
                loading={loading}
                radius="sm"
                compact
                disabled={value === link?.channel?.id}
                onClick={async () => {
                  if (value !== link?.channel?.id) {
                    setLoading(true);
                    if (value) {
                      await request("/api/graphql", CREATE_LINK_MUTATION, {
                        data: {
                          shop: { connect: { id: shopId } },
                          channel: { connect: { id: value } },
                        },
                      })
                        .then(async ({ createLink: { shop: updateShop } }) => {
                          setLoading(false);
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
                            title: `Linked channel has been updated.`,
                          });
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
                    } else {
                      await request("/api/graphql", DELETE_LINK_MUTATION, {
                        id: link.id,
                      })
                        .then(async ({ deleteLink }) => {
                          setLoading(false);

                          await mutateShops(({ shops }) => {
                            const newData = [];
                            for (const item of shops) {
                              if (item.id === shopId) {
                                const filteredShop = {
                                  ...item,
                                  links: item.links.filter(
                                    (c) => c.id !== deleteLink.id
                                  ),
                                };
                                newData.push(filteredShop);
                              } else {
                                newData.push(item);
                              }
                            }
                            return {
                              shops: newData,
                            };
                          }, false);
                          notifications.showNotification({
                            title: `Linked channel has been updated.`,
                          });
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
                  }
                }}
              >
                {loading ? "" : "Update"}
              </Button>
            </Group>
          }
          size="sm"
          channels={[...channelData?.channels]}
          sx={{ width: "100%" }}
          value={value}
          onChange={setValue}
        />
      )}
    </Group>
  );
};
