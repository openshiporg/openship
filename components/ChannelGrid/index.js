import React from "react";
import { Container, useMantineTheme, Group, Stack } from "@mantine/core";
import { Details } from "./details";
import { Functions } from "./functions";
import { Orders } from "./orders";
import { Metafields } from "./metafields";
import { Dangerous } from "./dangerous";
import { Webhooks } from "./webhooks";

export function ChannelGrid({
  id,
  name,
  type,
  domain,
  accessToken,
  searchProductsEndpoint,
  createPurchaseEndpoint,
  getWebhooksEndpoint,
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  metafields,
}) {
  const theme = useMantineTheme();

  return (
    <Container mt="xl" mb="xs" size="md" px="xs">
      {id && (
        <Stack>
          <Stack
            spacing="md"
            align="flex-start"
            sx={{
              [theme.fn.largerThan("md")]: { flexDirection: "row" },
            }}
          >
            <Stack sx={{ flex: 1, width: "100%" }}>
              <Details
                channelId={id}
                name={name}
                type={type}
                domain={domain}
                accessToken={accessToken}
              />
              <Metafields channelId={id} metafields={metafields} />
              <Functions
                channelId={id}
                searchProductsEndpoint={searchProductsEndpoint}
                createPurchaseEndpoint={createPurchaseEndpoint}
              />
              <Webhooks
                channelId={id}
                type={type}
                domain={domain}
                accessToken={accessToken}
                getWebhooksEndpoint={getWebhooksEndpoint}
                createWebhookEndpoint={createWebhookEndpoint}
                deleteWebhookEndpoint={deleteWebhookEndpoint}
              />
            </Stack>
            <Stack sx={{ flex: 1, width: "100%" }}>
              <Orders channelId={id} />
            </Stack>
          </Stack>
          <Dangerous channelId={id} name={name} />
        </Stack>
      )}
    </Container>
  );
}
