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
  Stack,
} from "@mantine/core";
import { EditMetafield } from "./EditMetafield";
import { PlusIcon, XIcon } from "@primer/octicons-react";
import { SHOPS_QUERY, CREATE_SHOP_METAFIELD_MUTATION } from "@graphql/shops";
import { useNotifications } from "@mantine/notifications";
import useSWR from "swr";
import { gqlFetcher } from "keystone/lib/gqlFetcher";
import request from "graphql-request";

export const Metafields = ({ shopId, metafields }) => {
  const theme = useMantineTheme();
  const [opened, setOpen] = useState(false);

  return (
    <Paper radius="sm" withBorder sx={{ maxWidth: 600 }}>
      <Group px="xs" py={5}>
        <Stack spacing={0}>
          <Text
            weight={600}
            size="sm"
            color={theme.colors.blueGray[theme.colorScheme === "dark" ? 3 : 7]}
          >
            Metafields
          </Text>
          <Text size="xs" color="dimmed">
            Create shop-specific fields
          </Text>
        </Stack>
        <ActionIcon
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
        </ActionIcon>
      </Group>
      <Collapse in={opened} sx={{ width: "100%" }}>
        <CreateMetafield shopId={shopId} setOpen={setOpen} opened={opened} />
      </Collapse>
      {metafields.map((metafield) => (
        <EditMetafield
          key={metafield.id}
          shopId={shopId}
          metafield={metafield}
        />
      ))}
    </Paper>
  );
};

const CreateMetafield = ({ shopId, setOpen, opened }) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [key, setKey] = useState("");
  const { mutate: mutateShops } = useSWR(SHOPS_QUERY, gqlFetcher);

  return (
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
      }}
    >
      <Box sx={{ flexBasis: 150 }}>
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
              lineHeight: 1,
              color:
                theme.colors.blueGray[theme.colorScheme === "dark" ? 4 : 5],
            },
          }}
          ml={-2}
          autoFocus={opened}
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
              lineHeight: 1,
            },
          }}
        />
        <Group spacing={0} noWrap>
          {loading && <Loader size={14} color="cyan" mr={5} />}
          <Button
            size="xs"
            ml="auto"
            color="gray"
            variant="subtle"
            onClick={() => {
              setOpen(false);
              setValue("");
              setKey("");
            }}
            compact
          >
            Cancel
          </Button>
          <Button
            color="indigo"
            variant="subtle"
            size="xs"
            sx={{
              fontWeight: 700,
              letterSpacing: -0.4,
            }}
            type="submit"
            // loading={true}
            compact
            styles={{
              subtle: {
                ":disabled": { backgroundColor: "transparent !important" },
              },
            }}
            disabled={value === "" || key === ""}
            onClick={async (event) => {
              event.preventDefault();
              if (value && key) {
                setLoading(true);
                const data = {
                  ...(value && { value }),
                  ...(key && { key }),
                  shop: { connect: { id: shopId } },
                };
                await request("/api/graphql", CREATE_SHOP_METAFIELD_MUTATION, {
                  data,
                })
                  .then(async ({ createShopMetafield: { shop } }) => {
                    setLoading(false);
                    await mutateShops(({ shops }) => {
                      const newData = [];
                      for (const item of shops) {
                        if (item.id === shop.id) {
                          newData.push(shop);
                        } else {
                          newData.push(item);
                        }
                      }
                      return {
                        shops: newData,
                      };
                    }, false);
                    notifications.showNotification({
                      title: `Metafield has been created.`,
                      // message: JSON.stringify(data),
                    });
                    setOpen("");
                    setValue("");
                    setKey("");
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
            Create
          </Button>
        </Group>
      </Group>
    </Group>
  );
};
