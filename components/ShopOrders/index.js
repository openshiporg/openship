import React, { useState } from "react";
import {
  Box,
  Button,
  Divider,
  Grid,
  Group,
  Input,
  Menu,
  NumberInput,
  Paper,
  SimpleGrid,
  Skeleton,
  Tabs,
  ActionIcon,
  Text,
  useMantineTheme,
  Container,
} from "@mantine/core";
import { Option } from "@primitives/option";
import { ArrowRightIcon, SearchIcon } from "@primer/octicons-react";
import Link from "next/link";
import { OrderList } from "./OrderList";
import { useSharedState } from "@lib/useSharedState";

export const ShopOrders = ({ shops }) => {
  const theme = useMantineTheme();

  const [selectedShop, setSelectedShop] = useState();
  const [searchEntry, setSearchEntry] = useState("");

  const [showModal, setShowModal] = useSharedState("createModal");

  const filteredShop =
    shops?.length > 0 && shops.filter(({ id }) => id === selectedShop)[0];

  const ShopSelect = ({ shops }) => {
    if (!shops)
      return (
        <Box
          sx={{
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <Text
            size="sm"
            weight={500}
            color={theme.colors.dark[3]}
            transform="uppercase"
            mb={6}
            ml={2}
          >
            Shops
          </Text>
          <Group dir="row" spacing={7}>
            <Skeleton height={24} width={60} radius="sm" />
            <Skeleton height={24} width={60} radius="sm" />
            <Skeleton height={24} width={60} radius="sm" />
          </Group>
        </Box>
      );
    if (shops.length === 0)
      return (
        <Box p="sm">
          <Button
            rightIcon={<ArrowRightIcon />}
            color="green"
            compact
            uppercase
            variant="light"
            onClick={() => setShowModal("Shop")}
          >
            Add first shop
          </Button>
        </Box>
      );
    return (
      <Option
        title="Shops"
        options={[{ name: "All", value: "" }, ...shops].map((a) => ({
          name: a.name,
          value: a.id,
        }))}
        update={(a) => setSelectedShop(a)}
        selected={selectedShop}
        color="green"
      />
    );
  };

  return (
    <Container mt="xl" mb="xs" size="md" px="xs">
      <Paper withBorder sx={{ overflow: "hidden", maxWidth: 500 }}>
        <Input
          sx={{ margin: 8 }}
          icon={<SearchIcon />}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              setSearchEntry(e.target.value);
            }
          }}
        />
        <Divider />
        <ShopSelect shops={shops} />
        {/* <Divider
          sx={{
            borderColor:
              theme.colorScheme === "light"
                ? theme.colors.blueGray[2]
                : theme.colors.dark[8],
          }}
        /> */}
        {filteredShop
          ? searchEntry && (
              <OrderList
                accessToken={filteredShop.accessToken}
                domain={filteredShop.domain}
                shopId={filteredShop.id}
                searchEntry={searchEntry}
                shopName={filteredShop.name}
                searchOrdersEndpoint={filteredShop.searchOrdersEndpoint}
                metafields={filteredShop.metafields}
              />
            )
          : searchEntry && (
              <>
                {shops.map((shop) => (
                  <>
                    <Box
                      sx={{
                        background:
                          theme.colorScheme === "light"
                            ? theme.colors.blueGray[0]
                            : theme.colors.dark[8],
                        borderTop: `1px solid ${
                          theme.colorScheme === "light"
                            ? theme.colors.blueGray[2]
                            : theme.colors.dark[8]
                        }`,
                        color:
                          theme.colorScheme === "light"
                            ? theme.colors.blueGray[7]
                            : theme.colors.dark[0],
                        paddingLeft: 10,
                        paddingRight: 10,
                        fontWeight: 600,
                      }}
                    >
                      {shop.name}
                    </Box>
                    <OrderList
                      accessToken={shop.accessToken}
                      domain={shop.domain}
                      shopId={shop.id}
                      searchEntry={searchEntry}
                      shopName={shop.name}
                      searchOrdersEndpoint={shop.searchOrdersEndpoint}
                      metafields={shop.metafields}
                    />
                  </>
                ))}
              </>
            )}
      </Paper>
    </Container>
  );
};
