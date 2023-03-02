import React, { useState } from "react";
import { useForm, formList } from "@mantine/form";
import {
  TextInput,
  Button,
  Text,
  useMantineTheme,
  Box,
  Select,
  Group,
  Tooltip,
  Modal,
  Paper,
  Collapse,
  Stack,
  Code,
  Avatar,
  Loader,
  Divider,
} from "@mantine/core";
import useSWR, { mutate } from "swr";
import { request } from "graphql-request";
import { GET_MATCH_QUERY } from "@graphql/matches";

export const FindMatch = ({ input }) => {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);

  const fil = input.map(({ variantId, productId, quantity }) => ({
    variantId: { equals: variantId },
    productId: { equals: productId },
    quantity: { equals: quantity },
  }));

  const { data, error } = useSWR(
    [
      GET_MATCH_QUERY,
      JSON.stringify({
        input: fil,
      }),
    ],
    (query, variables) => request("/api/graphql", query, JSON.parse(variables))
  );

  return (
    <Paper
      pt={5}
      withBorder
      mt="sm"
      sx={{
        maxHeight: 200,
        overflow: "auto",
        background:
          theme.colorScheme === "dark"
            ? theme.colors.dark[6]
            : theme.fn.lighten(theme.colors.blueGray[1], 0.5),
      }}
    >
      <Group mb={5} px="xs">
        <Text
          weight={500}
          sx={{
            color: theme.colors.blueGray[theme.colorScheme === "dark" ? 2 : 6],
            fontSize: theme.fontSizes.sm,
          }}
        >
          {!data ? (
            <>
              <Loader size={14} mr="sm" mb={3} variant="dots" />
              Checking for matches
            </>
          ) : (
            `${data.getMatch.length} match${
              data.getMatch.length > 1 ? "es" : ""
            } found`
          )}
        </Text>
        <Button
          size="xs"
          compact
          ml="auto"
          variant="light"
          color="gray"
          onClick={() => setOpened((o) => !o)}
        >
          {opened ? "Hide" : "Show"}
        </Button>
      </Group>
      <Divider />
      <Collapse in={opened} transitionTimingFunction="linear">
        <Paper
          pt={5}
          m="xs"
          withBorder
          sx={{
            background:
              theme.colorScheme === "dark"
                ? theme.colors.dark[7]
                : theme.fn.lighten(theme.colors.violet[0], 0.5),
          }}
        >
          <Text
            weight={500}
            sx={{
              color: theme.colors.violet[theme.colorScheme === "dark" ? 2 : 9],
              fontSize: theme.fontSizes.xs,
            }}
            px={8}
            pb={4}
          >
            Match
          </Text>
          <Stack spacing={8} pb={10} sx={{ width: "100%" }}>
            {input?.map(
              (
                {
                  title,
                  image,
                  price,
                  quantity = 1,
                  productId,
                  variantId,
                  shopName,
                },
                index
              ) => (
                <MatchItem
                  name={title}
                  image={image}
                  productId={productId}
                  price={price}
                  quantity={quantity}
                  variantId={variantId}
                  platformName={shopName}
                />
              )
            )}
            <Divider />
            {data?.getMatch?.map(
              (
                {
                  name,
                  image,
                  price,
                  quantity = 1,
                  productId,
                  variantId,
                  channelName,
                },
                index
              ) => (
                <MatchItem
                  name={name}
                  image={image}
                  productId={productId}
                  price={price}
                  quantity={quantity}
                  variantId={variantId}
                  platformName={channelName}
                />
              )
            )}
          </Stack>
        </Paper>
      </Collapse>
    </Paper>
  );
};

function MatchItem({
  image,
  name,
  productId,
  variantId,
  price,
  quantity,
  platformName,
}) {
  const theme = useMantineTheme();

  return (
    <Box px={8}>
      <Paper withBorder shadow="xs" p="xs">
        <Group noWrap>
          <Avatar src={image} />

          <Stack spacing={0} sx={{ flex: 1 }}>
            <Text sx={{ fontSize: 10 }} color="dimmed" weight={600}>
              {platformName}
            </Text>
            <Text sx={{ fontSize: 12 }}>{name}</Text>
            <Text sx={{ fontSize: 11 }} color="dimmed">
              {productId} | {variantId}
            </Text>
            <Group
              align="center"
              mt={0}
              spacing="xs"
              sx={{ justifyContent: "space-between" }}
            >
              <Group spacing={6}>
                <Text
                  sx={{ fontSize: 13 }}
                  color={
                    theme.colorScheme === "light"
                      ? theme.colors.green[9]
                      : theme.colors.green[6]
                  }
                  weight={600}
                >
                  ${(price * quantity).toFixed(2)}
                </Text>
                {quantity > 1 && (
                  <Box>
                    <Text size="sm" color={theme.colors.dark[3]}>
                      (${price} x {quantity})
                    </Text>
                  </Box>
                )}
              </Group>
            </Group>
          </Stack>
        </Group>
      </Paper>
    </Box>
  );
}
