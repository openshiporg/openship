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
import { SHOPS_QUERY, UPDATE_SHOP_MUTATION } from "@graphql/shops";
import request from "graphql-request";
import { useNotifications } from "@mantine/notifications";

export const EditDetails = ({ detail, shopId }) => {
  const theme = useMantineTheme();
  const notifications = useNotifications();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(detail.value);
  const { mutate: mutateShops } = useSWR(SHOPS_QUERY, gqlFetcher);

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
        type={detail.type}
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
                    title: `Shop has been updated.`,
                    // message: JSON.stringify(data),
                  });
                  setEditMode(false);
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
        {detail.type === "password" ? "·································" : detail.value}
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
