import React, { useEffect, useState } from "react";
import {
  Input,
  Box,
  Group,
  Button,
  useMantineTheme,
  Skeleton,
  Text,
  Paper,
} from "@mantine/core";
import { Option } from "@primitives/option";
import { ProductList } from "./ProductList";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SearchIcon,
} from "@primer/octicons-react";
import { useSharedState } from "@lib/useSharedState";
import Link from "next/link";

const addFirstURL = {
  Channel: "/channels",
  Shop: "/shops",
};

export function ProductSearch({
  title,
  disabled,
  addToCart,
  options = [],
  optionName = "Channel",
  color,
  atcText,
  buttons,
  searchEntry,
  setSearchEntry,
}) {
  const theme = useMantineTheme();
  // const [selectedOption, setSelectedOption] = useState(options[0].id);
  const [selectedOption, setSelectedOption] = useSharedState(
    `${title}Options`,
    ""
  );

  const OptionSelect = ({ options }) => {
    if (!options)
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
            {optionName}S
          </Text>
          <Group dir="row" spacing={7}>
            <Skeleton height={24} width={60} radius="sm" />
            <Skeleton height={24} width={60} radius="sm" />
            <Skeleton height={24} width={60} radius="sm" />
          </Group>
        </Box>
      );
    if (options.length === 0)
      return (
        <Box
          sx={{
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          <Link href={addFirstURL[optionName]}>
            <Button
              rightIcon={<ArrowRightIcon />}
              color={color}
              compact
              uppercase
              variant="light"
            >
              Add first {optionName}
            </Button>
          </Link>
        </Box>
      );
    return (
      <Option
        title={`${optionName}S`}
        name={optionName}
        options={options.map((a) => ({ name: a.name, value: a.id }))}
        update={(a) => setSelectedOption(a)}
        selected={selectedOption}
        color={color}
      />
    );
  };

  useEffect(() => {
    if (!selectedOption) {
      setSelectedOption(options[0]?.id);
    }
  }, [options[0]?.id]);

  const [page, setPage] = useState(1);

  const filteredOption =
    options.length > 0 && options.filter(({ id }) => id === selectedOption)[0];

  return (
    <Paper
      sx={{
        // background:
        //   theme.colorScheme === "light"
        //     ? theme.white
        //     : theme.fn.darken(theme.colors.dark[9], 0.7),
        // border: `1px solid ${
        //   theme.colorScheme === "light"
        //     ? theme.colors.blueGray[2]
        //     : theme.colors.dark[8]
        // }`,
        paddingTop: 10,
        width: "100%",
        maxWidth: 500,
      }}
      withBorder
    >
      <Box>
        <Box sx={{ display: "flex", alignItems: "center" }} mx={10}>
          <Box
            sx={{
              display: "flex",
              border: `1px solid ${
                theme.colorScheme === "light"
                  ? theme.colors.blueGray[2]
                  : theme.colors.dark[8]
              }`,
              borderRadius: 5,
            }}
            mr={10}
          >
            <Button
              radius={5}
              sx={{
                height: 34,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                paddingLeft: 10,
                paddingRight: 10,
                borderRight: `1px solid ${
                  theme.colorScheme === "light"
                    ? theme.colors.blueGray[2]
                    : theme.colors.dark[8]
                }`,
              }}
              color="blueGray"
              variant="light"
              // compact
              // size="xs"
            >
              <ArrowLeftIcon />
            </Button>

            <Button
              sx={{
                height: 34,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                paddingLeft: 10,
                paddingRight: 10,
              }}
              color="blueGray"
              variant="light"
              radius={5}
              // compact
              // size="xs"
            >
              <ArrowRightIcon />
            </Button>
          </Box>
          <Box sx={{ width: "100%" }}>
            <Input
              icon={<SearchIcon />}
              defaultValue={searchEntry}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  setSearchEntry(e.target.value);
                }
              }}
              styles={{ input: { minHeight: 36, height: 36 } }}
            />
          </Box>
        </Box>
        <Box>
          {/* <Option
            name={optionName}
            options={options.map((a) => ({ name: a.name, value: a.id }))}
            update={(a) => setSelectedOption(a)}
            selected={selectedOption}
            color={color}
          /> */}
          <OptionSelect options={options} />
        </Box>
      </Box>
      <Box sx={{ maxHeight: 450, overflow: "scroll" }}>
        {filteredOption && searchEntry && (
          <ProductList
            accessToken={filteredOption.accessToken}
            domain={filteredOption.domain}
            searchProductsEndpoint={filteredOption.searchProductsEndpoint}
            updateProductEndpoint={filteredOption.updateProductEndpoint}
            optionId={filteredOption.id}
            optionName={filteredOption.name}
            disabled={disabled}
            addToCart={addToCart}
            atcText={atcText}
            searchEntry={searchEntry}
            buttons={buttons}
          />
        )}
      </Box>
    </Paper>
  );
}
