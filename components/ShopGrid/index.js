import React from "react";
import {
  Container,
  useMantineTheme,
  Group,
  Stack,
  Tabs,
  Text,
  Button,
  Input,
  ThemeIcon,
  Loader,
} from "@mantine/core";
import Avatar from "boring-avatars";
import { Details } from "./details";
import { Endpoints } from "./endpoints";
import { Orders } from "./orders";
import { Metafields } from "./metafields";
import { Dangerous } from "./dangerous";
import { Links } from "./links";
import { Webhooks } from "./webhooks";
import {
  AlertIcon,
  ChecklistIcon,
  CodeIcon,
  EllipsisIcon,
  GlobeIcon,
  LinkIcon,
  WebhookIcon,
} from "@primer/octicons-react";
import { useHover } from "@mantine/hooks";
import { useState } from "react";
import request from "graphql-request";
import { SHOPS_QUERY, UPDATE_SHOP_MUTATION } from "@graphql/shops";
import { gqlFetcher } from "@lib/gqlFetcher";
import useSWR from "swr";
import { useNotifications } from "@mantine/notifications";

export function ShopGrid({
  id,
  name,
  type,
  domain,
  accessToken,
  channelData,
  searchOrdersEndpoint,
  searchProductsEndpoint,
  updateProductEndpoint,
  getWebhooksEndpoint,
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  metafields,
  links,
}) {
  const theme = useMantineTheme();

  return (
    <>
      {id && (
        // <Stack>
        //   <Stack
        //     spacing="md"
        //     align="flex-start"
        //     sx={{
        //       [theme.fn.largerThan("md")]: { flexDirection: "row" },
        //     }}
        //   >
        //     <Stack sx={{ flex: 1, width: "100%" }}>
        //       <Details
        //         shopId={id}
        //         name={name}
        //         type={type}
        //         domain={domain}
        //         accessToken={accessToken}
        //         channelData={channelData}
        //       />
        //       <Links shopId={id} links={links} channelData={channelData} />
        //       <Metafields shopId={id} metafields={metafields} />
        //       <Functions
        //         shopId={id}
        //         searchOrdersEndpoint={searchOrdersEndpoint}
        //         searchProductsEndpoint={searchProductsEndpoint}
        //         updateProductEndpoint={updateProductEndpoint}
        //       />
        //       <Webhooks
        //         shopId={id}
        //         type={type}
        //         domain={domain}
        //         accessToken={accessToken}
        //         getWebhooksEndpoint={getWebhooksEndpoint}
        //         createWebhookEndpoint={createWebhookEndpoint}
        //         deleteWebhookEndpoint={deleteWebhookEndpoint}
        //       />
        //     </Stack>
        //     <Stack sx={{ flex: 1, width: "100%" }}>
        //       <Orders shopId={id} />
        //     </Stack>
        //   </Stack>
        //   <Dangerous shopId={id} name={name} />
        // </Stack>
        <Stack spacing={0}>
          <EditName id={id} name={name} />
          <Tabs
            tabPadding="xl"
            styles={{
              body: { padding: 10 },
              tabsListWrapper: {
                background: theme.colorScheme === "light" ? "#fff" : "#000",
                paddingLeft: 11,
              },
              tabsList: {
                flexWrap: "nowrap",
                overflow: "auto",
                scrollbarWidth: "none",
              },
              // tabLabel:{
              //   fontWeight: 500,
              // },
              tabActive: {
                fontWeight: 500,
                // background: theme.colors.blueGray[0],
                // borderTopLeftRadius: 5,
                // borderTopRightRadius: 5
              },
            }}
          >
            <Tabs.Tab label="Details" icon={<ChecklistIcon size={14} />}>
              <Details
                shopId={id}
                name={name}
                type={type}
                domain={domain}
                accessToken={accessToken}
                channelData={channelData}
              />
            </Tabs.Tab>
            <Tabs.Tab label="Links" icon={<LinkIcon size={14} />}>
              <Links shopId={id} links={links} channelData={channelData} />
            </Tabs.Tab>
            <Tabs.Tab label="Metafields" icon={<EllipsisIcon size={14} />}>
              <Metafields shopId={id} metafields={metafields} />
            </Tabs.Tab>
            <Tabs.Tab label="Endpoints" icon={<CodeIcon size={14} />}>
              <Endpoints
                shopId={id}
                searchOrdersEndpoint={searchOrdersEndpoint}
                searchProductsEndpoint={searchProductsEndpoint}
                updateProductEndpoint={updateProductEndpoint}
              />
            </Tabs.Tab>
            <Tabs.Tab label="Webhooks" icon={<WebhookIcon size={14} />}>
              <Webhooks
                shopId={id}
                type={type}
                domain={domain}
                accessToken={accessToken}
                getWebhooksEndpoint={getWebhooksEndpoint}
                createWebhookEndpoint={createWebhookEndpoint}
                deleteWebhookEndpoint={deleteWebhookEndpoint}
              />
            </Tabs.Tab>
            <Tabs.Tab label="Orders" icon={<GlobeIcon size={14} />}>
              <Orders shopId={id} />
            </Tabs.Tab>
            <Tabs.Tab
              label="Dangerous"
              icon={<AlertIcon size={14} />}
              color="red"
            >
              <Dangerous shopId={id} name={name} />
            </Tabs.Tab>
          </Tabs>
        </Stack>
      )}
    </>
  );
}
const EditName = ({ name, id }) => {
  const theme = useMantineTheme();

  const { hovered, ref } = useHover();
  const [editMode, setEditMode] = useState(false);
  const [value, setValue] = useState(name);
  const [loading, setLoading] = useState(false);
  const { mutate: mutateShops } = useSWR(SHOPS_QUERY, gqlFetcher);
  const notifications = useNotifications();

  return (
    <Group
      spacing="xs"
      sx={{ background: theme.colorScheme === "light" ? "#fff" : "#000" }}
      px={23}
      pt={16}
      pb={5}
      ref={ref}
      noWrap
    >
      <ThemeIcon variant="outline" sx={{ border: "none" }}>
        <Avatar size={20} name={name} variant="marble" />
      </ThemeIcon>
      {editMode ? (
        <Group spacing={0} sx={{ width: "100%" }} noWrap>
          <Input
            size="sm"
            variant="unstyled"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            styles={{
              wrapper: {
                width: `${2 + value.length * 0.5}rem`,
              },
              input: {
                minHeight: 0,
                height: 31,
                lineHeight: 1,
                fontWeight: 600,
                fontSize: 20,
              },
            }}
            ml={-2}
            autoFocus
          />
          <Group spacing={2} noWrap mt={2}>
            <Button
              size="xs"
              ml="auto"
              color="gray"
              variant="subtle"
              onClick={() => {
                setEditMode(false);
                setValue(name);
              }}
              compact
            >
              Cancel
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
              styles={{
                subtle: {
                  ":disabled": {
                    backgroundColor: "transparent !important",
                  },
                },
              }}
              compact
              disabled={value === name}
              onClick={async (event) => {
                event.preventDefault();
                if (value !== name) {
                  setLoading(true);
                  let data = {};
                  data["name"] = value;
                  await request("/api/graphql", UPDATE_SHOP_MUTATION, {
                    id,
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
              {loading ? <Loader size={10} color="cyan" /> : "Save"}
            </Button>
          </Group>
        </Group>
      ) : (
        <Text size="xl" weight={600}>
          {name}
        </Text>
      )}
      {hovered && !editMode && (
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
          mt={2}
        >
          Update
        </Button>
      )}
    </Group>
  );
};
