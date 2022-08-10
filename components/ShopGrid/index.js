import React from "react";
import { Container, useMantineTheme, Group, Stack } from "@mantine/core";
import { Details } from "./details";
import { Functions } from "./functions";
import { Orders } from "./orders";
import { Dangerous } from "./dangerous";
import { Links } from "./links";
import { Webhooks } from "./webhooks";

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
  links,
}) {
  const theme = useMantineTheme();

  return (
    <Container mt="xl" mb="xs" size="md" px="xs">
      {id && (
        <Stack
          spacing="md"
          align="flex-start"
          sx={{
            [theme.fn.largerThan("md")]: { flexDirection: "row" },
          }}
        >
          <Stack sx={{ flex: 1, width: "100%" }}>
            <Details
              shopId={id}
              name={name}
              type={type}
              domain={domain}
              accessToken={accessToken}
              channelData={channelData}
            />
            <Links shopId={id} links={links} channelData={channelData} />
            <Functions
              shopId={id}
              searchOrdersEndpoint={searchOrdersEndpoint}
              searchProductsEndpoint={searchProductsEndpoint}
              updateProductEndpoint={updateProductEndpoint}
            />
            <Webhooks
              shopId={id}
              type={type}
              domain={domain}
              accessToken={accessToken}
              getWebhooksEndpoint={getWebhooksEndpoint}
              createWebhookEndpoint={createWebhookEndpoint}
              deleteWebhookEndpoint={deleteWebhookEndpoint}
            />
            <Dangerous shopId={id} name={name} />
          </Stack>
          <Stack sx={{ flex: 1, width: "100%" }}>
            <Orders shopId={id} />
          </Stack>
        </Stack>
      )}
    </Container>
  );
}
