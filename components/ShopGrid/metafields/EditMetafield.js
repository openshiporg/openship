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
              lineHeight: 1,
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
              lineHeight: 1,
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
                await request("/api/graphql", DELETE_SHOP_METAFIELD_MUTATION, {
                  where: { id: metafield.id },
                })
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
              // borderTopLeftRadius: theme.radius.sm,
              // borderBottomLeftRadius: theme.radius.sm,
            }}
            type="submit"
            // loading={true}
            // radius={0}
            styles={{
              subtle: {
                ":disabled": { backgroundColor: "transparent !important" },
              },
            }}
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
                await request("/api/graphql", UPDATE_SHOP_METAFIELD_MUTATION, {
                  id: metafield.id,
                  data,
                })
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
      noWrap
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
      <Box
        sx={{
          overflow: "hidden",
          flex: 1,
          maxWidth: "100%",
        }}
      >
        <Group spacing={8} ml={2} noWrap>
          {/* <Text size="sm" weight={400}>
            {metafield.value}
          </Text> */}
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

            {/* <ActionIcon
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
            </ActionIcon> */}
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
