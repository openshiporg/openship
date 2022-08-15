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
  SHOPS_QUERY,
  DELETE_SHOP_METAFIELD_MUTATION,
  UPDATE_SHOP_METAFIELD_MUTATION,
} from "@graphql/shops";

export const EditMetafield = ({ metafield, shopId }) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(metafield.value);
  const [key, setKey] = useState(metafield.key);
  const { mutate: mutateShops } = useSWR(SHOPS_QUERY, gqlFetcher);

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
                  UPDATE_SHOP_METAFIELD_MUTATION,
                  {
                    id: metafield.id,
                    data,
                  }
                )
                  .then(async ({ updateShopMetafield: { shop } }) => {
                    setLoading(false);
                    await mutateShops(({ shops }) => {
                      const newData = [];
                      for (const item of shops) {
                        if (item.id === shopId) {
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
                      title: `Shop has been updated.`,
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
              setValue(metafield.value);
              setKey(metafield.key);
            }}
          >
            <XIcon size={14} />
          </ActionIcon>
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
      <Box sx={{ flex: 1 }}>
        <Group spacing={8} ml={2}>
          <Text size="sm" weight={400}>
            {metafield.value}
          </Text>
          <Group spacing={0} noWrap ml="auto">
            {loading && <Loader size={14} color="cyan" mr={5} />}
            <ActionIcon
              variant="light"
              color="red"
              size="sm"
              ml="auto"
              radius={0}
              sx={{
                borderTopLeftRadius: theme.radius.sm,
                borderBottomLeftRadius: theme.radius.sm,
              }}
              onClick={async (event) => {
                event.preventDefault();
                if (value && key) {
                  setLoading(true);
                  await request(
                    "/api/graphql",
                    DELETE_SHOP_METAFIELD_MUTATION,
                    {
                      where: { id: metafield.id },
                    }
                  )
                    .then(async ({ deleteShopMetafield }) => {
                      setLoading(false);

                      await mutateShops(({ shops }) => {
                        const newData = [];
                        for (const item of shops) {
                          if (item.id === shopId) {
                            const filteredShop = {
                              ...item,
                              metafields: item.metafields.filter(
                                (c) => c.id !== deleteShopMetafield.id
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
            >
              <TrashIcon size={12} />
            </ActionIcon>

            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              onClick={() => setEditMode(true)}
              ml="auto"
              radius={0}
              sx={{
                borderTopRightRadius: theme.radius.sm,
                borderBottomRightRadius: theme.radius.sm,
              }}
            >
              <PencilIcon size={12} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>
    </Group>
  );
};
